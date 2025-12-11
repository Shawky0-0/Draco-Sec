import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal';

import { phishingService } from '../../../../services/phishingService';
import { Rocket, AlertCircle, Link, Calendar, Users, Mail, Globe, Server, HelpCircle } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export const CreateCampaignModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState(null);
    const [groupsError, setGroupsError] = useState(false);

    // Dropdown Data
    const [templates, setTemplates] = useState([]);
    const [pages, setPages] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [groups, setGroups] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        template_name: '',
        page_name: '',
        smtp_name: '',
        url: '',

        launch_date: new Date(), // Initialize with Date object
        send_by_date: null,
        groups: []
    });

    useEffect(() => {
        if (isOpen) {
            fetchDependencies();
        }
    }, [isOpen]);

    const fetchDependencies = async () => {
        setFetchingData(true);
        setGroupsError(false);
        try {
            const [tData, pData, smtpData, gData] = await Promise.all([
                phishingService.getTemplates(),
                phishingService.getPages(),
                phishingService.getProfiles(),
                phishingService.getGroups()
            ]);
            setTemplates(tData || []);
            setPages(pData || []);
            setProfiles(smtpData || []);
            setGroups(gData || []);

            if (!gData || gData.length === 0) {
                setGroupsError(true);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load campaign options.");
        } finally {
            setFetchingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGroupToggle = (groupName) => {
        setFormData(prev => {
            const currentGroups = prev.groups || [];
            if (currentGroups.some(g => g.name === groupName)) {
                return { ...prev, groups: currentGroups.filter(g => g.name !== groupName) };
            } else {
                return { ...prev, groups: [...currentGroups, { name: groupName }] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit triggered", formData);
        setLoading(true);
        setError(null);

        // Required fields check needed because default HTML required attribute doesn't work well with custom selects sometimes
        if (!formData.template_name || !formData.page_name || !formData.smtp_name || !formData.url) {
            console.log("Validation failed: Missing required fields", formData);
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        if (!formData.groups || formData.groups.length === 0) {
            console.log("Validation failed: No groups selected");
            setError("Please select at least one target group.");
            setLoading(false);
            return;
        }

        try {
            // Prepare payload with ISO strings and nested objects for GoPhish API
            const submitData = {
                name: formData.name,
                url: formData.url,
                template: { name: formData.template_name },
                page: { name: formData.page_name },
                smtp: { name: formData.smtp_name },
                groups: formData.groups,
                launch_date: formData.launch_date ? formData.launch_date.toISOString() : null,
                send_by_date: formData.send_by_date ? formData.send_by_date.toISOString() : null
            };
            console.log("Submitting payload:", submitData);

            await phishingService.createCampaign(submitData);
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '',
                template_name: '',
                page_name: '',
                smtp_name: '',
                url: '',
                launch_date: new Date(),
                send_by_date: null,
                groups: []
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to launch campaign");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Campaign"
            maxWidth="max-w-3xl"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="campaign-form"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                        <Rocket size={18} />
                        {loading ? 'Launching...' : 'Launch Campaign'}
                    </button>
                </div>
            }
        >
            {/* Custom Styles for DatePicker Dark Mode */}
            <style>{`
                .react-datepicker {
                    background-color: #1a1a1a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    font-family: inherit;
                    color: #fff;
                }
                .react-datepicker__header {
                    background-color: #262626;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
                    color: #fff;
                }
                .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
                    color: #d1d5db;
                }
                .react-datepicker__day:hover, .react-datepicker__month-text:hover, .react-datepicker__quarter-text:hover, .react-datepicker__year-text:hover {
                    background-color: #3f3f46;
                    color: #fff;
                }
                .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
                    background-color: #10b981 !important; /* emerald-500 */
                    color: #000 !important;
                    font-weight: bold;
                }
                .react-datepicker__time-container {
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                }
                .react-datepicker__time-container .react-datepicker__time {
                    background-color: #1a1a1a;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
                    color: #d1d5db;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
                    background-color: #3f3f46;
                    color: #fff;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                    background-color: #10b981 !important;
                    color: #000 !important;
                }
                .react-datepicker__input-container input {
                    color-scheme: dark;
                }
            `}</style>
            {fetchingData ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <form id="campaign-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {groupsError && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg border border-red-500/30 flex items-center gap-2 text-sm font-medium mb-2">
                            <AlertCircle size={16} /> No groups found!
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name:</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="Campaign name"
                            autoFocus
                        />
                    </div>

                    {/* Email Template */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Template:</label>
                        <select
                            name="template_name"
                            required
                            value={formData.template_name}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Select Template...</option>
                            {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Landing Page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Landing Page:</label>
                        <select
                            name="page_name"
                            required
                            value={formData.page_name}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Select Landing Page...</option>
                            {pages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                            URL: <HelpCircle size={12} className="text-gray-600" />
                        </label>
                        <input
                            type="text"
                            name="url"
                            required
                            value={formData.url}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="http://192.168.1.5"
                        />
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Launch Date:</label>
                            <div className="relative">
                                <DatePicker
                                    selected={formData.launch_date}
                                    onChange={(date) => setFormData({ ...formData, launch_date: date })}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 pl-10"
                                    placeholderText="Select launch date"
                                    wrapperClassName="w-full"
                                />
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                                Send Emails By (Optional) <HelpCircle size={12} className="text-gray-600" />
                            </label>
                            <div className="relative">
                                <DatePicker
                                    selected={formData.send_by_date}
                                    onChange={(date) => setFormData({ ...formData, send_by_date: date })}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 pl-10"
                                    placeholderText="Optional end date"
                                    wrapperClassName="w-full"
                                    isClearable
                                />
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Profile */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sending Profile:</label>
                        <select
                            name="smtp_name"
                            required
                            value={formData.smtp_name}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Select Profile...</option>
                            {profiles.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Groups */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Groups:</label>
                        <div className="bg-[#1a1a1a] border border-white/10 rounded p-3 h-32 overflow-y-auto">
                            {groups.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">No groups available.</p>
                            ) : (
                                groups.map(g => (
                                    <div key={g.id} className="flex items-center gap-2 mb-2 last:mb-0 hover:bg-white/5 p-1 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            id={`group-${g.id}`}
                                            checked={formData.groups?.some(sel => sel.name === g.name)}
                                            onChange={() => handleGroupToggle(g.name)}
                                            className="rounded bg-black border-white/20 text-emerald-500 focus:ring-emerald-500/50"
                                        />
                                        <label htmlFor={`group-${g.id}`} className="text-sm text-gray-300 cursor-pointer select-none flex-1">
                                            {g.name} <span className="text-gray-500 text-xs">({g.targets.length} targets)</span>
                                        </label>
                                    </div>
                                ))
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
            )}
        </Modal>
    );
};
