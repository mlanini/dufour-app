"""
Test WMS GetCapabilities for snu_tag project
Direct QGIS Server test without FastAPI
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from services.qgis_storage_service import storage_service
import tempfile
import subprocess

def test_wms_getcapabilities():
    """Test WMS GetCapabilities for snu_tag"""
    
    # 1. Retrieve project from PostgreSQL
    print("Retrieving snu_tag from PostgreSQL...")
    qgz_bytes = storage_service.retrieve_qgz('snu_tag')
    if not qgz_bytes:
        print("❌ Project snu_tag not found in database")
        return False
    
    print(f"✅ Retrieved {len(qgz_bytes)} bytes")
    
    # 2. Export to temp file
    temp_dir = Path(tempfile.gettempdir()) / 'dufour_qgis_test'
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / 'snu_tag.qgz'
    temp_path.write_bytes(qgz_bytes)
    
    print(f"✅ Exported to {temp_path}")
    
    # 3. Call QGIS Server via HTTP wrapper
    import requests
    
    wms_url = 'http://localhost:8080'
    params = {
        'SERVICE': 'WMS',
        'REQUEST': 'GetCapabilities',
        'MAP': str(temp_path)
    }
    
    print(f"\nTesting WMS GetCapabilities...")
    print(f"URL: {wms_url}")
    print(f"MAP: {params['MAP']}")
    
    try:
        response = requests.get(wms_url, params=params, timeout=30)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Parse XML to verify
            if b'<WMS_Capabilities' in response.content or b'<WMT_MS_Capabilities' in response.content:
                print("\n✅ GetCapabilities SUCCESS - Valid WMS XML")
                
                # Extract layer names
                import xml.etree.ElementTree as ET
                root = ET.fromstring(response.content)
                
                # Try different XML namespaces
                layers = root.findall('.//{http://www.opengis.net/wms}Layer')
                if not layers:
                    layers = root.findall('.//Layer')
                
                print(f"\nLayers found: {len(layers)}")
                for layer in layers[:5]:  # First 5 layers
                    name_elem = layer.find('.//{http://www.opengis.net/wms}Name') or layer.find('.//Name')
                    title_elem = layer.find('.//{http://www.opengis.net/wms}Title') or layer.find('.//Title')
                    
                    if name_elem is not None:
                        print(f"  - {name_elem.text}: {title_elem.text if title_elem is not None else 'No title'}")
                
                return True
            else:
                print(f"\n❌ Invalid XML response")
                print(response.content[:500].decode('utf-8', errors='ignore'))
                return False
        else:
            print(f"\n❌ HTTP {response.status_code}")
            print(response.text[:500])
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_wms_getcapabilities()
    sys.exit(0 if success else 1)
