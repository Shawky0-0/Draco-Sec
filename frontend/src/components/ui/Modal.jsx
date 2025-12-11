import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', footer }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', zIndex: 99999 }}>
            <div
                className={`transform transition-all duration-300 w-full ${maxWidth} bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    {children}
                </div>

                {/* Footer (sticky at bottom, outside scroll) */}
                {footer && (
                    <div className="p-6 border-t border-white/10 shrink-0 bg-[#0a0a0a]">
                        {footer}
                    </div>
                )}
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );

    // Render modal at document.body level using Portal
    return ReactDOM.createPortal(modalContent, document.body);
};
