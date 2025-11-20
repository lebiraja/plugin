from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import uuid
import aiofiles
import os
from pathlib import Path

from services.document_processor import DocumentProcessor

router = APIRouter()
document_processor = DocumentProcessor()

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a file"""
    try:
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        file_path = UPLOAD_DIR / f"{file_id}{file_extension}"
        
        print(f"Processing file upload: {file.filename} ({file_extension})")

        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
        
        print(f"File saved to: {file_path}, size: {len(content)} bytes")

        # Process file
        chunks = await document_processor.process_file(str(file_path), file.filename)
        
        print(f"File processed successfully: {len(chunks)} chunks created")

        return {
            "fileId": file_id,
            "name": file.filename,
            "size": len(content),
            "processed": True,
            "chunks": len(chunks),
        }
    except Exception as e:
        print(f"File upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    try:
        # Find and delete file
        for file_path in UPLOAD_DIR.glob(f"{file_id}.*"):
            os.remove(file_path)
            
        # Remove from vector DB
        await document_processor.delete_file(file_id)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_files():
    """List all uploaded files"""
    files = []
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            files.append({
                "fileId": file_path.stem,
                "name": file_path.name,
                "size": file_path.stat().st_size,
            })
    
    return {"files": files}
