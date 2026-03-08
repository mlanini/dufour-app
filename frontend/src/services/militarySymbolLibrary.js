/**
 * Military Symbol Library
 * Provides APP-6D and MIL-STD-2525D military symbols
 * Based on orbat-mapper implementation
 */
import ms from 'milsymbol';

// Custom color modes (KADAS-inspired)
const customColorMode = ms.getColorMode('Light');
customColorMode.Friend = 'rgb(170, 176, 116)';

const customIconColor = { ...ms.getColorMode('FrameColor') };
customIconColor.Friend = 'rgb(65, 70, 22)';

/**
 * Generate a military symbol from SIDC code
 * @param {string} sidc - Symbol Identification Code (20 digits)
 * @param {object} options - Symbol options (size, uniqueDesignation, etc.)
 * @returns {object} Milsymbol instance with toDataURL() method
 */
export function generateSymbol(sidc, options = {}) {
  const defaultOptions = {
    size: 30,
    colorMode: customColorMode,
    ...options
  };
  
  return new ms.Symbol(sidc, defaultOptions);
}

/**
 * Common symbol categories for quick access
 */
export const symbolCategories = {
  // Land Units (Symbol Set 10)
  landUnits: {
    name: 'Land Units',
    symbolSet: '10',
    categories: [
      {
        name: 'Infantry',
        entities: [
          { name: 'Infantry', code: '10031000001211000000', icon: '👥' },
          { name: 'Motorized Infantry', code: '10031000001211040000', icon: '🚐' },
          { name: 'Mechanized Infantry', code: '10031000001211050000', icon: '🚗' },
          { name: 'Airborne', code: '10031000001211010000', icon: '🪂' },
          { name: 'Mountain Infantry', code: '10031000001211070000', icon: '⛰️' },
        ]
      },
      {
        name: 'Armored',
        entities: [
          { name: 'Armor', code: '10031000001205000000', icon: '🛡️' },
          { name: 'Tank', code: '10031500001101000000', icon: '🔫' },
          { name: 'Armored Personnel Carrier', code: '10031500001102000000', icon: '🚙' },
          { name: 'Armored Fighting Vehicle', code: '10031500001103000000', icon: '🎖️' },
        ]
      },
      {
        name: 'Artillery',
        entities: [
          { name: 'Artillery', code: '10031000001303000000', icon: '🎯' },
          { name: 'Self-Propelled Artillery', code: '10031000001303010000', icon: '🚜' },
          { name: 'Towed Artillery', code: '10031000001303030000', icon: '🔧' },
          { name: 'Rocket Artillery', code: '10031000001307000000', icon: '🚀' },
          { name: 'Mortar', code: '10031000001308000000', icon: '💣' },
        ]
      },
      {
        name: 'Air Defense',
        entities: [
          { name: 'Air Defense', code: '10031000001301000000', icon: '🛡️' },
          { name: 'Surface-to-Air Missile', code: '10031000001301020000', icon: '🎯' },
          { name: 'Air Defense Gun', code: '10031000001301010000', icon: '🔫' },
        ]
      },
      {
        name: 'Aviation',
        entities: [
          { name: 'Aviation', code: '10031000001206000000', icon: '🚁' },
          { name: 'Attack Helicopter', code: '10031000001206540000', icon: '🚁' },
          { name: 'Transport Helicopter', code: '10031000001206520000', icon: '🚁' },
          { name: 'Fixed Wing', code: '10031000001208000000', icon: '✈️' },
        ]
      },
      {
        name: 'Support',
        entities: [
          { name: 'Headquarters', code: '10031000001100000000', icon: '🏛️' },
          { name: 'Command Post', code: '10031000001100800000', icon: '📋' },
          { name: 'Supply', code: '10031000001505000000', icon: '📦' },
          { name: 'Maintenance', code: '10031000001506000000', icon: '🔧' },
          { name: 'Medical', code: '10031000001507000000', icon: '⚕️' },
          { name: 'Engineer', code: '10031000001407000000', icon: '🛠️' },
          { name: 'Signal/Communications', code: '10031000001604000000', icon: '📡' },
        ]
      },
      {
        name: 'Special Forces',
        entities: [
          { name: 'Special Operations Forces', code: '10031000001218000000', icon: '🎖️' },
          { name: 'Reconnaissance', code: '10031000001203000000', icon: '🔍' },
          { name: 'CBRN', code: '10031000001401000000', icon: '☢️' },
        ]
      }
    ]
  },
  
  // Land Equipment (Symbol Set 15)
  landEquipment: {
    name: 'Land Equipment',
    symbolSet: '15',
    categories: [
      {
        name: 'Vehicles',
        entities: [
          { name: 'Wheeled Vehicle', code: '15031000001101000000', icon: '🚙' },
          { name: 'Tracked Vehicle', code: '15031000001102000000', icon: '🚜' },
          { name: 'Truck', code: '15031000001103000000', icon: '🚚' },
        ]
      },
      {
        name: 'Weapons',
        entities: [
          { name: 'Machine Gun', code: '15031000001201000000', icon: '🔫' },
          { name: 'Anti-Tank Weapon', code: '15031000001202000000', icon: '🎯' },
          { name: 'Missile Launcher', code: '15031000001203000000', icon: '🚀' },
        ]
      }
    ]
  },
  
  // Land Installations (Symbol Set 20)
  landInstallations: {
    name: 'Land Installations',
    symbolSet: '20',
    categories: [
      {
        name: 'Military Facilities',
        entities: [
          { name: 'Military Base', code: '20031000001208020000', icon: '🏰' },
          { name: 'Airfield', code: '20031000001102000000', icon: '✈️' },
          { name: 'Port', code: '20031000001117000000', icon: '⚓' },
          { name: 'Supply Depot', code: '20031000001112000000', icon: '📦' },
        ]
      },
      {
        name: 'Infrastructure',
        entities: [
          { name: 'Bridge', code: '20031000001200000000', icon: '🌉' },
          { name: 'Road', code: '20031000001201000000', icon: '🛣️' },
          { name: 'Railway', code: '20031000001202000000', icon: '🚂' },
        ]
      }
    ]
  },
  
  // Control Measures (Symbol Set 25)
  controlMeasures: {
    name: 'Control Measures',
    symbolSet: '25',
    categories: [
      {
        name: 'Boundaries',
        entities: [
          { name: 'Boundary', code: '25031000001101000000', icon: '━' },
          { name: 'Phase Line', code: '25031000001102000000', icon: '╌' },
        ]
      },
      {
        name: 'Areas',
        entities: [
          { name: 'Assembly Area', code: '25031000001201000000', icon: '⬜' },
          { name: 'Objective', code: '25031000001202000000', icon: '🎯' },
        ]
      }
    ]
  }
};

/**
 * Get all available symbols organized by category
 * @returns {Array} Array of symbol categories
 */
export function getAllSymbolCategories() {
  return Object.values(symbolCategories);
}

/**
 * Search symbols by name or code
 * @param {string} query - Search query
 * @returns {Array} Matching symbols
 */
export function searchSymbols(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  Object.values(symbolCategories).forEach(symbolSet => {
    symbolSet.categories.forEach(category => {
      category.entities.forEach(entity => {
        if (
          entity.name.toLowerCase().includes(lowerQuery) ||
          entity.code.includes(query)
        ) {
          results.push({
            ...entity,
            category: category.name,
            symbolSet: symbolSet.name
          });
        }
      });
    });
  });
  
  return results;
}

/**
 * Unit size modifiers for echelon representation
 */
export const unitSizes = {
  team: { code: '11', name: 'Team/Crew', symbol: '●' },
  squad: { code: '12', name: 'Squad', symbol: '●●' },
  section: { code: '13', name: 'Section', symbol: '●●●' },
  platoon: { code: '14', name: 'Platoon/Detachment', symbol: '●●●' },
  company: { code: '15', name: 'Company/Battery/Troop', symbol: '|' },
  battalion: { code: '16', name: 'Battalion/Squadron', symbol: '||' },
  regiment: { code: '17', name: 'Regiment/Group', symbol: '|||' },
  brigade: { code: '18', name: 'Brigade', symbol: 'X' },
  division: { code: '19', name: 'Division', symbol: 'XX' },
  corps: { code: '20', name: 'Corps', symbol: 'XXX' },
  army: { code: '21', name: 'Army', symbol: 'XXXX' },
};

/**
 * Affiliation codes
 */
export const affiliations = {
  pending: { code: '0', name: 'Pending', color: '#FFFF80' },
  unknown: { code: '1', name: 'Unknown', color: '#FFFF00' },
  assumed_friend: { code: '2', name: 'Assumed Friend', color: '#80C0FF' },
  friend: { code: '3', name: 'Friend', color: '#00FF00' },
  neutral: { code: '4', name: 'Neutral', color: '#AAD476' },
  suspect: { code: '5', name: 'Suspect/Joker', color: '#FF8080' },
  hostile: { code: '6', name: 'Hostile/Faker', color: '#FF0000' },
};

/**
 * Status codes
 */
export const statuses = {
  present: { code: '0', name: 'Present' },
  planned: { code: '1', name: 'Planned/Anticipated/Suspect' },
  fully_capable: { code: '2', name: 'Present/Fully Capable' },
};

export default {
  generateSymbol,
  getAllSymbolCategories,
  searchSymbols,
  symbolCategories,
  unitSizes,
  affiliations,
  statuses
};
