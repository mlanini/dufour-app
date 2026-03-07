# Pre-Deployment Test Script for Windows
# Tests Docker build and container startup before pushing to Render

Write-Host "`n=========================================="
Write-Host "Pre-Deployment Checklist"
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Docker
Write-Host "`n1. Checking Docker..." -NoNewline
try {
    docker info 2>&1 | Out-Null
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "   Docker is not running. Start Docker Desktop and retry." -ForegroundColor Yellow
    exit 1
}

# 2. Check files exist
Write-Host "2. Checking required files..." -NoNewline
$requiredFiles = @(
    "backend\api\Dockerfile",
    "backend\api\requirements.txt",
    "render.yaml"
)
$allExist = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "   Missing: $file" -ForegroundColor Yellow
        $allExist = $false
    }
}
if ($allExist) {
    Write-Host " OK" -ForegroundColor Green
}

# 3. Build Docker image
Write-Host "3. Building Docker image (5-10 minutes)..." -ForegroundColor Yellow
Push-Location backend\api
$buildOutput = docker build -t dufour-api-test . 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Build successful!" -ForegroundColor Green
    $imageSize = docker images dufour-api-test --format "{{.Size}}"
    Write-Host "   Image size: $imageSize" -ForegroundColor Cyan
} else {
    Write-Host "   Build FAILED!" -ForegroundColor Red
    Write-Host "`nLast 20 lines of build output:" -ForegroundColor Yellow
    $buildOutput | Select-Object -Last 20
    exit 1
}

# 4. Test container
Write-Host "`n4. Testing container startup..." -ForegroundColor Yellow
$containerId = docker run -d -p 3001:3000 -p 8081:8080 `
    -e POSTGIS_HOST=postgresql-intelligeo.alwaysdata.net `
    -e POSTGIS_PORT=5432 `
    -e POSTGIS_DB=intelligeo_dufour `
    -e POSTGIS_USER=intelligeo_dufour `
    -e POSTGIS_PASSWORD=Dufour.00r `
    -e QGIS_SERVER_URL=http://localhost:8080 `
    dufour-api-test

Write-Host "   Container ID: $containerId" -ForegroundColor Cyan
Write-Host "   Waiting 15s for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if running
$running = docker ps --filter "id=$containerId" --format "{{.ID}}"
if ($running) {
    Write-Host "   Container is running!" -ForegroundColor Green
    
    # Test health endpoint
    Write-Host "`n5. Testing API health..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host " OK" -ForegroundColor Green
            Write-Host "   API responding at http://localhost:3001/" -ForegroundColor Cyan
        }
    } catch {
        Write-Host " WARNING" -ForegroundColor Yellow
        Write-Host "   API not responding yet (may need more startup time)" -ForegroundColor Yellow
    }
    
    # Show logs
    Write-Host "`nContainer logs (last 20 lines):"
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    docker logs --tail 20 $containerId
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    # Cleanup
    Write-Host "`n6. Cleanup..." -NoNewline
    docker stop $containerId | Out-Null
    docker rm $containerId | Out-Null
    Write-Host " OK" -ForegroundColor Green
    
} else {
    Write-Host "   Container FAILED to start!" -ForegroundColor Red
    Write-Host "`nContainer logs:" -ForegroundColor Yellow
    docker logs $containerId
    docker rm $containerId | Out-Null
    exit 1
}

# 7. Git status
Write-Host "`n7. Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   Uncommitted changes:" -ForegroundColor Yellow
    git status -s
    Write-Host "`n   Run: git add . && git commit -m 'Deploy ready'" -ForegroundColor Cyan
} else {
    Write-Host "   All changes committed!" -ForegroundColor Green
}

# Summary
Write-Host "`n=========================================="
Write-Host "PRE-DEPLOYMENT CHECKS PASSED" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nReady to deploy! Next steps:"
Write-Host "1. Push to GitHub: git push origin main"
Write-Host "2. Import render.yaml in Render dashboard"
Write-Host "3. Set POSTGIS_PASSWORD secret in Render"
Write-Host "4. Wait for deployment (~10 minutes)"
Write-Host "`nMonitor deployment at:"
Write-Host "  https://dashboard.render.com" -ForegroundColor Cyan
Write-Host ""
