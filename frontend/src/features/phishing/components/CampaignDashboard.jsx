import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phishingService } from '../../../services/phishingService';
import {
    ArrowLeft, RefreshCw, Trash2, CheckSquare, Download,
    Send, MousePointer, Activity, AlertTriangle,
    ChevronDown, ChevronUp, Rocket, Smartphone, Globe
} from 'lucide-react';

// StatCard Component (same as PhishingDashboard)
const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10 flex flex-col gap-4">
            <div className={`p-3 rounded-lg w-max ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('text-', '')} />
            </div>
            <div>
                <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
            </div>
        </div>
    </div>
);

// Helper to get icon and color for timeline event
const getEventStyle = (message) => {
    switch (message) {
        case 'Campaign Created': return { icon: Rocket, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        case 'Email Sent': return { icon: Send, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        case 'Email Opened': return { icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
        case 'Clicked Link': return { icon: MousePointer, color: 'text-orange-500', bg: 'bg-orange-500/10' };
        case 'Submitted Data': return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' };
        default: return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
};

export const CampaignDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [expandedTimelineEvents, setExpandedTimelineEvents] = useState({});

    const loadCampaign = async () => {
        setLoading(true);
        try {
            const data = await phishingService.getCampaign(id);
            setCampaign(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load campaign details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) loadCampaign();
    }, [id]);

    const toggleRow = (idx) => {
        setExpandedRow(expandedRow === idx ? null : idx);
    };

    const toggleTimelineEvent = (eventKey) => {
        setExpandedTimelineEvents(prev => ({
            ...prev,
            [eventKey]: !prev[eventKey]
        }));
    };

    const getTimelineForEmail = (email) => {
        if (!campaign?.timeline) return [];
        return campaign.timeline.filter(e => e.email === email || e.message === 'Campaign Created');
    };

    if (loading) return <div className="text-white animate-pulse p-8">Loading campaign details...</div>;
    if (error) return <div className="text-red-400 p-8">{error}</div>;
    if (!campaign) return null;

    const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0, submitted: 0, error: 0 };

    return (
        <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto relative">

            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-3xl font-bold text-white">Results for {campaign.name}</h2>
                        </div>
                        <p className="text-gray-400">Campaign ID: {campaign.id} • Created {new Date(campaign.created_date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 p-2 rounded-xl w-max">
                    <button onClick={loadCampaign} className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg text-blue-400 transition-colors">
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Metric Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Email Sent"
                    value={stats.sent}
                    icon={Send}
                    color="text-emerald-400"
                    subtext="Successfully delivered"
                />
                <StatCard
                    title="Email Opened"
                    value={stats.opened}
                    icon={Activity}
                    color="text-yellow-400"
                    subtext="Recipients engaged"
                />
                <StatCard
                    title="Clicked Link"
                    value={stats.clicked}
                    icon={MousePointer}
                    color="text-amber-400"
                    subtext="Link clicks recorded"
                />
                <StatCard
                    title="Submitted Data"
                    value={stats.submitted}
                    icon={AlertTriangle}
                    color="text-red-400"
                    subtext="Credentials submitted"
                />
            </div>

            {/* Results Table */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-semibold text-white">Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
                            <tr>
                                <th className="px-6 py-4 w-10"></th>
                                <th className="px-6 py-4">Result ID</th>
                                <th className="px-6 py-4">First Name</th>
                                <th className="px-6 py-4">Last Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(campaign.results || []).length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 italic">No events recorded.</td></tr>
                            ) : (
                                (campaign.results || []).map((result, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr
                                            className={`hover:bg-white/5 transition-colors cursor-pointer ${expandedRow === idx ? 'bg-white/5' : ''}`}
                                            onClick={() => toggleRow(idx)}
                                        >
                                            <td className="px-6 py-4 text-center">
                                                {expandedRow === idx ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{result.id?.substring(0, 8) || '-'}</td>
                                            <td className="px-6 py-4">{result.first_name || '-'}</td>
                                            <td className="px-6 py-4">{result.last_name || '-'}</td>
                                            <td className="px-6 py-4 text-white">{result.email}</td>
                                            <td className="px-6 py-4">{result.position || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${['Submitted Data', 'Clicked Link'].includes(result.status) ? 'bg-red-500/10 text-red-500' :
                                                        result.status === 'Email Opened' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-emerald-500/10 text-emerald-500'}
                                                `}>{result.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">{new Date(result.modified_date).toLocaleString()}</td>
                                        </tr>
                                        {expandedRow === idx && (
                                            <tr>
                                                <td colSpan="8" className="bg-[#111111] px-6 py-6 border-b border-white/5">
                                                    <div className="flex flex-col gap-6 ml-10">
                                                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-white">Timeline for {result.first_name} {result.last_name}</h4>
                                                                <p className="text-gray-500 text-sm mt-1">Email: {result.email} • Result ID: {result.id}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`px-3 py-1 rounded text-sm font-bold text-white
                                                                    ${['Submitted Data', 'Clicked Link'].includes(result.status) ? 'bg-orange-500' :
                                                                        result.status === 'Email Opened' ? 'bg-yellow-500' :
                                                                            'bg-emerald-500'}
                                                                `}>{result.status}</span>
                                                            </div>
                                                        </div>

                                                        {/* Timeline List */}
                                                        <div className="relative pl-4 space-y-8 before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:-translate-x-px before:bg-white/10 before:content-['']">
                                                            {getTimelineForEmail(result.email).map((event, i) => {
                                                                const style = getEventStyle(event.message);
                                                                const EventIcon = style.icon;
                                                                const eventKey = `${idx}-${i}`;
                                                                const isExpanded = expandedTimelineEvents[eventKey] || false;

                                                                return (
                                                                    <div key={i} className="relative flex gap-6 items-start group">
                                                                        <div className={`absolute left-0 h-8 w-8 rounded-full ${style.bg} flex items-center justify-center ring-4 ring-[#111111] transition-colors`}>
                                                                            <EventIcon size={16} className={style.color} />
                                                                        </div>
                                                                        <div className="flex-1 ml-10 pt-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-sm font-bold text-white">{event.message}</p>
                                                                                <span className="text-xs text-gray-500 italic">{new Date(event.time).toLocaleString()}</span>
                                                                            </div>
                                                                            {/* Browser/OS Details */}
                                                                            {event.details && event.details !== 'null' && (
                                                                                <div className="mt-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5 w-max">
                                                                                    {(() => {
                                                                                        try {
                                                                                            const detailObj = typeof event.details === 'string' ? JSON.parse(event.details) : event.details;

                                                                                            // GoPhish stores browser as {address, user-agent}
                                                                                            const browser = detailObj.browser;
                                                                                            const payload = detailObj.payload || detailObj;
                                                                                            const userAgent = browser && browser['user-agent'];

                                                                                            if (userAgent || payload.os) return (
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    {payload.os && <div className="flex items-center gap-2"><Smartphone size={12} /> {payload.os}</div>}
                                                                                                    {userAgent && <div className="flex items-center gap-2"><Globe size={12} /> {userAgent}</div>}
                                                                                                </div>
                                                                                            );
                                                                                            return JSON.stringify(detailObj);
                                                                                        } catch (e) {
                                                                                            return event.details;
                                                                                        }
                                                                                    })()}
                                                                                </div>
                                                                            )}

                                                                            {/* View Details for Submitted Data */}
                                                                            {event.message === 'Submitted Data' && (
                                                                                <div className="mt-3">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleTimelineEvent(eventKey);
                                                                                        }}
                                                                                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                                                    >
                                                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                                        View Details
                                                                                    </button>

                                                                                    {isExpanded && (() => {
                                                                                        // Parse submitted data from event details
                                                                                        let submittedData = null;
                                                                                        try {
                                                                                            const detailObj = typeof event.details === 'string' ? JSON.parse(event.details) : event.details;
                                                                                            submittedData = detailObj?.payload || result.submitted_data;
                                                                                        } catch (e) {
                                                                                            submittedData = result.submitted_data;
                                                                                        }

                                                                                        if (!submittedData) return <div className="mt-2 text-xs text-gray-500">No data available</div>;

                                                                                        return (
                                                                                            <div className="mt-3 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                                                                                <table className="w-full text-xs">
                                                                                                    <thead className="bg-white/5">
                                                                                                        <tr>
                                                                                                            <th className="px-3 py-2 text-left text-gray-400 font-medium">Parameter</th>
                                                                                                            <th className="px-3 py-2 text-left text-gray-400 font-medium">Value(s)</th>
                                                                                                        </tr>
                                                                                                    </thead>
                                                                                                    <tbody>
                                                                                                        {Array.isArray(submittedData) ? submittedData.map((item, idx) => (
                                                                                                            <tr key={idx} className="border-t border-white/5">
                                                                                                                <td className="px-3 py-2 text-gray-300 font-mono">{item.name || Object.keys(item)[0]}</td>
                                                                                                                <td className="px-3 py-2 text-white font-mono">{item.value || Object.values(item)[0]}</td>
                                                                                                            </tr>
                                                                                                        )) : Object.entries(submittedData).filter(([key]) => !['browser', 'os', 'rid'].includes(key)).map(([key, value], idx) => (
                                                                                                            <tr key={idx} className="border-t border-white/5">
                                                                                                                <td className="px-3 py-2 text-gray-300 font-mono">{key}</td>
                                                                                                                <td className="px-3 py-2 text-white font-mono">{value}</td>
                                                                                                            </tr>
                                                                                                        ))}
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
