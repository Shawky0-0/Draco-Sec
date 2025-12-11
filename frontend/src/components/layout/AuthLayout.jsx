import React from 'react';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';
import { AnimeBackground } from '../ui/AnimeBackground';

export const AuthLayout = ({ children, reverse = false, title, subtitle }) => {
    return (
        <div className={`min-h-screen flex ${reverse ? 'flex-row-reverse' : 'flex-row'} bg-[#000000] overflow-hidden`}>
            {/* Branding Side - Animated Position */}
            <motion.div
                layoutId="branding-section"
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="hidden lg:flex flex-1 flex-col items-center justify-center relative p-12"
            >
                <AnimeBackground />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-transparent opacity-60 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.img
                        layoutId="branding-logo"
                        src={logo}
                        alt="DracoSec Logo"
                        className="w-80 h-80 object-contain mb-8 drop-shadow-2xl animate-pulse-slow"
                    />
                    <motion.div layoutId="branding-text">
                        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                            Draco<span className="text-primary">Sec</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-md leading-relaxed">
                            Autonomous AI Pentesting. Active Defense.
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Form Side - Animated Position & Content Fade */}
            <motion.div
                layoutId="form-section"
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-[#000000]"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white">{title}</h2>
                        <p className="mt-2 text-gray-400">{subtitle}</p>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        </div>
    );
};
