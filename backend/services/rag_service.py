"""
Unified Retrieval-Augmented Generation service.

This is the single, session-aware document pipeline (it replaces the old
``DocumentProcessor`` + the dual-write ``RAGService``). Design decisions:

* **ChromaDB is the only vector store.** Chunks were previously written to both
  ChromaDB and MongoDB but only ever read back from ChromaDB, so the Mongo copy
  was write-only dead weight. We drop it.
* **Session/file scoped.** Every chunk carries ``session_id`` and ``file_id`` in
  its metadata so :meth:`query` can filter to the files a session owns.
* **Device auto-detect.** GPU when available, CPU otherwise (the old
  ``DocumentProcessor`` hardcoded ``device="cuda"`` and crashed on CPU hosts).
* **Lazy model load.** The embedding model is heavy; we load it on first use so
  importing this module (and the lighter chat/session paths) stays cheap.
"""

from __future__ import annotations

import csv
import gc
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import chromadb

from config import settings

logger = logging.getLogger(__name__)

EMBED_MODEL = "nomic-ai/nomic-embed-text-v1.5"
COLLECTION_NAME = "documents"
TEXT_EXTS = {".pdf", ".docx", ".txt", ".csv", ".md"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


class RAGService:
    """Singleton RAG pipeline backed by a persistent ChromaDB collection."""

    _instance: Optional["RAGService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._initialized = True

        self._embedding_model = None  # lazy
        self._device: Optional[str] = None
        self.batch_size = 16

        self.chroma_client = chromadb.PersistentClient(path=settings.vector_db_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
        )
        self.tesseract_available = self._check_tesseract()
        if not self.tesseract_available:
            logger.warning("Tesseract OCR unavailable — image text extraction limited")

    # ── lazy embedding model ──────────────────────────────────────────────────

    @property
    def embedding_model(self):
        if self._embedding_model is None:
            import torch
            from sentence_transformers import SentenceTransformer

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("Loading embedding model on device=%s", self._device)
            self._embedding_model = SentenceTransformer(
                EMBED_MODEL, trust_remote_code=True, device=self._device
            )
            if self._device == "cuda":
                torch.cuda.empty_cache()
        return self._embedding_model

    @staticmethod
    def _check_tesseract() -> bool:
        try:
            import pytesseract

            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    # ── ingestion ─────────────────────────────────────────────────────────────

    async def add_document(self, file_path: str, file_id: str, session_id: str) -> int:
        """Extract, chunk, embed, and store a document. Returns chunk count."""
        text = self._extract_text(file_path)
        if not text or not text.strip():
            logger.warning("No text extracted from %s", file_path)
            return 0

        chunks = self._chunk_text(text)
        if not chunks:
            return 0

        filename = os.path.basename(file_path)
        embeddings = self._embed_batched(chunks)

        self.collection.add(
            ids=[f"{file_id}_{i}" for i in range(len(chunks))],
            embeddings=embeddings,
            documents=chunks,
            metadatas=[
                {
                    "file_id": file_id,
                    "session_id": session_id,
                    "filename": filename,
                    "chunk_index": i,
                }
                for i in range(len(chunks))
            ],
        )
        logger.info("Embedded %d chunks for %s (session %s)", len(chunks), filename, session_id)
        return len(chunks)

    def _embed_batched(self, chunks: List[str]) -> List[List[float]]:
        """Embed chunks in batches, clearing GPU memory between batches."""
        embeddings: List[List[float]] = []
        for i in range(0, len(chunks), self.batch_size):
            batch = chunks[i : i + self.batch_size]
            try:
                embeddings.extend(self.embedding_model.encode(batch).tolist())
            except RuntimeError as exc:
                if "out of memory" not in str(exc).lower():
                    raise
                logger.warning("GPU OOM on batch %d; retrying smaller", i // self.batch_size)
                self._free_gpu()
                for one in batch:
                    embeddings.append(self.embedding_model.encode(one).tolist())
            self._free_gpu()
        return embeddings

    def _free_gpu(self) -> None:
        if self._device == "cuda":
            import torch

            torch.cuda.empty_cache()
        gc.collect()

    async def delete_file(self, file_id: str) -> int:
        """Remove all chunks for a file. Returns number of vectors deleted."""
        existing = self.collection.get(where={"file_id": file_id})
        ids = existing.get("ids", [])
        if ids:
            self.collection.delete(ids=ids)
        return len(ids)

    # ── retrieval ─────────────────────────────────────────────────────────────

    async def query(
        self, query: str, file_ids: Optional[List[str]] = None, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Return the top-k most relevant chunks, optionally scoped to file_ids."""
        query_embedding = self.embedding_model.encode(query).tolist()
        where_filter = {"file_id": {"$in": file_ids}} if file_ids else None

        results = self.collection.query(
            query_embeddings=[query_embedding], n_results=top_k, where=where_filter
        )

        documents = results.get("documents") or [[]]
        if not documents or not documents[0]:
            return []

        chunks: List[Dict[str, Any]] = []
        for i, doc in enumerate(documents[0]):
            metadata = results["metadatas"][0][i]
            chunks.append(
                {
                    "id": results["ids"][0][i],
                    "content": doc,
                    "similarity": 1 - results["distances"][0][i],
                    "source": metadata.get("filename", "Unknown"),
                    "metadata": metadata,
                }
            )
        return chunks

    # ── text extraction ───────────────────────────────────────────────────────

    def _extract_text(self, file_path: str) -> str:
        ext = Path(file_path).suffix.lower()
        try:
            if ext == ".pdf":
                return self._extract_pdf(file_path)
            if ext == ".docx":
                return self._extract_docx(file_path)
            if ext == ".csv":
                return self._extract_csv(file_path)
            if ext in IMAGE_EXTS:
                return self._extract_image_text(file_path)
            # .txt, .md, and unknown text-like files
            return self._extract_txt(file_path)
        except Exception as exc:
            logger.error("Text extraction failed for %s: %s", file_path, exc)
            return ""

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        import docx

        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text)

    @staticmethod
    def _extract_txt(file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    @staticmethod
    def _extract_csv(file_path: str, row_cap: int = 1000) -> str:
        lines: List[str] = []
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, 1):
                if idx > row_cap:
                    lines.append(f"... (truncated at {row_cap} rows)")
                    break
                lines.append(
                    f"Row {idx}: " + " | ".join(f"{k}: {v}" for k, v in row.items())
                )
        return "\n".join(lines)

    def _extract_image_text(self, file_path: str) -> str:
        from PIL import Image

        filename = os.path.basename(file_path)
        image = Image.open(file_path)
        if self.tesseract_available:
            try:
                import pytesseract

                text = pytesseract.image_to_string(image)
                if text.strip():
                    return text
            except Exception as exc:
                logger.error("OCR failed for %s: %s", filename, exc)
        w, h = image.size
        return f"Image: {filename}\nDimensions: {w}x{h}px\nFormat: {image.format or 'Unknown'}"

    # ── chunking ──────────────────────────────────────────────────────────────

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split into overlapping word-windows of ~chunk_size words."""
        words = text.split()
        if not words:
            return []
        step = max(1, chunk_size - overlap)
        return [
            " ".join(words[i : i + chunk_size]) for i in range(0, len(words), step)
        ]
