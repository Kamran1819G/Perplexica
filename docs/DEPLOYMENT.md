# 🚀 Deployment Guide for Perplexica

This guide covers deployment options for Perplexica, which uses local Docker builds for complete independence from external registries.

## 🎯 Deployment Overview

Perplexica uses **local Docker builds** instead of pre-built images from registries. This approach provides:
- ✅ **Complete independence** from external registries
- ✅ **Security** - no dependency on third-party image sources
- ✅ **Reliability** - builds from your own source code
- ✅ **Customization** - full control over the build process

## 🐳 Docker Compose Deployment (Recommended)

### Production Deployment
```bash
# Clone the repository
git clone https://github.com/Kamran1819G/Perplexica.git
cd Perplexica

# Setup configuration
cp sample.config.toml config.toml
# Edit config.toml with your API keys

# Deploy using production environment
NODE_ENV=production docker-compose up --build -d
```

### Development Deployment
```bash
# For development with live updates
docker-compose up --build
```

## ☁️ Cloud Platform Deployment

### Railway
1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Docker setup
3. Use `docker-compose.deploy.yaml` as the compose file
4. Set environment variables in Railway dashboard

### Render
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `docker-compose -f docker-compose.deploy.yaml up --build -d`
4. Configure environment variables

### DigitalOcean App Platform
1. Create a new App
2. Connect your GitHub repository
3. Select "Docker" as the source type
4. Use the deployment compose file

### Google Cloud Run
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/perplexica
gcloud run deploy perplexica --image gcr.io/PROJECT_ID/perplexica --platform managed
```

## ☸️ Kubernetes Deployment

### Using the Provided Template
```bash
# Apply the Kubernetes deployment template
kubectl apply -f deploy-template.yaml

# Check deployment status
kubectl get pods -n perplexica
kubectl get services -n perplexica
```

### Custom Kubernetes Deployment
```yaml
# Example custom deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: perplexica-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: perplexica-app
  template:
    metadata:
      labels:
        app: perplexica-app
    spec:
      containers:
      - name: perplexica-app
        image: perplexica-app:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3000
```

## 🔧 Configuration for Deployment

### Environment Variables
Set these environment variables in your deployment platform:

```bash
SEARXNG_API_URL=http://searxng:8080
DATA_DIR=/home/perplexica
NODE_ENV=production
```

### Configuration File
Ensure `config.toml` is properly configured with your API keys:

```toml
[MODELS.OPENAI]
API_KEY = "your-openai-key"

[MODELS.ANTHROPIC]
API_KEY = "your-anthropic-key"

# ... other model configurations
```

## 🚫 One-Click Deployment Limitations

### Why One-Click Services May Not Work
- **Registry Dependency**: Most one-click services expect pre-built images
- **Build Context**: They can't access your local Dockerfile
- **Custom Build Process**: Your local build approach is different from standard deployments

### Alternative Solutions
1. **Manual Deployment**: Use Docker Compose files directly
2. **Cloud Platforms**: Use platforms that support local builds
3. **Custom Templates**: Create deployment templates for specific platforms

## 🔍 Troubleshooting Deployment

### Common Issues

#### Build Failures
```bash
# Check build logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker system prune -a
docker-compose up --build
```

#### Configuration Issues
```bash
# Verify configuration file
docker exec -it perplexica-app-1 cat /home/perplexica/config.toml

# Check environment variables
docker exec -it perplexica-app-1 env | grep SEARXNG
```

#### Port Issues
```bash
# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Use different ports if needed
# Edit docker-compose files to change port mappings
```

### Platform-Specific Issues

#### Railway
- Ensure Docker Compose file is in root directory
- Check build logs in Railway dashboard
- Verify environment variables are set

#### Render
- Use build command: `docker-compose up --build -d`
- Set proper environment variables
- Check build logs for errors

#### Kubernetes
```bash
# Check pod status
kubectl describe pod -n perplexica

# Check logs
kubectl logs -n perplexica perplexica-app-xxx

# Check services
kubectl get svc -n perplexica
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Check SearXNG health
curl http://localhost:4000/api/v1/info
```

### Logs and Monitoring
```bash
# View application logs
docker-compose logs -f app

# View SearXNG logs
docker-compose logs -f searxng

# Monitor resource usage
docker stats perplexica-app-1 perplexica-searxng-1
```

### Backup and Recovery
```bash
# Backup data volumes
docker run --rm -v perplexica_backend-dbstore:/data -v $(pwd):/backup alpine tar czf /backup/perplexica-data-backup.tar.gz -C /data .

# Restore data volumes
docker run --rm -v perplexica_backend-dbstore:/data -v $(pwd):/backup alpine tar xzf /backup/perplexica-data-backup.tar.gz -C /data
```

## 🔄 Updates and Upgrades

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Database Migrations
```bash
# Run migrations manually if needed
docker exec -it perplexica-app-1 yarn db:push
```

## 📚 Additional Resources

- [Docker Setup Guide](DOCKER.md) - Detailed Docker instructions
- [Architecture Documentation](../docs/architecture/README.md) - System architecture
- [API Documentation](../docs/API/SEARCH.md) - API usage
- [Installation Guide](../docs/installation/README.md) - Installation instructions

---

For deployment support, create an issue on GitHub or join the Discord server. 