/**
 * ImportPanel - Data import
 */
import React from 'react';

const ImportPanel = ({ onAction }) => {
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      console.log('File selected:', e.target.files[0].name);
      // Close panel on mobile after file selection
      if (onAction) onAction();
    }
  };

  const handleAddLayer = () => {
    console.log('Add WMS/WMTS layer');
    // Close panel on mobile after adding layer
    if (onAction) onAction();
  };

  return (
    <div style={{ padding: '8px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Import Geospatial Data</h4>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 500 }}>
          File Upload
        </label>
        <input 
          type="file" 
          accept=".gpx,.kml,.geojson,.json" 
          onChange={handleFileChange}
          style={{ width: '100%', fontSize: '12px' }} 
        />
        <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
          Supported formats: GPX, KML, GeoJSON
        </p>
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 500 }}>
          Or add WMS/WMTS URL
        </label>
        <input
          type="url"
          placeholder="https://..."
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <button 
          onClick={handleAddLayer}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
          Add Layer
        </button>
      </div>
    </div>
  );
};

export default ImportPanel;
