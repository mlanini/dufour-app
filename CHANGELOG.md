# Changelog

All notable changes to Dufour.app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Authentication and authorization system
- Plugin architecture
- Offline mode with service workers
- Additional file format support (Shapefile, GeoPackage)
- Enhanced mobile UI
- Automated testing suite
- CI/CD pipeline

## [0.1.0] - 2026-03-05

### Added
- Initial release of Dufour.app
- React 18 + OpenLayers 9 frontend
- QGIS Server integration for WMS/WFS services
- PostGIS spatial database
- Swiss base map integration (geo.admin.ch)
- Military symbology editor (APP-6/MIL-STD-2525)
- ORBAT (Order of Battle) manager with hierarchical unit structure
- Scenario management with timeline controls
- Temporal layer visualization
- Redlining and drawing tools
- Measurement tools (distance, area, azimuth)
- Search functionality (locations, coordinates)
- File import/export (GeoJSON, KML, GPX)
- Layer tree management
- Terrain analysis tools
- Grid overlay system
- Multi-language support (EN, DE, FR, IT)
- Responsive KADAS-inspired UI
- Docker Compose deployment
- Production-ready Docker configuration
- Nginx reverse proxy setup
- Comprehensive documentation:
  - README.md
  - GUIDE.md (User guide)
  - DEPLOY.md (Deployment guide)
  - ARCHITECTURE.md (Technical documentation)
  - CONTRIBUTING.md (Contribution guidelines)
  - SECURITY.md (Security policy)

### Components
- **Frontend**: React 18.2, Redux Toolkit 2.2, OpenLayers 9.1, Vite 5.1
- **Backend**: QGIS Server 3.34+, PostgreSQL 15, PostGIS 3.4, Nginx 1.25
- **Containerization**: Docker, Docker Compose

### Features by Category

#### Map Functionality
- Swiss base maps (Pixelkarte, Landeskarte, Luftbild, Swissimage)
- Multiple projection support (EPSG:2056, EPSG:21781, EPSG:4326)
- Zoom, pan, rotation controls
- Coordinate display in multiple formats
- Scale bar and zoom level indicator

#### Military Operations
- Military symbol generation and placement
- ORBAT tree editor with drag-and-drop
- Unit properties editor
- Symbol customization (affiliation, echelon, modifiers)
- Scenario planning and management
- Timeline-based visualization
- Temporal layer control

#### Analysis Tools
- Distance and area measurement
- Azimuth calculation
- Terrain profile extraction
- Slope analysis
- Grid reference system
- Feature identification

#### Data Management
- Import: GeoJSON, KML, GPX
- Export: GeoJSON, KML, PNG, PDF
- Layer styling and transparency
- Layer reordering and grouping
- Feature attribute editing

#### User Interface
- Ribbon toolbar with tabbed interface
- Side panels (left and right)
- Status bar with coordinate display
- Context menus
- Keyboard shortcuts
- Mobile-responsive layout

### Documentation
- Complete installation and setup guide
- User manual with feature descriptions
- Deployment guide for multiple platforms
- Architecture documentation
- API specifications
- Contributing guidelines
- Security policy

### Deployment Targets
- Local development (Docker Compose)
- Production Docker deployment
- Render.com (configured)
- AWS (ECS, EC2)
- Azure (Container Instances)
- Google Cloud Platform (Cloud Run)

### Known Issues
- No authentication system (planned for v0.2.0)
- Limited test coverage (work in progress)
- Some features incomplete (marked in UI)
- Performance optimization needed for large datasets
- Print functionality basic

### Technical Details
- Swiss coordinate system support
- WMS/WFS/WCS OGC standards compliance
- APP-6 military symbology standard
- RESTful API integration
- WebSocket support for real-time updates (planned)

---

## Release Notes Guidelines

### Version Numbering
- **Major** (1.0.0): Breaking changes, major features
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.1.1): Bug fixes, minor improvements

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[Unreleased]: https://github.com/mlanini/dufour-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mlanini/dufour-app/releases/tag/v0.1.0
