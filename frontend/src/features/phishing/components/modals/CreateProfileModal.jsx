import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { phishingService } from '../../../../services/phishingService';
import { Server, AlertCircle, Plus, Trash2 } from 'lucide-react';

export const CreateProfileModal = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        interface_type: 'SMTP',
        from_address: '',
        host: '',
        username: '',
        password: '',
        ignore_cert_errors: true,
        headers: []
    });

    const [newHeader, setNewHeader] = useState({ key: '', value: '' });
    const [showTestModal, setShowTestModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [testEmail, setTestEmail] = useState({
        first_name: '',
        last_name: '',
        email: '',
        position: ''
    });
    const [sendingTest, setSendingTest] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addHeader = (e) => {
        e.preventDefault();
        if (!newHeader.key || !newHeader.value) return;
        setFormData(prev => ({
            ...prev,
            headers: [...prev.headers, newHeader]
        }));
        setNewHeader({ key: '', value: '' });
    };

    const removeHeader = (index) => {
        setFormData(prev => ({
            ...prev,
            headers: prev.headers.filter((_, i) => i !== index)
        }));
    };

    const sendTestEmail = async () => {
        if (!testEmail.email) {
            setError("Please enter a test email address");
            return;
        }

        setSendingTest(true);
        setError(null);

        try {
            // Use current form data for test
            const testPayload = {
                smtp: {
                    name: formData.name || "Test Profile",
                    from_address: formData.from_address,
                    host: formData.host,
                    username: formData.username,
                    // Remove all spaces from password (fixes Google App Password copy-paste issues)
                    password: formData.password ? formData.password.replace(/\s+/g, '') : '',
                    ignore_cert_errors: formData.ignore_cert_errors,
                    headers: formData.headers
                },
                ...testEmail
            };

            await phishingService.sendTestEmail(testPayload);
            setSuccessMessage("Test email sent successfully to " + testEmail.email);
            setTimeout(() => {
                setShowTestModal(false);
                setSuccessMessage(null);
                setTestEmail({ first_name: '', last_name: '', email: '', position: '' });
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to send test email");
        } finally {
            setSendingTest(false);
        }
    };

    // Load initial data for editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                interface_type: 'SMTP',
                from_address: initialData.from_address || '',
                host: initialData.host || '',
                username: initialData.username || '',
                password: initialData.password || '',
                ignore_cert_errors: initialData.ignore_cert_errors !== undefined ? initialData.ignore_cert_errors : true,
                headers: initialData.headers || []
            });
        } else {
            setFormData({
                name: '',
                interface_type: 'SMTP',
                from_address: '',
                host: '',
                username: '',
                password: '',
                ignore_cert_errors: true,
                headers: []
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Construct base payload (no ID for create)
            const payload = { ...formData };
            // Remove all spaces from password if present
            if (payload.password) {
                payload.password = payload.password.replace(/\s+/g, '');
            }

            // Only add ID for updates
            if (initialData) {
                payload.id = parseInt(initialData.id, 10);
            }

            console.log("Submitting Profile Payload:", payload);

            if (initialData) {
                await phishingService.modifyProfile(payload.id, payload);
            } else {
                await phishingService.createProfile(payload);
            }

            onSuccess();
            onClose();
            setFormData({
                name: '',
                interface_type: 'SMTP',
                from_address: '',
                host: '',
                username: '',
                password: '',
                ignore_cert_errors: true,
                headers: []
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Sending Profile" : "New Sending Profile"} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name:</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="Profile Name"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Interface Type:</label>
                        <input
                            type="text"
                            value="SMTP"
                            disabled
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">From Address:</label>
                        <input
                            type="text"
                            name="from_address"
                            required
                            value={formData.from_address}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="Checking <check@test.com>"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Host:</label>
                        <input
                            type="text"
                            name="host"
                            required
                            value={formData.host}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="smtp.example.com:25"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username (Optional):</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password (Optional):</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            placeholder="********"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="ignore_cert_errors"
                        name="ignore_cert_errors"
                        checked={formData.ignore_cert_errors}
                        onChange={handleChange}
                        className="rounded bg-[#1a1a1a] border-white/10 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <label htmlFor="ignore_cert_errors" className="text-sm text-gray-300">Ignore Certificate Errors</label>
                </div>

                {/* Headers */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Custom Headers:</label>
                    <div className="flex gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Header (e.g. X-Custom)"
                            value={newHeader.key}
                            onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                        <input
                            type="text"
                            placeholder="Value"
                            value={newHeader.value}
                            onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                        <button
                            type="button"
                            onClick={addHeader}
                            disabled={!newHeader.key || !newHeader.value}
                            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white p-2 rounded transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {formData.headers.length > 0 && (
                        <div className="bg-white/5 rounded-lg overflow-hidden border border-white/5">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-200">
                                    <tr>
                                        <th className="px-4 py-2">Header</th>
                                        <th className="px-4 py-2">Value</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {formData.headers.map((h, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{h.key}</td>
                                            <td className="px-4 py-2 font-mono text-xs text-white">{h.value}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button type="button" onClick={() => removeHeader(i)} className="text-gray-500 hover:text-red-400">
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

                {/* Send Test Email Button */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowTestModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Server size={16} /> Send Test Email
                    </button>
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
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-2 rounded-lg transition-all"
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>

            {/* Send Test Email Nested Modal */}
            {showTestModal && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 rounded-lg">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white">Send Test Email</h3>
                            <button onClick={() => setShowTestModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {successMessage && (
                            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                                <div className="p-1 bg-emerald-500 rounded-full">
                                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-emerald-400 font-medium">{successMessage}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={testEmail.first_name}
                                onChange={(e) => setTestEmail({ ...testEmail, first_name: e.target.value })}
                                className="bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={testEmail.last_name}
                                onChange={(e) => setTestEmail({ ...testEmail, last_name: e.target.value })}
                                className="bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            />
                            <input
                                type="email"
                                placeholder="Email *"
                                required
                                value={testEmail.email}
                                onChange={(e) => setTestEmail({ ...testEmail, email: e.target.value })}
                                className="bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            />
                            <input
                                type="text"
                                placeholder="Position"
                                value={testEmail.position}
                                onChange={(e) => setTestEmail({ ...testEmail, position: e.target.value })}
                                className="bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowTestModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendTestEmail}
                                disabled={sendingTest}
                                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Server size={16} />
                                {sendingTest ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
