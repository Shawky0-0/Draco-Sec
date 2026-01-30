import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listScans } from '../../services/offensiveService';

const AgentFeedList = () => {
    const navigate = useNavigate();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScans();
    }, []);

    const loadScans = async () => {
        try {
            const data = await listScans();
            // Filter for running scans
            const activeScans = data.filter((scan) => scan.status === 'running');
            setScans(activeScans);
        } catch (error) {
            console.error('Error loading scans:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Activity size={32} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white">Active Scans</h1>
                        <p className="text-gray-400">
                            {scans.length} active penetration test{scans.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </motion.div>

            {scans.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-64 bg-[#0a0a0a] rounded-lg border border-gray-800"
                >
                    <Activity size={64} className="text-gray-600 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Active Scans</h2>
                    <p className="text-gray-400 mb-6">Start a new scan to monitor agent activity</p>
                    <button
                        onClick={() => navigate('/offensive/dashboard')}
                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold hover:shadow-lg  transition-all"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scans.map((scan) => (
                        <ScanCard key={scan.id} scan={scan} onView={() => navigate(`/offensive/agent-feed/${scan.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Scan Card Component
const ScanCard = ({ scan, onView }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-[#0a0a0a] rounded-lg p-6 border border-gray-800 cursor-pointer"
            onClick={onView}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                        RUNNING
                    </span>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{scan.target}</h3>
            <p className="text-sm text-gray-400 mb-4">{scan.methodology}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Vulnerabilities</p>
                    <p className="text-2xl font-bold text-red-400">{scan.vulnerabilities_found || 0}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Started</p>
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Clock size={14} />
                        {new Date(scan.started_at).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <button
                onClick={onView}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
                View Agent Feed
                <ArrowRight size={16} />
            </button>
        </motion.div>
    );
};

export default AgentFeedList;
