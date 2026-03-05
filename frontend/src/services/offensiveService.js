import axios from 'axios';
import API_BASE_URL from '../config/api';

const offensiveAPI = axios.create({
    baseURL: `${API_BASE_URL}/api/offensive`,
});

// Add auth token to requests
offensiveAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // Fixed: was 'access_token', should be 'token'
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on invalid/expired token
offensiveAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const detail = error.response?.data?.detail ?? '';
            // Only clear session for token-related errors, not "Scan not found" etc.
            if (detail.toLowerCase().includes('token') || detail.toLowerCase().includes('credential')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ===== Scan Management =====

export const createScan = async (scanData) => {
    const response = await offensiveAPI.post('/scans', scanData);
    return response.data;
};

export const listScans = async () => {
    const response = await offensiveAPI.get('/scans');
    return response.data;
};

export const getScan = async (scanId) => {
    const response = await offensiveAPI.get(`/scans/${scanId}`);
    return response.data;
};

export const stopScan = async (scanId) => {
    const response = await offensiveAPI.delete(`/scans/${scanId}`);
    return response.data;
};

export const finishScan = async (scanId) => {
    const response = await offensiveAPI.post(`/scans/${scanId}/finish`);
    return response.data;
};

export const getScanReport = async (scanId) => {
    const response = await offensiveAPI.get(`/scans/${scanId}/report`);
    return response.data;
};

// ===== Vulnerabilities =====

export const listVulnerabilities = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.scan_id) params.append('scan_id', filters.scan_id);
    if (filters.severity) params.append('severity', filters.severity);

    const response = await offensiveAPI.get(`/vulnerabilities?${params}`);
    return response.data;
};

export const getVulnerability = async (vulnId) => {
    const response = await offensiveAPI.get(`/vulnerabilities/${vulnId}`);
    return response.data;
};

// ===== Methodologies =====

export const createMethodology = async (methodologyData) => {
    const response = await offensiveAPI.post('/methodologies', methodologyData);
    return response.data;
};

export const listMethodologies = async () => {
    try {
        const response = await offensiveAPI.get('/methodologies');
        return response.data;
    } catch (err) {
        // Token expired/invalid — fall back to public defaults endpoint (no auth required)
        if (err.response?.status === 401 || err.response?.status === 403) {
            const response = await offensiveAPI.get('/methodologies/defaults');
            return response.data;
        }
        throw err;
    }
};

export const deleteMethodology = async (methodologyId) => {
    const response = await offensiveAPI.delete(`/methodologies/${methodologyId}`);
    return response.data;
};


// ===== Analytics =====

export const getAnalytics = async () => {
    const response = await offensiveAPI.get('/analytics');
    return response.data;
};

// ===== Agent Feed (SSE) =====

export const connectToAgentFeed = (scanId, onEvent, onComplete) => {
    const token = localStorage.getItem('token');

    // EventSource doesn't support headers, so we pass token in query param
    const eventSource = new EventSource(
        `${API_BASE_URL}/api/offensive/scans/${scanId}/feed?token=${token}`
    );

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'complete') {
                onComplete(data.status);
                eventSource.close();
            } else {
                onEvent(data);
            }
        } catch (error) {
            console.error('Error parsing SSE event:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
    };

    return eventSource;
};

export default {
    createScan,
    listScans,
    getScan,
    stopScan,
    finishScan,
    listVulnerabilities,
    getVulnerability,
    createMethodology,
    listMethodologies,
    deleteMethodology,
    getAnalytics,
    connectToAgentFeed,
};
