import React, { useState } from 'react';
import { LayoutDashboard, Send, Users, FileText, Globe, Radio } from 'lucide-react';
import { PhishingDashboard } from './components/PhishingDashboard';
import { CampaignsList } from './components/CampaignsList';
import { UsersGroupsList } from './components/UsersGroupsList';
import { TemplatesList } from './components/TemplatesList';
import { LandingPagesList } from './components/LandingPagesList';
import { SendingProfilesList } from './components/SendingProfilesList';

const PhishingPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'campaigns', label: 'Campaigns', icon: Send },
        { id: 'users', label: 'Users & Groups', icon: Users },
        { id: 'templates', label: 'Email Templates', icon: FileText },
        { id: 'pages', label: 'Landing Pages', icon: Globe },
        { id: 'profiles', label: 'Sending Profiles', icon: Radio },
    ];

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header / Tabs */}
            <div className="flex items-center gap-1 bg-[#0a0a0a]/40 p-1.5 rounded-xl border border-white/5 w-max">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                            ${activeTab === tab.id
                                ? 'bg-[#1a1a1a] text-white shadow-[0_0_15px_rgba(0,255,170,0.1)] border border-white/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? 'text-emerald-400' : ''} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#0a0a0a]/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">

                {activeTab === 'dashboard' && <PhishingDashboard />}
                {activeTab === 'campaigns' && <CampaignsList />}
                {activeTab === 'users' && <UsersGroupsList />}
                {activeTab === 'templates' && <TemplatesList />}
                {activeTab === 'pages' && <LandingPagesList />}
                {activeTab === 'profiles' && <SendingProfilesList />}

                {/* Decorative Background Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            </div>
        </div>
    );
};

export default PhishingPage;
