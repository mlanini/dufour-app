# QGIS Server Projects

This directory contains QGIS project files (.qgs or .qgz) that are served by QGIS Server.

## Default Project

The main project file is `dufour.qgs` which will be created during setup.

## Project Configuration

To create a new QGIS project:

1. Open QGIS Desktop
2. Add your layers (PostGIS connections, WMS/WFS services, local files)
3. Configure layer properties, symbology, and metadata
4. Set project CRS (recommended: EPSG:3857 for web mapping)
5. Save as `dufour.qgs` in this directory

## Project Settings for Web Serving

In QGIS Desktop, configure these project properties (Project → Properties):

### QGIS Server Tab:
- Enable "Service Capabilities"
- Set service title, abstract, and keywords
- Configure WMS/WFS capabilities
- Enable coordinate systems for web (EPSG:3857, EPSG:4326, EPSG:2056 for Switzerland)

### Data Sources Tab:
- Use relative paths for portability
- Or use PostgreSQL service file connections (pg_service.conf)

## Directory Structure

```
projects/
├── dufour.qgs           # Main project file
├── symbols/             # Custom symbol libraries
├── styles/              # Layer styles (QML files)
└── data/               # Local geodata files
    ├── vector/
    └── raster/
```

## Example PostGIS Connection in QGIS

Instead of hardcoding connection details, use the pg_service:

```
Service=gisdb
```

This references the connection defined in `pg_service.conf`.
