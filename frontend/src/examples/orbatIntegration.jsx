/**
 * ORBAT Integration Example
 * 
 * Example of how to integrate ORBAT Manager with the main application,
 * MilitaryLayer, and TimelineControls.
 */

import React, { useState, useRef } from 'react';
import OrbatManager from './components/OrbatManager';
import TimelineControls from './components/TimelineControls';
import MilitaryLayer from './layers/MilitaryLayer';
import { OrbatTree } from './services/orbatModel';
import { hasTemporalData } from './services/temporalLayer';

/**
 * Example App Component with ORBAT Manager
 */
function AppWithOrbat() {
    const [showOrbatManager, setShowOrbatManager] = useState(false);
    const [currentOrbat, setCurrentOrbat] = useState(null);
    const [timelineVisible, setTimelineVisible] = useState(false);
    const [map, setMap] = useState(null);
    
    const militaryLayerRef = useRef(null);
    
    // Initialize military layer
    useEffect(() => {
        if (map) {
            militaryLayerRef.current = new MilitaryLayer({
                name: 'ORBAT Units',
                zIndex: 100
            });
            map.addLayer(militaryLayerRef.current.getLayer());
        }
    }, [map]);
    
    // Handle ORBAT deployment to map
    const handleDeployOrbat = (orbatTree) => {
        if (!militaryLayerRef.current) {
            alert('Map not initialized');
            return;
        }
        
        // Load ORBAT into military layer
        militaryLayerRef.current.loadOrbatTree(orbatTree, {
            showCommandLines: true
        });
        
        // Fit map to units
        militaryLayerRef.current.fitToUnits(map);
        
        // Store current ORBAT
        setCurrentOrbat(orbatTree);
        
        // Show timeline if ORBAT has temporal data
        if (orbatTree.metadata.startTime && orbatTree.metadata.endTime) {
            setTimelineVisible(true);
        }
        
        // Close ORBAT manager
        setShowOrbatManager(false);
        
        console.log('ORBAT deployed:', orbatTree.name);
    };
    
    // Handle timeline time change
    const handleTimeChange = (timestamp) => {
        if (militaryLayerRef.current && currentOrbat) {
            militaryLayerRef.current.updatePositionsAtTime(timestamp);
        }
    };
    
    // Toggle command lines
    const toggleCommandLines = () => {
        if (militaryLayerRef.current) {
            militaryLayerRef.current.toggleCommandLines();
        }
    };
    
    return (
        <div className="app">
            {/* Ribbon Toolbar */}
            <div className="ribbon-toolbar">
                <button onClick={() => setShowOrbatManager(true)}>
                    🎖️ ORBAT Manager
                </button>
                <button onClick={toggleCommandLines} disabled={!currentOrbat}>
                    🔗 Command Lines
                </button>
            </div>
            
            {/* Map Container */}
            <div id="map" ref={setMap}></div>
            
            {/* ORBAT Manager Panel */}
            {showOrbatManager && (
                <OrbatManager
                    onDeploy={handleDeployOrbat}
                    onClose={() => setShowOrbatManager(false)}
                    initialOrbat={currentOrbat}
                />
            )}
            
            {/* Timeline Controls */}
            <TimelineControls
                orbatTree={currentOrbat}
                visible={timelineVisible}
                onTimeChange={handleTimeChange}
                onPlay={() => console.log('Timeline playing')}
                onPause={() => console.log('Timeline paused')}
                onStop={() => console.log('Timeline stopped')}
            />
        </div>
    );
}

/**
 * Example: Loading ORBAT from JSON file
 */
async function loadOrbatFromFile(file) {
    try {
        const text = await file.text();
        const json = JSON.parse(text);
        const orbat = OrbatTree.fromJSON(json);
        
        console.log(`Loaded ORBAT: ${orbat.name}`);
        console.log(`Total units: ${orbat.getTotalUnits()}`);
        console.log(`Max depth: ${orbat.getMaxDepth()}`);
        
        // Validate
        const validation = orbat.validate();
        if (!validation.valid) {
            console.error('ORBAT validation errors:', validation.errors);
        }
        
        return orbat;
    } catch (err) {
        console.error('Failed to load ORBAT:', err);
        return null;
    }
}

/**
 * Example: Creating ORBAT programmatically
 */
function createCustomOrbat() {
    const { OrbatUnit, OrbatTree, NATOEchelons } = require('./services/orbatModel');
    const { Affiliations, UnitTypes } = require('./services/militarySymbols');
    
    // Create division
    const division = new OrbatUnit({
        name: '1st Swiss Division',
        level: NATOEchelons.DIVISION.level,
        echelon: NATOEchelons.DIVISION,
        affiliation: Affiliations.FRIEND,
        type: UnitTypes.INFANTRY,
        position: [8.5, 47.4]
    });
    
    // Create brigades
    for (let i = 1; i <= 3; i++) {
        const brigade = new OrbatUnit({
            name: `${i}${i===1?'st':i===2?'nd':'rd'} Brigade`,
            level: NATOEchelons.BRIGADE.level,
            echelon: NATOEchelons.BRIGADE,
            affiliation: Affiliations.FRIEND,
            type: i === 1 ? UnitTypes.INFANTRY : i === 2 ? UnitTypes.ARMOR : UnitTypes.ARTILLERY,
            position: [8.5 + (i-2) * 0.1, 47.4 + (i-2) * 0.05]
        });
        
        division.addChild(brigade);
        
        // Create battalions for each brigade
        for (let j = 1; j <= 3; j++) {
            const battalion = new OrbatUnit({
                name: `${j}/${i} Battalion`,
                level: NATOEchelons.BATTALION.level,
                echelon: NATOEchelons.BATTALION,
                affiliation: Affiliations.FRIEND,
                type: brigade.type,
                position: [
                    brigade.position[0] + (j-2) * 0.03,
                    brigade.position[1] + (j-2) * 0.02
                ]
            });
            
            brigade.addChild(battalion);
        }
    }
    
    // Create ORBAT tree
    const orbat = new OrbatTree({
        name: 'Swiss Army Exercise 2026',
        description: 'Large-scale training exercise',
        root: division
    });
    
    orbat.metadata.startTime = new Date('2026-03-15T08:00:00');
    orbat.metadata.endTime = new Date('2026-03-20T18:00:00');
    
    console.log(`Created ORBAT: ${orbat.getTotalUnits()} units, ${orbat.getMaxDepth()} levels`);
    
    return orbat;
}

/**
 * Example: Adding waypoints for unit movement
 */
function addMovementWaypoints(unit, waypoints) {
    waypoints.forEach(wp => {
        unit.addWaypoint(wp.timestamp, wp.position);
    });
    
    console.log(`Added ${waypoints.length} waypoints to ${unit.name}`);
}

/**
 * Example: Exporting ORBAT to different formats
 */
function exportOrbat(orbat, format = 'json') {
    switch (format) {
        case 'json':
            const json = orbat.toJSON();
            const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
            downloadBlob(blob, `${orbat.name}.json`);
            break;
            
        case 'orbat-mapper':
            const orbatMapperJson = orbat.exportOrbatMapper();
            const blob2 = new Blob([JSON.stringify(orbatMapperJson, null, 2)], { type: 'application/json' });
            downloadBlob(blob2, `${orbat.name}_orbat-mapper.json`);
            break;
            
        default:
            console.error('Unknown format:', format);
    }
}

/**
 * Helper: Download blob as file
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Example: Converting between flat and hierarchical formats
 */
function convertExample() {
    const { flatToHierarchy, hierarchyToFlat } = require('./services/orbatConverter');
    const { MilitaryUnit } = require('./services/militarySymbols');
    
    // Create flat units
    const flatUnits = [
        new MilitaryUnit({ name: 'Brigade HQ', position: [8.5, 47.4] }),
        new MilitaryUnit({ name: '1st Battalion', position: [8.48, 47.41] }),
        new MilitaryUnit({ name: '2nd Battalion', position: [8.52, 47.39] })
    ];
    
    // Convert to hierarchy
    const orbat = flatToHierarchy(flatUnits, {
        name: 'Auto-generated ORBAT'
    });
    
    console.log('Converted to hierarchy:', orbat.getTotalUnits(), 'units');
    
    // Convert back to flat
    const backToFlat = hierarchyToFlat(orbat);
    
    console.log('Converted back to flat:', backToFlat.length, 'units');
    
    return { orbat, flatUnits: backToFlat };
}

export {
    AppWithOrbat,
    loadOrbatFromFile,
    createCustomOrbat,
    addMovementWaypoints,
    exportOrbat,
    convertExample
};
