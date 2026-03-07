@echo off
REM Test QGIS Server GetCapabilities with OSGeo4W environment

REM Setup OSGeo4W environment
call C:\OSGeo4W\bin\o4w_env.bat

REM Set QGIS Server variables
set QGIS_SERVER_LOG_LEVEL=0
set QGIS_SERVER_LOG_STDERR=1
set QGIS_PREFIX_PATH=C:\OSGeo4W\apps\qgis-ltr

REM Get .qgz path from argument or use default
set "QGZ_PATH=%~1"
if "%QGZ_PATH%"=="" set "QGZ_PATH=C:\Users\septe\AppData\Local\Temp\dufour_qgis_test\snu_tag.qgz"

echo Testing QGIS Server GetCapabilities...
echo MAP: %QGZ_PATH%
echo.

REM Set CGI environment
set QUERY_STRING=SERVICE=WMS^&REQUEST=GetCapabilities^&MAP=%QGZ_PATH%
set REQUEST_METHOD=GET

REM Run QGIS Server
C:\OSGeo4W\apps\qgis-ltr\bin\qgis_mapserv.fcgi.exe
