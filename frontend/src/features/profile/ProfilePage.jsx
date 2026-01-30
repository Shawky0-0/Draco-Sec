import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Shield, Settings, Crown, Check, Zap, Calendar,
    ChevronRight, Mail, Lock, X, Key
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Plan Details Mapping - Defined outside component to prevent recreation
const PLAN_DETAILS = {
    "Basic": {
        name: "Basic Plan",
        price: "$99 / month",
        features: [
            "Offensive module access",
            "5 AI Pentests / month",
            "DracoAI",
            "Email Support (Business Hours)"
        ]
    },
    "Pro": {
        name: "Pro Plan",
        price: "$349 / month",
        features: [
            "Offensive module access",
            "20 AI Pentests / month",
            "DracoAI",
            "Standard Support (12/7)"
        ]
    },
    "Professional": {
        name: "Pro Plan",
        price: "$349 / month",
        features: [
            "Offensive module access",
            "20 AI Pentests / month",
            "DracoAI",
            "Standard Support (12/7)"
        ]
    },
    "Enterprise": {
        name: "Enterprise Plan",
        price: "Custom",
        features: [
            "Full platform access (Offensive + Defensive)",
            "30 AI Pentests / month",
            "Real-time monitoring",
            "File & malware scanning",
            "Phishing campaigns",
            "DracoAI",
            "Priority Support (24/7)"
        ]
    }
};

export const ProfilePage = () => {
    const { user: authUser } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLicenseOpen, setIsLicenseOpen] = useState(false);

    // Merge authUser with robust defaults
    const user = authUser ? {
        name: authUser.name || "User",
        email: authUser.email || "",
        avatar: authUser.avatar,
        plan: authUser.plan || "Basic",
        username: authUser.username || "", // Ensure username exists for license acts
        scans_remaining: authUser.scans_remaining ?? 0,
        days_remaining: authUser.days_remaining ?? 0
    } : null;

    // 1. Critical Guard Clause: If context is loading or user is explicitly null
    if (!user) {
        return <div className="p-10 text-white animate-pulse">Loading Profile...</div>;
    }

    // Determine plan details safely
    const userTier = user.plan; // "Basic", "Pro", "Enterprise"
    const currentPlan = PLAN_DETAILS[userTier] || PLAN_DETAILS["Basic"];
    const isEnterprise = userTier === 'Enterprise';

    // Math safety for progress bar
    const maxScans = userTier === 'Enterprise' ? 30 : (userTier === 'Pro' || userTier === 'Professional' ? 20 : 5);
    const scansRemaining = user.scans_remaining;

    // Prevent negative numbers or NaN display
    const scansLeftDisplay = Math.max(0, scansRemaining);

    // Calculate progress percentage, handling division by zero/NaN
    const used = Math.max(0, maxScans - scansRemaining);
    let progress = 0;
    if (maxScans > 0) {
        progress = (used / maxScans) * 100;
    }
    // Clamp progress 0-100
    progress = Math.min(100, Math.max(0, progress));

    // Calculate days remaining (or default to 0 if missing)
    const daysLeft = user.days_remaining ?? 0;

    return (
        <div className="flex flex-col w-full gap-5 relative">
            {/* ... Header Section ... */}
            <div className="w-full bg-gradient-to-r from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neutral-800 to-black p-[2px] shadow-2xl">
                                <div className="w-full h-full rounded-[14px] bg-black/50 overflow-hidden relative">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-neutral-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    )}
                                </div>
                            </div>
                            {isEnterprise && (
                                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-indigo-400 to-cyan-600 text-white p-1.5 rounded-lg border-2 border-[#0a0a0a] shadow-lg">
                                    <Crown size={14} fill="currentColor" />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white tracking-tight font-display">{user.name || user.username}</h1>
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
                                    {currentPlan.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-neutral-400 font-medium">
                                <span>@{user.username}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                <span>{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* License Duration Card (Restored) */}
                        <div className="flex flex-col px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl min-w-[140px]">
                            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">Remaining</p>
                            <p className="text-2xl font-bold text-white tracking-tight">
                                {daysLeft} Days
                            </p>
                        </div>

                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 w-full">

                {/* Scans Column */}
                <div className="flex flex-col">
                    <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-semibold text-white">Resource Allocation</h3>
                            {scansRemaining < 2 && !isEnterprise && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
                                    <Zap size={12} fill="currentColor" />
                                    Low Credits
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-neutral-300 font-medium">Pentest Scans</span>
                                <div className="text-right">
                                    <span className="text-3xl font-bold text-white tracking-tight">{scansLeftDisplay}</span>
                                    <span className="text-neutral-500 text-sm ml-1 font-medium">remaining</span>
                                </div>
                            </div>
                            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Info (Same as before) */}
                <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-3xl p-8 relative h-full flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6">Current Plan</h3>
                        <div className="flex flex-col gap-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 blur-xl -z-10" />
                            <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
                                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                    {isEnterprise ? <Crown size={24} /> : <Shield size={24} />}
                                </div>
                                <div>
                                    <p className="text-xl font-bold tracking-tight text-white">{currentPlan.name}</p>
                                    <p className="text-sm font-medium mt-1 text-indigo-400/80">{currentPlan.price}</p>
                                </div>
                            </div>
                            <ul className="space-y-4 mt-2">
                                {(currentPlan.features || []).map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-neutral-300 font-medium">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-500">
                                            <Check size={14} />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-auto pt-8">
                            {!isEnterprise && (
                                <div className="mb-4">
                                    <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-3 text-center">Want to upgrade?</p>
                                    <button className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5">Contact Us</button>
                                </div>
                            )}
                            <button onClick={() => setIsLicenseOpen(true)} className="w-full py-3.5 rounded-xl border border-white/10 bg-transparent text-white/50 font-medium text-sm hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                                <Key size={14} /> Enter License Key
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} user={user} />}
            {isLicenseOpen && <LicenseModal onClose={() => setIsLicenseOpen(false)} />}
        </div>
    );
};

// Enhanced Settings Modal
const SettingsModal = ({ onClose, user }) => {
    const { updateProfile, changePassword } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form States
    const [formData, setFormData] = useState({
        first_name: user.name.split(' ')[0] || '',
        last_name: user.name.split(' ')[1] || '',
        email: user.email || ''
    });

    const [passData, setPassData] = useState({
        old: '',
        new: '',
        confirm: ''
    });

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await updateProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Update failed. Try logging in again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passData.new !== passData.confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passData.new.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await changePassword(passData.old, passData.new);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPassData({ old: '', new: '', confirm: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Password change failed' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-black border border-white/20 rounded-none overflow-hidden shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)] flex flex-col md:flex-row h-[600px] ring-1 ring-white/10">

                {/* Sidebar */}
                <div className="w-full md:w-72 bg-neutral-950 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-2 relative">
                    {/* Decorative Neon Line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

                    {/* User Profile Summary */}
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10 px-2">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border border-white/30 bg-black flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                                {user.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover grayscale" />
                                ) : (
                                    <span className="font-mono font-bold text-lg text-white">{user.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-white font-bold text-sm tracking-wide truncate font-mono">{user.name}</h3>
                            <p className="text-neutral-500 text-[10px] uppercase tracking-wider truncate">@{user.username}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold tracking-wide transition-all duration-200 border-l-2 ${activeTab === 'general' ? 'bg-white/5 text-white border-white shadow-[inset_10px_0_20px_-10px_rgba(255,255,255,0.1)]' : 'border-transparent text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <User size={16} className={activeTab === 'general' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-neutral-600'} />
                        GENERAL
                        {activeTab === 'general' && <ChevronRight size={14} className="ml-auto opacity-100 animate-pulse" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold tracking-wide transition-all duration-200 border-l-2 ${activeTab === 'security' ? 'bg-white/5 text-white border-white shadow-[inset_10px_0_20px_-10px_rgba(255,255,255,0.1)]' : 'border-transparent text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield size={16} className={activeTab === 'security' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-neutral-600'} />
                        SECURITY
                        {activeTab === 'security' && <ChevronRight size={14} className="ml-auto opacity-100 animate-pulse" />}
                    </button>

                    <div className="mt-auto">
                        <button onClick={onClose} className="group w-full flex items-center justify-center gap-2 text-neutral-500 hover:text-white text-xs font-mono uppercase tracking-widest py-4 border-t border-white/10 transition-colors">
                            <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Close Panel</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                    {/* Header */}
                    <div className="p-8 pb-6 border-b border-white/5">
                        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2 font-mono uppercase">
                            {activeTab === 'general' ? '// GENERAL_INFO' : '// SECURITY_PROTOCOLS'}
                        </h2>
                        <div className="h-1 w-20 bg-white shadow-[0_0_10px_white]" />
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`mb-8 p-4 border-l-4 font-mono text-xs ${message.type === 'error' ? 'bg-red-950/30 border-red-500 text-red-400' : 'bg-emerald-950/30 border-emerald-500 text-emerald-400'}`}
                            >
                                <span className="font-bold flex items-center gap-2">
                                    {message.type === 'error' ? '>> ERROR:' : '>> SUCCESS:'}
                                    {message.text}
                                </span>
                            </motion.div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-8 max-w-lg">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">First Name</label>
                                        <input
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Last Name</label>
                                        <input
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Email Interface</label>
                                    <div className="relative">
                                        <input
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm pl-10"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-white transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-3 opacity-50">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">User Identity (Immutable)</label>
                                    <div className="relative">
                                        <input className="w-full bg-neutral-900 border border-neutral-800 rounded-none px-4 py-3 text-neutral-500 font-mono text-sm cursor-not-allowed pl-10" value={user.username} readOnly />
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-neutral-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] disabled:opacity-50 disabled:shadow-none font-mono flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <span className="animate-spin text-black"><Zap size={16} /></span> : <Check size={16} />}
                                        {isLoading ? 'EXECUTING...' : 'COMMIT CHANGES'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 max-w-lg">
                                <div className="space-y-3 group">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Current Key</label>
                                    <input
                                        type="password"
                                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm placeholder-neutral-800"
                                        placeholder="INPUT_OLD_PASSWORD"
                                        value={passData.old}
                                        onChange={e => setPassData({ ...passData, old: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">New Key</label>
                                        <input
                                            type="password"
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm placeholder-neutral-800"
                                            placeholder="INPUT_NEW_PASSWORD"
                                            value={passData.new}
                                            onChange={e => setPassData({ ...passData, new: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3 group">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 group-focus-within:text-white transition-colors">Verify Key</label>
                                        <input
                                            type="password"
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-none px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-black focus:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)] transition-all font-mono text-sm placeholder-neutral-800"
                                            placeholder="CONFIRM_PASSWORD"
                                            value={passData.confirm}
                                            onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border border-white/10 bg-white/5 flex gap-4 items-start">
                                    <div className="mt-1"><Shield size={14} className="text-white" /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">Security Protocol</h4>
                                        <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                                            > 8+ characters required<br />
                                            > Mix alphanumeric strongly recommended<br />
                                            > Changes logged in system audit
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-neutral-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] disabled:opacity-50 disabled:shadow-none font-mono flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <span className="animate-spin text-black"><Zap size={16} /></span> : <Lock size={16} />}
                                        {isLoading ? 'UPDATING...' : 'UPDATE CREDENTIALS'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

const LicenseModal = ({ onClose }) => {
    const { activateLicense, user } = useAuth();
    const [key, setKey] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const handleActivate = async () => {
        if (!key.trim()) return;
        setStatus('loading');
        try {
            const result = await activateLicense(user.username, key.trim());
            setStatus('success');
            setMessage(`Success: ${result.tier}`);
            // Small delay to read message, then close
            setTimeout(onClose, 1500);
        } catch (error) {
            setStatus('error');
            const detail = error.response?.data?.detail;
            const errorMsg = typeof detail === 'string'
                ? detail
                : (Array.isArray(detail) ? detail[0]?.msg : JSON.stringify(detail)) || "Error activating license";
            setMessage(errorMsg);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Activate License</h2>
                    <button onClick={onClose}><X size={20} className="text-white/50 hover:text-white" /></button>
                </div>

                <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4"
                    placeholder="LICENSE-KEY"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                />

                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleActivate}
                    disabled={status === 'loading'}
                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                    {status === 'loading' ? 'Verifying...' : 'Activate'}
                </button>
            </div>
        </div>
    );
}
