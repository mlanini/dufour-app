/**
 * Military Layer for OpenLayers
 * Renders military symbols (APP-6/MIL-STD-2525) on the map
 */

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Text, Fill, Stroke, Circle } from 'ol/style';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { fromLonLat } from 'ol/proj';
import { 
  MilitaryUnit, 
  MilitaryScenario,
  getAffiliationColor,
  getUnitLabel 
} from '../services/militarySymbols';

/**
 * Create military symbol style
 * Uses canvas to draw military symbols based on SIDC
 */
function createMilitarySymbolStyle(unit) {
  const color = getAffiliationColor(unit.affiliation);
  const label = getUnitLabel(unit);
  
  // Create canvas for symbol
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Draw symbol background (frame)
  ctx.strokeStyle = color;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  
  // Symbol shape based on affiliation
  const centerX = size / 2;
  const centerY = size / 2;
  const symbolSize = 28;
  
  switch (unit.affiliation) {
    case 'friend': // Rectangle
      ctx.fillRect(centerX - symbolSize/2, centerY - symbolSize/2, symbolSize, symbolSize);
      ctx.strokeRect(centerX - symbolSize/2, centerY - symbolSize/2, symbolSize, symbolSize);
      break;
    case 'hostile': // Diamond
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - symbolSize/2);
      ctx.lineTo(centerX + symbolSize/2, centerY);
      ctx.lineTo(centerX, centerY + symbolSize/2);
      ctx.lineTo(centerX - symbolSize/2, centerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'neutral': // Square with rounded corners
      roundRect(ctx, centerX - symbolSize/2, centerY - symbolSize/2, symbolSize, symbolSize, 4);
      ctx.fill();
      ctx.stroke();
      break;
    case 'unknown': // Clover (simplified as circle with cross)
      ctx.beginPath();
      ctx.arc(centerX, centerY, symbolSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
  }
  
  // Draw unit type icon (simplified)
  ctx.fillStyle = color;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const typeSymbol = getTypeSymbol(unit.type);
  ctx.fillText(typeSymbol, centerX, centerY);
  
  // Draw echelon indicator
  ctx.font = 'bold 12px Arial';
  const echelonSymbol = getEchelonSymbol(unit.echelon);
  ctx.fillText(echelonSymbol, centerX, centerY - symbolSize/2 - 8);
  
  return new Style({
    image: new Icon({
      img: canvas,
      imgSize: [size, size],
      anchor: [0.5, 0.5]
    }),
    text: new Text({
      text: label,
      offsetY: 35,
      font: 'bold 12px Arial',
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      textAlign: 'center'
    })
  });
}

/**
 * Helper: Draw rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Get symbol for unit type
 */
function getTypeSymbol(type) {
  const symbols = {
    infantry: 'I',
    armor: 'A',
    mechanized: 'M',
    artillery: '●',
    engineer: 'E',
    signal: 'S',
    logistics: 'L',
    medical: '+',
    aviation: '✈',
    headquarters: 'HQ',
    reconnaissance: 'R',
    special_forces: 'SF',
    maintenance: 'MT',
    transport: 'T',
    supply: 'SU'
  };
  return symbols[type] || '?';
}

/**
 * Get echelon symbol
 */
function getEchelonSymbol(echelon) {
  const symbols = {
    team: '●',
    squad: '●●',
    section: '●●●',
    platoon: '•',
    company: 'I',
    battalion: 'II',
    regiment: 'III',
    brigade: 'X',
    division: 'XX',
    corps: 'XXX',
    army: 'XXXX'
  };
  return symbols[echelon] || '';
}

/**
 * Create feature from military unit
 */
function createFeatureFromUnit(unit) {
  const feature = new Feature({
    geometry: new Point(fromLonLat(unit.position)),
    unit: unit
  });
  
  feature.setId(unit.id);
  feature.setStyle(createMilitarySymbolStyle(unit));
  
  return feature;
}

/**
 * Military Layer Class
 */
export class MilitaryLayer {
  constructor(options = {}) {
    this.scenario = options.scenario || new MilitaryScenario();
    
    // Create vector source
    this.source = new VectorSource();
    
    // Create vector layer
    this.layer = new VectorLayer({
      source: this.source,
      zIndex: options.zIndex || 100,
      properties: {
        name: options.name || 'Military Units',
        type: 'military'
      }
    });
    
    // Initialize features
    this.updateFeatures();
  }

  /**
   * Get OpenLayers layer
   */
  getLayer() {
    return this.layer;
  }

  /**
   * Add unit to scenario
   */
  addUnit(unit) {
    this.scenario.addUnit(unit);
    const feature = createFeatureFromUnit(unit);
    this.source.addFeature(feature);
    return feature;
  }

  /**
   * Remove unit from scenario
   */
  removeUnit(unitId) {
    this.scenario.removeUnit(unitId);
    const feature = this.source.getFeatureById(unitId);
    if (feature) {
      this.source.removeFeature(feature);
    }
  }

  /**
   * Update unit
   */
  updateUnit(unitId, updates) {
    const unit = this.scenario.getUnit(unitId);
    if (!unit) return;
    
    Object.assign(unit, updates);
    
    // Update feature
    const feature = this.source.getFeatureById(unitId);
    if (feature) {
      if (updates.position) {
        feature.getGeometry().setCoordinates(fromLonLat(updates.position));
      }
      feature.setStyle(createMilitarySymbolStyle(unit));
    }
  }

  /**
   * Get unit by ID
   */
  getUnit(unitId) {
    return this.scenario.getUnit(unitId);
  }

  /**
   * Get all units
   */
  getAllUnits() {
    return this.scenario.units;
  }

  /**
   * Clear all units
   */
  clear() {
    this.scenario.units = [];
    this.source.clear();
  }

  /**
   * Update all features from scenario
   */
  updateFeatures() {
    this.source.clear();
    this.scenario.units.forEach(unit => {
      const feature = createFeatureFromUnit(unit);
      this.source.addFeature(feature);
    });
  }

  /**
   * Load scenario
   */
  loadScenario(scenario) {
    this.scenario = scenario;
    this.updateFeatures();
  }

  /**
   * Export scenario to GeoJSON
   */
  exportGeoJSON() {
    return this.scenario.toGeoJSON();
  }

  /**
   * Import from GeoJSON
   */
  importGeoJSON(geojson) {
    this.scenario = MilitaryScenario.fromGeoJSON(geojson);
    this.updateFeatures();
  }

  /**
   * Export scenario to JSON
   */
  exportJSON() {
    return this.scenario.toJSON();
  }

  /**
   * Import from JSON
   */
  importJSON(json) {
    this.scenario = MilitaryScenario.fromJSON(json);
    this.updateFeatures();
  }

  /**
   * Get feature at pixel (for selection)
   */
  getFeatureAtPixel(map, pixel) {
    let feature = null;
    map.forEachFeatureAtPixel(pixel, (f, layer) => {
      if (layer === this.layer) {
        feature = f;
        return true;
      }
    });
    return feature;
  }

  /**
   * Select unit
   */
  selectUnit(unitId) {
    const feature = this.source.getFeatureById(unitId);
    if (feature) {
      const unit = feature.get('unit');
      // Add selection style (larger, highlighted)
      const style = createMilitarySymbolStyle(unit);
      const image = style.getImage();
      image.setScale(1.3);
      feature.setStyle(style);
    }
  }

  /**
   * Deselect unit
   */
  deselectUnit(unitId) {
    const feature = this.source.getFeatureById(unitId);
    if (feature) {
      const unit = feature.get('unit');
      feature.setStyle(createMilitarySymbolStyle(unit));
    }
  }

  /**
   * Set unit visibility
   */
  setUnitVisibility(unitId, visible) {
    const feature = this.source.getFeatureById(unitId);
    if (feature) {
      feature.setStyle(visible ? createMilitarySymbolStyle(feature.get('unit')) : null);
    }
  }

  /**
   * Filter units by affiliation
   */
  filterByAffiliation(affiliations) {
    this.scenario.units.forEach(unit => {
      const visible = affiliations.includes(unit.affiliation);
      this.setUnitVisibility(unit.id, visible);
    });
  }

  /**
   * Get layer extent
   */
  getExtent() {
    return this.source.getExtent();
  }

  /**
   * Fit map to units
   */
  fitToUnits(map, options = {}) {
    const extent = this.getExtent();
    if (extent && !isNaN(extent[0])) {
      map.getView().fit(extent, {
        padding: options.padding || [50, 50, 50, 50],
        duration: options.duration || 500,
        maxZoom: options.maxZoom || 15
      });
    }
  }

  /**
   * ORBAT INTEGRATION METHODS
   */

  /**
   * Load ORBAT tree and render all units
   */
  loadOrbatTree(orbatTree, options = {}) {
    if (!orbatTree || !orbatTree.root) {
      console.warn('Cannot load empty ORBAT tree');
      return;
    }

    // Clear existing units
    this.clear();

    // Extract all units from tree
    const allUnits = orbatTree.getAllUnits();
    
    // Add units to scenario
    this.scenario.name = orbatTree.name;
    this.scenario.description = orbatTree.description;
    this.scenario.units = allUnits;

    // Store ORBAT tree reference
    this.orbatTree = orbatTree;
    this.showCommandLines = options.showCommandLines !== false; // Default true

    // Render all units
    allUnits.forEach(unit => this.addUnit(unit));

    // Render command lines if enabled
    if (this.showCommandLines) {
      this.renderCommandLines();
    }

    console.log(`Loaded ORBAT: ${orbatTree.getTotalUnits()} units`);
  }

  /**
   * Render command lines (parent-child relationships)
   */
  renderCommandLines() {
    if (!this.orbatTree) return;

    // Remove existing command lines
    this.clearCommandLines();

    const commandLinesLayer = new VectorLayer({
      source: new VectorSource(),
      style: this.createCommandLineStyle(),
      zIndex: this.layer.getZIndex() - 1 // Below symbols
    });

    this.orbatTree.traverseDFS(unit => {
      if (unit.children.length > 0) {
        unit.children.forEach(child => {
          const line = this.createCommandLine(unit, child);
          if (line) {
            commandLinesLayer.getSource().addFeature(line);
          }
        });
      }
    });

    this.commandLinesLayer = commandLinesLayer;
    
    // Add to map (assuming map reference is available)
    if (this.layer.getMap()) {
      this.layer.getMap().addLayer(commandLinesLayer);
    }
  }

  /**
   * Create command line feature between parent and child
   */
  createCommandLine(parent, child) {
    if (!parent.position || !child.position) return null;

    const { LineString } = require('ol/geom');
    
    const coords = [
      fromLonLat(parent.position),
      fromLonLat(child.position)
    ];

    const line = new Feature({
      geometry: new LineString(coords),
      parent: parent,
      child: child,
      type: 'command-line'
    });

    return line;
  }

  /**
   * Create style for command lines
   */
  createCommandLineStyle() {
    return new Style({
      stroke: new Stroke({
        color: 'rgba(52, 152, 219, 0.6)',
        width: 2,
        lineDash: [4, 4]
      })
    });
  }

  /**
   * Toggle command lines visibility
   */
  toggleCommandLines(visible) {
    if (visible === undefined) {
      this.showCommandLines = !this.showCommandLines;
    } else {
      this.showCommandLines = visible;
    }

    if (this.commandLinesLayer) {
      this.commandLinesLayer.setVisible(this.showCommandLines);
    } else if (this.showCommandLines) {
      this.renderCommandLines();
    }
  }

  /**
   * Clear command lines
   */
  clearCommandLines() {
    if (this.commandLinesLayer) {
      const map = this.commandLinesLayer.getMap();
      if (map) {
        map.removeLayer(this.commandLinesLayer);
      }
      this.commandLinesLayer = null;
    }
  }

  /**
   * Filter units by echelon level
   */
  filterByEchelon(minLevel, maxLevel) {
    if (!this.orbatTree) {
      console.warn('No ORBAT tree loaded');
      return;
    }

    this.orbatTree.getAllUnits().forEach(unit => {
      const visible = unit.level >= minLevel && unit.level <= maxLevel;
      this.setUnitVisibility(unit.id, visible);
    });

    // Update command lines
    if (this.showCommandLines) {
      this.renderCommandLines();
    }
  }

  /**
   * Highlight unit and its relationships
   */
  highlightUnitHierarchy(unitId) {
    if (!this.orbatTree) return;

    const unit = this.orbatTree.findUnitById(unitId);
    if (!unit) return;

    // Get ancestors and descendants
    const ancestors = unit.getAncestors();
    const descendants = unit.getDescendants();
    const related = [unit, ...ancestors, ...descendants];

    // Dim all units
    this.scenario.units.forEach(u => {
      const isRelated = related.includes(u);
      const feature = this.source.getFeatureById(u.id);
      if (feature) {
        const style = createMilitarySymbolStyle(u);
        if (!isRelated) {
          style.setOpacity(0.3);
        }
        feature.setStyle(style);
      }
    });

    // Select the target unit
    this.selectUnit(unitId);
  }

  /**
   * Clear hierarchy highlight
   */
  clearHierarchyHighlight() {
    this.scenario.units.forEach(unit => {
      const feature = this.source.getFeatureById(unit.id);
      if (feature) {
        feature.setStyle(createMilitarySymbolStyle(unit));
      }
    });
  }

  /**
   * Update unit positions from ORBAT tree at specific timestamp
   * (for timeline support)
   */
  updatePositionsAtTime(timestamp) {
    if (!this.orbatTree) return;

    const allUnits = this.orbatTree.getAllUnits();
    
    allUnits.forEach(unit => {
      const position = unit.getPositionAtTime(timestamp);
      if (position) {
        const feature = this.source.getFeatureById(unit.id);
        if (feature) {
          feature.getGeometry().setCoordinates(fromLonLat(position));
        }
        unit.position = position; // Update unit position
      }
    });

    // Update command lines
    if (this.showCommandLines) {
      this.renderCommandLines();
    }
  }
}

export default MilitaryLayer;
