import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield, ShieldAlert, FileSearch, Network, Users,
    Activity, ArrowUpRight, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import API_BASE_URL from "../../config/api";

export const OffensiveDashboard = () => (
    <div className="text-white">
        <h2 className="text-xl mb-4">Offensive Dashboard</h2>
        <p className="text-gray-400">Stats and Attack Surface overview will go here.</p>
    </div>
);

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a]/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="text-gray-400 text-xs mb-1 font-medium">{label}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} className="text-sm font-semibold flex items-center gap-2" style={{ color: entry.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Summary Card Component
const SummaryCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${colorClass.bg}`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                    {trend && (
                        <span className={`text-xs font-medium mb-1 flex items-center ${trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{subtext}</p>
            </div>
            <div className={`p-3 rounded-xl border ${colorClass.iconBg} ${colorClass.border}`}>
                <Icon size={20} className={colorClass.text} />
            </div>
        </div>
    </div>
);

export const DefensiveDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        monitor: null,
        scans: null,
        phishing: null
    });

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                const [monitorRes, scansRes, phishingRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/monitor/stats`),
                    axios.get(`${API_BASE_URL}/scans/stats`),
                    axios.get(`${API_BASE_URL}/phishing/stats`)
                ]);

                setStats({
                    monitor: monitorRes.data,
                    scans: scansRes.data,
                    phishing: phishingRes.data
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllStats();
    }, []);

    if (isLoading || !stats.monitor) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
            </div>
        );
    }

    const { monitor, scans, phishing } = stats;

    // Process Data for Charts
    const timelineData = monitor.timeline?.map(t => ({
        time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        alerts: t.count
    })) || [];

    const pieColors = ['#10b981', '#f43f5e'];
    const scanData = [
        { name: 'Clean', value: scans?.clean_scans || 0 },
        { name: 'Threats', value: scans?.threats_detected || 0 }
    ];

    const topAttackers = monitor.top_attackers?.slice(0, 5) || [];

    return (
        <div className="flex flex-col gap-6 h-full text-white overflow-y-auto pr-2 pb-6">

            {/* Header Area removed */}

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <SummaryCard
                    title="Critical Network Alerts"
                    value={monitor.severity_counts?.critical || 0}
                    subtext="High-priority Suricata detections"
                    icon={ShieldAlert}
                    colorClass={{ bg: 'bg-rose-500', iconBg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' }}
                />
                <SummaryCard
                    title="Active Blocked IPs"
                    value={monitor.severity_counts?.high || 0} // Placeholder for real active block drops
                    subtext="Automatically blocked via Firewall"
                    icon={Shield}
                    colorClass={{ bg: 'bg-emerald-500', iconBg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' }}
                />
                <SummaryCard
                    title="Total Scans Run"
                    value={scans?.total_scans || 0}
                    subtext="Files and URLs analyzed"
                    icon={FileSearch}
                    colorClass={{ bg: 'bg-blue-500', iconBg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' }}
                />
                <SummaryCard
                    title="Phishing Campaigns"
                    value={phishing?.total_campaigns || 0}
                    subtext="Active training / simulation ops"
                    icon={Users}
                    colorClass={{ bg: 'bg-indigo-500', iconBg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' }}
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Network Trends (Spans 2 columns) */}
                <div className="xl:col-span-2 bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" />
                            Network Threat Volume (24h)
                        </h3>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="time" stroke="#ffffff40" fontSize={11} tickMargin={10} axisLine={false} />
                                <YAxis stroke="#ffffff40" fontSize={11} axisLine={false} tickLine={false} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="alerts"
                                    name="Alerts"
                                    stroke="#34d399"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#34d399", stroke: "#000", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Scan Distribution */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                        <FileSearch size={16} className="text-blue-400" />
                        URL & File Scans
                    </h3>
                    <div className="flex-1 w-full min-h-[200px] relative">
                        {scanData.every(d => d.value === 0) ? (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No scan data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={scanData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {scanData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Center text overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold">{scans?.total_scans || 0}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
                        </div>
                    </div>
                    {/* Legend Custom */}
                    <div className="flex justify-center gap-4 mt-2">
                        {scanData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i] }}></span>
                                {d.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Alert Categories */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        <Network size={16} className="text-amber-400" />
                        Alert Categories
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Types of traffic Suricata flagged (not necessarily attacks)</p>
                    <div className="flex-1 min-h-[220px]">
                        {(monitor.mitre_stats?.length || 0) === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">No category data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monitor.mitre_stats?.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                                    <XAxis type="number" stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="technique" stroke="#ffffff40" fontSize={10} width={130} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Alerts" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Phishing Quick Stats */}
                <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2 mb-6">
                        <Users size={16} className="text-indigo-400" />
                        Phishing Campaign Engagement
                    </h3>

                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><Activity size={14} className="text-blue-400" /> Active Campaigns</span>
                                <span className="font-bold text-blue-400">{phishing?.active_campaigns || 0}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(((phishing?.active_campaigns || 0) / (phishing?.total_campaigns || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><ArrowUpRight size={14} /> Link Clicks</span>
                                <span className="font-bold text-orange-400">{phishing?.total_clicks || 0}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(((phishing?.total_clicks || 0) / (phishing?.total_emails_sent || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400 flex items-center gap-2"><AlertTriangle size={14} /> Credentials Compromised</span>
                                <span className="font-bold text-rose-400">{phishing?.total_compromised || 0}</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(((phishing?.total_compromised || 0) / (phishing?.total_emails_sent || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
