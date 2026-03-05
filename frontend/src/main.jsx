import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global Timezone Fix: 
// The FastAPI/SQLite backend returns naive datetimes (UTC missing the 'Z' suffix).
// It sometimes returns them with a 'T' and sometimes with a space (e.g., SQL format).
// This causes the browser to interpret them as local time, rendering them incorrectly.
// We intercept JSON.parse globally to append 'Z' and normalize spaces to 'T' so the 
// browser correctly converts them from UTC to the user's local timezone (e.g., Egypt Time).
const originalJsonParse = JSON.parse;
const naiveDateRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?$/;

JSON.parse = function (text, reviver) {
    return originalJsonParse(text, function (key, value) {
        if (typeof value === 'string' && naiveDateRegex.test(value)) {
            // It's a naive datetime string from our backend, normalize space to T and make it UTC-aware
            value = value.replace(' ', 'T') + 'Z';
        }
        return reviver ? reviver(key, value) : value;
    });
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
