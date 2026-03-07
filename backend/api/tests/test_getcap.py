"""Test QGIS Server GetCapabilities"""
import subprocess
import os

# Set CGI environment variables
os.environ['QUERY_STRING'] = 'SERVICE=WMS&REQUEST=GetCapabilities&MAP=C:/Temp/snu_tag.qgz'
os.environ['REQUEST_METHOD'] = 'GET'
os.environ['SERVER_NAME'] = 'localhost'
os.environ['SERVER_PORT'] = '80'
os.environ['SCRIPT_NAME'] = '/cgi-bin/qgis_mapserv.fcgi'
os.environ['QGIS_SERVER_LOG_LEVEL'] = '0'  # 0=INFO
os.environ['QGIS_SERVER_LOG_STDERR'] = '1'

print("Testing QGIS Server GetCapabilities...")
print(f"MAP: C:/Temp/snu_tag.qgz")

result = subprocess.run(
    ['C:/OSGeo4W/apps/qgis-ltr/bin/qgis_mapserv.fcgi.exe'],
    capture_output=True,
    timeout=15
)

print(f"\nReturn code: {result.returncode}")
print(f"STDOUT length: {len(result.stdout)} bytes")
print(f"STDERR length: {len(result.stderr)} bytes")

if result.stdout:
    # Parse CGI output (headers + body)
    output = result.stdout
    headers_end = output.find(b'\r\n\r\n')
    if headers_end == -1:
        headers_end = output.find(b'\n\n')
    
    if headers_end != -1:
        headers = output[:headers_end].decode('utf-8', errors='ignore')
        body = output[headers_end+4:]
        
        print(f"\n--- HEADERS ---")
        print(headers)
        
        print(f"\n--- BODY (first 1000 chars) ---")
        print(body[:1000].decode('utf-8', errors='ignore'))
        
        # Check if valid WMS_Capabilities
        if b'WMS_Capabilities' in body or b'ServiceException' in body:
            print("\n✅ Valid WMS response!")
        else:
            print("\n⚠️ Unexpected response format")
    else:
        print("No CGI headers found, raw output:")
        print(output[:500].decode('utf-8', errors='ignore'))

if result.stderr:
    print(f"\n--- STDERR ---")
    print(result.stderr.decode('utf-8', errors='ignore'))
