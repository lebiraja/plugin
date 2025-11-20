from fastapi import APIRouter, HTTPException
from typing import List
import requests

router = APIRouter()


@router.get("/{backend}")
async def get_models(backend: str):
    """Get available models for a backend"""
    try:
        if backend == "ollama-default":
            response = requests.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                models = [model["name"] for model in response.json().get("models", [])]
                return {"models": models}
                
        elif backend == "lmstudio-default":
            response = requests.get("http://localhost:1234/v1/models")
            if response.status_code == 200:
                models = [model["id"] for model in response.json().get("data", [])]
                return {"models": models}
                
        else:
            return {"models": []}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
