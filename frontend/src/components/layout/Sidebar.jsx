import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import logo from '../../assets/logo.png';
import { useAuth } from '../../hooks/useAuth';

// Import All SVG Assets
import dashboardIcon from '../../assets/dashboard.svg';
import liveIcon from '../../assets/live.svg';
import bugIcon from '../../assets/bug.svg';
import documentIcon from '../../assets/document.svg';
import botIcon from '../../assets/chat-robot.svg';

import heartbeatIcon from '../../assets/heartbeat.svg';
import scanIcon from '../../assets/scan.svg';
import usersIcon from '../../assets/users.svg';

import profileIcon from '../../assets/profile.svg';
import signOutIcon from '../../assets/sign-out.svg';

export const Sidebar = () => {
    const { mode } = useDashboard();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Style variables based on mode for the custom gradient border effect
    const borderColor = mode === 'offensive' ? 'rgba(255, 0, 51, 0.5)' : 'rgba(0, 255, 255, 0.5)';

    const offensiveLinks = [
        { to: "/offensive/dashboard", icon: dashboardIcon, label: "Dashboard" },
        { to: "/offensive/agent-feed", icon: liveIcon, label: "Agent Feed" },
        { to: "/offensive/issues", icon: bugIcon, label: "Issues" },
        { to: "/offensive/reports", icon: documentIcon, label: "Reports" },
        { to: "/draco-ai", icon: botIcon, label: "Draco AI" },
    ];

    const defensiveLinks = [
        { to: "/defensive/dashboard", icon: dashboardIcon, label: "Dashboard" },
        { to: "/defensive/monitoring", icon: heartbeatIcon, label: "Monitoring" },
        { to: "/defensive/scans", icon: scanIcon, label: "Scans" },
        { to: "/defensive/phishing-campaigns", icon: usersIcon, label: "Phishing Campaigns" },
        { to: "/draco-ai", icon: botIcon, label: "Draco AI" },
    ];

    const links = mode === 'offensive' ? offensiveLinks : defensiveLinks;

    return (
        <aside
            className="w-[70px] flex-shrink-0 bg-sidebar flex flex-col gap-6 py-5 relative transition-all duration-300"
            style={{
                backgroundImage: `linear-gradient(#000, #000), linear-gradient(180deg, transparent, ${borderColor}, transparent)`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                borderRight: '2px solid transparent'
            }}
        >
            {/* Logo */}
            <div className="flex flex-col items-center gap-1 px-4 pb-4 border-b border-white/10">
                <img src={logo} alt="Draco" className="w-11 h-11 object-contain" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col px-3 gap-3">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        title={link.label}
                        className={({ isActive }) => `
                            flex items-center justify-center p-3 rounded-lg transition-all duration-200 group relative
                            ${isActive ? 'bg-[#3a3a3a]' : 'hover:bg-white/5'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <img
                                    src={link.icon}
                                    alt={link.label}
                                    className={`w-[22px] h-[22px] object-contain transition-all duration-200 
                                            ${isActive ? 'opacity-100 brightness-125' : 'opacity-70 group-hover:opacity-100 invert-[0.7]'}
                                        `}
                                />
                                {/* Tooltip */}
                                <span className="absolute left-full ml-4 px-3 py-2 bg-[#1e1e1e]/95 border border-[#78808e]/20 rounded-md text-white text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50 pointer-events-none shadow-lg">
                                    {link.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="mt-auto flex flex-col gap-1 px-3 pt-3 border-t border-white/10">
                <button
                    onClick={() => navigate('/profile')}
                    title="Profile"
                    className={`flex items-center justify-center p-2 rounded-lg hover:text-white hover:bg-white/5 transition-all relative group
                        ${location.pathname === '/profile' ? 'text-white' : 'text-[#a0a0a0]'}
                    `}
                >
                    <img
                        src={profileIcon}
                        alt="Profile"
                        className={`w-[20px] h-[20px] object-contain transition-all duration-200 opacity-70 group-hover:opacity-100 invert-[0.7]
                            ${location.pathname === '/profile' ? 'opacity-100 brightness-125 invert-0' : ''}
                        `}
                    />
                    <span className="absolute left-full ml-4 px-3 py-2 bg-[#1e1e1e]/95 border border-[#78808e]/20 rounded-md text-white text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-opacity duration-200 z-50 pointer-events-none shadow-lg">
                        Profile
                    </span>
                </button>
                <button
                    onClick={logout}
                    title="Sign Out"
                    className="flex items-center justify-center p-2 rounded-lg text-[#a0a0a0] hover:text-white hover:bg-white/5 transition-all relative group"
                >
                    <img
                        src={signOutIcon}
                        alt="Sign Out"
                        className="w-[20px] h-[20px] object-contain opacity-70 group-hover:opacity-100 invert-[0.7]"
                    />
                    <span className="absolute left-full ml-4 px-3 py-2 bg-[#1e1e1e]/95 border border-[#78808e]/20 rounded-md text-white text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50 pointer-events-none shadow-lg">
                        Sign Out
                    </span>
                </button>
            </div>
        </aside>
    );
};
