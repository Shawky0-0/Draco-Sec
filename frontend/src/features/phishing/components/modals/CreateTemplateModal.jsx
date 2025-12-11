import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { phishingService } from '../../../../services/phishingService';
import { Save, AlertCircle, FilePlus, Trash2, Download, Paperclip } from 'lucide-react';


export const CreateTemplateModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [envelopeSender, setEnvelopeSender] = useState('');
    const [text, setText] = useState('');
    const [html, setHtml] = useState('');
    const [useTracker, setUseTracker] = useState(true);
    const [attachments, setAttachments] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('text');

    const fileInputRef = useRef(null);
    const htmlEditorRef = useRef(null);
    const editorInstanceRef = useRef(null);
    const [editorReady, setEditorReady] = useState(false);

    // Load CKEditor script once
    useEffect(() => {
        if (!window.CKEDITOR) {
            const script = document.createElement('script');
            script.src = 'https://cdn.ckeditor.com/4.22.1/full/ckeditor.js';
            script.async = true;
            script.onload = () => {
                console.log('CKEditor script loaded');
                setEditorReady(true);
            };
            document.body.appendChild(script);
        } else {
            setEditorReady(true);
        }
    }, []);

    // Initialize CKEditor when HTML tab is active and modal is open
    useEffect(() => {
        if (!isOpen || activeTab !== 'html' || !editorReady) {
            return;
        }

        // Small delay to ensure textarea is in DOM
        const timer = setTimeout(() => {
            if (htmlEditorRef.current && window.CKEDITOR && !editorInstanceRef.current) {
                try {
                    editorInstanceRef.current = window.CKEDITOR.replace(htmlEditorRef.current, {
                        height: 300,
                        versionCheck: false,
                        fullPage: true,
                        allowedContent: true,
                        toolbar: [
                            { name: 'document', items: ['Source', '-', 'Templates'] },
                            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
                            { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
                            { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] },
                            '/',
                            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
                            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote'] },
                            { name: 'links', items: ['Link', 'Unlink'] },
                            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                            { name: 'colors', items: ['TextColor', 'BGColor'] }
                        ]
                    });
                    console.log('CKEditor initialized successfully');
                } catch (e) {
                    console.error('Error initializing CKEditor:', e);
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
                    console.error('Error destroying editor:', e);
                }
            }
        };
    }, [isOpen, activeTab, editorReady]);

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setSubject(initialData.subject || '');
            setEnvelopeSender(initialData.envelope_sender || '');
            setText(initialData.text || '');
            setHtml(initialData.html || '');
            setAttachments(initialData.attachments || []);
            setUseTracker(initialData.html && initialData.html.includes('{{.Tracker}}'));

            // Set CKEditor data
            if (editorInstanceRef.current) {
                editorInstanceRef.current.setData(initialData.html || '');
            }
        } else {
            setName('');
            setSubject('');
            setEnvelopeSender('');
            setText('');
            setHtml('');
            setUseTracker(true);
            setAttachments([]);

            if (editorInstanceRef.current) {
                editorInstanceRef.current.setData('');
            }
        }
        setError(null);
        setActiveTab('text');
    }, [initialData, isOpen]);


    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = [];

        for (const file of files) {
            try {
                const base64 = await readFileAsBase64(file);
                const content = base64.split(',')[1];
                newAttachments.push({
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    content: content
                });
            } catch (err) {
                console.error("Error reading file", file.name, err);
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get HTML from CKEditor
            let finalHtml = editorInstanceRef.current ? editorInstanceRef.current.getData() : html;

            // Fix URL Scheme added by CKEditor (GoPhish does this too - line 26 in templates.js)
            finalHtml = finalHtml.replace(/https?:\/\/\{\{\.URL\}\}/gi, "{{.URL}}");

            // Tracker logic (exactly as GoPhish does it - lines 28-36)
            if (useTracker) {
                if (finalHtml.indexOf('{{.Tracker}}') === -1 && finalHtml.indexOf('{{.TrackingUrl}}') === -1) {
                    finalHtml = finalHtml.replace('</body>', '{{.Tracker}}</body>');
                    // If no </body> tag, just append
                    if (!finalHtml.includes('{{.Tracker}}')) {
                        finalHtml += '{{.Tracker}}';
                    }
                }
            } else {
                // Remove tracker if unchecked
                finalHtml = finalHtml.replace('{{.Tracker}}</body>', '</body>');
            }

            // Construct base payload (no ID for create)
            const payload = {
                name,
                subject,
                text,
                html: finalHtml,
                attachments
            };

            // Only add ID for updates
            if (initialData) {
                payload.id = parseInt(initialData.id, 10);
            }

            // Add envelope sender if provided
            if (envelopeSender && envelopeSender.trim() !== "") {
                payload.envelope_sender = envelopeSender.trim();
            }

            console.log("Submitting Template Payload:", payload);

            if (initialData) {
                await phishingService.modifyTemplate(payload.id, payload);
            } else {
                await phishingService.createTemplate(payload);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to save template");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={initialData ? "Edit Template" : "New Template"}
                maxWidth="max-w-5xl"
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
                            form="email-template-form"
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                }
            >
                <form id="email-template-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Top Metadata */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none"
                                placeholder="Template name"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Envelope Sender
                                <span className="text-xs text-gray-500 ml-2">(Defaults to SMTP From if not set)</span>
                            </label>
                            <input
                                type="text"
                                value={envelopeSender}
                                onChange={(e) => setEnvelopeSender(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none"
                                placeholder="First Last <test@example.com>"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none"
                                placeholder="Email Subject"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-0 border-b border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveTab('text')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'text' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Text
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('html')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'html' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            HTML
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 min-h-0 relative">
                        {activeTab === 'text' && (
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full h-full bg-[#0a0a0a] border border-white/10 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50"
                                placeholder="Plaintext email content..."
                            />
                        )}
                        {activeTab === 'html' && (
                            <div className="h-full">
                                <textarea
                                    ref={htmlEditorRef}
                                    defaultValue={html}
                                    className="w-full h-full"
                                />
                            </div>
                        )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer w-max select-none">
                            <input
                                type="checkbox"
                                checked={useTracker}
                                onChange={(e) => setUseTracker(e.target.checked)}
                                className="rounded bg-[#1a1a1a] border-white/20 text-emerald-500"
                            />
                            <span className="text-sm text-gray-300">Add Tracking Image</span>
                        </label>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-3 py-2 rounded flex items-center gap-2 transition-colors border border-red-500/20"
                            >
                                <FilePlus size={16} /> Add Files
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />

                            {attachments.length > 0 && (
                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left text-gray-400">
                                        <thead className="bg-white/5 text-xs uppercase font-medium">
                                            <tr>
                                                <th className="px-4 py-2 w-8"></th>
                                                <th className="px-4 py-2">Name</th>
                                                <th className="px-4 py-2 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {attachments.map((file, idx) => (
                                                <tr key={idx} className="hover:bg-white/5">
                                                    <td className="px-4 py-2"><Paperclip size={14} /></td>
                                                    <td className="px-4 py-2 text-white">{file.name}</td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(idx)}
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-400 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                </form>
            </Modal>
        </>
    );
};
