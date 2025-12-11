import React, { useEffect, useState } from 'react';
import { phishingService } from '../../../services/phishingService';
import { FileText, Trash2, Edit, Code } from 'lucide-react';
import { CreateTemplateModal } from './modals/CreateTemplateModal';

export const TemplatesList = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await phishingService.getTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setIsCreateModalOpen(true);
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await phishingService.deleteTemplate(deleteConfirmId);
            loadTemplates();
        } catch (error) {
            console.error("Failed to delete template", error);
            alert("Failed to delete template: " + error.message);
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingTemplate(null);
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    if (loading && templates.length === 0) return <div className="text-white animate-pulse">Loading templates...</div>;

    return (
        <div className="flex flex-col gap-6">
            <CreateTemplateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onSuccess={loadTemplates}
                initialData={editingTemplate}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Email Templates</h2>
                    <p className="text-gray-400">Design the phishing emails sent to targets.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    + New Template
                </button>
            </div>

            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Template Name</th>
                            <th className="px-6 py-4">Has Attachments</th>
                            <th className="px-6 py-4">Modified Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {templates.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                    No templates found.
                                </td>
                            </tr>
                        ) : (
                            templates.map((template) => (
                                <tr key={template.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                        <FileText size={16} className="text-blue-400" />
                                        {template.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {template.attachments && template.attachments.length > 0 ? (
                                            <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded">Yes</span>
                                        ) : (
                                            <span className="text-gray-600 text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{new Date(template.modified_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-blue-400" title="Edit">
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteClick(template.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Template?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this template? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
