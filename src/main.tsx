import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAnalytics } from './lib/analytics';
import './styles.css';
initializeAnalytics();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
