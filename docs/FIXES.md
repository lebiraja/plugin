# Fixes — v2 Re-engineering

A full audit found ~25 issues across Docker wiring, the three core pipelines
(search/RAG/deep-research), code quality, and the frontend. This is what
changed and why.

## Docker / configuration (was: nothing worked in `docker compose up`)

- **Env vars were set but never read.** Compose set `OLLAMA_HOST`, `MONGO_URL`,
  `VITE_API_URL`; `config.py` read different names and services hardcoded
  `localhost`. Fixed: `config.py` binds every alias via `AliasChoices`; services
  read URLs from `settings`; compose env names aligned; `.env.example` authored.
- **Frontend hardcoded `http://localhost:2000`.** Fixed: all clients use a
  configurable `apiClient` (`VITE_API_URL` / `configureApi`); frontend now
  served by nginx proxying `/api` → backend (no CORS, SSE-friendly).

## RAG (was: uploaded files never appeared in answers)

- **Two disconnected upload pipelines.** The frontend uploaded to the unscoped
  `/api/files/upload`, but session RAG queried only session-scoped files, so
  retrieval never matched. Fixed: one unified `rag_service`; the frontend
  uploads to `/api/sessions/{id}/upload`.
- **`device="cuda"` hardcoded** → crashed on CPU hosts. Fixed: auto-detect.
- **Dual vector writes** (ChromaDB *and* MongoDB, but only ChromaDB was read).
  Fixed: ChromaDB is the single store.

## Search

- Serper key now from settings; bounded scrape concurrency; correct cache TTL
  (`total_seconds()`); blocking DuckDuckGo moved off the event loop; results
  normalized to a guaranteed shape; `print()` → `logger`.

## Deep Research

- **Process-memory cache** lost on restart, racey under load. Fixed: persisted
  to MongoDB; request-local counters via `contextvars` (no cross-request
  corruption).
- **Synchronous, blocking** with fake frontend progress. Fixed: real SSE
  stage-progress streaming wired to the frontend store.

## Chat / sessions

- **Ollama used `/api/generate`** (raw completion + manual prompt stitching).
  Fixed: `/api/chat` messages format, matching LM Studio.
- **No streaming.** Fixed: `stream_chat` + `/message/stream` (tokens render
  live, persisted once at the end).
- **4–5 DB writes per message.** Fixed: a single coalesced `$push`+`$set`+`$inc`.
- **`generate_title` signature mismatch** (manual endpoint threw `TypeError`).
  Fixed: optional backend/model derived from the session.
- Redundant second `get_session()` after upload removed; blocking file I/O →
  `aiofiles`; `import asyncio` hoisted; empty messages rejected (422).

## Architecture / quality

- Module-level global singletons (incl. 3× `LLMService`) → FastAPI DI providers.
- Deprecated `@app.on_event` → `lifespan`; `.dict()` → `.model_dump()`.
- Centralized exception handlers (no `str(e)` leakage) + request-logging
  middleware with correlation ids.
- `print()`/`traceback` debugging removed.

## Frontend

- Full redesign on shadcn/ui + Magic UI (refined-dark), replacing the ad-hoc
  liquid-glass component stack.
- Removed dead `SessionSidebar.tsx.backup` and the duplicate `LeftSidebar`;
  reconciled the competing `chatStore`/`sessionStore` message model; stripped
  `console.log`; replaced `any` types; lint passes with `--max-warnings 0`.

## Tests (was: none / ad-hoc scripts)

- Backend: pytest with DI overrides + mongomock-motor (config, LLM message
  building, session service, sessions API, deep research).
- Frontend: vitest + Testing Library (apiClient config, sessionStore, FileCard).
