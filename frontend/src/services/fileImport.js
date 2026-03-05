/**
 * File Import/Export Service
 * Supports: GPX, KML, GeoJSON
 */

import GeoJSON from 'ol/format/GeoJSON';
import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill, Circle as CircleStyle, Icon } from 'ol/style';

/**
 * Parse uploaded file based on extension
 * @param {File} file - File object
 * @returns {Promise<Object>} Parsed features and metadata
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const text = await file.text();

  let format;
  switch (extension) {
    case 'geojson':
    case 'json':
      format = new GeoJSON();
      break;
    case 'gpx':
      format = new GPX();
      break;
    case 'kml':
    case 'kmz':
      format = new KML({ extractStyles: true });
      break;
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }

  const features = format.readFeatures(text, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });

  return {
    features,
    format: extension,
    fileName: file.name,
    count: features.length
  };
}

/**
 * Create vector layer from parsed features
 * @param {Array} features - OpenLayers features
 * @param {Object} options - Layer options
 * @returns {VectorLayer} Vector layer
 */
export function createVectorLayer(features, options = {}) {
  const {
    name = 'Imported Layer',
    visible = true,
    style = getDefaultStyle()
  } = options;

  const source = new VectorSource({
    features: features
  });

  const layer = new VectorLayer({
    source: source,
    visible: visible,
    style: style
  });

  layer.set('name', name);
  layer.set('type', 'imported');

  return layer;
}

/**
 * Default style for imported features
 */
function getDefaultStyle() {
  return new Style({
    stroke: new Stroke({
      color: '#3498db',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(52, 152, 219, 0.2)'
    }),
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#3498db' }),
      stroke: new Stroke({ color: '#fff', width: 2 })
    })
  });
}

/**
 * Export features to GeoJSON
 * @param {Array} features - Features to export
 * @returns {string} GeoJSON string
 */
export function exportGeoJSON(features) {
  const format = new GeoJSON();
  const geojson = format.writeFeatures(features, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  });
  return geojson;
}

/**
 * Export features to KML
 * @param {Array} features - Features to export
 * @returns {string} KML string
 */
export function exportKML(features) {
  const format = new KML();
  const kml = format.writeFeatures(features, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  });
  return kml;
}

/**
 * Export features to GPX
 * @param {Array} features - Features to export
 * @returns {string} GPX string
 */
export function exportGPX(features) {
  const format = new GPX();
  const gpx = format.writeFeatures(features, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  });
  return gpx;
}

/**
 * Download file to user's computer
 * @param {string} content - File content
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, fileName, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  parseFile,
  createVectorLayer,
  exportGeoJSON,
  exportKML,
  exportGPX,
  downloadFile
};
