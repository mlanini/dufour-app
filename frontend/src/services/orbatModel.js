/**
 * ORBAT (Order of Battle) Data Model
 * 
 * Hierarchical military unit structure following NATO standards.
 * Extends the existing MilitaryUnit system with parent-child relationships.
 * 
 * @module orbatModel
 */

import { MilitaryUnit, Affiliations, UnitTypes } from './militarySymbols.js';

/**
 * NATO Echelon Hierarchy (Standard levels)
 * Level 0 (highest) → Level 10 (lowest)
 */
export const NATOEchelons = {
    ARMY_GROUP: { level: 0, code: 'ARMY_GROUP', name: 'Army Group', symbol: '🎖️🎖️🎖️', minSubordinates: 2, maxSubordinates: 5 },
    ARMY: { level: 1, code: 'ARMY', name: 'Army', symbol: '🎖️🎖️', minSubordinates: 2, maxSubordinates: 6 },
    CORPS: { level: 2, code: 'CORPS', name: 'Corps', symbol: '🎖️', minSubordinates: 2, maxSubordinates: 5 },
    DIVISION: { level: 3, code: 'DIVISION', name: 'Division', symbol: '✖️✖️✖️', minSubordinates: 2, maxSubordinates: 6 },
    BRIGADE: { level: 4, code: 'BRIGADE', name: 'Brigade', symbol: '✖️✖️', minSubordinates: 2, maxSubordinates: 8 },
    REGIMENT: { level: 5, code: 'REGIMENT', name: 'Regiment', symbol: '✖️', minSubordinates: 2, maxSubordinates: 6 },
    BATTALION: { level: 6, code: 'BATTALION', name: 'Battalion', symbol: '|||', minSubordinates: 3, maxSubordinates: 6 },
    COMPANY: { level: 7, code: 'COMPANY', name: 'Company', symbol: '||', minSubordinates: 3, maxSubordinates: 5 },
    PLATOON: { level: 8, code: 'PLATOON', name: 'Platoon', symbol: '|', minSubordinates: 2, maxSubordinates: 4 },
    SQUAD: { level: 9, code: 'SQUAD', name: 'Squad', symbol: '•', minSubordinates: 0, maxSubordinates: 3 },
    TEAM: { level: 10, code: 'TEAM', name: 'Team', symbol: '·', minSubordinates: 0, maxSubordinates: 0 }
};

/**
 * Get echelon by level number
 */
export function getEchelonByLevel(level) {
    return Object.values(NATOEchelons).find(e => e.level === level);
}

/**
 * Get echelon by code
 */
export function getEchelonByCode(code) {
    return NATOEchelons[code];
}

/**
 * Validate if echelon can have subordinate of given level
 */
export function canHaveSubordinate(parentLevel, childLevel) {
    // Child must be lower level (higher number)
    if (childLevel <= parentLevel) return false;
    
    // Typically subordinates are 1-2 levels down
    const levelDiff = childLevel - parentLevel;
    return levelDiff >= 1 && levelDiff <= 3;
}

/**
 * OrbatUnit - Military unit with hierarchical relationships
 * Extends MilitaryUnit with parent-child structure
 */
export class OrbatUnit extends MilitaryUnit {
    constructor(options = {}) {
        super(options);
        
        // Hierarchy properties
        this.parent = options.parent || null; // Reference to parent OrbatUnit
        this.children = options.children || []; // Array of child OrbatUnit
        this.level = options.level !== undefined ? options.level : 6; // Default to BATTALION
        this.echelon = options.echelon || getEchelonByLevel(this.level);
        
        // ORBAT specific
        this.commandPost = options.commandPost || null; // [lon, lat] of CP if different from unit position
        this.deploymentStatus = options.deploymentStatus || 'READY'; // READY, DEPLOYING, DEPLOYED, WITHDRAWING
        this.readiness = options.readiness || 100; // 0-100%
        this.strength = options.strength || 100; // 0-100% personnel strength
        
        // Waypoints for movement (timeline support)
        this.waypoints = options.waypoints || []; // [{timestamp: Date, position: [lon, lat]}]
        
        // Metadata
        this.created = options.created || new Date();
        this.modified = options.modified || new Date();
    }
    
    /**
     * Add a child unit to this unit
     */
    addChild(childUnit) {
        if (!(childUnit instanceof OrbatUnit)) {
            throw new Error('Child must be an OrbatUnit instance');
        }
        
        // Validate hierarchy
        if (!canHaveSubordinate(this.level, childUnit.level)) {
            console.warn(`Invalid hierarchy: ${this.echelon.name} cannot have ${childUnit.echelon.name} as subordinate`);
        }
        
        // Check max subordinates
        const maxSubs = this.echelon.maxSubordinates;
        if (maxSubs > 0 && this.children.length >= maxSubs) {
            console.warn(`${this.echelon.name} has reached max subordinates (${maxSubs})`);
        }
        
        // Remove from previous parent if exists
        if (childUnit.parent) {
            childUnit.parent.removeChild(childUnit);
        }
        
        // Add to this unit
        childUnit.parent = this;
        this.children.push(childUnit);
        this.modified = new Date();
        
        return this;
    }
    
    /**
     * Remove a child unit
     */
    removeChild(childUnit) {
        const index = this.children.indexOf(childUnit);
        if (index > -1) {
            this.children.splice(index, 1);
            childUnit.parent = null;
            this.modified = new Date();
        }
        return this;
    }
    
    /**
     * Move this unit to a new parent
     */
    moveTo(newParent) {
        if (newParent && !(newParent instanceof OrbatUnit)) {
            throw new Error('Parent must be an OrbatUnit instance');
        }
        
        // Check for circular reference
        if (newParent && this.isAncestorOf(newParent)) {
            throw new Error('Cannot move unit to its own descendant (circular reference)');
        }
        
        // Remove from current parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Add to new parent
        if (newParent) {
            newParent.addChild(this);
        } else {
            this.parent = null;
        }
        
        return this;
    }
    
    /**
     * Get all ancestor units (parent, grandparent, etc.)
     */
    getAncestors() {
        const ancestors = [];
        let current = this.parent;
        while (current) {
            ancestors.push(current);
            current = current.parent;
        }
        return ancestors;
    }
    
    /**
     * Get all descendant units (children, grandchildren, etc.)
     */
    getDescendants() {
        const descendants = [];
        const traverse = (unit) => {
            unit.children.forEach(child => {
                descendants.push(child);
                traverse(child);
            });
        };
        traverse(this);
        return descendants;
    }
    
    /**
     * Check if this unit is an ancestor of another unit
     */
    isAncestorOf(unit) {
        return unit.getAncestors().includes(this);
    }
    
    /**
     * Check if this unit is a descendant of another unit
     */
    isDescendantOf(unit) {
        return this.getAncestors().includes(unit);
    }
    
    /**
     * Get the root unit (top of hierarchy)
     */
    getRoot() {
        let root = this;
        while (root.parent) {
            root = root.parent;
        }
        return root;
    }
    
    /**
     * Get depth in hierarchy (0 = root)
     */
    getDepth() {
        return this.getAncestors().length;
    }
    
    /**
     * Get total number of subordinates (all descendants)
     */
    getTotalSubordinates() {
        return this.getDescendants().length;
    }
    
    /**
     * Get position at specific timestamp (for timeline)
     */
    getPositionAtTime(timestamp) {
        if (this.waypoints.length === 0) {
            return this.position;
        }
        
        // Find waypoints before and after timestamp
        const sorted = [...this.waypoints].sort((a, b) => a.timestamp - b.timestamp);
        
        // Before first waypoint
        if (timestamp <= sorted[0].timestamp) {
            return sorted[0].position;
        }
        
        // After last waypoint
        if (timestamp >= sorted[sorted.length - 1].timestamp) {
            return sorted[sorted.length - 1].position;
        }
        
        // Interpolate between waypoints
        for (let i = 0; i < sorted.length - 1; i++) {
            const wp1 = sorted[i];
            const wp2 = sorted[i + 1];
            
            if (timestamp >= wp1.timestamp && timestamp <= wp2.timestamp) {
                const totalDuration = wp2.timestamp - wp1.timestamp;
                const elapsed = timestamp - wp1.timestamp;
                const ratio = elapsed / totalDuration;
                
                return [
                    wp1.position[0] + (wp2.position[0] - wp1.position[0]) * ratio,
                    wp1.position[1] + (wp2.position[1] - wp1.position[1]) * ratio
                ];
            }
        }
        
        return this.position;
    }
    
    /**
     * Add waypoint for movement timeline
     */
    addWaypoint(timestamp, position) {
        this.waypoints.push({ timestamp: new Date(timestamp), position });
        this.waypoints.sort((a, b) => a.timestamp - b.timestamp);
        this.modified = new Date();
        return this;
    }
    
    /**
     * Export to JSON (orbat-mapper compatible)
     */
    toJSON() {
        return {
            ...super.toJSON(),
            level: this.level,
            echelon: this.echelon.code,
            children: this.children.map(child => child.toJSON()),
            commandPost: this.commandPost,
            deploymentStatus: this.deploymentStatus,
            readiness: this.readiness,
            strength: this.strength,
            waypoints: this.waypoints.map(wp => ({
                timestamp: wp.timestamp.toISOString(),
                position: wp.position
            })),
            created: this.created.toISOString(),
            modified: this.modified.toISOString()
        };
    }
    
    /**
     * Create OrbatUnit from JSON
     */
    static fromJSON(json) {
        const unit = new OrbatUnit({
            ...json,
            echelon: getEchelonByCode(json.echelon),
            waypoints: (json.waypoints || []).map(wp => ({
                timestamp: new Date(wp.timestamp),
                position: wp.position
            })),
            created: json.created ? new Date(json.created) : new Date(),
            modified: json.modified ? new Date(json.modified) : new Date(),
            children: [] // Children will be added recursively
        });
        
        // Recursively create children
        if (json.children && json.children.length > 0) {
            json.children.forEach(childJson => {
                const child = OrbatUnit.fromJSON(childJson);
                unit.addChild(child);
            });
        }
        
        return unit;
    }
}

/**
 * OrbatTree - Manages the entire ORBAT hierarchy
 */
export class OrbatTree {
    constructor(options = {}) {
        this.root = options.root || null; // Root OrbatUnit
        this.name = options.name || 'Unnamed ORBAT';
        this.description = options.description || '';
        this.created = options.created || new Date();
        this.modified = options.modified || new Date();
        
        // Metadata
        this.metadata = options.metadata || {
            scenario: null,
            startTime: null,
            endTime: null,
            author: null
        };
    }
    
    /**
     * Set the root unit
     */
    setRoot(unit) {
        if (unit && !(unit instanceof OrbatUnit)) {
            throw new Error('Root must be an OrbatUnit instance');
        }
        this.root = unit;
        this.modified = new Date();
        return this;
    }
    
    /**
     * Get all units in the tree (flat array)
     */
    getAllUnits() {
        if (!this.root) return [];
        return [this.root, ...this.root.getDescendants()];
    }
    
    /**
     * Find unit by ID
     */
    findUnitById(id) {
        return this.getAllUnits().find(unit => unit.id === id);
    }
    
    /**
     * Find units by name (partial match)
     */
    findUnitsByName(name) {
        const lowerName = name.toLowerCase();
        return this.getAllUnits().filter(unit => 
            unit.name.toLowerCase().includes(lowerName)
        );
    }
    
    /**
     * Get units by echelon level
     */
    getUnitsByLevel(level) {
        return this.getAllUnits().filter(unit => unit.level === level);
    }
    
    /**
     * Get units by affiliation
     */
    getUnitsByAffiliation(affiliation) {
        return this.getAllUnits().filter(unit => unit.affiliation === affiliation);
    }
    
    /**
     * Get maximum depth of the tree
     */
    getMaxDepth() {
        if (!this.root) return 0;
        const depths = this.getAllUnits().map(unit => unit.getDepth());
        return Math.max(...depths, 0);
    }
    
    /**
     * Get total unit count
     */
    getTotalUnits() {
        return this.getAllUnits().length;
    }
    
    /**
     * Validate tree structure
     */
    validate() {
        const errors = [];
        const units = this.getAllUnits();
        
        // Check for duplicate IDs
        const ids = units.map(u => u.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate unit IDs: ${duplicates.join(', ')}`);
        }
        
        // Check for circular references
        units.forEach(unit => {
            try {
                unit.getAncestors();
            } catch (e) {
                errors.push(`Circular reference detected for unit ${unit.id}`);
            }
        });
        
        // Check max depth
        if (this.getMaxDepth() > 10) {
            errors.push('Tree depth exceeds maximum (10 levels)');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Traverse tree with callback (Depth-First Search)
     */
    traverseDFS(callback, unit = this.root) {
        if (!unit) return;
        
        callback(unit);
        unit.children.forEach(child => this.traverseDFS(callback, child));
    }
    
    /**
     * Traverse tree with callback (Breadth-First Search)
     */
    traverseBFS(callback) {
        if (!this.root) return;
        
        const queue = [this.root];
        while (queue.length > 0) {
            const unit = queue.shift();
            callback(unit);
            queue.push(...unit.children);
        }
    }
    
    /**
     * Export to JSON
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            root: this.root ? this.root.toJSON() : null,
            metadata: {
                ...this.metadata,
                startTime: this.metadata.startTime ? this.metadata.startTime.toISOString() : null,
                endTime: this.metadata.endTime ? this.metadata.endTime.toISOString() : null
            },
            created: this.created.toISOString(),
            modified: this.modified.toISOString()
        };
    }
    
    /**
     * Create OrbatTree from JSON
     */
    static fromJSON(json) {
        const tree = new OrbatTree({
            name: json.name,
            description: json.description,
            root: json.root ? OrbatUnit.fromJSON(json.root) : null,
            metadata: {
                ...json.metadata,
                startTime: json.metadata.startTime ? new Date(json.metadata.startTime) : null,
                endTime: json.metadata.endTime ? new Date(json.metadata.endTime) : null
            },
            created: json.created ? new Date(json.created) : new Date(),
            modified: json.modified ? new Date(json.modified) : new Date()
        });
        
        return tree;
    }
    
    /**
     * Export to orbat-mapper format
     */
    exportOrbatMapper() {
        return {
            name: this.name,
            description: this.description,
            sides: [
                {
                    name: this.root ? this.root.name : 'Unknown',
                    units: this.root ? this.root.toJSON() : null
                }
            ]
        };
    }
}

/**
 * Create a sample ORBAT for testing
 */
export function createSampleOrbat() {
    // Create Brigade
    const brigade = new OrbatUnit({
        name: '1st Infantry Brigade',
        level: NATOEchelons.BRIGADE.level,
        echelon: NATOEchelons.BRIGADE,
        affiliation: Affiliations.FRIEND,
        type: UnitTypes.INFANTRY,
        position: [8.5, 47.4]
    });
    
    // Create Battalions
    const battalions = [
        new OrbatUnit({
            name: '1st Battalion',
            level: NATOEchelons.BATTALION.level,
            echelon: NATOEchelons.BATTALION,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.INFANTRY,
            position: [8.48, 47.41]
        }),
        new OrbatUnit({
            name: '2nd Battalion',
            level: NATOEchelons.BATTALION.level,
            echelon: NATOEchelons.BATTALION,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.ARMOR,
            position: [8.52, 47.39]
        }),
        new OrbatUnit({
            name: '3rd Battalion',
            level: NATOEchelons.BATTALION.level,
            echelon: NATOEchelons.BATTALION,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.ARTILLERY,
            position: [8.50, 47.38]
        })
    ];
    
    // Add battalions to brigade
    battalions.forEach(bn => brigade.addChild(bn));
    
    // Add companies to first battalion
    const companies = [
        new OrbatUnit({
            name: 'A Company',
            level: NATOEchelons.COMPANY.level,
            echelon: NATOEchelons.COMPANY,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.INFANTRY,
            position: [8.47, 47.42]
        }),
        new OrbatUnit({
            name: 'B Company',
            level: NATOEchelons.COMPANY.level,
            echelon: NATOEchelons.COMPANY,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.INFANTRY,
            position: [8.49, 47.40]
        }),
        new OrbatUnit({
            name: 'C Company',
            level: NATOEchelons.COMPANY.level,
            echelon: NATOEchelons.COMPANY,
            affiliation: Affiliations.FRIEND,
            type: UnitTypes.INFANTRY,
            position: [8.48, 47.39]
        })
    ];
    
    companies.forEach(co => battalions[0].addChild(co));
    
    // Create tree
    const tree = new OrbatTree({
        name: 'Exercise Alpha ORBAT',
        description: 'Training exercise - Swiss Army',
        root: brigade
    });
    
    tree.metadata.startTime = new Date('2026-03-15T08:00:00');
    tree.metadata.endTime = new Date('2026-03-17T18:00:00');
    
    return tree;
}
