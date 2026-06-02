# Complete Project Refactor & Improvement Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to transform the current codebase into a production-ready, scalable, and maintainable system. The plan addresses architecture, code quality, error handling, performance, and developer experience.

---

## Current State Analysis

### ✅ What Works

- Basic chat functionality with Ollama/LM Studio
- File upload and processing (PDF, DOCX, TXT, Images)
- RAG (Retrieval Augmented Generation) pipeline
- Web search integration (Serper.dev)
- Vector storage with ChromaDB
- React + TypeScript frontend with Zustand
- FastAPI backend with proper CORS

### ❌ Critical Issues Identified

#### Backend Issues

1. **307 Redirect Problem**: `/api/chat` redirects to `/api/chat/` - FastAPI trailing slash issue
2. **Telemetry Errors**: `capture() takes 1 positional argument but 3 were given`
3. **Torchvision Warnings**: Image extension warnings polluting logs
4. **No Error Boundaries**: Crashes propagate without graceful handling
5. **No Async Consistency**: Mix of sync/async code
6. **Missing Health Checks**: No LLM backend availability detection
7. **No Rate Limiting**: Tool abuse possible
8. **Poor Logging**: Insufficient structured logging
9. **CSV Support**: Not properly handled
10. **Tesseract Dependency**: Hard dependency, no fallback

#### Frontend Issues

1. **ECONNREFUSED Errors**: No backend availability detection
2. **No Retry Logic**: API calls fail immediately
3. **Poor Error UX**: No user-friendly error messages
4. **No Loading States**: Unclear when operations are in progress
5. **State Management**: Incomplete Zustand implementation
6. **No Offline Detection**: Frontend doesn't detect backend status
7. **Component Coupling**: High coupling between components
8. **No Request Cancellation**: Long requests can't be cancelled

#### Architecture Issues

1. **Poor Separation of Concerns**: Business logic mixed with routing
2. **No Dependency Injection**: Hard-coded dependencies
3. **No Testing**: Zero unit or integration tests
4. **No Documentation**: Minimal inline documentation
5. **Inconsistent Error Handling**: Different error patterns across modules
6. **No Environment Management**: `.env` not fully utilized
7. **Monolithic Services**: Large service classes doing too much

---

## Improvement Plan

### Phase 1: Critical Fixes (Immediate)

#### 1.1 Fix 307 Redirect Issue

**Problem**: FastAPI redirects `/api/chat` to `/api/chat/`

**Solution**:

```python
# backend/main.py
# Change from:
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# To:
app.include_router(chat.router, prefix="/api/chat", tags=["chat"], include_in_schema=True)

# AND in backend/routers/chat.py
# Change from:
@router.post("/", response_model=ChatResponse)

# To:
@router.post("", response_model=ChatResponse)  # Empty string instead of "/"
```

#### 1.2 Fix Telemetry Errors

**Problem**: Telemetry capture errors spamming logs

**Solution**:

```python
# backend/main.py - Add at top
import warnings
import logging

# Disable unnecessary warnings
warnings.filterwarnings("ignore", category=UserWarning, module="torchvision")
warnings.filterwarnings("ignore", message=".*telemetry.*")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
```

#### 1.3 Add Backend Health Check

**Solution**: Create comprehensive health check system

#### 1.4 Fix Frontend Backend Detection

**Solution**: Add connection retry logic and offline detection

### Phase 2: Architecture Refactoring

#### 2.1 New Folder Structure

**Backend:**

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── config.py            # Settings management
│   ├── dependencies.py      # Dependency injection
│   │
│   ├── api/                 # API layer
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── files.py
│   │   │   ├── models.py
│   │   │   ├── tools.py
│   │   │   ├── health.py
│   │   │   └── rag.py
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── error_handler.py
│   │       ├── rate_limiter.py
│   │       └── logging.py
│   │
│   ├── core/                # Core business logic
│   │   ├── __init__.py
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── ollama.py
│   │   │   ├── lmstudio.py
│   │   │   └── factory.py
│   │   ├── embeddings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── sentence_transformer.py
│   │   ├── vectorstore/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── chroma.py
│   │   └── search/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       └── serper.py
│   │
│   ├── services/            # Application services
│   │   ├── __init__.py
│   │   ├── chat_service.py
│   │   ├── file_service.py
│   │   ├── rag_service.py
│   │   └── tool_service.py
│   │
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── chat.py
│   │   ├── file.py
│   │   ├── rag.py
│   │   └── tool.py
│   │
│   └── utils/               # Utilities
│       ├── __init__.py
│       ├── file_processor.py
│       ├── text_chunker.py
│       ├── logger.py
│       └── validators.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
│
├── logs/
├── uploads/
├── vector_db/
├── .env
├── .env.example
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
└── alembic.ini
```

**Frontend:**

```
src/
├── api/                     # API client layer
│   ├── client.ts            # Axios instance with interceptors
│   ├── chat.ts
│   ├── files.ts
│   ├── models.ts
│   ├── tools.ts
│   └── types.ts
│
├── components/              # React components
│   ├── common/              # Shared components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   ├── sidebar/
│   │   ├── LeftSidebar.tsx
│   │   └── RightSidebar.tsx
│   └── settings/
│       └── SettingsModal.tsx
│
├── hooks/                   # Custom React hooks
│   ├── useChat.ts
│   ├── useFiles.ts
│   ├── useModels.ts
│   ├── useBackendStatus.ts
│   └── useDebounce.ts
│
├── store/                   # Zustand stores
│   ├── chatStore.ts
│   ├── fileStore.ts
│   ├── settingsStore.ts
│   └── uiStore.ts
│
├── lib/                     # Utilities
│   ├── utils.ts
│   ├── constants.ts
│   └── formatters.ts
│
├── types/                   # TypeScript types
│   └── index.ts
│
├── App.tsx
└── main.tsx
```

### Phase 3: Core Improvements

#### 3.1 Implement Proper Error Handling

**Backend Error Handler:**

```python
# app/api/middleware/error_handler.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail, "type": "http_error"}
        )
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "type": "server_error"}
        )
```

**Frontend Error Boundary:**

```typescript
// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-container">
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

#### 3.2 Implement Retry Logic & Backend Detection

```typescript
// src/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

// Retry interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number };

    if (!config) return Promise.reject(error);

    // Initialize retry count
    config._retry = config._retry || 0;

    // Retry on network errors or 5xx errors
    const shouldRetry =
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600);

    if (shouldRetry && config._retry < MAX_RETRIES) {
      config._retry += 1;

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config._retry - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// Backend status hook
// src/hooks/useBackendStatus.ts
import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

export function useBackendStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await apiClient.get("/health");
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  return { isOnline, isChecking };
}
```

#### 3.3 Fix Document Processing (CSV, Tesseract)

```python
# app/core/document_processing/extractors.py
from abc import ABC, abstractmethod
from typing import Optional
import csv
import logging

logger = logging.getLogger(__name__)

class TextExtractor(ABC):
    @abstractmethod
    async def extract(self, file_path: str) -> str:
        pass

class CSVExtractor(TextExtractor):
    """Extract and format CSV data as readable text"""

    async def extract(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                lines = []

                for idx, row in enumerate(reader, 1):
                    if idx > 1000:  # Limit rows
                        lines.append(f"... (truncated, {idx} total rows)")
                        break

                    row_text = " | ".join(f"{k}: {v}" for k, v in row.items())
                    lines.append(f"Row {idx}: {row_text}")

                return "\n".join(lines)
        except Exception as e:
            logger.error(f"CSV extraction failed: {e}")
            raise ValueError(f"Failed to process CSV file: {str(e)}")

class ImageExtractor(TextExtractor):
    """Extract text from images with Tesseract fallback"""

    def __init__(self):
        self.tesseract_available = self._check_tesseract()

    def _check_tesseract(self) -> bool:
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            logger.warning("Tesseract not available, OCR disabled")
            return False

    async def extract(self, file_path: str) -> str:
        from PIL import Image

        if not self.tesseract_available:
            # Fallback: return image metadata
            try:
                image = Image.open(file_path)
                return f"Image file: {image.format}, Size: {image.size[0]}x{image.size[1]}px (OCR not available)"
            except Exception as e:
                raise ValueError(f"Failed to process image: {str(e)}")

        # Try OCR
        try:
            import pytesseract
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text if text.strip() else "No text detected in image"
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            raise ValueError(f"Failed to extract text from image: {str(e)}")
```

### Phase 4: Performance Optimizations

#### 4.1 Add Caching Layer

```python
# app/core/cache/redis_cache.py
from typing import Optional, Any
import json
from functools import wraps

class CacheService:
    """Simple in-memory cache (upgrade to Redis for production)"""

    def __init__(self):
        self._cache = {}
        self._ttl = {}

    def get(self, key: str) -> Optional[Any]:
        import time
        if key in self._cache:
            if key in self._ttl and time.time() > self._ttl[key]:
                del self._cache[key]
                del self._ttl[key]
                return None
            return self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300):
        import time
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl

def cached(ttl: int = 300):
    """Decorator for caching function results"""
    def decorator(func):
        cache = {}

        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            if key in cache:
                return cache[key]

            result = await func(*args, **kwargs)
            cache[key] = result

            return result

        return wrapper
    return decorator
```

#### 4.2 Add Background Task Queue

```python
# app/core/tasks/queue.py
from fastapi import BackgroundTasks
import asyncio
from typing import Callable, Any

class TaskQueue:
    """Simple background task queue"""

    def __init__(self):
        self._queue = asyncio.Queue()
        self._workers = []

    async def add_task(self, func: Callable, *args, **kwargs):
        await self._queue.put((func, args, kwargs))

    async def worker(self):
        while True:
            func, args, kwargs = await self._queue.get()
            try:
                if asyncio.iscoroutinefunction(func):
                    await func(*args, **kwargs)
                else:
                    func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Task failed: {e}")
            finally:
                self._queue.task_done()
```

### Phase 5: Testing Infrastructure

#### 5.1 Unit Tests

```python
# tests/unit/test_chat_service.py
import pytest
from app.services.chat_service import ChatService

@pytest.fixture
def chat_service():
    return ChatService()

@pytest.mark.asyncio
async def test_send_message_success(chat_service):
    response = await chat_service.generate_response(
        message="Hello",
        backend="ollama-default",
        model="llama2",
        config={}
    )

    assert response is not None
    assert "content" in response

@pytest.mark.asyncio
async def test_send_message_invalid_backend(chat_service):
    with pytest.raises(ValueError):
        await chat_service.generate_response(
            message="Hello",
            backend="invalid",
            model="test",
            config={}
        )
```

#### 5.2 Integration Tests

```python
# tests/integration/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_chat_endpoint():
    response = client.post("/api/chat", json={
        "message": "Hello",
        "backend": "ollama-default",
        "model": "llama2",
        "config": {
            "temperature": 0.7,
            "topP": 0.9,
            "maxTokens": 100
        }
    })

    assert response.status_code in [200, 503]  # 503 if backend offline
```

### Phase 6: Developer Experience

#### 6.1 Setup Script

```powershell
# setup.ps1
Write-Host "Setting up Local LLM Chat Application..." -ForegroundColor Green

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Setup frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd ..
npm install

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path backend/logs
New-Item -ItemType Directory -Force -Path backend/uploads
New-Item -ItemType Directory -Force -Path backend/vector_db

# Copy environment file
if (-not (Test-Path backend/.env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item backend/.env.example backend/.env
}

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Run 'npm run start:all' to start both frontend and backend" -ForegroundColor Cyan
```

#### 6.2 Unified Start Script

```json
// package.json - Add scripts
{
  "scripts": {
    "dev": "vite",
    "backend": "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000",
    "start:all": "concurrently \"npm run backend\" \"npm run dev\"",
    "test": "vitest",
    "test:backend": "cd backend && pytest",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Implementation Priority

### 🔴 Critical (Week 1)

1. Fix 307 redirect issue
2. Fix telemetry errors
3. Add backend health check
4. Add frontend retry logic
5. Fix Tesseract fallback
6. Add CSV support

### 🟡 High Priority (Week 2)

1. Refactor folder structure
2. Implement proper error handling
3. Add logging system
4. Add rate limiting
5. Add caching layer

### 🟢 Medium Priority (Week 3-4)

1. Write unit tests
2. Write integration tests
3. Add background task queue
4. Improve UI/UX
5. Add documentation

### 🔵 Nice to Have (Future)

1. Add monitoring/metrics
2. Add authentication
3. Add Redis cache
4. Add Celery for heavy tasks
5. Add Docker support

---

## Success Metrics

- ✅ Zero 307 redirects
- ✅ Zero telemetry errors
- ✅ 99% uptime with graceful degradation
- ✅ < 2s average response time
- ✅ 80%+ test coverage
- ✅ < 5 ESLint warnings
- ✅ 100% type safety (TypeScript)
- ✅ All file types supported with fallbacks

---

## Next Steps

1. Review and approve this plan
2. Create feature branches for each phase
3. Implement critical fixes first
4. Set up CI/CD pipeline
5. Deploy to staging environment
6. Conduct QA testing
7. Production deployment
