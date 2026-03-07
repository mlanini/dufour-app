# Start QGIS Server on Windows OSGeo4W
# Runs QGIS Server via Python HTTP server on port 8080

$env:QGIS_SERVER_LOG_LEVEL = "0"  # 0=INFO, 1=WARNING, 2=CRITICAL
$env:QGIS_SERVER_LOG_FILE = "C:\Users\Public\Documents\intelligeo\dufour-app\backend\api\qgis_server.log"
$env:QGIS_PREFIX_PATH = "C:\OSGeo4W\apps\qgis-ltr"

Write-Host "Starting QGIS Server on http://localhost:8080..." -ForegroundColor Green

# Start QGIS Server with Python HTTP wrapper
C:\OSGeo4W\apps\Python312\python.exe -c @"
import http.server
import socketserver
import subprocess
import os
from urllib.parse import parse_qs, urlparse

class QGISServerHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query string
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        
        # Get MAP parameter
        map_path = params.get('MAP', [''])[0]
        if not map_path:
            self.send_error(400, 'MAP parameter required')
            return
        
        # Set environment variables
        env = os.environ.copy()
        env['QUERY_STRING'] = parsed.query
        env['REQUEST_METHOD'] = 'GET'
        
        # Run QGIS Server
        try:
            result = subprocess.run(
                ['C:/OSGeo4W/apps/qgis-ltr/bin/qgis_mapserv.fcgi.exe'],
                env=env,
                capture_output=True,
                timeout=30
            )
            
            # Parse CGI output (headers + body)
            output = result.stdout
            headers_end = output.find(b'\r\n\r\n')
            if headers_end == -1:
                headers_end = output.find(b'\n\n')
            
            if headers_end != -1:
                headers_raw = output[:headers_end].decode('utf-8', errors='ignore')
                body = output[headers_end+4:]
            else:
                headers_raw = 'Content-Type: text/plain'
                body = output
            
            # Send response
            self.send_response(200)
            for line in headers_raw.split('\n'):
                if ': ' in line:
                    key, value = line.split(': ', 1)
                    self.send_header(key, value.strip())
            self.end_headers()
            self.wfile.write(body)
            
        except subprocess.TimeoutExpired:
            self.send_error(504, 'QGIS Server timeout')
        except Exception as e:
            self.send_error(500, f'QGIS Server error: {str(e)}')
    
    def log_message(self, format, *args):
        print(f'{self.address_string()} - {format % args}')

PORT = 8080
with socketserver.TCPServer(('', PORT), QGISServerHandler) as httpd:
    print(f'QGIS Server running on http://localhost:{PORT}')
    httpd.serve_forever()
"@
