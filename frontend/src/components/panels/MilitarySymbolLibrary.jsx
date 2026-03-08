/**
 * MilitarySymbolLibrary - Symbol picker panel
 * Browse and insert military symbols (APP-6D/MIL-STD-2525D) on the map
 */
import React, { useState, useEffect } from 'react';
import { generateSymbol, getAllSymbolCategories, searchSymbols, unitSizes, affiliations, statuses } from '../../services/militarySymbolLibrary';
import { SearchIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '../icons/Icons';

const MilitarySymbolLibrary = ({ onClose, onAddSymbol }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [symbolOptions, setSymbolOptions] = useState({
    size: 15, // Echelon size
    affiliation: '3', // Friend
    status: '0' // Present
  });

  const categories = getAllSymbolCategories();

  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = searchSymbols(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const handleSymbolSelect = (entity) => {
    setSelectedSymbol(entity);
  };

  const handleAddToMap = () => {
    if (!selectedSymbol) return;

    // Build SIDC with modifiers
    let sidc = selectedSymbol.code;
    
    // Update affiliation (position 2-3)
    sidc = sidc.substring(0, 2) + symbolOptions.affiliation + sidc.substring(3);
    
    // Update echelon (position 11-12)
    sidc = sidc.substring(0, 11) + symbolOptions.size + sidc.substring(13);

    const symbol = generateSymbol(sidc, { size: 40 });
    const symbolData = {
      sidc,
      name: selectedSymbol.name,
      svg: symbol.asSVG(),
      dataUrl: symbol.toDataURL(),
      category: selectedSymbol.category
    };

    if (onAddSymbol) {
      onAddSymbol(symbolData);
    }
  };

  const renderSymbolPreview = (entity) => {
    try {
      const symbol = generateSymbol(entity.code, { size: 30 });
      return (
        <img 
          src={symbol.toDataURL()} 
          alt={entity.name}
          style={{ width: '30px', height: '30px' }}
        />
      );
    } catch (error) {
      return <span>❌</span>;
    }
  };

  const renderLargePreview = () => {
    if (!selectedSymbol) return null;

    try {
      // Build SIDC with current options
      let sidc = selectedSymbol.code;
      sidc = sidc.substring(0, 2) + symbolOptions.affiliation + sidc.substring(3);
      sidc = sidc.substring(0, 11) + symbolOptions.size + sidc.substring(13);

      const symbol = generateSymbol(sidc, { 
        size: 80,
        uniqueDesignation: 'Sample Unit'
      });
      
      return (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <img 
            src={symbol.toDataURL()} 
            alt={selectedSymbol.name}
            style={{ width: '120px', height: '120px' }}
          />
          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>
            {selectedSymbol.name}
          </div>
          <div style={{ fontSize: '10px', color: '#6c757d', fontFamily: 'monospace' }}>
            {sidc}
          </div>
        </div>
      );
    } catch (error) {
      return <div style={{ color: 'red' }}>Error rendering symbol</div>;
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          Military Symbol Library
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '16px', borderBottom: '1px solid #dee2e6' }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 36px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        {/* Symbol List */}
        <div style={{ flex: 1, borderRight: '1px solid #dee2e6' }}>
          {searchQuery.length > 2 ? (
            // Search Results
            <div>
              <div style={{ padding: '12px', fontSize: '12px', fontWeight: 600, color: '#6c757d' }}>
                {searchResults.length} results
              </div>
              {searchResults.map((entity, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSymbolSelect(entity)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: selectedSymbol?.code === entity.code ? '#e7f3ff' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => {
                    if (selectedSymbol?.code !== entity.code) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {renderSymbolPreview(entity)}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{entity.name}</div>
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>{entity.category} • {entity.symbolSet}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Category Browser
            <div>
              {categories.map((symbolSet, setIdx) => (
                <div key={setIdx}>
                  <div
                    onClick={() => toggleCategory(`set-${setIdx}`)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #dee2e6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    {expandedCategories[`set-${setIdx}`] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    {symbolSet.name}
                  </div>
                  {expandedCategories[`set-${setIdx}`] && symbolSet.categories.map((category, catIdx) => (
                    <div key={catIdx}>
                      <div
                        onClick={() => toggleCategory(`cat-${setIdx}-${catIdx}`)}
                        style={{
                          padding: '10px 32px',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {expandedCategories[`cat-${setIdx}-${catIdx}`] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        {category.name}
                      </div>
                      {expandedCategories[`cat-${setIdx}-${catIdx}`] && category.entities.map((entity, entIdx) => (
                        <div
                          key={entIdx}
                          onClick={() => handleSymbolSelect(entity)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 48px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: selectedSymbol?.code === entity.code ? '#e7f3ff' : 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => {
                            if (selectedSymbol?.code !== entity.code) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {renderSymbolPreview(entity)}
                          <span style={{ fontSize: '12px' }}>{entity.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Symbol Preview & Options */}
        <div style={{ width: '300px', padding: '16px', overflowY: 'auto' }}>
          {selectedSymbol ? (
            <>
              {renderLargePreview()}
              
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Symbol Options</h4>
                
                {/* Affiliation */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Affiliation
                  </label>
                  <select
                    value={symbolOptions.affiliation}
                    onChange={(e) => setSymbolOptions({ ...symbolOptions, affiliation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    {Object.entries(affiliations).map(([key, aff]) => (
                      <option key={key} value={aff.code}>{aff.name}</option>
                    ))}
                  </select>
                </div>

                {/* Unit Size/Echelon */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                    Unit Size/Echelon
                  </label>
                  <select
                    value={symbolOptions.size}
                    onChange={(e) => setSymbolOptions({ ...symbolOptions, size: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    {Object.entries(unitSizes).map(([key, size]) => (
                      <option key={key} value={size.code}>{size.name} ({size.symbol})</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddToMap}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <PlusIcon />
                  Add to Map
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '12px', marginTop: '40px' }}>
              Select a symbol to preview and add to the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilitarySymbolLibrary;
