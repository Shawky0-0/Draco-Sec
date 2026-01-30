import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { listVulnerabilities } from '../../services/offensiveService';
import VulnerabilityDetailModal from './components/VulnerabilityDetailModal';

const BugsPage = () => {
    const [vulnerabilities, setVulnerabilities] = useState([]);
    const [filteredVulns, setFilteredVulns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [selectedVuln, setSelectedVuln] = useState(null);

    useEffect(() => {
        loadVulnerabilities();
    }, []);

    useEffect(() => {
        filterVulnerabilities();
    }, [searchTerm, severityFilter, vulnerabilities]);

    const loadVulnerabilities = async () => {
        try {
            const data = await listVulnerabilities();
            setVulnerabilities(data);
            setFilteredVulns(data);
        } catch (error) {
            console.error('Error loading vulnerabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterVulnerabilities = () => {
        let filtered = vulnerabilities;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (vuln) =>
                    vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vuln.vulnerability_type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Severity filter
        if (severityFilter !== 'all') {
            filtered = filtered.filter((vuln) => vuln.severity === severityFilter);
        }

        setFilteredVulns(filtered);
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
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                        <Bug size={32} className="text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white">Vulnerabilities</h1>
                        <p className="text-gray-400">
                            {filteredVulns.length} vulnerabilities discovered
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search vulnerabilities..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-700"
                        />
                    </div>

                    {/* Severity Filter */}
                    <div className="relative">
                        <Filter
                            size={20}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 bg-gray-800/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-gray-700 appearance-none cursor-pointer"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Vulnerabilities Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] rounded-lg border border-gray-800 overflow-hidden"
            >
                {filteredVulns.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bug size={48} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No vulnerabilities found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-800">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Severity
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Found
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {filteredVulns.map((vuln) => (
                                    <motion.tr
                                        key={vuln.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                        className="transition-colors cursor-pointer"
                                        onClick={() => setSelectedVuln(vuln)}
                                    >
                                        <td className="px-6 py-4">
                                            <SeverityBadge severity={vuln.severity} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={16} className="text-red-400" />
                                                <span className="text-white font-medium">{vuln.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-semibold">
                                                {vuln.vulnerability_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(vuln.found_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedVuln(vuln);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Vulnerability Detail Modal */}
            {selectedVuln && (
                <VulnerabilityDetailModal
                    vulnerability={selectedVuln}
                    onClose={() => setSelectedVuln(null)}
                />
            )}
        </div>
    );
};

// Severity Badge Component
const SeverityBadge = ({ severity }) => {
    const severityConfig = {
        critical: {
            bg: 'bg-red-500/20',
            text: 'text-red-400',
            border: 'border-red-500/50',
            label: 'CRITICAL',
        },
        high: {
            bg: 'bg-orange-500/20',
            text: 'text-orange-400',
            border: 'border-orange-500/50',
            label: 'HIGH',
        },
        medium: {
            bg: 'bg-yellow-500/20',
            text: 'text-yellow-400',
            border: 'border-yellow-500/50',
            label: 'MEDIUM',
        },
        low: {
            bg: 'bg-green-500/20',
            text: 'text-green-400',
            border: 'border-green-500/50',
            label: 'LOW',
        },
    };

    const config = severityConfig[severity] || severityConfig.low;

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}
        >
            {config.label}
        </span>
    );
};

export default BugsPage;
