import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
}

/**
 * Route guard component that redirects to /login if user is not authenticated.
 * Preserves the attempted URL so user can be redirected back after login.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Oturum kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is authenticated, render children
    return <>{children}</>;
};

export default RequireAuth;
