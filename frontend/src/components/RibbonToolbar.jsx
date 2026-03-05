/**
 * RibbonToolbar Component
 * KADAS-style ribbon interface with grouped tools
 */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import '../styles/ribbon.css';

const RibbonToolbar = ({ onToolSelect, editMode, onEditModeChange }) => {
  const [activeTab, setActiveTab] = useState('map');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useSelector(state => state.locale?.current || 'en-US');
  const activeTool = useSelector(state => state.task?.id);

  const tabs = [
    { id: 'map', label: { 'en-US': 'Map', 'de-CH': 'Karte', 'fr-FR': 'Carte', 'it-IT': 'Mappa' } },
    { id: 'draw', label: { 'en-US': 'Draw', 'de-CH': 'Zeichnen', 'fr-FR': 'Dessiner', 'it-IT': 'Disegnare' } },
    { id: 'measure', label: { 'en-US': 'Measure', 'de-CH': 'Messen', 'fr-FR': 'Mesurer', 'it-IT': 'Misurare' } },
    { id: 'analysis', label: { 'en-US': 'Analysis', 'de-CH': 'Analyse', 'fr-FR': 'Analyse', 'it-IT': 'Analisi' } },
    { id: 'data', label: { 'en-US': 'Data', 'de-CH': 'Daten', 'fr-FR': 'Données', 'it-IT': 'Dati' } }
  ];

  const tools = {
    map: [
      {
        group: { 'en-US': 'Navigation', 'de-CH': 'Navigation', 'fr-FR': 'Navigation', 'it-IT': 'Navigazione' },
        items: [
          { id: 'zoom-in', icon: '🔍+', label: { 'en-US': 'Zoom In', 'de-CH': 'Vergrössern', 'fr-FR': 'Zoom +', 'it-IT': 'Ingrandisci' } },
          { id: 'zoom-out', icon: '🔍−', label: { 'en-US': 'Zoom Out', 'de-CH': 'Verkleinern', 'fr-FR': 'Zoom −', 'it-IT': 'Rimpicciolisci' } },
          { id: 'home', icon: '🏠', label: { 'en-US': 'Home', 'de-CH': 'Start', 'fr-FR': 'Accueil', 'it-IT': 'Inizio' } },
          { id: 'locate', icon: '📍', label: { 'en-US': 'Locate', 'de-CH': 'Standort', 'fr-FR': 'Position', 'it-IT': 'Posizione' } }
        ]
      },
      {
        group: { 'en-US': 'Layers', 'de-CH': 'Ebenen', 'fr-FR': 'Couches', 'it-IT': 'Livelli' },
        items: [
          { id: 'layer-tree', icon: '📑', label: { 'en-US': 'Layers', 'de-CH': 'Ebenen', 'fr-FR': 'Couches', 'it-IT': 'Livelli' }, size: 'large' },
          { id: 'background', icon: '🗺️', label: { 'en-US': 'Background', 'de-CH': 'Hintergrund', 'fr-FR': 'Fond', 'it-IT': 'Sfondo' } }
        ]
      },
      {
        group: { 'en-US': 'Tools', 'de-CH': 'Werkzeuge', 'fr-FR': 'Outils', 'it-IT': 'Strumenti' },
        items: [
          { id: 'identify', icon: 'ℹ️', label: { 'en-US': 'Identify', 'de-CH': 'Abfragen', 'fr-FR': 'Identifier', 'it-IT': 'Identificare' } },
          { id: 'search', icon: '🔎', label: { 'en-US': 'Search', 'de-CH': 'Suchen', 'fr-FR': 'Rechercher', 'it-IT': 'Cercare' }, size: 'large' }
        ]
      }
    ],
    draw: [
      {
        group: { 'en-US': 'Geometry', 'de-CH': 'Geometrie', 'fr-FR': 'Géométrie', 'it-IT': 'Geometria' },
        items: [
          { id: 'draw-point', icon: '⚫', label: { 'en-US': 'Point', 'de-CH': 'Punkt', 'fr-FR': 'Point', 'it-IT': 'Punto' } },
          { id: 'draw-line', icon: '📏', label: { 'en-US': 'Line', 'de-CH': 'Linie', 'fr-FR': 'Ligne', 'it-IT': 'Linea' } },
          { id: 'draw-polygon', icon: '⬟', label: { 'en-US': 'Polygon', 'de-CH': 'Polygon', 'fr-FR': 'Polygone', 'it-IT': 'Poligono' } },
          { id: 'draw-circle', icon: '⭕', label: { 'en-US': 'Circle', 'de-CH': 'Kreis', 'fr-FR': 'Cercle', 'it-IT': 'Cerchio' } },
          { id: 'draw-rectangle', icon: '▭', label: { 'en-US': 'Rectangle', 'de-CH': 'Rechteck', 'fr-FR': 'Rectangle', 'it-IT': 'Rettangolo' } }
        ]
      },
      {
        group: { 'en-US': 'Annotation', 'de-CH': 'Beschriftung', 'fr-FR': 'Annotation', 'it-IT': 'Annotazione' },
        items: [
          { id: 'draw-text', icon: '📝', label: { 'en-US': 'Text', 'de-CH': 'Text', 'fr-FR': 'Texte', 'it-IT': 'Testo' }, size: 'large' },
          { id: 'draw-marker', icon: '📌', label: { 'en-US': 'Marker', 'de-CH': 'Markierung', 'fr-FR': 'Marqueur', 'it-IT': 'Marcatore' } }
        ]
      },
      {
        group: { 'en-US': 'Edit', 'de-CH': 'Bearbeiten', 'fr-FR': 'Éditer', 'it-IT': 'Modifica' },
        items: [
          { id: 'edit-geometry', icon: '✏️', label: { 'en-US': 'Edit', 'de-CH': 'Bearbeiten', 'fr-FR': 'Éditer', 'it-IT': 'Modifica' } },
          { id: 'delete', icon: '🗑️', label: { 'en-US': 'Delete', 'de-CH': 'Löschen', 'fr-FR': 'Supprimer', 'it-IT': 'Elimina' } }
        ]
      }
    ],
    measure: [
      {
        group: { 'en-US': 'Measurements', 'de-CH': 'Messungen', 'fr-FR': 'Mesures', 'it-IT': 'Misurazioni' },
        items: [
          { id: 'measure-distance', icon: '📏', label: { 'en-US': 'Distance', 'de-CH': 'Distanz', 'fr-FR': 'Distance', 'it-IT': 'Distanza' }, size: 'large' },
          { id: 'measure-area', icon: '▭', label: { 'en-US': 'Area', 'de-CH': 'Fläche', 'fr-FR': 'Surface', 'it-IT': 'Superficie' }, size: 'large' },
          { id: 'measure-angle', icon: '📐', label: { 'en-US': 'Angle', 'de-CH': 'Winkel', 'fr-FR': 'Angle', 'it-IT': 'Angolo' } }
        ]
      },
      {
        group: { 'en-US': 'Profile', 'de-CH': 'Profil', 'fr-FR': 'Profil', 'it-IT': 'Profilo' },
        items: [
          { id: 'height-profile', icon: '📊', label: { 'en-US': 'Height Profile', 'de-CH': 'Höhenprofil', 'fr-FR': 'Profil', 'it-IT': 'Profilo' }, size: 'large' }
        ]
      }
    ],
    analysis: [
      {
        group: { 'en-US': 'Terrain', 'de-CH': 'Gelände', 'fr-FR': 'Terrain', 'it-IT': 'Terreno' },
        items: [
          { id: 'slope', icon: '⛰️', label: { 'en-US': 'Slope', 'de-CH': 'Neigung', 'fr-FR': 'Pente', 'it-IT': 'Pendenza' }, size: 'large' },
          { id: 'viewshed', icon: '👁️', label: { 'en-US': 'Viewshed', 'de-CH': 'Sichtbarkeit', 'fr-FR': 'Visibilité', 'it-IT': 'Visibilità' }, size: 'large' }
        ]
      }
    ],
    data: [
      {
        group: { 'en-US': 'Import', 'de-CH': 'Import', 'fr-FR': 'Importer', 'it-IT': 'Importa' },
        items: [
          { id: 'import-gpx', icon: '📥', label: { 'en-US': 'GPX', 'de-CH': 'GPX', 'fr-FR': 'GPX', 'it-IT': 'GPX' } },
          { id: 'import-kml', icon: '📥', label: { 'en-US': 'KML', 'de-CH': 'KML', 'fr-FR': 'KML', 'it-IT': 'KML' } },
          { id: 'import-geojson', icon: '📥', label: { 'en-US': 'GeoJSON', 'de-CH': 'GeoJSON', 'fr-FR': 'GeoJSON', 'it-IT': 'GeoJSON' } }
        ]
      },
      {
        group: { 'en-US': 'Export', 'de-CH': 'Export', 'fr-FR': 'Exporter', 'it-IT': 'Esporta' },
        items: [
          { id: 'export-map', icon: '📤', label: { 'en-US': 'Export Map', 'de-CH': 'Karte exportieren', 'fr-FR': 'Exporter', 'it-IT': 'Esporta' }, size: 'large' },
          { id: 'print', icon: '🖨️', label: { 'en-US': 'Print', 'de-CH': 'Drucken', 'fr-FR': 'Imprimer', 'it-IT': 'Stampa' }, size: 'large' }
        ]
      }
    ]
  };

  const handleToolClick = (toolId) => {
    // Close mobile menu if open (for small screens)
    if (window.innerWidth <= 768 && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  const handleTabClick = (tabId) => {
    // Close mobile menu if open (for small screens)
    if (window.innerWidth <= 768 && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    
    setActiveTab(tabId);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getLabel = (labelObj) => {
    return labelObj[locale] || labelObj['en-US'];
  };

  return (
    <div className={`ribbon-toolbar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Mobile menu button */}
      <button 
        className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Top bar with app title and quick actions */}
      <div className="ribbon-top-bar">
        <div className="ribbon-app-title">
          <span className="ribbon-app-logo">🗺️</span>
          <span>dufour.app</span>
        </div>
        <div className="ribbon-quick-actions">
          <button className="ribbon-quick-action" onClick={() => handleToolClick('settings')}>
            ⚙️ {getLabel({ 'en-US': 'Settings', 'de-CH': 'Einstellungen', 'fr-FR': 'Paramètres', 'it-IT': 'Impostazioni' })}
          </button>
          <button className="ribbon-quick-action" onClick={() => handleToolClick('help')}>
            ❓ {getLabel({ 'en-US': 'Help', 'de-CH': 'Hilfe', 'fr-FR': 'Aide', 'it-IT': 'Aiuto' })}
          </button>
        </div>
      </div>

      {/* Ribbon tabs */}
      <div className="ribbon-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {getLabel(tab.label)}
          </div>
        ))}
      </div>

      {/* Ribbon content with tool groups */}
      <div className="ribbon-content">
        {tools[activeTab]?.map((group, groupIdx) => (
          <div key={groupIdx} className="ribbon-group">
            <div className="ribbon-group-tools">
              {group.items.map(tool => (
                <button
                  key={tool.id}
                  className={`ribbon-tool ${tool.size || ''} ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => handleToolClick(tool.id)}
                  title={getLabel(tool.label)}
                >
                  <div className="ribbon-tool-icon">{tool.icon}</div>
                  <div className="ribbon-tool-label">{getLabel(tool.label)}</div>
                </button>
              ))}
            </div>
            <div className="ribbon-group-label">{getLabel(group.group)}</div>
          </div>
        ))}

        {/* Edit Mode Switcher - integrated in ribbon content */}
        <div className="ribbon-group ribbon-mode-switcher-group">
          <div className="ribbon-group-tools edit-mode-switcher">
            <button
              className={`mode-btn ${editMode === 'map' ? 'active' : ''}`}
              onClick={() => onEditModeChange && onEditModeChange('map')}
              title={getLabel({ 'en-US': 'Map Edit Mode', 'de-CH': 'Karten-Modus', 'fr-FR': 'Mode Carte', 'it-IT': 'Modalità Mappa' })}
            >
              <div className="ribbon-tool-icon">🗺️</div>
              <div className="ribbon-tool-label">{getLabel({ 'en-US': 'Map', 'de-CH': 'Karte', 'fr-FR': 'Carte', 'it-IT': 'Mappa' })}</div>
            </button>
            <button
              className={`mode-btn ${editMode === 'grid' ? 'active' : ''}`}
              onClick={() => onEditModeChange && onEditModeChange('grid')}
              title={getLabel({ 'en-US': 'Grid Edit Mode', 'de-CH': 'Tabellen-Modus', 'fr-FR': 'Mode Grille', 'it-IT': 'Modalità Griglia' })}
            >
              <div className="ribbon-tool-icon">📋</div>
              <div className="ribbon-tool-label">{getLabel({ 'en-US': 'Grid', 'de-CH': 'Tabelle', 'fr-FR': 'Grille', 'it-IT': 'Griglia' })}</div>
            </button>
            <button
              className={`mode-btn ${editMode === 'chart' ? 'active' : ''}`}
              onClick={() => onEditModeChange && onEditModeChange('chart')}
              title={getLabel({ 'en-US': 'Chart Edit Mode', 'de-CH': 'Diagramm-Modus', 'fr-FR': 'Mode Diagramme', 'it-IT': 'Modalità Organigramma' })}
            >
              <div className="ribbon-tool-icon">📊</div>
              <div className="ribbon-tool-label">{getLabel({ 'en-US': 'Chart', 'de-CH': 'Diagramm', 'fr-FR': 'Diagramme', 'it-IT': 'Organigramma' })}</div>
            </button>
          </div>
          <div className="ribbon-group-label">{getLabel({ 'en-US': 'Edit Mode', 'de-CH': 'Bearbeitungsmodus', 'fr-FR': 'Mode d\'édition', 'it-IT': 'Modalità Modifica' })}</div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={() => setMobileMenuOpen(false)}
          style={{ opacity: 1 }}
        />
      )}
    </div>
  );
};

export default RibbonToolbar;
