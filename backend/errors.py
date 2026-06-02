"""Application error types and a centralized handler.

Returning ``str(e)`` to clients leaks internals. Domain code raises
:class:`AppError` (or a subclass) with a safe, user-facing message and an HTTP
status; the handler logs the full detail server-side and returns only the safe
message to the caller.
"""

from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base class for expected, user-facing application errors."""

    status_code: int = 500
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None, *, status_code: int | None = None):
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    message = "Resource not found."


class ValidationError(AppError):
    status_code = 422
    message = "Invalid request."


class UpstreamError(AppError):
    """An upstream dependency (LLM backend, search provider) failed."""

    status_code = 502
    message = "An upstream service is unavailable."


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning("AppError on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500, content={"detail": "An internal error occurred."}
    )
