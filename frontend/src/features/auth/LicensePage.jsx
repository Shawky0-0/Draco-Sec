import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LicensePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activateLicense } = useAuth();

    // Get username passed from signup, or allow manual entry if lost state
    const [username, setUsername] = useState(location.state?.username || '');
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const result = await activateLicense(username, key);
            setSuccess(`Success! ${result.tier.toUpperCase()} plan activated.`);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || "Activation failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-[#0d0d0d] p-8 rounded-xl border border-gray-800 shadow-2xl">
                <h2 className="text-3xl font-bold text-center mb-2 text-white">Activate License</h2>
                <p className="text-center text-gray-400 mb-6 text-sm">Enter your product key to unlock features.</p>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded mb-4 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!location.state?.username && (
                        <Input
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your username"
                            required
                        />
                    )}
                    <Input
                        label="License Key"
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                    />
                    <Button type="submit">Activate & Finish</Button>
                </form>
            </div>
        </div>
    );
};
