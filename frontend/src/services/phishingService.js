import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/phishing`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const phishingService = {
    // --- GET methods ---
    getStats: async () => {
        const response = await fetch(`${API_URL}/stats`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    getCampaigns: async () => {
        const response = await fetch(`${API_URL}/campaigns`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch campaigns');
        return response.json();
    },

    getCampaign: async (id) => {
        const response = await fetch(`${API_URL}/campaigns/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch campaign details');
        return response.json();
    },

    getGroups: async () => {
        const response = await fetch(`${API_URL}/groups`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch groups');
        return response.json();
    },

    getTemplates: async () => {
        const response = await fetch(`${API_URL}/templates`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch templates');
        return response.json();
    },

    getPages: async () => {
        const response = await fetch(`${API_URL}/pages`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch pages');
        return response.json();
    },

    getProfiles: async () => {
        const response = await fetch(`${API_URL}/profiles`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch profiles');
        return response.json();
    },

    // --- CREATE methods ---

    createCampaign: async (data) => {
        const response = await fetch(`${API_URL}/campaigns`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create campaign' }));
            throw new Error(errorData.detail || 'Failed to create campaign');
        }
        return response.json();
    },

    deleteCampaign: async (id) => {
        const response = await fetch(`${API_URL}/campaigns/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete campaign');
        return response.json();
    },

    completeCampaign: async (id) => {
        const response = await fetch(`${API_URL}/campaigns/${id}/complete`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to complete campaign');
        return response.json();
    },

    createGroup: async (data) => {
        const response = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create group' }));
            throw new Error(errorData.detail || 'Failed to create group');
        }
        return response.json();
    },

    deleteGroup: async (id) => {
        const response = await fetch(`${API_URL}/groups/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete group' }));
            throw new Error(errorData.detail || 'Failed to delete group');
        }
        return response.json();
    },

    modifyGroup: async (id, data) => {
        const response = await fetch(`${API_URL}/groups/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to modify group' }));
            throw new Error(errorData.detail || 'Failed to modify group');
        }
        return response.json();
    },

    deleteCampaign: async (id) => {
        const response = await fetch(`${API_URL}/campaigns/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete campaign' }));
            throw new Error(errorData.detail || 'Failed to delete campaign');
        }
        return response.json();
    },

    createTemplate: async (data) => {
        const response = await fetch(`${API_URL}/templates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create template' }));
            throw new Error(errorData.detail || 'Failed to create template');
        }
        return response.json();
    },

    modifyTemplate: async (id, data) => {
        const response = await fetch(`${API_URL}/templates/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to modify template' }));
            throw new Error(errorData.detail || 'Failed to modify template');
        }
        return response.json();
    },

    deleteTemplate: async (id) => {
        const response = await fetch(`${API_URL}/templates/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete template' }));
            throw new Error(errorData.detail || 'Failed to delete template');
        }
        return response.json();
    },

    createPage: async (data) => {
        const response = await fetch(`${API_URL}/pages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create page' }));
            throw new Error(errorData.detail || 'Failed to create page');
        }
        return response.json();
    },

    modifyPage: async (id, data) => {
        const response = await fetch(`${API_URL}/pages/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to modify page' }));
            throw new Error(errorData.detail || 'Failed to modify page');
        }
        return response.json();
    },

    deletePage: async (id) => {
        const response = await fetch(`${API_URL}/pages/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete page' }));
            throw new Error(errorData.detail || 'Failed to delete page');
        }
        return response.json();
    },

    createProfile: async (data) => {
        const response = await fetch(`${API_URL}/profiles`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create profile' }));
            throw new Error(errorData.detail || 'Failed to create profile');
        }
        return response.json();
    },

    modifyProfile: async (id, data) => {
        const response = await fetch(`${API_URL}/profiles/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to modify profile' }));
            throw new Error(errorData.detail || 'Failed to modify profile');
        }
        return response.json();
    },

    deleteProfile: async (id) => {
        const response = await fetch(`${API_URL}/profiles/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete profile' }));
            throw new Error(errorData.detail || 'Failed to delete profile');
        }
        return response.json();
    },

    // --- IMPORT methods ---
    importSite: async (url, includeResources = true) => {
        const response = await fetch(`${API_URL}/import/site`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ url, include_resources: includeResources })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to import site' }));
            throw new Error(errorData.detail || 'Failed to import site');
        }
        return response.json();
    },

    importEmail: async (content, convertLinks = true) => {
        const response = await fetch(`${API_URL}/import/email`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content, convert_links: convertLinks })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to import email' }));
            throw new Error(errorData.detail || 'Failed to import email');
        }
        return response.json();
    },

    sendTestEmail: async (data) => {
        const response = await fetch(`${API_URL}/util/send_test_email`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to send test email' }));
            throw new Error(errorData.detail || 'Failed to send test email');
        }
        return response.json();
    }
};
