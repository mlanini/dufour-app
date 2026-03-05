# QGIS Server Plugins

This directory contains Python plugins for QGIS Server.

Plugins placed here will be automatically loaded by QGIS Server.

## Plugin Structure

Each plugin should be in its own subdirectory:

```
plugins/
├── my_plugin/
│   ├── __init__.py
│   ├── metadata.txt
│   └── plugin.py
```

## Useful QGIS Server Plugins

Some recommended plugins for enhanced functionality:

- **qgis-server-cors**: Enhanced CORS support
- **qgis-server-cache**: Tile caching
- **qgis-server-landing-page**: Service landing page

## Documentation

- [QGIS Server Plugin Development](https://docs.qgis.org/latest/en/docs/pyqgis_developer_cookbook/server.html)
