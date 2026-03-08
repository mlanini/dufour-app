"""
Create sample QGZ files for testing
"""
import zipfile
from pathlib import Path

# Create fixtures directory if not exists
fixtures_dir = Path(__file__).parent
fixtures_dir.mkdir(exist_ok=True)

# QGS content
qgs_content = """<?xml version="1.0" encoding="UTF-8"?>
<qgis projectname="Sample Project" version="3.34.0-Prizren">
  <title>Sample QGIS Project</title>
  <mapcanvas>
    <destinationsrs>
      <spatialrefsys>
        <authid>EPSG:2056</authid>
      </spatialrefsys>
    </destinationsrs>
    <extent>
      <xmin>2600000</xmin>
      <ymin>1200000</ymin>
      <xmax>2650000</xmax>
      <ymax>1250000</ymax>
    </extent>
  </mapcanvas>
  <projectlayers>
    <maplayer type="vector" geometry="Point">
      <id>layer1</id>
      <datasource>./points.geojson</datasource>
      <layername>Sample Points</layername>
      <provider>ogr</provider>
    </maplayer>
  </projectlayers>
</qgis>"""

# GeoJSON content
geojson_content = """{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [7.44, 46.95]
      },
      "properties": {
        "name": "Bern"
      }
    }
  ]
}"""

# Create sample.qgz
sample_qgz = fixtures_dir / 'sample.qgz'
with zipfile.ZipFile(sample_qgz, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('sample.qgs', qgs_content)
    zf.writestr('points.geojson', geojson_content)

print(f"Created {sample_qgz}")

# Create test_project.qgz
test_qgz = fixtures_dir / 'test_project.qgz'
with zipfile.ZipFile(test_qgz, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('test_project.qgs', qgs_content.replace('Sample', 'Test'))
    zf.writestr('points.geojson', geojson_content)

print(f"Created {test_qgz}")
print("Sample QGZ files created successfully!")
