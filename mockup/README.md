# dufour.app - HTML/JS Mockup

## 📋 Panoramica

Questo è un mockup HTML/JavaScript standalone di **dufour.app** che funziona direttamente nel browser senza bisogno di:
- ❌ Node.js
- ❌ npm install
- ❌ Build tools (Vite/Webpack)
- ❌ Docker
- ❌ Server locale

Tutto funziona con HTML, CSS e JavaScript puro, caricando OpenLayers da CDN.

## 🚀 Come Utilizzare

### Metodo 1: Doppio Click (Più Semplice)
1. Apri `\\adb.intra.admin.ch\Userhome$\SWISSTOPO-01\U80808033\Data\Documents\intelligeo-app\mockup\index.html`
2. Doppio click sul file → Si apre nel browser predefinito
3. Inizia a testare l'interfaccia!

### Metodo 2: Server HTTP Locale (Consigliato)
```powershell
# Dalla directory mockup
cd mockup

# Avvia un server HTTP semplice con Python
python -m http.server 8000

# Oppure con Node.js (se installato)
npx http-server -p 8000

# Apri nel browser
# http://localhost:8000
```

## ✨ Funzionalità del Mockup

### 🎨 Interfaccia Completa
- ✅ **Ribbon Toolbar** stile KADAS con 5 tab (Map, Draw, Measure, Analysis, Data)
- ✅ **30+ Strumenti** organizzati in gruppi funzionali
- ✅ **Side Panels** sinistro e destro con contenuti dinamici
- ✅ **Status Bar** con coordinate, scala, zoom
- ✅ **Design Responsivo** per desktop e tablet

### 🗺️ Mappa Interattiva
- ✅ **OpenLayers 9.1** integrato da CDN
- ✅ **SwissTopo WMTS** layer (Pixel Color)
- ✅ Centro sulla Svizzera con estensione appropriata
- ✅ Coordinate mouse in tempo reale (WGS84)
- ✅ Zoom e pan funzionanti

### 🌍 Multilingua (4 Lingue)
- ✅ English (US)
- ✅ Deutsch (CH)
- ✅ Français (FR)
- ✅ Italiano (IT)
- Cambio lingua dinamico tramite pannello Settings

### 🛠️ Strumenti Implementati (UI)

#### Tab: Map
- Zoom In/Out
- Home (extent iniziale)
- Locate (posizione utente)
- **Layers Panel** - gestione layer base e overlay
- **Search Panel** - ricerca luoghi
- Info tool

#### Tab: Draw
- Point, Line, Polygon, Circle, Rectangle
- Text annotation
- Marker placement
- **Redlining Panel** con opzioni stile

#### Tab: Measure
- Distance (linea)
- Area (poligono)
- Angle (tre punti)
- **Measurement Panel** con risultati

#### Tab: Analysis
- Terrain analysis (slope, elevation profile)
- Viewshed analysis
- **Terrain Panel** con parametri

#### Tab: Data
- Import (file upload, WMS)
- Export (KML, GeoJSON, GPX)
- Print (layout e opzioni)

## 📁 Struttura File

```
mockup/
├── index.html           # HTML principale con stili inline
├── mockup-app.js        # JavaScript applicazione
└── README.md           # Questa documentazione
```

## 🎯 Test Checklist

### Test Visivi
- [ ] Aprire index.html nel browser
- [ ] Verificare che la mappa SwissTopo si carichi correttamente
- [ ] Verificare ribbon toolbar con 5 tab visibili
- [ ] Hover sugli strumenti mostra effetti visivi

### Test Funzionali
- [ ] Click sui tab cambia il contenuto della ribbon
- [ ] Click su strumenti attiva lo stato "active"
- [ ] Strumenti aprono i panel corretti (left/right)
- [ ] Status bar mostra coordinate al movimento mouse
- [ ] Status bar mostra zoom e scala correnti
- [ ] Zoom in/out sulla mappa funziona (scroll wheel)
- [ ] Pan sulla mappa funziona (drag)

### Test Multilingua
- [ ] Aprire Settings panel
- [ ] Cambiare lingua in Deutsch → etichette cambiano
- [ ] Cambiare lingua in Français → etichette cambiano
- [ ] Cambiare lingua in Italiano → etichette cambiano
- [ ] Tornare a English → tutto funziona

### Test Responsività
- [ ] Ridimensionare finestra browser
- [ ] A <768px i panel diventano overlay
- [ ] Su mobile le etichette strumenti scompaiono
- [ ] Status bar si adatta

## 🔧 Personalizzazione

### Cambiare Centro Mappa
Nel file `mockup-app.js`, modifica:
```javascript
const swissCenter = ol.proj.fromLonLat([8.23, 46.80]); // [lon, lat]
```

### Cambiare Basemap
Sostituisci URL nella sezione `initMap()`:
```javascript
url: 'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg'
```

Basemap disponibili:
- `ch.swisstopo.pixelkarte-farbe` - Color (attuale)
- `ch.swisstopo.pixelkarte-grau` - Greyscale
- `ch.swisstopo.swissimage` - Aerial imagery

### Aggiungere Nuovi Strumenti
1. Aggiungi in `ribbonContent` object:
```javascript
{ id: 'my-tool', icon: '🔧', label: 'myTool', size: 'normal', panel: 'right' }
```

2. Aggiungi traduzione in `translations`:
```javascript
myTool: 'My Tool'
```

3. Aggiungi template in `panelTemplates`:
```javascript
'my-tool': { title: 'My Tool', content: '<p>Tool content...</p>' }
```

## 🎨 Personalizzazione Colori

Nel file `index.html`, sezione CSS `:root`:
```css
:root {
    --primary-color: #2c3e50;      /* Blu scuro navbar */
    --secondary-color: #3498db;    /* Blu bottoni */
    --accent-color: #e74c3c;       /* Rosso accenti */
    --success-color: #27ae60;      /* Verde successo */
    --warning-color: #f39c12;      /* Arancione warning */
}
```

## 🐛 Troubleshooting

### La mappa non si carica
- **Problema**: Firewall blocca cdn.jsdelivr.net o geo.admin.ch
- **Soluzione**: Verifica connessione internet, prova con VPN

### Gli strumenti non aprono i panel
- **Problema**: JavaScript disabilitato o errori console
- **Soluzione**: Apri DevTools (F12) → Console → verifica errori

### I font sono strani
- **Problema**: Browser non supporta system fonts
- **Soluzione**: Aggiungi Google Fonts nel `<head>`

### Status bar non mostra coordinate
- **Problema**: Mappa non inizializzata
- **Soluzione**: Verifica console errori, controlla che OpenLayers sia caricato

## 🚀 Prossimi Passi

Questo mockup dimostra l'**interfaccia utente** di dufour.app. Per funzionalità complete:

1. **Step 3**: Implementare la versione React/Vite completa
2. Connettere QGIS Server per WMS/WFS
3. Implementare tools di disegno con OpenLayers interactions
4. Aggiungere ORBAT Mapper per simboli militari
5. Implementare analisi terreno con dati Swiss elevazione

## 📝 Note

- Questo mockup usa **OpenLayers 9.1.0** da CDN
- La mappa usa **EPSG:3857** (Web Mercator)
- SwissTopo WMTS funziona senza API key
- Tutti gli strumenti sono placeholder UI - la logica va implementata
- Le misurazioni non sono funzionanti (solo UI)
- Import/Export sono simulati

## 📸 Screenshot Aspettati

- **Ribbon Toolbar**: 5 tab orizzontali con icone e etichette
- **Map View**: SwissTopo basemap centrata sulla Svizzera
- **Side Panels**: Collapsibili a sinistra/destra con contenuti dinamici
- **Status Bar**: Coordinate, scala, zoom in basso

## ✅ Vantaggi del Mockup

1. **Zero Setup** - Apri e basta
2. **Veloce Testing** - Feedback immediato UI/UX
3. **Condivisibile** - Invia cartella via email
4. **Cross-platform** - Funziona su Windows/Mac/Linux
5. **Debug Facile** - DevTools browser standard

## 🎓 Per Sviluppatori

Il mockup dimostra:
- Architettura ribbon toolbar (simile Microsoft Office)
- State management JavaScript puro (no Redux)
- Dynamic panel routing
- Multilingual support pattern
- OpenLayers integration base
- Responsive design patterns

Confronta questo mockup con l'implementazione React in `frontend/src/components/` per vedere le differenze architetturali.

---

**Enjoy testing! 🗺️**
