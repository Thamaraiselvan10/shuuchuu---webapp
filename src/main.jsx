import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDB } from './services/db.js'

// Initialize the browser-based SQLite database before rendering the app
initDB().then(() => {
    console.log('[Shuuchuu] Database initialized successfully');
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}).catch((err) => {
    console.error('[Shuuchuu] Failed to initialize database:', err);
    // Render the app anyway so the user sees something
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
});
