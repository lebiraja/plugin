# Architecture

`@lebiraja/plugintool` is both a self-hosted local-LLM chat app and an npm
package of React chat components. This document describes the runtime
architecture after the v2 re-engineering.

## Services

```
┌────────────┐      /api (nginx proxy)      ┌──────────────┐
│  frontend  │ ───────────────────────────▶ │   backend    │
│  (nginx +  │                              │  (FastAPI)   │
│   static)  │                              └──────┬───────┘
└────────────┘                        ┌────────────┼────────────┐
                                      ▼            ▼            ▼
                                 ┌─────────┐  ┌─────────┐  ┌──────────┐
                                 │ Ollama  │  │ MongoDB │  │ ChromaDB │
                                 │  /LMS   │  │         │  │ (on-disk)│
                                 └─────────┘  └─────────┘  └──────────┘
```

- **frontend** — Vite build served by nginx, which reverse-proxies `/api` to the
  backend (no CORS, SSE-friendly). API base URL is configurable at build
  (`VITE_API_URL`) or runtime (`configureApi`) for npm-package consumers.
- **backend** — FastAPI. All configuration comes from `config.Settings`
  (env-var driven, with aliases so Docker and bare-metal both work).
- **Ollama / LM Studio** — chat-completion backends, reached over `/api/chat`
  (Ollama) and `/v1/chat/completions` (LM Studio).
- **MongoDB** — chat sessions, file metadata, and persisted deep-research results.
- **ChromaDB** — the single vector store for RAG (on-disk at `VECTOR_DB_PATH`).

## Backend layout

```
backend/
  main.py             # app, lifespan, CORS, middleware, exception handlers
  config.py           # Settings (env aliases)
  dependencies.py     # FastAPI DI providers (single shared service instances)
  errors.py           # AppError hierarchy + handlers (no str(e) leakage)
  sse.py              # SSE frame formatting
  routers/            # health, chat, sessions, files, models, tools, deep_research
  services/
    llm_service.py            # uniform streaming client over Ollama / LM Studio
    session_service.py        # session CRUD, coalesced writes, title generation
    rag_service.py            # unified ingestion + retrieval (ChromaDB only)
    search_service.py         # Serper/DuckDuckGo + content scraping
    deep_research_service.py  # 4-stage research agent (streamed, persisted)
    database_service.py       # Motor client singleton
  tests/              # pytest (DI overrides + mongomock-motor)
```

### Dependency injection

Services are constructed once and shared via `Depends(...)` providers in
`dependencies.py`. Routers never instantiate services directly. This removes the
old triple-instantiation of `LLMService` and makes everything testable: a test
overrides `app.dependency_overrides[get_llm_service]` with a fake.

### Streaming

Three endpoints stream Server-Sent Events using the shared `sse.sse_event`
frame format:

- `POST /api/chat/stream` — stateless token stream.
- `POST /api/sessions/{id}/message/stream` — token stream that persists the
  assistant message (and tokens/citations/context) once at the end.
- `POST /api/deep-research/conduct/stream` — stage-progress events
  (`planning → searching → reasoning → synthesizing → complete`).

## Data model (MongoDB)

- `chat_sessions` — one document per session: `messages[]`, `files[]`,
  `model_config`, and a `metadata` sub-doc (counts, token totals, tool usage,
  last-message preview). Message writes are coalesced into a single
  `$push`+`$set`+`$inc` update.
- `research_results` — persisted deep-research results keyed by `research_id`
  (an md5 of the normalized query), so results survive restarts.

## RAG pipeline

One service (`rag_service.py`) handles ingestion and retrieval:

1. Extract text (PDF/DOCX/TXT/CSV, image OCR via Tesseract).
2. Chunk (overlapping word windows).
3. Embed (`nomic-embed-text-v1.5`, device auto-detected: CUDA else CPU).
4. Store vectors in ChromaDB tagged with `session_id` + `file_id`.

Retrieval filters by the file ids a session owns, so a session's RAG queries
only see that session's documents. The embedding model loads lazily so the
chat/session paths don't pay the ML import cost.

## Frontend state

Five Zustand stores: `settingsStore` (backend/model/tools, persisted),
`sessionStore` (session list + current id, persisted), `chatStore` (ephemeral
stats + retrieved context), `fileStore`, `deepResearchStore` (progress +
results). The chat view holds the live message list in local component state
(seeded from the server) as the single source of truth — there is no longer a
competing `chatStore` message array.
