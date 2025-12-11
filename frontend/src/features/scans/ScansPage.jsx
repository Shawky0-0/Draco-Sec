import React, { useState, useRef, useEffect } from 'react';
import { scansService } from '../../services/scansService';
import { useScans } from '../../context/ScansContext';
import {
    Search, Upload, Shield, AlertTriangle, CheckCircle,
    FileText, Globe, Loader2, AlertOctagon, XCircle, Clock, Activity
} from 'lucide-react';

export const ScansPage = () => {
    const { activeScans, completedScans, startScan, addCompletedScan, removeScan } = useScans();
    const [activeTab, setActiveTab] = useState('url');
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Debug: Log active scans when component mounts or activeScans changes
    useEffect(() => {
        console.log('[ScansPage] Active scans:', activeScans);
        console.log('[ScansPage] Completed scans:', completedScans);
    }, [activeScans, completedScans]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleScan = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            let response;
            let scanType;
            let scanTarget;

            if (activeTab === 'url') {
                if (!urlInput) throw new Error("Please enter a URL");
                scanType = 'url';
                scanTarget = urlInput;
                response = await scansService.scanUrl(urlInput);
            } else {
                if (!selectedFile) throw new Error("Please select a file");
                scanType = 'file';
                scanTarget = selectedFile.name;
                response = await scansService.scanFile(selectedFile);
            }

            // Register scan in context for background tracking
            // Check if result is from cache (instant result)
            if (response.from_cache) {
                // Cached result - add to completed scans immediately
                const cachedResult = response.data.attributes;
                addCompletedScan(
                    response.data.id || `cached-${Date.now()}`,
                    scanType,
                    scanTarget,
                    cachedResult
                );

                setUrlInput('');
                setSelectedFile(null);
            } else if (activeTab === 'url' && response.data && response.data.id) {
                startScan(response.data.id, scanType, scanTarget);
                setUrlInput('');
            } else if (activeTab === 'file') {
                if (response.type === 'queued' && response.data.id) {
                    startScan(response.data.id, scanType, scanTarget);
                    setSelectedFile(null);
                } else if (response.type === 'report') {
                    // Immediately completed from VT database, add to completed scans
                    const reportResult = response.data.attributes;
                    addCompletedScan(
                        response.data.id || `report-${Date.now()}`,
                        scanType,
                        scanTarget,
                        reportResult
                    );
                    setSelectedFile(null);
                }
            }

            // Reset form state after successful submission
            console.log('[ScansPage] Scan processed, resetting submitting state');
            setSubmitting(false);
        } catch (err) {
            console.error('[ScansPage] Error:', err);
            setError(err.message || "Scan failed");
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-white">Threat Intelligence Scanner</h2>
                <p className="text-gray-400">Analyze URLs and files using VirusTotal's malware detection database.</p>
            </div>

            {/* Active Scans Indicator */}
            {activeScans.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Activity className="text-blue-400 animate-pulse" size={20} />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-400">
                                {activeScans.length} scan{activeScans.length > 1 ? 's' : ''} in progress
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                You can navigate to other pages. Results will appear below when complete.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {activeScans.map(scan => (
                            <div key={scan.id} className="flex items-center justify-between text-xs bg-white/5 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                    {scan.type === 'url' ? <Globe size={14} /> : <FileText size={14} />}
                                    <span className="text-gray-300 font-mono">{scan.target}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {scan.error ? (
                                        <span className="text-red-400">{scan.error}</span>
                                    ) : (
                                        <>
                                            <Loader2 className="animate-spin text-blue-400" size={12} />
                                            <span className="text-gray-500">Analyzing...</span>
                                        </>
                                    )}
                                    <button
                                        onClick={() => removeScan(scan.id)}
                                        className="text-gray-500 hover:text-white ml-2"
                                        title="Dismiss"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab Selector */}
            <div className="flex gap-2 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('url')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'url'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Globe size={16} />
                        URL Scanner
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('file')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'file'
                        ? 'border-emerald-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText size={16} />
                        File Analyzer
                    </div>
                </button>
            </div>

            {/* Input Form */}
            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-8">
                <form onSubmit={handleScan} className="flex flex-col gap-6">
                    {activeTab === 'url' ? (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-400">Target URL</label>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-sm"
                                disabled={submitting}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-400">Upload File</label>
                            <div
                                className="border border-dashed border-white/10 rounded-lg bg-[#0a0a0a] h-40 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-colors"
                                onClick={() => !submitting && fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={submitting}
                                />
                                <Upload className="text-gray-500 mb-3" size={24} />
                                <p className="text-sm text-gray-400">
                                    {selectedFile ? selectedFile.name : "Click to select file"}
                                </p>
                                {selectedFile && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={submitting || (activeTab === 'url' && !urlInput) || (activeTab === 'file' && !selectedFile)}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Search size={16} /> Run Scan
                                </>
                            )}
                        </button>
                        {(urlInput || selectedFile) && !submitting && (
                            <button
                                type="button"
                                onClick={() => {
                                    setUrlInput('');
                                    setSelectedFile(null);
                                    setError(null);
                                }}
                                className="text-gray-400 hover:text-white text-sm transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertOctagon className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-400 mb-1">Scan Failed</h4>
                        <p className="text-sm text-gray-300">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-gray-500 hover:text-gray-300">
                        <XCircle size={18} />
                    </button>
                </div>
            )}

            {/* Completed Scans */}
            {completedScans.length > 0 && (
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-white">Recent Results</h3>
                    {completedScans.map(scan => (
                        <ScanResult key={scan.id} scan={scan} onRemove={() => removeScan(scan.id)} />
                    ))}
                </div>
            )}

            {completedScans.length === 0 && activeScans.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                    <Shield className="mx-auto mb-4 opacity-20" size={48} />
                    <p>No scan results yet. Submit a URL or file to begin analysis.</p>
                </div>
            )}
        </div>
    );
};

// Scan Result Component
const ScanResult = ({ scan, onRemove }) => {
    const result = scan.result;
    if (!result) return null;

    // Normalize stats (VT uses 'stats' for analysis and 'last_analysis_stats' for file reports)
    const stats = result.stats || result.last_analysis_stats || {};

    return (
        <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock size={14} />
                    <span>{new Date(scan.completedAt).toLocaleString()}</span>
                </div>
                <button onClick={onRemove} className="text-gray-500 hover:text-gray-300">
                    <XCircle size={18} />
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatBox
                    label="Malicious"
                    value={stats.malicious || 0}
                    icon={AlertTriangle}
                    color={stats.malicious > 0 ? "text-red-400" : "text-gray-500"}
                />
                <StatBox
                    label="Suspicious"
                    value={stats.suspicious || 0}
                    icon={AlertOctagon}
                    color={stats.suspicious > 0 ? "text-amber-400" : "text-gray-500"}
                />
                <StatBox
                    label="Harmless"
                    value={stats.harmless || 0}
                    icon={CheckCircle}
                    color="text-emerald-400"
                />
                <StatBox
                    label="Undetected"
                    value={stats.undetected || 0}
                    icon={Shield}
                    color="text-gray-500"
                />
            </div>

            {/* Verdict */}
            <div className={`border rounded-lg p-4 ${stats.malicious > 0
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stats.malicious > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
                        }`}>
                        {stats.malicious > 0
                            ? <AlertTriangle className="text-red-400" size={20} />
                            : <CheckCircle className="text-emerald-400" size={20} />
                        }
                    </div>
                    <div>
                        <h3 className={`text-base font-semibold ${stats.malicious > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                            {stats.malicious > 0 ? 'Threat Detected' : 'No Threats Detected'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {stats.malicious > 0
                                ? `${stats.malicious} security vendor${stats.malicious > 1 ? 's' : ''} flagged this as malicious`
                                : 'No security vendors reported malicious activity'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Box Component
const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
            <Icon className={`${color} opacity-60`} size={16} />
            <span className={`text-xl font-bold ${color}`}>{value}</span>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
    </div>
);
