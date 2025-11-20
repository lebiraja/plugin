from typing import List, Dict, Any
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
from docx import Document as DocxDocument
from PIL import Image
import pytesseract


class DocumentProcessor:
    """Service for processing and storing documents"""

    def __init__(self):
        self.embedding_model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
        self.chroma_client = chromadb.PersistentClient(path="./vector_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )

    async def process_file(self, file_path: str, filename: str) -> List[Dict[str, Any]]:
        """Process a file and store it in the vector database"""
        file_ext = Path(file_path).suffix.lower()

        # Extract text based on file type
        try:
            if file_ext == ".pdf":
                text = await self._extract_pdf(file_path)
            elif file_ext == ".docx":
                text = await self._extract_docx(file_path)
            elif file_ext == ".txt":
                text = await self._extract_txt(file_path)
            elif file_ext in [".jpg", ".jpeg", ".png"]:
                text = await self._extract_image_text(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_ext}")
        except Exception as e:
            raise ValueError(f"Failed to extract text from {filename}: {str(e)}")

        if not text or not text.strip():
            raise ValueError(f"No text content extracted from {filename}")

        # Split into chunks
        chunks = self._chunk_text(text)

        # Generate embeddings and store
        file_id = Path(file_path).stem
        embeddings = self.embedding_model.encode(chunks).tolist()

        self.collection.add(
            ids=[f"{file_id}_{i}" for i in range(len(chunks))],
            embeddings=embeddings,
            documents=chunks,
            metadatas=[
                {"file_id": file_id, "filename": filename, "chunk_index": i}
                for i in range(len(chunks))
            ],
        )

        return [{"content": chunk, "index": i} for i, chunk in enumerate(chunks)]

    async def delete_file(self, file_id: str):
        """Delete all chunks for a file from the vector database"""
        # Query all documents with this file_id
        results = self.collection.get(where={"file_id": file_id})
        if results["ids"]:
            self.collection.delete(ids=results["ids"])

    async def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text

    async def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = DocxDocument(file_path)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])

    async def _extract_txt(self, file_path: str) -> str:
        """Extract text from TXT"""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    async def _extract_image_text(self, file_path: str) -> str:
        """Extract text from image using OCR"""
        image = Image.open(file_path)
        return pytesseract.image_to_string(image)

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
            
        return chunks
