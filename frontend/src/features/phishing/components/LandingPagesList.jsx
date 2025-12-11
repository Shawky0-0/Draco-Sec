import React, { useEffect, useState } from 'react';
import { phishingService } from '../../../services/phishingService';
import { Globe, Trash2, Edit, ExternalLink } from 'lucide-react';
import { CreatePageModal } from './modals/CreatePageModal';

export const LandingPagesList = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const loadPages = async () => {
        setLoading(true);
        try {
            const data = await phishingService.getPages();
            setPages(data || []);
        } catch (error) {
            console.error("Failed to load pages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (page) => {
        setEditingPage(page);
        setIsCreateModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await phishingService.deletePage(deleteConfirmId);
            loadPages();
        } catch (error) {
            console.error("Failed to delete page", error);
            alert("Failed to delete page: " + error.message);
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingPage(null);
    };

    useEffect(() => {
        loadPages();
    }, []);

    if (loading && pages.length === 0) return <div className="text-white animate-pulse">Loading items...</div>;

    return (
        <div className="flex flex-col gap-6">
            <CreatePageModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onSuccess={loadPages}
                initialData={editingPage}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Landing Pages</h2>
                    <p className="text-gray-400">Web pages that capture credentials or serve payloads.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    + New Page
                </button>
            </div>

            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Page Name</th>
                            <th className="px-6 py-4">Captures Credentials</th>
                            <th className="px-6 py-4">Modified Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {pages.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                    No landing pages found.
                                </td>
                            </tr>
                        ) : (
                            pages.map((page) => (
                                <tr key={page.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                        <Globe size={16} className="text-purple-400" />
                                        {page.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {page.capture_credentials ? (
                                            <span className="text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">Yes</span>
                                        ) : (
                                            <span className="text-gray-600 text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{new Date(page.modified_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEdit(page)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400" title="Edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteClick(page.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300" title="Delete">
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
                        <h3 className="text-xl font-bold text-white mb-2">Delete Landing Page?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this landing page? This action cannot be undone.</p>
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
