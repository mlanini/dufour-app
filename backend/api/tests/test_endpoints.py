"""
Unit tests for all FastAPI endpoints.

Covers endpoints NOT already tested in test_api_upload.py or test_symbol_service.py:
  - GET  /                              (health check)
  - GET  /api/projects                  (list projects)
  - GET  /api/projects/{name}           (get project detail)
  - DELETE /api/projects/{name}         (delete project)
  - POST /api/projects/publish          (simple publish)
  - GET  /themes.json                   (QWC2 themes)
  - GET  /api/v1/themes                 (list themes)
  - GET  /api/v1/themes/{name}          (single theme config)
  - GET  /api/status                    (system status)
  - GET  /api/projects/{name}/wms       (WMS proxy)
  - POST /api/projects/{name}/wms       (WMS proxy POST)

All external dependencies (PostgreSQL, QGIS Server, milsymbol) are mocked.
Run with:  pytest tests/test_endpoints.py -v
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
import io
import zipfile

# ── Fixtures ──────────────────────────────────────────────────

pytestmark = pytest.mark.unit


def _make_qgz_bytes(filename: str = "test.qgs") -> bytes:
    """Return minimal valid .qgz bytes (a ZIP containing a .qgs XML)."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            filename,
            '<?xml version="1.0"?><qgis version="3.34"><title>T</title></qgis>',
        )
    buf.seek(0)
    return buf.read()


FAKE_PROJECT = {
    "name": "test_project",
    "title": "Test Project",
    "description": "A test project",
    "created_at": "2025-01-01T00:00:00",
    "modified_at": "2025-01-01T00:00:00",
    "file_size": 12345,
    "wms_url": "/api/projects/test_project/wms",
    "extent": [2600000, 1200000, 2650000, 1250000],
    "crs": "EPSG:2056",
}

FAKE_PROJECT_2 = {
    "name": "another_project",
    "title": "Another Project",
    "description": None,
    "created_at": "2025-02-01T00:00:00",
    "modified_at": "2025-02-01T00:00:00",
    "file_size": 9999,
    "wms_url": "/api/projects/another_project/wms",
    "extent": [2500000, 1100000, 2700000, 1300000],
    "crs": "EPSG:2056",
}


@pytest.fixture()
def client():
    """TestClient with storage_service mocked at module level."""
    from main import app
    return TestClient(app)


# ── 1. Health Check  GET / ────────────────────────────────────

class TestHealthCheck:

    def test_root_returns_online(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "online"
        assert body["version"] == "1.0.0"
        assert "service" in body


# ── 2. List Projects  GET /api/projects ───────────────────────

class TestListProjects:

    @patch("main.storage_service")
    def test_list_returns_projects(self, mock_storage, client):
        mock_storage.list_projects.return_value = [FAKE_PROJECT, FAKE_PROJECT_2]
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["name"] == "test_project"
        assert data[1]["name"] == "another_project"

    @patch("main.storage_service")
    def test_list_empty(self, mock_storage, client):
        mock_storage.list_projects.return_value = []
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        assert resp.json() == []

    @patch("main.storage_service")
    def test_list_db_error(self, mock_storage, client):
        mock_storage.list_projects.side_effect = Exception("DB down")
        resp = client.get("/api/projects")
        assert resp.status_code == 500


# ── 3. Get Project Detail  GET /api/projects/{name} ──────────

class TestGetProject:

    @patch("main.storage_service")
    def test_get_existing_project(self, mock_storage, client):
        mock_storage.list_projects.return_value = [FAKE_PROJECT]
        resp = client.get("/api/projects/test_project")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "test_project"
        assert body["crs"] == "EPSG:2056"
        assert body["extent"] == [2600000, 1200000, 2650000, 1250000]

    @patch("main.storage_service")
    def test_get_nonexistent_project(self, mock_storage, client):
        mock_storage.list_projects.return_value = [FAKE_PROJECT]
        resp = client.get("/api/projects/nonexistent")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    @patch("main.storage_service")
    def test_get_project_db_error(self, mock_storage, client):
        mock_storage.list_projects.side_effect = Exception("timeout")
        resp = client.get("/api/projects/test_project")
        assert resp.status_code == 500


# ── 4. Delete Project  DELETE /api/projects/{name} ────────────

class TestDeleteProject:

    @patch("main.project_service")
    @patch("main.storage_service")
    def test_delete_existing(self, mock_storage, mock_proj_svc, client):
        mock_storage.delete_project.return_value = True
        mock_proj_svc.delete_project = AsyncMock()
        resp = client.delete("/api/projects/test_project")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()
        mock_storage.delete_project.assert_called_once_with("test_project")

    @patch("main.project_service")
    @patch("main.storage_service")
    def test_delete_nonexistent(self, mock_storage, mock_proj_svc, client):
        mock_storage.delete_project.return_value = False
        mock_proj_svc.delete_project = AsyncMock()
        resp = client.delete("/api/projects/nonexistent")
        assert resp.status_code == 404

    @patch("main.project_service")
    @patch("main.storage_service")
    def test_delete_filesystem_cleanup_failure_ignored(self, mock_storage, mock_proj_svc, client):
        """Legacy filesystem cleanup errors should NOT prevent deletion."""
        mock_storage.delete_project.return_value = True
        mock_proj_svc.delete_project = AsyncMock(side_effect=Exception("fs error"))
        resp = client.delete("/api/projects/test_project")
        assert resp.status_code == 200


# ── 5. Publish Project  POST /api/projects/publish ────────────

class TestPublishProject:

    @patch("main.qwc_service")
    @patch("main.project_service")
    def test_publish_success(self, mock_proj_svc, mock_qwc, client):
        mock_proj_svc.publish_project = AsyncMock(return_value={
            "name": "my_map",
            "title": "My Map",
            "wms_url": "/api/projects/my_map/wms",
        })
        mock_qwc.generate_theme_config = AsyncMock()

        qgz = _make_qgz_bytes()
        resp = client.post(
            "/api/projects/publish",
            data={"name": "my_map", "title": "My Map"},
            files={"file": ("project.qgz", qgz, "application/zip")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "my_map"
        mock_proj_svc.publish_project.assert_awaited_once()
        mock_qwc.generate_theme_config.assert_awaited_once_with("my_map")

    @patch("main.qwc_service")
    @patch("main.project_service")
    def test_publish_invalid_extension(self, mock_proj_svc, mock_qwc, client):
        resp = client.post(
            "/api/projects/publish",
            data={"name": "my_map"},
            files={"file": ("readme.txt", b"hello", "text/plain")},
        )
        assert resp.status_code == 400
        assert "Invalid file type" in resp.json()["detail"]

    @patch("main.qwc_service")
    @patch("main.project_service")
    def test_publish_qgs_accepted(self, mock_proj_svc, mock_qwc, client):
        """Both .qgs and .qgz should be accepted."""
        mock_proj_svc.publish_project = AsyncMock(return_value={"name": "p"})
        mock_qwc.generate_theme_config = AsyncMock()

        resp = client.post(
            "/api/projects/publish",
            data={"name": "test"},
            files={"file": ("project.qgs", b"<qgis/>", "application/xml")},
        )
        assert resp.status_code == 200

    @patch("main.qwc_service")
    @patch("main.project_service")
    def test_publish_service_error(self, mock_proj_svc, mock_qwc, client):
        mock_proj_svc.publish_project = AsyncMock(side_effect=Exception("boom"))
        qgz = _make_qgz_bytes()
        resp = client.post(
            "/api/projects/publish",
            data={"name": "bad"},
            files={"file": ("p.qgz", qgz, "application/zip")},
        )
        assert resp.status_code == 500
        assert "Failed to publish" in resp.json()["detail"]


# ── 6. QWC2 Themes  GET /themes.json ─────────────────────────

class TestThemesJson:

    @patch("main.qwc_service")
    def test_themes_json_ok(self, mock_qwc, client):
        fake_themes = {
            "themes": {
                "items": [{"id": "test_project", "title": "Test"}],
                "backgroundLayers": [],
            }
        }
        mock_qwc.generate_full_themes_json = AsyncMock(return_value=fake_themes)
        resp = client.get("/themes.json")
        assert resp.status_code == 200
        body = resp.json()
        assert "themes" in body
        # Verify called with empty string (relative URLs)
        mock_qwc.generate_full_themes_json.assert_awaited_once_with("")

    @patch("main.qwc_service")
    def test_themes_json_error(self, mock_qwc, client):
        mock_qwc.generate_full_themes_json = AsyncMock(side_effect=Exception("fail"))
        resp = client.get("/themes.json")
        assert resp.status_code == 500


# ── 7. List Themes  GET /api/v1/themes ────────────────────────

class TestListThemes:

    @patch("main.qwc_service")
    def test_list_themes_ok(self, mock_qwc, client):
        mock_qwc.list_themes = AsyncMock(return_value=[
            {"id": "proj_a", "title": "Project A"},
            {"id": "proj_b", "title": "Project B"},
        ])
        resp = client.get("/api/v1/themes")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["themes"]) == 2

    @patch("main.qwc_service")
    def test_list_themes_empty(self, mock_qwc, client):
        mock_qwc.list_themes = AsyncMock(return_value=[])
        resp = client.get("/api/v1/themes")
        assert resp.status_code == 200
        assert body_themes_empty(resp)


def body_themes_empty(resp):
    return resp.json()["themes"] == []


# ── 8. Get Theme Config  GET /api/v1/themes/{name} ───────────

class TestGetThemeConfig:

    @patch("main.qwc_service")
    def test_get_theme_found(self, mock_qwc, client):
        mock_qwc.get_theme_config = AsyncMock(return_value={
            "id": "test_project",
            "title": "Test",
            "layers": [],
        })
        resp = client.get("/api/v1/themes/test_project")
        assert resp.status_code == 200
        assert resp.json()["id"] == "test_project"

    @patch("main.qwc_service")
    def test_get_theme_not_found(self, mock_qwc, client):
        mock_qwc.get_theme_config = AsyncMock(return_value=None)
        resp = client.get("/api/v1/themes/nonexistent")
        assert resp.status_code == 404

    @patch("main.qwc_service")
    def test_get_theme_error(self, mock_qwc, client):
        mock_qwc.get_theme_config = AsyncMock(side_effect=Exception("err"))
        resp = client.get("/api/v1/themes/bad")
        assert resp.status_code == 500


# ── 9. System Status  GET /api/status ─────────────────────────

class TestSystemStatus:

    @patch("main.project_service")
    @patch("main.data_service")
    def test_status_all_healthy(self, mock_data_svc, mock_proj_svc, client):
        mock_data_svc.check_connection = AsyncMock(return_value={
            "connected": True,
            "version": "PostgreSQL 15",
        })
        mock_proj_svc.check_qgis_server = AsyncMock(return_value={"online": True})
        mock_proj_svc.list_projects = AsyncMock(return_value=[FAKE_PROJECT])
        mock_proj_svc.get_storage_usage = AsyncMock(return_value="1.2 MB")

        resp = client.get("/api/status")
        assert resp.status_code == 200
        body = resp.json()
        assert body["database"]["connected"] is True
        assert body["qgis_server"]["online"] is True
        assert body["projects_count"] == 1
        assert body["storage_used"] == "1.2 MB"

    @patch("main.project_service")
    @patch("main.data_service")
    def test_status_db_down(self, mock_data_svc, mock_proj_svc, client):
        mock_data_svc.check_connection = AsyncMock(
            side_effect=Exception("connection refused")
        )
        resp = client.get("/api/status")
        assert resp.status_code == 500


# ── 10. WMS Proxy  GET/POST /api/projects/{name}/wms ─────────

class TestWMSProxy:

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_get_capabilities(self, mock_storage, mock_httpx_cls, client):
        """GET WMS GetCapabilities returns XML from QGIS Server."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        # Mock httpx response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b'<WMS_Capabilities version="1.3.0"/>'
        mock_response.headers = {"Content-Type": "application/xml"}
        mock_response.text = '<WMS_Capabilities version="1.3.0"/>'

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.get(
            "/api/projects/test_project/wms",
            params={"SERVICE": "WMS", "REQUEST": "GetCapabilities"},
        )
        assert resp.status_code == 200
        assert b"WMS_Capabilities" in resp.content
        mock_storage.retrieve_qgz.assert_called_once_with("test_project")

    @patch("main.storage_service")
    def test_wms_project_not_found(self, mock_storage, client):
        mock_storage.retrieve_qgz.return_value = None
        resp = client.get(
            "/api/projects/nonexistent/wms",
            params={"SERVICE": "WMS", "REQUEST": "GetCapabilities"},
        )
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_qgis_server_unreachable(self, mock_storage, mock_httpx_cls, client):
        """If QGIS Server is down, should return 502."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(
            side_effect=httpx.ConnectError("Connection refused")
        )
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.get(
            "/api/projects/test_project/wms",
            params={"SERVICE": "WMS", "REQUEST": "GetCapabilities"},
        )
        assert resp.status_code == 502
        assert "unreachable" in resp.json()["detail"].lower()

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_qgis_server_timeout(self, mock_storage, mock_httpx_cls, client):
        """If QGIS Server times out, should return 504."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(
            side_effect=httpx.TimeoutException("read timed out")
        )
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.get(
            "/api/projects/test_project/wms",
            params={"SERVICE": "WMS", "REQUEST": "GetMap"},
        )
        assert resp.status_code == 504
        assert "timeout" in resp.json()["detail"].lower()

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_getmap_returns_image(self, mock_storage, mock_httpx_cls, client):
        """GetMap should forward PNG content from QGIS Server."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal PNG header
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = fake_png
        mock_response.headers = {"Content-Type": "image/png"}
        mock_response.text = ""

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.get(
            "/api/projects/test_project/wms",
            params={
                "SERVICE": "WMS",
                "REQUEST": "GetMap",
                "LAYERS": "test_layer",
                "WIDTH": "800",
                "HEIGHT": "600",
                "BBOX": "2600000,1200000,2650000,1250000",
                "SRS": "EPSG:2056",
                "FORMAT": "image/png",
            },
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/png"
        assert resp.content[:4] == b"\x89PNG"

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_post_method(self, mock_storage, mock_httpx_cls, client):
        """WMS endpoint should also accept POST requests (QWC2 sends POST)."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"<WMS_Capabilities/>"
        mock_response.headers = {"Content-Type": "application/xml"}
        mock_response.text = "<WMS_Capabilities/>"

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.post(
            "/api/projects/test_project/wms",
            content="SERVICE=WMS&REQUEST=GetCapabilities",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 200

    @patch("main.httpx.AsyncClient")
    @patch("main.storage_service")
    def test_wms_cors_header_present(self, mock_storage, mock_httpx_cls, client):
        """WMS responses must have Access-Control-Allow-Origin for cross-origin map tiles."""
        mock_storage.retrieve_qgz.return_value = _make_qgz_bytes()

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"<WMS_Capabilities/>"
        mock_response.headers = {"Content-Type": "application/xml"}
        mock_response.text = ""

        mock_client_instance = AsyncMock()
        mock_client_instance.get = AsyncMock(return_value=mock_response)
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_cls.return_value = mock_client_instance

        resp = client.get(
            "/api/projects/test_project/wms",
            params={"SERVICE": "WMS", "REQUEST": "GetCapabilities"},
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "*"


# ── 11. CORS Preflight ────────────────────────────────────────

class TestCORS:

    def test_cors_preflight_projects(self, client):
        resp = client.options(
            "/api/projects",
            headers={
                "Origin": "https://dev.dufour.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.status_code == 200

    def test_cors_preflight_wms(self, client):
        resp = client.options(
            "/api/projects/test/wms",
            headers={
                "Origin": "https://dev.dufour.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert resp.status_code == 200


# ── Import httpx at module level for exception types ──────────
import httpx
