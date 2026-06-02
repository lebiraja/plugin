# Docker

The application ships as a **single image** (`lebiraja/plugin`) that runs the
built React frontend (served by nginx) and the FastAPI backend (uvicorn)
together, managed by supervisord. nginx listens on port 80, serves the UI, and
reverse-proxies `/api` to uvicorn on `127.0.0.1:2000` inside the container.

MongoDB and Ollama run as their own containers alongside it.

## Services & ports

| Service | Container       | Host port | Internal                  |
|---------|-----------------|-----------|---------------------------|
| app     | plugin-app      | 3100      | 80 (nginx) → 2000 (uvicorn) |
| ollama  | ollama-server   | 11434     | 11434                     |
| mongodb | mongodb-server  | 27017     | 27017                     |

## Run from source

```bash
cp .env.example .env        # set ENCRYPTION_KEY, SERPER_API_KEY, etc.
docker compose up --build
```

Open <http://localhost:3100>.

## Run the published image

The single image is published to Docker Hub on every push to `main`:

```bash
cp .env.example .env
IMAGE_TAG=latest docker compose -f docker-compose.prod.yml up -d
# or pin a version:
IMAGE_TAG=v2.0.1 docker compose -f docker-compose.prod.yml up -d
```

```bash
docker pull lebiraja/plugin:latest
```

## How the wiring works

- The app reads `OLLAMA_URL`, `MONGODB_URL`, `MONGODB_DB_NAME`, `CORS_ORIGINS`,
  and `ENCRYPTION_KEY` from the environment. Compose points them at the
  `ollama`/`mongodb` service names.
- The frontend is built with `VITE_API_URL=/api`; nginx (`deploy/nginx.conf`)
  reverse-proxies `/api` → `127.0.0.1:2000`. SSE works because the nginx config
  disables proxy buffering and uses long read/send timeouts.
- `supervisord` (`deploy/supervisord.conf`) starts both nginx and uvicorn and
  streams their logs to `docker logs`.
- `scripts/init-ollama.sh` can pre-pull a model.

## Cloud providers & secrets

Set `ENCRYPTION_KEY` (a Fernet key) to enable adding cloud-provider API keys at
runtime; keys are encrypted at rest in MongoDB. Optionally seed providers with
`OPENAI_API_KEY` / `OPENROUTER_API_KEY` / `GROQ_API_KEY`. See `docs/API.md`
(providers endpoints) and `.env.example`.

## Healthchecks

Every service declares a healthcheck; `app` waits for `ollama` and `mongodb` to
be healthy before starting.

## Volumes

- `ollama_data` — pulled models.
- `mongodb_data` — database files.
- `app_uploads`, `app_vector_db` — uploads and the Chroma vector store.

## CI / releases

`.github/workflows/release.yml` runs on push to `main`: it runs backend + frontend
tests, auto-bumps the patch version from the latest `vX.Y.Z` git tag, builds the
single image, pushes `lebiraja/plugin:{version,latest,sha-…}` to Docker Hub
(auth via the `DOCKER_TOKEN` secret), creates the git tag, and cuts a GitHub
Release. Push a `vX.Y.0` tag manually for a minor/major bump.

## Running tests

```bash
cd backend && pytest        # backend
npm test                    # frontend
```
