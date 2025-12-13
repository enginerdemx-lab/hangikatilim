import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check current user on mount
        authService.getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Listen to auth changes
        const { data: { subscription } } = authService.onAuthStateChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        loading,
        isAuthenticated: user !== null,
        login: authService.login,
        logout: authService.logout,
    };
};
