import React, { useEffect, useState } from 'react';
import { phishingService } from '../../../services/phishingService';
import { Trash2, BarChart2, Mail, MailOpen, MousePointer, AlertTriangle, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateCampaignModal } from './modals/CreateCampaignModal';
import { Modal } from '../../../components/ui/Modal';

export const CampaignsList = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const navigate = useNavigate();

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await phishingService.getCampaigns();
            setCampaigns(data || []);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await phishingService.deleteCampaign(deleteConfirmId);
            loadCampaigns();
        } catch (error) {
            console.error("Failed to delete campaign", error);
        } finally {
            setDeleteConfirmId(null);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    if (loading && campaigns.length === 0) return <div className="text-white animate-pulse">Loading campaigns...</div>;

    return (
        <div className="flex flex-col gap-6">
            <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadCampaigns}
            />

            <Modal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Delete Campaign"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-gray-300">
                        Are you sure you want to delete this campaign? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Active Campaigns</h2>
                    <p className="text-gray-400">Manage and monitor your phishing simulations.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    + New Campaign
                </button>
            </div>

            <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Created Date</th>
                            <th className="px-6 py-4 text-center"><Mail size={16} className="mx-auto text-emerald-400" /></th>
                            <th className="px-6 py-4 text-center"><MailOpen size={16} className="mx-auto text-yellow-400" /></th>
                            <th className="px-6 py-4 text-center"><MousePointer size={16} className="mx-auto text-orange-400" /></th>
                            <th className="px-6 py-4 text-center"><AlertTriangle size={16} className="mx-auto text-red-500" /></th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {campaigns.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic">
                                    No campaigns found. Start one to see data here.
                                </td>
                            </tr>
                        ) : (
                            campaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{campaign.name}</td>
                                    <td className="px-6 py-4">
                                        {new Date(campaign.created_date).toLocaleString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                            hour12: true
                                        }).replace(/(\d+)(?=,)/, (match) => {
                                            const d = parseInt(match);
                                            if (d > 3 && d < 21) return d + 'th';
                                            switch (d % 10) {
                                                case 1: return d + 'st';
                                                case 2: return d + 'nd';
                                                case 3: return d + 'rd';
                                                default: return d + 'th';
                                            }
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-emerald-400">{campaign.stats?.sent || 0}</td>
                                    <td className="px-6 py-4 text-center font-bold text-yellow-400">{campaign.stats?.opened || 0}</td>
                                    <td className="px-6 py-4 text-center font-bold text-orange-400">{campaign.stats?.clicked || 0}</td>
                                    <td className="px-6 py-4 text-center font-bold text-red-500">{campaign.stats?.submitted || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold  
                                            ${campaign.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}
                                        `}>
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/defensive/phishing-campaigns/campaign/${campaign.id}`)}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded transition-colors"
                                                title="View Results"
                                            >
                                                <BarChart2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(campaign.id)}
                                                className="bg-red-500 hover:bg-red-400 text-white p-2 rounded transition-colors"
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
