import React from 'react';

export const SeverityDonut = () => {
    return (
        <div className="flex gap-4 items-center h-full">
            {/* Donut SVG */}
            <div className="relative w-[190px] h-[190px] flex-shrink-0 group">
                <svg viewBox="0 0 220 220" className="w-full h-full transform -rotate-90">
                    <circle
                        cx="110" cy="110" r="82"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.16)"
                        strokeWidth="26"
                    />
                    {/* Critical - Red */}
                    <circle
                        cx="110" cy="110" r="82"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="26"
                        strokeLinecap="round"
                        strokeDasharray="165 350"
                        strokeDashoffset="0"
                        className="transition-opacity duration-200 group-hover:opacity-60 hover:!opacity-100"
                    />
                    {/* High - Orange */}
                    <circle
                        cx="110" cy="110" r="82"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="26"
                        strokeLinecap="round"
                        strokeDasharray="134 381"
                        strokeDashoffset="-165"
                        className="transition-opacity duration-200 group-hover:opacity-60 hover:!opacity-100"
                    />
                    {/* Medium - Yellow */}
                    <circle
                        cx="110" cy="110" r="82"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="26"
                        strokeLinecap="round"
                        strokeDasharray="113 402"
                        strokeDashoffset="-299"
                        className="transition-opacity duration-200 group-hover:opacity-60 hover:!opacity-100"
                    />
                    {/* Low - Blue */}
                    <circle
                        cx="110" cy="110" r="82"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="26"
                        strokeLinecap="round"
                        strokeDasharray="103 412"
                        strokeDashoffset="-412"
                        className="transition-opacity duration-200 group-hover:opacity-60 hover:!opacity-100"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-bold text-white">41</span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 text-sm text-white/60">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>Critical</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Low</span>
                </div>
            </div>
        </div>
    );
};
