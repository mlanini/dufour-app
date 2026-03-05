/**
 * ChartEditPanel - Visualizzazione e editing grafico ORBAT
 * Visualizza la gerarchia come organigramma
 */
import React, { useState, useRef, useEffect } from 'react';
import '../styles/chart-edit-panel.css';

const ChartEditPanel = ({ orbatTree, onUnitSelect, onUnitEdit, selectedUnitId }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const chartRef = useRef(null);
  const [chartSettings, setChartSettings] = useState({
    showStrength: true,
    showEquipment: false,
    compactMode: false,
    colorByAffiliation: true
  });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && e.shiftKey) { // Shift + Left click for panning
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && dragStart) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragStart(null);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5;
      setZoomLevel(prev => Math.max(50, Math.min(200, prev + delta)));
    }
  };

  useEffect(() => {
    const chartEl = chartRef.current;
    if (chartEl) {
      chartEl.addEventListener('wheel', handleWheel, { passive: false });
      return () => chartEl.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const renderUnit = (unit, level = 0) => {
    if (!unit) return null;

    const isSelected = unit.id === selectedUnitId;
    const hasChildren = unit.children && unit.children.length > 0;

    // Affiliazione colore
    const getAffiliationColor = (affiliation) => {
      if (!chartSettings.colorByAffiliation) return '#3498db';
      switch (affiliation) {
        case 'friend': return '#3498db';
        case 'hostile': return '#e74c3c';
        case 'neutral': return '#2ecc71';
        case 'unknown': return '#f39c12';
        default: return '#95a5a6';
      }
    };

    const borderColor = getAffiliationColor(unit.affiliation);

    return (
      <div key={unit.id} className="chart-node-container">
        <div
          className={`chart-node ${isSelected ? 'selected' : ''}`}
          style={{ borderColor }}
          onClick={() => onUnitSelect && onUnitSelect(unit.id)}
          onDoubleClick={() => onUnitEdit && onUnitEdit(unit.id)}
        >
          <div className="chart-node-header">
            <div className="chart-node-icon">{unit.echelon || '🎖️'}</div>
            <div className="chart-node-title">{unit.name}</div>
          </div>
          
          {!chartSettings.compactMode && (
            <div className="chart-node-details">
              <div className="chart-node-detail">
                <span className="detail-label">Echelon:</span>
                <span className="detail-value">{unit.level || 'N/A'}</span>
              </div>
              {chartSettings.showStrength && unit.strength && (
                <div className="chart-node-detail">
                  <span className="detail-label">Forza:</span>
                  <span className="detail-value">{unit.strength}</span>
                </div>
              )}
              {chartSettings.showEquipment && unit.equipment && (
                <div className="chart-node-detail">
                  <span className="detail-label">Equipaggiamento:</span>
                  <span className="detail-value">{unit.equipment}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {hasChildren && (
          <div className="chart-children">
            <div className="chart-connector" />
            <div className="chart-children-container">
              {unit.children.map(child => renderUnit(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportChart = (format) => {
    alert(`Export in formato ${format} - Funzionalità da implementare`);
  };

  return (
    <div className="chart-edit-panel">
      {/* Toolbar */}
      <div className="chart-toolbar">
        <div className="chart-toolbar-section">
          <button
            className="chart-toolbar-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            🔍➖
          </button>
          <span className="zoom-level">{zoomLevel}%</span>
          <button
            className="chart-toolbar-btn"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            🔍➕
          </button>
          <button
            className="chart-toolbar-btn"
            onClick={handleZoomReset}
            title="Reset Zoom"
          >
            🎯
          </button>
        </div>

        <div className="chart-toolbar-section">
          <label className="chart-option">
            <input
              type="checkbox"
              checked={chartSettings.showStrength}
              onChange={(e) => setChartSettings({ ...chartSettings, showStrength: e.target.checked })}
            />
            <span>Forza</span>
          </label>
          <label className="chart-option">
            <input
              type="checkbox"
              checked={chartSettings.showEquipment}
              onChange={(e) => setChartSettings({ ...chartSettings, showEquipment: e.target.checked })}
            />
            <span>Equipaggiamento</span>
          </label>
          <label className="chart-option">
            <input
              type="checkbox"
              checked={chartSettings.compactMode}
              onChange={(e) => setChartSettings({ ...chartSettings, compactMode: e.target.checked })}
            />
            <span>Compatto</span>
          </label>
          <label className="chart-option">
            <input
              type="checkbox"
              checked={chartSettings.colorByAffiliation}
              onChange={(e) => setChartSettings({ ...chartSettings, colorByAffiliation: e.target.checked })}
            />
            <span>Colori affiliazione</span>
          </label>
        </div>

        <div className="chart-toolbar-section">
          <button
            className="chart-toolbar-btn"
            onClick={() => exportChart('SVG')}
            title="Esporta SVG"
          >
            📄 SVG
          </button>
          <button
            className="chart-toolbar-btn"
            onClick={() => exportChart('PNG')}
            title="Esporta PNG"
          >
            🖼️ PNG
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartRef}
        className={`chart-canvas ${isPanning ? 'panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="chart-content"
          style={{
            transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left'
          }}
        >
          {orbatTree ? (
            renderUnit(orbatTree.root || orbatTree)
          ) : (
            <div className="chart-empty-state">
              <p>📊 Nessun ORBAT da visualizzare</p>
              <small>Seleziona un'unità root dal pannello ORBAT Manager</small>
            </div>
          )}
        </div>
      </div>

      {/* Help Hint */}
      <div className="chart-help">
        💡 <strong>Suggerimenti:</strong> Ctrl+Scroll = Zoom • Shift+Drag = Pan • Doppio click = Modifica
      </div>
    </div>
  );
};

export default ChartEditPanel;
