from fastapi import APIRouter, HTTPException
from typing import List
import httpx

router = APIRouter()


@router.get("/{backend}")
async def get_models(backend: str):
    """Get available models for a backend"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if backend == "ollama-default":
                response = await client.get("http://127.0.0.1:11434/api/tags")
                if response.status_code == 200:
                    models = [model["name"] for model in response.json().get("models", [])]
                    return {"models": models}
                    
            elif backend == "lmstudio-default":
                response = await client.get("http://127.0.0.1:1234/v1/models")
                if response.status_code == 200:
                    models = [model["id"] for model in response.json().get("data", [])]
                    return {"models": models}
                    
            else:
                return {"models": []}
            
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail=f"Cannot connect to {backend}. Make sure the service is running.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
