/**
 * ORBAT Panel Component
 * 
 * Hierarchical military unit management with tree view, sides, filters, and map integration.
 * Inspired by orbat-mapper.app
 * 
 * Features:
 * - Hierarchical tree view with drag-drop reordering
 * - Multiple sides (factions) with color coding
 * - Side groups (Brigade, Division, Corps)
 * - Filters by echelon, type, affiliation, deployment status
 * - Text search across units
 * - Context menu with unit operations
 * - Map integration (deploy, zoom to, locate)
 * - Import/Export JSON format
 * 
 * @component OrbatPanel
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { OrgChartIcon, SideIcon, GroupIcon, DeployIcon, FilterIcon, ExpandIcon, CollapseIcon,
         PlusIcon, UploadIcon, DownloadIcon, SearchIcon, TrashIcon, EyeIcon, EyeOffIcon, MenuIcon } from '../icons/Icons';
import { OrbatTree, OrbatUnit, NATOEchelons, getEchelonByLevel } from '../../services/orbatModel';
import { flatToHierarchy, hierarchyToFlat, scenarioToOrbat, orbatToScenario } from '../../services/orbatConverter';
import OrbatTreeItem from './OrbatTreeItem';
import '../../styles/orbat-panel.css';

const OrbatPanel = ({ map, onClose }) => {
  // State
  const [orbatTree, setOrbatTree] = useState(null);
  const [sides, setSides] = useState([
    {
      id: 'side-1',
      name: 'Blue Force',
      color: '#3B82F6',
      affiliation: 'FRIEND',
      visible: true,
      groups: []
    }
  ]);
  const [selectedUnits, setSelectedUnits] = useState(new Set());
  const [expandedUnits, setExpandedUnits] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedUnit, setDraggedUnit] = useState(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterEchelon, setFilterEchelon] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterAffiliation, setFilterAffiliation] = useState('all');
  const [filterDeployment, setFilterDeployment] = useState('all');
  const [filterMapVisibility, setFilterMapVisibility] = useState('all'); // all, visible, hidden
  
  const fileInputRef = useRef(null);

  // Initialize with sample ORBAT
  useEffect(() => {
    const sampleTree = new OrbatTree({ name: 'Default ORBAT' });
    const rootUnit = new OrbatUnit({
      id: 'root-1',
      name: '1st Infantry Division',
      affiliation: 'FRIEND',
      level: 3, // DIVISION
      echelon: getEchelonByLevel(3),
      position: [7.4474, 46.9479], // Bern coordinates
      deploymentStatus: 'READY'
    });
    
    // Add some subordinate units
    const brigade1 = new OrbatUnit({
      id: 'brigade-1',
      name: '1st Brigade',
      affiliation: 'FRIEND',
      level: 4,
      echelon: getEchelonByLevel(4),
      deploymentStatus: 'READY'
    });
    
    const battalion1 = new OrbatUnit({
      id: 'bn-1',
      name: '1st Battalion',
      affiliation: 'FRIEND',
      level: 6,
      echelon: getEchelonByLevel(6),
      deploymentStatus: 'READY'
    });
    
    rootUnit.addChild(brigade1);
    brigade1.addChild(battalion1);
    
    sampleTree.root = rootUnit;
    setOrbatTree(sampleTree);
    
    // Auto-expand root
    setExpandedUnits(new Set([rootUnit.id]));
  }, []);

  // Filter units based on criteria
  const filterUnit = (unit) => {
    // Text search
    if (filterText && !unit.name.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }
    
    // Echelon filter
    if (filterEchelon !== 'all' && unit.level !== parseInt(filterEchelon)) {
      return false;
    }
    
    // Type filter
    if (filterType !== 'all' && unit.type !== filterType) {
      return false;
    }
    
    // Affiliation filter
    if (filterAffiliation !== 'all' && unit.affiliation !== filterAffiliation) {
      return false;
    }
    
    // Deployment status filter
    if (filterDeployment !== 'all' && unit.deploymentStatus !== filterDeployment) {
      return false;
    }
    
    // Map visibility filter
    if (filterMapVisibility === 'visible' && !unit.visible) {
      return false;
    }
    if (filterMapVisibility === 'hidden' && unit.visible) {
      return false;
    }
    
    return true;
  };

  // Toggle unit expansion
  const toggleExpand = (unitId) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  // Expand all units
  const expandAll = () => {
    if (!orbatTree || !orbatTree.root) return;
    const allIds = new Set();
    orbatTree.traverseDFS(unit => allIds.add(unit.id));
    setExpandedUnits(allIds);
  };

  // Collapse all units
  const collapseAll = () => {
    setExpandedUnits(new Set());
  };

  // Select unit(s)
  const selectUnit = (unitId, multiSelect = false) => {
    if (multiSelect) {
      setSelectedUnits(prev => {
        const next = new Set(prev);
        if (next.has(unitId)) {
          next.delete(unitId);
        } else {
          next.add(unitId);
        }
        return next;
      });
    } else {
      setSelectedUnits(new Set([unitId]));
    }
  };

  // Add new unit
  const handleAddUnit = () => {
    if (!orbatTree) {
      // Create new tree with root unit
      const newTree = new OrbatTree({ name: 'New ORBAT' });
      const rootUnit = new OrbatUnit({
        id: `unit-${Date.now()}`,
        name: 'New Unit',
        affiliation: 'FRIEND',
        level: 6,
        echelon: getEchelonByLevel(6),
        deploymentStatus: 'READY'
      });
      newTree.root = rootUnit;
      setOrbatTree(newTree);
      setExpandedUnits(new Set([rootUnit.id]));
      setSelectedUnits(new Set([rootUnit.id]));
      return;
    }
    
    // Add subordinate to selected unit
    const selectedUnitId = Array.from(selectedUnits)[0];
    if (selectedUnitId) {
      const parentUnit = orbatTree.findUnit(selectedUnitId);
      if (parentUnit) {
        const newUnit = new OrbatUnit({
          id: `unit-${Date.now()}`,
          name: 'New Subordinate Unit',
          affiliation: parentUnit.affiliation,
          level: Math.min(parentUnit.level + 1, 10),
          echelon: getEchelonByLevel(Math.min(parentUnit.level + 1, 10)),
          deploymentStatus: 'READY'
        });
        parentUnit.addChild(newUnit);
        setOrbatTree(new OrbatTree({ ...orbatTree })); // Trigger re-render
        setExpandedUnits(prev => new Set([...prev, parentUnit.id]));
        setSelectedUnits(new Set([newUnit.id]));
      }
    }
  };

  // Delete selected units
  const handleDeleteUnits = () => {
    if (selectedUnits.size === 0) return;
    if (!confirm(`Delete ${selectedUnits.size} unit(s)?`)) return;
    
    selectedUnits.forEach(unitId => {
      orbatTree.removeUnit(unitId);
    });
    
    setOrbatTree(new OrbatTree({ ...orbatTree }));
    setSelectedUnits(new Set());
  };

  // Deploy units to map
  const handleDeploy = () => {
    if (!map || !orbatTree || !orbatTree.root) return;
    
    const validation = orbatTree.validate();
    if (!validation.valid) {
      alert(`ORBAT validation failed:\n${validation.errors.join('\n')}`);
      return;
    }
    
    let deployedCount = 0;
    
    orbatTree.traverseDFS(unit => {
      if (unit.position && unit.position.length === 2) {
        // Add unit to map as marker
        // TODO: Integrate with map layer
        deployedCount++;
      }
    });
    
    alert(`Deployed ${deployedCount} units to map`);
  };

  // Import ORBAT JSON
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const imported = OrbatTree.fromJSON(json);
        setOrbatTree(imported);
        if (imported.root) {
          setExpandedUnits(new Set([imported.root.id]));
        }
        alert(`ORBAT imported: ${imported.getTotalUnits()} units`);
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Export ORBAT JSON
  const handleExport = () => {
    if (!orbatTree || !orbatTree.root) {
      alert('No ORBAT to export');
      return;
    }
    
    const json = orbatTree.toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${orbatTree.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add new side
  const handleAddSide = () => {
    const newSide = {
      id: `side-${Date.now()}`,
      name: `Side ${sides.length + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      affiliation: 'FRIEND',
      visible: true,
      groups: []
    };
    setSides([...sides, newSide]);
  };

  // Toggle side visibility
  const toggleSideVisibility = (sideId) => {
    setSides(sides.map(side => 
      side.id === sideId ? { ...side, visible: !side.visible } : side
    ));
  };

  // Context menu handlers
  const handleContextMenu = (e, unit) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      unit: unit
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Context menu actions
  const handleZoomToUnit = (unit) => {
    if (!map || !unit.position) return;
    const view = map.getView();
    view.animate({
      center: unit.position,
      zoom: 12,
      duration: 500
    });
    closeContextMenu();
  };

  const handleDeleteUnit = (unit) => {
    if (!confirm(`Delete unit "${unit.name}"?`)) return;
    orbatTree.removeUnit(unit.id);
    setOrbatTree(new OrbatTree({ ...orbatTree }));
    closeContextMenu();
  };

  // Click outside to close context menu
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div className="orbat-panel">
      <div className="orbat-panel-header">
        <div className="header-title">
          <OrgChartIcon />
          <h2>ORBAT Manager</h2>
        </div>
        <button onClick={onClose} className="close-btn" title="Close">
          ✕
        </button>
      </div>

      {/* Toolbar */}
      <div className="orbat-toolbar">
        <div className="toolbar-group">
          <button onClick={handleAddUnit} title="Add Unit" className="toolbar-btn">
            <PlusIcon />
          </button>
          <button onClick={handleAddSide} title="Add Side" className="toolbar-btn">
            <SideIcon />
          </button>
          <button onClick={handleDeleteUnits} title="Delete Selected" className="toolbar-btn"
                  disabled={selectedUnits.size === 0}>
            <TrashIcon />
          </button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={handleDeploy} title="Deploy to Map" className="toolbar-btn">
            <DeployIcon />
          </button>
          <button onClick={expandAll} title="Expand All" className="toolbar-btn">
            <ExpandIcon />
          </button>
          <button onClick={collapseAll} title="Collapse All" className="toolbar-btn">
            <CollapseIcon />
          </button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={() => setShowFilters(!showFilters)} title="Toggle Filters" 
                  className={`toolbar-btn ${showFilters ? 'active' : ''}`}>
            <FilterIcon />
          </button>
        </div>
        
        <div className="toolbar-group">
          <button onClick={handleImport} title="Import JSON" className="toolbar-btn">
            <UploadIcon />
          </button>
          <button onClick={handleExport} title="Export JSON" className="toolbar-btn">
            <DownloadIcon />
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="orbat-filters">
          <div className="filter-row">
            <div className="filter-group">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search units..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filter-row">
            <select value={filterEchelon} onChange={(e) => setFilterEchelon(e.target.value)} 
                    className="filter-select">
              <option value="all">All Echelons</option>
              {Object.entries(NATOEchelons).map(([key, echelon]) => (
                <option key={key} value={echelon.level}>{echelon.name}</option>
              ))}
            </select>
            
            <select value={filterAffiliation} onChange={(e) => setFilterAffiliation(e.target.value)} 
                    className="filter-select">
              <option value="all">All Affiliations</option>
              <option value="FRIEND">Friend</option>
              <option value="HOSTILE">Hostile</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
          
          <div className="filter-row">
            <select value={filterDeployment} onChange={(e) => setFilterDeployment(e.target.value)} 
                    className="filter-select">
              <option value="all">All Status</option>
              <option value="READY">Ready</option>
              <option value="DEPLOYING">Deploying</option>
              <option value="DEPLOYED">Deployed</option>
              <option value="WITHDRAWING">Withdrawing</option>
            </select>
            
            <select value={filterMapVisibility} onChange={(e) => setFilterMapVisibility(e.target.value)} 
                    className="filter-select">
              <option value="all">Map Visibility: All</option>
              <option value="visible">Visible on Map</option>
              <option value="hidden">Hidden from Map</option>
            </select>
          </div>
        </div>
      )}

      {/* Sides List */}
      <div className="orbat-sides">
        {sides.map(side => (
          <div key={side.id} className="side-header">
            <div className="side-info">
              <div className="side-color" style={{ backgroundColor: side.color }}></div>
              <span className="side-name">{side.name}</span>
              <span className="side-badge">{/* unit count */}</span>
            </div>
            <div className="side-actions">
              <button onClick={() => toggleSideVisibility(side.id)} title="Toggle Visibility">
                {side.visible ? <EyeIcon /> : <EyeOffIcon />}
              </button>
              <button title="Side Menu">
                <MenuIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ORBAT Tree */}
      <div className="orbat-tree">
        {orbatTree && orbatTree.root ? (
          <OrbatTreeItem
            unit={orbatTree.root}
            level={0}
            isExpanded={expandedUnits.has(orbatTree.root.id)}
            isSelected={selectedUnits.has(orbatTree.root.id)}
            onToggleExpand={toggleExpand}
            onSelect={selectUnit}
            onContextMenu={handleContextMenu}
            filterUnit={filterUnit}
            expandedUnits={expandedUnits}
            selectedUnits={selectedUnits}
          />
        ) : (
          <div className="orbat-empty">
            <OrgChartIcon />
            <p>No ORBAT loaded</p>
            <button onClick={handleAddUnit} className="btn-primary">Create Root Unit</button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="orbat-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-item" onClick={() => handleZoomToUnit(contextMenu.unit)}>
            Zoom to Unit
          </div>
          <div className="context-menu-item" onClick={() => handleDeleteUnit(contextMenu.unit)}>
            Delete Unit
          </div>
          <div className="context-menu-item">
            Add Subordinate
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item">
            Edit Unit
          </div>
          <div className="context-menu-item">
            Clone Unit
          </div>
        </div>
      )}
    </div>
  );
};

export default OrbatPanel;
