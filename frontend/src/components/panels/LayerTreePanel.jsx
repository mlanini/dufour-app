/**
 * LayerTreePanel
 * Panel for managing map layers
 */
import React, { useState } from 'react';

const LayerTreePanel = ({ onAction }) => {
  const [layers, setLayers] = useState([
    { id: 1, name: 'SwissTopo National Map', visible: true, type: 'base' },
    { id: 2, name: 'SwissImage Aerial', visible: false, type: 'base' },
    { id: 3, name: 'User Drawings', visible: true, type: 'overlay' },
    { id: 4, name: 'Military Units', visible: true, type: 'overlay' }
  ]);

  const toggleLayer = (id) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
    // Close panel on mobile after toggling layer
    if (onAction) onAction();
  };

  const baseMapLayers = layers.filter(l => l.type === 'base');
  const overlayLayers = layers.filter(l => l.type === 'overlay');

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Base Maps</h4>
        {baseMapLayers.map(layer => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: layer.visible ? '#e7f1ff' : 'transparent'
            }}
            onClick={() => toggleLayer(layer.id)}
          >
            <input
              type="radio"
              checked={layer.visible}
              onChange={() => {}}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px' }}>{layer.name}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Overlay Layers</h4>
        {overlayLayers.map(layer => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => toggleLayer(layer.id)}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => {}}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px' }}>{layer.name}</span>
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '8px',
          backgroundColor: 'var(--secondary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        + Add Layer
      </button>
    </div>
  );
};

export default LayerTreePanel;
