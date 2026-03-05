# Setup Guide for dufour.app

This guide will walk you through setting up and running dufour.app locally and deploying to production.

## Prerequisites

- **Docker Desktop** (for local development)
- **Node.js 18+** (for frontend development)
- **Git** (for version control)
- **Render.com account** (for deployment - free tier available)

## Local Development Setup

### 1. Clone the Repository

```powershell
git clone <your-repository-url>
cd intelligeo-app
```

### 2. Create Environment File

```powershell
Copy-Item .env.example .env
```

Edit `.env` and update the values as needed for your local environment.

### 3. Start Docker Services

Start PostgreSQL + QGIS Server:

```powershell
docker-compose up -d postgis qgis-server
```

Wait for services to be healthy (check with `docker-compose ps`).

### 4. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

### 5. Start Development Server

```powershell
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **QGIS Server**: http://localhost:8080/cgi-bin/qgis_mapserv.fcgi
- **PostGIS**: localhost:5432

### 6. Initial Database Setup

The database is automatically initialized with the schema when PostGIS starts.
You can verify by connecting to PostgreSQL:

```powershell
docker exec -it dufour-postgis psql -U gisuser -d gisdb
```

## Creating a QGIS Project

To serve your own maps:

1. **Install QGIS Desktop** (https://qgis.org/download/)

2. **Open QGIS** and create a new project

3. **Add Data Sources**:
   - Add Swiss base layers from geo.admin.ch WMS/WMTS
   - Connect to local PostGIS: 
     - Host: localhost
     - Port: 5432
     - Database: gisdb
     - User: gisuser
     - Password: gispassword

4. **Configure Project Properties** (Project → Properties):
   - **QGIS Server** tab:
     - Enable "Service Capabilities"
     - Set title, abstract, keywords
     - Enable WMS/WFS/WMTS
     - Add CRS: EPSG:3857, EPSG:4326, EPSG:2056
   - **General** tab:
     - Set project CRS to EPSG:3857

5. **Save Project**:
   ```
   Save as: qgis-server/projects/dufour.qgs
   ```

6. **Restart QGIS Server**:
   ```powershell
   docker-compose restart qgis-server
   ```

7. **Test**: Visit http://localhost:8080/cgi-bin/qgis_mapserv.fcgi?SERVICE=WMS&REQUEST=GetCapabilities

## Production Build

### Build for Production

```powershell
# Build frontend
cd frontend
npm run build

# Build all containers
cd ..
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

Production app will be at: http://localhost

## Deploying to Render.com

### Option 1: Using Render Blueprint (Recommended)

1. **Push to GitHub**:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Update render.yaml**:
   - Edit `render.yaml`
   - Replace `YOUR_USERNAME` with your GitHub username

3. **Deploy to Render**:
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select `render.yaml`
   - Click "Apply"

Render will automatically:
- Create PostgreSQL database with PostGIS
- Build and deploy the web service
- Set up environment variables
- Configure health checks

### Option 2: Manual Deployment

1. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: dufour-postgres
   - Database: gisdb
   - User: gisuser
   - Region: Frankfurt (or nearest)
   - Plan: Free

2. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: dufour-app
   - Runtime: Docker
   - Docker Build Context: .
   - Dockerfile Path: ./Dockerfile.prod
   - Plan: Free

3. **Configure Environment Variables**:
   Add these in the web service settings:
   - `PORT`: 80
   - `POSTGRES_DB`: gisdb
   - `POSTGRES_USER`: (from database)
   - `POSTGRES_PASSWORD`: (from database)
   - `DATABASE_URL`: (from database internal URL)

4. **Deploy**: Click "Manual Deploy" → "Deploy latest commit"

### Post-Deployment

After deployment:

1. **Upload QGIS Project**:
   - You'll need to manually upload your QGIS project
   - Option A: Use Render.com persistent disk
   - Option B: Host project file externally (S3, GitHub)

2. **Test Deployment**:
   - Visit your Render.com URL (e.g., https://dufour-app.onrender.com)
   - Check health endpoint: https://your-app.onrender.com/health

3. **Custom Domain** (optional):
   - Render Dashboard → Settings → Custom Domain
   - Add your domain (e.g., dufour.app)
   - Update DNS records as instructed

## Troubleshooting

### QGIS Server Not Starting

Check logs:
```powershell
docker-compose logs qgis-server
```

Common issues:
- QGIS project file not found: Ensure `dufour.qgs` exists in `qgis-server/projects/`
- PostGIS connection failed: Check `pg_service.conf` credentials

### Frontend Build Errors

```powershell
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

Test connection:
```powershell
docker exec -it dufour-postgis pg_isready -U gisuser
```

Reset database:
```powershell
docker-compose down -v
docker-compose up -d postgis
```

### Render.com Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- 512 MB RAM limit
- 750 hours/month of runtime
- Slow cold starts (30-60 seconds)

**Tip**: For production use, consider upgrading to paid plans for better performance.

## Next Steps

- ✅ Step 1 Complete: Base infrastructure is running
- 🔜 Step 2: Implement KADAS-style UI components
- 🔜 Step 3: Integrate Swiss geo.admin.ch services
- 🔜 Step 4: Add ORBAT Mapper military symbols
- 🔜 Step 5: Implement terrain analysis tools

See [README.md](./README.md) for the full roadmap.

## Support

For issues or questions:
- Check [Documentation](./docs/)
- Open an issue on GitHub
- Contact: support@dufour.app (placeholder)
