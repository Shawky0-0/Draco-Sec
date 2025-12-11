import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg shrink-0">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title || "Confirm Deletion"}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {message || "Are you sure you want to delete this item? This action cannot be undone."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors absolute top-4 right-4"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 flex justify-end gap-3 bg-black/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </div>
        </div>
    );
};
