# Docker

Everything runs in Docker via `docker-compose.yml`. The compose file overrides
the backend's env vars to Docker service names — these bind through the aliases
declared in `backend/config.py`.

## Services & ports

| Service   | Container        | Host port | Internal |
|-----------|------------------|-----------|----------|
| frontend  | frontend-server  | 3100      | 80 (nginx) |
| backend   | backend-server   | 2000      | 2000     |
| ollama    | ollama-server    | 11434     | 11434    |
| mongodb   | mongodb-server   | 27017     | 27017    |

## Run

```bash
cp .env.example .env        # adjust as needed (SERPER_API_KEY etc.)
docker compose up --build
```

Then open <http://localhost:3100>.

## How the wiring works

- The backend reads `OLLAMA_URL`, `MONGODB_URL`, `MONGODB_DB_NAME`,
  `CORS_ORIGINS`, etc. Compose sets these to `http://ollama:11434` and
  `mongodb://admin:password@mongodb:27017/` so the backend reaches the other
  containers by service name (not `localhost`, which previously broke in Docker).
- The frontend is built with `VITE_API_URL=/api` and served by nginx, which
  reverse-proxies `/api` → `http://backend:2000`. SSE works because the nginx
  config disables proxy buffering and uses long read/send timeouts.
- `scripts/init-ollama.sh` can pre-pull a model (e.g. `gemma3:1b`).

## Healthchecks

All four services declare healthchecks. The backend depends on `ollama` and
`mongodb` being healthy before it starts.

## Volumes

- `ollama_data` — pulled models.
- `mongodb_data` — database files.
- `./backend/uploads`, `./backend/vector_db`, `./backend/logs` — bind-mounted so
  uploads, the Chroma store, and logs persist on the host. (If `logs/` ends up
  root-owned from a prior run, the backend falls back to stderr logging instead
  of crashing; override the directory with `LOG_DIR`.)

## Running tests in Docker

```bash
docker compose run --rm backend pytest
```
