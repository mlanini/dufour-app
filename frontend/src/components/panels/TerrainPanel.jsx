/**
 * TerrainPanel - Terrain analysis tools
 */
import React from 'react';

const TerrainPanel = ({ onAction }) => {
  const handleCalculateSlope = () => {
    // TODO: Implement slope calculation
    console.log('Calculate slope');
    if (onAction) onAction(); // Close panel on mobile
  };

  const handleCalculateViewshed = () => {
    // TODO: Implement viewshed calculation
    console.log('Calculate viewshed');
    if (onAction) onAction(); // Close panel on mobile
  };

  return (
    <div style={{ padding: '8px' }}>
      <p style={{ fontSize: '13px', marginBottom: '12px' }}>
        Terrain analysis using Swiss elevation data (SwissALTI3D).
      </p>
      
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Slope Analysis</h4>
        <button 
          onClick={handleCalculateSlope}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
          Calculate Slope
        </button>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Viewshed Analysis</h4>
        <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
          Click on map to set viewpoint
        </p>
        <button 
          onClick={handleCalculateViewshed}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--secondary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
          Calculate Viewshed
        </button>
      </div>
    </div>
  );
};

export default TerrainPanel;
