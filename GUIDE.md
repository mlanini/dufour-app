# Dufour.app User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Interface](#user-interface)
3. [Basic Map Operations](#basic-map-operations)
4. [Military Features](#military-features)
5. [Advanced Tools](#advanced-tools)
6. [Data Management](#data-management)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch

When you first open Dufour.app, you'll see:
- A Swiss base map (Pixelkarte by default)
- The Ribbon toolbar at the top
- Status bar at the bottom showing coordinates and scale
- Clean workspace ready for your operations

### Language Selection

Click the **Settings** icon (⚙️) in the ribbon toolbar to change language:
- English (EN)
- German (DE)
- French (FR)
- Italian (IT)

## User Interface

### Ribbon Toolbar

The main toolbar is organized into tabs:

#### View Tab
- **Base Maps**: Switch between Pixelkarte, Landeskarte, Luftbild, Swissimage
- **Layers**: Toggle layer visibility
- **Zoom**: Zoom in/out, fit to extent
- **3D**: Enable 3D terrain view

#### Draw Tab
- **Point**: Add point features
- **Line**: Draw polylines
- **Polygon**: Draw polygons
- **Text**: Add text labels
- **Redline**: Free-hand drawing

#### Analysis Tab
- **Measure**: Distance and area measurement
- **Terrain**: Slope analysis, viewshed
- **Grid**: Display Swiss military grid
- **Profile**: Terrain profile along line

#### Military Tab
- **ORBAT**: Manage Order of Battle
- **Symbols**: Add military symbols (APP-6)
- **Scenarios**: Create and manage scenarios
- **Timeline**: Control temporal visualization

### Side Panels

**Left Panel** (click icons to open):
- Layer Tree
- Search
- Import/Export
- Settings

**Right Panel**:
- Feature attributes
- Tool properties
- Timeline controls

### Status Bar

Bottom bar displays:
- **Mouse Coordinates**: Swiss LV95 format (EPSG:2056)
- **Scale**: Current map scale (1:50000)
- **Zoom Level**: Current zoom
- **Coordinate System**: Active CRS

## Basic Map Operations

### Navigation

**Mouse Controls**:
- **Pan**: Click and drag
- **Zoom In**: Mouse wheel up or double-click
- **Zoom Out**: Mouse wheel down or Shift + double-click
- **Rotate**: Right-click + drag (if rotation enabled)

**Keyboard Shortcuts**:
- `+`/`-`: Zoom in/out
- `Arrow keys`: Pan map
- `Home`: Reset to initial view
- `R`: Reset rotation

### Search

1. Click the **Search** icon in the ribbon
2. Type location name, address, or coordinates
3. Select from autocomplete results
4. Map zooms to selected location

**Coordinate Search Formats**:
- Swiss LV95: `2600000, 1200000`
- WGS84: `46.5197, 6.6323`
- WGS84 DMS: `46°31'11"N 6°37'56"E`

### Layer Management

1. Open **Layer Tree** panel
2. Toggle layer visibility with checkboxes
3. Adjust transparency with sliders
4. Reorder layers by dragging
5. Right-click for layer options:
   - Zoom to layer extent
   - Remove layer
   - Export layer
   - Layer properties

## Military Features

### ORBAT Manager

Manage military unit hierarchies and deployment.

**Create ORBAT**:
1. Click **Military** tab → **ORBAT**
2. Click **New ORBAT**
3. Enter name and description
4. Click **Add Unit** to create root unit
5. Add subordinate units with **Add Child**

**Edit Units**:
- **Name**: Unit designation
- **Symbol**: Select military symbol
- **Location**: Set position on map
- **Status**: Operational status
- **Strength**: Personnel/equipment count

**Visualize ORBAT**:
- Units appear on map with military symbols
- Click unit on map to view details
- Use tree view to navigate hierarchy

### Military Symbol Editor

Add APP-6/MIL-STD-2525 compliant symbols.

**Add Symbol**:
1. Click **Military** tab → **Symbols**
2. Choose symbol category:
   - Units (infantry, armor, artillery)
   - Equipment (vehicles, aircraft)
   - Installations (headquarters, supply)
3. Customize symbol:
   - Affiliation (friendly, hostile, neutral)
   - Status (present, planned)
   - Modifiers (size, reinforcement)
4. Place on map

**Symbol Properties**:
- **Position**: Drag symbol to reposition
- **Rotation**: Rotate to indicate direction
- **Label**: Add unit designation
- **Description**: Additional information

### Scenario Management

Create operational scenarios with timeline.

**Create Scenario**:
1. Click **Military** tab → **Scenarios**
2. Click **New Scenario**
3. Set scenario details:
   - Name and description
   - Start date/time
   - Duration
4. Add events to timeline

**Timeline Control**:
- Play/pause animation
- Scrub through time
- Set playback speed
- Jump to specific time

**Scenario Elements**:
- Unit positions at different times
- Movements and maneuvers
- Event markers
- Phase transitions

## Advanced Tools

### Measurement

**Distance Measurement**:
1. Click **Analysis** → **Measure Distance**
2. Click points along path
3. Double-click to finish
4. Result shows in meters/kilometers

**Area Measurement**:
1. Click **Analysis** → **Measure Area**
2. Click to define polygon vertices
3. Double-click to close polygon
4. Result shows in square meters/hectares

**Azimuth**:
- Measure bearing between two points
- Result in degrees (0-360°)

### Redlining

Draw and annotate directly on the map.

**Drawing Tools**:
- Point, line, polygon, circle, rectangle
- Text labels with custom fonts
- Arrow lines for direction indication
- Free-hand drawing for sketches

**Styling Options**:
- Line color and width
- Fill color and opacity
- Font size and color
- Symbol size

**Redline Management**:
- Edit existing features
- Delete features
- Copy/paste features
- Export to file

### Terrain Analysis

**Slope Analysis**:
1. Click **Analysis** → **Terrain** → **Slope**
2. Map displays slope gradient
3. Legend shows categories (0-10°, 10-20°, etc.)

**3D Visualization**:
1. Click **View** → **3D**
2. Use mouse to tilt and rotate view
3. Adjust vertical exaggeration
4. Toggle building and tree 3D models

**Terrain Profile**:
1. Draw line on map
2. Click **Analysis** → **Profile**
3. View elevation profile graph
4. Export profile data

### Grid Systems

**Swiss Military Grid**:
1. Click **Analysis** → **Grid**
2. Select grid type (1km, 10km, 100km)
3. Grid overlays on map
4. Labels show grid references

## Data Management

### Import Data

**Supported Formats**:
- GeoJSON (.geojson, .json)
- KML/KMZ (.kml, .kmz)
- GPX (.gpx)
- Shapefile (.shp + supporting files)

**Import Process**:
1. Click **Import** in left panel
2. Select file or drag-and-drop
3. Choose layer name
4. Confirm coordinate system
5. Data appears on map

**Import from URL**:
- Paste WMS/WFS service URL
- Select layers to add
- Configure styling

### Export Data

**Export Layer**:
1. Right-click layer in Layer Tree
2. Select **Export**
3. Choose format:
   - GeoJSON (all browsers)
   - KML (for Google Earth)
   - GPX (for GPS devices)
4. Save file

**Export Map as Image**:
1. Click **Print** in ribbon
2. Set paper size and orientation
3. Add title and legend
4. Export as PNG or PDF

### Save/Load Projects

**Save Project**:
1. Click **File** → **Save Project**
2. Project saves current state:
   - Active layers
   - Map extent
   - Redlining features
   - ORBAT data
   - Scenarios

**Load Project**:
1. Click **File** → **Open Project**
2. Select saved project file
3. Application restores saved state

## Troubleshooting

### Common Issues

**Map Not Loading**:
- Check internet connection
- Verify geo.admin.ch services are accessible
- Clear browser cache
- Check browser console for errors

**Layers Not Appearing**:
- Verify layer is visible (checkbox in Layer Tree)
- Check if layer is within view extent
- Verify layer transparency is not 0%
- Reload layer (right-click → Reload)

**Search Not Working**:
- Ensure correct coordinate format
- Check spelling of location names
- Verify search service is available
- Try alternative search terms

**Import Failed**:
- Verify file format is supported
- Check file is not corrupted
- Ensure coordinate system is valid
- Try smaller file size

**Performance Issues**:
- Reduce number of visible layers
- Simplify complex geometries
- Lower map quality in settings
- Close unnecessary browser tabs

### Getting Help

- **Documentation**: Check [README](README.md), [ARCHITECTURE](ARCHITECTURE.md), and [DEPLOY](DEPLOY.md)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/mlanini/dufour-app/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/mlanini/dufour-app/discussions)
- **Repository**: https://github.com/mlanini/dufour-app

## Keyboard Shortcuts Reference

### General
- `Ctrl+S`: Save project
- `Ctrl+O`: Open project
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Esc`: Cancel current operation

### Navigation
- `+`/`-`: Zoom in/out
- `Arrow keys`: Pan map
- `Home`: Reset view
- `R`: Reset rotation

### Tools
- `D`: Distance measurement
- `A`: Area measurement
- `P`: Point drawing
- `L`: Line drawing
- `M`: Polygon drawing
- `T`: Text label

### Layers
- `Ctrl+L`: Open layer tree
- `Ctrl+H`: Toggle selected layer

---

**For technical details, see [ARCHITECTURE.md](ARCHITECTURE.md)**  
**For deployment instructions, see [DEPLOY.md](DEPLOY.md)**
