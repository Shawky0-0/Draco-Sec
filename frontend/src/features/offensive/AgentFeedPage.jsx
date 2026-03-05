import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Square,
    Terminal,
    Bug,
    Shield,
    Cpu,
    Clock,
    DollarSign,
    Box,
    ChevronDown,
    Globe,
    FileCode,
    BookOpen,
    Wrench,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Brain,
    Search,
    Flag,
    ChevronsDown,
    StickyNote,
    ListChecks,
    Camera,
    MousePointer,
    Code2,
    Send,
    Layers,
} from 'lucide-react';
import { getScan, connectToAgentFeed, stopScan } from '../../services/offensiveService';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const stripThinkTags = (text) => {
    if (!text) return { clean: '', hadThink: false };
    const hadThink = /<think>/i.test(text);
    const clean = text
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<\/?think>/gi, '')
        .trim();
    return { clean, hadThink };
};

const tryParseJson = (str) => {
    if (typeof str !== 'string') return str;
    try { return JSON.parse(str); } catch { return str; }
};

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
const AgentFeedPage = () => {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [scan, setScan] = useState(null);
    const [events, setEvents] = useState([]);
    const [scanStatus, setScanStatus] = useState('running');
    const [stats, setStats] = useState({ runtime: 0, toolsUsed: 0, vulnsFound: 0, agentsCount: 1, inputTokens: 0, outputTokens: 0, cost: 0.0 });
    const [agents, setAgents] = useState({});
    // null = show all events (like Strix's no-agent-selected or overview)
    const [selectedAgentId, setSelectedAgentId] = useState(null);

    const terminalEndRef = useRef(null);
    const eventSourceRef = useRef(null);
    const terminalContainerRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    useEffect(() => {
        loadScan();
        connectToFeed();
        const interval = setInterval(() => {
            setScanStatus(prev => { if (prev === 'running') setStats(s => ({ ...s, runtime: s.runtime + 1 })); return prev; });
        }, 1000);
        return () => { clearInterval(interval); if (eventSourceRef.current) eventSourceRef.current.close(); };
    }, [scanId]);

    // When agent changes, reset scroll to bottom
    useEffect(() => { setShouldAutoScroll(true); }, [selectedAgentId]);

    useEffect(() => {
        if (shouldAutoScroll && terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events, shouldAutoScroll, selectedAgentId]);

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 120);
    }, []);

    const jumpToBottom = useCallback(() => {
        setShouldAutoScroll(true);
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const loadScan = async () => {
        try { const data = await getScan(scanId); setScan(data); setScanStatus(data.status); }
        catch (err) { console.error('Error loading scan:', err); }
    };

    const connectToFeed = () => {
        const es = connectToAgentFeed(scanId, handleEvent, handleComplete);
        eventSourceRef.current = es;
    };

    const handleEvent = (data) => {
        setEvents(prev => [...prev, data]);
        let content = data.content;
        try { if (typeof content === 'string') content = JSON.parse(content); } catch { }

        switch (data.type) {
            case 'agent_created':
                setAgents(prev => {
                    const next = {
                        ...prev,
                        [content.agent_id]: { id: content.agent_id, name: content.name, task: content.task, parent_id: content.parent_id, status: 'running' },
                    };
                    // Auto-select root agent on first creation
                    if (!Object.values(prev).find(a => !a.parent_id) && !content.parent_id) {
                        setSelectedAgentId(content.agent_id);
                    }
                    return next;
                });
                setStats(prev => ({ ...prev, agentsCount: Object.keys(prev).length + 1 }));
                break;
            case 'status':
                setAgents(prev => {
                    if (!prev[data.agent_id]) return prev;
                    return { ...prev, [data.agent_id]: { ...prev[data.agent_id], status: content.status } };
                });
                break;
            case 'tool_start':
                setStats(prev => ({ ...prev, toolsUsed: prev.toolsUsed + 1 }));
                if (content.tool === 'create_vulnerability_report') setStats(prev => ({ ...prev, vulnsFound: prev.vulnsFound + 1 }));
                break;
            case 'stats':
                setStats(prev => ({
                    ...prev,
                    inputTokens: content?.total?.input_tokens ?? prev.inputTokens,
                    outputTokens: content?.total?.output_tokens ?? prev.outputTokens,
                    cost: content?.total?.cost ?? prev.cost,
                    agentsCount: content?.agents_count ?? prev.agentsCount,
                    toolsUsed: content?.tools_count ?? prev.toolsUsed,
                }));
                break;
            default: break;
        }
    };

    const handleComplete = (status) => { setScanStatus(status); loadScan(); };

    const handleStopScan = async () => {
        if (!confirm('Are you sure you want to stop this scan?')) return;
        try { await stopScan(scanId); setScanStatus('stopped'); }
        catch (err) { console.error('Failed to stop scan:', err); }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

    // Filter events by selected agent (or show all if null)
    const visibleEvents = selectedAgentId
        ? events.filter(e => e.agent_id === selectedAgentId || e.type === 'agent_created')
        : events;

    const vulnEvents = events.filter(e => {
        if (e.type !== 'tool_start') return false;
        let c = e.content;
        try { if (typeof c === 'string') c = JSON.parse(c); } catch { }
        return c?.tool === 'create_vulnerability_report';
    });

    const agentList = Object.values(agents);
    const rootAgents = agentList.filter(a => !a.parent_id);
    const selectedAgent = selectedAgentId ? agents[selectedAgentId] : null;

    const statusColor = scanStatus === 'running'
        ? 'bg-green-500/20 border-green-500 text-green-400'
        : scanStatus === 'completed'
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'bg-red-500/20 border-red-500 text-red-400';

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono flex flex-col h-screen overflow-hidden">

            {/* ── Header ── */}
            <div className="border-b border-gray-800 bg-[#0a0a0a] px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/offensive/agent-feed')} className="p-1.5 hover:bg-gray-800 rounded transition-colors text-green-500">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield size={15} className="text-green-500" />
                            <h1 className="text-base font-bold text-white tracking-wider">STRIX <span className="text-green-500">AGENT</span></h1>
                        </div>
                        <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                            <span>TARGET:</span><span className="text-cyan-400">{scan?.target || '…'}</span>
                            <span className="text-gray-700">|</span>
                            <span>METHOD:</span><span className="text-yellow-400">{scan?.methodology || '…'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5 text-sm">
                    <TuiStat label="RUNTIME" value={formatTime(stats.runtime)} icon={<Clock size={13} />} />
                    <TuiStat label="AGENTS" value={stats.agentsCount} icon={<Cpu size={13} />} color="text-purple-400" />
                    <TuiStat label="TOOLS" value={stats.toolsUsed} icon={<Terminal size={13} />} color="text-yellow-400" />
                    <TuiStat label="VULNS" value={vulnEvents.length} icon={<Bug size={13} />} color="text-red-400" bold />
                    <TuiStat label="IN" value={stats.inputTokens} icon={<span className="text-[10px]">↓</span>} color="text-gray-400" />
                    <TuiStat label="OUT" value={stats.outputTokens} icon={<span className="text-[10px]">↑</span>} color="text-gray-400" />
                    <TuiStat label="COST" value={`$${(stats.cost ?? 0).toFixed(4)}`} icon={<DollarSign size={13} />} color="text-green-400" />
                </div>

                <div className="flex items-center gap-3">
                    {scanStatus === 'running' && (
                        <button onClick={handleStopScan} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-all">
                            <Square size={11} fill="currentColor" /> Stop
                        </button>
                    )}
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase border ${statusColor} ${scanStatus === 'running' ? 'animate-pulse' : ''}`}>{scanStatus}</div>
                </div>
            </div>

            {/* ── Main 3-column grid ── */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">

                {/* Left: Agent Tree — clickable like Strix */}
                <div className="col-span-2 border-r border-gray-800 bg-[#050505] flex flex-col min-h-0">
                    <PanelHeader icon={<Box size={11} />} label="Agents" />
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">

                        {/* "All Agents" overview button */}
                        <button
                            onClick={() => setSelectedAgentId(null)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[11px] flex items-center gap-2 transition-colors ${selectedAgentId === null
                                    ? 'bg-gray-700/60 text-white border border-gray-600'
                                    : 'text-gray-500 hover:bg-gray-800/40 hover:text-gray-300'
                                }`}
                        >
                            <Layers size={11} className={selectedAgentId === null ? 'text-green-400' : 'text-gray-600'} />
                            <span>All Agents</span>
                            <span className="ml-auto text-[9px] text-gray-600">{events.length}</span>
                        </button>

                        <div className="border-t border-gray-900 my-1" />

                        {agentList.length === 0
                            ? <div className="text-gray-700 text-[10px] text-center pt-4 italic">Waiting for agents…</div>
                            : rootAgents.map(root => (
                                <AgentNode
                                    key={root.id}
                                    agent={root}
                                    allAgents={agents}
                                    depth={0}
                                    selectedAgentId={selectedAgentId}
                                    onSelect={setSelectedAgentId}
                                    events={events}
                                />
                            ))
                        }
                    </div>
                    <div className="p-2 border-t border-gray-800 bg-gray-900/40 text-[10px] space-y-1 shrink-0">
                        <div className="text-gray-600 font-bold uppercase tracking-wider mb-1">Tokens</div>
                        <div className="flex justify-between text-gray-400"><span>In</span><span>{stats.inputTokens}</span></div>
                        <div className="flex justify-between text-gray-400"><span>Out</span><span>{stats.outputTokens}</span></div>
                    </div>
                </div>

                {/* Center: Live feed */}
                <div className="col-span-7 flex flex-col border-r border-gray-800 min-h-0">
                    {/* Sub-header showing which agent is selected */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900/30 shrink-0">
                        <div className="flex items-center gap-2">
                            <Terminal size={11} className="text-gray-600" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Trace</span>
                            {selectedAgent && (
                                <>
                                    <span className="text-gray-700 text-[10px]">›</span>
                                    <AgentStatusDot status={selectedAgent.status} />
                                    <span className="text-[10px] font-semibold text-green-400">{selectedAgent.name}</span>
                                </>
                            )}
                        </div>
                        <span className="text-[9px] text-gray-700">{visibleEvents.filter(e => e.type !== 'stats').length} events</span>
                    </div>

                    <div className="relative flex-1 min-h-0">
                        <div ref={terminalContainerRef} className="absolute inset-0 overflow-y-auto p-4 space-y-2" onScroll={handleScroll}>
                            {visibleEvents.length === 0 && (
                                <div className="text-gray-700 italic text-center mt-12 text-sm">
                                    {selectedAgent ? `Waiting for ${selectedAgent.name} to emit events…` : 'Initializing scan environment…'}
                                </div>
                            )}
                            {visibleEvents.map((event, i) => <FeedEntry key={i} event={event} />)}
                            <div ref={terminalEndRef} />
                        </div>
                        {!shouldAutoScroll && (
                            <button onClick={jumpToBottom} className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-green-400 text-xs font-bold rounded-full shadow-lg transition-all z-10">
                                <ChevronsDown size={13} /> Jump to bottom
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Findings */}
                <div className="col-span-3 bg-[#050505] flex flex-col min-h-0">
                    <PanelHeader icon={<Bug size={11} />} label={`Findings (${vulnEvents.length})`} />
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                        {vulnEvents.length === 0
                            ? <div className="text-gray-700 text-[10px] text-center pt-10 italic">No vulnerabilities found yet.</div>
                            : vulnEvents.map((e, i) => {
                                let c = e.content;
                                try { if (typeof c === 'string') c = JSON.parse(c); } catch { }
                                return <VulnCard key={i} args={c?.args || {}} />;
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Shared small components
───────────────────────────────────────────── */
const TuiStat = ({ label, value, icon, color = 'text-white', bold }) => (
    <div className="flex flex-col items-center leading-none">
        <span className="text-[9px] text-gray-600 font-bold mb-0.5 tracking-wider">{label}</span>
        <div className={`flex items-center gap-1 ${color} ${bold ? 'font-bold' : ''} text-xs`}>{icon}<span>{value}</span></div>
    </div>
);

const PanelHeader = ({ icon, label }) => (
    <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/40 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
        {icon} {label}
    </div>
);

const AgentStatusDot = ({ status }) => {
    const cls = { running: 'bg-green-400 animate-pulse', completed: 'bg-blue-400', failed: 'bg-red-400', stopped: 'bg-gray-600' }[status] ?? 'bg-gray-600';
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cls}`} />;
};

/* ─────────────────────────────────────────────
   Agent tree node — clickable
───────────────────────────────────────────── */
const AgentNode = ({ agent, allAgents, depth, selectedAgentId, onSelect, events }) => {
    const children = Object.values(allAgents).filter(a => a.parent_id === agent.id);
    const isSelected = agent.id === selectedAgentId;
    const isRoot = !agent.parent_id;

    // Count events for this agent
    const agentEventCount = events.filter(e => e.agent_id === agent.id && e.type !== 'stats').length;

    const statusEmoji = { running: '🟢', completed: '✅', failed: '❌', stopped: '⏹️' }[agent.status] ?? '🔵';

    return (
        <div style={{ marginLeft: depth * 10 }}>
            <button
                onClick={() => onSelect(agent.id)}
                className={`w-full text-left px-1.5 py-1.5 rounded text-[11px] flex items-center gap-2 transition-colors group ${isSelected
                        ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                        : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                    }`}
            >
                <span className="text-[11px] shrink-0">{statusEmoji}</span>
                <span className={`truncate flex-1 ${isRoot ? 'font-bold' : ''}`} title={agent.task}>{agent.name}</span>
                {agentEventCount > 0 && (
                    <span className={`shrink-0 text-[9px] px-1 rounded ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-600 group-hover:text-gray-400'}`}>
                        {agentEventCount}
                    </span>
                )}
            </button>
            {agent.task && isSelected && (
                <div className="ml-5 mr-1 mt-0.5 mb-1 text-[9px] text-gray-600 leading-relaxed line-clamp-2 px-1">{agent.task}</div>
            )}
            {children.map(child => (
                <AgentNode key={child.id} agent={child} allAgents={allAgents} depth={depth + 1} selectedAgentId={selectedAgentId} onSelect={onSelect} events={events} />
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Feed entry dispatcher
───────────────────────────────────────────── */
const FeedEntry = ({ event }) => {
    let content = event.content;
    try { if (typeof content === 'string') content = JSON.parse(content); } catch { }

    if (event.type === 'stats') return null;
    if (event.type === 'agent_created') return <AgentCreatedEntry content={content} ts={event.timestamp} />;
    if (event.type === 'chat') return <ChatEntry content={content} ts={event.timestamp} />;
    if (event.type === 'tool_start') return <ToolStartEntry content={content} ts={event.timestamp} />;
    if (event.type === 'tool_update') return <ToolUpdateEntry content={content} ts={event.timestamp} />;
    if (event.type === 'status') return <StatusEntry content={content} ts={event.timestamp} agentId={event.agent_id} />;

    return (
        <div className="text-gray-700 text-[10px] font-mono ml-2 opacity-50">
            [{event.type}] {typeof content === 'string' ? content : JSON.stringify(content)}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Individual event renderers
───────────────────────────────────────────── */
const Timestamp = ({ ts }) => (
    <span className="text-[9px] text-gray-700 font-mono shrink-0">[{new Date(ts).toLocaleTimeString()}]</span>
);

const AgentCreatedEntry = ({ content, ts }) => (
    <div className="flex items-start gap-2 p-2 rounded bg-purple-500/5 border border-purple-500/20">
        <Timestamp ts={ts} />
        <Cpu size={13} className="text-purple-400 mt-0.5 shrink-0" />
        <div>
            <span className="text-purple-400 font-bold text-xs">{content?.parent_id ? 'Sub-agent spawned' : 'Root agent started'}</span>
            <span className="text-gray-300 text-xs ml-2 font-semibold">{content?.name}</span>
            {content?.task && <div className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{content.task}</div>}
        </div>
    </div>
);

const ChatEntry = ({ content, ts }) => {
    const isAssistant = content?.role === 'assistant';
    const rawText = content?.content ?? '';
    const { clean } = stripThinkTags(rawText);
    if (clean.length <= 8) return null;

    return (
        <div className={`border-l-2 pl-3 py-1 ${isAssistant ? 'border-blue-500/60' : 'border-purple-500/60'}`}>
            <div className="flex items-center gap-2 mb-1">
                <Timestamp ts={ts} />
                <Brain size={12} className={isAssistant ? 'text-blue-400' : 'text-purple-400'} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAssistant ? 'text-blue-400' : 'text-purple-400'}`}>
                    {isAssistant ? 'Agent Reasoning' : 'System Message'}
                </span>
            </div>
            <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{clean}</div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Tool metadata registry
───────────────────────────────────────────── */
const TOOL_META = {
    terminal_execute: { icon: <Terminal size={13} />, color: 'text-green-400', label: 'Terminal' },
    python_execute: { icon: <FileCode size={13} />, color: 'text-yellow-400', label: 'Python' },
    file_read: { icon: <FileCode size={13} />, color: 'text-gray-400', label: 'File Read' },
    file_write: { icon: <FileCode size={13} />, color: 'text-yellow-400', label: 'File Write' },
    code_execute: { icon: <Code2 size={13} />, color: 'text-yellow-400', label: 'Code Execute' },
    browser_action: { icon: <Globe size={13} />, color: 'text-cyan-400', label: 'Browser' },
    browser_navigate: { icon: <Globe size={13} />, color: 'text-cyan-400', label: 'Navigate' },
    browser_click: { icon: <MousePointer size={13} />, color: 'text-cyan-400', label: 'Click' },
    browser_screenshot: { icon: <Camera size={13} />, color: 'text-cyan-400', label: 'Screenshot' },
    list_requests: { icon: <Globe size={13} />, color: 'text-cyan-400', label: 'List Requests' },
    send_request: { icon: <Send size={13} />, color: 'text-blue-400', label: 'Send Request' },
    get_response: { icon: <Globe size={13} />, color: 'text-blue-400', label: 'Get Response' },
    think: { icon: <Brain size={13} />, color: 'text-purple-400', label: 'Thinking' },
    create_subagent: { icon: <Cpu size={13} />, color: 'text-purple-400', label: 'Spawn Sub-agent' },
    create_agent: { icon: <Cpu size={13} />, color: 'text-purple-400', label: 'Spawn Sub-agent' },
    agent_finish: { icon: <CheckCircle size={13} />, color: 'text-green-400', label: 'Sub-agent Finished' },
    finish_scan: { icon: <Flag size={13} />, color: 'text-green-400', label: 'Scan Finished' },
    scan_start_info: { icon: <Shield size={13} />, color: 'text-green-400', label: 'Scan Started' },
    subagent_start_info: { icon: <Cpu size={13} />, color: 'text-purple-400', label: 'Sub-agent Info' },
    create_vulnerability_report: { icon: <Bug size={13} />, color: 'text-red-400', label: 'Vulnerability Found' },
    notes_add: { icon: <BookOpen size={13} />, color: 'text-gray-400', label: 'Add Note' },
    create_note: { icon: <StickyNote size={13} />, color: 'text-gray-400', label: 'Create Note' },
    create_todo: { icon: <ListChecks size={13} />, color: 'text-yellow-400', label: 'Create Todo' },
    update_todo: { icon: <ListChecks size={13} />, color: 'text-yellow-400', label: 'Todo Update' },
    mark_todo_done: { icon: <CheckCircle size={13} />, color: 'text-green-400', label: 'Mark Done' },
    web_search: { icon: <Search size={13} />, color: 'text-cyan-400', label: 'Web Search' },
};

const getToolMeta = (toolName) => TOOL_META[toolName] ?? { icon: <Wrench size={13} />, color: 'text-blue-400', label: toolName };

/* ─────────────────────────────────────────────
   Tool Start entry
───────────────────────────────────────────── */
const ToolStartEntry = ({ content, ts }) => {
    const toolName = content?.tool ?? 'unknown';
    const { icon, color, label } = getToolMeta(toolName);
    const isVuln = toolName === 'create_vulnerability_report';
    const isScanEnd = toolName === 'finish_scan' || toolName === 'agent_finish';
    const wrapperClass = isVuln ? 'p-2 rounded bg-red-500/5 border border-red-500/20'
        : isScanEnd ? 'p-2 rounded bg-green-500/5 border border-green-500/20' : 'py-1';

    return (
        <div className={wrapperClass}>
            <div className="flex items-center gap-2 flex-wrap">
                <Timestamp ts={ts} />
                <span className={`${color} flex-shrink-0`}>{icon}</span>
                <span className={`font-bold text-xs ${color}`}>{label}</span>

                {toolName === 'terminal_execute' && content?.args?.command && (
                    <code className="text-green-300 text-xs font-mono">$ {content.args.command}</code>
                )}
                {toolName === 'think' && content?.args?.thought && (
                    <span className="text-gray-500 text-[10px] italic truncate max-w-[300px]">{content.args.thought.substring(0, 80)}…</span>
                )}
                {isVuln && content?.args?.title && <span className="text-red-300 text-xs font-bold">{content.args.title}</span>}
                {toolName === 'web_search' && content?.args?.query && <span className="text-cyan-300 text-xs">"{content.args.query}"</span>}
                {(toolName === 'browser_action' || toolName === 'browser_navigate') && content?.args?.url && (
                    <span className="text-cyan-300 text-xs truncate max-w-[300px]">{content.args.url}</span>
                )}
                {toolName === 'browser_action' && content?.args?.action && !content?.args?.url && (
                    <span className="text-cyan-500 text-[10px]">{content.args.action}</span>
                )}
                {toolName === 'create_note' && content?.args?.title && <span className="text-gray-300 text-xs italic">"{content.args.title}"</span>}
                {(toolName === 'create_agent' || toolName === 'create_subagent') && content?.args?.name && (
                    <span className="text-purple-300 text-xs font-semibold">{content.args.name}</span>
                )}
                {(toolName === 'mark_todo_done' || toolName === 'update_todo') && content?.args?.todo_id && (
                    <span className="text-yellow-500 text-[10px] font-mono">{content.args.todo_id}</span>
                )}
                {toolName === 'send_request' && content?.args?.method && (
                    <code className="text-blue-300 text-xs font-mono">{content.args.method} {content.args.url || content.args.path || ''}</code>
                )}
            </div>

            {isVuln && content?.args?.severity && (
                <div className="mt-1 ml-[68px]">
                    <SeverityBadge severity={content.args.severity} />
                    {content.args.content && <div className="text-gray-500 text-[10px] mt-1 leading-relaxed line-clamp-3">{content.args.content}</div>}
                </div>
            )}
            {(toolName === 'create_agent' || toolName === 'create_subagent') && content?.args?.task && (
                <div className="ml-[68px] text-gray-600 text-[10px] mt-0.5 leading-relaxed">{content.args.task}</div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Smart result renderers
───────────────────────────────────────────── */
const RequestsTable = ({ requests }) => (
    <div className="mt-1 overflow-x-auto">
        <div className="text-[9px] text-gray-600 mb-1">{requests.length} request{requests.length !== 1 ? 's' : ''} intercepted</div>
        <table className="w-full text-[10px] border-collapse">
            <thead>
                <tr className="text-gray-600 border-b border-gray-800">
                    <th className="text-left pr-2 pb-0.5 font-normal">Method</th>
                    <th className="text-left pr-2 pb-0.5 font-normal">Host</th>
                    <th className="text-left pr-2 pb-0.5 font-normal">Path</th>
                    <th className="text-left pr-2 pb-0.5 font-normal">Status</th>
                    <th className="text-left pb-0.5 font-normal">Len</th>
                </tr>
            </thead>
            <tbody>
                {requests.slice(0, 20).map((req) => {
                    const statusCode = req.response?.statusCode ?? req.statusCode;
                    const statusColor = !statusCode ? 'text-gray-600' : statusCode < 300 ? 'text-green-400' : statusCode < 400 ? 'text-yellow-400' : 'text-red-400';
                    return (
                        <tr key={req.id} className="border-b border-gray-900/60 hover:bg-gray-900/30">
                            <td className={`pr-2 py-0.5 font-bold ${req.method === 'POST' ? 'text-yellow-400' : 'text-cyan-400'}`}>{req.method}</td>
                            <td className="pr-2 py-0.5 text-gray-400 truncate max-w-[100px]">{req.host}</td>
                            <td className="pr-2 py-0.5 text-gray-300 truncate max-w-[160px]">{req.path}{req.query ? `?${req.query}` : ''}</td>
                            <td className={`pr-2 py-0.5 font-mono ${statusColor}`}>{statusCode ?? '—'}</td>
                            <td className="py-0.5 text-gray-500">{req.length}b</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        {requests.length > 20 && <div className="text-gray-700 text-[9px] mt-1">…and {requests.length - 20} more</div>}
    </div>
);

const TodoChecklist = ({ todos }) => (
    <div className="mt-1 space-y-0.5">
        {todos.map((todo, i) => {
            const done = todo.status === 'done';
            const inProg = todo.status === 'in_progress';
            return (
                <div key={todo.todo_id ?? i} className={`flex items-center gap-2 text-[10px] py-0.5 ${done ? 'text-gray-600' : 'text-gray-300'}`}>
                    <span className={done ? 'text-green-500' : inProg ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}>{done ? '✓' : inProg ? '⟳' : '○'}</span>
                    <span className={`truncate ${done ? 'line-through' : ''}`}>{todo.title}</span>
                    <span className={`shrink-0 text-[9px] px-1 rounded ${done ? 'bg-green-500/10 text-green-600' : inProg ? 'bg-yellow-500/10 text-yellow-600' : 'bg-gray-800 text-gray-600'}`}>{todo.status}</span>
                </div>
            );
        })}
    </div>
);

const ScreenshotResult = ({ screenshot, message }) => {
    const [expanded, setExpanded] = useState(false);
    if (!screenshot) return null;
    return (
        <div className="mt-1">
            {message && <div className="text-gray-500 text-[10px] mb-1">{message}</div>}
            <div className={`rounded overflow-hidden border border-gray-700 ${expanded ? '' : 'max-h-48 overflow-hidden'}`}>
                <img src={`data:image/png;base64,${screenshot}`} alt="Browser screenshot" className="w-full object-top object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setExpanded(e => !e)} title={expanded ? 'Click to collapse' : 'Click to expand'} />
            </div>
            <button onClick={() => setExpanded(e => !e)} className="mt-0.5 text-[9px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                <ChevronDown size={10} className={expanded ? 'rotate-180' : ''} />
                {expanded ? 'Collapse screenshot' : 'Expand screenshot'}
            </button>
        </div>
    );
};

const AgentSpawnResult = ({ data }) => (
    <div className="mt-1 p-1.5 rounded bg-purple-500/5 border border-purple-500/15 flex items-center gap-2 text-[10px]">
        <Cpu size={11} className="text-purple-400 shrink-0" />
        <span className="text-purple-300 font-bold">{data.agent_info?.name ?? 'Sub-agent'}</span>
        <span className="text-gray-600">•</span>
        <span className={`font-mono ${data.agent_info?.status === 'running' ? 'text-green-400' : 'text-gray-500'}`}>{data.agent_info?.status ?? 'started'}</span>
        {data.agent_id && <span className="text-gray-700 font-mono">{data.agent_id.substring(0, 12)}</span>}
    </div>
);

const CollapsibleRaw = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = text.length > 600;
    const displayText = !isLong || expanded ? text : text.substring(0, 600) + '\n… [truncated]';
    return (
        <div>
            <pre className="mt-1 text-gray-500 text-[10px] font-mono bg-gray-900/40 rounded p-2 overflow-x-auto whitespace-pre-wrap leading-relaxed">{displayText}</pre>
            {isLong && (
                <button onClick={() => setExpanded(e => !e)} className="mt-0.5 text-[9px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                    <ChevronDown size={10} className={expanded ? 'rotate-180' : ''} />
                    {expanded ? 'Collapse' : `Show all ${text.length.toLocaleString()} chars`}
                </button>
            )}
        </div>
    );
};

const SmartResultRenderer = ({ result }) => {
    if (result === null || result === undefined || result === '') return null;
    const parsed = tryParseJson(result);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0) return null;
    if (parsed?.screenshot !== undefined) {
        const isEmpty = !parsed.screenshot;
        if (isEmpty && parsed.message) return <div className="mt-0.5 text-[10px] text-gray-500 ml-1">{parsed.message}</div>;
        return <ScreenshotResult screenshot={parsed.screenshot} message={parsed.message} />;
    }
    if (parsed?.requests && Array.isArray(parsed.requests) && parsed.requests.length > 0) return <RequestsTable requests={parsed.requests} />;
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.method && parsed[0]?.host) return <RequestsTable requests={parsed} />;
    if (parsed?.todos && Array.isArray(parsed.todos)) return <TodoChecklist todos={parsed.todos} />;
    if (parsed?.agent_info || (parsed?.agent_id && parsed?.success !== undefined)) return <AgentSpawnResult data={parsed} />;
    if (parsed?.success === true && parsed?.message && Object.keys(parsed).length <= 4) return <div className="mt-0.5 text-[10px] text-green-600 ml-1">✓ {parsed.message}</div>;
    if (typeof parsed === 'string' && parsed.length <= 5) return null;
    const text = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
    return <CollapsibleRaw text={text} />;
};

const ToolUpdateEntry = ({ content, ts }) => {
    const ok = content?.status === 'completed';
    const err = content?.status === 'error' || content?.status === 'failed';
    const result = content?.result;
    return (
        <div className="ml-6 border-l border-gray-800 pl-3 py-0.5">
            <div className="flex items-center gap-2">
                <Timestamp ts={ts} />
                {ok ? <CheckCircle size={11} className="text-green-500" /> : err ? <XCircle size={11} className="text-red-500" /> : <AlertTriangle size={11} className="text-yellow-500" />}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${ok ? 'text-green-500' : err ? 'text-red-500' : 'text-yellow-500'}`}>{content?.status ?? 'unknown'}</span>
            </div>
            {result !== undefined && result !== null && <SmartResultRenderer result={result} />}
        </div>
    );
};

const StatusEntry = ({ content, ts, agentId }) => {
    if (!content?.status) return null;
    const st = content.status;
    const colors = { running: 'text-green-400', completed: 'text-blue-400', failed: 'text-red-400', stopped: 'text-gray-500', error: 'text-red-400' };
    return (
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <Timestamp ts={ts} />
            <span className={`font-bold uppercase ${colors[st] ?? 'text-gray-500'}`}>Agent {agentId?.substring(0, 8)} → {st}</span>
            {content?.error && <span className="text-red-500">{content.error}</span>}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Vulnerability panel
───────────────────────────────────────────── */
const SeverityBadge = ({ severity }) => {
    const s = (severity ?? '').toLowerCase();
    const cls = s === 'critical' ? 'bg-red-500 text-white' : s === 'high' ? 'bg-orange-500 text-white' : s === 'medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-gray-700 text-gray-300';
    return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${cls}`}>{s || 'unknown'}</span>;
};

const VulnCard = ({ args }) => (
    <div className="bg-gray-900 border border-red-500/20 p-2.5 rounded hover:bg-gray-800 transition-colors">
        <div className="mb-1"><SeverityBadge severity={args.severity} /></div>
        <div className="text-xs font-bold text-gray-200 leading-tight mb-1">{args.title ?? 'Unnamed Vulnerability'}</div>
        {args.content && <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-3">{args.content}</div>}
    </div>
);

export default AgentFeedPage;
