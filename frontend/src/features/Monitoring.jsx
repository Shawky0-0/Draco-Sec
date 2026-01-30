import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Shield,
    AlertTriangle,
    Activity,
    Terminal,
    Loader2,
    Network,
    Globe,
    Flag,
    ChevronRight,
    Search,
    Filter,
    Download,
    ExternalLink,
    XCircle
} from 'lucide-react';
import API_BASE_URL from "../config/api";

const API_BASE = `${API_BASE_URL}/monitor`;

const MonitoringPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [selectedFirewallItem, setSelectedFirewallItem] = useState(null);
    const [enrichedAlert, setEnrichedAlert] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [activeQueue, setActiveQueue] = useState('all'); // all, critical, high, medium, low
    const [filterSeverity, setFilterSeverity] = useState(null);
    const [lastAlertCount, setLastAlertCount] = useState(0);
    const [blockedIps, setBlockedIps] = useState([]);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        // Fetch both initially
        fetchAlerts();
        fetchBlockedIps();

        // Poll both
        const interval = setInterval(() => {
            fetchAlerts();
            fetchBlockedIps();
        }, 2000);
        return () => clearInterval(interval);
    }, [filterSeverity]);

    const fetchAlerts = async () => {
        try {
            const params = {};
            if (filterSeverity) params.severity = filterSeverity;

            const response = await axios.get(`${API_BASE}/alerts`, { params });

            // Track new alerts
            if (response.data.length > lastAlertCount) {
                setLastAlertCount(response.data.length);
            }

            setAlerts(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching alerts:", error);
            setIsLoading(false);
        }
    };

    const fetchBlockedIps = async () => {
        try {
            const response = await axios.get(`${API_BASE}/blocked-ips`);
            if (response.data.success) {
                setBlockedIps(response.data.blocked_ips);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching blocked IPs:", error);
        }
    };

    const fetchEnrichedAlert = async (alertId) => {
        try {
            const response = await axios.get(`${API_BASE}/alerts/enriched/${alertId}`);
            setEnrichedAlert(response.data);
        } catch (error) {
            console.error("Error fetching enriched alert:", error);
        }
    };

    const updateAlertStatus = async (alertId, newStatus, notes = '') => {
        try {
            await axios.patch(`${API_BASE}/alerts/${alertId}/status`, null, {
                params: { status: newStatus, notes }
            });

            // Update local state
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
            if (enrichedAlert && enrichedAlert.id === alertId) {
                setEnrichedAlert({ ...enrichedAlert, status: newStatus });
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleUnblockIp = async (ip) => {
        try {
            await axios.post(`${API_BASE}/unblock-ip`, { ip_address: ip });
            showToast(`IP ${ip} unblocked successfully`, 'success');
            fetchBlockedIps(); // Refresh list
        } catch (error) {
            console.error("Error unblocking IP:", error);
            showToast("Failed to unblock IP", 'error');
        }
    };

    const getSeverityLabel = (sev) => {
        if (sev === 1) return 'Critical';
        if (sev === 2) return 'High';
        if (sev === 3) return 'Medium';
        return 'Low';
    };

    const getSeverityColor = (sev) => {
        if (sev === 1) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (sev === 2) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        if (sev === 3) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    };

    const filteredAlerts = alerts.filter(alert => {
        if (activeQueue === 'all') return true;
        if (activeQueue === 'critical') return alert.severity === 1;
        if (activeQueue === 'high') return alert.severity === 2;
        if (activeQueue === 'medium') return alert.severity === 3;
        if (activeQueue === 'low') return alert.severity === 4;
        return true;
    });

    const formatSignature = (sig) => {
        if (!sig) return '';
        // Remove common technical prefixes
        let clean = sig
            .replace(/^ET\s+\w+\s+/, '') // Remove ET INFO, ET MALWARE, etc
            .replace(/^SURICATA\s+\w+\s+/, '') // Remove SURICATA STREAM, etc
            .replace(/^GPL\s+\w+\s+/, '');

        return clean;
    };

    const closeModal = () => {
        setSelectedAlert(null);
        setSelectedFirewallItem(null);
        setEnrichedAlert(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Combined Table Container */}
            <div className="bg-[#0a0a0a]/40 border border-white/5 rounded-2xl overflow-hidden flex-1 flex flex-col">

                {/* Unified Table Header - Contextual */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/5 text-gray-300 border border-white/10">
                            Unified Monitor
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar - Compact */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>

                        <div className="text-sm text-gray-400">
                            {filteredAlerts.length + blockedIps.length} events
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Severity:</span>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
                                <button
                                    key={severity}
                                    onClick={() => setActiveQueue(severity)}
                                    className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${activeQueue === severity
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {severity}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Helper Function for Table Body */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Signature / Reason</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Destination</th>
                                <th className="px-4 py-3">Protocol</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(() => {
                                // 1. Normalize and Merge Data
                                const normalizedAlerts = filteredAlerts.map(a => ({
                                    ...a,
                                    itemType: 'alert',
                                    sortTime: new Date(a.timestamp).getTime()
                                }));

                                const normalizedBlocks = blockedIps
                                    .filter(b => {
                                        if (activeQueue === 'all') return true;
                                        if (activeQueue === 'critical') return true;
                                        // Firewall blocks are treated as Critical/High priority, so hide them in Medium/Low views
                                        return false;
                                    })
                                    .map(b => ({
                                        ...b,
                                        itemType: 'firewall',
                                        sortTime: new Date(b.blocked_at).getTime(),
                                        id: `block-${b.id || b.ip}` // Ensure unique ID
                                    }));

                                const combinedData = [...normalizedAlerts, ...normalizedBlocks].sort((a, b) => b.sortTime - a.sortTime);

                                if (combinedData.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                                                No events found
                                            </td>
                                        </tr>
                                    );
                                }

                                return combinedData.map(item => (
                                    <tr
                                        key={item.id}
                                        onClick={() => {
                                            if (item.itemType === 'alert') {
                                                setSelectedAlert(item);
                                                fetchEnrichedAlert(item.id);
                                            } else {
                                                setSelectedFirewallItem(item);
                                            }
                                        }}
                                        className={`transition-colors text-sm group cursor-pointer ${item.itemType === 'alert' ? 'hover:bg-emerald-500/10' : 'hover:bg-red-500/10'}`}
                                    >
                                        {/* Time */}
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-400 font-mono text-xs">
                                            {new Date(item.sortTime).toLocaleTimeString()}
                                        </td>

                                        {/* Severity */}
                                        <td className="px-4 py-3">
                                            {item.itemType === 'alert' ? (
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                                                    {getSeverityLabel(item.severity)}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                                                    Firewall
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {item.itemType === 'alert' ? (
                                                <StatusBadge status={item.status || 'new'} />
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                                    Active
                                                </span>
                                            )}
                                        </td>

                                        {/* Signature */}
                                        <td className="px-4 py-3 text-white font-medium max-w-md truncate group-hover:text-emerald-400 transition-colors" title={item.itemType === 'alert' ? item.signature : item.reason}>
                                            {item.itemType === 'alert' ? formatSignature(item.signature) : item.reason}
                                        </td>

                                        {/* Source */}
                                        <td className="px-4 py-3 font-mono text-xs text-gray-300">
                                            {item.itemType === 'alert' ? (
                                                <span>{item.src_ip}:{item.src_port || 'N/A'}</span>
                                            ) : (
                                                <span className="text-red-300">{item.ip}</span>
                                            )}
                                        </td>

                                        {/* Dest */}
                                        <td className="px-4 py-3 font-mono text-xs text-gray-300">
                                            {item.itemType === 'alert' ? (
                                                <span>{item.dest_ip}:{item.dest_port}</span>
                                            ) : (
                                                <span className="text-gray-500">Any</span>
                                            )}
                                        </td>

                                        {/* Protocol */}
                                        <td className="px-4 py-3 text-gray-400 uppercase text-xs">
                                            {item.itemType === 'alert' ? item.protocol : 'ALL'}
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3">
                                            {item.itemType === 'alert' ? (
                                                item.action === 'blocked' ? (
                                                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                                                        <Shield className="w-3 h-3" /> Blocked
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">Allowed</span>
                                                )
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnblockIp(item.ip);
                                                    }}
                                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                                                >
                                                    Unblock
                                                </button>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.itemType === 'alert' && (
                                                <button className="text-gray-500 hover:text-emerald-400 transition-colors">
                                                    <ChevronRight size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Enriched Alert Modal */}
            {selectedAlert && <EnrichedAlertModal alert={selectedAlert} enrichedData={enrichedAlert} onClose={closeModal} onUpdateStatus={updateAlertStatus} showToast={showToast} />}

            {/* Firewall Details Modal */}
            {selectedFirewallItem && <FirewallDetailsModal item={selectedFirewallItem} onClose={closeModal} onUnblock={handleUnblockIp} showToast={showToast} />}

            {/* Toast Notification */}
            {
                toast && (
                    <div className={`fixed top-4 right-4 z-[60] px-6 py-4 rounded-lg shadow-2xl border ${toast.type === 'success'
                        ? 'bg-emerald-500/90 border-emerald-400 text-white'
                        : 'bg-red-500/90 border-red-400 text-white'
                        } backdrop-blur-sm animate-fade-in`}>
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="font-medium">{toast.message}</span>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Enriched Alert Detail Modal Component
const EnrichedAlertModal = ({ alert, enrichedData, onClose, onUpdateStatus, showToast }) => {
    if (!enrichedData) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
                    <Loader2 className="animate-spin text-emerald-400" size={32} />
                </div>
            </div>
        );
    }

    const enrichment = enrichedData.enrichment || {};
    const source_intel = enrichment.source || {};
    const dest_intel = enrichment.destination || {};
    const mitreTechniques = enrichment.mitre_techniques || [];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen p-6 flex items-start justify-center">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-6xl my-8">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#1a1a1a]/60">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Alert Analysis</h2>
                            <p className="text-sm text-gray-400">Alert #{alert.id} • {new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Quick Actions - Available for ALL alerts */}
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    try {
                                        await axios.post(`${API_BASE}/block-ip`, {
                                            ip_address: alert.src_ip,
                                            reason: `Alert: ${alert.signature}`
                                        });

                                        // Update status to Resolved
                                        onUpdateStatus(alert.id, 'resolved');

                                        // Use showToast prop
                                        if (showToast) {
                                            showToast(`IP ${alert.src_ip} blocked successfully!`, 'success');
                                        }
                                    } catch (error) {
                                        console.error('Block IP error:', error);
                                        if (showToast) {
                                            showToast(`Failed to block IP: ${error.response?.data?.detail || error.message}`, 'error');
                                        }
                                    }
                                }}
                                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                            >
                                Block Source IP
                            </button>
                            <button
                                onClick={() => onUpdateStatus(alert.id, 'false_positive')}
                                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 transition-colors"
                            >
                                Mark False Positive
                            </button>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Threat Summary */}
                                <Section title="Threat Summary" icon={AlertTriangle}>
                                    <InfoRow label="Signature" value={alert.signature} valueClass="text-white font-medium" />
                                    <InfoRow label="Category" value={alert.category} />
                                    <InfoRow label="Severity" value={
                                        <span className={`px-3 py-1 rounded text-xs font-medium ${alert.severity === 1 ? 'bg-red-500/20 text-red-400' : alert.severity === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {alert.severity === 1 ? 'Critical' : alert.severity === 2 ? 'High' : alert.severity === 3 ? 'Medium' : 'Low'}
                                        </span>
                                    } />
                                    {enrichment.kill_chain_phase && (
                                        <InfoRow label="Kill Chain Phase" value={
                                            <span className="text-yellow-400">{enrichment.kill_chain_phase}</span>
                                        } />
                                    )}
                                </Section>

                                {/* Network Intelligence - Source */}
                                <Section title="Source Intelligence" icon={Globe}>
                                    <InfoRow label="IP Address" value={<code className="text-emerald-400">{alert.src_ip}:{alert.src_port || 'N/A'}</code>} />
                                    {source_intel.country && (
                                        <InfoRow label="Location" value={`${source_intel.city || ''} ${source_intel.country_name || source_intel.country} 🌍`} />
                                    )}
                                    {source_intel.isp && (
                                        <InfoRow label="ISP" value={source_intel.isp} />
                                    )}
                                    {source_intel.reputation_score !== undefined && (
                                        <InfoRow label="Reputation" value={
                                            <span className={source_intel.is_malicious ? 'text-red-400' : 'text-emerald-400'}>
                                                {source_intel.is_malicious ? '🔴 Malicious' : '🟢 Clean'} ({source_intel.reputation_score}% confidence)
                                            </span>
                                        } />
                                    )}
                                    {source_intel.abuse_reports > 0 && (
                                        <InfoRow label="Abuse Reports" value={`${source_intel.abuse_reports} reports`} valueClass="text-red-400" />
                                    )}
                                </Section>

                                {/* Network Intelligence - Destination */}
                                <Section title="Destination Intelligence" icon={Network}>
                                    <InfoRow label="IP Address" value={<code className="text-blue-400">{alert.dest_ip}:{alert.dest_port}</code>} />
                                    {dest_intel.country && (
                                        <InfoRow label="Location" value={`${dest_intel.city || ''} ${dest_intel.country_name || dest_intel.country} 🌍`} />
                                    )}
                                    {dest_intel.isp && (
                                        <InfoRow label="ISP" value={dest_intel.isp} />
                                    )}
                                    <InfoRow label="Protocol" value={alert.protocol} />
                                </Section>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* MITRE ATT&CK */}
                                {mitreTechniques.length > 0 && (
                                    <Section title="MITRE ATT&CK" icon={Flag}>
                                        <div className="space-y-2">
                                            {mitreTechniques.map(tech => (
                                                <div key={tech.technique_id} className="bg-white/5 p-3 rounded">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <code className="text-yellow-400 text-sm font-medium">{tech.technique_id}</code>
                                                        <span className="text-xs text-purple-400">{tech.tactic}</span>
                                                    </div>
                                                    <div className="text-white text-sm">{tech.technique_name}</div>
                                                    <a href={tech.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-1">
                                                        View in MITRE <ExternalLink size={10} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </Section>
                                )}

                                {/* Packet Payload - Only show if captured */}
                                {enrichedData.payload_printable && (
                                    <Section title="Packet Payload" icon={Terminal}>
                                        <div className="bg-[#0a0a0a] p-3 rounded border border-white/5 font-mono text-xs max-h-48 overflow-auto">
                                            <pre className="text-emerald-400 whitespace-pre-wrap break-all">
                                                {enrichedData.payload_printable}
                                            </pre>
                                        </div>
                                    </Section>
                                )}

                                {/* Raw JSON */}
                                <Section title="Raw Event (JSON)" icon={Terminal}>
                                    <div className="bg-[#0a0a0a] p-3 rounded border border-white/5 font-mono text-xs max-h-64 overflow-auto">
                                        <pre className="text-gray-400 whitespace-pre-wrap break-all">
                                            {enrichedData.raw_event ? (
                                                typeof enrichedData.raw_event === 'string'
                                                    ? JSON.stringify(JSON.parse(enrichedData.raw_event), null, 2)
                                                    : JSON.stringify(enrichedData.raw_event, null, 2)
                                            ) : "No raw event data"}
                                        </pre>
                                    </div>
                                </Section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-[#1a1a1a]/60 border border-white/5 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            {Icon && <Icon size={14} />}
            {title}
        </h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value, valueClass = "text-gray-300" }) => (
    <div className="flex justify-between items-start py-1.5 text-sm">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className={`${valueClass} text-right max-w-[60%]`}>{value}</span>
    </div>
);

const FirewallDetailsModal = ({ item, onClose, onUnblock, showToast }) => {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#1a1a1a]/60 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Shield className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Active Firewall Block</h2>
                                <p className="text-sm text-gray-400">Rule ID: {item.id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Status Banner */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-sm font-semibold text-red-200 mb-1">Access Denied</h3>
                                <p className="text-sm text-red-200/70 leading-relaxed">
                                    Traffic from this IP address is currently being <strong>dropped</strong> by the firewall. This is an automated Active Response to detected malicious activity.
                                </p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <Section title="Target Info" icon={Globe}>
                                <InfoRow label="Blocked IP" value={<code className="text-red-400 text-lg">{item.ip}</code>} />
                                <InfoRow label="Status" value={
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Active
                                    </span>
                                } />
                                <InfoRow label="Blocked At" value={new Date(item.blocked_at).toLocaleString()} />
                            </Section>

                            <Section title="Block Logic" icon={Terminal}>
                                <InfoRow label="Enforcement" value="IPTables Drop" />
                                <InfoRow label="Scope" value="All Protocols / All Ports" />
                                <InfoRow label="Reason" value={item.reason} valueClass="text-yellow-400 font-medium break-words text-right" />
                            </Section>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-white/5 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    onUnblock(item.ip);
                                    onClose();
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors font-medium"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                                Unblock IP Address
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        new: "bg-blue-500/10 text-blue-400",
        investigating: "bg-orange-500/10 text-orange-400",
        resolved: "bg-emerald-500/10 text-emerald-400",
        false_positive: "bg-gray-500/10 text-gray-400"
    };

    const labels = {
        new: "New",
        investigating: "Investigating",
        resolved: "Resolved",
        false_positive: "False Positive"
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.new}`}>
            {labels[status] || status}
        </span>
    );
};

export default MonitoringPage;
