# Step 2 Quick Test Script
# Run this to verify Step 2 implementation

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Step 2 - UI Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "✗ Please run this script from the intelligeo-app root directory" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Navigate to frontend
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Check key files exist
Write-Host ""
Write-Host "Checking Step 2 files..." -ForegroundColor Yellow

$files = @(
    "src/components/DufourApp.jsx",
    "src/components/RibbonToolbar.jsx",
    "src/components/MapComponent.jsx",
    "src/components/StatusBar.jsx",
    "src/components/SidePanel.jsx",
    "src/styles/ribbon.css",
    "src/components/panels/LayerTreePanel.jsx",
    "src/components/panels/SearchPanel.jsx"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "✗ Some files are missing. Please check Step 2 implementation." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Starting Development Server" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app will open at: " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test checklist:" -ForegroundColor Yellow
Write-Host "  ✓ Ribbon toolbar appears at top" -ForegroundColor White
Write-Host "  ✓ Click different tabs (Map, Draw, Measure, etc.)" -ForegroundColor White
Write-Host "  ✓ Click 'Layers' button → panel opens" -ForegroundColor White
Write-Host "  ✓ Click 'Search' button → search panel opens" -ForegroundColor White
Write-Host "  ✓ Click measurement tools → right panel opens" -ForegroundColor White
Write-Host "  ✓ Map shows SwissTopo base layer" -ForegroundColor White
Write-Host "  ✓ Pan and zoom the map" -ForegroundColor White
Write-Host "  ✓ Status bar shows coordinates" -ForegroundColor White
Write-Host "  ✓ Click Settings → change language" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
