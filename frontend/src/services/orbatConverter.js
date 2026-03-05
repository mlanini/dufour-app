/**
 * ORBAT Converter
 * 
 * Bidirectional conversion between flat MilitaryUnit arrays and hierarchical OrbatTree.
 * Maintains backward compatibility with existing MilitaryScenario format.
 * 
 * @module orbatConverter
 */

import { MilitaryUnit, MilitaryScenario } from './militarySymbols.js';
import { OrbatUnit, OrbatTree, NATOEchelons, getEchelonByLevel } from './orbatModel.js';

/**
 * Convert flat array of MilitaryUnits to OrbatTree
 * Uses heuristics to infer hierarchy if not explicitly defined
 */
export function flatToHierarchy(units, options = {}) {
    if (!units || units.length === 0) {
        return new OrbatTree({ name: options.name || 'Empty ORBAT' });
    }
    
    // Convert MilitaryUnit to OrbatUnit
    const orbatUnits = units.map(unit => {
        if (unit instanceof OrbatUnit) {
            return unit;
        }
        
        // Convert MilitaryUnit to OrbatUnit
        return new OrbatUnit({
            ...unit,
            id: unit.id,
            name: unit.name,
            affiliation: unit.affiliation,
            echelon: unit.echelon,
            type: unit.type,
            position: unit.position,
            // Try to infer level from echelon name
            level: inferLevelFromEchelon(unit.echelon)
        });
    });
    
    // Sort by level (highest first)
    orbatUnits.sort((a, b) => a.level - b.level);
    
    // Build hierarchy using proximity and level
    const root = orbatUnits[0]; // Highest level unit is root
    const remaining = orbatUnits.slice(1);
    
    // Assign children based on level difference and proximity
    remaining.forEach(unit => {
        const possibleParents = orbatUnits.filter(u => 
            u.level < unit.level && 
            (unit.level - u.level) <= 3 && // Max 3 levels difference
            !unit.isAncestorOf(u) // Prevent circular ref
        );
        
        if (possibleParents.length > 0) {
            // Find closest parent by geographic proximity
            const parent = findClosestUnit(unit, possibleParents);
            parent.addChild(unit);
        }
    });
    
    // Create tree
    const tree = new OrbatTree({
        name: options.name || `ORBAT - ${root.name}`,
        description: options.description || '',
        root: root
    });
    
    return tree;
}

/**
 * Convert OrbatTree to flat array of MilitaryUnits
 * Preserves all data for backward compatibility
 */
export function hierarchyToFlat(orbatTree) {
    if (!orbatTree || !orbatTree.root) {
        return [];
    }
    
    const flatUnits = [];
    
    // Traverse tree and collect all units
    orbatTree.traverseDFS(unit => {
        // Create MilitaryUnit with all OrbatUnit properties
        const flatUnit = new MilitaryUnit({
            id: unit.id,
            name: unit.name,
            affiliation: unit.affiliation,
            echelon: unit.echelon,
            status: unit.status,
            type: unit.type,
            position: unit.position,
            timestamp: unit.timestamp
        });
        
        // Store hierarchy metadata in properties for reconstruction
        flatUnit.orbatMetadata = {
            parentId: unit.parent ? unit.parent.id : null,
            level: unit.level,
            depth: unit.getDepth(),
            hasChildren: unit.children.length > 0,
            childrenIds: unit.children.map(c => c.id),
            commandPost: unit.commandPost,
            deploymentStatus: unit.deploymentStatus,
            readiness: unit.readiness,
            strength: unit.strength,
            waypoints: unit.waypoints
        };
        
        flatUnits.push(flatUnit);
    });
    
    return flatUnits;
}

/**
 * Convert MilitaryScenario to OrbatTree
 */
export function scenarioToOrbat(scenario) {
    if (!scenario || !scenario.units) {
        return new OrbatTree({ name: 'Empty ORBAT' });
    }
    
    const tree = flatToHierarchy(scenario.units, {
        name: scenario.name || 'Unnamed ORBAT',
        description: scenario.description || ''
    });
    
    tree.metadata.scenario = scenario.name;
    tree.metadata.startTime = scenario.startTime;
    tree.metadata.endTime = scenario.endTime;
    tree.metadata.author = scenario.author;
    
    return tree;
}

/**
 * Convert OrbatTree to MilitaryScenario
 */
export function orbatToScenario(orbatTree) {
    const units = hierarchyToFlat(orbatTree);
    
    const scenario = new MilitaryScenario({
        name: orbatTree.name,
        description: orbatTree.description,
        units: units,
        startTime: orbatTree.metadata.startTime,
        endTime: orbatTree.metadata.endTime
    });
    
    return scenario;
}

/**
 * Reconstruct OrbatTree from flat units with orbatMetadata
 */
export function reconstructHierarchy(flatUnits) {
    if (!flatUnits || flatUnits.length === 0) {
        return new OrbatTree({ name: 'Empty ORBAT' });
    }
    
    // Create OrbatUnits map
    const unitsMap = new Map();
    
    flatUnits.forEach(unit => {
        const orbatUnit = new OrbatUnit({
            ...unit,
            level: unit.orbatMetadata?.level || inferLevelFromEchelon(unit.echelon),
            commandPost: unit.orbatMetadata?.commandPost,
            deploymentStatus: unit.orbatMetadata?.deploymentStatus || 'READY',
            readiness: unit.orbatMetadata?.readiness || 100,
            strength: unit.orbatMetadata?.strength || 100,
            waypoints: unit.orbatMetadata?.waypoints || []
        });
        
        unitsMap.set(unit.id, orbatUnit);
    });
    
    // Rebuild parent-child relationships
    let root = null;
    
    flatUnits.forEach(unit => {
        const orbatUnit = unitsMap.get(unit.id);
        const parentId = unit.orbatMetadata?.parentId;
        
        if (parentId) {
            const parent = unitsMap.get(parentId);
            if (parent) {
                parent.addChild(orbatUnit);
            }
        } else {
            // This is root
            root = orbatUnit;
        }
    });
    
    // If no root found (shouldn't happen), use first unit
    if (!root) {
        root = Array.from(unitsMap.values())[0];
    }
    
    const tree = new OrbatTree({ root });
    return tree;
}

/**
 * Infer NATO echelon level from echelon object/name
 */
function inferLevelFromEchelon(echelon) {
    if (!echelon) return 6; // Default to BATTALION
    
    // If echelon has level property
    if (echelon.level !== undefined) {
        return echelon.level;
    }
    
    // Match by name/code
    const echelonName = (echelon.name || echelon.code || echelon).toUpperCase();
    
    const levelMap = {
        'ARMY_GROUP': 0,
        'ARMY': 1,
        'CORPS': 2,
        'DIVISION': 3,
        'BRIGADE': 4,
        'REGIMENT': 5,
        'BATTALION': 6,
        'COMPANY': 7,
        'PLATOON': 8,
        'SQUAD': 9,
        'TEAM': 10
    };
    
    for (const [key, level] of Object.entries(levelMap)) {
        if (echelonName.includes(key)) {
            return level;
        }
    }
    
    return 6; // Default to BATTALION
}

/**
 * Find closest unit by geographic distance
 */
function findClosestUnit(unit, candidates) {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    
    let closest = candidates[0];
    let minDistance = calculateDistance(unit.position, closest.position);
    
    candidates.slice(1).forEach(candidate => {
        const distance = calculateDistance(unit.position, candidate.position);
        if (distance < minDistance) {
            minDistance = distance;
            closest = candidate;
        }
    });
    
    return closest;
}

/**
 * Calculate distance between two positions [lon, lat]
 */
function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    
    const dx = pos2[0] - pos1[0];
    const dy = pos2[1] - pos1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Merge multiple OrbatTrees into one
 */
export function mergeOrbatTrees(trees, rootName = 'Combined ORBAT') {
    if (!trees || trees.length === 0) {
        return new OrbatTree({ name: rootName });
    }
    
    if (trees.length === 1) {
        return trees[0];
    }
    
    // Create new root
    const root = new OrbatUnit({
        name: rootName,
        level: NATOEchelons.ARMY_GROUP.level,
        echelon: NATOEchelons.ARMY_GROUP,
        position: trees[0].root?.position || [0, 0]
    });
    
    // Add all tree roots as children
    trees.forEach(tree => {
        if (tree.root) {
            root.addChild(tree.root);
        }
    });
    
    return new OrbatTree({
        name: rootName,
        root: root
    });
}

/**
 * Split OrbatTree by affiliation
 */
export function splitByAffiliation(orbatTree) {
    const trees = {};
    
    if (!orbatTree || !orbatTree.root) {
        return trees;
    }
    
    const unitsByAffiliation = {};
    
    orbatTree.traverseDFS(unit => {
        const aff = unit.affiliation;
        if (!unitsByAffiliation[aff]) {
            unitsByAffiliation[aff] = [];
        }
        unitsByAffiliation[aff].push(unit);
    });
    
    Object.entries(unitsByAffiliation).forEach(([affiliation, units]) => {
        trees[affiliation] = flatToHierarchy(units, {
            name: `${affiliation} Forces`
        });
    });
    
    return trees;
}

/**
 * Clone OrbatTree (deep copy)
 */
export function cloneOrbatTree(orbatTree) {
    if (!orbatTree) return null;
    
    const json = orbatTree.toJSON();
    return OrbatTree.fromJSON(json);
}

/**
 * Validate and repair OrbatTree
 */
export function repairOrbatTree(orbatTree) {
    if (!orbatTree || !orbatTree.root) {
        return orbatTree;
    }
    
    const validation = orbatTree.validate();
    
    if (validation.valid) {
        return orbatTree; // No repairs needed
    }
    
    console.warn('ORBAT validation errors found:', validation.errors);
    
    // Convert to flat and rebuild to fix structure
    const flatUnits = hierarchyToFlat(orbatTree);
    const repairedTree = flatToHierarchy(flatUnits, {
        name: orbatTree.name,
        description: orbatTree.description + ' (repaired)'
    });
    
    return repairedTree;
}
