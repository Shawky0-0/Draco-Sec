import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
    const variants = {
        primary: "bg-primary hover:bg-gray-200 text-black shadow-[0_0_10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] focus:ring-primary",
        secondary: "bg-gray-800 hover:bg-gray-700 text-white focus:ring-gray-500",
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};
