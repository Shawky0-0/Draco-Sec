import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Bug, Activity, TrendingUp, Plus } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from 'chart.js';
import { getAnalytics } from '../../services/offensiveService';
import StartScanPanel from './components/StartScanPanel';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const OffensiveDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStartPanel, setShowStartPanel] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const severityColors = {
        critical: '#dc2626',
        high: '#f59e0b',
        medium: '#eab308',
        low: '#22c55e',
    };

    const severityChartData = analytics
        ? {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [
                {
                    data: [
                        analytics.by_severity.critical,
                        analytics.by_severity.high,
                        analytics.by_severity.medium,
                        analytics.by_severity.low,
                    ],
                    backgroundColor: Object.values(severityColors),
                    borderWidth: 0,
                },
            ],
        }
        : null;

    const typeChartData = analytics
        ? {
            labels: Object.keys(analytics.by_type),
            datasets: [
                {
                    label: 'Vulnerabilities',
                    data: Object.values(analytics.by_type),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 8,
                },
            ],
        }
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Total Scans"
                    value={analytics?.total_scans || 0}
                    icon={<Shield size={20} />}
                    color="gray"
                />
                <StatsCard
                    title="Critical"
                    value={analytics?.by_severity.critical || 0}
                    icon={<Bug size={20} />}
                    color="red"
                />
                <StatsCard
                    title="High"
                    value={analytics?.by_severity.high || 0}
                    icon={<Activity size={20} />}
                    color="orange"
                />
                <StatsCard
                    title="Total Vulnerabilities"
                    value={analytics?.total_vulnerabilities || 0}
                    icon={<TrendingUp size={20} />}
                    color="blue"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Severity Distribution */}
                <div className="bg-[#0a0a0a] rounded-lg p-5 border border-gray-800">
                    <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">
                        Vulnerabilities by Severity
                    </h2>
                    <div className="h-64 flex items-center justify-center">
                        {severityChartData ? (
                            <Pie
                                data={severityChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: { color: '#9ca3af', font: { size: 11 } },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <p className="text-gray-600 text-sm">No data available</p>
                        )}
                    </div>
                </div>

                {/* Type Distribution */}
                <div className="bg-[#0a0a0a] rounded-lg p-5 border border-gray-800">
                    <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">
                        Vulnerabilities by Type
                    </h2>
                    <div className="h-64">
                        {typeChartData ? (
                            <Bar
                                data={typeChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: { color: '#1f1f1f' },
                                            ticks: { color: '#6b7280', font: { size: 10 } },
                                        },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: '#6b7280', font: { size: 10 } },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-600 text-sm">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-[#0a0a0a] rounded-lg p-5 border border-gray-800">
                <h2 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Recent Scans</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-800">
                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Target</th>
                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Vulnerabilities</th>
                                <th className="pb-3 text-xs font-medium uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics?.recent_scans?.map((scan) => (
                                <tr
                                    key={scan.id}
                                    className="border-b border-gray-900 hover:bg-gray-900/50 transition-colors"
                                >
                                    <td className="py-3 text-white text-sm">{scan.target}</td>
                                    <td className="py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${scan.status === 'completed'
                                                    ? 'bg-green-900/30 text-green-500'
                                                    : scan.status === 'running'
                                                        ? 'bg-blue-900/30 text-blue-500'
                                                        : 'bg-gray-800 text-gray-400'
                                                }`}
                                        >
                                            {scan.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-white text-sm">{scan.vulnerabilities_found}</td>
                                    <td className="py-3 text-gray-500 text-sm">
                                        {new Date(scan.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Start Scan Panel */}
            {showStartPanel && (
                <>
                    {console.log('Rendering StartScanPanel')}
                    <StartScanPanel
                        onClose={() => setShowStartPanel(false)}
                        onScanStarted={() => {
                            setShowStartPanel(false);
                            loadAnalytics();
                        }}
                    />
                </>
            )}
        </div>
    );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        gray: 'bg-[#0a0a0a] border-gray-800',
        red: 'bg-[#0a0a0a] border-red-900/30',
        orange: 'bg-[#0a0a0a] border-orange-900/30',
        blue: 'bg-[#0a0a0a] border-blue-900/30',
    };

    const iconColors = {
        gray: 'text-gray-500',
        red: 'text-red-500',
        orange: 'text-orange-500',
        blue: 'text-blue-500',
    };

    return (
        <div
            className={`${colorClasses[color]} border rounded-lg p-4`}
        >
            <div className="flex items-center justify-between">
                <div className={`${iconColors[color]}`}>{icon}</div>
                <span className="text-2xl font-bold text-white">{value}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">{title}</p>
        </div>
    );
};

export default OffensiveDashboard;
