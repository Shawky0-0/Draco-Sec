
import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, Shield, Activity, Globe } from 'lucide-react';
import SeverityChart from './SeverityChart';
import TimelineChart from './TimelineChart';
import TopAttackersList from './TopAttackersList';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const DashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/monitor/stats`);
                setStats(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError("Failed to load dashboard statistics.");
                setLoading(false);
            }
        };

        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
                {error}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Critical Alerts</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.severity_counts.critical}</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <Shield size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">High Severity</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.severity_counts.high}</h3>
                        </div>
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Total Attacks (24h)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {stats.timeline.reduce((acc, curr) => acc + curr.count, 0)}
                            </h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Unique Attackers</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stats.top_attackers.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Globe size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Severity Distribution */}
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-xl">
                    <h4 className="text-lg font-semibold text-white mb-6">Severity Distribution</h4>
                    <div className="h-64 flex items-center justify-center">
                        <SeverityChart data={stats.severity_counts} />
                    </div>
                </div>

                {/* Alert Timeline */}
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-xl lg:col-span-2">
                    <h4 className="text-lg font-semibold text-white mb-6">Attack Activity (24h)</h4>
                    <div className="h-64 w-full">
                        <TimelineChart data={stats.timeline} />
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Attackers */}
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-xl">
                    <h4 className="text-lg font-semibold text-white mb-4">Top Attack Sources</h4>
                    <TopAttackersList data={stats.top_attackers} />
                </div>

                {/* MITRE / Protocols */}
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-xl">
                    <h4 className="text-lg font-semibold text-white mb-4">MITRE ATT&CK Techniques</h4>
                    <div className="space-y-4">
                        {stats.mitre_stats.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">{item.technique}</span>
                                    <span className="text-gray-500">{item.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500/50"
                                        style={{ width: `${(item.count / Math.max(...stats.mitre_stats.map(i => i.count))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;
