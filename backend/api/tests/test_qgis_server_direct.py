"""
Test QGIS Server direct execution (no HTTP wrapper)
"""
import subprocess
import os
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))

from services.qgis_storage_service import storage_service
import tempfile

def test_qgis_server_direct():
    """Test QGIS Server direct CGI execution"""
    
    # 1. Get project
    print("Retrieving snu_tag from PostgreSQL...")
    qgz_bytes = storage_service.retrieve_qgz('snu_tag')
    
    temp_dir = Path(tempfile.gettempdir()) / 'dufour_qgis_test'
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / 'snu_tag.qgz'
    temp_path.write_bytes(qgz_bytes)
    
    print(f"✅ Exported to {temp_path}")
    
    # 2. Prepare CGI environment
    env = os.environ.copy()
    env['QUERY_STRING'] = f"SERVICE=WMS&REQUEST=GetCapabilities&MAP={temp_path}"
    env['REQUEST_METHOD'] = 'GET'
    env['QGIS_SERVER_LOG_LEVEL'] = '0'  # Verbose
    env['QGIS_SERVER_LOG_STDERR'] = '1'
    
    # 3. Run QGIS Server CGI
    qgis_server_exe = r'C:\OSGeo4W\apps\qgis-ltr\bin\qgis_mapserv.fcgi.exe'
    
    print(f"\nExecuting QGIS Server...")
    print(f"Executable: {qgis_server_exe}")
    print(f"QUERY_STRING: {env['QUERY_STRING']}")
    
    try:
        result = subprocess.run(
            [qgis_server_exe],
            env=env,
            capture_output=True,
            timeout=30,
            cwd=str(temp_dir)
        )
        
        print(f"\nReturn code: {result.returncode}")
        print(f"Stdout length: {len(result.stdout)} bytes")
        print(f"Stderr length: {len(result.stderr)} bytes")
        
        if result.stderr:
            print(f"\n--- STDERR ---")
            print(result.stderr.decode('utf-8', errors='ignore')[:2000])
        
        if result.stdout:
            # Parse CGI output
            output = result.stdout
            
            # Find headers end
            headers_end = output.find(b'\r\n\r\n')
            if headers_end == -1:
                headers_end = output.find(b'\n\n')
            
            if headers_end != -1:
                headers_raw = output[:headers_end].decode('utf-8', errors='ignore')
                body = output[headers_end+4:]
                
                print(f"\n--- HEADERS ---")
                print(headers_raw)
                
                print(f"\n--- BODY (first 500 chars) ---")
                body_text = body.decode('utf-8', errors='ignore')
                print(body_text[:500])
                
                if b'<WMS_Capabilities' in body or b'<WMT_MS_Capabilities' in body:
                    print("\n✅ GetCapabilities SUCCESS - Valid WMS XML")
                    return True
                else:
                    print("\n❌ Invalid WMS response")
                    return False
            else:
                print("\n❌ No CGI headers found")
                print(output[:500])
                return False
        else:
            print("\n❌ No output from QGIS Server")
            return False
    
    except subprocess.TimeoutExpired:
        print("\n❌ QGIS Server timeout (30s)")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_qgis_server_direct()
    sys.exit(0 if success else 1)
