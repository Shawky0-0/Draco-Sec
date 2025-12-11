import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { phishingService } from '../../../../services/phishingService';
import { Plus, Trash2, Upload, FileText, Download, AlertCircle, Save } from 'lucide-react';

export const CreateGroupModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [targets, setTargets] = useState([]);
    const [groupName, setGroupName] = useState('');

    // Load initial data for editing
    React.useEffect(() => {
        if (initialData) {
            setGroupName(initialData.name);
            setTargets(initialData.targets || []);
        } else {
            setGroupName('');
            setTargets([]);
        }
    }, [initialData]); // Removed isOpen to prevent resetting targets when modal reopens

    // Inline target form state
    const [newTarget, setNewTarget] = useState({
        first_name: '',
        last_name: '',
        email: '',
        position: ''
    });

    const handleAddTarget = () => {
        if (!newTarget.email) return;
        setTargets([...targets, { ...newTarget }]);
        setNewTarget({ first_name: '', last_name: '', email: '', position: '' });
    };

    const handleRemoveTarget = (index) => {
        setTargets(targets.filter((_, i) => i !== index));
    };

    const handleBulkImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const newTargets = [];
            // Simple CSV parser: First Name, Last Name, Email, Position
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    newTargets.push({
                        first_name: parts[0]?.trim() || '',
                        last_name: parts[1]?.trim() || '',
                        email: parts[2]?.trim() || '',
                        position: parts[3]?.trim() || ''
                    });
                }
            });
            setTargets([...targets, ...newTargets]);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Auto-add pending target if present in inputs
        let finalTargets = [...targets];
        if (newTarget.email) {
            finalTargets.push({
                first_name: (newTarget.first_name || '').trim(),
                last_name: (newTarget.last_name || '').trim(),
                email: (newTarget.email || '').trim(),
                position: (newTarget.position || '').trim()
            });
        }

        if (finalTargets.length === 0) {
            setError("Please add at least one target.");
            setLoading(false);
            return;
        }

        try {
            const sanitizedTargets = finalTargets.map(t => ({
                first_name: (t.first_name || '').trim(),
                last_name: (t.last_name || '').trim(),
                email: (t.email || '').trim(),
                position: (t.position || '').trim()
            }));

            const payload = {
                name: groupName,
                targets: sanitizedTargets
            };

            if (initialData) {
                payload.id = initialData.id;
            }

            console.group("Modify Group Debug");
            console.log("Initial ID:", initialData?.id);
            console.log("Sanitized Payload:", JSON.stringify(payload, null, 2));
            console.groupEnd();

            if (initialData) {
                await phishingService.modifyGroup(initialData.id, payload);
            } else {
                await phishingService.createGroup(payload);
            }

            onSuccess();
            onClose();
            if (!initialData) {
                setGroupName('');
                setTargets([]);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to save group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Group" : "New Group"} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Top Section: Name and Bulk Import */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name:</label>
                        <input
                            type="text"
                            required
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="Group name"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="cursor-pointer bg-[#1a1a1a] border border-white/10 hover:border-emerald-500/50 text-emerald-400 px-4 py-2 rounded flex items-center gap-2 transition-all">
                            <Upload size={18} />
                            <span className="text-sm font-medium">Bulk Import Users</span>
                            <input type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
                        </label>
                    </div>
                </div>

                {/* Targets Table */}
                <div className="border border-white/10 rounded-lg overflow-hidden flex flex-col h-96">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#1a1a1a] text-gray-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 font-medium">First Name</th>
                                    <th className="px-4 py-3 font-medium">Last Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Position</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {/* Inline Add Row */}
                                <tr className="bg-emerald-500/5">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            value={newTarget.first_name}
                                            onChange={e => setNewTarget({ ...newTarget, first_name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            value={newTarget.last_name}
                                            onChange={e => setNewTarget({ ...newTarget, last_name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={newTarget.email}
                                            onChange={e => setNewTarget({ ...newTarget, email: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTarget();
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Position"
                                            value={newTarget.position}
                                            onChange={e => setNewTarget({ ...newTarget, position: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTarget();
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={handleAddTarget}
                                            disabled={!newTarget.email}
                                            className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </td>
                                </tr>

                                {/* Target List */}
                                {targets.map((t, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 text-white">{t.first_name}</td>
                                        <td className="px-4 py-2 text-white">{t.last_name}</td>
                                        <td className="px-4 py-2 text-white">{t.email}</td>
                                        <td className="px-4 py-2 text-white">{t.position}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTarget(i)}
                                                className="text-gray-600 group-hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {targets.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-600 italic">
                                            No targets added yet. Use the form above or import a CSV.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-[#1a1a1a] p-2 border-t border-white/10 text-xs text-gray-500 flex justify-between px-4">
                        <span>Total Targets: {targets.length}</span>
                        <span>CSV Format: First Name, Last Name, Email, Position</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-400 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 sticky bottom-0 bg-[#0a0a0a] z-10 pb-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Group'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
