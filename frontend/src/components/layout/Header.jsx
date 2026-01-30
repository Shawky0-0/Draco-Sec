import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../hooks/useAuth';
import { Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import StartScanPanel from '../../features/offensive/components/StartScanPanel';

export const Header = ({ title = "Dashboard" }) => {
    const { mode, toggleMode } = useDashboard();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showStartPanel, setShowStartPanel] = useState(false);

    const handleModeSwitch = (newMode) => {
        toggleMode(newMode);
        // Force navigation to the default dashboard of the new mode
        if (newMode === 'offensive') {
            navigate('/offensive/dashboard');
        } else {
            navigate('/defensive/dashboard');
        }
    };

    // Route Path to Title Mapping
    const getPageTitle = (pathname) => {
        if (pathname === '/profile') return 'Account Settings';

        // Remove trailing slashes for safer matching
        const path = pathname.replace(/\/$/, '');

        const titles = {
            '/offensive/dashboard': 'Offensive Dashboard',
            '/offensive/agent-feed': 'Agent Feed',
            '/offensive/issues': 'Issues',
            '/offensive/reports': 'Reports',
            '/offensive/draco-ai': 'Draco AI',

            '/defensive/dashboard': 'Defensive Dashboard',
            '/defensive/monitoring': 'Monitoring',
            '/defensive/scans': 'Scans',
            '/defensive/phishing-campaigns': 'Phishing Campaigns',
            '/defensive/draco-ai': 'Draco AI'
        };

        return titles[path] || title; // Fallback to prop or default "Dashboard"
    };

    const currentTitle = getPageTitle(location.pathname);
    const isProfilePage = location.pathname === '/profile';
    const isOffensive = mode === 'offensive';
    const isEnterprise = user?.plan === 'Enterprise';

    // ... (logic continues)

    return (
        <>
            <header className="px-7 py-4 flex items-center bg-transparent min-h-[72px]">
                {/* 3-Column Grid for perfect centering */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-5">

                    {/* Left: Title */}
                    <h1 className="text-2xl font-semibold tracking-wide text-white m-0 justify-self-start">
                        {currentTitle}
                    </h1>

                    {/* Center: Mode Toggle - ONLY show if NOT on profile page AND is Enterprise */}
                    <div className="flex items-center gap-3 justify-self-center min-w-[200px] justify-center">
                        {!isProfilePage && isEnterprise && (
                            <>
                                <button
                                    onClick={() => handleModeSwitch('offensive')}
                                    className={`
                                        border-none bg-transparent p-0 text-xs font-medium tracking-widest uppercase cursor-pointer transition-colors duration-200 outline-none
                                        ${isOffensive ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}
                                    `}
                                >
                                    OFFENSIVE
                                </button>

                                {/* Neon Divider */}
                                <div
                                    className="w-[1px] h-3.5 shrink-0 transition-all duration-300"
                                    style={{
                                        background: isOffensive
                                            ? 'linear-gradient(180deg, transparent, rgba(255, 0, 51, 0.7), transparent)'
                                            : 'linear-gradient(180deg, transparent, rgba(0, 255, 255, 0.7), transparent)',
                                        boxShadow: isOffensive
                                            ? '0 0 6px rgba(255, 0, 51, 0.5)'
                                            : '0 0 6px rgba(0, 255, 255, 0.5)'
                                    }}
                                />

                                <button
                                    onClick={() => handleModeSwitch('defensive')}
                                    className={`
                                        border-none bg-transparent p-0 text-xs font-medium tracking-widest uppercase cursor-pointer transition-colors duration-200 outline-none
                                        ${!isOffensive ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300'}
                                    `}
                                >
                                    DEFENSIVE
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="justify-self-end mb-1 min-w-[140px] flex justify-end">
                        {location.pathname === '/offensive/dashboard' && (
                            <button
                                onClick={() => setShowStartPanel(true)}
                                className="
                                    inline-flex items-center justify-center gap-1.5 px-4 py-2 
                                    bg-gradient-to-br from-white/90 to-gray-300/90 
                                    border border-white/80 rounded-lg 
                                    text-slate-900 text-sm font-semibold 
                                    hover:from-white/98 hover:to-slate-200/98 hover:-translate-y-0.5 
                                    shadow-[0_6px_22px_rgba(255,255,255,0.28)] hover:shadow-[0_10px_28px_rgba(255,255,255,0.38)]
                                    transition-all duration-200
                                ">
                                <Plus size={16} strokeWidth={3} />
                                Start New Scan
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Start Scan Panel */}
            {showStartPanel && (
                <StartScanPanel
                    onClose={() => setShowStartPanel(false)}
                    onScanStarted={() => setShowStartPanel(false)}
                />
            )}
        </>
    );
};
