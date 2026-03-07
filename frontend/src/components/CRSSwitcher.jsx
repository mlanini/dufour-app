/**
 * CRSSwitcher - Coordinate Reference System Switcher
 * Toggle between EPSG:3857 (Web Mercator) and EPSG:2056 (Swiss LV95)
 */
import React, { useState, useEffect } from 'react';
import { MapIcon } from './icons/Icons';
import { get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

// Register Swiss LV95 projection (EPSG:2056)
proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');
register(proj4);

const CRSSwitcher = ({ map }) => {
  const [currentCRS, setCurrentCRS] = useState('EPSG:3857');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Detect current CRS
    const view = map.getView();
    const projection = view.getProjection();
    const code = projection.getCode();
    setCurrentCRS(code);
  }, [map]);

  const handleSwitchCRS = (targetCRS) => {
    if (!map || targetCRS === currentCRS) {
      setIsOpen(false);
      return;
    }

    try {
      const view = map.getView();
      const currentCenter = view.getCenter();
      const currentZoom = view.getZoom();
      const currentProjection = view.getProjection();
      const targetProjection = getProjection(targetCRS);

      // Transform center coordinates
      const transformedCenter = proj4(
        currentProjection.getCode(),
        targetProjection.getCode(),
        currentCenter
      );

      // Update view projection
      view.setProjection(targetProjection);
      view.setCenter(transformedCenter);
      view.setZoom(currentZoom);

      // Update all layers
      map.getLayers().forEach(layer => {
        const source = layer.getSource();
        if (source && typeof source.refresh === 'function') {
          source.refresh();
        }
      });

      setCurrentCRS(targetCRS);
      setIsOpen(false);

      console.log(`CRS switched to ${targetCRS}`);
    } catch (error) {
      console.error('Error switching CRS:', error);
      alert(`Error switching projection: ${error.message}`);
    }
  };

  const projections = [
    {
      code: 'EPSG:3857',
      name: 'Web Mercator',
      description: 'Standard web maps projection'
    },
    {
      code: 'EPSG:2056',
      name: 'Swiss LV95',
      description: 'Swiss national coordinate system'
    }
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        title="Change coordinate reference system"
      >
        <MapIcon style={{ width: '16px', height: '16px' }} />
        <span>{currentCRS}</span>
        <span style={{ fontSize: '10px', color: '#999' }}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '220px',
            zIndex: 1000
          }}
        >
          {projections.map(proj => (
            <div
              key={proj.code}
              onClick={() => handleSwitchCRS(proj.code)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: proj.code === projections[projections.length - 1].code ? 'none' : '1px solid #eee',
                backgroundColor: currentCRS === proj.code ? '#e3f2fd' : 'white'
              }}
              onMouseEnter={(e) => {
                if (currentCRS !== proj.code) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (currentCRS !== proj.code) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: `2px solid ${currentCRS === proj.code ? '#1976d2' : '#ccc'}`,
                    backgroundColor: currentCRS === proj.code ? '#1976d2' : 'white',
                    marginRight: '8px'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {proj.name}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginLeft: '20px' }}>
                {proj.code}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginLeft: '20px', marginTop: '2px' }}>
                {proj.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default CRSSwitcher;
