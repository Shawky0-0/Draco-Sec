import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Target, Calendar } from 'lucide-react';
import { listScans, listVulnerabilities } from '../../services/offensiveService';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
    const navigate = useNavigate();
    const [scans, setScans] = useState([]);
    const [selectedScan, setSelectedScan] = useState(null);
    const [scanVulnerabilities, setScanVulnerabilities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScans();
    }, []);

    const loadScans = async () => {
        try {
            const data = await listScans();
            setScans(data.filter((scan) => scan.status === 'completed'));
        } catch (error) {
            console.error('Error loading scans:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewScanDetails = async (scan) => {
        setSelectedScan(scan);
        try {
            const vulns = await listVulnerabilities({ scan_id: scan.id });
            setScanVulnerabilities(vulns);
        } catch (error) {
            console.error('Error loading vulnerabilities:', error);
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
            {!selectedScan ? (
                // Scans List View
                <>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gray-800 rounded-lg">
                                <FileText size={32} className="text-gray-400" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">Scan Reports</h1>
                                <p className="text-gray-400">{scans.length} completed scans</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] rounded-lg border border-gray-800 overflow-hidden"
                    >
                        {scans.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No completed scans yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-900/50 border-b border-gray-800">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Target
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Total Vulns
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Critical
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                High
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/50">
                                        {scans.map((scan) => (
                                            <motion.tr
                                                key={scan.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                                className="transition-colors cursor-pointer"
                                                onClick={() => viewScanDetails(scan)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={16} className="text-gray-400" />
                                                        <span className="text-white font-medium">{scan.target}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                                        Completed
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-bold">{scan.vulnerabilities_found}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-red-400 font-bold">{scan.critical_count}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-orange-400 font-bold">{scan.high_count}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 text-sm">
                                                    {new Date(scan.completed_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                viewScanDetails(scan);
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                                                        >
                                                            <Eye size={14} />
                                                            View
                                                        </button>
                                                        <button className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                                                            <Download size={14} />
                                                            Export
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </>
            ) : (
                // Scan Detail View
                <ScanDetailView
                    scan={selectedScan}
                    vulnerabilities={scanVulnerabilities}
                    onBack={() => setSelectedScan(null)}
                />
            )}
        </div>
    );
};

// Scan Detail View Component
const ScanDetailView = ({ scan, vulnerabilities, onBack }) => {
    return (
        <div>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <button
                    onClick={onBack}
                    className="mb-4 flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                    ← Back to Reports
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <Target size={32} className="text-gray-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white">{scan.target}</h1>
                        <p className="text-gray-400">
                            Scanned on {new Date(scan.completed_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                    label="Total Vulnerabilities"
                    value={scan.vulnerabilities_found}
                    color="gray"
                />
                <SummaryCard label="Critical" value={scan.critical_count} color="red" />
                <SummaryCard label="High" value={scan.high_count} color="orange" />
                <SummaryCard label="Medium" value={scan.medium_count} color="yellow" />
            </div>

            {/* Vulnerabilities List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] rounded-lg p-6 border border-gray-800"
            >
                <h2 className="text-2xl font-bold text-white mb-6">Discovered Vulnerabilities</h2>
                <div className="space-y-4">
                    {vulnerabilities.map((vuln) => (
                        <VulnCard key={vuln.id} vulnerability={vuln} />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// Summary Card
const SummaryCard = ({ label, value, color }) => {
    const colorClasses = {
        purple: 'from-gray-700 to-gray-800',
        red: 'from-red-600 to-red-700',
        orange: 'from-orange-600 to-orange-700',
        yellow: 'from-yellow-600 to-yellow-700',
    };

    return (
        <div
            className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-6 text-white`}
        >
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm opacity-90">{label}</p>
        </div>
    );
};

// Vulnerability Card
const VulnCard = ({ vulnerability }) => {
    const severityColors = {
        critical: 'border-red-500/50 bg-red-500/10',
        high: 'border-orange-500/50 bg-orange-500/10',
        medium: 'border-yellow-500/50 bg-yellow-500/10',
        low: 'border-green-500/50 bg-green-500/10',
    };

    return (
        <div className={`p-4 rounded-lg border-l-4 ${severityColors[vulnerability.severity]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{vulnerability.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{vulnerability.vulnerability_type}</span>
                        <span>•</span>
                        <span className="uppercase font-semibold">{vulnerability.severity}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
