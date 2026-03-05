# Dufour.app Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Services](#backend-services)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [Security Architecture](#security-architecture)
10. [Performance Considerations](#performance-considerations)

## System Overview

Dufour.app is a modern web-based GIS application designed as a lightweight alternative to KADAS Albireo. It provides military-grade mapping, analysis, and planning capabilities through a browser-based interface.

### Design Principles

- **Browser-First**: No desktop installation required
- **Component-Based**: Modular React architecture
- **Standards-Compliant**: OGC WMS/WFS/WCS, APP-6 symbology
- **Responsive**: Mobile and desktop support
- **Multilingual**: i18n support for 4 languages
- **Extensible**: Plugin architecture for custom features

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Web Browser                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         React Frontend (Port 5173/80)             │ │
│  │  - OpenLayers Map                                 │ │
│  │  - Redux State Management                         │ │
│  │  - Military Symbology Renderer                    │ │
│  └──────────┬────────────────────────────────────────┘ │
└─────────────┼───────────────────────────────────────────┘
              │
         HTTPS/HTTP
              │
┌─────────────▼───────────────────────────────────────────┐
│              Nginx Reverse Proxy (Port 80/443)          │
│  - Static file serving                                  │
│  - API routing                                          │
│  - SSL termination                                      │
└─────┬───────────────────────────────┬───────────────────┘
      │                               │
      │ /qgis/*                       │ /api/*
      │                               │
┌─────▼──────────────────┐   ┌────────▼──────────────────┐
│   QGIS Server (8080)   │   │  PostGIS Database (5432)  │
│  - WMS/WFS/WCS         │◄──┤  - Spatial data           │
│  - Map rendering       │   │  - Feature storage        │
│  - Feature queries     │   │  - ORBAT data             │
└────────────────────────┘   └───────────────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React | 18.2+ | UI component library |
| State Management | Redux Toolkit | 2.2+ | Global state management |
| Map Library | OpenLayers | 9.1+ | Map rendering and interaction |
| Build Tool | Vite | 5.1+ | Fast development and bundling |
| UI Components | Custom | - | KADAS-inspired interface |
| Styling | CSS Modules | - | Component-scoped styles |
| Internationalization | Custom i18n | - | Multi-language support |

### Backend

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Map Server | QGIS Server | 3.34+ | OGC-compliant map services |
| Database | PostgreSQL | 15+ | Relational database |
| Spatial Extension | PostGIS | 3.4+ | Spatial data types and functions |
| Web Server | Nginx | 1.25+ | Reverse proxy and static serving |
| Container Platform | Docker | 20.10+ | Containerization |
| Orchestration | Docker Compose | 2.0+ | Multi-container management |

### External Services

- **geo.admin.ch**: Swiss Federal Geoportal (base maps, search)
- **SwissGrid**: Swiss coordinate system (EPSG:2056, EPSG:21781)
- **Swiss Geoportal API**: Location search and geocoding

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── DufourApp.jsx              # Main application container
│   ├── RibbonToolbar.jsx          # Top toolbar with tabs
│   ├── MapComponent.jsx           # OpenLayers map wrapper
│   ├── StatusBar.jsx              # Bottom status bar
│   ├── SidePanel.jsx              # Left/right panel container
│   │
│   ├── MapEditPanel.jsx           # Map view controls
│   ├── GridEditPanel.jsx          # Grid overlay controls
│   ├── ChartEditPanel.jsx         # Chart view controls
│   │
│   ├── OrbatManager.jsx           # Military ORBAT tree
│   ├── MilitarySymbolEditor.jsx  # Symbol placement tool
│   ├── ScenarioManager.jsx        # Temporal scenario editor
│   ├── TimelineControls.jsx      # Time animation controls
│   │
│   ├── panels/
│   │   ├── LayerTreePanel.jsx    # Layer management
│   │   ├── SearchPanel.jsx       # Location search
│   │   ├── ImportPanel.jsx       # File import
│   │   ├── SettingsPanel.jsx     # App settings
│   │   ├── MeasurementPanel.jsx  # Measurement tools
│   │   ├── RedliningPanel.jsx    # Drawing tools
│   │   ├── TerrainPanel.jsx      # Terrain analysis
│   │   └── PrintPanel.jsx        # Map export
│   │
│   └── icons/
│       └── Icons.jsx              # SVG icon components
│
├── services/
│   ├── militarySymbols.js        # APP-6 symbol generation
│   ├── orbatModel.js             # ORBAT data model
│   ├── orbatConverter.js         # ORBAT format conversion
│   ├── temporalLayer.js          # Time-based layer
│   ├── fileImport.js             # File parsing (GeoJSON, KML)
│   ├── geoAdminSearch.js         # geo.admin.ch API
│   └── swissLayers.js            # Swiss base map configs
│
├── layers/
│   └── MilitaryLayer.js          # Custom vector layer
│
├── store/
│   └── store.js                  # Redux store configuration
│
├── config/
│   └── appConfig.js              # Application configuration
│
├── i18n/
│   ├── en-US.json                # English translations
│   ├── de-CH.json                # German translations
│   ├── fr-FR.json                # French translations
│   └── it-IT.json                # Italian translations
│
└── styles/
    ├── index.css                 # Global styles
    ├── ribbon.css                # Toolbar styles
    ├── orbat-manager.css         # ORBAT tree styles
    ├── military-editor.css       # Symbol editor styles
    └── responsive.css            # Mobile responsive styles
```

### Key Component Interactions

```
┌─────────────────┐
│   DufourApp     │  Main container, manages global state
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬───────────┐
    │          │          │           │
┌───▼────┐ ┌──▼──────┐ ┌─▼────────┐ ┌▼────────┐
│ Ribbon │ │   Map   │ │SidePanel │ │StatusBar│
│Toolbar │ │Component│ │          │ │         │
└────────┘ └─────────┘ └──────────┘ └─────────┘
    │          │            │
    │          └────────────┼─── Tool Activation
    │                       │
    └───────────────────────┴─── Panel Content
```

## Data Flow

### Application State Flow

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌─────────────┐
│   Redux      │◄─────┤  Component  │
│   Action     │      │   (View)    │
└──────┬───────┘      └─────▲───────┘
       │                    │
       ▼                    │
┌──────────────┐            │
│   Reducer    │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│  State Tree  │────────────┘
└──────────────┘
```

### Map Data Flow

```
┌──────────────┐
│  geo.admin   │  Swiss base maps
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌────────────────┐
│  QGIS Server │────►│  OpenLayers    │
│  (WMS/WFS)   │     │  Map Instance  │
└──────┬───────┘     └────────┬───────┘
       │                      │
       ▼                      ▼
┌──────────────┐     ┌────────────────┐
│   PostGIS    │     │   Canvas       │
│   Database   │     │   (Browser)    │
└──────────────┘     └────────────────┘
```

### Military Symbol Rendering

```
┌──────────────┐
│ ORBAT Data   │  JSON structure
└──────┬───────┘
       │
       ▼
┌──────────────┐
│militarySymbol│  Generate APP-6 symbol
│   Service    │  (Canvas-based)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ SVG/Canvas   │  Symbol imagery
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ OpenLayers   │  Display on map
│ VectorLayer  │
└──────────────┘
```

## Frontend Architecture

### State Management (Redux)

**Store Structure**:

```javascript
{
  locale: {
    current: 'en-US',
    available: ['en-US', 'de-CH', 'fr-FR', 'it-IT']
  },
  map: {
    center: [2660000, 1190000],  // Swiss LV95
    zoom: 8,
    scale: 50000,
    rotation: 0,
    extent: [...],
    projection: 'EPSG:2056'
  },
  layers: {
    basemap: 'pixelkarte',
    overlays: [
      { id: 'layer1', visible: true, opacity: 1.0, ... }
    ],
    militaryLayer: { ... }
  },
  tools: {
    active: 'pan',  // 'pan', 'identify', 'measure', etc.
    measureType: 'distance',
    drawType: 'point'
  },
  orbat: {
    units: {
      'unit-1': {
        id: 'unit-1',
        name: '1st Brigade',
        symbol: '10031000001211000000',
        position: [2660000, 1190000],
        parent: null,
        children: ['unit-2', 'unit-3']
      }
    },
    activeUnit: 'unit-1'
  },
  scenarios: {
    active: 'scenario-1',
    scenarios: {
      'scenario-1': {
        id: 'scenario-1',
        name: 'Operation Alpha',
        startTime: '2026-03-05T08:00:00Z',
        events: [...]
      }
    }
  },
  timeline: {
    currentTime: '2026-03-05T08:00:00Z',
    playing: false,
    speed: 1.0
  }
}
```

### OpenLayers Integration

**Map Initialization**:

```javascript
// MapComponent.jsx
const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat([8.5, 46.8], 'EPSG:2056'),
    zoom: 8,
    projection: 'EPSG:2056'
  }),
  layers: [
    baseLayer,
    militaryLayer,
    redliningLayer
  ],
  controls: [],
  interactions: defaultInteractions()
});
```

**Layer Management**:

```javascript
// Layer types
- TileLayer (WMTS from geo.admin.ch)
- ImageLayer (WMS from QGIS Server)
- VectorLayer (Client-side features)
  - Military symbols
  - Redlining
  - Measurements
```

### Military Symbology

**Symbol Generation** (`militarySymbols.js`):

```javascript
function generateMilitarySymbol(sidc, options = {}) {
  // sidc: Symbol Identification Code (APP-6)
  // Example: '10031000001211000000'
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Parse SIDC
  const affiliation = sidc[1];  // Friend/Hostile/Neutral
  const dimension = sidc[2];    // Land/Air/Sea
  const symbolSet = sidc.substr(4, 6);
  
  // Draw symbol components
  drawFrame(ctx, affiliation);
  drawIcon(ctx, symbolSet);
  drawModifiers(ctx, options);
  
  return canvas.toDataURL();
}
```

**ORBAT Data Model**:

```javascript
// Unit structure
{
  id: 'uuid',
  name: 'Unit Name',
  designation: '1-5 INF',
  symbol: {
    sidc: '10031000001211000000',
    affiliation: 'friendly',
    echelon: 'brigade',
    modifiers: {
      size: 'company',
      reinforced: true
    }
  },
  position: {
    coordinates: [2660000, 1190000],
    elevation: 450
  },
  status: 'operational',
  strength: {
    personnel: 150,
    vehicles: 20
  },
  parent: 'parent-unit-id',
  children: ['child-1-id', 'child-2-id']
}
```

### Temporal Layer System

**Time-based Visualization**:

```javascript
// temporalLayer.js
class TemporalLayer {
  constructor(features, timeProperty) {
    this.features = features;
    this.timeProperty = timeProperty;
    this.currentTime = null;
  }
  
  setTime(timestamp) {
    this.currentTime = timestamp;
    this.updateVisibility();
  }
  
  updateVisibility() {
    this.features.forEach(feature => {
      const featureTime = feature.get(this.timeProperty);
      const visible = this.isVisibleAtTime(featureTime);
      feature.setStyle(visible ? this.style : null);
    });
  }
  
  isVisibleAtTime(featureTime) {
    // Logic for temporal visibility
    return featureTime <= this.currentTime;
  }
}
```

## Backend Services

### QGIS Server

**Configuration** (`qgis-server/`):

```
qgis-server/
├── Dockerfile
├── projects/
│   └── dufour.qgs          # QGIS project file
├── plugins/
│   └── (custom plugins)
└── pg_service.conf          # PostgreSQL connection
```

**Capabilities**:
- **WMS**: Raster map rendering
- **WFS**: Vector feature serving
- **WCS**: Coverage (raster) data
- **GetCapabilities**: Service metadata
- **GetMap**: Rendered map images
- **GetFeatureInfo**: Feature identification
- **GetFeature**: Feature retrieval

**Project Configuration** (dufour.qgs):
- Swiss projection (EPSG:2056)
- Layer definitions
- Symbology
- Print layouts

### PostGIS Database

**Schema** (`postgis/init/01-init.sh`):

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE spatial_layers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  geometry_type VARCHAR(50),
  srid INTEGER,
  geom geometry,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orbat_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  designation VARCHAR(100),
  symbol_code VARCHAR(20),
  position geometry(Point, 2056),
  parent_id UUID REFERENCES orbat_units(id),
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scenario_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID REFERENCES scenarios(id),
  unit_id UUID REFERENCES orbat_units(id),
  timestamp TIMESTAMP,
  position geometry(Point, 2056),
  event_type VARCHAR(50),
  properties JSONB
);

-- Indexes
CREATE INDEX idx_spatial_layers_geom ON spatial_layers USING GIST(geom);
CREATE INDEX idx_orbat_units_position ON orbat_units USING GIST(position);
CREATE INDEX idx_scenario_events_timestamp ON scenario_events(timestamp);
```

### Nginx Reverse Proxy

**Configuration** (`nginx/nginx.conf`):

```nginx
upstream qgis_server {
    server qgis-server:80;
}

server {
    listen 80;
    server_name dufour.app;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # QGIS Server
    location /qgis {
        proxy_pass http://qgis_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        
        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## API Specifications

### QGIS Server WMS

**GetCapabilities**:
```
GET /qgis?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0
```

**GetMap**:
```
GET /qgis?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap
  &LAYERS=layer1,layer2
  &STYLES=
  &CRS=EPSG:2056
  &BBOX=2600000,1100000,2700000,1200000
  &WIDTH=1024
  &HEIGHT=768
  &FORMAT=image/png
```

**GetFeatureInfo**:
```
GET /qgis?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo
  &LAYERS=layer1
  &QUERY_LAYERS=layer1
  &CRS=EPSG:2056
  &BBOX=...
  &WIDTH=1024
  &HEIGHT=768
  &I=512
  &J=384
  &INFO_FORMAT=application/json
```

### geo.admin.ch API

**Search**:
```
GET https://api3.geo.admin.ch/rest/services/api/SearchServer
  ?searchText=Bern
  &type=locations
  &sr=2056
```

**Identify**:
```
GET https://api3.geo.admin.ch/rest/services/api/MapServer/identify
  ?geometryType=esriGeometryPoint
  &geometry=2600000,1200000
  &layers=all:ch.swisstopo.pixelkarte-farbe
  &sr=2056
```

## Security Architecture

### Authentication & Authorization

**Current Implementation**:
- No authentication (public access)
- Suitable for internal networks or demo

**Future Implementation**:
- JWT-based authentication
- OAuth2 integration
- Role-based access control (RBAC)

### Data Security

**In Transit**:
- HTTPS/TLS 1.3 for production
- Certificate management with Let's Encrypt

**At Rest**:
- PostgreSQL encryption
- Docker volume encryption (platform-specific)

### Input Validation

**Frontend**:
- Coordinate validation
- File type checking
- Size limits

**Backend**:
- SQL injection prevention (parameterized queries)
- XSS protection (Content-Security-Policy headers)
- CSRF tokens for state-changing operations

## Performance Considerations

### Frontend Optimization

**Code Splitting**:
```javascript
// Lazy load components
const OrbatManager = lazy(() => import('./OrbatManager'));
```

**Memoization**:
```javascript
const MemoizedMap = memo(MapComponent);
```

**Virtual Scrolling** for large lists (ORBAT tree, layer list)

### Map Performance

**Tile Caching**:
- Browser cache for base map tiles
- IndexedDB for offline support

**Feature Clustering**:
```javascript
const clusterSource = new Cluster({
  distance: 40,
  source: vectorSource
});
```

**Simplification**:
- Generalize geometries at small scales
- Progressive loading for large datasets

### Backend Performance

**QGIS Server**:
- Parallel rendering enabled
- Tile cache (MapCache integration possible)
- Connection pooling

**PostGIS**:
- Spatial indexes on all geometry columns
- Query optimization with EXPLAIN ANALYZE
- Connection pooling (PgBouncer)

**Nginx**:
- Gzip compression enabled
- Static file caching
- HTTP/2 support

### Scalability

**Horizontal Scaling**:
- Multiple QGIS Server instances
- Load balancer (Nginx, HAProxy)
- Database read replicas

**Vertical Scaling**:
- Increase container resources
- Optimize database configuration
- Upgrade server hardware

---

**For deployment instructions, see [DEPLOY.md](DEPLOY.md)**  
**For user guide, see [GUIDE.md](GUIDE.md)**
