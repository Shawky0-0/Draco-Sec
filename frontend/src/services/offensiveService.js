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
    const response = await offensiveAPI.get('/methodologies');
    return response.data;
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
    listVulnerabilities,
    getVulnerability,
    createMethodology,
    listMethodologies,
    deleteMethodology,
    getAnalytics,
    connectToAgentFeed,
};
