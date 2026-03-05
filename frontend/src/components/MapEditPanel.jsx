/**
 * MapEditPanel - Strumenti per editing su mappa
 * Include disegno, misurazioni, e manipolazione geometrie
 */
import React, { useState } from 'react';
import '../styles/map-edit-panel.css';

const MapEditPanel = ({ onClose, onToolSelect, activeTool }) => {
  const [drawMode, setDrawMode] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [modifyMode, setModifyMode] = useState(false);

  const drawTools = [
    { id: 'point', label: 'Punto', icon: '📍' },
    { id: 'line', label: 'Linea', icon: '📏' },
    { id: 'polygon', label: 'Poligono', icon: '⬟' },
    { id: 'circle', label: 'Cerchio', icon: '⭕' },
    { id: 'rectangle', label: 'Rettangolo', icon: '▭' }
  ];

  const editTools = [
    { id: 'select', label: 'Seleziona', icon: '👆' },
    { id: 'modify', label: 'Modifica', icon: '✏️' },
    { id: 'move', label: 'Sposta', icon: '↔️' },
    { id: 'rotate', label: 'Ruota', icon: '↻' },
    { id: 'delete', label: 'Elimina', icon: '🗑️' }
  ];

  const handleDrawTool = (toolId) => {
    setDrawMode(toolId);
    setModifyMode(false);
    if (onToolSelect) {
      onToolSelect({ type: 'draw', tool: toolId });
    }
  };

  const handleEditTool = (toolId) => {
    if (toolId === 'modify') {
      setModifyMode(!modifyMode);
    } else {
      setModifyMode(false);
    }
    setDrawMode(null);
    
    if (onToolSelect) {
      onToolSelect({ type: 'edit', tool: toolId });
    }
  };

  const toggleSnap = () => {
    setSnapEnabled(!snapEnabled);
    if (onToolSelect) {
      onToolSelect({ type: 'setting', tool: 'snap', value: !snapEnabled });
    }
  };

  return (
    <div className="map-edit-panel">
      <div className="panel-header">
        <h3>Strumenti Disegno</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        {/* Sezione Disegno */}
        <section className="tool-section">
          <h4>Disegna</h4>
          <div className="tool-grid">
            {drawTools.map(tool => (
              <button
                key={tool.id}
                className={`tool-button ${drawMode === tool.id ? 'active' : ''}`}
                onClick={() => handleDrawTool(tool.id)}
                title={tool.label}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sezione Modifica */}
        <section className="tool-section">
          <h4>Modifica</h4>
          <div className="tool-grid">
            {editTools.map(tool => (
              <button
                key={tool.id}
                className={`tool-button ${
                  (tool.id === 'modify' && modifyMode) || 
                  (activeTool === tool.id) ? 'active' : ''
                }`}
                onClick={() => handleEditTool(tool.id)}
                title={tool.label}
              >
                <span className="tool-icon">{tool.icon}</span>
                <span className="tool-label">{tool.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Opzioni */}
        <section className="tool-section">
          <h4>Opzioni</h4>
          <div className="tool-options">
            <label className="option-item">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={toggleSnap}
              />
              <span>Snap alla griglia</span>
            </label>
          </div>
        </section>

        {/* Info corrente */}
        {(drawMode || modifyMode) && (
          <section className="tool-section info-section">
            <div className="tool-info">
              {drawMode && (
                <p>🎨 Modalità disegno: <strong>{drawTools.find(t => t.id === drawMode)?.label}</strong></p>
              )}
              {modifyMode && (
                <p>✏️ Modalità modifica attiva</p>
              )}
              <small>Premi ESC per annullare</small>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MapEditPanel;
