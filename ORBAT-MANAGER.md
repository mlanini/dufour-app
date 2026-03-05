# ORBAT Manager Implementation

## Overview

The ORBAT (Order of Battle) Manager is a hierarchical military unit management system integrated into dufour.app. It provides a tree-based interface for creating, editing, and visualizing military force structures following NATO standards.

**Implementation Date**: 5 marzo 2026  
**Status**: ✅ Complete (All 3 steps)

---

## Features

### 1. Hierarchical Data Model (`orbatModel.js`)

**NATO Echelon Support** (11 levels):
- Level 0: Army Group (🎖️🎖️🎖️)
- Level 1: Army (🎖️🎖️)
- Level 2: Corps (🎖️)
- Level 3: Division (✖️✖️✖️)
- Level 4: Brigade (✖️✖️)
- Level 5: Regiment (✖️)
- Level 6: Battalion (|||)
- Level 7: Company (||)
- Level 8: Platoon (|)
- Level 9: Squad (•)
- Level 10: Team (·)

**OrbatUnit Class** (extends MilitaryUnit):
- Parent-child relationships
- Hierarchy traversal (ancestors, descendants)
- Position interpolation for timeline (waypoints)
- Deployment status tracking (READY, DEPLOYING, DEPLOYED, WITHDRAWING)
- Readiness & strength percentages
- Circular reference prevention

**OrbatTree Class**:
- Root unit management
- DFS/BFS traversal
- Validation (duplicates, circular refs, max depth)
- Unit search (by ID, name, level, affiliation)
- Import/Export JSON (orbat-mapper compatible)

### 2. Data Conversion (`orbatConverter.js`)

**Bidirectional Conversion**:
- `flatToHierarchy()` - Array of MilitaryUnit → OrbatTree
- `hierarchyToFlat()` - OrbatTree → Array of MilitaryUnit
- `scenarioToOrbat()` - MilitaryScenario → OrbatTree
- `orbatToScenario()` - OrbatTree → MilitaryScenario

**Features**:
- Backward compatibility with existing data
- Automatic hierarchy inference (proximity-based)
- Metadata preservation
- Validation & repair utilities

### 3. ORBAT Manager UI (`OrbatManager.jsx`)

**Panel Features**:
- Hierarchical tree view with expand/collapse
- Drag & drop unit reorganization
- Context menu (right-click):
  - Add Subordinate Unit
  - Edit Unit Details
  - Delete Unit (+ subtree)
  - Promote/Demote
  - Show on Map
- Integration with MilitarySymbolEditor
- Real-time statistics (total units, depth, selected unit)

**Toolbar Actions**:
- 📄 New - Create empty ORBAT
- 📋 Sample - Load demo ORBAT (1 Brigade → 3 Battalions → Companies)
- 📥 Import - Load JSON file
- 📤 Export - Save as JSON
- 🗺️ Deploy - Render on map with command lines
- 🗑️ Clear - Remove all units

**Visual Indicators**:
- Echelon icons (🎖️, |||, ||, |, •)
- Affiliation colors (Blue=Friend, Red=Hostile, Green=Neutral, Yellow=Unknown)
- Unit count badges (children count)
- Selection highlighting
- Drag preview

### 4. Map Integration (`MilitaryLayer.js`)

**New Methods**:
```javascript
// Load ORBAT tree
militaryLayer.loadOrbatTree(orbatTree, { showCommandLines: true });

// Render command lines (parent → child relationships)
militaryLayer.renderCommandLines();

// Toggle command lines visibility
militaryLayer.toggleCommandLines(true/false);

// Filter by echelon level
militaryLayer.filterByEchelon(4, 10); // Show Brigade to Team

// Highlight unit hierarchy
militaryLayer.highlightUnitHierarchy(unitId);

// Update positions at timestamp (timeline support)
militaryLayer.updatePositionsAtTime(new Date());
```

**Command Lines**:
- Dashed lines connecting parent → child units
- Color: rgba(52, 152, 219, 0.6) (semi-transparent blue)
- Z-index: Below symbols
- Dynamic update on unit movement

### 5. Timeline Integration (`TimelineControls.jsx`)

**ORBAT-Specific Features**:
- Display total units & hierarchy depth
- Echelon filter dropdown:
  - All (0-10)
  - Brigade+ (0-4)
  - Brigade- (4-10)
  - Battalion- (6-10)
  - Company- (7-10)
- Waypoint-based unit movement
- Synchronized position updates

**Props**:
```jsx
<TimelineControls
  orbatTree={orbatTree}           // OrbatTree instance
  visible={true}                  // Show/hide timeline
  onTimeChange={(time) => {...}}  // Timestamp callback
  onPlay={() => {...}}            // Play callback
  onPause={() => {...}}           // Pause callback
  onStop={() => {...}}            // Stop callback
  disabled={false}                // Enable/disable controls
/>
```

---

## Usage Examples

### Example 1: Load Sample ORBAT

```javascript
import { createSampleOrbat } from './services/orbatModel';
import OrbatManager from './components/OrbatManager';

const sampleOrbat = createSampleOrbat();
// Creates: 1 Brigade → 3 Battalions → 3 Companies

<OrbatManager
  initialOrbat={sampleOrbat}
  onDeploy={(orbat) => {
    militaryLayer.loadOrbatTree(orbat);
    map.getView().fit(militaryLayer.getExtent());
  }}
  onClose={() => setShowOrbat(false)}
/>
```

### Example 2: Create Custom ORBAT

```javascript
import { OrbatUnit, OrbatTree, NATOEchelons } from './services/orbatModel';
import { Affiliations, UnitTypes } from './services/militarySymbols';

// Create division
const division = new OrbatUnit({
  name: '1st Division',
  level: NATOEchelons.DIVISION.level,
  echelon: NATOEchelons.DIVISION,
  affiliation: Affiliations.FRIEND,
  type: UnitTypes.INFANTRY,
  position: [8.5, 47.4]
});

// Add brigade
const brigade = new OrbatUnit({
  name: '1st Brigade',
  level: NATOEchelons.BRIGADE.level,
  echelon: NATOEchelons.BRIGADE,
  affiliation: Affiliations.FRIEND,
  type: UnitTypes.INFANTRY,
  position: [8.48, 47.41]
});

division.addChild(brigade);

// Create tree
const orbat = new OrbatTree({
  name: 'Exercise Alpha',
  description: 'Training scenario',
  root: division
});

orbat.metadata.startTime = new Date('2026-03-15T08:00:00');
orbat.metadata.endTime = new Date('2026-03-17T18:00:00');
```

### Example 3: Add Movement Waypoints

```javascript
// Add waypoints for unit movement over time
battalion.addWaypoint(new Date('2026-03-15T08:00:00'), [8.48, 47.41]);
battalion.addWaypoint(new Date('2026-03-15T12:00:00'), [8.50, 47.43]);
battalion.addWaypoint(new Date('2026-03-15T18:00:00'), [8.52, 47.45]);

// Get position at specific time
const positionAtNoon = battalion.getPositionAtTime(new Date('2026-03-15T12:00:00'));
// Returns: [8.50, 47.43]

const positionAt10AM = battalion.getPositionAtTime(new Date('2026-03-15T10:00:00'));
// Returns: [8.49, 47.42] (interpolated)
```

### Example 4: Import/Export

```javascript
// Export to JSON
const json = orbat.toJSON();
const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
// Download blob...

// Import from JSON
const imported = OrbatTree.fromJSON(json);
console.log(`Loaded: ${imported.getTotalUnits()} units`);

// Export to orbat-mapper format
const orbatMapperJson = orbat.exportOrbatMapper();
```

### Example 5: Hierarchy Navigation

```javascript
// Find unit
const unit = orbat.findUnitById('unit-123');

// Get ancestors
const ancestors = unit.getAncestors(); // [parent, grandparent, ...]

// Get descendants
const descendants = unit.getDescendants(); // [children, grandchildren, ...]

// Get root
const root = unit.getRoot();

// Check relationships
if (unitA.isAncestorOf(unitB)) {
  console.log('A is ancestor of B');
}

// Get depth
const depth = unit.getDepth(); // 0 = root, 1 = direct child, etc.
```

### Example 6: Timeline with ORBAT

```javascript
import TimelineControls from './components/TimelineControls';

<TimelineControls
  orbatTree={currentOrbat}
  visible={true}
  onTimeChange={(timestamp) => {
    // Update unit positions
    militaryLayer.updatePositionsAtTime(timestamp);
  }}
  onPlay={() => console.log('Playing...')}
/>
```

---

## File Structure

```
frontend/src/
├── services/
│   ├── orbatModel.js           (470 lines) - Data model & hierarchy
│   └── orbatConverter.js       (380 lines) - Format conversion
├── components/
│   ├── OrbatManager.jsx        (480 lines) - Main UI component
│   └── TimelineControls.jsx    (310 lines) - Timeline with ORBAT support
├── layers/
│   └── MilitaryLayer.js        (+230 lines) - ORBAT rendering & command lines
├── styles/
│   └── orbat-manager.css       (450 lines) - ORBAT UI styles
└── examples/
    └── orbatIntegration.jsx    (250 lines) - Usage examples
```

**Total Lines of Code**: ~2,570 lines

---

## Technical Details

### Drag & Drop Implementation

Uses HTML5 Drag & Drop API:
- `draggable` attribute on tree nodes
- `onDragStart` - Store dragged unit
- `onDragOver` - Validate drop target
- `onDrop` - Move unit to new parent
- Prevents circular references

### Context Menu

Custom context menu with:
- Position: `position: fixed; left: ${x}px; top: ${y}px`
- Close on outside click via `document.addEventListener('click', ...)`
- Conditional button states (disabled when invalid action)

### Performance Optimizations

- **Tree Rendering**: Only render visible nodes (collapsed children not rendered)
- **Command Lines**: Separate layer (can be toggled on/off)
- **Re-render Optimization**: Use object spread to trigger React updates: `setOrbatTree({ ...orbatTree })`
- **Validation**: Lazy validation on demand (not every update)

### Responsive Design

**Breakpoints**:
- Desktop: 400px width panel
- Tablet: Auto width (10px margins)
- Mobile: Full width, stacked stats
- Touch: 48px min touch targets

---

## Integration with Existing System

### Backward Compatibility

✅ **MilitaryUnit** - Extended, not replaced  
✅ **MilitaryScenario** - Convertible to/from ORBAT  
✅ **MilitarySymbolEditor** - Reused for unit details  
✅ **TimelineControls** - Extended with ORBAT props (optional)  
✅ **localStorage** - Compatible JSON format  

### Data Flow

```
User Actions (OrbatManager)
    ↓
OrbatTree (in-memory)
    ↓
MilitaryLayer.loadOrbatTree()
    ↓
OpenLayers Features (rendered on map)
    ↓
TimelineControls.onTimeChange()
    ↓
MilitaryLayer.updatePositionsAtTime()
    ↓
Map updates (unit positions + command lines)
```

---

## Testing

### Manual Test Checklist

- [x] Create new ORBAT
- [x] Load sample ORBAT (1 Brigade → 3 Battalions → Companies)
- [x] Add subordinate unit
- [x] Edit unit details
- [x] Delete unit (with subtree)
- [x] Drag & drop unit to new parent
- [x] Promote/demote unit
- [x] Import JSON file
- [x] Export JSON file
- [x] Deploy to map
- [x] Show/hide command lines
- [x] Timeline playback with unit movement
- [x] Echelon filtering
- [x] Context menu operations
- [x] Mobile responsive

### Sample ORBAT Data

```json
{
  "name": "Exercise Alpha ORBAT",
  "description": "Training exercise - Swiss Army",
  "root": {
    "id": "brigade-1",
    "name": "1st Infantry Brigade",
    "level": 4,
    "echelon": "BRIGADE",
    "affiliation": "friend",
    "type": "infantry",
    "position": [8.5, 47.4],
    "children": [
      {
        "id": "battalion-1",
        "name": "1st Battalion",
        "level": 6,
        "echelon": "BATTALION",
        "children": [...]
      }
    ]
  },
  "metadata": {
    "startTime": "2026-03-15T08:00:00.000Z",
    "endTime": "2026-03-17T18:00:00.000Z"
  }
}
```

---

## Future Enhancements

### Potential Features (not implemented):

- [ ] Real-time collaboration (multi-user editing)
- [ ] Unit templates library (pre-defined force structures)
- [ ] Automated force laydown (distribute units on terrain)
- [ ] Combat power calculation (aggregate unit strengths)
- [ ] Logistics overlay (supply lines, depots)
- [ ] 3D visualization (Cesium integration)
- [ ] AI-assisted ORBAT generation
- [ ] Historical ORBAT database
- [ ] Unit status dashboard (readiness, strength, losses)
- [ ] Export to military planning tools (C2 systems)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` | Delete selected unit |
| `Ctrl+C` | Copy selected unit |
| `Ctrl+V` | Paste unit |
| `Ctrl+Z` | Undo last action |
| `Ctrl+S` | Save ORBAT |
| `Ctrl+E` | Export ORBAT |
| `Space` | Toggle expand/collapse |
| `Arrow Up/Down` | Navigate units |

*(To be implemented in future version)*

---

## Troubleshooting

### Issue: Units not appearing on map

**Solution**:
- Check ORBAT validation: `orbat.validate()`
- Ensure units have valid positions
- Check map projection (should be EPSG:3857)

### Issue: Command lines not showing

**Solution**:
- Call `militaryLayer.toggleCommandLines(true)`
- Check if `showCommandLines` option is enabled
- Ensure parent units have valid positions

### Issue: Timeline not updating positions

**Solution**:
- Add waypoints to units: `unit.addWaypoint(time, position)`
- Check timestamp range matches scenario times
- Verify `onTimeChange` callback is connected

### Issue: Drag & drop not working

**Solution**:
- Check browser console for errors
- Ensure `draggable` attribute is set
- Verify no circular reference (cannot drag to descendant)

---

## Credits

**ORBAT Mapper Reference**: https://github.com/orbat-mapper/orbat-mapper  
**Standards**: NATO APP-6D, MIL-STD-2525  
**Implementation**: dufour.app Team, marzo 2026

---

## License

Same as dufour.app main application (see LICENSE file).
