"""
Dufour Middleware API
FastAPI server for managing QGIS projects and PostGIS data uploads
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from pathlib import Path
import tempfile
import httpx

from services.project_service import ProjectService
from services.data_service import DataService
from services.qwc_service import QWCService
from services.qgis_storage_service import storage_service
from services.project_migrator import ProjectMigrator
from models.schemas import ProjectResponse, TableSchema, UploadResponse
from database.connection import db

# Initialize FastAPI app
app = FastAPI(
    title="Dufour Middleware API",
    description="Content management system for QGIS projects in Dufour-app",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dufour-app.onrender.com",
        "http://localhost:5173",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
project_service = ProjectService()
data_service = DataService()
qwc_service = QWCService()
project_migrator = ProjectMigrator()

# Global exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    import traceback
    
    # Log the full error for debugging
    print(f"Global error handler caught: {type(exc).__name__}: {str(exc)}")
    print(traceback.format_exc())
    
    # Return JSON response with CORS headers
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# ==================== PROJECT ENDPOINTS ====================

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "online",
        "service": "Dufour Middleware API",
        "version": "1.0.0"
    }


@app.get("/api/status")
async def api_status():
    """
    API status with detailed information for debugging
    """
    import os
    from pathlib import Path
    
    projects_dir = Path(os.getenv('PROJECTS_DIR', '/data/projects'))
    qgis_server_url = os.getenv('QGIS_SERVER_URL', 'http://qgis-server:8080')
    
    # Check projects directory
    projects_exist = projects_dir.exists()
    if projects_exist:
        qgs_files = list(projects_dir.glob('*.qgs'))
        qgz_files = list(projects_dir.glob('*.qgz'))
        project_count = len(qgs_files) + len(qgz_files)
    else:
        project_count = 0
        qgs_files = []
        qgz_files = []
    
    # Check QGIS Server
    qgis_online = await project_service.check_qgis_server()
    
    return {
        "api": "online",
        "version": "1.0.0",
        "projects_dir": str(projects_dir),
        "projects_dir_exists": projects_exist,
        "project_count": project_count,
        "qgs_files": [f.name for f in qgs_files],
        "qgz_files": [f.name for f in qgz_files],
        "qgis_server": {
            "url": qgis_server_url,
            "online": qgis_online
        },
        "database": {
            "host": os.getenv('POSTGIS_HOST'),
            "db": os.getenv('POSTGIS_DB')
        }
    }


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects():
    """
    List all available QGIS projects
    Returns: List of projects with metadata
    """
    try:
        projects = await project_service.list_projects()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{project_name}")
async def get_project(project_name: str):
    """
    Get project details and configuration
    """
    try:
        project = await project_service.get_project(project_name)
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/projects")
async def upload_and_migrate_project(
    name: str = Form(..., description="Project identifier (lowercase, alphanumeric, underscore)"),
    title: Optional[str] = Form(None, description="Display title"),
    description: Optional[str] = Form(None, description="Project description"),
    is_public: bool = Form(False, description="Public visibility"),
    file: UploadFile = File(..., description="QGIS project file (.qgz)")
):
    """
    Upload QGIS project and migrate local layers to PostGIS
    
    Steps:
    1. Validate .qgz file (extension, size)
    2. Parse project structure (layers, CRS, extent)
    3. Extract local layers (GeoPackage, GeoJSON, etc.) to PostGIS tables
    4. Update .qgz datasources to reference PostGIS
    5. Store modified .qgz in database
    
    Returns:
        Project details with migration results
    """
    import uuid
    from datetime import datetime
    from sqlalchemy import text
    
    try:
        # Validate file extension
        if not file.filename.endswith('.qgz'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .qgz files are accepted"
            )
        
        # Validate project name format
        if not name.replace('_', '').isalnum() or not name.islower():
            raise HTTPException(
                status_code=400,
                detail="Project name must be lowercase alphanumeric with underscores only"
            )
        
        # Save uploaded file to temp location
        temp_file = Path(tempfile.mktemp(suffix='.qgz'))
        try:
            content = await file.read()
            
            # Validate file size (50MB limit)
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail="File size exceeds 50MB limit"
                )
            
            temp_file.write_bytes(content)
            
            # Migrate project: parse, extract layers, update datasources
            project_info, migration_results, modified_qgz_bytes = project_migrator.migrate_project(
                qgz_path=temp_file,
                project_name=name,
                target_crs='EPSG:2056'  # Swiss LV95
            )
            
            # Check if any migrations failed critically
            critical_failures = [r for r in migration_results if not r.success and r.error != "Skipped"]
            if critical_failures:
                # Rollback: drop created tables
                project_migrator.rollback_migration(name, migration_results)
                
                error_messages = [f"{r.layer_name}: {r.error}" for r in critical_failures]
                raise HTTPException(
                    status_code=500,
                    detail=f"Layer migration failed: {'; '.join(error_messages)}"
                )
            
            # Store project in database
            project_id = str(uuid.uuid4())
            insert_sql = text("""
                INSERT INTO projects (
                    id, user_id, name, title, description, is_public,
                    qgz_data, qgz_size, crs, extent, created_at, updated_at
                )
                VALUES (
                    :id, :user_id, :name, :title, :description, :is_public,
                    :qgz_data, :qgz_size, :crs, 
                    ST_MakeEnvelope(:xmin, :ymin, :xmax, :ymax, :srid),
                    :created_at, :updated_at
                )
            """)
            
            with db.get_engine().connect() as conn:
                conn.execute(insert_sql, {
                    'id': project_id,
                    'user_id': None,  # TODO: Get from auth context
                    'name': name,
                    'title': title or project_info.title,
                    'description': description,
                    'is_public': is_public,
                    'qgz_data': modified_qgz_bytes,
                    'qgz_size': len(modified_qgz_bytes),
                    'crs': project_info.crs,
                    'xmin': project_info.extent[0],
                    'ymin': project_info.extent[1],
                    'xmax': project_info.extent[2],
                    'ymax': project_info.extent[3],
                    'srid': 2056,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                })
                conn.commit()
            
            # Store layer metadata
            for migration_result in migration_results:
                if migration_result.success:
                    layer_info = next(
                        (l for l in project_info.layers if l.name == migration_result.layer_name),
                        None
                    )
                    if layer_info:
                        insert_layer_sql = text("""
                            INSERT INTO project_layers (
                                id, project_id, layer_name, layer_type, 
                                geometry_type, table_name, datasource
                            )
                            VALUES (
                                :id, :project_id, :layer_name, :layer_type,
                                :geometry_type, :table_name, :datasource
                            )
                        """)
                        
                        with db.get_engine().connect() as conn:
                            conn.execute(insert_layer_sql, {
                                'id': str(uuid.uuid4()),
                                'project_id': project_id,
                                'layer_name': layer_info.name,
                                'layer_type': layer_info.layer_type,
                                'geometry_type': layer_info.geometry_type,
                                'table_name': migration_result.table_name,
                                'datasource': 'postgis'
                            })
                            conn.commit()
            
            # Build response
            successful_migrations = [r for r in migration_results if r.success]
            failed_migrations = [r for r in migration_results if not r.success]
            
            return {
                "success": True,
                "project": {
                    "id": project_id,
                    "name": name,
                    "title": title or project_info.title,
                    "description": description,
                    "is_public": is_public,
                    "crs": project_info.crs,
                    "extent": project_info.extent,
                    "layers_count": len(project_info.layers),
                    "qgz_size": len(modified_qgz_bytes)
                },
                "migration": {
                    "total_layers": len(project_info.layers),
                    "migrated": len(successful_migrations),
                    "failed": len(failed_migrations),
                    "details": [
                        {
                            "layer_name": r.layer_name,
                            "table_name": r.table_name,
                            "features_count": r.features_count,
                            "geometry_type": r.geometry_type,
                            "success": r.success,
                            "error": r.error
                        }
                        for r in migration_results
                    ]
                }
            }
            
        finally:
            # Clean up temp file
            if temp_file.exists():
                temp_file.unlink()
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Upload and migration error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload and migrate project: {str(e)}"
        )


@app.post("/api/projects/publish")
async def publish_project(
    name: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    """
    Publish a new QGIS project
    Accepts: .qgs or .qgz file from QGIS Desktop plugin
    Returns: Project details and WMS URL
    """
    try:
        # Validate file extension
        if not file.filename.endswith(('.qgs', '.qgz')):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .qgs and .qgz files are accepted"
            )
        
        # Read file content
        content = await file.read()
        
        # Publish project
        result = await project_service.publish_project(
            name=name,
            title=title or name,
            description=description,
            file_content=content,
            filename=file.filename
        )
        
        # Generate QWC2 theme configuration
        await qwc_service.generate_theme_config(name)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to publish project: {str(e)}")


@app.delete("/api/projects/{project_name}")
async def delete_project(project_name: str):
    """
    Delete a QGIS project
    """
    try:
        result = await project_service.delete_project(project_name)
        if not result:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"message": f"Project {project_name} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DATA UPLOAD ENDPOINTS ====================

@app.post("/api/databases/{db_name}/tables")
async def create_table(db_name: str, schema: TableSchema):
    """
    Create a new table in PostGIS database
    Used by QGIS plugin to prepare tables for data upload
    """
    try:
        result = await data_service.create_table(db_name, schema)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/databases/{db_name}/tables/{table_name}/upload")
async def upload_features(
    db_name: str,
    table_name: str,
    schema: str = Form("public"),
    file: UploadFile = File(...)
):
    """
    Bulk upload features to PostGIS table
    Accepts: CSV data in COPY format from QGIS plugin
    """
    try:
        content = await file.read()
        
        result = await data_service.bulk_insert(
            db_name=db_name,
            schema=schema,
            table_name=table_name,
            data=content
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/databases/{db_name}/tables")
async def list_tables(db_name: str, schema: str = "public"):
    """
    List all tables in database schema
    """
    try:
        tables = await data_service.list_tables(db_name, schema)
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== QWC ENDPOINTS ====================

@app.get("/api/v1/themes")
async def list_themes():
    """
    List available QWC2 themes (projects)
    Compatible with QWC2 frontend
    """
    try:
        themes = await qwc_service.list_themes()
        return {"themes": themes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/themes/{theme_name}")
async def get_theme_config(theme_name: str):
    """
    Get QWC2 theme configuration for a project
    Returns layer tree, capabilities, and settings
    """
    try:
        config = await qwc_service.get_theme_config(theme_name)
        if not config:
            raise HTTPException(status_code=404, detail="Theme not found")
        return config
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== UTILITY ENDPOINTS ====================

@app.get("/api/status")
async def get_status():
    """
    Get system status: database, QGIS Server, storage
    """
    try:
        status = {
            "database": await data_service.check_connection(),
            "qgis_server": await project_service.check_qgis_server(),
            "projects_count": len(await project_service.list_projects()),
            "storage_used": await project_service.get_storage_usage()
        }
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== QGIS PROJECT STORAGE ENDPOINTS ====================

@app.get("/api/projects")
async def list_qgis_projects():
    """
    List all stored QGIS projects
    
    Returns:
        List of projects with metadata
    """
    try:
        projects = storage_service.list_projects()
        return {"projects": projects, "count": len(projects)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{project_name}/wms")
async def wms_proxy(project_name: str, request: Request):
    """
    WMS proxy for stored QGIS projects
    
    Retrieves .qgz from PostgreSQL, exports to temp file, forwards to QGIS Server
    
    Args:
        project_name: Project identifier
        request: FastAPI request with query params (SERVICE, REQUEST, etc)
    
    Returns:
        WMS response (GetCapabilities XML, GetMap PNG, etc)
    """
    try:
        # 1. Retrieve .qgz from PostgreSQL BYTEA
        qgz_bytes = storage_service.retrieve_qgz(project_name)
        if not qgz_bytes:
            raise HTTPException(status_code=404, detail=f"Project {project_name} not found")
        
        # 2. Export to temporary file (QGIS Server needs filesystem path)
        temp_dir = Path(tempfile.gettempdir()) / 'dufour_qgis_projects'
        temp_dir.mkdir(exist_ok=True)
        temp_path = temp_dir / f"{project_name}.qgz"
        
        # Cache: only write if not exists or outdated
        if not temp_path.exists() or temp_path.stat().st_size != len(qgz_bytes):
            temp_path.write_bytes(qgz_bytes)
        
        # 3. Forward to QGIS Server with MAP parameter
        qgis_server_url = os.getenv('QGIS_SERVER_URL', 'http://localhost:8080/cgi-bin/qgis_mapserv.fcgi')
        
        # Build query string with MAP parameter
        query_params = dict(request.query_params)
        query_params['MAP'] = str(temp_path)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(qgis_server_url, params=query_params)
            
            # Return QGIS Server response with correct Content-Type
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
        raise HTTPException(status_code=500, detail=f"WMS proxy error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    )
