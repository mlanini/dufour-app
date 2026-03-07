/**
 * SearchPanel - Location search with geo.admin.ch integration
 */
import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, LocateIcon } from '../icons/Icons';
import { fromLonLat } from 'ol/proj';

const SearchPanel = ({ map, onAction }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef(null);

  // Autocomplete search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // geo.admin.ch location search API
        const response = await fetch(
          `https://api3.geo.admin.ch/rest/services/api/SearchServer?` +
          `searchText=${encodeURIComponent(query)}&` +
          `type=locations&` +
          `limit=10&` +
          `sr=2056`
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const formattedResults = data.results.map((r, idx) => ({
            id: idx,
            name: r.attrs.label || r.attrs.detail,
            type: r.attrs.origin || 'location',
            x: r.attrs.x,
            y: r.attrs.y,
            bbox: r.attrs.geom_st_box2d
          }));
          setResults(formattedResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleResultClick = (result) => {
    if (!map) return;

    try {
      // Parse bbox or use point coordinates
      let extent;
      if (result.bbox) {
        // Parse "BOX(xmin ymin,xmax ymax)"
        const match = result.bbox.match(/BOX\(([\d.]+) ([\d.]+),([\d.]+) ([\d.]+)\)/);
        if (match) {
          extent = [
            parseFloat(match[1]),
            parseFloat(match[2]),
            parseFloat(match[3]),
            parseFloat(match[4])
          ];
        }
      }

      if (extent) {
        // Zoom to extent
        map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500
        });
      } else if (result.x && result.y) {
        // Zoom to point (EPSG:2056 coordinates)
        map.getView().animate({
          center: [result.x, result.y],
          zoom: 15,
          duration: 500
        });
      }

      // Clear search and close panel
      setQuery('');
      setResults([]);
      if (onAction) onAction();
    } catch (error) {
      console.error('Error navigating to result:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <SearchIcon />
        <h3 style={{ margin: '0 0 0 8px', fontSize: '14px', fontWeight: 600 }}>
          Location Search
        </h3>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search places in Switzerland..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 32px 8px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            boxSizing: 'border-box'
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>
      
      {results.length > 0 && (
        <div style={{
          marginTop: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          maxHeight: '400px',
          overflow: 'auto',
          backgroundColor: 'white'
        }}>
          {results.map((result, idx) => (
            <div
              key={result.id}
              style={{
                padding: '10px',
                borderBottom: idx < results.length - 1 ? '1px solid #eee' : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: selectedIndex === idx ? '#e3f2fd' : 'white'
              }}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <LocateIcon style={{ marginRight: '8px', flexShrink: 0, width: '18px', height: '18px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{result.name}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {result.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px',
          border: '1px dashed #ddd',
          borderRadius: '4px'
        }}>
          No results found for "{query}"
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SearchPanel;
