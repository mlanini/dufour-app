/**
 * LayerCatalogPanel - Layer discovery and import
 * Browse and add layers from SwissTopo WMS, external WMS, and PostGIS
 */
import React, { useState, useEffect } from 'react';
import { LayersIcon, UploadIcon, MapIcon } from '../icons/Icons';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import { TileWMS, ImageWMS } from 'ol/source';

const LayerCatalogPanel = ({ map, onClose }) => {
  const [activeTab, setActiveTab] = useState('swisstopo');
  const [swisstopoLayers, setSwisstopoLayers] = useState([]);
  const [customWMSUrl, setCustomWMSUrl] = useState('');
  const [customWMSLayers, setCustomWMSLayers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load SwissTopo predefined layers
  useEffect(() => {
    const layers = [
      {
        id: 'ch.swisstopo.pixelkarte-farbe',
        name: 'National Map 1:10\'000 (Color)',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.pixelkarte-farbe'
      },
      {
        id: 'ch.swisstopo.pixelkarte-grau',
        name: 'National Map 1:10\'000 (Gray)',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.pixelkarte-grau'
      },
      {
        id: 'ch.swisstopo.swissimage',
        name: 'Swiss Image (Orthophoto)',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.swissimage'
      },
      {
        id: 'ch.swisstopo.swisstlm3d-wanderwege',
        name: 'Hiking trails',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.swisstlm3d-wanderwege'
      },
      {
        id: 'ch.swisstopo.hangneigung-ueber_30',
        name: 'Slope > 30°',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.hangneigung-ueber_30'
      },
      {
        id: 'ch.swisstopo.vec25-gebaeude',
        name: 'Buildings',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.swisstopo.vec25-gebaeude'
      },
      {
        id: 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung',
        name: 'National Parks',
        type: 'wms',
        url: 'https://wms.geo.admin.ch/',
        layer: 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'
      }
    ];
    setSwisstopoLayers(layers);
  }, []);

  const handleAddSwisstopoLayer = (layerDef) => {
    if (!map) return;

    try {
      const layer = new TileLayer({
        source: new TileWMS({
          url: layerDef.url,
          params: {
            'LAYERS': layerDef.layer,
            'FORMAT': 'image/png',
            'TRANSPARENT': true
          },
          serverType: 'mapserver',
          crossOrigin: 'anonymous'
        }),
        visible: true,
        opacity: 1
      });

      layer.set('name', layerDef.name);
      layer.set('title', layerDef.name);
      layer.set('type', 'wms');
      layer.set('background', false);

      map.addLayer(layer);

      // Success feedback
      alert(`Layer "${layerDef.name}" added successfully`);
    } catch (error) {
      console.error('Error adding layer:', error);
      alert(`Error adding layer: ${error.message}`);
    }
  };

  const handleLoadCustomWMS = async () => {
    if (!customWMSUrl.trim()) {
      alert('Please enter a WMS URL');
      return;
    }

    setLoading(true);
    try {
      // GetCapabilities request
      const url = new URL(customWMSUrl);
      url.searchParams.set('SERVICE', 'WMS');
      url.searchParams.set('REQUEST', 'GetCapabilities');
      url.searchParams.set('VERSION', '1.3.0');

      const response = await fetch(url.toString());
      const text = await response.text();

      // Parse XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      // Extract layer names
      const layers = Array.from(xml.querySelectorAll('Layer > Layer')).map((layerElem, idx) => {
        const name = layerElem.querySelector('Name')?.textContent;
        const title = layerElem.querySelector('Title')?.textContent || name;
        return {
          id: `custom-${idx}`,
          name: name,
          title: title,
          url: customWMSUrl
        };
      }).filter(l => l.name);

      setCustomWMSLayers(layers);
      if (layers.length === 0) {
        alert('No layers found in WMS service');
      }
    } catch (error) {
      console.error('Error loading WMS:', error);
      alert(`Error loading WMS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomWMSLayer = (layerDef) => {
    if (!map) return;

    try {
      const layer = new ImageLayer({
        source: new ImageWMS({
          url: layerDef.url,
          params: {
            'LAYERS': layerDef.name,
            'FORMAT': 'image/png',
            'TRANSPARENT': true
          },
          serverType: 'geoserver',
          crossOrigin: 'anonymous'
        }),
        visible: true,
        opacity: 1
      });

      layer.set('name', layerDef.title);
      layer.set('title', layerDef.title);
      layer.set('type', 'wms');
      layer.set('background', false);

      map.addLayer(layer);

      alert(`Layer "${layerDef.title}" added successfully`);
    } catch (error) {
      console.error('Error adding layer:', error);
      alert(`Error adding layer: ${error.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LayersIcon />
          <h3 style={{ margin: '0 0 0 8px', fontSize: '14px', fontWeight: 600 }}>
            Layer Catalog
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f9f9f9'
      }}>
        <button
          onClick={() => setActiveTab('swisstopo')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            backgroundColor: activeTab === 'swisstopo' ? 'white' : 'transparent',
            borderBottom: activeTab === 'swisstopo' ? '2px solid #1976d2' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'swisstopo' ? 600 : 400,
            color: activeTab === 'swisstopo' ? '#1976d2' : '#666'
          }}
        >
          SwissTopo
        </button>
        <button
          onClick={() => setActiveTab('wms')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            backgroundColor: activeTab === 'wms' ? 'white' : 'transparent',
            borderBottom: activeTab === 'wms' ? '2px solid #1976d2' : 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'wms' ? 600 : 400,
            color: activeTab === 'wms' ? '#1976d2' : '#666'
          }}
        >
          External WMS
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {activeTab === 'swisstopo' && (
          <div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Browse and add official Swiss geospatial layers
            </p>
            {swisstopoLayers.map(layer => (
              <div
                key={layer.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    {layer.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                    {layer.id}
                  </div>
                </div>
                <button
                  onClick={() => handleAddSwisstopoLayer(layer)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '8px'
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'wms' && (
          <div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Connect to external WMS services
            </p>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="WMS URL (e.g., https://example.com/wms)"
                value={customWMSUrl}
                onChange={(e) => setCustomWMSUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '8px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={handleLoadCustomWMS}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: loading ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {loading ? 'Loading...' : 'Load Layers'}
              </button>
            </div>

            {customWMSLayers.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Available Layers
                </h4>
                {customWMSLayers.map(layer => (
                  <div
                    key={layer.id}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {layer.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        {layer.name}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCustomWMSLayer(layer)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '8px'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerCatalogPanel;
