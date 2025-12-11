
const API_URL = 'http://localhost:8000/scans';

const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const scansService = {
    scanUrl: async (url) => {
        const response = await fetch(`${API_URL}/url`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Scan failed' }));
            throw new Error(error.detail || 'Scan failed');
        }
        return response.json();
    },

    scanFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/file`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Scan failed' }));
            throw new Error(error.detail || 'Scan failed');
        }
        return response.json();
    },

    getAnalysis: async (id) => {
        const response = await fetch(`${API_URL}/analyses/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to get analysis');
        }
        return response.json();
    },

    saveScanResult: async (data) => {
        const response = await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Failed to save scan result');
        }
        return response.json();
    },

    getScanHistory: async (limit = 50) => {
        const response = await fetch(`${API_URL}/history?limit=${limit}`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch scan history');
        }
        return response.json();
    },

    getScanStats: async () => {
        const response = await fetch(`${API_URL}/stats`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch scan stats');
        }
        return response.json();
    }
};
