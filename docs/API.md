# API Reference

Base path: `/api`. Interactive docs at `/docs` (FastAPI auto-generated).

Errors return `{"detail": "<safe message>"}`; internal details are logged
server-side, never returned to the client.

## Health

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| GET    | `/api/health`         | Overall status + per-backend availability (`ollama`, `lmstudio`). |
| GET    | `/api/health/ollama`  | Ollama availability + model list. |
| GET    | `/api/health/lmstudio`| LM Studio availability + model list. |

## Models

| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | `/api/models/{backend}` | Model names for `ollama-default` or `lmstudio-default`. |

## Chat (stateless)

| Method | Path               | Description |
|--------|--------------------|-------------|
| POST   | `/api/chat`        | Full chat completion. |
| POST   | `/api/chat/stream` | SSE token stream. |

Body: `{ message, backend, model, config, history[] }`.

## Sessions

| Method | Path                                   | Description |
|--------|----------------------------------------|-------------|
| POST   | `/api/sessions/create`                 | Create a session. |
| GET    | `/api/sessions`                        | List (paginated: `skip`, `limit`, `sort`). |
| GET    | `/api/sessions/{id}`                   | Full session document. |
| POST   | `/api/sessions/{id}/message`           | Send a message, get the complete reply. |
| POST   | `/api/sessions/{id}/message/stream`    | Send a message, stream tokens (SSE). |
| POST   | `/api/sessions/{id}/generate-title`    | Generate a title from the first message. |
| PATCH  | `/api/sessions/{id}/rename`            | Rename. |
| DELETE | `/api/sessions/{id}`                   | Delete session, its files, and its vectors. |
| POST   | `/api/sessions/{id}/upload`            | Upload + embed a file (scoped to the session). |

Message body: `{ message, config?, tools_enabled? }` where `tools_enabled` may
set `web_search` and/or `rag`. `message` must be non-empty (422 otherwise).

Streaming events: `{type:"meta",...}`, then `{type:"token",content}` per token,
then `{type:"done", message_id, tokens, latency, citations, retrieved_context}`.

## Tools

| Method | Path                   | Description |
|--------|------------------------|-------------|
| POST   | `/api/tools/search`    | Web search (Serper/DuckDuckGo) with optional scraping. |
| POST   | `/api/tools/rag/query` | Query the vector store. |

## Files (global / session-less)

| Method | Path                  | Description |
|--------|-----------------------|-------------|
| POST   | `/api/files/upload`   | Upload + embed into the `GLOBAL` bucket. |
| DELETE | `/api/files/{id}`     | Delete file + its vectors. |
| GET    | `/api/files/`         | List global files. |

## Deep Research

| Method | Path                                  | Description |
|--------|---------------------------------------|-------------|
| POST   | `/api/deep-research/conduct`          | Run the full pipeline, return the report. |
| POST   | `/api/deep-research/conduct/stream`   | Run + stream stage progress, then the result (SSE). |
| GET    | `/api/deep-research/status/{id}`      | Whether a result is cached/persisted. |
| GET    | `/api/deep-research/cache/stats`      | Persisted research summaries. |
| DELETE | `/api/deep-research/cache/clear`      | Clear persisted results. |

Body: `{ query, backend, model, max_depth (1–3), max_sources (5–30) }`.

Streaming stage events: `{stage, progress, message}` for
`planning|searching|reasoning|synthesizing`, then
`{stage:"complete"|"cached", progress:100, result}`.
