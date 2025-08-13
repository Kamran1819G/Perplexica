#!/bin/bash

echo "🛑 Stopping Perplexify Development Environment"

# Stop SearXNG Docker container
echo "📡 Stopping SearXNG..."
docker compose -f docker-compose.dev.yaml down

echo "✅ Development environment stopped"
echo "💡 To start again, run: ./dev.sh" 