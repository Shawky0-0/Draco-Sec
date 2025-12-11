import React from 'react';

export const Input = ({ label, type = "text", ...props }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input
                type={type}
                className="w-full bg-secondary border border-gray-700 hover:border-primary hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-200"
                {...props}
            />
        </div>
    );
};
