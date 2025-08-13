#!/bin/bash

echo "🚀 Starting Perplexify Development Environment"

# Start SearXNG in Docker
echo "📡 Starting SearXNG..."
docker compose -f docker-compose.dev.yaml up -d searxng

# Wait a moment for SearXNG to start
echo "⏳ Waiting for SearXNG to start..."
sleep 3

# Check if SearXNG is running
if docker compose -f docker-compose.dev.yaml ps searxng | grep -q "Up"; then
    echo "✅ SearXNG is running on http://localhost:4000"
else
    echo "❌ Failed to start SearXNG"
    exit 1
fi

# Start Next.js development server
echo "⚡ Starting Next.js development server..."
echo "🌐 Your app will be available at http://localhost:3000"
echo "🔍 SearXNG will be available at http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both services"

# Start Next.js dev server
yarn dev 