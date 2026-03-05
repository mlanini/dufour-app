# Dufour.app Deployment Guide

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Local Deployment](#local-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Configuration](#configuration)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Backup & Recovery](#backup--recovery)

## Deployment Options

Dufour.app can be deployed in several ways:

- **Local Development**: Quick setup for development
- **Docker Compose**: Full-stack containerized deployment
- **Cloud Platform**: Render, AWS, Azure, or GCP
- **On-Premises**: Internal server deployment

## Local Deployment

### Prerequisites

- Windows 10/11 or Linux (Ubuntu 20.04+)
- Docker Desktop 20.10+
- Node.js 18.0+, npm 9.0+
- 8GB RAM minimum, 16GB recommended
- 10GB free disk space

### Development Setup

```powershell
# Clone repository
git clone https://github.com/mlanini/dufour-app.git
cd dufour-app

# Start backend services
docker-compose up -d postgis qgis-server

# Verify services are running
docker-compose ps

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

**Access Points**:
- Frontend: http://localhost:5173
- QGIS Server: http://localhost:8080
- PostGIS: localhost:5432

### Stopping Services

```powershell
# Stop frontend (Ctrl+C in terminal)

# Stop Docker services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

## Docker Deployment

### Production Build

Build optimized production images:

```powershell
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### Service Architecture

The production deployment includes:

1. **PostgreSQL/PostGIS** (port 5432)
   - Spatial database
   - Persistent volume for data
   - Health checks enabled

2. **QGIS Server** (port 8080)
   - WMS/WFS/WCS services
   - Project files in mounted volume
   - Parallel rendering enabled

3. **Nginx** (port 80/443)
   - Static file serving
   - Reverse proxy to QGIS Server
   - SSL termination (if configured)

4. **Frontend** (served by Nginx)
   - Production-built React app
   - Minified and optimized assets

### Container Management

```powershell
# View running containers
docker ps

# View container logs
docker logs dufour-postgis
docker logs dufour-qgis
docker logs dufour-nginx

# Restart specific service
docker-compose -f docker-compose.prod.yml restart qgis-server

# Update service
docker-compose -f docker-compose.prod.yml pull postgis
docker-compose -f docker-compose.prod.yml up -d postgis

# Execute commands in container
docker exec -it dufour-postgis psql -U gisuser -d gisdb
```

### Resource Limits

Edit `docker-compose.prod.yml` to set resource limits:

```yaml
services:
  postgis:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Cloud Deployment

### Render.com Deployment

Dufour.app can be deployed on Render with the provided `render.yaml` configuration.

**Prerequisites**:
- Render.com account (free tier available)
- GitHub repository with the code

**Deployment Steps**:

1. **Push to GitHub**:
   ```powershell
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create Web Service on Render**:
   - Go to [render.com/dashboard](https://render.com/dashboard)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select `dufour-app`
   - Render will auto-detect the Dockerfile

3. **Configure Service**:
   - **Name**: dufour-frontend
   - **Region**: Frankfurt (or Oregon)
   - **Branch**: main
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile.prod`
   - **Plan**: Free

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for build and deployment (~5-10 minutes)
   - Access app at provided URL (e.g., dufour-frontend.onrender.com)

**Note**: The free tier deployment includes only the frontend. For a complete deployment with QGIS Server and PostGIS:

- **Option 1**: Use Render's Blueprint feature (may require paid plan)
- **Option 2**: Deploy backend services separately on other platforms
- **Option 3**: Use Docker Compose on a VPS (see Docker Deployment section)

**Limitations of Free Tier**:
- Frontend only (no QGIS Server or PostGIS)
- App spins down after 15 minutes of inactivity
- Slow initial load time after spin-down
- Limited to 750 hours/month

**For Full Stack Deployment**:
Consider using a paid Render plan or deploying on AWS/Azure/GCP for complete functionality.

### AWS Deployment

**Using ECS (Elastic Container Service)**:

```bash
# Build and tag images
docker build -t dufour-app:latest -f Dockerfile.prod .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag dufour-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dufour-app:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dufour-app:latest

# Create ECS task definition and service
aws ecs create-cluster --cluster-name dufour-cluster
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster dufour-cluster --service-name dufour-service --task-definition dufour-app
```

**Using EC2**:

```bash
# SSH into EC2 instance
ssh -i key.pem ec2-user@<instance-ip>

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone https://github.com/mlanini/dufour-app.git
cd dufour-app
docker-compose -f docker-compose.prod.yml up -d
```

### Azure Deployment

**Using Azure Container Instances**:

```bash
# Login to Azure
az login

# Create resource group
az group create --name dufour-rg --location eastus

# Create container instances
az container create \
  --resource-group dufour-rg \
  --name dufour-app \
  --image youracr.azurecr.io/dufour-app:latest \
  --dns-name-label dufour-app \
  --ports 80 443
```

### Google Cloud Platform

**Using Cloud Run**:

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/dufour-app

# Deploy to Cloud Run
gcloud run deploy dufour-app \
  --image gcr.io/PROJECT-ID/dufour-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Configuration

### Environment Variables

Create `.env` file (not committed to git):

```env
# Database
POSTGRES_DB=gisdb
POSTGRES_USER=gisuser
POSTGRES_PASSWORD=your-secure-password
POSTGRES_HOST=postgis
POSTGRES_PORT=5432

# QGIS Server
QGIS_SERVER_LOG_LEVEL=0
QGIS_PROJECT_FILE=/data/projects/dufour.qgs
QGIS_SERVER_PARALLEL_RENDERING=1

# Application
NODE_ENV=production
APP_BASE_URL=https://dufour.yourdomain.com
APP_DEFAULT_LOCALE=en-US

# Optional: External Services
GEOADMIN_API_KEY=your-api-key
SENTRY_DSN=your-sentry-dsn
```

### Nginx Configuration

Edit `nginx/nginx.conf` for custom domain:

```nginx
server {
    listen 80;
    server_name dufour.yourdomain.com;
    
    # SSL configuration (if using)
    # listen 443 ssl;
    # ssl_certificate /etc/ssl/certs/cert.pem;
    # ssl_certificate_key /etc/ssl/private/key.pem;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /qgis {
        proxy_pass http://qgis-server:80;
        proxy_set_header Host $host;
    }
}
```

### SSL/TLS Setup

**Using Let's Encrypt**:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dufour.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

**Manual Certificate**:

```nginx
ssl_certificate /etc/ssl/certs/your-cert.pem;
ssl_certificate_key /etc/ssl/private/your-key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

## Security

### Network Security

**Firewall Rules**:

```powershell
# Allow only necessary ports
# HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH (for management)
sudo ufw allow 22/tcp

# Deny direct access to backend services
sudo ufw deny 5432/tcp
sudo ufw deny 8080/tcp
```

**Docker Network Isolation**:

Services communicate via private network:

```yaml
networks:
  dufour-network:
    driver: bridge
    internal: false  # Set to true for complete isolation
```

### Database Security

**Strong Passwords**:

```powershell
# Generate strong password
$password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Access Control**:

Edit `postgis/init/01-init.sh`:

```bash
# Restrict access by IP
echo "host all all 10.0.0.0/8 md5" >> /var/lib/postgresql/data/pg_hba.conf
```

### Application Security

**CORS Configuration**:

Edit environment for QGIS Server:

```yaml
QGIS_SERVER_ALLOWED_ORIGINS: "https://dufour.yourdomain.com"
```

**Content Security Policy**:

Add to Nginx configuration:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.geo.admin.ch;";
```

## Monitoring

### Health Checks

**Service Status**:

```powershell
# Check all services
docker-compose ps

# Health check endpoints
curl http://localhost:8080/qgis?SERVICE=WMS&REQUEST=GetCapabilities
curl http://localhost:5432  # Should connect (use psql)
```

**Automated Monitoring**:

```yaml
# Add to docker-compose.prod.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging

**Centralized Logging**:

```powershell
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f postgis

# Save logs to file
docker-compose logs > dufour-logs.txt
```

**Log Rotation**:

Configure in `docker-compose.prod.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Performance Monitoring

**Resource Usage**:

```powershell
# Container stats
docker stats

# Detailed container info
docker inspect dufour-postgis
```

## Backup & Recovery

### Database Backup

**Manual Backup**:

```powershell
# Backup database
docker exec dufour-postgis pg_dump -U gisuser gisdb > backup-$(Get-Date -Format "yyyyMMdd-HHmmss").sql

# Backup to compressed file
docker exec dufour-postgis pg_dump -U gisuser -F c gisdb > backup.dump
```

**Automated Backup Script** (`backup.ps1`):

```powershell
$date = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = "backup-$date.sql"

docker exec dufour-postgis pg_dump -U gisuser gisdb > "backups/$backupFile"

# Keep only last 7 backups
Get-ChildItem backups/*.sql | Sort-Object LastWriteTime -Descending | Select-Object -Skip 7 | Remove-Item
```

**Schedule Backup**:

```powershell
# Windows Task Scheduler
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "C:\dufour-app\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
Register-ScheduledTask -TaskName "DufourBackup" -Action $action -Trigger $trigger
```

### Restore Database

```powershell
# Restore from backup
docker exec -i dufour-postgis psql -U gisuser gisdb < backup.sql

# Restore from compressed backup
docker exec -i dufour-postgis pg_restore -U gisuser -d gisdb -F c backup.dump
```

### Volume Backup

```powershell
# Backup Docker volumes
docker run --rm -v dufour-app_postgis-data:/data -v ${PWD}/backups:/backup alpine tar czf /backup/postgis-volume-$(Get-Date -Format "yyyyMMdd").tar.gz -C /data .
```

### Disaster Recovery

**Recovery Plan**:

1. **Restore Infrastructure**:
   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Restore Database**:
   ```powershell
   docker exec -i dufour-postgis psql -U gisuser gisdb < latest-backup.sql
   ```

3. **Verify Services**:
   ```powershell
   docker-compose ps
   curl http://localhost/health
   ```

4. **Test Application**:
   - Open web interface
   - Verify map loads
   - Check data integrity

## Troubleshooting Deployment

### Common Issues

**Port Already in Use**:

```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process
taskkill /PID <process-id> /F
```

**Container Won't Start**:

```powershell
# View container logs
docker logs dufour-postgis

# Check container status
docker inspect dufour-postgis

# Remove and recreate
docker-compose down
docker-compose up -d
```

**Database Connection Failed**:

```powershell
# Verify PostGIS is running
docker exec dufour-postgis pg_isready -U gisuser

# Check connection
docker exec -it dufour-postgis psql -U gisuser -d gisdb
```

**Build Failures**:

```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

---

**For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md)**  
**For user guide, see [GUIDE.md](GUIDE.md)**
