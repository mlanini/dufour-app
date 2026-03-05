/**
 * PrintPanel - Print/Export
 */
import React from 'react';

const PrintPanel = ({ onAction }) => {
  const handlePrint = () => {
    console.log('Generate PDF');
    // Close panel on mobile after generating PDF
    if (onAction) onAction();
  };

  return (
    <div style={{ padding: '8px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Print Map</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Layout
        </label>
        <select style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px' }}>
          <option>A4 Portrait</option>
          <option>A4 Landscape</option>
          <option>A3 Portrait</option>
          <option>A3 Landscape</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          DPI
        </label>
        <select style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px' }}>
          <option>96</option>
          <option>150</option>
          <option selected>300</option>
        </select>
      </div>
      
      <button 
        onClick={handlePrint}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: 'var(--secondary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600
        }}>
        🖨️ Generate PDF
      </button>
    </div>
  );
};

export default PrintPanel;
