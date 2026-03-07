/**
 * IdentifyPanel - WMS GetFeatureInfo
 * Click on map to identify features via WMS GetFeatureInfo request
 */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { InfoIcon } from '../icons/Icons';

const IdentifyPanel = ({ map, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clickInteraction, setClickInteraction] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!map) return;

    // Aggiungi evento click sulla mappa
    const handleMapClick = async (evt) => {
      const coordinate = evt.coordinate;
      const viewResolution = map.getView().getResolution();
      const projection = map.getView().getProjection();

      setLoading(true);
      setResults([]);

      try {
        // Query tutti i layer WMS visibili
        const layers = map.getLayers().getArray();
        const wmsLayers = layers.filter(l => {
          const type = l.get('type');
          const visible = l.getVisible();
          return visible && (type === 'wms' || type === 'qgis');
        });

        const allResults = [];

        for (const layer of wmsLayers) {
          try {
            const source = layer.getSource();
            const layerName = layer.get('name');
            
            // Costruisci URL GetFeatureInfo
            let url;
            if (layer.get('type') === 'qgis') {
              // QGIS Server via backend proxy
              const projectName = layer.get('project') || 'default';
              const getFeatureInfoUrl = source.getFeatureInfoUrl(
                coordinate,
                viewResolution,
                projection,
                {
                  'INFO_FORMAT': 'application/json',
                  'FEATURE_COUNT': 10
                }
              );
              
              // Replace with proxy URL
              url = getFeatureInfoUrl.replace(
                /^.*\?/,
                `${apiUrl}/api/projects/${projectName}/wms?`
              );
            } else {
              // External WMS
              url = source.getFeatureInfoUrl(
                coordinate,
                viewResolution,
                projection,
                {
                  'INFO_FORMAT': 'application/json',
                  'FEATURE_COUNT': 10
                }
              );
            }

            if (!url) continue;

            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
              allResults.push({
                layerName: layerName,
                features: data.features
              });
            }
          } catch (error) {
            console.error(`Error querying layer ${layer.get('name')}:`, error);
          }
        }

        setResults(allResults);
      } catch (error) {
        console.error('Error during identify:', error);
      } finally {
        setLoading(false);
      }
    };

    map.on('singleclick', handleMapClick);

    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [map, apiUrl]);

  const renderFeatureProperties = (properties) => {
    return Object.entries(properties).map(([key, value]) => {
      // Skip geometry fields
      if (key === 'geometry' || key === 'bbox') return null;
      
      return (
        <div
          key={key}
          style={{
            padding: '4px 0',
            borderBottom: '1px solid #eee',
            fontSize: '12px'
          }}
        >
          <strong style={{ color: '#666' }}>{key}:</strong>
          <span style={{ marginLeft: '8px' }}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      );
    });
  };

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <InfoIcon />
        <h3 style={{ margin: '0 0 0 8px', fontSize: '14px', fontWeight: 600 }}>
          Identify Features
        </h3>
      </div>

      <div style={{ 
        padding: '8px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        marginBottom: '12px',
        fontSize: '12px',
        color: '#1976d2'
      }}>
        Click on the map to identify features
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <div className="spinner" style={{ 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1976d2',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{ marginTop: '10px', fontSize: '13px' }}>Loading...</p>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          color: '#999',
          fontSize: '13px'
        }}>
          No features found. Click on a layer to identify.
        </div>
      )}

      {!loading && results.length > 0 && results.map((result, idx) => (
        <div key={idx} style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1976d2',
            borderBottom: '2px solid #1976d2',
            paddingBottom: '4px'
          }}>
            {result.layerName} ({result.features.length} feature{result.features.length > 1 ? 's' : ''})
          </h4>

          {result.features.map((feature, fIdx) => (
            <div key={fIdx} style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ 
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#333'
              }}>
                Feature {fIdx + 1}
              </div>
              {renderFeatureProperties(feature.properties || {})}
            </div>
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default IdentifyPanel;
