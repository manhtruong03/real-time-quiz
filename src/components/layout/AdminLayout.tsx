// src/components/layout/AdminLayout.tsx
import React from 'react';
import AdminSidebar from './AdminSidebar';
// Ensure you have Tailwind CSS configured with the color variables
// from screen-admin-01-account.html, or map them in tailwind.config.js

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-primary-bg text-text-primary">
            {/* --primary-bg: #1E1E24; */}
            {/* --text-primary: #EAEAEA; */}
            <AdminSidebar />
            <main className="flex-1 ml-64 p-6 overflow-y-auto">
                {/* ml-64 is to offset the fixed sidebar width */}
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;