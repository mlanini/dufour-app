# Quick Start Script for dufour.app
# Windows PowerShell

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  dufour.app Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host ""
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created. Please review and update if needed." -ForegroundColor Green
}

# Start Docker services
Write-Host ""
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d postgis qgis-server

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$postgisHealthy = $false
$qgisHealthy = $false
$maxAttempts = 30
$attempt = 0

while ((-not $postgisHealthy -or -not $qgisHealthy) -and $attempt -lt $maxAttempts) {
    $attempt++
    
    $postgisStatus = docker inspect --format='{{.State.Health.Status}}' dufour-postgis 2>$null
    $qgisStatus = docker inspect --format='{{.State.Health.Status}}' dufour-qgis 2>$null
    
    if ($postgisStatus -eq "healthy") { $postgisHealthy = $true }
    if ($qgisStatus -eq "healthy") { $qgisHealthy = $true }
    
    Write-Host "  PostGIS: $postgisStatus | QGIS Server: $qgisStatus" -ForegroundColor Gray
    
    if (-not $postgisHealthy -or -not $qgisHealthy) {
        Start-Sleep -Seconds 2
    }
}

if ($postgisHealthy -and $qgisHealthy) {
    Write-Host "✓ All services are healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠ Services may not be fully ready. Check logs with: docker-compose logs" -ForegroundColor Yellow
}

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path node_modules) {
    Write-Host "  Dependencies already installed, skipping..." -ForegroundColor Gray
} else {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Start development server
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  • PostGIS:      " -NoNewline -ForegroundColor White
Write-Host "localhost:5432" -ForegroundColor Cyan
Write-Host "  • QGIS Server:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "  • Frontend:     " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the development server" -ForegroundColor Gray
Write-Host ""

npm run dev
