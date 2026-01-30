import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Square,
    Terminal,
    Bug,
    Shield,
    Cpu,
    Zap,
    Activity,
    Clock,
    DollarSign,
    Box,
    Hash,
    ChevronRight
} from 'lucide-react';
import { getScan, connectToAgentFeed, stopScan } from '../../services/offensiveService';

const AgentFeedPage = () => {
    const { scanId } = useParams();
    const navigate = useNavigate();
    const [scan, setScan] = useState(null);
    const [events, setEvents] = useState([]);
    const [scanStatus, setScanStatus] = useState('running');
    const [stats, setStats] = useState({
        runtime: 0,
        toolsUsed: 0,
        vulnsFound: 0,
        agentsCount: 1,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0.0000
    });
    const [agents, setAgents] = useState({ 'main': { id: 'main', name: 'DracoSec Agent', children: [] } });

    // Auto-scroll logic
    const terminalEndRef = useRef(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        loadScan();
        connectToFeed();

        // Runtime counter
        const interval = setInterval(() => {
            if (scanStatus === 'running') {
                setStats((prev) => ({ ...prev, runtime: prev.runtime + 1 }));
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [scanId]);

    // Smart Auto-scroll Logic
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const terminalContainerRef = useRef(null);

    // Effect: Scroll to bottom when events change, ONLY IF we should
    useEffect(() => {
        if (shouldAutoScroll && terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events, shouldAutoScroll]);

    // Handler: Check scroll position to unleash/leash auto-scroll
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // If user is within 100px of bottom, enable auto-scroll. Otherwise disable it.
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShouldAutoScroll(isNearBottom);
    };

    const loadScan = async () => {
        try {
            const data = await getScan(scanId);
            setScan(data);
            setScanStatus(data.status);
        } catch (error) {
            console.error('Error loading scan:', error);
        }
    };

    const connectToFeed = () => {
        const eventSource = connectToAgentFeed(
            scanId,
            handleEvent,
            handleComplete
        );
        eventSourceRef.current = eventSource;
    };

    const handleEvent = (data) => {
        setEvents((prev) => [...prev, data]);

        // Parse content if needed
        let content = data.content;
        try {
            if (typeof content === 'string') content = JSON.parse(content);
        } catch (e) { }

        // Agent Discovery Logic
        if (data.type === 'tool_update' && (data.content.includes('create_agent') || data.content.includes('subagent_start_info') || data.content.includes('agent_info'))) {
            try {
                let toolResult = content.result;
                if (typeof toolResult === 'string') toolResult = JSON.parse(toolResult);

                if (toolResult && toolResult.agent_info) {
                    const info = toolResult.agent_info;
                    setAgents(prev => {
                        const newAgents = { ...prev };
                        const parentId = info.parent_id || 'main'; // Default to main if no parent

                        // Add new agent
                        if (!newAgents[info.id]) {
                            newAgents[info.id] = { ...info, children: [] };

                            // Link to parent
                            if (newAgents[parentId]) {
                                if (!newAgents[parentId].children.includes(info.id)) {
                                    newAgents[parentId].children.push(info.id);
                                }
                            } else {
                                // If parent doesn't exist yet (race condition), add to main or create placeholder
                                if (!newAgents['main'].children.includes(info.id)) {
                                    newAgents['main'].children.push(info.id);
                                }
                            }
                        }
                        return newAgents;
                    });
                }
            } catch (e) {
                console.warn("Failed to parse agent info", e);
            }
        }

        // Update stats based on event type
        if (data.type === 'tool_start') {
            setStats((prev) => ({ ...prev, toolsUsed: prev.toolsUsed + 1 }));
        }
        if (data.type === 'vulnerability') {
            setStats((prev) => ({ ...prev, vulnsFound: prev.vulnsFound + 1 }));
        }
        if (data.type === 'stats') {
            // Update cost/token stats from backend
            setStats((prev) => ({
                ...prev,
                inputTokens: content.total?.input_tokens || prev.inputTokens,
                outputTokens: content.total?.output_tokens || prev.outputTokens,
                cost: content.total?.cost || prev.cost,
                agentsCount: content.agents_count || prev.agentsCount,
                toolsUsed: content.tools_count || prev.toolsUsed
            }));
        }
    };

    const handleComplete = (status) => {
        setScanStatus(status);
        loadScan();
    };

    const handleStopScan = async () => {
        if (!confirm('Are you sure you want to stop this attack?')) return;
        try {
            await stopScan(scanId);
            setScanStatus('stopped');
        } catch (error) {
            console.error('Failed to stop scan:', error);
            alert('Failed to stop scan. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono flex flex-col h-screen overflow-hidden">
            {/* Top Bar / Header */}
            <div className="border-b border-gray-800 bg-[#0a0a0a] p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/offensive')} className="p-2 hover:bg-gray-800 rounded transition-colors text-green-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-green-500" />
                            <h1 className="text-lg font-bold text-white tracking-wider">STRIX <span className="text-green-500">AGENT</span></h1>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>TARGET:</span>
                            <span className="text-cyan-400">{scan?.target || '...'}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats (TUI Style) */}
                <div className="flex items-center gap-6 text-sm">
                    <TuiStat label="RUNTIME" value={formatTime(stats.runtime)} icon={<Clock size={14} />} />
                    <TuiStat label="AGENTS" value={stats.agentsCount} icon={<Cpu size={14} />} color="text-purple-400" />
                    <TuiStat label="TOOLS" value={stats.toolsUsed} icon={<Terminal size={14} />} color="text-yellow-400" />
                    <TuiStat label="VULNS" value={stats.vulnsFound} icon={<Bug size={14} />} color="text-red-500" bold />
                    <TuiStat
                        label="COST"
                        value={`$${stats.cost.toFixed(4)}`}
                        icon={<DollarSign size={14} />}
                        color="text-green-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {scanStatus === 'running' && (
                        <button
                            onClick={handleStopScan}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all"
                        >
                            <Square size={12} fill="currentColor" /> Stop
                        </button>
                    )}
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase border ${scanStatus === 'running' ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' :
                        scanStatus === 'failed' || scanStatus === 'stopped' ? 'bg-red-500/20 border-red-500 text-red-400' :
                            'bg-gray-800 border-gray-600 text-gray-400'
                        }`}>
                        {scanStatus}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

                {/* Left Panel: Active Agents (Simulated Tree) */}
                <div className="col-span-2 border-r border-gray-800 bg-[#050505] p-0 flex flex-col">
                    <div className="p-2 border-b border-gray-800 bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Box size={12} /> Agents
                    </div>
                    <div className="p-2 space-y-1 overflow-y-auto flex-1">
                        <AgentNode agents={agents} agentId="main" />
                    </div>

                    <div className="p-2 border-t border-gray-800 bg-gray-900/50">
                        <div className="text-[10px] text-gray-600 uppercase font-bold mb-1">Tokens</div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">In:</span>
                            <span className="text-gray-300">{stats.inputTokens}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Out:</span>
                            <span className="text-gray-300">{stats.outputTokens}</span>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Terminal / Activity Feed */}
                <div
                    className="col-span-7 flex flex-col bg-black"
                >
                    <div className="p-2 border-b border-gray-800 bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={12} /> Live Trace
                    </div>
                    <div
                        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-4"
                        onScroll={handleScroll}
                        ref={terminalContainerRef}
                    >
                        {events.length === 0 && (
                            <div className="text-gray-600 italic text-center mt-10">Initializing scan environment...</div>
                        )}
                        {events.map((event, i) => (
                            <TerminalLogEntry key={i} event={event} />
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                </div>

                {/* Right Panel: Findings / Vulnerabilities */}
                <div className="col-span-3 border-l border-gray-800 bg-[#050505] flex flex-col">
                    <div className="p-2 border-b border-gray-800 bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Bug size={12} /> Findings
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {events.filter(e => e.type === 'vulnerability').length === 0 ? (
                            <div className="text-gray-600 text-xs text-center py-10">No vulnerabilities found yet.</div>
                        ) : (
                            events.filter(e => e.type === 'vulnerability').map((e, i) => {
                                let data = e.content;
                                try { if (typeof data === 'string') data = JSON.parse(data); } catch { }
                                return <VulnCard key={i} data={data} />;
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Components

const TuiStat = ({ label, value, icon, color = "text-white", bold }) => (
    <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] text-gray-600 font-bold mb-1 tracking-wider">{label}</span>
        <div className={`flex items-center gap-1.5 ${color} ${bold ? 'font-bold' : ''}`}>
            {icon}
            <span>{value}</span>
        </div>
    </div>
);

const TerminalLogEntry = ({ event }) => {
    let data = event.content;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch { }

    // Status update logic (ignore pure stats updates in feed to reduce noise)
    if (event.type === 'stats') return null;

    // Tool Renderers
    if (event.type === 'tool_start') {
        const toolName = data.tool;
        const Renderer = getToolRenderer(toolName);
        return <Renderer data={data} timestamp={event.timestamp} />;
    }

    if (event.type === 'tool_update') {
        const isSuccess = data.status === 'completed';
        const isError = data.status === 'error' || data.status === 'failed';
        return (
            <div className="ml-10 text-xs text-gray-500 mb-2 border-l border-gray-800 pl-3">
                <div className="flex items-center gap-2">
                    <span className={isSuccess ? 'text-green-500' : isError ? 'text-red-500' : 'text-yellow-500'}>
                        {isSuccess ? '✓' : isError ? '✗' : '⚠'}
                    </span>
                    <span className="uppercase font-bold text-[10px] tracking-wider">{data.status}</span>
                </div>
                {data.result && (
                    <div className="mt-1 text-gray-600 font-mono text-[10px] bg-gray-900/30 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {typeof data.result === 'string' ? data.result.substring(0, 1000) : JSON.stringify(data.result, null, 2).substring(0, 1000)}
                        {(typeof data.result === 'string' ? data.result.length : JSON.stringify(data.result).length) > 1000 && '...'}
                    </div>
                )}
            </div>
        );
    }

    if (event.type === 'chat') {
        let content = data.content;
        const role = data.role;
        const isUser = role === 'user';
        return (
            <div className={`my-2 pl-2 border-l-2 ${isUser ? 'border-purple-500' : 'border-blue-500'}`}>
                <div className={`text-xs font-bold mb-1 ${isUser ? 'text-purple-400' : 'text-blue-400'}`}>
                    {isUser ? 'USER COMMAND' : 'AGENT THOUGHT'}
                </div>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>
            </div>
        );
    }

    if (event.type === 'vulnerability') {
        return (
            <div className="my-2 p-3 bg-red-500/5 border border-red-500/20 rounded">
                <div className="text-red-500 font-bold flex items-center gap-2 mb-2">
                    <Bug size={16} /> VULNERABILITY FOUND: {data.title}
                </div>
                <div className="text-gray-400 text-xs">{data.content ? data.content.substring(0, 200) : ''}...</div>
            </div>
        );
    }

    return (
        <div className="text-gray-500 text-xs font-mono ml-4 opacity-50">
            {typeof event.content === 'string' ? event.content : JSON.stringify(event.content)}
        </div>
    );
};

// --- Tool Renderer Registry ---

const getToolRenderer = (toolName) => {
    if (toolName === 'terminal_execute') return TerminalToolRenderer;
    if (toolName === 'browser_action') return BrowserToolRenderer;
    if (toolName === 'think') return ThinkToolRenderer;
    if (['send_request', 'view_request', 'repeat_request', 'scope_rules', 'list_sitemap'].includes(toolName)) return ProxyToolRenderer;
    return DefaultToolRenderer;
};

const ThinkToolRenderer = ({ data, timestamp }) => {
    const thought = data.args?.thought || 'Thinking...';

    return (
        <div className="group mb-2 ml-4 border-l-2 border-purple-500/50 pl-3 py-1">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
                <span className="text-[10px] opacity-70 font-mono">[{new Date(timestamp).toLocaleTimeString()}]</span>
                <span className="text-sm">🧠</span>
                <span className="font-bold text-xs uppercase tracking-wider">Reasoning</span>
            </div>
            <div className="text-gray-400 italic text-xs leading-relaxed whitespace-pre-wrap">
                {thought}
            </div>
        </div>
    );
};

const TerminalToolRenderer = ({ data, timestamp }) => {
    const command = data.args?.command || '';
    const isSpecial = command.startsWith('C-') || command.startsWith('^') || ['Enter', 'Escape'].includes(command);

    return (
        <div className="group mb-1">
            <div className="flex items-center gap-2 text-green-500/80">
                <span className="text-xs opacity-50 font-mono">[{new Date(timestamp).toLocaleTimeString()}]</span>
                <span className="text-gray-500 font-bold">&gt;_</span>
                {isSpecial ? (
                    <span className="text-red-400 font-bold">{command}</span>
                ) : (
                    <span className="text-green-400 font-mono font-bold">$ {command}</span>
                )}
            </div>
        </div>
    );
};

const BrowserToolRenderer = ({ data, timestamp }) => {
    const args = data.args || {};
    const action = args.action || 'unknown';
    let message = action;

    if (action === 'goto') message = `navigating to ${args.url}`;
    if (action === 'click') message = `clicking element`;
    if (action === 'type') message = `typing "${args.text}"`;
    if (action === 'screenshot') message = `taking screenshot`;

    return (
        <div className="group mb-1">
            <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-xs opacity-50 font-mono text-gray-500">[{new Date(timestamp).toLocaleTimeString()}]</span>
                <span className="text-lg">🌐</span>
                <span className="font-bold">{message}</span>
            </div>
        </div>
    );
};

const ProxyToolRenderer = ({ data, timestamp }) => {
    const toolName = data.tool;
    const args = data.args || {};
    let icon = '👀';
    let color = 'text-cyan-400';
    let label = 'Viewing';
    let detail = '';

    if (toolName === 'send_request') {
        icon = '📤';
        label = `Sending ${args.method || 'GET'}`;
        detail = args.url;
    } else if (toolName === 'view_request') {
        icon = '👀';
        label = `Viewing ${args.part || 'request'}`;
    }

    return (
        <div className="group mb-1">
            <div className="flex items-center gap-2">
                <span className="text-xs opacity-50 font-mono text-gray-500">[{new Date(timestamp).toLocaleTimeString()}]</span>
                <span>{icon}</span>
                <span className={`${color} font-bold`}>{label}</span>
            </div>
            {detail && <div className="ml-14 text-xs text-gray-500 truncate font-mono">{detail}</div>}
        </div>
    );
};

const DefaultToolRenderer = ({ data, timestamp }) => (
    <div className="group mb-1">
        <div className="flex items-center gap-2 text-blue-400">
            <span className="text-xs opacity-50 font-mono text-gray-500">[{new Date(timestamp).toLocaleTimeString()}]</span>
            <ChevronRight size={14} />
            <span className="font-bold">Using tool <span className="text-blue-500">{data.tool}</span></span>
        </div>
        {data.args && Object.keys(data.args).length > 0 && (
            <div className="ml-10 text-xs text-gray-500 pl-3">
                {Object.keys(data.args).slice(0, 2).map(k => (
                    <span key={k} className="mr-3"><span className="text-gray-600">{k}:</span> {String(data.args[k]).substring(0, 30)}</span>
                ))}
            </div>
        )}
    </div>
);

const VulnCard = ({ data }) => (
    <div className="bg-gray-900 border border-red-500/20 p-3 rounded-sm mb-2 hover:bg-gray-800 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start mb-1">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${data.severity === 'critical' ? 'bg-red-500 text-white' :
                data.severity === 'high' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500/20 text-yellow-500'
                }`}>
                {data.severity}
            </span>
            <span className="text-[10px] text-gray-600">Now</span>
        </div>
        <div className="text-sm font-bold text-gray-300 group-hover:text-white leading-tight mb-1">
            {data.title}
        </div>
        <div className="text-[10px] text-gray-500 truncate">
            {data.vulnerability_type}
        </div>
    </div>
);

// Recursive Agent Tree Component
const AgentNode = ({ agents, agentId, depth = 0 }) => {
    const agent = agents[agentId];
    if (!agent) return null;

    return (
        <div className="select-none">
            <div
                className={`p-2 text-sm font-bold flex items-center gap-2 border-l-2
                ${agentId === 'main' ? 'bg-green-500/10 border-green-500 text-green-400' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}
                style={{ marginLeft: `${depth * 12}px` }}
            >
                {agentId === 'main' ? <Cpu size={14} /> : <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>}
                {agent.name}
                {agent.status === 'completed' && <span className="text-green-500 text-[10px]">✓</span>}
            </div>
            {agent.children && agent.children.map(childId => (
                <AgentNode key={childId} agents={agents} agentId={childId} depth={depth + 1} />
            ))}
        </div>
    );
};

export default AgentFeedPage;
