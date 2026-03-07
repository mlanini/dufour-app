"""
Pytest Configuration for Dufour Backend Tests
"""
import os
import sys
from pathlib import Path

# Add backend/api to Python path
sys.path.insert(0, str(Path(__file__).parent / 'api'))

# Set test environment variables
os.environ['LOG_LEVEL'] = 'DEBUG'
os.environ['TESTING'] = 'true'

# PostgreSQL connection (override with test DB if needed)
if not os.getenv('POSTGIS_HOST'):
    os.environ['POSTGIS_HOST'] = 'postgresql-intelligeo.alwaysdata.net'
if not os.getenv('POSTGIS_DB'):
    os.environ['POSTGIS_DB'] = 'intelligeo_dufour'
if not os.getenv('POSTGIS_USER'):
    os.environ['POSTGIS_USER'] = 'intelligeo_dufour'
# Password should be set externally for security
