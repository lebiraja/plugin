# ─────────────────────────────────────────────────────────────────────────────
# Single application image: built React frontend (served by nginx) + FastAPI
# backend (uvicorn), run together by supervisord. nginx listens on :80, serves
# the static UI, and reverse-proxies /api to uvicorn on 127.0.0.1:2000.
#
# MongoDB and Ollama run as separate containers (see docker-compose.yml).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the frontend ──────────────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app

# Relative API base so nginx proxies /api to the backend in the same container.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci || npm install

COPY src/ src/
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.js tailwind.config.js components.json ./
RUN npm run build

# ── Stage 2: backend + nginx + supervisord ───────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend application
COPY backend/ ./backend/

# Frontend static build + nginx site config
COPY --from=frontend /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/sites-available/default
COPY deploy/supervisord.conf /etc/supervisor/conf.d/app.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost/api/health -o /dev/null || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/app.conf"]
