import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Shield, Settings, Crown, Check, Zap, Calendar,
    ChevronRight, Mail, Lock, X, Key, Bell, Send
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
        days_remaining: authUser.days_remaining ?? 0,
        is_expired: authUser.is_expired ?? false,
        telegram_chat_id: authUser.telegram_chat_id,
        telegram_bot_token: authUser.telegram_bot_token
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
    const isExpired = user.is_expired ?? false;

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
                        {/* License Duration Card */}
                        <div className={`flex flex-col px-6 py-3 rounded-2xl backdrop-blur-sm shadow-xl min-w-[140px] border ${isExpired
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-white/5 border-white/10'
                            }`}>
                            <p className={`text-xs font-medium uppercase tracking-wide mb-0.5 ${isExpired ? 'text-red-400' : 'text-neutral-400'
                                }`}>
                                {isExpired ? 'License' : 'Remaining'}
                            </p>
                            {isExpired ? (
                                <p className="text-xl font-bold text-red-400 tracking-tight">Expired</p>
                            ) : (
                                <p className="text-2xl font-bold text-white tracking-tight">{daysLeft} Days</p>
                            )}
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

// Redesigned Settings Modal - matches app design language
const SettingsModal = ({ onClose, user }) => {
    const { updateProfile, changePassword, testTelegram } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        first_name: user.name.split(' ')[0] || '',
        last_name: user.name.split(' ')[1] || '',
        email: user.email || '',
        telegram_chat_id: user.telegram_chat_id || '',
        telegram_bot_token: user.telegram_bot_token || ''
    });

    const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

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
        if (passData.new !== passData.confirm) { setMessage({ type: 'error', text: 'New passwords do not match' }); return; }
        if (passData.new.length < 8) { setMessage({ type: 'error', text: 'Password must be at least 8 characters' }); return; }
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

    const handleTestTelegram = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const data = await testTelegram(formData.telegram_chat_id, formData.telegram_bot_token);
            setMessage({ type: 'success', text: data.message || 'Test message sent!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to send test message' });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder-white/20";
    const labelClass = "block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider";
    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative w-full max-w-3xl bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                style={{ maxHeight: '85vh' }}
            >
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col">
                    {/* User Profile Summary */}
                    <div className="p-6 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                {user.avatar
                                    ? <img src={user.avatar} className="w-full h-full object-cover rounded-2xl" alt="avatar" />
                                    : <span className="text-lg font-bold text-white">{user.name.charAt(0)}</span>
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                                <p className="text-neutral-500 text-xs truncate">@{user.username}</p>
                            </div>
                        </div>
                    </div>
                    {/* Tab Nav */}
                    <nav className="flex flex-col gap-1 p-3 flex-1">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setActiveTab(id); setMessage({ type: '', text: '' }); }}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${activeTab === id
                                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'}`}
                            >
                                <Icon size={16} className={activeTab === id ? 'text-indigo-400' : ''} />
                                {label}
                            </button>
                        ))}
                    </nav>
                    {/* Close */}
                    <div className="p-3 border-t border-white/[0.06]">
                        <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <X size={15} /> Close Panel
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-8 pt-7 pb-5 border-b border-white/[0.06] flex items-start justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {activeTab === 'general' && 'Account Settings'}
                                {activeTab === 'security' && 'Security Settings'}
                                {activeTab === 'notifications' && 'Notification Settings'}
                            </h2>
                            <p className="text-neutral-500 text-sm mt-0.5">
                                {activeTab === 'general' && 'Update your personal information'}
                                {activeTab === 'security' && 'Manage your password and access'}
                                {activeTab === 'notifications' && 'Configure Telegram alert delivery'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 transition-colors -mt-1">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable form */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-6 p-4 rounded-2xl border text-sm font-medium flex items-center gap-3 ${message.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    }`}
                            >
                                {message.type === 'error' ? <Shield size={16} /> : <Check size={16} />}
                                {message.text}
                            </motion.div>
                        )}

                        {/* GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-5 max-w-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>First Name</label>
                                        <input className={inputClass} placeholder="First name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last Name</label>
                                        <input className={inputClass} placeholder="Last name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Email Address</label>
                                    <div className="relative">
                                        <input className={inputClass + " pl-10"} placeholder="your@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="opacity-50">
                                    <label className={labelClass}>Username <span className="text-neutral-600 normal-case font-normal tracking-normal">(cannot be changed)</span></label>
                                    <div className="relative">
                                        <input className={inputClass + " pl-10 cursor-not-allowed"} value={user.username} readOnly />
                                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button onClick={handleUpdateProfile} disabled={isLoading} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                                        {isLoading ? <span className="animate-spin"><Zap size={15} /></span> : <Check size={15} />}
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SECURITY */}
                        {activeTab === 'security' && (
                            <div className="space-y-5 max-w-lg">
                                <div>
                                    <label className={labelClass}>Current Password</label>
                                    <input type="password" className={inputClass} placeholder="Enter current password" value={passData.old} onChange={e => setPassData({ ...passData, old: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>New Password</label>
                                        <input type="password" className={inputClass} placeholder="New password" value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirm Password</label>
                                        <input type="password" className={inputClass} placeholder="Confirm password" value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex gap-3 items-start">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5"><Shield size={14} /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1.5">Password Requirements</p>
                                        <ul className="text-xs text-neutral-400 space-y-1 leading-relaxed">
                                            <li>• Minimum 8 characters</li>
                                            <li>• Mix of letters and numbers recommended</li>
                                            <li>• Changes are logged in the security audit</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button onClick={handleChangePassword} disabled={isLoading} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                                        {isLoading ? <span className="animate-spin"><Zap size={15} /></span> : <Lock size={15} />}
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-5 max-w-lg">
                                <div>
                                    <label className={labelClass}>Telegram Chat ID</label>
                                    <input className={inputClass} placeholder="e.g. 123456789" value={formData.telegram_chat_id} onChange={e => setFormData({ ...formData, telegram_chat_id: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Telegram Bot Token</label>
                                    <input className={inputClass} placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx5" value={formData.telegram_bot_token} onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })} />
                                </div>
                                <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex gap-3 items-start">
                                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 flex-shrink-0 mt-0.5"><Bell size={14} /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1.5">Real-time Alerts</p>
                                        <ul className="text-xs text-neutral-400 space-y-1 leading-relaxed">
                                            <li>• Suricata IPS/IDS alerts sent directly to Telegram</li>
                                            <li>• Requires a valid Bot Token and Chat ID</li>
                                            <li>• Make sure you have messaged your bot first</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="pt-2 grid grid-cols-2 gap-3">
                                    <button onClick={handleUpdateProfile} disabled={isLoading} className="py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                                        {isLoading ? <span className="animate-spin"><Zap size={15} /></span> : <Check size={15} />}
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={handleTestTelegram} disabled={isLoading || !formData.telegram_bot_token || !formData.telegram_chat_id} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                        {isLoading ? <span className="animate-spin"><Zap size={15} /></span> : <Send size={15} />}
                                        {isLoading ? 'Testing...' : 'Test Connection'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
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
