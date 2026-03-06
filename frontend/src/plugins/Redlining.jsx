/**
 * Redlining Plugin - QWC2-style drawing tools
 * Based on QWC2 Redlining pattern for drawing geometries and annotations
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import { Style, Stroke, Fill, Circle as CircleStyle, Text as TextStyle } from 'ol/style';
import { Point, LineString, Polygon, Circle as OlCircle } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import '../styles/redlining.css';

/**
 * Drawing modes
 */
export const DrawMode = {
  POINT: 'Point',
  LINE: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  TEXT: 'Text',
  MARKER: 'Marker'
};

/**
 * Redlining Plugin Component
 * Provides drawing tools for points, lines, polygons, circles, rectangles, text and markers
 */
const RedliningPlugin = ({ map, mode, active, onFeatureDrawn, onClose }) => {
  const [features, setFeatures] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [drawStyle, setDrawStyle] = useState({
    strokeColor: '#ff0000',
    strokeWidth: 2,
    fillColor: 'rgba(255, 0, 0, 0.1)',
    fontSize: 14,
    text: ''
  });
  
  const locale = useSelector(state => state.locale?.current || 'en-US');
  
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const selectInteractionRef = useRef(null);
  const snapInteractionRef = useRef(null);

  // Initialize redlining layer
  useEffect(() => {
    if (!map) return;

    // Create vector source and layer for redlining
    vectorSourceRef.current = new VectorSource();
    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => createFeatureStyle(feature, drawStyle),
      zIndex: 1001
    });

    map.addLayer(vectorLayerRef.current);

    // Add select interaction
    const selectInteraction = new Select({
      layers: [vectorLayerRef.current]
    });
    selectInteraction.on('select', (evt) => {
      if (evt.selected.length > 0) {
        setSelectedFeature(evt.selected[0]);
      } else {
        setSelectedFeature(null);
      }
    });
    selectInteractionRef.current = selectInteraction;
    map.addInteraction(selectInteraction);

    return () => {
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
      }
      if (selectInteractionRef.current) {
        map.removeInteraction(selectInteractionRef.current);
      }
    };
  }, [map]);

  // Handle active state and mode changes
  useEffect(() => {
    if (!map || !active) {
      removeDrawInteraction();
      return;
    }

    addDrawInteraction(mode);

    return () => {
      removeDrawInteraction();
    };
  }, [map, mode, active, drawStyle]);

  /**
   * Create feature style
   */
  const createFeatureStyle = (feature, styleConfig) => {
    const geometry = feature.getGeometry();
    const geometryType = geometry.getType();

    const styles = [];

    // Base style
    const baseStyle = new Style({
      stroke: new Stroke({
        color: styleConfig.strokeColor,
        width: styleConfig.strokeWidth
      }),
      fill: new Fill({
        color: styleConfig.fillColor
      }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: styleConfig.strokeColor
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    });

    styles.push(baseStyle);

    // Text style for text features
    if (feature.get('type') === 'text' || styleConfig.text) {
      const textStyle = new Style({
        text: new TextStyle({
          text: feature.get('text') || styleConfig.text,
          font: `${styleConfig.fontSize}px sans-serif`,
          fill: new Fill({
            color: styleConfig.strokeColor
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 3
          }),
          offsetY: geometryType === 'Point' ? -15 : 0
        })
      });
      styles.push(textStyle);
    }

    return styles;
  };

  /**
   * Add draw interaction based on mode
   */
  const addDrawInteraction = (drawMode) => {
    removeDrawInteraction();

    let geometryType = drawMode;
    let geometryFunction;

    // Handle rectangle drawing
    if (drawMode === DrawMode.RECTANGLE) {
      geometryType = 'Circle';
      geometryFunction = Draw.createBox();
    }

    const drawInteraction = new Draw({
      source: vectorSourceRef.current,
      type: geometryType,
      geometryFunction: geometryFunction,
      style: (feature) => createFeatureStyle(feature, drawStyle)
    });

    drawInteraction.on('drawend', (evt) => {
      handleDrawEnd(evt, drawMode);
    });

    drawInteractionRef.current = drawInteraction;
    map.addInteraction(drawInteraction);

    // Add modify interaction
    const modifyInteraction = new Modify({
      source: vectorSourceRef.current
    });
    modifyInteractionRef.current = modifyInteraction;
    map.addInteraction(modifyInteraction);

    // Add snap interaction
    const snapInteraction = new Snap({
      source: vectorSourceRef.current
    });
    snapInteractionRef.current = snapInteraction;
    map.addInteraction(snapInteraction);
  };

  /**
   * Remove draw interaction
   */
  const removeDrawInteraction = () => {
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }

    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
      snapInteractionRef.current = null;
    }
  };

  /**
   * Handle draw end
   */
  const handleDrawEnd = (evt, drawMode) => {
    const feature = evt.feature;
    
    // Set feature properties
    feature.setProperties({
      id: Date.now(),
      type: drawMode.toLowerCase(),
      style: { ...drawStyle }
    });

    // For text features, add text property
    if (drawMode === DrawMode.TEXT && drawStyle.text) {
      feature.set('text', drawStyle.text);
    }

    // Apply style
    feature.setStyle((f) => createFeatureStyle(f, drawStyle));

    const newFeature = {
      id: feature.get('id'),
      type: drawMode,
      geometry: feature.getGeometry(),
      style: drawStyle
    };

    setFeatures(prev => [...prev, newFeature]);

    if (onFeatureDrawn) {
      onFeatureDrawn(newFeature);
    }
  };

  /**
   * Clear all features
   */
  const clearFeatures = () => {
    if (vectorSourceRef.current) {
      vectorSourceRef.current.clear();
    }
    setFeatures([]);
    setSelectedFeature(null);
  };

  /**
   * Remove selected feature
   */
  const removeSelectedFeature = () => {
    if (selectedFeature) {
      vectorSourceRef.current.removeFeature(selectedFeature);
      setFeatures(prev => prev.filter(f => f.id !== selectedFeature.get('id')));
      setSelectedFeature(null);
    }
  };

  /**
   * Update draw style
   */
  const updateStyle = (property, value) => {
    setDrawStyle(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const getLabel = (key) => {
    const labels = {
      'en-US': {
        redlining: 'Redlining',
        strokeColor: 'Stroke Color',
        strokeWidth: 'Stroke Width',
        fillColor: 'Fill Color',
        fontSize: 'Font Size',
        text: 'Text',
        features: 'Features',
        clear: 'Clear All',
        delete: 'Delete Selected',
        close: 'Close'
      },
      'de-CH': {
        redlining: 'Zeichnen',
        strokeColor: 'Strichfarbe',
        strokeWidth: 'Strichbreite',
        fillColor: 'Füllfarbe',
        fontSize: 'Schriftgröße',
        text: 'Text',
        features: 'Objekte',
        clear: 'Alle löschen',
        delete: 'Auswahl löschen',
        close: 'Schließen'
      },
      'fr-FR': {
        redlining: 'Dessin',
        strokeColor: 'Couleur du trait',
        strokeWidth: 'Épaisseur du trait',
        fillColor: 'Couleur de remplissage',
        fontSize: 'Taille de police',
        text: 'Texte',
        features: 'Objets',
        clear: 'Tout effacer',
        delete: 'Supprimer la sélection',
        close: 'Fermer'
      },
      'it-IT': {
        redlining: 'Disegno',
        strokeColor: 'Colore tratto',
        strokeWidth: 'Spessore tratto',
        fillColor: 'Colore riempimento',
        fontSize: 'Dimensione carattere',
        text: 'Testo',
        features: 'Oggetti',
        clear: 'Cancella tutto',
        delete: 'Elimina selezione',
        close: 'Chiudi'
      }
    };
    return labels[locale]?.[key] || labels['en-US'][key];
  };

  if (!active) return null;

  return (
    <div className="redlining-panel">
      <div className="redlining-header">
        <h3>{getLabel('redlining')}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="redlining-content">
        <div className="style-controls">
          <div className="control-group">
            <label>{getLabel('strokeColor')}</label>
            <input 
              type="color" 
              value={drawStyle.strokeColor}
              onChange={(e) => updateStyle('strokeColor', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>{getLabel('strokeWidth')}</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={drawStyle.strokeWidth}
              onChange={(e) => updateStyle('strokeWidth', parseInt(e.target.value))}
            />
            <span>{drawStyle.strokeWidth}px</span>
          </div>

          <div className="control-group">
            <label>{getLabel('fillColor')}</label>
            <input 
              type="color" 
              value={drawStyle.fillColor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/, (m, r, g, b) => 
                `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`
              )}
              onChange={(e) => {
                const hex = e.target.value;
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                updateStyle('fillColor', `rgba(${r}, ${g}, ${b}, 0.1)`);
              }}
            />
          </div>

          {mode === DrawMode.TEXT && (
            <>
              <div className="control-group">
                <label>{getLabel('text')}</label>
                <input 
                  type="text" 
                  value={drawStyle.text}
                  onChange={(e) => updateStyle('text', e.target.value)}
                  placeholder={getLabel('text')}
                />
              </div>

              <div className="control-group">
                <label>{getLabel('fontSize')}</label>
                <input 
                  type="range" 
                  min="10" 
                  max="36" 
                  value={drawStyle.fontSize}
                  onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                />
                <span>{drawStyle.fontSize}px</span>
              </div>
            </>
          )}
        </div>

        {features.length > 0 && (
          <div className="features-list">
            <div className="features-header">
              <strong>{getLabel('features')}: {features.length}</strong>
              <div className="feature-actions">
                {selectedFeature && (
                  <button className="delete-button" onClick={removeSelectedFeature}>
                    {getLabel('delete')}
                  </button>
                )}
                <button className="clear-button" onClick={clearFeatures}>
                  {getLabel('clear')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedliningPlugin;
