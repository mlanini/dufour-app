/**
 * Military Symbols Service - ORBAT Integration
 * Based on APP-6 and MIL-STD-2525 standards
 * Uses milsymbol.js library for symbol rendering
 */

// Symbol affiliations (identity)
export const Affiliations = {
  FRIEND: 'friend',
  HOSTILE: 'hostile',
  NEUTRAL: 'neutral',
  UNKNOWN: 'unknown'
};

// Symbol status
export const Status = {
  PRESENT: 'present',
  ANTICIPATED: 'anticipated',
  ASSUMED_FRIEND: 'assumed_friend'
};

// Unit echelons (size)
export const Echelons = {
  TEAM: 'team',
  SQUAD: 'squad',
  SECTION: 'section',
  PLATOON: 'platoon',
  COMPANY: 'company',
  BATTALION: 'battalion',
  REGIMENT: 'regiment',
  BRIGADE: 'brigade',
  DIVISION: 'division',
  CORPS: 'corps',
  ARMY: 'army'
};

// Unit types (function)
export const UnitTypes = {
  // Ground units
  INFANTRY: 'infantry',
  ARMOR: 'armor',
  MECHANIZED: 'mechanized',
  ARTILLERY: 'artillery',
  ENGINEER: 'engineer',
  SIGNAL: 'signal',
  LOGISTICS: 'logistics',
  MEDICAL: 'medical',
  AVIATION: 'aviation',
  
  // Special units
  HEADQUARTERS: 'headquarters',
  RECON: 'reconnaissance',
  SPECIAL_FORCES: 'special_forces',
  
  // Support
  MAINTENANCE: 'maintenance',
  TRANSPORT: 'transport',
  SUPPLY: 'supply'
};

/**
 * Military Unit class
 */
export class MilitaryUnit {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.name = options.name || 'Unit';
    this.designation = options.designation || '';
    this.affiliation = options.affiliation || Affiliations.FRIEND;
    this.status = options.status || Status.PRESENT;
    this.echelon = options.echelon || Echelons.COMPANY;
    this.type = options.type || UnitTypes.INFANTRY;
    this.position = options.position || null; // [lon, lat]
    this.parent = options.parent || null;
    this.children = options.children || [];
    this.metadata = options.metadata || {};
    this.timestamp = options.timestamp || Date.now();
  }

  /**
   * Generate SIDC (Symbol Identification Code)
   * Simplified APP-6D format
   */
  generateSIDC() {
    const version = '10'; // APP-6D
    const context = 'R'; // Reality (R=Real, S=Simulation)
    
    // Affiliation
    let affiliation;
    switch (this.affiliation) {
      case Affiliations.FRIEND: affiliation = '3'; break;
      case Affiliations.HOSTILE: affiliation = '6'; break;
      case Affiliations.NEUTRAL: affiliation = '4'; break;
      case Affiliations.UNKNOWN: affiliation = '1'; break;
      default: affiliation = '0';
    }
    
    const dimension = 'G'; // Ground
    
    // Status
    let status;
    switch (this.status) {
      case Status.PRESENT: status = '0'; break;
      case Status.ANTICIPATED: status = '1'; break;
      case Status.ASSUMED_FRIEND: status = '2'; break;
      default: status = '0';
    }
    
    // Unit type (simplified)
    let functionId = '110100'; // Infantry default
    switch (this.type) {
      case UnitTypes.INFANTRY: functionId = '110100'; break;
      case UnitTypes.ARMOR: functionId = '110200'; break;
      case UnitTypes.MECHANIZED: functionId = '110300'; break;
      case UnitTypes.ARTILLERY: functionId = '110500'; break;
      case UnitTypes.ENGINEER: functionId = '110800'; break;
      case UnitTypes.HEADQUARTERS: functionId = '110000'; break;
      case UnitTypes.RECON: functionId = '110400'; break;
      default: functionId = '110100';
    }
    
    // Echelon
    let echelon;
    switch (this.echelon) {
      case Echelons.TEAM: echelon = '11'; break;
      case Echelons.SQUAD: echelon = '12'; break;
      case Echelons.SECTION: echelon = '13'; break;
      case Echelons.PLATOON: echelon = '14'; break;
      case Echelons.COMPANY: echelon = '15'; break;
      case Echelons.BATTALION: echelon = '16'; break;
      case Echelons.REGIMENT: echelon = '17'; break;
      case Echelons.BRIGADE: echelon = '18'; break;
      case Echelons.DIVISION: echelon = '21'; break;
      case Echelons.CORPS: echelon = '22'; break;
      case Echelons.ARMY: echelon = '23'; break;
      default: echelon = '00';
    }
    
    // Build SIDC: Version(2) + Context(1) + Affiliation(1) + Dimension(1) + Status(1) + Function(6) + Modifier1(2) + Modifier2(2)
    return `${version}${context}${affiliation}${dimension}${status}${functionId}${echelon}00`;
  }

  /**
   * Convert to GeoJSON feature
   */
  toGeoJSON() {
    return {
      type: 'Feature',
      id: this.id,
      geometry: {
        type: 'Point',
        coordinates: this.position
      },
      properties: {
        name: this.name,
        designation: this.designation,
        affiliation: this.affiliation,
        status: this.status,
        echelon: this.echelon,
        type: this.type,
        sidc: this.generateSIDC(),
        parent: this.parent,
        children: this.children,
        timestamp: this.timestamp,
        ...this.metadata
      }
    };
  }

  /**
   * Create from GeoJSON feature
   */
  static fromGeoJSON(feature) {
    return new MilitaryUnit({
      id: feature.id,
      name: feature.properties.name,
      designation: feature.properties.designation,
      affiliation: feature.properties.affiliation,
      status: feature.properties.status,
      echelon: feature.properties.echelon,
      type: feature.properties.type,
      position: feature.geometry.coordinates,
      parent: feature.properties.parent,
      children: feature.properties.children || [],
      timestamp: feature.properties.timestamp,
      metadata: { ...feature.properties }
    });
  }
}

/**
 * Scenario class - Collection of units with temporal data
 */
export class MilitaryScenario {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.name = options.name || 'Scenario';
    this.description = options.description || '';
    this.units = options.units || [];
    this.startTime = options.startTime || Date.now();
    this.endTime = options.endTime || null;
    this.metadata = options.metadata || {};
  }

  /**
   * Add unit to scenario
   */
  addUnit(unit) {
    this.units.push(unit);
  }

  /**
   * Remove unit from scenario
   */
  removeUnit(unitId) {
    this.units = this.units.filter(u => u.id !== unitId);
  }

  /**
   * Get unit by ID
   */
  getUnit(unitId) {
    return this.units.find(u => u.id === unitId);
  }

  /**
   * Export to GeoJSON FeatureCollection
   */
  toGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: this.units.map(unit => unit.toGeoJSON()),
      properties: {
        scenarioId: this.id,
        scenarioName: this.name,
        description: this.description,
        startTime: this.startTime,
        endTime: this.endTime,
        ...this.metadata
      }
    };
  }

  /**
   * Import from GeoJSON
   */
  static fromGeoJSON(geojson) {
    const scenario = new MilitaryScenario({
      id: geojson.properties?.scenarioId,
      name: geojson.properties?.scenarioName || 'Imported Scenario',
      description: geojson.properties?.description || '',
      startTime: geojson.properties?.startTime || Date.now(),
      endTime: geojson.properties?.endTime || null,
      metadata: { ...geojson.properties }
    });

    scenario.units = geojson.features.map(feature => 
      MilitaryUnit.fromGeoJSON(feature)
    );

    return scenario;
  }

  /**
   * Export to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      units: this.units.map(unit => ({
        id: unit.id,
        name: unit.name,
        designation: unit.designation,
        affiliation: unit.affiliation,
        status: unit.status,
        echelon: unit.echelon,
        type: unit.type,
        position: unit.position,
        parent: unit.parent,
        children: unit.children,
        timestamp: unit.timestamp,
        metadata: unit.metadata
      })),
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata
    };
  }

  /**
   * Import from JSON
   */
  static fromJSON(json) {
    return new MilitaryScenario({
      ...json,
      units: json.units.map(u => new MilitaryUnit(u))
    });
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get color for affiliation
 */
export function getAffiliationColor(affiliation) {
  switch (affiliation) {
    case Affiliations.FRIEND: return '#00A0FF'; // Blue
    case Affiliations.HOSTILE: return '#FF0000'; // Red
    case Affiliations.NEUTRAL: return '#00FF00'; // Green
    case Affiliations.UNKNOWN: return '#FFFF00'; // Yellow
    default: return '#808080'; // Grey
  }
}

/**
 * Get human-readable label for unit
 */
export function getUnitLabel(unit) {
  let label = unit.designation || unit.name;
  
  // Add echelon symbol
  const echelonSymbols = {
    [Echelons.TEAM]: '●',
    [Echelons.SQUAD]: '●●',
    [Echelons.SECTION]: '●●●',
    [Echelons.PLATOON]: '•',
    [Echelons.COMPANY]: '|',
    [Echelons.BATTALION]: '||',
    [Echelons.REGIMENT]: '|||',
    [Echelons.BRIGADE]: 'X',
    [Echelons.DIVISION]: 'XX',
    [Echelons.CORPS]: 'XXX',
    [Echelons.ARMY]: 'XXXX'
  };
  
  const symbol = echelonSymbols[unit.echelon] || '';
  return symbol ? `${symbol} ${label}` : label;
}

export default {
  Affiliations,
  Status,
  Echelons,
  UnitTypes,
  MilitaryUnit,
  MilitaryScenario,
  getAffiliationColor,
  getUnitLabel
};
