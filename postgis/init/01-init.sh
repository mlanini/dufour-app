#!/bin/bash
set -e

# Initialize PostGIS database for dufour.app
echo "Initializing PostGIS database..."

# Create extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
    
    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS user_data;
    CREATE SCHEMA IF NOT EXISTS scenarios;
    CREATE SCHEMA IF NOT EXISTS layers;
    
    -- Create table for user-uploaded vector data
    CREATE TABLE IF NOT EXISTS user_data.uploads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        geom_type VARCHAR(50),
        srid INTEGER DEFAULT 3857,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
    );
    
    -- Create table for military scenarios
    CREATE TABLE IF NOT EXISTS scenarios.scenarios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        scenario_data JSONB,
        bbox GEOMETRY(POLYGON, 3857)
    );
    
    -- Create table for military units
    CREATE TABLE IF NOT EXISTS scenarios.units (
        id SERIAL PRIMARY KEY,
        scenario_id INTEGER REFERENCES scenarios.scenarios(id) ON DELETE CASCADE,
        unit_name VARCHAR(255) NOT NULL,
        symbol_code VARCHAR(50),
        unit_type VARCHAR(100),
        parent_unit_id INTEGER,
        position GEOMETRY(POINT, 3857),
        timestamp TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Create spatial index
    CREATE INDEX IF NOT EXISTS idx_units_position ON scenarios.units USING GIST(position);
    CREATE INDEX IF NOT EXISTS idx_scenarios_bbox ON scenarios.scenarios USING GIST(bbox);
    
    -- Create table for redlining/drawing features
    CREATE TABLE IF NOT EXISTS user_data.drawings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        geometry GEOMETRY(GEOMETRY, 3857),
        style JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_drawings_geometry ON user_data.drawings USING GIST(geometry);
    
    -- Create table for GPX tracks
    CREATE TABLE IF NOT EXISTS user_data.gpx_tracks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        track GEOMETRY(LINESTRING, 3857),
        elevation_profile JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_gpx_tracks ON user_data.gpx_tracks USING GIST(track);
    
    -- Create table for waypoints
    CREATE TABLE IF NOT EXISTS user_data.waypoints (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location GEOMETRY(POINT, 3857),
        elevation FLOAT,
        symbol VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_waypoints_location ON user_data.waypoints USING GIST(location);
    
    -- Grant permissions
    GRANT ALL PRIVILEGES ON SCHEMA user_data TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON SCHEMA scenarios TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON SCHEMA layers TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA user_data TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA scenarios TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA user_data TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA scenarios TO $POSTGRES_USER;
    
    -- Create sample data for testing (optional)
    INSERT INTO scenarios.scenarios (name, description, scenario_data) 
    VALUES ('Demo Scenario', 'Sample military scenario for testing', '{}')
    ON CONFLICT DO NOTHING;
    
    EOSQL

echo "PostGIS initialization complete!"
