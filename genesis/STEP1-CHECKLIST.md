# Step 1 Verification Checklist

Use this checklist to verify that Step 1 is working correctly before proceeding to Step 2.

## Prerequisites ✓

- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] PowerShell available

## File Structure ✓

Verify all key files exist:

- [ ] `README.md`
- [ ] `LICENSE`
- [ ] `.gitignore`
- [ ] `docker-compose.yml`
- [ ] `docker-compose.prod.yml`
- [ ] `render.yaml`
- [ ] `.env.example`
- [ ] `start-dev.ps1`
- [ ] `SETUP.md`
- [ ] `Dockerfile.prod`
- [ ] `nginx/nginx.conf`
- [ ] `postgis/init/01-init.sh`
- [ ] `qgis-server/pg_service.conf`
- [ ] `frontend/package.json`
- [ ] `frontend/vite.config.js`
- [ ] `frontend/index.html`
- [ ] `frontend/Dockerfile.dev`
- [ ] `frontend/src/main.jsx`
- [ ] `frontend/src/store/store.js`
- [ ] `frontend/src/config/appConfig.js`
- [ ] `frontend/src/styles/index.css`
- [ ] `frontend/src/i18n/en-US.json`
- [ ] `frontend/src/i18n/de-CH.json`
- [ ] `frontend/src/i18n/fr-FR.json`
- [ ] `frontend/src/i18n/it-IT.json`

## Docker Services ✓

### Start Services

```powershell
docker-compose up -d postgis qgis-server
```

### Verify Services

- [ ] PostGIS container is running: `docker ps | Select-String dufour-postgis`
- [ ] QGIS Server container is running: `docker ps | Select-String dufour-qgis`
- [ ] PostGIS is healthy: `docker inspect dufour-postgis --format='{{.State.Health.Status}}'`
- [ ] QGIS Server is healthy: `docker inspect dufour-qgis --format='{{.State.Health.Status}}'`

### Test PostGIS

```powershell
docker exec -it dufour-postgis psql -U gisuser -d gisdb -c "SELECT PostGIS_version();"
```

Expected output: PostGIS version information

- [ ] PostGIS query returns version

### Test Database Schema

```powershell
docker exec -it dufour-postgis psql -U gisuser -d gisdb -c "\dn"
```

Expected schemas: public, user_data, scenarios, layers

- [ ] user_data schema exists
- [ ] scenarios schema exists
- [ ] layers schema exists

### Test QGIS Server

Open in browser: http://localhost:8080/cgi-bin/qgis_mapserv.fcgi?SERVICE=WMS&REQUEST=GetCapabilities

- [ ] QGIS Server responds (even if "Project file error" - this is expected without a project)

## Frontend ✓

### Install Dependencies

```powershell
cd frontend
npm install
```

- [ ] Dependencies installed without errors
- [ ] `node_modules` folder created
- [ ] `package-lock.json` created

### Start Development Server

```powershell
npm run dev
```

- [ ] Vite dev server starts
- [ ] No compilation errors
- [ ] Server running on http://localhost:5173

### Test in Browser

Open http://localhost:5173

Expected: A basic page loads (may show errors about missing QWC2 assets - this is OK for now)

- [ ] Page loads in browser
- [ ] No CORS errors in console
- [ ] No critical JavaScript errors

## Quick Start Script ✓

```powershell
.\start-dev.ps1
```

- [ ] Script runs without errors
- [ ] Docker services start
- [ ] Frontend dependencies install
- [ ] Development server starts

## Configuration Files ✓

### Verify Environment

- [ ] `.env.example` exists with all variables
- [ ] Can copy to `.env`: `Copy-Item .env.example .env`

### Verify App Config

Open `frontend/src/config/appConfig.js`:

- [ ] Swiss coordinates are correct (center: [830000, 5933000])
- [ ] EPSG:3857 projection is set
- [ ] 4 languages configured (en-US, de-CH, fr-FR, it-IT)

### Verify i18n Files

- [ ] All 4 translation files have the same structure
- [ ] All files are valid JSON

## Production Build Test ✓

### Build Frontend

```powershell
cd frontend
npm run build
```

- [ ] Build completes successfully
- [ ] `dist` folder is created
- [ ] No build errors

### Test Production Docker Build

```powershell
cd ..
docker-compose -f docker-compose.prod.yml build
```

- [ ] Build completes successfully
- [ ] No Docker errors

## Common Issues & Solutions

### Issue: Docker services not starting

**Solution**: 
```powershell
docker-compose down -v
docker-compose up -d
```

### Issue: PostGIS not healthy

**Solution**: Wait 30 seconds, check logs:
```powershell
docker-compose logs postgis
```

### Issue: Frontend dependencies fail

**Solution**:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Issue: Port already in use

**Solution**: Change ports in docker-compose.yml or stop conflicting services

### Issue: QWC2 module not found

**Expected**: This is normal for Step 1. QWC2 will be properly integrated in Step 2.

## Step 1 Status

If all checkboxes above are checked (except QWC2 warnings), Step 1 is complete! ✅

## Ready for Step 2?

Answer these questions:

1. **Are all Docker services healthy?** [ ]
2. **Does the frontend development server start?** [ ]
3. **Can you access PostGIS via psql?** [ ]
4. **Does the production build complete?** [ ]

If all answers are YES, you're ready to proceed to **Step 2: KADAS-Style UI & Core Plugin Integration**! 🚀

---

**Next**: Review the execution plan and confirm you're ready to start Step 2.
