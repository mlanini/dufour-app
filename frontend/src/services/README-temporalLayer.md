# Temporal Layer Service

Servizio per il rilevamento e la gestione di layer con dati temporali.

## Panoramica

Il servizio `temporalLayer.js` fornisce utilities per:
1. Rilevare layer con componente temporale
2. Estrarre intervalli temporali (startTime, endTime)
3. Filtrare feature per timestamp
4. Gestire lo stato della timeline tramite TimelineManager

## Funzioni Principali

### `hasTemporalData(layer)`

Verifica se un layer contiene dati temporali.

**Parametri:**
- `layer` (ol/layer/Layer) - Layer OpenLayers da verificare

**Returns:** `boolean`

**Criteri di Rilevamento:**
1. Properties del layer: `temporal: true`, `startTime`, `endTime`, `timestamp`
2. Tipo layer: `military` (sempre temporale)
3. Features con proprietà temporali: verifica prime 10 features per `timestamp`, `startTime`, `endTime`

**Esempio:**
```javascript
import { hasTemporalData } from './services/temporalLayer';

const militaryLayer = new MilitaryLayer({ name: 'Units' });
if (hasTemporalData(militaryLayer.getLayer())) {
  console.log('Layer has temporal data');
}
```

---

### `getTemporalExtent(layer)`

Estrae l'intervallo temporale di un layer.

**Parametri:**
- `layer` (ol/layer/Layer) - Layer da analizzare

**Returns:** `Object`
```javascript
{
  startTime: Date,    // Timestamp minimo
  endTime: Date,      // Timestamp massimo
  duration: Number    // Durata in millisecondi
}
```

**Comportamento:**
- Controlla properties del layer: `startTime`, `endTime`
- Se non presenti, scansiona tutte le features
- Considera `timestamp`, `startTime`, `endTime` per ogni feature
- Ritorna null se non trova dati temporali

**Esempio:**
```javascript
import { getTemporalExtent } from './services/temporalLayer';

const extent = getTemporalExtent(militaryLayer.getLayer());
if (extent) {
  console.log('Start:', extent.startTime);
  console.log('End:', extent.endTime);
  console.log('Duration (hours):', extent.duration / (1000 * 60 * 60));
}
```

---

### `filterByTime(layer, timestamp)`

Filtra le feature di un layer per visualizzare solo quelle attive al timestamp specificato.

**Parametri:**
- `layer` (ol/layer/Layer) - Layer da filtrare
- `timestamp` (Date) - Momento temporale di riferimento

**Comportamento:**
- Feature con `timestamp`: visibile se `timestamp <= time`
- Feature con `startTime` e `endTime`: visibile se `startTime <= time <= endTime`
- Feature senza dati temporali: sempre visibile
- Usa `setStyle(null)` per nascondere, `setStyle(undefined)` per mostrare

**Esempio:**
```javascript
import { filterByTime } from './services/temporalLayer';

// Show state at specific time
const timestamp = new Date('2026-03-15T10:00:00');
filterByTime(militaryLayer.getLayer(), timestamp);

// Timeline integration
<TimelineControls
  onTimeChange={(time) => filterByTime(activeLayer, time)}
/>
```

---

### `getTemporalLayers(map)`

Ottiene tutti i layer temporali da una mappa OpenLayers.

**Parametri:**
- `map` (ol/Map) - Mappa OpenLayers

**Returns:** `Array<ol/layer/Layer>`

**Esempio:**
```javascript
import { getTemporalLayers } from './services/temporalLayer';

const temporalLayers = getTemporalLayers(map);
console.log(`Found ${temporalLayers.length} temporal layers`);

temporalLayers.forEach(layer => {
  const extent = getTemporalExtent(layer);
  console.log(`${layer.get('name')}: ${extent.startTime} - ${extent.endTime}`);
});
```

---

### `createScenarioFromLayer(layer)`

Crea automaticamente uno scenario MilitaryScenario da un layer temporale.

**Parametri:**
- `layer` (ol/layer/Layer) - Layer con dati temporali

**Returns:** `MilitaryScenario | null`

**Comportamento:**
- Genera nome automatico: `Scenario_<timestamp>`
- Descrizione: "Auto-generated from <layerName>"
- startTime/endTime: estratti dal layer extent
- units: array vuoto (da popolare manualmente)

**Esempio:**
```javascript
import { createScenarioFromLayer } from './services/temporalLayer';
import { MilitaryScenario } from './militarySymbols';

// Auto-create scenario
const scenario = createScenarioFromLayer(militaryLayer.getLayer());
if (scenario) {
  // Add units from layer
  militaryLayer.units.forEach(unit => {
    scenario.addUnit(unit);
  });
  
  // Save to localStorage
  localStorage.setItem('scenario', JSON.stringify(scenario.toJSON()));
}
```

---

## TimelineManager Class

Singleton per la gestione centralizzata dello stato della timeline.

### Constructor

```javascript
const manager = new TimelineManager();
```

**Properties:**
- `activeLayer` - Layer attualmente attivo
- `currentTime` - Timestamp corrente
- `isPlaying` - Stato playback
- `callbacks` - Set di callback per aggiornamenti

### Methods

#### `activateLayer(layer)`

Attiva un layer per la timeline.

**Parametri:**
- `layer` (ol/layer/Layer) - Layer da attivare

**Returns:** `boolean` - true se layer ha dati temporali, false altrimenti

**Esempio:**
```javascript
import { timelineManager } from './services/temporalLayer';

if (timelineManager.activateLayer(militaryLayer.getLayer())) {
  console.log('Timeline activated for military layer');
  setTimelineVisible(true);
}
```

---

#### `deactivateLayer()`

Disattiva il layer corrente e ferma la timeline.

**Esempio:**
```javascript
timelineManager.deactivateLayer();
setTimelineVisible(false);
```

---

#### `setTime(timestamp)`

Imposta il timestamp corrente e filtra le features.

**Parametri:**
- `timestamp` (Date) - Nuovo timestamp

**Esempio:**
```javascript
const newTime = new Date('2026-03-15T14:30:00');
timelineManager.setTime(newTime);
```

---

#### `play(speed = 1)`

Avvia il playback della timeline.

**Parametri:**
- `speed` (Number) - Moltiplicatore velocità (default: 1)

**Comportamento:**
- Avanza `currentTime` ogni 100ms
- Incremento: 1 minuto reale × speed
- Ferma automaticamente al raggiungimento di endTime (se non in loop)

**Esempio:**
```javascript
// Normal speed
timelineManager.play();

// 2x speed
timelineManager.play(2);

// 0.5x speed (slow motion)
timelineManager.play(0.5);
```

---

#### `pause()`

Mette in pausa il playback senza resettare currentTime.

**Esempio:**
```javascript
timelineManager.pause();
```

---

#### `stop()`

Ferma il playback e resetta currentTime a startTime.

**Esempio:**
```javascript
timelineManager.stop();
```

---

#### `onTimeUpdate(callback)`

Registra un callback chiamato ad ogni aggiornamento di currentTime.

**Parametri:**
- `callback` (Function) - Funzione chiamata con `(timestamp)`

**Returns:** `Function` - Funzione per rimuovere il callback

**Esempio:**
```javascript
const removeCallback = timelineManager.onTimeUpdate((time) => {
  console.log('Time updated:', time);
  updateMapDisplay(time);
});

// Later: remove callback
removeCallback();
```

---

## Singleton Instance

Il modulo esporta un'istanza singleton `timelineManager` pronta all'uso.

```javascript
import { timelineManager } from './services/temporalLayer';

// Use directly
timelineManager.activateLayer(layer);
timelineManager.play(2);
```

---

## Integrazione con Componenti React

### TimelineControls con Conditional Rendering

```jsx
import React, { useState, useEffect } from 'react';
import TimelineControls from './components/TimelineControls';
import { timelineManager, hasTemporalData } from './services/temporalLayer';

function MapContainer() {
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);

  // Check temporal data when layer changes
  useEffect(() => {
    if (activeLayer) {
      const hasTemporal = hasTemporalData(activeLayer);
      setTimelineVisible(hasTemporal);
      
      if (hasTemporal) {
        timelineManager.activateLayer(activeLayer);
        
        // Create scenario from layer
        const scenario = createScenarioFromLayer(activeLayer);
        setCurrentScenario(scenario);
      } else {
        timelineManager.deactivateLayer();
        setCurrentScenario(null);
      }
    }
  }, [activeLayer]);

  return (
    <>
      <div id="map"></div>
      
      <TimelineControls
        scenario={currentScenario}
        visible={timelineVisible}
        onTimeChange={(time) => {
          timelineManager.setTime(time);
        }}
        onPlay={() => timelineManager.play()}
        onPause={() => timelineManager.pause()}
        onStop={() => timelineManager.stop()}
      />
    </>
  );
}
```

---

### Layer Switcher con Temporal Detection

```jsx
function LayerList({ layers, onLayerSelect }) {
  return (
    <div className="layer-list">
      {layers.map(layer => (
        <div
          key={layer.get('id')}
          className="layer-item"
          onClick={() => onLayerSelect(layer)}
        >
          <span>{layer.get('name')}</span>
          {hasTemporalData(layer) && (
            <span className="temporal-badge" title="Has temporal data">
              ⏱️
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### Auto-activate Timeline on Military Layer Creation

```jsx
function MilitaryPanel() {
  const dispatch = useDispatch();
  
  const handleCreateScenario = (scenario) => {
    // Create military layer
    const militaryLayer = new MilitaryLayer({
      name: scenario.name
    });
    
    // Load units
    scenario.units.forEach(unit => {
      militaryLayer.addUnit(unit);
    });
    
    // Add to map
    map.addLayer(militaryLayer.getLayer());
    
    // Auto-activate timeline
    if (timelineManager.activateLayer(militaryLayer.getLayer())) {
      dispatch(setTimelineVisible(true));
      dispatch(setActiveScenario(scenario));
    }
  };
  
  return <ScenarioManager onScenarioSelect={handleCreateScenario} />;
}
```

---

## Best Practices

### 1. Always Check Temporal Data Before Activation

```javascript
// ❌ BAD
timelineManager.activateLayer(layer);
setTimelineVisible(true);

// ✅ GOOD
if (timelineManager.activateLayer(layer)) {
  setTimelineVisible(true);
} else {
  console.warn('Layer has no temporal data');
}
```

### 2. Cleanup on Component Unmount

```javascript
useEffect(() => {
  const unsubscribe = timelineManager.onTimeUpdate(handleTimeUpdate);
  
  return () => {
    unsubscribe();
    timelineManager.deactivateLayer();
  };
}, []);
```

### 3. Performance: Cache Temporal Checks

```javascript
// ❌ BAD - checks on every render
{layers.map(layer => (
  <div>
    {hasTemporalData(layer) && <Icon />}
  </div>
))}

// ✅ GOOD - cache results
const temporalCache = useMemo(() => {
  return layers.reduce((acc, layer) => {
    acc[layer.get('id')] = hasTemporalData(layer);
    return acc;
  }, {});
}, [layers]);

{layers.map(layer => (
  <div>
    {temporalCache[layer.get('id')] && <Icon />}
  </div>
))}
```

### 4. Handle Multiple Temporal Layers

```javascript
function MultiLayerTimeline() {
  const [temporalLayers, setTemporalLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  
  useEffect(() => {
    const layers = getTemporalLayers(map);
    setTemporalLayers(layers);
    
    // Auto-activate first temporal layer
    if (layers.length > 0 && !activeLayerId) {
      timelineManager.activateLayer(layers[0]);
      setActiveLayerId(layers[0].get('id'));
    }
  }, [map]);
  
  return (
    <>
      <select
        value={activeLayerId}
        onChange={(e) => {
          const layer = temporalLayers.find(
            l => l.get('id') === e.target.value
          );
          timelineManager.activateLayer(layer);
          setActiveLayerId(e.target.value);
        }}
      >
        {temporalLayers.map(layer => (
          <option key={layer.get('id')} value={layer.get('id')}>
            {layer.get('name')}
          </option>
        ))}
      </select>
      
      <TimelineControls visible={!!activeLayerId} />
    </>
  );
}
```

---

## Troubleshooting

### Timeline non si attiva

**Problema:** `timelineManager.activateLayer()` ritorna `false`

**Soluzioni:**
1. Verificare che il layer abbia proprietà temporali:
   ```javascript
   layer.set('temporal', true);
   layer.set('startTime', new Date());
   layer.set('endTime', new Date());
   ```

2. Aggiungere proprietà temporali alle features:
   ```javascript
   feature.setProperties({
     timestamp: new Date(),
     // oppure
     startTime: new Date('2026-03-15T08:00:00'),
     endTime: new Date('2026-03-15T18:00:00')
   });
   ```

3. Usare layer type 'military' (sempre considerato temporale):
   ```javascript
   layer.set('type', 'military');
   ```

### Features non si filtrano

**Problema:** `filterByTime()` non nasconde features

**Soluzioni:**
1. Verificare formato date nelle features:
   ```javascript
   // ❌ BAD - string
   feature.set('timestamp', '2026-03-15');
   
   // ✅ GOOD - Date object
   feature.set('timestamp', new Date('2026-03-15T10:00:00'));
   ```

2. Controllare che il layer sia vettoriale:
   ```javascript
   const source = layer.getSource();
   if (source && source.getFeatures) {
     // OK - vector source
   }
   ```

### Playback non si ferma

**Problema:** Timeline continua oltre endTime

**Soluzione:** Implementare loop mode o auto-stop:
```javascript
timelineManager.onTimeUpdate((time) => {
  const extent = getTemporalExtent(layer);
  if (time >= extent.endTime) {
    if (!loopMode) {
      timelineManager.stop();
    } else {
      timelineManager.setTime(extent.startTime);
    }
  }
});
```

---

## Testing

### Unit Test Example

```javascript
import { hasTemporalData, getTemporalExtent, filterByTime } from './temporalLayer';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

describe('temporalLayer', () => {
  test('hasTemporalData detects temporal property', () => {
    const layer = new VectorLayer({
      source: new VectorSource(),
      properties: { temporal: true }
    });
    
    expect(hasTemporalData(layer)).toBe(true);
  });
  
  test('getTemporalExtent extracts time range', () => {
    const start = new Date('2026-03-15T08:00:00');
    const end = new Date('2026-03-15T18:00:00');
    
    const layer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Point([0, 0]),
            timestamp: start
          }),
          new Feature({
            geometry: new Point([1, 1]),
            timestamp: end
          })
        ]
      })
    });
    
    const extent = getTemporalExtent(layer);
    expect(extent.startTime).toEqual(start);
    expect(extent.endTime).toEqual(end);
  });
  
  test('filterByTime hides features outside time range', () => {
    const layer = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Point([0, 0]),
            timestamp: new Date('2026-03-15T10:00:00')
          }),
          new Feature({
            geometry: new Point([1, 1]),
            timestamp: new Date('2026-03-15T14:00:00')
          })
        ]
      })
    });
    
    filterByTime(layer, new Date('2026-03-15T12:00:00'));
    
    const features = layer.getSource().getFeatures();
    expect(features[0].getStyle()).toBeUndefined(); // visible
    expect(features[1].getStyle()).toBeNull(); // hidden
  });
});
```

---

## Changelog

### v1.0.0 (6 marzo 2026)
- ✅ Implementazione iniziale
- ✅ Rilevamento automatico layer temporali
- ✅ TimelineManager singleton
- ✅ Integrazione con TimelineControls
- ✅ Supporto layer militari
- ✅ Documentazione completa

---

**Author**: dufour.app Team  
**Last Updated**: 6 marzo 2026  
**Status**: ✅ Production Ready
