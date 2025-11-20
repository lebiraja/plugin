from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import chromadb


class RAGService:
    """Service for Retrieval-Augmented Generation"""

    def __init__(self):
        self.embedding_model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
        self.chroma_client = chromadb.PersistentClient(path="./vector_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"},
        )

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
                chunks.append({
                    "id": results["ids"][0][i],
                    "content": doc,
                    "similarity": 1 - results["distances"][0][i],  # Convert distance to similarity
                    "source": results["metadatas"][0][i].get("filename", "Unknown"),
                    "metadata": results["metadatas"][0][i],
                })

        return chunks
