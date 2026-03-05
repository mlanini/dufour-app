/**
 * GridEditPanel - Editing rapido unità in formato tabella
 * Ispirato a spreadsheet per editing efficiente
 */
import React, { useState, useEffect } from 'react';
import '../styles/grid-edit-panel.css';

const GridEditPanel = ({ units = [], onUpdateUnit, onDeleteUnit, onAddUnit }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { id: 'sidc', label: 'Simbolo', width: '60px', type: 'icon' },
    { id: 'name', label: 'Nome', width: '200px', type: 'text', editable: true },
    { id: 'echelon', label: 'Echelon', width: '120px', type: 'select', editable: true },
    { id: 'affiliation', label: 'Affiliazione', width: '120px', type: 'select', editable: true },
    { id: 'strength', label: 'Forza', width: '100px', type: 'number', editable: true },
    { id: 'location', label: 'Posizione', width: '150px', type: 'text' },
    { id: 'parent', label: 'Superiore', width: '150px', type: 'text' }
  ];

  const echelonOptions = [
    'Team', 'Squad', 'Section', 'Platoon', 'Company', 
    'Battalion', 'Regiment', 'Brigade', 'Division', 'Corps', 'Army Group'
  ];

  const affiliationOptions = [
    'Friend', 'Hostile', 'Neutral', 'Unknown'
  ];

  const filteredUnits = units.filter(unit => {
    if (!searchTerm) return true;
    return unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           unit.echelon?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleRowSelection = (unitId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(unitId)) {
      newSelection.delete(unitId);
    } else {
      newSelection.add(unitId);
    }
    setSelectedRows(newSelection);
  };

  const handleCellEdit = (unitId, columnId, value) => {
    if (onUpdateUnit) {
      onUpdateUnit(unitId, { [columnId]: value });
    }
    setEditingCell(null);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Eliminare ${selectedRows.size} unità selezionate?`)) {
      selectedRows.forEach(unitId => {
        if (onDeleteUnit) onDeleteUnit(unitId);
      });
      setSelectedRows(new Set());
    }
  };

  const handleKeyDown = (e, unitId, columnId, currentValue) => {
    if (e.key === 'Enter') {
      handleCellEdit(unitId, columnId, e.target.value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const renderCell = (unit, column) => {
    const isEditing = editingCell?.unitId === unit.id && editingCell?.columnId === column.id;
    const value = unit[column.id] || '';

    if (column.type === 'icon') {
      return (
        <div className="cell-icon">
          {unit.sidc ? '🎖️' : '-'}
        </div>
      );
    }

    if (!column.editable) {
      return <span className="cell-value">{value || '-'}</span>;
    }

    if (isEditing) {
      if (column.type === 'select') {
        const options = column.id === 'echelon' ? echelonOptions : affiliationOptions;
        return (
          <select
            autoFocus
            defaultValue={value}
            onBlur={(e) => handleCellEdit(unit.id, column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellEdit(unit.id, column.id, e.target.value);
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="cell-editor"
          >
            <option value="">Seleziona...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={column.type === 'number' ? 'number' : 'text'}
          autoFocus
          defaultValue={value}
          onBlur={(e) => handleCellEdit(unit.id, column.id, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, unit.id, column.id, value)}
          className="cell-editor"
        />
      );
    }

    return (
      <span
        className="cell-value editable"
        onClick={() => setEditingCell({ unitId: unit.id, columnId: column.id })}
      >
        {value || '-'}
      </span>
    );
  };

  return (
    <div className="grid-edit-panel">
      <div className="grid-header">
        <div className="grid-header-left">
          <h3>Modifica Griglia</h3>
          <input
            type="text"
            placeholder="🔍 Cerca unità..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="grid-search"
          />
        </div>
        <div className="grid-header-right">
          {selectedRows.size > 0 && (
            <button 
              className="grid-action-btn delete"
              onClick={handleDeleteSelected}
            >
              🗑️ Elimina ({selectedRows.size})
            </button>
          )}
          <button 
            className="grid-action-btn add"
            onClick={() => onAddUnit && onAddUnit()}
          >
            ➕ Nuova Unità
          </button>
        </div>
      </div>

      <div className="grid-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredUnits.length && filteredUnits.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(filteredUnits.map(u => u.id)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </th>
              {columns.map(col => (
                <th key={col.id} style={{ width: col.width }}>
                  {col.label}
                  {col.editable && <span className="editable-indicator">✏️</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="empty-state">
                  {searchTerm ? 'Nessuna unità trovata' : 'Nessuna unità disponibile'}
                </td>
              </tr>
            ) : (
              filteredUnits.map(unit => (
                <tr
                  key={unit.id}
                  className={selectedRows.has(unit.id) ? 'selected' : ''}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(unit.id)}
                      onChange={() => toggleRowSelection(unit.id)}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.id} className={`grid-cell ${col.editable ? 'editable' : ''}`}>
                      {renderCell(unit, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid-footer">
        <div className="grid-stats">
          Totale: {filteredUnits.length} unità
          {selectedRows.size > 0 && ` • Selezionate: ${selectedRows.size}`}
        </div>
        <div className="grid-shortcuts">
          <small>
            💡 <strong>Shortcuts:</strong> Enter = salva • Esc = annulla • Doppio click = modifica
          </small>
        </div>
      </div>
    </div>
  );
};

export default GridEditPanel;
