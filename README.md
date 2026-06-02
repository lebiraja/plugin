# Plugin Chat

Self-hosted multi-provider LLM chat app. Local models (Ollama, LM Studio) and
cloud providers (OpenAI, OpenRouter, Groq, Together, DeepSeek) from one UI.
Persistent sessions, RAG, web search, deep research, token streaming — shipped
as a single Docker image.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/docker/pulls/lebiraja/plugin)

## Quick Start

```bash
docker pull lebiraja/plugin:latest
```

Create a `.env` file (copy from [`.env.example`](.env.example)):

```bash
cp .env.example .env
# set ENCRYPTION_KEY, SERPER_API_KEY, provider keys as needed
```

Run with Docker Compose:

```bash
docker compose up -d
```

Open <http://localhost:3100>.

The app is one container (nginx + FastAPI via supervisord). MongoDB and Ollama
run alongside it. See [docs/docker.md](docs/docker.md) for details.

## What It Does

- **Multi-provider chat** — Ollama, LM Studio, OpenAI, OpenRouter, Groq, Together, DeepSeek, or any OpenAI-compatible endpoint
- **Persistent sessions** — MongoDB-backed chat history with smart auto-titles
- **RAG** — Upload PDF/DOCX/TXT, ask questions with vector search (ChromaDB)
- **Web search** — Serper.dev (Google) with DuckDuckGo fallback
- **Deep research** — Multi-step iterative reasoning with SSE progress
- **Encrypted keys** — Cloud provider API keys encrypted at rest (Fernet)
- **Token streaming** — Live token rendering via Server-Sent Events

## Architecture

```
┌────────────┐    /api (nginx proxy)    ┌──────────────┐
│  frontend  │ ──────────────────────▶ │   backend    │
│  (nginx +  │                          │  (FastAPI)   │
│   static)  │                          └──────┬───────┘
└────────────┘                    ┌────────────┼────────────┐
                                  ▼            ▼            ▼
                             ┌─────────┐  ┌─────────┐  ┌──────────┐
                             │ Ollama  │  │ MongoDB │  │ ChromaDB │
                             │  /LMS   │  │         │  │ (on-disk)│
                             └─────────┘  └─────────┘  └──────────┘
```

| Service | Container     | Host Port | Internal                    |
|---------|---------------|-----------|-----------------------------|
| app     | plugin-app    | 3100      | 80 (nginx) → 2000 (uvicorn) |
| ollama  | ollama-server | 11434     | 11434                       |
| mongodb | mongodb       | 27017     | 27017                       |

Full architecture docs: [docs/architecture.md](docs/architecture.md)

## Configuration

All configuration is via environment variables. See [`.env.example`](.env.example)
for the full list.

Key variables:

| Variable | Purpose |
|----------|---------|
| `ENCRYPTION_KEY` | Fernet key for encrypting cloud provider API keys at rest |
| `SERPER_API_KEY` | Google search via Serper.dev (optional, falls back to DDG) |
| `OPENAI_API_KEY` | Bootstrap OpenAI provider on first startup (optional) |
| `OPENROUTER_API_KEY` | Bootstrap OpenRouter provider (optional) |
| `GROQ_API_KEY` | Bootstrap Groq provider (optional) |
| `MONGODB_URL` | MongoDB connection string |
| `OLLAMA_URL` | Ollama server URL |

Generate an encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Cloud provider keys can also be added at runtime via the Settings UI — they're
encrypted and stored in MongoDB.

## Development

### From source

```bash
cp .env.example .env
docker compose up --build
```

### Running tests

```bash
# Backend
cd backend && pytest -q

# Frontend
npm test
```

### Lint

```bash
npm run lint
```

## API

Full endpoint docs: [docs/API.md](docs/API.md)

Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with provider status map |
| GET | `/api/providers` | List configured providers |
| POST | `/api/providers` | Add/update a provider key |
| GET | `/api/models/{provider_id}` | List models for a provider |
| POST | `/api/sessions` | Create a new chat session |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions/{id}/message/stream` | Stream a chat message (SSE) |
| POST | `/api/sessions/{id}/upload` | Upload a file for RAG |
| POST | `/api/deep-research/conduct/stream` | Deep research (SSE) |

## CI/CD

Pushes to `main` trigger the release workflow:

1. Backend tests (pytest) + frontend tests (vitest) + lint + build
2. Auto-bump patch version from latest `vX.Y.Z` tag
3. Build single Docker image
4. Push `lebiraja/plugin:{version,latest,sha-…}` to Docker Hub
5. Create GitHub Release

See [`.github/workflows/release.yml`](.github/workflows/release.yml).

## Docs

| Doc | Description |
|-----|-------------|
| [docs/architecture.md](docs/architecture.md) | System design and service layout |
| [docs/docker.md](docs/docker.md) | Container setup, volumes, healthchecks |
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/FIXES.md](docs/FIXES.md) | What was fixed in the v2 re-engineering |

## License

MIT — see [LICENSE](LICENSE).

---

**[lebiraja](https://github.com/lebiraja)**
