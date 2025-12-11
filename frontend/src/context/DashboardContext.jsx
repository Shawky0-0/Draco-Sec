import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
    const location = useLocation();

    // Initialize based on URL or persistence
    const getInitialMode = () => {
        // Priority 1: URL truth
        if (location.pathname.startsWith('/defensive')) return 'defensive';
        if (location.pathname.startsWith('/offensive')) return 'offensive';

        // Priority 2: Saved preference (for neutral pages like /draco-ai)
        const saved = localStorage.getItem('draco_dashboard_mode');
        if (saved === 'defensive' || saved === 'offensive') return saved;

        // Default
        return 'offensive';
    };

    const [mode, setMode] = useState(getInitialMode);

    // Sync state with URL but respect persistence
    useEffect(() => {
        if (location.pathname.startsWith('/defensive')) {
            setMode('defensive');
            localStorage.setItem('draco_dashboard_mode', 'defensive');
        } else if (location.pathname.startsWith('/offensive')) {
            setMode('offensive');
            localStorage.setItem('draco_dashboard_mode', 'offensive');
        }
    }, [location.pathname]);

    const toggleMode = (newMode) => {
        if (newMode === 'offensive' || newMode === 'defensive') {
            setMode(newMode);
            localStorage.setItem('draco_dashboard_mode', newMode);
        }
    };

    return (
        <DashboardContext.Provider value={{ mode, toggleMode }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
