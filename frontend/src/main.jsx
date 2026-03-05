import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import DufourApp from './components/DufourApp';
import store from './store/store';
import './styles/index.css';
import './styles/ribbon.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <DufourApp />
    </Provider>
  </React.StrictMode>
);
