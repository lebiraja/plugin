"""
Global (session-less) file endpoints.

Most uploads flow through ``/api/sessions/{id}/upload`` so files are scoped to a
session. This router handles unscoped uploads, storing them under a sentinel
``GLOBAL`` bucket in the same unified RAG pipeline so there is exactly one
ingestion path and one vector store.
"""

import logging
import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, UploadFile

from config import settings
from dependencies import get_rag_service
from errors import AppError, ValidationError
from services.rag_service import RAGService

logger = logging.getLogger(__name__)

router = APIRouter()

GLOBAL_BUCKET = "GLOBAL"
UPLOAD_DIR = Path(settings.upload_dir) / GLOBAL_BUCKET


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), rag: RAGService = Depends(get_rag_service)
):
    """Upload and embed a file into the global bucket."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_id = str(uuid.uuid4())
    extension = Path(file.filename or "").suffix
    file_path = UPLOAD_DIR / f"{file_id}{extension}"

    content = await file.read()
    if len(content) > settings.max_file_size:
        raise ValidationError(
            f"File exceeds the {settings.max_file_size // (1024 * 1024)}MB limit."
        )

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    chunks = await rag.add_document(str(file_path), file_id, GLOBAL_BUCKET)
    logger.info("Global upload %s: %d chunks", file.filename, chunks)

    return {
        "fileId": file_id,
        "name": file.filename,
        "size": len(content),
        "processed": chunks > 0,
        "chunks": chunks,
    }


@router.delete("/{file_id}")
async def delete_file(file_id: str, rag: RAGService = Depends(get_rag_service)):
    """Delete a global file and its vectors."""
    for path in UPLOAD_DIR.glob(f"{file_id}.*"):
        try:
            os.remove(path)
        except OSError as exc:
            logger.warning("Failed to remove %s: %s", path, exc)
    deleted = await rag.delete_file(file_id)
    return {"success": True, "vectors_deleted": deleted}


@router.get("/")
async def list_files():
    """List files in the global bucket."""
    if not UPLOAD_DIR.exists():
        return {"files": []}
    files = [
        {"fileId": p.stem, "name": p.name, "size": p.stat().st_size}
        for p in UPLOAD_DIR.iterdir()
        if p.is_file()
    ]
    return {"files": files}
