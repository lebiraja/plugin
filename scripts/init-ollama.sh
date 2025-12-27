#!/bin/bash

# Initialize Ollama with gemma3:1b model
# This script waits for Ollama to be ready, then pulls the model

echo "Waiting for Ollama to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

until curl -s http://localhost:11434/api/tags > /dev/null; do
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "Ollama failed to start after $MAX_ATTEMPTS attempts"
        exit 1
    fi
    echo "Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS - Waiting for Ollama..."
    sleep 2
    ATTEMPT=$((ATTEMPT+1))
done

echo "Ollama is ready. Pulling gemma3:1b model..."
ollama pull gemma3:1b

echo "Model pull completed!"
