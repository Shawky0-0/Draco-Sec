import React, { useEffect, useState } from 'react';
import { phishingService } from '../../../services/phishingService';
import { Send, MousePointer, AlertTriangle, Activity, Mail, MailOpen, BarChart2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';

// StatCard Component
const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10 flex flex-col gap-4">
            <div className={`p-3 rounded-lg w-max ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('text-', '')} />
            </div>
            <div>
                <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
            </div>
        </div>
    </div>
);

export const PhishingDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentCampaigns, setRecentCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, campaignId: null, isDeleting: false });
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        const loadDashboardData = async () => {
            setLoading(true);

            // Failsafe timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                if (mounted) {
                    console.warn("Dashboard loading timed out, forcing render");
                    setLoading(false);
                }
            }, 5000); // 5 seconds max load time

            // Load stats independently
            try {
                const statsData = await phishingService.getStats();
                if (mounted && statsData) setStats(statsData);
            } catch (error) {
                console.error("Failed to load stats", error);
                if (mounted) setStats({ total_campaigns: 0, active_campaigns: 0, emails_sent: 0, clicked: 0 });
            }

            // Load campaigns independently
            try {
                const campaignsData = await phishingService.getCampaigns();
                if (mounted) setRecentCampaigns(campaignsData ? campaignsData : []);
            } catch (error) {
                console.error("Failed to load campaigns", error);
                if (mounted) setRecentCampaigns([]);
            } finally {
                clearTimeout(timeoutId);
                if (mounted) setLoading(false);
            }
        };
        loadDashboardData();
        return () => { mounted = false; };
    }, []);


    const confirmDelete = (id) => {
        setDeleteModal({ isOpen: true, campaignId: id, isDeleting: false });
    };

    const executeDelete = async () => {
        if (!deleteModal.campaignId) return;
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            await phishingService.deleteCampaign(deleteModal.campaignId);
            setRecentCampaigns(prev => prev.filter(c => c.id !== deleteModal.campaignId));
            phishingService.getStats().then(setStats).catch(console.error);
            setDeleteModal({ isOpen: false, campaignId: null, isDeleting: false });
        } catch (err) {
            console.error(err);
            alert("Failed to delete campaign");
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    if (loading) return <div className="text-white animate-pulse">Loading dashboard...</div>;
    // stats might be null if error, handle gracefully
    const safeStats = stats || { total_campaigns: 0, active_campaigns: 0, emails_sent: 0, clicked: 0 };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-white">Campaign Overview</h2>
                <p className="text-gray-400">Real-time metrics from your active phishing simulations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Campaigns"
                    value={safeStats.total_campaigns}
                    icon={Activity}
                    color="text-blue-400"
                    subtext={`${safeStats.active_campaigns} currently active`}
                />
                <StatCard
                    title="Emails Sent"
                    value={safeStats.emails_sent}
                    icon={Send}
                    color="text-emerald-400"
                    subtext="Successfully delivered"
                />
                <StatCard
                    title="Clicks Captured"
                    value={safeStats.clicked}
                    icon={MousePointer}
                    color="text-amber-400"
                    subtext="Link clicks recorded"
                />
                <StatCard
                    title="Compromised"
                    value={safeStats.submitted || 0}
                    icon={AlertTriangle}
                    color="text-red-400"
                    subtext="Credentials submitted"
                />
            </div>

            {/* Recent Campaigns Table */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Recent Campaigns</h2>
                    <button
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        View All
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
                            {!recentCampaigns || recentCampaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic">
                                        No recent campaigns found.
                                    </td>
                                </tr>
                            ) : (
                                recentCampaigns.map((campaign) => (
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
                                                    onClick={() => confirmDelete(campaign.id)}
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, campaignId: null, isDeleting: false })}
                onConfirm={executeDelete}
                title="Delete Campaign"
                message="Are you sure you want to delete this campaign? All associated results and data will be permanently removed. This action cannot be undone."
                isDeleting={deleteModal.isDeleting}
            />
        </div>
    );
};
