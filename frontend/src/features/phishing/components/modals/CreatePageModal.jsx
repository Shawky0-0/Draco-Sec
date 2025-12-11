import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { phishingService } from '../../../../services/phishingService';
import { Globe, AlertCircle, Save } from 'lucide-react';

export const CreatePageModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Import Modal State
    const [showImport, setShowImport] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importing, setImporting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        html: '',
        capture_credentials: false,
        capture_passwords: false,
        redirect_url: ''
    });

    const htmlEditorRef = useRef(null);
    const editorInstanceRef = useRef(null);
    const [editorReady, setEditorReady] = useState(false);

    // Load CKEditor script once
    useEffect(() => {
        if (!window.CKEDITOR) {
            setEditorReady(true); // Already loaded via index.html
        } else {
            setEditorReady(true);
        }
    }, []);

    // Initialize CKEditor when modal is open
    useEffect(() => {
        if (!isOpen || !editorReady) {
            return;
        }

        // Small delay to ensure textarea is in DOM
        const timer = setTimeout(() => {
            if (htmlEditorRef.current && window.CKEDITOR && !editorInstanceRef.current) {
                try {
                    editorInstanceRef.current = window.CKEDITOR.replace(htmlEditorRef.current, {
                        height: 400,
                        versionCheck: false,
                        fullPage: true,
                        allowedContent: true,
                        removePlugins: 'elementspath',  // Removes bottom status bar
                        resize_enabled: false,
                        // Remove any default content
                        on: {
                            instanceReady: function (evt) {
                                // Clear any default content when editor is ready
                                const data = evt.editor.getData();
                                if (data.includes('PowerCampus') || data.includes('Ellucian')) {
                                    evt.editor.setData('');
                                }
                            }
                        }
                    });
                    console.log('[Landing Pages] CKEditor initialized successfully');
                } catch (e) {
                    console.error('[Landing Pages] Error initializing CKEditor:', e);
                }
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (editorInstanceRef.current) {
                try {
                    editorInstanceRef.current.destroy();
                    editorInstanceRef.current = null;
                } catch (e) {
                    // Suppress harmless cleanup errors
                }
            }
        };
    }, [isOpen, editorReady]);

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                html: initialData.html || '',
                capture_credentials: initialData.capture_credentials || false,
                capture_passwords: initialData.capture_passwords || false,
                redirect_url: initialData.redirect_url || ''
            });

            // Set CKEditor data
            if (editorInstanceRef.current) {
                editorInstanceRef.current.setData(initialData.html || '');
            }
        } else {
            setFormData({
                name: '',
                html: '',
                capture_credentials: false,
                capture_passwords: false,
                redirect_url: ''
            });

            if (editorInstanceRef.current) {
                editorInstanceRef.current.setData('');
            }
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImportSite = async (e) => {
        e.preventDefault();
        setImporting(true);
        setError(null);
        try {
            const result = await phishingService.importSite(importUrl, false);
            if (editorInstanceRef.current) {
                editorInstanceRef.current.setData(result.html);
            }
            setShowImport(false);
            setImportUrl('');
        } catch (err) {
            setError("Failed to import site. Please check the URL.");
        } finally {
            setImporting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get HTML from CKEditor
            const finalHtml = editorInstanceRef.current ? editorInstanceRef.current.getData() : formData.html;

            // Construct base payload (no ID for create)
            const payload = {
                name: formData.name,
                html: finalHtml,
                capture_credentials: formData.capture_credentials,
                capture_passwords: formData.capture_passwords,
                redirect_url: formData.redirect_url.trim()
            };

            // Only add ID for updates
            if (initialData) {
                payload.id = parseInt(initialData.id, 10);
            }

            console.log("Submitting Page Payload:", payload);

            if (initialData) {
                await phishingService.modifyPage(payload.id, payload);
            } else {
                await phishingService.createPage(payload);
            }

            onSuccess();
            onClose();
            setFormData({
                name: '',
                html: '',
                capture_credentials: false,
                capture_passwords: false,
                redirect_url: ''
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to save page");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Landing Page" : "New Landing Page"}
            maxWidth="max-w-7xl"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="landing-page-form"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Page'}
                    </button>
                </div>
            }
        >
            {/* Import Overlay */}
            {showImport && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 rounded-lg">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white">Import from URL</h3>
                            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleImportSite} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">URL:</label>
                                <input
                                    type="url"
                                    required
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    placeholder="https://example.com/login"
                                    className="w-full bg-black border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={importing}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-2 rounded transition-colors disabled:opacity-50"
                            >
                                {importing ? 'Importing...' : 'Import'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <form id="landing-page-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Name:</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                        placeholder="Page name"
                        autoFocus
                    />
                </div>

                {/* Import Site Button */}
                <div>
                    <button type="button" onClick={() => setShowImport(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors">
                        <Globe size={16} /> Import Site
                    </button>
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="capture_credentials"
                                name="capture_credentials"
                                checked={formData.capture_credentials}
                                onChange={handleChange}
                                className="rounded bg-[#1a1a1a] border-white/10 text-emerald-500 focus:ring-emerald-500/50"
                            />
                            <label htmlFor="capture_credentials" className="text-sm text-gray-300 select-none cursor-pointer">Capture Submitted Data</label>
                        </div>

                        {formData.capture_credentials && (
                            <div className="ml-6 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="capture_passwords"
                                        name="capture_passwords"
                                        checked={formData.capture_passwords}
                                        onChange={handleChange}
                                        className="rounded bg-[#1a1a1a] border-white/10 text-emerald-500 focus:ring-emerald-500/50"
                                    />
                                    <label htmlFor="capture_passwords" className="text-sm text-gray-300 select-none cursor-pointer">Capture Passwords</label>
                                </div>

                                {formData.capture_passwords && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                                        <AlertCircle size={18} className="text-red-400 mt-0.5" />
                                        <p className="text-sm text-red-400 font-medium">
                                            Warning: Passwords are captured in cleartext. Ensure you have authorization to capture credentials.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Redirect to:</label>
                                    <input
                                        type="text"
                                        name="redirect_url"
                                        value={formData.redirect_url}
                                        onChange={handleChange}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                                        placeholder="http://example.com"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* HTML Content with CKEditor */}
                    <div>
                        <div className="flex border-b border-white/10 mb-0">
                            <button type="button" className="px-4 py-2 text-sm font-medium text-emerald-400 border-b-2 border-emerald-400">
                                HTML
                            </button>
                        </div>

                        <div style={{ height: '400px' }}>
                            <textarea
                                ref={htmlEditorRef}
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-400 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
};
