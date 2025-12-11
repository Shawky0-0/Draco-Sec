import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const SignupPage = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            // Step 1: Create Basic User
            await signup({
                first_name: formData.firstName,
                last_name: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // Step 2: Navigate to License Page with username
            navigate('/license', { state: { username: formData.username } });
        } catch (err) {
            setError(err.response?.data?.detail || "Signup failed");
        }
    };

    return (
        <>
            {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input name="firstName" label="First Name" onChange={handleChange} required />
                    <Input name="lastName" label="Last Name" onChange={handleChange} required />
                </div>
                <Input name="username" label="Username" onChange={handleChange} required />
                <Input name="email" label="Email" type="email" onChange={handleChange} required />
                <Input name="password" label="Password" type="password" onChange={handleChange} required />
                <Input name="confirmPassword" label="Confirm Password" type="password" onChange={handleChange} required />

                <Button type="submit">Next Step</Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
        </>
    );
};
