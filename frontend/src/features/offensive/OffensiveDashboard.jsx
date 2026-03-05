import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Bug, Activity, TrendingUp, Plus, DollarSign } from 'lucide-react';
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
import { getAnalytics, listVulnerabilities } from '../../services/offensiveService';
import { Loader2 } from 'lucide-react';
import StartScanPanel from './components/StartScanPanel';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'last min';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'yesterday';
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
};

const OffensiveDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [recentVulns, setRecentVulns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStartPanel, setShowStartPanel] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [analyticsData, vulnsData] = await Promise.all([
                getAnalytics(),
                listVulnerabilities()
            ]);
            setAnalytics(analyticsData);
            setRecentVulns(vulnsData.slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard data:', error);
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

    const riskExposure =
        (analytics?.by_severity?.critical || 0) * 5000 +
        (analytics?.by_severity?.high || 0) * 2000 +
        (analytics?.by_severity?.medium || 0) * 500 +
        (analytics?.by_severity?.low || 0) * 100;

    const formattedRisk = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(riskExposure);

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

    const topTargetsData = analytics
        ? {
            labels: Object.keys(analytics.top_targets || {}),
            datasets: [
                {
                    label: 'Vulnerabilities',
                    data: Object.values(analytics.top_targets || {}),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                },
            ],
        }
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-gray-500" size={48} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full text-white overflow-y-auto pr-2 pb-6">
            {/* Header Area removed */}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                    title="Financial Risk"
                    value={formattedRisk}
                    subtext="Estimated bug bounty value"
                    icon={<DollarSign size={20} className="text-emerald-400" />}
                    colorClass={{ bg: 'bg-emerald-500', iconBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }}
                />
                <StatsCard
                    title="Critical Findings"
                    value={analytics?.by_severity.critical || 0}
                    subtext="Highest priority vulnerabilities"
                    icon={<Bug size={20} className="text-rose-400" />}
                    colorClass={{ bg: 'bg-rose-500', iconBg: 'bg-rose-500/10', border: 'border-rose-500/20' }}
                />
                <StatsCard
                    title="High Findings"
                    value={analytics?.by_severity.high || 0}
                    subtext="Major security vulnerabilities"
                    icon={<Activity size={20} className="text-orange-400" />}
                    colorClass={{ bg: 'bg-orange-500', iconBg: 'bg-orange-500/10', border: 'border-orange-500/20' }}
                />
                <StatsCard
                    title="Total Findings"
                    value={analytics?.total_vulnerabilities || 0}
                    subtext="Across all scanned targets"
                    icon={<TrendingUp size={20} className="text-blue-400" />}
                    colorClass={{ bg: 'bg-blue-500', iconBg: 'bg-blue-500/10', border: 'border-blue-500/20' }}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Severity Distribution */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Activity size={16} className="text-emerald-400" />
                        Vulnerabilities by Severity
                    </h3>
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

                {/* Latest Findings */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <Bug size={16} className="text-rose-400" />
                        Latest Findings
                    </h3>
                    <div className="flex flex-col gap-3">
                        {recentVulns.length > 0 ? (
                            recentVulns.map((vuln) => (
                                <div key={vuln.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex flex-col truncate pr-4">
                                        <span className="text-sm font-medium text-white truncate">{vuln.title}</span>
                                        <span className="text-xs text-gray-500 mt-1">{formatRelativeTime(vuln.found_at)}</span>
                                    </div>
                                    <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded ${vuln.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        vuln.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                            vuln.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}>
                                        {vuln.severity}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center p-8 text-gray-500 text-sm">
                                No recent vulnerabilities found
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                    Recent Scans
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/5">
                                <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider w-[40%] text-left">Target</th>
                                <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider w-[20%] text-center">Status</th>
                                <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider w-[20%] text-center">Vulnerabilities</th>
                                <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider w-[20%] text-center">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics?.recent_scans?.map((scan) => (
                                <tr
                                    key={scan.id}
                                    className="border-b border-gray-900 hover:bg-white/5 transition-colors"
                                >
                                    <td className="py-4 px-4 text-white text-sm text-left">{scan.target}</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${scan.status === 'completed'
                                                    ? 'bg-green-900/30 text-green-500 border-green-500/20'
                                                    : scan.status === 'running'
                                                        ? 'bg-blue-900/30 text-blue-500 border-blue-500/20'
                                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                                    }`}
                                            >
                                                {scan.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-white text-sm text-center">{scan.vulnerabilities_found}</td>
                                    <td className="py-4 px-4 text-gray-500 text-sm text-center">
                                        {formatRelativeTime(scan.created_at)}
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
const StatsCard = ({ title, value, subtext, icon, colorClass }) => (
    <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${colorClass.bg}`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl border ${colorClass.iconBg} ${colorClass.border}`}>
                {icon}
            </div>
        </div>
    </div>
);

export default OffensiveDashboard;
