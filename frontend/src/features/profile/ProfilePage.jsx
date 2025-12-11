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

// Restored Settings Modal
const SettingsModal = ({ onClose, user }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Account Settings</h2>
                    <button onClick={onClose}><X size={20} className="text-white/50 hover:text-white" /></button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Username</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" defaultValue={user.username} />
                    </div>

                    <div className="h-px bg-white/10 my-4" />

                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Change Password</h3>
                    <div className="space-y-3">
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20" type="password" placeholder="Old Password" />
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20" type="password" placeholder="New Password" />
                        <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20" type="password" placeholder="Confirm New Password" />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10">Cancel</button>
                        <button className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500">Save Changes</button>
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
