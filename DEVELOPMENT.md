# Development Guide

This guide explains how to run Perplexify in development mode with hot reloading enabled.

## Important Note: Docker Hot Reload Limitation

**Docker hot reloading was not possible** due to volume mounting conflicts with Next.js App Router. The Next.js application couldn't find the `app` directory when mounted as volumes in Docker containers. This is a known limitation with Next.js 13+ App Router and Docker volume mounts.

**Solution**: We use a hybrid approach where:
- SearXNG runs in Docker (for search functionality)
- Next.js runs directly on the host machine (for fast development with hot reloading)

If you can implement Docker hot reloading correctly, contributions are welcome!

## Quick Start (Recommended)

Use the development script for the easiest setup:

### Linux/macOS Users:
```bash
# Start development environment
./dev.sh

# Stop development environment
./stop-dev.sh
```

### Windows Users:
```cmd
# Start development environment
dev.bat

# Stop development environment
stop-dev.bat
```

This will:
- Start SearXNG in Docker (http://localhost:4000)
- Start Next.js on host machine (http://localhost:3000) with hot reloading

## Manual Setup

If you prefer to start services manually:

### 1. Start SearXNG in Docker
```bash
docker compose -f docker-compose.dev.yaml up -d searxng
```

### 2. Start Next.js on Host Machine
```bash
# Install dependencies (if not already done)
yarn install

# Start development server
yarn dev
```

## Architecture

- **SearXNG**: Runs in Docker container on port 4000
- **Next.js App**: Runs directly on host machine on port 3000
- **Hot Reloading**: Full hot reloading for Next.js development
- **Search Integration**: App connects to SearXNG via localhost:4000

## Benefits

✅ **Fast Development**: Next.js runs directly on host with instant hot reloading  
✅ **Search Functionality**: SearXNG provides search capabilities  
✅ **Simple Setup**: One command to start everything  
✅ **Easy Debugging**: Direct access to Next.js logs and files  
✅ **No Volume Mount Issues**: No Docker volume mounting complexity  
✅ **Reliable**: No Docker hot reload conflicts  

## File Structure

The project uses a `src` folder structure:
- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility libraries
- `src/hooks/` - Custom React hooks

## Environment Variables

The Next.js app will automatically connect to SearXNG at `http://localhost:4000`.

## Troubleshooting

### SearXNG not accessible?
```bash
# Check if container is running
docker compose -f docker-compose.dev.yaml ps

# Check logs
docker compose -f docker-compose.dev.yaml logs searxng
```

### Next.js not starting?
```bash
# Check if dependencies are installed
yarn install

# Check for port conflicts
lsof -i :3000
```

### Port already in use?
```bash
# Stop any existing processes
pkill -f "yarn dev"
docker compose -f docker-compose.dev.yaml down
```

## Commands

### Linux/macOS:
```bash
# Quick start/stop
./dev.sh
./stop-dev.sh

# Manual control
docker compose -f docker-compose.dev.yaml up -d searxng
docker compose -f docker-compose.dev.yaml down
yarn dev

# Check status
docker compose -f docker-compose.dev.yaml ps
```

### Windows:
```cmd
# Quick start/stop
dev.bat
stop-dev.bat

# Manual control
docker compose -f docker-compose.dev.yaml up -d searxng
docker compose -f docker-compose.dev.yaml down
yarn dev

# Check status
docker compose -f docker-compose.dev.yaml ps
```

## Contributing

If you can solve the Docker hot reloading issue, please contribute! The main challenges were:
- Next.js App Router not finding `src/app` directory when mounted as volumes
- Volume mounting conflicts between host and container file structures
- File watching issues in Docker containers 