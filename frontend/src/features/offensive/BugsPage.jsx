import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bug, Search, X, ChevronRight, ChevronDown,
    Calendar, Hash, Shield, AlertTriangle,
    FileCode, Cpu, Target, ArrowLeft, Filter, Loader2
} from 'lucide-react';
import { listVulnerabilities } from '../../services/offensiveService';

/* ──────────────────────────────────────────────────────
   Config
────────────────────────────────────────────────────── */
const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];

const SEV_CONFIG = {
    critical: { label: 'Critical', border: 'border-l-red-500', ring: 'border-red-500/30', bg: 'bg-red-500/8', text: 'text-red-400', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
    high: { label: 'High', border: 'border-l-orange-500', ring: 'border-orange-500/30', bg: 'bg-orange-500/8', text: 'text-orange-400', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
    medium: { label: 'Medium', border: 'border-l-yellow-500', ring: 'border-yellow-500/30', bg: 'bg-yellow-500/8', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40', dot: 'bg-yellow-500' },
    low: { label: 'Low', border: 'border-l-green-500', ring: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-400', badge: 'bg-green-500/20 text-green-300 border border-green-500/40', dot: 'bg-green-500' },
    info: { label: 'Info', border: 'border-l-blue-500', ring: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40', dot: 'bg-blue-400' },
};

const getSev = (s) => SEV_CONFIG[(s ?? '').toLowerCase()] ?? SEV_CONFIG.low;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(undefined, { timeStyle: 'medium' }) : '—';

/* ──────────────────────────────────────────────────────
   Markdown content renderer (renders Draco vuln reports)
────────────────────────────────────────────────────── */
const MarkdownContent = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('# ')) {
            out.push(<h1 key={i} className="text-lg font-bold text-white mt-4 mb-2 pb-1 border-b border-gray-700">{line.slice(2)}</h1>);
        } else if (line.startsWith('## ')) {
            out.push(<h2 key={i} className="text-base font-bold text-gray-200 mt-4 mb-1.5">{line.slice(3)}</h2>);
        } else if (line.startsWith('### ')) {
            out.push(<h3 key={i} className="text-sm font-semibold text-gray-300 mt-3 mb-1">{line.slice(4)}</h3>);
        } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
            out.push(<p key={i} className="font-bold text-gray-200 my-1 text-sm">{line.slice(2, -2)}</p>);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            out.push(
                <li key={i} className="ml-5 text-gray-300 text-sm leading-relaxed list-disc mb-0.5">
                    <InlineFormat text={line.slice(2)} />
                </li>
            );
        } else if (/^\d+\.\s/.test(line)) {
            out.push(
                <li key={i} className="ml-5 text-gray-300 text-sm leading-relaxed list-decimal mb-0.5">
                    <InlineFormat text={line.replace(/^\d+\.\s/, '')} />
                </li>
            );
        } else if (line.startsWith('```')) {
            const lang = line.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            out.push(
                <pre key={i} className="bg-black/60 border border-gray-800 rounded-lg p-3 overflow-x-auto text-xs font-mono text-green-300 my-3 leading-relaxed whitespace-pre-wrap">
                    {codeLines.join('\n')}
                </pre>
            );
        } else if (line.startsWith('> ')) {
            out.push(
                <blockquote key={i} className="border-l-2 border-gray-600 pl-3 my-2 text-gray-400 italic text-sm">
                    {line.slice(2)}
                </blockquote>
            );
        } else if (line.trim() === '') {
            out.push(<div key={i} className="h-1.5" />);
        } else {
            out.push(
                <p key={i} className="text-gray-300 text-sm leading-relaxed my-0.5">
                    <InlineFormat text={line} />
                </p>
            );
        }
        i++;
    }

    return <div className="vuln-content">{out}</div>;
};

/* Handles inline **bold**, `code`, and plain text */
const InlineFormat = ({ text }) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**'))
                    return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                if (part.startsWith('`') && part.endsWith('`'))
                    return <code key={i} className="bg-gray-800 text-green-300 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};

/* ──────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────── */
const BugsPage = () => {
    const [vulnerabilities, setVulnerabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [selectedVuln, setSelectedVuln] = useState(null);

    useEffect(() => { loadVulnerabilities(); }, []);

    const loadVulnerabilities = async () => {
        try {
            const data = await listVulnerabilities();
            setVulnerabilities([...data].sort(
                (a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
            ));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = vulnerabilities.filter(v => {
        const matchSev = severityFilter === 'all' || v.severity === severityFilter;
        const matchSearch = !searchTerm ||
            v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.content ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchSev && matchSearch;
    });

    const counts = SEV_ORDER.reduce((acc, s) => {
        acc[s] = vulnerabilities.filter(v => v.severity === s).length;
        return acc;
    }, {});

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
    );

    /* ──────── Detail View ──────── */
    if (selectedVuln) {
        return (
            <VulnDetailView
                vuln={selectedVuln}
                onBack={() => setSelectedVuln(null)}
            />
        );
    }

    /* ──────── List View ──────── */
    return (
        <div className="min-h-screen bg-black p-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <Bug size={26} className="text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Vulnerabilities</h1>
                        <p className="text-gray-500 text-sm mt-0.5">{vulnerabilities.length} total findings across all scans</p>
                    </div>
                </div>

                {/* Severity filter chips */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {SEV_ORDER.map(s => {
                        const cfg = getSev(s);
                        const active = severityFilter === s;
                        return (
                            <button key={s} onClick={() => setSeverityFilter(active ? 'all' : s)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium
                                    ${active ? `${cfg.bg} ${cfg.ring} ${cfg.text} border-2` : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}`}>
                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${active ? cfg.badge : 'bg-gray-800 text-gray-400'}`}>
                                    {counts[s] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                    {severityFilter !== 'all' && (
                        <button onClick={() => setSeverityFilter('all')} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search vulnerabilities…"
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-16 text-center">
                    <Bug size={44} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">{vulnerabilities.length === 0 ? 'No vulnerabilities discovered yet.' : 'No results match your filters.'}</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map((vuln, i) => <VulnRow key={vuln.id} vuln={vuln} idx={i} onClick={() => setSelectedVuln(vuln)} />)}
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────────────
   List Row
────────────────────────────────────────────────────── */
const VulnRow = ({ vuln, idx, onClick }) => {
    const cfg = getSev(vuln.severity);
    // Extract first meaningful sentence from content for preview
    const preview = (vuln.content ?? '').replace(/[#*`>]/g, '').replace(/\n/g, ' ').trim().substring(0, 130);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            onClick={onClick}
            className={`group bg-[#0a0a0a] border border-l-4 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:bg-[#111] ${cfg.border} ${cfg.ring}`}
        >
            <div className="px-5 py-4 flex items-center gap-4">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cfg.badge}`}>{vuln.severity}</span>
                        <span className="text-[10px] text-gray-600 bg-gray-800/60 px-2 py-0.5 rounded font-mono">Scan #{vuln.scan_id}</span>
                    </div>
                    <div className="font-semibold text-white text-sm leading-snug truncate">{vuln.title}</div>
                    {preview && (
                        <div className="text-gray-600 text-xs mt-0.5 truncate leading-relaxed">{preview}…</div>
                    )}
                </div>
                <div className="shrink-0 flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] text-gray-600">{fmtDate(vuln.found_at)}</div>
                        <div className="text-[10px] text-gray-700">{fmtTime(vuln.found_at)}</div>
                    </div>
                    <ChevronRight size={15} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
            </div>
        </motion.div>
    );
};

/* ──────────────────────────────────────────────────────
   Full Detail View (full page, not a modal)
────────────────────────────────────────────────────── */
const VulnDetailView = ({ vuln, onBack }) => {
    const cfg = getSev(vuln.severity);

    // Parse Draco report ID from poc field
    const reportId = vuln.poc; // e.g. "vuln-0001"

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-h-screen bg-black p-6"
        >
            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors mb-6">
                <ArrowLeft size={15} /> Back to Vulnerabilities
            </button>

            {/* Title Banner */}
            <div className={`border-2 ${cfg.ring} ${cfg.bg} rounded-2xl p-6 mb-6`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${cfg.badge}`}>{vuln.severity}</span>
                            <span className="text-xs bg-gray-800/80 text-gray-400 px-2 py-1 rounded-lg font-mono border border-gray-700">
                                🤖 Automated Finding by Draco
                            </span>
                            {reportId && (
                                <span className="text-xs bg-black/40 text-gray-500 px-2 py-1 rounded-lg font-mono border border-gray-800">
                                    {reportId}
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-white leading-snug mb-2">{vuln.title}</h1>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><Calendar size={11} />{fmtDate(vuln.found_at)} at {fmtTime(vuln.found_at)}</span>
                            <span className="flex items-center gap-1.5"><Hash size={11} />Scan #{vuln.scan_id}</span>
                        </div>
                    </div>
                    <Shield size={40} className={`${cfg.text} opacity-30 shrink-0`} />
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/40 flex items-center gap-2">
                    <Bug size={14} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Draco Analysis Report</span>
                </div>
                <div className="p-6">
                    {vuln.content ? (
                        <MarkdownContent text={vuln.content} />
                    ) : (
                        <p className="text-gray-600 italic text-sm">No detailed content available for this vulnerability.</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default BugsPage;
