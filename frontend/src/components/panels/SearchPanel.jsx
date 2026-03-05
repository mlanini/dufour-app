/**
 * SearchPanel - Location search
 */
import React, { useState } from 'react';

const SearchPanel = ({ onAction }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    console.log('Searching for:', query);
    // Placeholder - will integrate with geo.admin.ch search API
    setResults([
      { id: 1, name: 'Bern, Switzerland', type: 'city' },
      { id: 2, name: 'Zürich, Switzerland', type: 'city' }
    ]);
  };

  const handleResultClick = (result) => {
    console.log('Navigate to:', result);
    // Close panel on mobile after selecting result
    if (onAction) onAction();
  };

  return (
    <div style={{ padding: '8px' }}>
      <input
        type="text"
        placeholder="Search location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        style={{
          width: '100%',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '13px'
        }}
      />
      <button
        onClick={handleSearch}
        style={{
          width: '100%',
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'var(--secondary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Search
      </button>
      
      {results.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {results.map(result => (
            <div
              key={result.id}
              style={{
                padding: '8px',
                borderBottom: '1px solid #dee2e6',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              onClick={() => handleResultClick(result)}
            >
              📍 {result.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
