// src/app/admin/images/page.tsx
"use client";

import React from 'react';
import AdminLayout from '@/src/components/layout/AdminLayout'; //
import ProtectedRoute from '@/src/components/auth/ProtectedRoute'; //
import AdminImagesPageContent from './components/AdminImagesPageContent'; // Updated import

const AdminImagesPage: React.FC = () => {
    return (
        <ProtectedRoute expectedRole="ADMIN">
            <AdminLayout>
                <AdminImagesPageContent /> {/* Using the new component */}
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default AdminImagesPage;