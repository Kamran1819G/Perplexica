# 🐳 Docker Setup Guide for Perplexica

This guide covers how to use Docker for both development and production environments with Perplexica, including live updates during development.

## 📋 Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)
- Basic knowledge of terminal commands

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Kamran1819G/Perplexica.git
cd Perplexica
```

### 2. Setup Configuration
```bash
# Copy the sample configuration file
cp sample.config.toml config.toml

# Edit the configuration with your API keys and settings
nano config.toml  # or use your preferred editor
```

### 3. Start the Application
```bash
# For development (with live updates)
docker-compose -f docker-compose.dev.yaml up --build

# For production
docker-compose -f docker-compose.prod.yaml up --build -d
```

### 4. Access the Application
- **Main App**: http://localhost:3000
- **SearXNG**: http://localhost:4000

## 🔧 Development Environment

The development environment is designed for active development with live code updates and hot reloading.

### Features
- ✅ **Live Code Updates**: Changes to source files are immediately reflected
- ✅ **Hot Reloading**: Next.js hot reloading works automatically
- ✅ **Volume Mounts**: Source code is mounted into containers
- ✅ **Development Server**: Uses `yarn dev` for development mode

### Start Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yaml up --build

# Run in detached mode
docker-compose -f docker-compose.dev.yaml up --build -d

# View logs
docker-compose -f docker-compose.dev.yaml logs -f app
```

### Development Workflow
1. **Start the environment** (see above)
2. **Make code changes** in `src/`, `public/`, etc.
3. **See changes immediately** - no rebuild needed for most changes
4. **For package changes**: Rebuild with `docker-compose -f docker-compose.dev.yaml up --build`

### Volume Mounts (Development)
The development setup mounts these directories for live updates:
- `./src` → `/home/perplexica/src`
- `./public` → `/home/perplexica/public`
- `./drizzle` → `/home/perplexica/drizzle`
- `./package.json` → `/home/perplexica/package.json`
- `./yarn.lock` → `/home/perplexica/yarn.lock`
- `./tsconfig.json` → `/home/perplexica/tsconfig.json`
- `./next.config.mjs` → `/home/perplexica/next.config.mjs`
- And more configuration files...

## 🏭 Production Environment

The production environment is optimized for performance and security.

### Features
- ✅ **Optimized Builds**: Multi-stage Docker builds
- ✅ **Security**: No source code volume mounts
- ✅ **Performance**: Standalone Next.js server
- ✅ **Database Migrations**: Automatic migration execution

### Start Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yaml up --build -d

# View logs
docker-compose -f docker-compose.prod.yaml logs -f

# Stop production
docker-compose -f docker-compose.prod.yaml down
```

### Production Optimizations
- **Multi-stage builds** reduce image size
- **Standalone Next.js** server for better performance
- **Automatic migrations** run on startup
- **Persistent volumes** for data and uploads

## 📁 Configuration

### Required Configuration
Create `config.toml` from the sample:
```bash
cp sample.config.toml config.toml
```

### Key Configuration Sections
```toml
[GENERAL]
SIMILARITY_MEASURE = "cosine"  # "cosine" or "dot"
KEEP_ALIVE = "5m"             # Keep Ollama models loaded

[MODELS.OPENAI]
API_KEY = "your-openai-key"

[MODELS.ANTHROPIC]
API_KEY = "your-anthropic-key"

[MODELS.OLLAMA]
API_URL = "http://host.docker.internal:11434"  # For local Ollama

[MODELS.LM_STUDIO]
API_URL = "http://host.docker.internal:1234"   # For local LM Studio

[API_ENDPOINTS]
SEARXNG = ""  # Automatically configured in Docker
```

### Environment Variables
You can override environment variables:
```bash
# Create .env file
echo "NODE_ENV=development" > .env
echo "CUSTOM_VAR=value" >> .env
```

## 🛠 Useful Commands

### Development Commands
```bash
# Start development with live updates
docker-compose -f docker-compose.dev.yaml up

# Rebuild development containers
docker-compose -f docker-compose.dev.yaml up --build

# View development logs
docker-compose -f docker-compose.dev.yaml logs -f app

# Stop development environment
docker-compose -f docker-compose.dev.yaml down

# Access development container shell
docker exec -it perplexica-app-1 /bin/bash
```

### Production Commands
```bash
# Start production environment
docker-compose -f docker-compose.prod.yaml up -d

# Rebuild production containers
docker-compose -f docker-compose.prod.yaml up --build -d

# View production logs
docker-compose -f docker-compose.prod.yaml logs -f

# Stop production environment
docker-compose -f docker-compose.prod.yaml down

# Access production container shell
docker exec -it perplexica-app-1 /bin/bash
```

### General Commands
```bash
# View running containers
docker ps

# View container logs
docker logs perplexica-app-1

# Clean up unused containers/images
docker system prune -a

# View Docker volumes
docker volume ls

# Remove specific volume
docker volume rm perplexica_backend-dbstore
```

## 🔄 Live Updates During Development

### What Updates Automatically
- ✅ **Source code changes** (`src/` directory)
- ✅ **Public assets** (`public/` directory)
- ✅ **Configuration files** (config.toml, etc.)
- ✅ **Database schema** (`drizzle/` directory)
- ✅ **Next.js configuration** files

### What Requires Rebuild
- ❌ **Package dependencies** (package.json, yarn.lock)
- ❌ **Dockerfile changes**
- ❌ **Docker Compose changes**

### Rebuilding When Needed
```bash
# After changing package.json or yarn.lock
docker-compose -f docker-compose.dev.yaml down
docker-compose -f docker-compose.dev.yaml up --build

# After changing Dockerfile
docker-compose -f docker-compose.dev.yaml down
docker-compose -f docker-compose.dev.yaml up --build
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :4000

# Kill processes if needed
sudo kill -9 <PID>
```

#### 2. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.dev.yaml logs app

# Rebuild from scratch
docker-compose -f docker-compose.dev.yaml down
docker system prune -a
docker-compose -f docker-compose.dev.yaml up --build
```

#### 3. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x entrypoint.sh
```

#### 4. Database Issues
```bash
# Reset database volume
docker-compose down -v
docker volume rm perplexica_backend-dbstore
docker-compose -f docker-compose.dev.yaml up --build
```

#### 5. Ollama Connection Issues
For local Ollama integration:
- **Windows/Mac**: Use `http://host.docker.internal:11434`
- **Linux**: Use `http://<your-host-ip>:11434`

Make sure Ollama is running and accessible from Docker containers.

### Debugging Commands
```bash
# Check container status
docker ps -a

# View detailed container info
docker inspect perplexica-app-1

# Check container resources
docker stats perplexica-app-1

# View container filesystem
docker exec -it perplexica-app-1 ls -la /home/perplexica
```

## 🔗 External Services Integration

### Local Ollama
```toml
[MODELS.OLLAMA]
API_URL = "http://host.docker.internal:11434"
```

### Local LM Studio
```toml
[MODELS.LM_STUDIO]
API_URL = "http://host.docker.internal:1234"
```

### Custom SearXNG Instance
```toml
[API_ENDPOINTS]
SEARXNG = "http://your-searxng-instance:8080"
```

## 📊 Performance Tips

### Development
- Use volume mounts for live updates
- Monitor container resource usage
- Restart containers periodically for clean state

### Production
- Use production compose file
- Monitor logs for errors
- Set up proper backup for volumes
- Consider using Docker Swarm or Kubernetes for scaling

## 🔒 Security Considerations

### Development
- Source code is mounted (less secure)
- Development mode enabled
- Debug information available

### Production
- No source code mounting
- Production optimizations enabled
- Minimal attack surface
- Proper environment variables

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Perplexica Architecture](docs/architecture/README.md)
- [Perplexica API Documentation](docs/API/SEARCH.md)

---

For more help, check the [main README](../README.md) or create an issue on GitHub. 