from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import chromadb
import torch
import os
from datetime import datetime
from pathlib import Path
from pypdf import PdfReader
import docx


class RAGService:
    """Service for Retrieval-Augmented Generation"""

    _instance: Optional["RAGService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once
        if hasattr(self, "_initialized"):
            return

        self._initialized = True

        # Auto-detect device (GPU if available, otherwise CPU)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.embedding_model = SentenceTransformer(
            "nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True, device=device
        )
        print(f"RAG Service initialized - Using device: {device}")
        if device == "cuda":
            print(f"GPU: {torch.cuda.get_device_name(0)}")

        self.chroma_client = chromadb.PersistentClient(path="./vector_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )

        # Will be set when database_service imports this
        self.db_service = None

    def set_db_service(self, db_service):
        """Set database service for MongoDB storage"""
        self.db_service = db_service

    async def add_document(self, file_path: str, file_id: str, session_id: str) -> int:
        """
        Process a document, create chunks, generate embeddings, and store in MongoDB

        Args:
            file_path: Path to the uploaded file
            file_id: Unique identifier for the file
            session_id: Session ID this file belongs to

        Returns:
            Number of chunks created
        """
        # Extract text from file
        text = self._extract_text(file_path)
        if not text:
            return 0

        # Split into chunks
        chunks = self._split_text(text)

        # Generate embeddings and store in MongoDB
        filename = os.path.basename(file_path)
        chunks_created = 0

        for i, chunk_text in enumerate(chunks):
            # Generate embedding
            embedding = self.embedding_model.encode(chunk_text).tolist()

            # Create document for MongoDB
            doc = {
                "file_id": file_id,
                "session_id": session_id,
                "chunk_text": chunk_text,
                "chunk_index": i,
                "embedding": embedding,
                "metadata": {
                    "source": filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                },
                "created_at": datetime.utcnow(),
            }

            # Store in MongoDB
            if self.db_service:
                await self.db_service.knowledge_base.insert_one(doc)

            # Also store in ChromaDB for backward compatibility
            self.collection.add(
                ids=[f"{file_id}_{i}"],
                embeddings=[embedding],
                documents=[chunk_text],
                metadatas=[
                    {
                        "file_id": file_id,
                        "session_id": session_id,
                        "filename": filename,
                        "chunk_index": i,
                    }
                ],
            )

            chunks_created += 1

        return chunks_created

    def _extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        file_ext = Path(file_path).suffix.lower()

        try:
            if file_ext == ".pdf":
                return self._extract_from_pdf(file_path)
            elif file_ext == ".docx":
                return self._extract_from_docx(file_path)
            elif file_ext == ".txt":
                return self._extract_from_txt(file_path)
            else:
                # Try as text file
                return self._extract_from_txt(file_path)
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return ""

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        with open(file_path, "rb") as file:
            pdf_reader = PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = docx.Document(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])

    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT"""
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()

    def _split_text(
        self, text: str, chunk_size: int = 512, overlap: int = 50
    ) -> List[str]:
        """
        Split text into chunks with overlap

        Args:
            text: Text to split
            chunk_size: Number of characters per chunk
            overlap: Number of characters to overlap between chunks

        Returns:
            List of text chunks
        """
        chunks = []
        words = text.split()

        current_chunk = []
        current_size = 0

        for word in words:
            word_size = len(word) + 1  # +1 for space

            if current_size + word_size > chunk_size and current_chunk:
                # Save current chunk
                chunks.append(" ".join(current_chunk))

                # Start new chunk with overlap
                overlap_words = int(len(current_chunk) * (overlap / chunk_size))
                current_chunk = (
                    current_chunk[-overlap_words:] if overlap_words > 0 else []
                )
                current_size = sum(len(w) + 1 for w in current_chunk)

            current_chunk.append(word)
            current_size += word_size

        # Add final chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    async def query(
        self, query: str, file_ids: List[str] = None, top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Query the RAG system for relevant chunks"""

        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Build filter if file_ids provided
        where_filter = None
        if file_ids:
            where_filter = {"file_id": {"$in": file_ids}}

        # Query vector database
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
        )

        # Format results
        chunks = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                chunks.append(
                    {
                        "id": results["ids"][0][i],
                        "content": doc,
                        "similarity": 1
                        - results["distances"][0][i],  # Convert distance to similarity
                        "source": results["metadatas"][0][i].get("filename", "Unknown"),
                        "metadata": results["metadatas"][0][i],
                    }
                )

        return chunks
