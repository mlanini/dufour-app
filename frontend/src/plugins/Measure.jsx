/**
 * Measure Plugin - QWC2-style measurement tools
 * Based on QWC2 MeasurementSupport pattern
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import { LineString, Polygon, Circle as OlCircle } from 'ol/geom';
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';
import '../styles/measurement.css';

/**
 * Measurement modes
 */
export const MeasureMode = {
  DISTANCE: 'distance',
  AREA: 'area',
  CIRCLE: 'circle',
  ANGLE: 'angle'
};

/**
 * Measure Plugin Component
 * Provides distance, area, circle, and angle measurement tools
 */
const MeasurePlugin = ({ map, mode, active, onMeasurement, onClose }) => {
  const [measurements, setMeasurements] = useState([]);
  const [currentMeasure, setCurrentMeasure] = useState(null);
  const [totalMeasurement, setTotalMeasurement] = useState('');
  const locale = useSelector(state => state.locale?.current || 'en-US');
  
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const drawInteractionRef = useRef(null);
  const modifyInteractionRef = useRef(null);
  const snapInteractionRef = useRef(null);
  const listenerKeyRef = useRef(null);

  // Initialize measurement layer
  useEffect(() => {
    if (!map) return;

    // Create vector source and layer for measurements
    vectorSourceRef.current = new VectorSource();
    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
      style: createMeasurementStyle(),
      zIndex: 1000
    });

    map.addLayer(vectorLayerRef.current);

    return () => {
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
      }
    };
  }, [map]);

  // Handle active state and mode changes
  useEffect(() => {
    if (!map || !active) {
      removeInteractions();
      return;
    }

    addInteraction(mode);

    return () => {
      removeInteractions();
    };
  }, [map, mode, active]);

  /**
   * Create measurement style
   */
  const createMeasurementStyle = () => {
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#ffcc33',
        width: 3,
        lineDash: [10, 10]
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.8)'
        })
      })
    });
  };

  /**
   * Add draw interaction based on mode
   */
  const addInteraction = (measureMode) => {
    removeInteractions();

    let geometryType;
    switch (measureMode) {
      case MeasureMode.DISTANCE:
        geometryType = 'LineString';
        break;
      case MeasureMode.AREA:
        geometryType = 'Polygon';
        break;
      case MeasureMode.CIRCLE:
        geometryType = 'Circle';
        break;
      case MeasureMode.ANGLE:
        geometryType = 'LineString';
        break;
      default:
        return;
    }

    const drawInteraction = new Draw({
      source: vectorSourceRef.current,
      type: geometryType,
      style: createMeasurementStyle()
    });

    drawInteraction.on('drawstart', handleDrawStart);
    drawInteraction.on('drawend', handleDrawEnd);

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
   * Remove all interactions
   */
  const removeInteractions = () => {
    if (listenerKeyRef.current) {
      unByKey(listenerKeyRef.current);
      listenerKeyRef.current = null;
    }

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
   * Handle draw start
   */
  const handleDrawStart = (evt) => {
    const feature = evt.feature;
    const geometry = feature.getGeometry();

    // Listen to geometry changes
    listenerKeyRef.current = geometry.on('change', (evt) => {
      const geom = evt.target;
      updateMeasurement(geom);
    });
  };

  /**
   * Handle draw end
   */
  const handleDrawEnd = (evt) => {
    const feature = evt.feature;
    const geometry = feature.getGeometry();
    
    if (listenerKeyRef.current) {
      unByKey(listenerKeyRef.current);
      listenerKeyRef.current = null;
    }

    const measurement = formatMeasurement(geometry);
    const newMeasurement = {
      id: Date.now(),
      mode: mode,
      value: measurement,
      geometry: geometry
    };

    setMeasurements(prev => [...prev, newMeasurement]);
    setCurrentMeasure(null);

    if (onMeasurement) {
      onMeasurement(newMeasurement);
    }

    // Add label to feature
    feature.setStyle(createMeasurementStyle());
  };

  /**
   * Update current measurement
   */
  const updateMeasurement = (geometry) => {
    const measurement = formatMeasurement(geometry);
    setCurrentMeasure(measurement);
  };

  /**
   * Format measurement based on geometry type
   */
  const formatMeasurement = (geometry) => {
    let output;
    
    if (geometry instanceof LineString) {
      const length = getLength(geometry);
      output = formatLength(length);
    } else if (geometry instanceof Polygon) {
      const area = getArea(geometry);
      output = formatArea(area);
    } else if (geometry instanceof OlCircle) {
      const radius = geometry.getRadius();
      const area = Math.PI * radius * radius;
      output = `${formatLength(radius)} (${formatArea(area)})`;
    }

    return output;
  };

  /**
   * Format length
   */
  const formatLength = (length) => {
    let output;
    if (length > 1000) {
      output = Math.round((length / 1000) * 100) / 100 + ' km';
    } else {
      output = Math.round(length * 100) / 100 + ' m';
    }
    return output;
  };

  /**
   * Format area
   */
  const formatArea = (area) => {
    let output;
    if (area > 1000000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' km²';
    } else if (area > 10000) {
      output = Math.round((area / 10000) * 100) / 100 + ' ha';
    } else {
      output = Math.round(area * 100) / 100 + ' m²';
    }
    return output;
  };

  /**
   * Clear all measurements
   */
  const clearMeasurements = () => {
    if (vectorSourceRef.current) {
      vectorSourceRef.current.clear();
    }
    setMeasurements([]);
    setCurrentMeasure(null);
    setTotalMeasurement('');
  };

  /**
   * Remove single measurement
   */
  const removeMeasurement = (id) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
    // Also remove from map
    const features = vectorSourceRef.current.getFeatures();
    const featureToRemove = features.find(f => f.get('id') === id);
    if (featureToRemove) {
      vectorSourceRef.current.removeFeature(featureToRemove);
    }
  };

  const getLabel = (key) => {
    const labels = {
      'en-US': {
        distance: 'Distance',
        area: 'Area',
        circle: 'Circle',
        angle: 'Angle',
        current: 'Current',
        measurements: 'Measurements',
        clear: 'Clear All',
        close: 'Close'
      },
      'de-CH': {
        distance: 'Distanz',
        area: 'Fläche',
        circle: 'Kreis',
        angle: 'Winkel',
        current: 'Aktuell',
        measurements: 'Messungen',
        clear: 'Alle löschen',
        close: 'Schließen'
      },
      'fr-FR': {
        distance: 'Distance',
        area: 'Surface',
        circle: 'Cercle',
        angle: 'Angle',
        current: 'Actuel',
        measurements: 'Mesures',
        clear: 'Tout effacer',
        close: 'Fermer'
      },
      'it-IT': {
        distance: 'Distanza',
        area: 'Area',
        circle: 'Cerchio',
        angle: 'Angolo',
        current: 'Corrente',
        measurements: 'Misurazioni',
        clear: 'Cancella tutto',
        close: 'Chiudi'
      }
    };
    return labels[locale]?.[key] || labels['en-US'][key];
  };

  if (!active) return null;

  return (
    <div className="measure-panel">
      <div className="measure-header">
        <h3>{getLabel(mode)}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="measure-content">
        {currentMeasure && (
          <div className="current-measurement">
            <strong>{getLabel('current')}:</strong> {currentMeasure}
          </div>
        )}

        {measurements.length > 0 && (
          <div className="measurements-list">
            <div className="measurements-header">
              <strong>{getLabel('measurements')}</strong>
              <button className="clear-button" onClick={clearMeasurements}>
                {getLabel('clear')}
              </button>
            </div>
            <ul>
              {measurements.map((m, idx) => (
                <li key={m.id}>
                  <span>{idx + 1}. {m.value}</span>
                  <button 
                    className="remove-button" 
                    onClick={() => removeMeasurement(m.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurePlugin;
