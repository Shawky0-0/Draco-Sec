import React, { useEffect, useState } from 'react';
import { phishingService } from '../../../services/phishingService';
import { Users, Trash2, Edit } from 'lucide-react';
import { CreateGroupModal } from './modals/CreateGroupModal';

export const UsersGroupsList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null); // ID of group to delete

    const loadGroups = async () => {
        setLoading(true);
        try {
            const data = await phishingService.getGroups();
            setGroups(data || []);
        } catch (error) {
            console.error("Failed to load groups", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await phishingService.deleteGroup(deleteConfirmId);
            loadGroups();
        } catch (error) {
            console.error("Failed to delete group", error);
            alert("Failed to delete group");
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingGroup(null);
    };

    useEffect(() => {
        loadGroups();
    }, []);

    if (loading && groups.length === 0) return <div className="text-white animate-pulse">Loading groups...</div>;

    return (
        <div className="flex flex-col gap-6">
            <CreateGroupModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                onSuccess={loadGroups}
                initialData={editingGroup}
            />

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Group?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this group? This action cannot be undone.</p>
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

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Users & Groups</h2>
                    <p className="text-gray-400">Manage target lists for your campaigns.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    + New Group
                </button>
            </div>

            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Group Name</th>
                            <th className="px-6 py-4">Targets Count</th>
                            <th className="px-6 py-4">Modified Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {groups.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                    No user groups found.
                                </td>
                            </tr>
                        ) : (
                            groups.map((group) => (
                                <tr key={group.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{group.name}</td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <Users size={14} />
                                        {group.targets ? group.targets.length : 0}
                                    </td>
                                    <td className="px-6 py-4">{new Date(group.modified_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(group)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(group.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300"
                                                title="Delete"
                                            >
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
        </div>
    );
};
