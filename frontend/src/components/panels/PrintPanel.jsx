/**
 * PrintPanel - Print/Export via QGIS Server
 * Export map to PDF using QGIS Server print layouts
 */
import React, { useState } from 'react';
import { PrinterIcon, DownloadIcon } from '../icons/Icons';

const PrintPanel = ({ map, onAction }) => {
  const [layout, setLayout] = useState('A4 Portrait');
  const [dpi, setDpi] = useState('300');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handlePrint = async () => {
    if (!map) {
      alert('Map not initialized');
      return;
    }

    setLoading(true);

    try {
      // Get current map extent
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      const center = view.getCenter();
      const zoom = view.getZoom();
      const projection = view.getProjection().getCode();

      // Get visible layers
      const visibleLayers = map.getLayers().getArray()
        .filter(l => l.getVisible() && !l.get('background'))
        .map(l => l.get('name') || l.get('title'))
        .join(',');

      // Prepare print request
      const printParams = {
        SERVICE: 'WMS',
        REQUEST: 'GetPrint',
        VERSION: '1.3.0',
        FORMAT: 'pdf',
        TRANSPARENT: true,
        SRS: projection,
        DPI: dpi,
        TEMPLATE: layout.replace(' ', '_').toLowerCase(),
        'map0:extent': extent.join(','),
        LAYERS: visibleLayers,
        // Custom parameters
        ...(title && { map_title: title })
      };

      // Use current QGIS project (or default)
      const projectName = 'snu_tag'; // TODO: get from current project state

      // Build URL
      const params = new URLSearchParams(printParams);
      const url = `${apiUrl}/api/projects/${projectName}/wms?${params}`;

      console.log('Print URL:', url);

      // Open in new tab for download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `map_export_${Date.now()}.pdf`;
      link.click();

      // Alternative: Fetch and download
      // const response = await fetch(url);
      // const blob = await response.blob();
      // const blobUrl = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = blobUrl;
      // a.download = `map_${Date.now()}.pdf`;
      // a.click();
      // window.URL.revokeObjectURL(blobUrl);

      // Close panel on mobile after generating PDF
      if (onAction) onAction();
    } catch (error) {
      console.error('Print error:', error);
      alert(`Error generating PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <PrinterIcon />
        <h3 style={{ margin: '0 0 0 8px', fontSize: '14px', fontWeight: 600 }}>
          Print Map
        </h3>
      </div>

      <div style={{
        padding: '8px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px',
        marginBottom: '12px',
        fontSize: '12px',
        color: '#856404'
      }}>
        ⚠️ Print layouts must be configured in the QGIS project
      </div>
      
      {/* Title */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          marginBottom: '4px',
          fontWeight: 500,
          color: '#555'
        }}>
          Map Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter map title..."
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Layout */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          marginBottom: '4px',
          fontWeight: 500,
          color: '#555'
        }}>
          Page Layout
        </label>
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option>A4 Portrait</option>
          <option>A4 Landscape</option>
          <option>A3 Portrait</option>
          <option>A3 Landscape</option>
          <option>A2 Portrait</option>
          <option>A2 Landscape</option>
        </select>
      </div>
      
      {/* DPI */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          marginBottom: '4px',
          fontWeight: 500,
          color: '#555'
        }}>
          Resolution (DPI)
        </label>
        <select
          value={dpi}
          onChange={(e) => setDpi(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="96">96 DPI (Screen)</option>
          <option value="150">150 DPI (Draft)</option>
          <option value="300">300 DPI (High Quality)</option>
          <option value="600">600 DPI (Print)</option>
        </select>
      </div>

      {/* Info box */}
      <div style={{
        padding: '8px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginBottom: '12px',
        fontSize: '11px',
        color: '#666'
      }}>
        <strong>Current View:</strong>
        <div>Layout: {layout}</div>
        <div>Resolution: {dpi} DPI</div>
        <div>Visible layers will be included</div>
      </div>
      
      {/* Generate Button */}
      <button 
        onClick={handlePrint}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: loading ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <DownloadIcon style={{ width: '18px', height: '18px' }} />
            <span>Generate PDF</span>
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PrintPanel;
