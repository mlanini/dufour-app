/**
 * Dufour-app QWC2 Application Entry Point
 * Military Web GIS based on QGIS Web Client 2
 */

import React from 'react';
import {createRoot} from 'react-dom/client';
import StandardApp from 'qwc2/components/StandardApp';
import appConfig from './appConfig';

const container = document.getElementById('container');
const root = createRoot(container);
root.render(<StandardApp appConfig={appConfig}/>);
