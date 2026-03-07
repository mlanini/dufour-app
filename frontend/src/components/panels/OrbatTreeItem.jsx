/**
 * ORBAT Tree Item Component
 * 
 * Single unit node in the hierarchical ORBAT tree.
 * Displays military symbol, unit name, echelon, and subordinate units.
 * Supports drag-drop reordering, multi-selection, and context menu.
 * 
 * @component OrbatTreeItem
 */

import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, EyeIcon, EyeOffIcon } from '../icons/Icons';
import { renderMilitarySymbol } from '../../services/militarySymbols';

const OrbatTreeItem = ({
  unit,
  level = 0,
  isExpanded = false,
  isSelected = false,
  onToggleExpand,
  onSelect,
  onContextMenu,
  filterUnit,
  expandedUnits,
  selectedUnits
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if unit passes filters
  const passesFilter = filterUnit ? filterUnit(unit) : true;
  if (!passesFilter) return null;

  const hasChildren = unit.children && unit.children.length > 0;
  const indentLevel = level * 20; // 20px per level

  // Handle expand/collapse
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(unit.id);
    }
  };

  // Handle selection
  const handleSelect = (e) => {
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(unit.id, isMultiSelect);
  };

  // Handle context menu
  const handleContextMenu = (e) => {
    onContextMenu(e, unit);
  };

  // Drag and drop handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-orbat-unit', JSON.stringify({
      id: unit.id,
      name: unit.name
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/x-orbat-unit'));
      console.log('Drop unit', data.id, 'onto', unit.id);
      // TODO: Implement reordering logic
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Get affiliation color
  const getAffiliationColor = () => {
    switch (unit.affiliation) {
      case 'FRIEND': return '#3B82F6'; // Blue
      case 'HOSTILE': return '#EF4444'; // Red
      case 'NEUTRAL': return '#10B981'; // Green
      case 'UNKNOWN': return '#F59E0B'; // Yellow
      default: return '#6B7280'; // Gray
    }
  };

  // Get deployment status icon
  const getDeploymentStatusIcon = () => {
    switch (unit.deploymentStatus) {
      case 'READY': return '⏸️';
      case 'DEPLOYING': return '▶️';
      case 'DEPLOYED': return '✅';
      case 'WITHDRAWING': return '◀️';
      default: return '';
    }
  };

  return (
    <div className="orbat-tree-item-wrapper">
      <div
        className={`orbat-tree-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${indentLevel}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse Button */}
        <button
          className="expand-btn"
          onClick={handleToggleExpand}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />
          ) : (
            <span className="expand-placeholder"></span>
          )}
        </button>

        {/* Checkbox for multi-selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
          className="unit-checkbox"
        />

        {/* Military Symbol */}
        <div
          className="unit-symbol"
          style={{ borderColor: getAffiliationColor() }}
          title={`${unit.echelon?.name || 'Unit'} - ${unit.affiliation}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            {/* Simplified military symbol - echelon indicator */}
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              fill="none"
              stroke={getAffiliationColor()}
              strokeWidth="2"
            />
            <text
              x="12"
              y="15"
              textAnchor="middle"
              fontSize="10"
              fill={getAffiliationColor()}
            >
              {unit.echelon?.symbol || '?'}
            </text>
          </svg>
        </div>

        {/* Unit Info */}
        <div className="unit-info">
          <div className="unit-name">
            {unit.name}
            {unit.designation && <span className="unit-designation"> ({unit.designation})</span>}
          </div>
          <div className="unit-details">
            <span className="unit-echelon">{unit.echelon?.name || 'Unknown'}</span>
            {unit.type && <span className="unit-type"> • {unit.type}</span>}
            {unit.deploymentStatus && (
              <span className="unit-status" title={unit.deploymentStatus}>
                {getDeploymentStatusIcon()}
              </span>
            )}
          </div>
        </div>

        {/* Visibility Toggle */}
        <button
          className="visibility-btn"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Toggle unit visibility on map
          }}
          title={unit.visible ? 'Hide on map' : 'Show on map'}
        >
          {unit.visible !== false ? <EyeIcon /> : <EyeOffIcon />}
        </button>

        {/* Unit Count Badge (for groups with subordinates) */}
        {hasChildren && (
          <span className="unit-count-badge" title={`${unit.children.length} subordinate(s)`}>
            {unit.children.length}
          </span>
        )}
      </div>

      {/* Subordinate Units */}
      {isExpanded && hasChildren && (
        <div className="orbat-tree-children">
          {unit.children.map(child => (
            <OrbatTreeItem
              key={child.id}
              unit={child}
              level={level + 1}
              isExpanded={expandedUnits.has(child.id)}
              isSelected={selectedUnits.has(child.id)}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              filterUnit={filterUnit}
              expandedUnits={expandedUnits}
              selectedUnits={selectedUnits}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrbatTreeItem;
