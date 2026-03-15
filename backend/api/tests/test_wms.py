"""
Minimal test FastAPI + QGIS Storage
"""
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
import tempfile
import httpx

from services.qgis_storage_service import storage_service

app = FastAPI(title="QGIS Storage Test")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "service": "QGIS Storage Test"}

@app.get("/api/projects")
async def list_projects():
    try:
        projects = storage_service.list_projects()
        return {"projects": projects, "count": len(projects)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_name}/wms")
async def wms_proxy(project_name: str, request: Request):
    try:
        # Retrieve .qgz from PostgreSQL
        qgz_bytes = storage_service.retrieve_qgz(project_name)
        if not qgz_bytes:
            raise HTTPException(status_code=404, detail=f"Project {project_name} not found")
        
        # Export to temp file
        temp_dir = Path(tempfile.gettempdir()) / 'dufour_qgis_projects'
        temp_dir.mkdir(exist_ok=True)
        temp_path = temp_dir / f"{project_name}.qgz"
        
        if not temp_path.exists() or temp_path.stat().st_size != len(qgz_bytes):
            temp_path.write_bytes(qgz_bytes)
        
        # Forward to QGIS Server
        qgis_server_url = os.getenv('QGIS_SERVER_URL', 'http://localhost:8080')
        query_params = dict(request.query_params)
        query_params['MAP'] = str(temp_path)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(qgis_server_url, params=query_params)
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers={
                    'Content-Type': response.headers.get('Content-Type', 'application/xml'),
                    'Access-Control-Allow-Origin': '*'
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"WMS proxy error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
