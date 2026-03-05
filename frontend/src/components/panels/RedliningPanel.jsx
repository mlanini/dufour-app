/**
 * RedliningPanel - Drawing tools
 */
import React from 'react';

const RedliningPanel = ({ onAction }) => {
  const handleStyleChange = () => {
    // Trigger action callback on style change (for mobile auto-close)
    if (onAction) onAction();
  };

  return (
    <div style={{ padding: '8px' }}>
      <p style={{ fontSize: '13px', marginBottom: '12px' }}>
        Draw on the map using the toolbar tools.
      </p>
      
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Style Options</h4>
        
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Stroke Color
        </label>
        <input 
          type="color" 
          defaultValue="#ff0000" 
          onChange={handleStyleChange}
          style={{ width: '100%', marginBottom: '12px' }} 
        />
        
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Fill Color
        </label>
        <input 
          type="color" 
          defaultValue="#ff000033" 
          onChange={handleStyleChange}
          style={{ width: '100%', marginBottom: '12px' }} 
        />
        
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Line Width
        </label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          defaultValue="2" 
          onChange={handleStyleChange}
          style={{ width: '100%' }} 
        />
      </div>
    </div>
  );
};

export default RedliningPanel;
