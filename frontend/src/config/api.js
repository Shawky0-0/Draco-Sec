// Centralized API configuration
// Dynamically use the same hostname the browser is connected to, but point to port 8000
const defaultHost = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000';

const API_BASE_URL = import.meta.env.VITE_API_URL || defaultHost;

export default API_BASE_URL;
