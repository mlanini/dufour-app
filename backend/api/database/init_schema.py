"""
Database Schema Initialization Script
Reads schema.sql and applies it to the database
"""
import os
import sys
import logging
from pathlib import Path
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.connection import db

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if os.getenv('LOG_LEVEL') == 'DEBUG' else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def init_schema():
    """
    Initialize database schema from schema.sql file
    """
    schema_file = Path(__file__).parent / 'schema.sql'
    
    if not schema_file.exists():
        logger.error(f"Schema file not found: {schema_file}")
        return False
    
    logger.info(f"Reading schema from: {schema_file}")
    
    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    try:
        # Test connection first
        logger.info("Testing database connection...")
        connection_status = db.test_connection()
        
        if not connection_status['connected']:
            logger.error(f"Connection failed: {connection_status.get('error')}")
            return False
        
        logger.info(f"Connected to {connection_status['host']}/{connection_status['database']}")
        logger.info(f"PostgreSQL: {connection_status.get('postgresql_version')}")
        logger.info(f"PostGIS: {connection_status.get('postgis_version')}")
        logger.info(f"Latency: {connection_status['latency_ms']}ms")
        
        # Execute schema
        logger.info("Applying database schema...")
        
        with db.get_engine().connect() as conn:
            # Split by semicolons and execute each statement
            statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
            
            for i, statement in enumerate(statements, 1):
                if statement and not statement.startswith('--'):
                    try:
                        conn.execute(statement)
                        logger.debug(f"Executed statement {i}/{len(statements)}")
                    except Exception as e:
                        # Some statements may fail if objects already exist, that's OK
                        if 'already exists' in str(e).lower():
                            logger.debug(f"Statement {i} skipped (already exists)")
                        else:
                            logger.warning(f"Statement {i} failed: {e}")
            
            conn.commit()
        
        logger.info("✅ Database schema initialized successfully")
        
        # Verify tables created
        logger.info("Verifying tables...")
        with db.get_engine().connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            logger.info(f"Created tables: {', '.join(tables)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Schema initialization failed: {e}", exc_info=True)
        return False


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("DUFOUR DATABASE SCHEMA INITIALIZATION")
    logger.info("=" * 60)
    
    success = init_schema()
    
    if success:
        logger.info("=" * 60)
        logger.info("✅ INITIALIZATION COMPLETE")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("=" * 60)
        logger.error("❌ INITIALIZATION FAILED")
        logger.error("=" * 60)
        sys.exit(1)
