"""
Mock Projects Generator
Creates sample QGIS projects for testing without actual .qgs files
"""
import json
from datetime import datetime
from pathlib import Path
import os

MOCK_PROJECTS = [
    {
        "name": "swiss_tactical",
        "title": "Swiss Tactical Operations",
        "description": "Tactical military operations map with SwissTopo base layers",
        "created_at": "2026-03-01T10:00:00Z",
        "updated_at": "2026-03-06T12:00:00Z",
        "extent": {
            "minx": 2485071,
            "miny": 1075346,
            "maxx": 2837119,
            "maxy": 1299941,
            "crs": "EPSG:2056"
        },
        "layers": [
            {
                "id": "ch.swisstopo.pixelkarte-farbe",
                "name": "SwissTopo Color Map",
                "type": "wmts",
                "visible": True
            }
        ],
        "thumbnail": "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/8/134/181.jpeg"
    },
    {
        "name": "alpine_training",
        "title": "Alpine Training Area",
        "description": "High-altitude training zone with terrain analysis",
        "created_at": "2026-02-15T14:30:00Z",
        "updated_at": "2026-03-05T09:15:00Z",
        "extent": {
            "minx": 2600000,
            "miny": 1100000,
            "maxx": 2700000,
            "maxy": 1200000,
            "crs": "EPSG:2056"
        },
        "layers": [
            {
                "id": "ch.swisstopo.swissimage",
                "name": "SwissImage Aerial",
                "type": "wmts",
                "visible": True
            },
            {
                "id": "ch.swisstopo.hangneigung-ueber_30",
                "name": "Slope > 30°",
                "type": "wmts",
                "visible": True,
                "opacity": 0.7
            }
        ],
        "thumbnail": "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/8/134/181.jpeg"
    },
    {
        "name": "surveillance_zone",
        "title": "Surveillance Operations Zone",
        "description": "Border surveillance area with infrastructure layers",
        "created_at": "2026-01-20T08:00:00Z",
        "updated_at": "2026-03-04T16:45:00Z",
        "extent": {
            "minx": 2550000,
            "miny": 1150000,
            "maxx": 2650000,
            "maxy": 1250000,
            "crs": "EPSG:2056"
        },
        "layers": [
            {
                "id": "ch.swisstopo.pixelkarte-grau",
                "name": "SwissTopo Grey Map",
                "type": "wmts",
                "visible": True
            },
            {
                "id": "ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill",
                "name": "Municipality Boundaries",
                "type": "wmts",
                "visible": True,
                "opacity": 0.6
            }
        ],
        "thumbnail": "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/8/134/181.jpeg"
    }
]


def get_mock_projects():
    """
    Returns list of mock projects
    """
    return MOCK_PROJECTS


def get_mock_project(project_name: str):
    """
    Get single mock project by name
    """
    for project in MOCK_PROJECTS:
        if project["name"] == project_name:
            return project
    return None


def create_mock_qgs_files():
    """
    Create minimal .qgs files in projects directory for mock projects
    """
    projects_dir = Path(os.getenv('PROJECTS_DIR', '/data/projects'))
    projects_dir.mkdir(parents=True, exist_ok=True)
    
    for project in MOCK_PROJECTS:
        qgs_file = projects_dir / f"{project['name']}.qgs"
        
        # Create minimal valid QGIS project XML
        qgs_content = f"""<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis projectname="{project['title']}" version="3.28.0">
  <title>{project['title']}</title>
  <homePath path=""/>
  <projectCrs>
    <spatialrefsys>
      <proj4>+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs</proj4>
      <srsid>47</srsid>
      <srid>2056</srid>
      <authid>EPSG:2056</authid>
      <description>CH1903+ / LV95</description>
      <projectionacronym>somerc</projectionacronym>
      <ellipsoidacronym>bessel</ellipsoidacronym>
      <geographicflag>false</geographicflag>
    </spatialrefsys>
  </projectCrs>
  <mapcanvas name="theMapCanvas">
    <units>meters</units>
    <extent>
      <xmin>{project['extent']['minx']}</xmin>
      <ymin>{project['extent']['miny']}</ymin>
      <xmax>{project['extent']['maxx']}</xmax>
      <ymax>{project['extent']['maxy']}</ymax>
    </extent>
    <destinationsrs>
      <spatialrefsys>
        <proj4>+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs</proj4>
        <srsid>47</srsid>
        <srid>2056</srid>
        <authid>EPSG:2056</authid>
      </spatialrefsys>
    </destinationsrs>
  </mapcanvas>
  <projectlayers/>
</qgis>
"""
        
        with open(qgs_file, 'w', encoding='utf-8') as f:
            f.write(qgs_content)
        
        print(f"Created mock project: {qgs_file}")
    
    return len(MOCK_PROJECTS)


if __name__ == "__main__":
    # Test generation
    count = create_mock_qgs_files()
    print(f"\nCreated {count} mock projects in {os.getenv('PROJECTS_DIR', '/data/projects')}")
