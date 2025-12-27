# Docker Setup Guide

This guide explains how to build and run the application using Docker and Docker Compose.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### Build and Run All Services

```bash
# Build all Docker images
docker-compose build

# Start all services (frontend, backend, MongoDB, and Ollama)
docker-compose up -d

# View logs
docker-compose logs -f
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Ollama**: http://localhost:11434
- **MongoDB**: mongodb://admin:password@localhost:27017

## Services

### 1. Ollama
- **Image**: `ollama/ollama:latest`
- **Port**: 11434
- **Volume**: `ollama_data` (persists downloaded models)
- **Default Model**: You need to manually pull `gemma3:1b`

### 2. MongoDB
- **Image**: `mongo:7`
- **Port**: 27017
- **Username**: admin
- **Password**: password
- **Volume**: `mongodb_data` (persists database)

### 3. Backend (Python/FastAPI)
- **Dockerfile**: `Dockerfile.backend`
- **Port**: 8000
- **Dependencies**: All Python packages from `backend/requirements.txt`
- **Environment Variables**:
  - `OLLAMA_HOST=http://ollama:11434`
  - `MONGO_URL=mongodb://admin:password@mongodb:27017/`

### 4. Frontend (React/TypeScript)
- **Dockerfile**: `Dockerfile.frontend`
- **Port**: 3000
- **Dependencies**: Node packages from `package.json`

## Detailed Commands

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start Services

```bash
# Start in background
docker-compose up -d

# Start with logs output
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# View logs from all services
docker-compose logs

# View logs from specific service with follow
docker-compose logs -f backend

# View last 100 lines of logs
docker-compose logs --tail=100
```

### Execute Commands in Running Container

```bash
# Connect to backend shell
docker-compose exec backend bash

# Connect to frontend shell
docker-compose exec frontend sh

# Run Python command in backend
docker-compose exec backend python -c "print('Hello')"
```

## Model Setup for Ollama

### Option 1: Manual Model Loading (Recommended for First Run)

After starting the services, pull the model:

```bash
# Connect to Ollama container
docker-compose exec ollama ollama pull gemma3:1b
```

Alternatively, from host machine (if Ollama client is installed):

```bash
ollama pull gemma3:1b
```

### Option 2: Automatic Model Loading (Alternative)

To pre-load the model in the Docker image during build:

1. Uncomment the model pull line in `Dockerfile.ollama-init`
2. Use the custom Ollama Dockerfile in compose (advanced)

Note: This significantly increases build time and image size.

## Environment Variables

You can customize the behavior by creating a `.env` file:

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# Ollama
OLLAMA_HOST=http://ollama:11434

# Backend
PYTHONUNBUFFERED=1

# Frontend
VITE_API_URL=http://backend:8000
```

Update `docker-compose.yml` to use these variables.

## Network

All services are connected via the `app-network` bridge network. Services can communicate using their container names:

- Backend can reach Ollama at: `http://ollama:11434`
- Frontend can reach Backend at: `http://backend:8000`
- Backend can reach MongoDB at: `mongodb:27017`

## Volume Mounts

Persistent data is stored in named volumes:

- `ollama_data`: Ollama models and cache
- `mongodb_data`: MongoDB databases
- `./backend/uploads`: Uploaded files (host mount)
- `./backend/logs`: Application logs (host mount)
- `./backend/vector_db`: Vector database (host mount)

## Troubleshooting

### Model Not Found in Ollama

```bash
# Check available models
docker-compose exec ollama ollama list

# Pull model
docker-compose exec ollama ollama pull gemma3:1b
```

### Backend Can't Connect to Ollama

Ensure Ollama is healthy:

```bash
docker-compose ps
# Status should show "healthy" for ollama service
```

### MongoDB Connection Issues

Check MongoDB logs:

```bash
docker-compose logs mongodb
```

### Clean Build

```bash
# Remove all containers and images
docker-compose down
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

## Production Considerations

For production deployment, consider:

1. Using environment-specific compose files
2. Adding reverse proxy (Nginx/Traefik)
3. Using secrets management instead of plaintext passwords
4. Configuring resource limits
5. Setting up proper logging
6. Using private Docker registries

## Performance Notes

- **First Run**: Pulling the Ollama model (gemma3:1b) takes time
- **Memory**: Ensure adequate memory for:
  - Ollama: 4GB+
  - Node/Frontend: 512MB
  - Python/Backend: 2GB+
  - MongoDB: 1GB+

## File Structure

```
project/
├── docker-compose.yml           # Main compose configuration
├── Dockerfile.backend           # Backend Python app
├── Dockerfile.frontend          # Frontend React app
├── Dockerfile.ollama-init       # Optional Ollama with pre-loaded model
├── .dockerignore                # Files to ignore in Docker builds
├── scripts/
│   └── init-ollama.sh           # Script to initialize Ollama
├── backend/
│   ├── requirements.txt
│   └── ...
├── src/
│   └── ...
└── package.json
```

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f [service]`
2. Verify service health: `docker-compose ps`
3. Test connectivity: `docker-compose exec [service] curl http://other-service:port`
