/**
 * MeasurementPanel - Measurement tools
 */
import React from 'react';

const MeasurementPanel = ({ onAction }) => {
  return (
    <div style={{ padding: '8px' }}>
      <p style={{ fontSize: '13px', marginBottom: '12px' }}>
        Select a measurement type from the toolbar and click on the map to measure.
      </p>
      
      <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
        <strong style={{ fontSize: '13px' }}>Results:</strong>
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          No measurements yet
        </div>
      </div>
    </div>
  );
};

export default MeasurementPanel;
