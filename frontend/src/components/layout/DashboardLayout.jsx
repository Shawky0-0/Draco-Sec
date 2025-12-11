import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout = () => {
    return (
        <div className="flex h-screen w-full bg-black overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-black">
                <Header />

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto min-h-0 p-0 flex flex-col [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-700">
                    <div className="flex-1 w-full box-border px-7 py-5">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
