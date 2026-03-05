# publish-to-github.ps1
# Script to prepare and publish Dufour.app to GitHub

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Dufour.app - GitHub Publication" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "README.md")) {
    Write-Host "ERROR: README.md not found" -ForegroundColor Red
    Write-Host "Please run this script from the dufour-app root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Check for sensitive files
Write-Host "Checking for sensitive files..." -ForegroundColor Yellow
$sensitiveFiles = @(".env", ".env.local", ".env.production", "secrets/")
$foundSensitive = $false
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Write-Host "  WARNING: Found sensitive file: $file" -ForegroundColor Red
        $foundSensitive = $true
    }
}
if ($foundSensitive) {
    Write-Host ""
    $continue = Read-Host "Sensitive files found. These are in .gitignore but be careful. Continue? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}
Write-Host "✓ Sensitive files check complete" -ForegroundColor Green
Write-Host ""

# Initialize git if not already
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git repository already initialized" -ForegroundColor Green
}
Write-Host ""

# Show current status
Write-Host "Current Git Status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Ask for confirmation
Write-Host "Ready to prepare for publication" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Add all files to git" -ForegroundColor White
Write-Host "  2. Create initial commit" -ForegroundColor White
Write-Host "  3. Set up remote repository" -ForegroundColor White
Write-Host "  4. Create v0.1.0 tag" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# Stage all files
Write-Host ""
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .
Write-Host "✓ Files staged" -ForegroundColor Green

# Create initial commit
Write-Host ""
Write-Host "Creating initial commit..." -ForegroundColor Yellow
$commitMsg = "Initial commit: Dufour.app v0.1.0

- React 18 + OpenLayers 9 frontend
- QGIS Server integration
- PostGIS spatial database
- Military symbology (APP-6)
- ORBAT manager
- Scenario planning with timeline
- Swiss base maps integration
- Multi-language support (EN, DE, FR, IT)
- Docker Compose deployment
- Comprehensive documentation"

git commit -m $commitMsg
Write-Host "✓ Initial commit created" -ForegroundColor Green

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host ""
    Write-Host "Remote 'origin' already exists: $remoteExists" -ForegroundColor Yellow
    $changeRemote = Read-Host "Change remote URL? (y/N)"
    if ($changeRemote -eq "y" -or $changeRemote -eq "Y") {
        git remote remove origin
        $remoteExists = $null
    }
}

# Add remote if not exists
if (-not $remoteExists) {
    Write-Host ""
    Write-Host "Setting up remote repository..." -ForegroundColor Yellow
    $repoUrl = "https://github.com/mlanini/dufour-app.git"
    Write-Host "Remote URL: $repoUrl" -ForegroundColor Cyan
    $confirmUrl = Read-Host "Use this URL? (Y/n)"
    if ($confirmUrl -eq "n" -or $confirmUrl -eq "N") {
        $repoUrl = Read-Host "Enter repository URL"
    }
    
    git remote add origin $repoUrl
    Write-Host "✓ Remote repository configured" -ForegroundColor Green
}

# Rename branch to main if needed
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host ""
    Write-Host "Renaming branch to 'main'..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✓ Branch renamed to main" -ForegroundColor Green
}

# Create tag
Write-Host ""
Write-Host "Creating release tag v0.1.0..." -ForegroundColor Yellow
git tag -a v0.1.0 -m "Release v0.1.0 - Initial Release

First public release of Dufour.app
See CHANGELOG.md for full details"
Write-Host "✓ Tag v0.1.0 created" -ForegroundColor Green

# Show next steps
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Repository Prepared Successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create GitHub repository:" -ForegroundColor White
Write-Host "   - Go to https://github.com/new" -ForegroundColor Gray
Write-Host "   - Name: dufour-app" -ForegroundColor Gray
Write-Host "   - Description: A KADAS-inspired web GIS application" -ForegroundColor Gray
Write-Host "   - Public repository" -ForegroundColor Gray
Write-Host "   - Don't initialize with README" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "   git push origin v0.1.0" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Configure repository:" -ForegroundColor White
Write-Host "   - Add topics: gis, military, mapping, qgis, react, openlayers" -ForegroundColor Gray
Write-Host "   - Enable Discussions" -ForegroundColor Gray
Write-Host "   - Enable Dependabot" -ForegroundColor Gray
Write-Host "   - Enable vulnerability reporting" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Create GitHub Release:" -ForegroundColor White
Write-Host "   - Go to Releases → Create new release" -ForegroundColor Gray
Write-Host "   - Choose tag: v0.1.0" -ForegroundColor Gray
Write-Host "   - Title: Dufour.app v0.1.0 - Initial Release" -ForegroundColor Gray
Write-Host "   - Copy content from CHANGELOG.md" -ForegroundColor Gray
Write-Host ""

$pushNow = Read-Host "Push to GitHub now? (requires repository to be created) (y/N)"
if ($pushNow -eq "y" -or $pushNow -eq "Y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    
    try {
        git push -u origin main
        Write-Host "✓ Main branch pushed" -ForegroundColor Green
        
        git push origin v0.1.0
        Write-Host "✓ Tag pushed" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🎉 Successfully published to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repository: https://github.com/mlanini/dufour-app" -ForegroundColor Cyan
    }
    catch {
        Write-Host ""
        Write-Host "ERROR: Failed to push to GitHub" -ForegroundColor Red
        Write-Host "Make sure the repository exists and you have access" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You can push manually later with:" -ForegroundColor Yellow
        Write-Host "  git push -u origin main" -ForegroundColor Cyan
        Write-Host "  git push origin v0.1.0" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Repository prepared but not pushed." -ForegroundColor Yellow
    Write-Host "When ready, run:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
    Write-Host "  git push origin v0.1.0" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "See PUBLICATION.md for complete checklist" -ForegroundColor Gray
Write-Host ""
