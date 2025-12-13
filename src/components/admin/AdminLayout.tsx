import React from 'react';
import { Navigate, Outlet, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { ToastContainer } from './Toast';
import { useToast } from '../../hooks/useToast';

// Import admin pages
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { PopularSearchesAdmin } from '../../pages/admin/PopularSearches';
// Add other admin page imports here

export const AdminLayout: React.FC = () => {
    const { isAuthenticated, loading, logout } = useAuth();
    const { toasts, removeToast } = useToast();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // TEMPORARILY DISABLED FOR TESTING - REMOVE THIS COMMENT LATER
    // if (!isAuthenticated) {
    //     return <Navigate to="/admin/login" replace />;
    // }

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar onLogout={handleLogout} />

            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
};
