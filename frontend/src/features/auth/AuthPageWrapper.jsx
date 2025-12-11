import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const AuthPageWrapper = () => {
    const location = useLocation();
    const isSignup = location.pathname === '/signup';

    const getPageDetails = () => {
        if (isSignup) {
            return {
                title: "Create Account",
                subtitle: "Get started with DracoSec"
            };
        }
        return {
            title: "Welcome Back",
            subtitle: "Please enter your details"
        };
    };

    const { title, subtitle } = getPageDetails();

    return (
        <AuthLayout
            reverse={isSignup}
            title={title}
            subtitle={subtitle}
        >
            <Outlet />
        </AuthLayout>
    );
};
