import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

export const AuthContext = createContext(null);

const API_URL = API_BASE_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Configure global axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    useEffect(() => {
        // On mount, check for token and user data
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const signup = async (data) => {
        // data: { username, password, email, first_name, last_name, license_key }
        await axios.post(`${API_URL}/auth/signup`, data);
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { username, password });
            const { access_token, user: userData } = response.data;

            setToken(access_token);

            // Map backend "tier" to frontend "plan" for consistency
            const mappedUser = {
                ...userData,
                plan: userData.tier
            };

            setUser(mappedUser);
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(mappedUser)); // Persist user data
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const activateLicense = async (username, licenseKey) => {
        const response = await axios.post(`${API_URL}/auth/activate-license`, {
            username,
            license_key: licenseKey
        });

        // Update local user state immediately for real-time UI reflection
        const { tier, scans, days_remaining } = response.data;
        setUser(prev => {
            const updated = {
                ...prev,
                plan: tier, // Ensure backend returns capitalized "Enterprise"/"Pro"
                scans_remaining: scans,
                days_remaining: days_remaining
            };
            localStorage.setItem('user', JSON.stringify(updated)); // Sync persistence
            return updated;
        });

        return response.data;
    };

    const updateProfile = async (data) => {
        const response = await axios.put(`${API_URL}/auth/me`, data);
        const updatedPartial = response.data.user;
        setUser(prev => {
            const updated = { ...prev, ...updatedPartial };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
        return response.data;
    };

    const changePassword = async (oldPassword, newPassword) => {
        const response = await axios.put(`${API_URL}/auth/password`, {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        signup,
        activateLicense,
        updateProfile,
        changePassword,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
