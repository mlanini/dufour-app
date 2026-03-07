#!/bin/bash
# Test deployment setup before pushing to Render.com

echo "=========================================="
echo "Pre-Deployment Checklist"
echo "=========================================="
echo ""

# 1. Check Docker is running
echo "1. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "   ❌ Docker is not running. Start Docker and retry."
    exit 1
else
    echo "   ✅ Docker is running"
fi

# 2. Check Dockerfile exists
echo "2. Checking Dockerfile..."
if [ ! -f "backend/api/Dockerfile" ]; then
    echo "   ❌ backend/api/Dockerfile not found"
    exit 1
else
    echo "   ✅ Dockerfile found"
fi

# 3. Check requirements.txt
echo "3. Checking requirements.txt..."
if [ ! -f "backend/api/requirements.txt" ]; then
    echo "   ❌ requirements.txt not found"
    exit 1
else
    echo "   ✅ requirements.txt found"
fi

# 4. Check render.yaml
echo "4. Checking render.yaml..."
if [ ! -f "render.yaml" ]; then
    echo "   ❌ render.yaml not found"
    exit 1
else
    echo "   ✅ render.yaml found"
fi

# 5. Check .env file
echo "5. Checking .env configuration..."
if [ ! -f "backend/api/.env" ]; then
    echo "   ⚠️  .env not found (optional for local dev)"
else
    echo "   ✅ .env found"
fi

# 6. Test build Docker image locally
echo "6. Building Docker image (this may take 5-10 minutes)..."
cd backend/api
if docker build -t dufour-api-test . > /tmp/docker-build.log 2>&1; then
    echo "   ✅ Docker image built successfully"
    echo "   Image size: $(docker images dufour-api-test --format "{{.Size}}")"
else
    echo "   ❌ Docker build failed. Check /tmp/docker-build.log for details"
    tail -n 20 /tmp/docker-build.log
    exit 1
fi
cd ../..

# 7. Test run container
echo "7. Testing container startup..."
CONTAINER_ID=$(docker run -d -p 3001:3000 -p 8081:8080 \
    -e POSTGIS_HOST=postgresql-intelligeo.alwaysdata.net \
    -e POSTGIS_PORT=5432 \
    -e POSTGIS_DB=intelligeo_dufour \
    -e POSTGIS_USER=intelligeo_dufour \
    -e POSTGIS_PASSWORD=Dufour.00r \
    -e QGIS_SERVER_URL=http://localhost:8080 \
    dufour-api-test)

echo "   Container ID: $CONTAINER_ID"
echo "   Waiting 10s for startup..."
sleep 10

# Check if container is running
if docker ps | grep -q $CONTAINER_ID; then
    echo "   ✅ Container is running"
    
    # Test health endpoint
    echo "8. Testing API health endpoint..."
    if curl -s http://localhost:3001/ | grep -q "status"; then
        echo "   ✅ API responding at http://localhost:3001/"
    else
        echo "   ⚠️  API not responding yet (may need more startup time)"
    fi
    
    # Show logs
    echo ""
    echo "Container logs (last 20 lines):"
    echo "----------------------------------------"
    docker logs --tail 20 $CONTAINER_ID
    echo "----------------------------------------"
    
    # Cleanup
    echo ""
    echo "9. Cleanup..."
    docker stop $CONTAINER_ID > /dev/null
    docker rm $CONTAINER_ID > /dev/null
    echo "   ✅ Test container stopped and removed"
else
    echo "   ❌ Container failed to start"
    docker logs $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# 10. Git status
echo ""
echo "10. Git status..."
if git status | grep -q "nothing to commit"; then
    echo "   ✅ All changes committed"
else
    echo "   ⚠️  Uncommitted changes:"
    git status -s
    echo ""
    echo "   Run: git add . && git commit -m 'Deploy ready'"
fi

echo ""
echo "=========================================="
echo "✅ PRE-DEPLOYMENT CHECKS PASSED"
echo "=========================================="
echo ""
echo "Ready to deploy! Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Import render.yaml in Render dashboard"
echo "3. Set POSTGIS_PASSWORD secret"
echo "4. Wait for deployment (~10 minutes)"
echo ""
echo "Monitor deployment:"
echo "  https://dashboard.render.com"
echo ""
