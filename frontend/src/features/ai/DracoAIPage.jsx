
import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, X, Trash2, Brain, Terminal, Shield, Sword, Menu, Copy, Edit2, Check, Square } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import API_BASE_URL from '../../config/api';

// --- Markdown Formatter ---
const FormatMessage = ({ content }) => {
    const formatText = (text) => {
        if (!text) return '';
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/```([\s\S]*?)```/g, '<div class="bg-white/5 p-4 rounded-lg my-3 overflow-x-auto font-mono text-sm text-green-400 border border-white/10"><pre>$1</pre></div>')
            .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm text-blue-300">$1</code>')
            .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li class="ml-4 list-disc marker:text-gray-500">$1</li>')
            .replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal marker:text-gray-500">$1</li>')
            .replace(/\n/g, '<br />');
        return formatted;
    };
    return <div dangerouslySetInnerHTML={{ __html: formatText(content) }} className="prose prose-invert max-w-none text-[0.95rem] leading-[1.7] text-white/90" />;
};

export const DracoAIPage = () => {
    // Single Unified Mode ("Draco")
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [chatTitle, setChatTitle] = useState('');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [welcomeText, setWelcomeText] = useState("Draco AI at your service. What's the mission?");
    const [welcomeOpacity, setWelcomeOpacity] = useState(1);

    // Persistence State
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);

    // Edit & Copy State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Sidebar Title Edit State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleEditValue, setTitleEditValue] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const API_URL = API_BASE_URL;

    // Helper to format time specifically for sidebar
    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        // Ensure date is treated as UTC if naive
        const dateStr = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;

        return date.toLocaleDateString();
    };

    // Shared function to fetch AI response based on a specific message history
    const abortControllerRef = useRef(null);
    const typingIntervalRef = useRef(null);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        setIsLoading(false);
    };

    const generateResponse = async (currentMessages) => {
        setIsLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Abort previous if any
        if (abortControllerRef.current) abortControllerRef.current.abort();

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const API_URL = API_BASE_URL;
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    messages: currentMessages,
                    mode: 'offensive',
                    conversation_id: currentConversationId
                }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            const fullResponse = data.response;

            // Update conversation state if new or title changed
            if (data.conversation_id && data.conversation_id !== currentConversationId) {
                setCurrentConversationId(data.conversation_id);
                fetchConversations();
            }
            if (data.title) {
                setChatTitle(data.title);
                fetchConversations();
            }

            // Add placeholder for streaming
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            // Keep loading true while typing
            setIsLoading(true);

            let i = 0;
            typingIntervalRef.current = setInterval(() => {
                if (i < fullResponse.length) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'assistant') {
                            lastMsg.content = fullResponse.substring(0, i + 1);
                        }
                        return newMessages;
                    });
                    i++;
                } else {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                    setIsLoading(false);
                }
            }, 10);
        } catch (error) {
            if (error.name === 'AbortError') {
                setIsLoading(false);
                return;
            }
            setMessages(prev => [...prev, { role: 'assistant', content: `**Error**: ${error.message}` }]);
            setIsLoading(false);
        } finally {
            // Only focus if not aborted/still operating
            if (!abortControllerRef.current && textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    const isChatEmpty = messages.length === 0;

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Welcome text transition effect with smooth fade
    useEffect(() => {
        if (isChatEmpty) {
            setWelcomeText("Draco AI at your service. What's the mission?");
            setWelcomeOpacity(1);

            const timer = setTimeout(() => {
                // Fade out
                setWelcomeOpacity(0);

                // Change text during fade
                setTimeout(() => {
                    setWelcomeText("How can I assist you today?");
                    // Fade in
                    setWelcomeOpacity(1);
                }, 500); // Match the CSS transition duration
            }, 9000);

            return () => clearTimeout(timer);
        }
    }, [isChatEmpty]);

    // Placeholder rotation logic
    const placeholderQuestions = [
        'How do I test for SQL injection vulnerabilities?',
        'What are the best tools for network scanning?',
        'Explain how to exploit an XSS vulnerability',
        'How can I perform a penetration test on a web application?',
        'How do I find and exploit RCE vulnerabilities?',
    ];

    useEffect(() => {
        if (!isChatEmpty) {
            setPlaceholder('Ask me anything...');
            return;
        }

        let currentQIndex = 0;
        let charIndex = 0;
        let isTyping = true;
        let timeoutId;

        const type = () => {
            const currentQ = placeholderQuestions[currentQIndex];
            if (isTyping) {
                if (charIndex < currentQ.length) {
                    setPlaceholder(prev => currentQ.substring(0, charIndex + 1));
                    charIndex++;
                    timeoutId = setTimeout(type, 50);
                } else {
                    isTyping = false;
                    timeoutId = setTimeout(type, 3000);
                }
            } else {
                currentQIndex = (currentQIndex + 1) % placeholderQuestions.length;
                charIndex = 0;
                isTyping = true;
                setPlaceholder('');
                timeoutId = setTimeout(type, 100);
            }
        };

        timeoutId = setTimeout(type, 100);
        return () => clearTimeout(timeoutId);
    }, [isChatEmpty]);

    // Auth Helper
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    };

    // Load history (Unified)
    const fetchConversations = async () => {
        try {
            const res = await fetch(`${API_URL}/ai/conversations`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (e) {
            console.error("Failed to fetch conversations", e);
        }
    };

    const loadConversation = async (id) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/ai/conversations/${id}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setChatTitle(data.title);
                setCurrentConversationId(data.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            if (window.innerWidth < 768) setShowSidebar(false);
        }
    };

    const deleteConversation = async (id, e) => {
        if (e) e.stopPropagation();

        try {
            await fetch(`${API_URL}/ai/conversations/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            setConversations(prev => prev.filter(c => c.id !== id));
            setDeleteConfirmId(null); // Reset
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setMessages([]);
                setChatTitle('');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renameConversation = async (id, newTitle) => {
        try {
            await fetch(`${API_URL}/ai/conversations/${id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title: newTitle })
            });
            fetchConversations(); // refresh list
            if (currentConversationId === id) setChatTitle(newTitle);
        } catch (e) {
            console.error(e);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchConversations();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    // GENERATE TITLE FUNCTION
    const generateTitle = async (firstMessage) => {
        // Now handled by backend mostly, but we can call it if needed for immediate update
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const newHistory = [...messages, userMsg];

        setMessages(newHistory);
        setInput('');

        // Trigger generic generation
        await generateResponse(newHistory);
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idx);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startEditing = (idx, content) => {
        setEditingMessageId(idx);
        setEditContent(content);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const saveEdit = (idx) => {
        if (!editContent.trim()) return;

        // Keep messages up to the one being edited, update it, discard the rest
        const historyUpToEdit = messages.slice(0, idx);
        const updatedMsg = { role: 'user', content: editContent };
        const newHistory = [...historyUpToEdit, updatedMsg];

        setMessages(newHistory);
        setEditingMessageId(null);
        setEditContent('');

        // Regenerate response for the new context
        generateResponse(newHistory);
    };

    const handleClear = () => {
        startNewChat();
    };

    const startNewChat = () => {
        setMessages([]);
        setChatTitle('');
        setCurrentConversationId(null);
        if (window.innerWidth < 768) setShowSidebar(false);
    };

    return (
        <div className="flex-1 flex flex-col p-0 m-0 w-full h-full bg-black overflow-hidden relative font-sans">

            {/* Chat History Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-[350px] bg-[#0a0a0a] border-r border-[#1f1f1f] z-50 transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
                        <h3 className="text-white font-bold text-base tracking-wide">Chat History</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={startNewChat}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                                title="New Chat"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {conversations.length > 0 ? (
                            conversations.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => loadConversation(chat.id)}
                                    className={`
                                        bg-[#111] p-3 rounded-lg border cursor-pointer transition-colors group relative min-h-[60px] flex items-center
                                        ${currentConversationId === chat.id ? 'bg-[#1a1a1a] border-white/10' : 'border-white/5 hover:bg-[#1a1a1a]'}
                                    `}
                                >
                                    {isEditingTitle && titleEditValue.id === chat.id ? (
                                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                value={titleEditValue.text}
                                                onChange={(e) => setTitleEditValue({ ...titleEditValue, text: e.target.value })}
                                                className="bg-[#222] text-white text-sm px-2 py-1 rounded border border-white/10 outline-none w-full"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        renameConversation(chat.id, titleEditValue.text);
                                                        setIsEditingTitle(false);
                                                    }
                                                    if (e.key === 'Escape') setIsEditingTitle(false);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    renameConversation(chat.id, titleEditValue.text);
                                                    setIsEditingTitle(false);
                                                }}
                                                className="text-green-500 hover:text-green-400 p-1 flex-shrink-0"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditingTitle(false);
                                                }}
                                                className="text-gray-500 hover:text-gray-300 p-1 flex-shrink-0"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : deleteConfirmId === chat.id ? (
                                        <div className="flex items-center justify-between w-full gap-2" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-red-400 text-sm font-medium">Delete?</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => deleteConversation(chat.id, e)}
                                                    className="p-1 px-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-xs transition-colors"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirmId(null);
                                                    }}
                                                    className="p-1 px-2 bg-white/5 text-gray-400 hover:bg-white/10 rounded text-xs transition-colors"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full gap-3">
                                            <div className="flex-1 overflow-hidden">
                                                <h3 className={`font-medium text-sm truncate transition-colors ${currentConversationId === chat.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                    {chat.title || 'Untitled Chat'}
                                                </h3>
                                                <p className="text-[#666] text-xs mt-0.5">
                                                    {formatRelativeTime(chat.updated_at)}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTitleEditValue({ id: chat.id, text: chat.title });
                                                        setIsEditingTitle(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                    title="Rename Chat"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirmId(chat.id);
                                                        setIsEditingTitle(false);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors"
                                                    title="Delete Chat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-600 text-sm mt-8 italic">
                                No chat history yet
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            {/* Overlay when sidebar is open */}
            {
                showSidebar && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        onClick={() => setShowSidebar(false)}
                    />
                )
            }

            <div className="flex flex-col w-full h-full items-center justify-center relative">

                {/* Chat Area */}
                <main className="bg-transparent flex flex-col items-center justify-center w-full max-w-[1200px] h-full px-5 pb-[140px] relative">

                    {/* Welcome Title - Only show when chat is empty */}
                    {isChatEmpty && (
                        <div className="flex flex-col items-center justify-center text-center gap-4 w-full absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 px-4">
                            <h1
                                className="text-2xl md:text-3xl font-medium tracking-tight transition-opacity duration-500"
                                style={{ opacity: welcomeOpacity, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400, letterSpacing: '-0.02em' }}
                            >
                                {welcomeText}
                            </h1>
                        </div>
                    )}

                    {/* Messages */}
                    <div
                        className="flex-1 w-full max-w-[1100px] overflow-y-auto overflow-x-hidden px-[60px] py-5 flex flex-col items-stretch justify-start gap-5 relative mt-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                        style={{ display: isChatEmpty ? 'none' : 'flex' }}
                    >
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col w-full animate-fade-in group/msg ${msg.role === 'user' ? 'items-end' : 'items-start pl-0'}`}>

                                {editingMessageId === idx ? (
                                    <div className="flex flex-col w-full max-w-[80%] gap-2 p-3 bg-[#2f2f2f] rounded-xl border border-white/10">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-transparent text-white/90 text-[0.95rem] outline-none resize-none min-h-[60px]"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={cancelEditing}
                                                className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => saveEdit(idx)}
                                                className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                                            >
                                                Save & Regenerate
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-end w-full">
                                        <div className={`p-0 text-[0.95rem] leading-[1.6] text-gray-100 relative group/bubble ${msg.role === 'user' ? 'bg-[#2f2f2f] px-[18px] py-3 rounded-xl text-gray-100 max-w-[80%]' : 'bg-transparent max-w-full w-full'}`}>
                                            <FormatMessage content={msg.content} />
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleCopy(msg.content, idx)}
                                                        className="p-1 text-gray-400 hover:text-white rounded-md transition-colors flex items-center gap-1.5 text-xs"
                                                        title="Copy"
                                                    >
                                                        {copiedId === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="flex items-center gap-2 mt-1 mr-1 justify-end opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditing(idx, msg.content)}
                                                    className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(msg.content, idx)}
                                                    className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
                                                    title="Copy"
                                                >
                                                    {copiedId === idx ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex flex-col w-full items-start pl-0">
                                <div className="flex gap-1 py-3">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Section */}
                    <div className={`${isChatEmpty ? 'absolute' : 'fixed'} bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] px-5 pb-10 pt-5 flex flex-col gap-3 z-10 transition-all duration-300 ease-in-out ${isChatEmpty ? 'top-1/2 bottom-auto -translate-y-[40%] bg-transparent p-0' : 'bg-gradient-to-t from-black via-black/80 to-transparent'}`}>

                        <div className="w-full max-w-[950px] mx-auto flex items-end gap-3">
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="flex-none p-2 w-10 h-10 bg-white/5 border border-white/10 rounded-full text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 mb-1.5"
                                title="Open Menu"
                            >
                                <Menu size={20} />
                            </button>

                            <div
                                className={`flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-3xl px-5 py-1.5 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${isLoading ? 'opacity-80' : 'focus-within:border-white/20 focus-within:bg-white/8 focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'}`}
                            >
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    disabled={isLoading}
                                    placeholder={isLoading ? "Draco AI is thinking..." : placeholder}
                                    rows={1}
                                    className="flex-1 bg-transparent border-none text-white/80 font-inherit text-[0.95rem] leading-6 py-2.5 resize-none outline-none max-h-[120px] min-h-[24px] overflow-hidden placeholder:text-white/35 disabled:cursor-not-allowed"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                />
                                {isLoading ? (
                                    <button
                                        onClick={handleStop}
                                        className="flex-none p-0 w-10 h-10 bg-white/10 border-none rounded-full text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:scale-105 active:scale-95"
                                        title="Stop Generating"
                                    >
                                        <Square size={16} fill="currentColor" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className="flex-none p-0 w-10 h-10 bg-white/10 border-none rounded-full text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/15 hover:text-white/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Send Message"
                                    >
                                        <Send size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Helpers - Hidden */}
                        <div className="flex justify-center gap-3 mt-1 opacity-0">
                            {/* Placeholder for spacing */}
                        </div>
                    </div>
                </main>
            </div>
        </div >
    );
};
