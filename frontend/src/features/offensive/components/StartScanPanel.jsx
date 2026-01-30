import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, Settings, FileText, Trash2 } from 'lucide-react';
import { createScan, listMethodologies, createMethodology, deleteMethodology } from '../../../services/offensiveService';
import { useNavigate } from 'react-router-dom';

const StartScanPanel = ({ onClose, onScanStarted }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        target: '',
        methodology: '',
        scope: '',
    });
    const [methodologies, setMethodologies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMethodologyModal, setShowMethodologyModal] = useState(false);

    useEffect(() => {
        loadMethodologies();
    }, []);

    const loadMethodologies = async () => {
        try {
            const data = await listMethodologies();
            setMethodologies(data);
            if (data.length > 0) {
                setFormData((prev) => ({ ...prev, methodology: data[0].title }));
            }
        } catch (error) {
            console.error('Error loading methodologies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createScan(formData);
            onScanStarted();
            // Navigate to agent feed
            navigate(`/offensive/agent-feed/${result.scan_id}`);
        } catch (error) {
            console.error('Error starting scan:', error);
            alert('Failed to start scan: ' + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-[#1a1a1a] shadow-2xl z-50 overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Start Attack</h2>
                                <p className="text-xs text-gray-500">Configure penetration test</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Target Input */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Target
                            </label>
                            <input
                                type="text"
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                placeholder="google.com, 192.168.1.1, https://example.com"
                                className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-all"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Enter URL, IP address, or domain name
                            </p>
                        </div>

                        {/* Methodology Selector */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Methodology
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.methodology}
                                    onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded text-white focus:outline-none focus:border-gray-600 transition-all"
                                    required
                                >
                                    {methodologies.map((method) => (
                                        <option key={method.id} value={method.title}>
                                            {method.title}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowMethodologyModal(true)}
                                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    title="Create custom methodology"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Select testing approach or create custom
                            </p>
                        </div>

                        {/* Scope */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Scope & Instructions
                            </label>
                            <textarea
                                value={formData.scope}
                                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                placeholder="Example: Focus on authentication vulnerabilities. Test only port 443. Exclude admin panel."
                                rows={6}
                                className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-all resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Provide detailed instructions for DracoSec AI agent
                            </p>
                        </div>

                        {/* Launch Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Starting...
                                </>
                            ) : (
                                <>
                                    Launch Attack
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </AnimatePresence>

            {/* Custom Methodology Modal */}
            {showMethodologyModal && (
                <CreateMethodologyModal
                    onClose={() => setShowMethodologyModal(false)}
                    onCreated={() => {
                        setShowMethodologyModal(false);
                        loadMethodologies();
                    }}
                />
            )}
        </>
    );
};

// Create Methodology Modal
const CreateMethodologyModal = ({ onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [methodologies, setMethodologies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState([]);
    const [selectedMethodologyId, setSelectedMethodologyId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null, title: '' });

    useEffect(() => {
        loadMethodologies();
    }, []);

    const loadMethodologies = async () => {
        try {
            const data = await listMethodologies();
            setMethodologies(data);
        } catch (error) {
            console.error('Error loading methodologies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createMethodology(formData);
            // Refresh the list
            loadMethodologies();
            // Clear form
            setFormData({ title: '', description: '' });
            setSelectedMethodologyId(null);
            // Don't close modal - keep user in it
            // onCreated(); // REMOVED - don't auto-close
        } catch (error) {
            console.error('Error creating methodology:', error);
            const errorMsg = error.response?.data?.detail || error.message;
            alert(`Failed to create methodology: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredMethodologies = methodologies.filter((m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectMethodology = (method) => {
        // Load methodology into form for editing
        setFormData({
            title: method.title,
            description: method.description,
        });
        setSelectedMethodologyId(method.id);
    };

    const handleNewMethodology = () => {
        setFormData({ title: '', description: '' });
        setSelectedMethodologyId(null);
    };

    const handleDeleteMethodology = (methodologyId, methodologyTitle) => {
        setDeleteConfirmation({ show: true, id: methodologyId, title: methodologyTitle });
    };

    const confirmDelete = async () => {
        const { id: methodologyId, title: methodologyTitle } = deleteConfirmation;

        try {
            await deleteMethodology(methodologyId);

            console.log('✅ Deleted:', methodologyTitle);

            // Refresh the list
            loadMethodologies();

            // Clear form if deleted methodology was selected
            if (selectedMethodologyId === methodologyId) {
                setFormData({ title: '', description: '' });
                setSelectedMethodologyId(null);
            }

            // Close modal
            setDeleteConfirmation({ show: false, id: null, title: '' });
        } catch (error) {
            console.error('Error deleting methodology:', error);
            alert('Failed to delete methodology: ' + (error.response?.data?.detail || error.message));
            setDeleteConfirmation({ show: false, id: null, title: '' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1a1a1a] rounded-lg w-full max-w-5xl h-[80vh] border border-gray-800 flex overflow-hidden"
            >
                {/* Sidebar */}
                <div className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-800">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-gray-300 text-sm placeholder-gray-600 focus:outline-none focus:border-gray-600"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            type="button"
                            onClick={handleNewMethodology}
                            className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-1"
                        >
                            <Plus size={14} />
                            <span>New</span>
                        </button>
                    </div>

                    {/* Methodology List */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {filteredMethodologies.map((method, index) => (
                            <div
                                key={method.id || `methodology-${index}`}
                                className={`group flex items-center justify-between px-3 py-2 text-sm rounded cursor-pointer mb-1 transition-colors border-l-2 ${selectedMethodologyId === method.id
                                    ? 'bg-[#1a1a1a] text-white border-blue-500'
                                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white border-transparent'
                                    }`}
                            >
                                <span
                                    onClick={() => handleSelectMethodology(method)}
                                    className="flex-1 truncate"
                                >
                                    {method.title}
                                </span>
                                {/* Custom Methodologies can be deleted */}
                                {(method.is_default === 0 || method.is_default === false) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMethodology(method.id, method.title);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded transition-all"
                                        title="Delete methodology"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">New Methodology</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter methodology title"
                                    className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 text-sm"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Methodology Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the methodology..."
                                    rows={8}
                                    className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 resize-none text-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                    onClick={() => setDeleteConfirmation({ show: false, id: null, title: '' })}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#2a2a2a] rounded-lg w-full max-w-md border border-gray-700 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-[#1f1f1f] border-b border-gray-700">
                            <h3 className="text-sm font-medium text-gray-300">
                                Confirm Deletion
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            <p className="text-white text-base mb-3">
                                Are you sure you want to delete "{deleteConfirmation.title}"?
                            </p>
                            <p className="text-red-400 text-sm">
                                This action cannot be undone.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#1f1f1f] border-t border-gray-700 flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, id: null, title: '' })}
                                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-medium"
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default StartScanPanel;
