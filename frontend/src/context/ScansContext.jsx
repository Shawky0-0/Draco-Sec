import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { scansService } from '../services/scansService';

const ScansContext = createContext();

export const useScans = () => {
    const context = useContext(ScansContext);
    if (!context) {
        throw new Error('useScans must be used within ScansProvider');
    }
    return context;
};

export const ScansProvider = ({ children }) => {
    const [activeScans, setActiveScans] = useState(() => {
        // Restore active scans from localStorage on mount
        const saved = localStorage.getItem('activeScans');
        return saved ? JSON.parse(saved) : [];
    });

    const [completedScans, setCompletedScans] = useState(() => {
        const saved = localStorage.getItem('completedScans');
        let parsed = saved ? JSON.parse(saved) : [];

        // Sanitize: Remove duplicates and ensure unique IDs
        const unique = [];
        const seenIds = new Set();

        parsed.forEach(scan => {
            // If old format ID (without timestamp), add random suffix
            if (!scan.id.includes('-17')) { // approximate timestamp check
                scan.id = `${scan.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            }

            if (!seenIds.has(scan.id)) {
                seenIds.add(scan.id);
                unique.push(scan);
            }
        });

        return unique;
    });

    // Persist to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('activeScans', JSON.stringify(activeScans));
    }, [activeScans]);

    useEffect(() => {
        localStorage.setItem('completedScans', JSON.stringify(completedScans));
    }, [completedScans]);

    const pollScan = useCallback(async (scanId) => {
        try {
            const data = await scansService.getAnalysis(scanId);
            const attributes = data.data.attributes;

            if (attributes.status === 'completed') {
                // Find original scan data from activeScans
                const activeScan = activeScans.find(s => s.id === scanId);

                // Save to backend database
                if (activeScan) {
                    try {
                        await scansService.saveScanResult({
                            analysis_id: scanId,
                            scan_type: activeScan.type,
                            target: activeScan.target,
                            target_hash: "", // Let backend compute if needed
                            result: attributes
                        });
                        console.log('[ScansContext] Saved result to DB');
                    } catch (e) {
                        console.error('[ScansContext] Failed to save DB result:', e);
                    }
                }

                // Move from active to completed
                setActiveScans(prev => prev.filter(s => s.id !== scanId));
                setCompletedScans(prev => {
                    const uniqueId = `${scanId}-${Date.now()}`;
                    return [{
                        id: uniqueId,
                        result: attributes,
                        completedAt: new Date().toISOString()
                    }, ...prev.slice(0, 9)];
                }); // Keep last 10
                return true; // Scan complete
            } else if (attributes.status === 'queued' || attributes.status === 'working') {
                return false; // Still processing
            } else {
                // Failed or unknown status
                setActiveScans(prev => prev.map(s =>
                    s.id === scanId ? { ...s, error: `Failed: ${attributes.status}` } : s
                ));
                return true; // Stop polling
            }
        } catch (err) {
            console.error('Polling error:', err);
            setActiveScans(prev => prev.map(s =>
                s.id === scanId ? { ...s, error: err.message } : s
            ));
            return true; // Stop polling on error
        }
    }, [activeScans]);

    // Background polling effect
    useEffect(() => {
        if (activeScans.length === 0) return;

        const interval = setInterval(async () => {
            for (const scan of activeScans) {
                if (!scan.error) {
                    await pollScan(scan.id);
                }
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [activeScans, pollScan]);

    const startScan = useCallback((id, type, target) => {
        const newScan = {
            id,
            type, // 'url' or 'file'
            target, // URL string or filename
            startedAt: new Date().toISOString()
        };
        console.log('[ScansContext] Starting scan:', newScan);
        setActiveScans(prev => {
            const updated = [newScan, ...prev];
            console.log('[ScansContext] Updated active scans:', updated);
            return updated;
        });
    }, []);

    const clearCompleted = useCallback(() => {
        setCompletedScans([]);
        localStorage.removeItem('completedScans');
    }, []);

    const removeScan = useCallback((scanId) => {
        setActiveScans(prev => prev.filter(s => s.id !== scanId));
        setCompletedScans(prev => prev.filter(s => s.id !== scanId));
    }, []);

    const addCompletedScan = useCallback((id, type, target, result) => {
        // Ensure unique ID by appending timestamp
        const uniqueId = `${id}-${Date.now()}`;
        const completedScan = {
            id: uniqueId,
            type,
            target,
            result,
            completedAt: new Date().toISOString()
        };
        setCompletedScans(prev => [completedScan, ...prev.slice(0, 9)]); // Keep last 10
    }, []);

    const value = {
        activeScans,
        completedScans,
        startScan,
        addCompletedScan,
        clearCompleted,
        removeScan,
        hasActiveScans: activeScans.length > 0
    };

    return (
        <ScansContext.Provider value={value}>
            {children}
        </ScansContext.Provider>
    );
};
