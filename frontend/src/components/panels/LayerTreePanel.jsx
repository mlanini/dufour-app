/**
 * LayerTreePanel - Complete
 * Panel for managing map layers with opacity, reordering, and context menu
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { EyeIcon, EyeOffIcon, MenuIcon, TrashIcon } from '../icons/Icons';

const LayerTreePanel = ({ onAction, map }) => {
  const themeConfig = useSelector((state) => state.app.themeConfig);
  const [layers, setLayers] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Carica layer dal theme config
  useEffect(() => {
    if (!themeConfig || !map) return;

    console.log('LayerTreePanel: Loading layers from theme');

    try {
      // Ottieni layer dalla mappa OpenLayers
      const olLayers = map.getLayers().getArray();
      
      // Converti in formato per UI
      const layerList = olLayers.map((olLayer, index) => {
        const name = olLayer.get('name') || `Layer ${index}`;
        const title = olLayer.get('title') || name;
        const type = olLayer.get('background') ? 'base' : 'overlay';
        const visible = olLayer.getVisible();
        const opacity = olLayer.getOpacity();

        return {
          id: index,
          name: title,
          visible: visible,
          opacity: opacity,
          type: type,
          olLayer: olLayer // Riferimento al layer OpenLayers
        };
      });

      setLayers(layerList);
      console.log(`LayerTreePanel: Loaded ${layerList.length} layers`);

    } catch (error) {
      console.error('Error loading layers in LayerTreePanel:', error);
    }
  }, [themeConfig, map]);

  const toggleLayer = (id, event) => {
    event.stopPropagation();
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.olLayer) return;

    // Toggle visibilità sul layer OpenLayers
    const newVisibility = !layer.olLayer.getVisible();
    layer.olLayer.setVisible(newVisibility);

    // Aggiorna stato locale
    setLayers(layers.map(l => 
      l.id === id ? { ...l, visible: newVisibility } : l
    ));
  };

  const handleOpacityChange = (id, newOpacity) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || !layer.olLayer) return;

    layer.olLayer.setOpacity(newOpacity);
    setLayers(layers.map(l => 
      l.id === id ? { ...l, opacity: newOpacity } : l
    ));
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newLayers = [...layers];
    const draggedLayer = newLayers[draggedItem];
    newLayers.splice(draggedItem, 1);
    newLayers.splice(index, 0, draggedLayer);

    setLayers(newLayers);
    setDraggedItem(index);

    // Aggiorna ordine nella mappa OpenLayers
    const olLayers = map.getLayers();
    olLayers.clear();
    newLayers.reverse().forEach(l => olLayers.push(l.olLayer));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Context menu handlers
  const handleContextMenu = (e, layer) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      layer: layer
    });
  };

  const handleRemoveLayer = (layer) => {
    if (layer.type === 'base') {
      alert('Cannot remove base map layer');
      return;
    }

    map.removeLayer(layer.olLayer);
    setLayers(layers.filter(l => l.id !== layer.id));
    setContextMenu(null);
  };

  const handleZoomToLayer = (layer) => {
    const extent = layer.olLayer.getSource()?.getExtent();
    if (extent && extent.every(coord => isFinite(coord))) {
      map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
    }
    setContextMenu(null);
  };

  // Chiudi context menu quando si clicca fuori
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const baseMapLayers = layers.filter(l => l.type === 'base');
  const overlayLayers = layers.filter(l => l.type === 'overlay');

  return (
    <div style={{ padding: '8px', userSelect: 'none' }}>
      {/* Base Maps */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
          Base Maps
        </h4>
        {baseMapLayers.map(layer => (
          <div
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: layer.visible ? '#e7f1ff' : 'transparent',
              border: '1px solid #ddd',
              marginBottom: '4px'
            }}
            onClick={() => toggleLayer(layer.id, event)}
          >
            <input
              type="radio"
              checked={layer.visible}
              onChange={() => {}}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '13px', flex: 1 }}>{layer.name}</span>
          </div>
        ))}
      </div>

      {/* Overlay Layers */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
          Overlay Layers
        </h4>
        {overlayLayers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onContextMenu={(e) => handleContextMenu(e, layer)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginBottom: '4px',
              backgroundColor: draggedItem === index ? '#f0f0f0' : 'white',
              cursor: 'move'
            }}
          >
            {/* Layer header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <button
                onClick={(e) => toggleLayer(layer.id, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
              </button>
              <span style={{ fontSize: '13px', flex: 1, marginLeft: '8px' }}>
                {layer.name}
              </span>
              <MenuIcon style={{ cursor: 'pointer' }} />
            </div>

            {/* Opacity slider */}
            {layer.visible && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', marginRight: '8px', color: '#666' }}>
                  Opacity:
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', marginLeft: '8px', color: '#666', minWidth: '30px' }}>
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '150px'
          }}
        >
          <div
            onClick={() => handleZoomToLayer(contextMenu.layer)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              borderBottom: '1px solid #eee'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
          >
            🔍 Zoom to Layer
          </div>
          <div
            onClick={() => handleRemoveLayer(contextMenu.layer)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#d32f2f'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebee'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
          >
            🗑️ Remove Layer
          </div>
        </div>
      )}

      {/* Add Layer Button */}
      <button
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '8px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1565c0'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d2'}
      >
        + Add Layer
      </button>
    </div>
  );
};

export default LayerTreePanel;
