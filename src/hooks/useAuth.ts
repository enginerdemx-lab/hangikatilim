import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export type AdminRole = 'superadmin' | 'social_media' | 'news_editor' | 'content_manager' | null;

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [adminRole, setAdminRole] = useState<AdminRole>(null);
    const [loading, setLoading] = useState(true);

    // Fetch admin role from profiles table
    const fetchAdminRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('admin_role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching admin role:', error);
                return null;
            }
            return data?.admin_role as AdminRole;
        } catch (err) {
            console.error('Error fetching admin role:', err);
            return null;
        }
    };

    useEffect(() => {
        // Check current user on mount
        const initAuth = async () => {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                const role = await fetchAdminRole(currentUser.id);
                setAdminRole(role);
            }
            setLoading(false);
        };

        initAuth();

        // Listen to auth changes
        const { data: { subscription } } = authService.onAuthStateChange(async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                const role = await fetchAdminRole(currentUser.id);
                setAdminRole(role);
            } else {
                setAdminRole(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        adminRole,
        loading,
        isAuthenticated: user !== null,
        isAdmin: adminRole !== null,
        isSuperAdmin: adminRole === 'superadmin',
        login: authService.login,
        logout: authService.logout,
    };
};
