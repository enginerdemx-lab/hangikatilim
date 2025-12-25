import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { adminUserService } from '../services/api/adminUserService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, fullName: string, gender?: string, agreements?: any) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    updateEmail: (newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session on mount
        const initAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();

                if (currentUser) {
                    const { isBanned } = await authService.checkUserBanStatus(currentUser.id);
                    if (isBanned) {
                        await authService.logout();
                        setUser(null);
                    } else {
                        setUser(currentUser);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
            if (user) {
                const { isBanned } = await authService.checkUserBanStatus(user.id);
                if (isBanned) {
                    await authService.logout();
                    setUser(null);
                    // If we just logged in or session refreshed and user is banned, 
                    // this will trigger. It might be good to have a way to 
                    // notify UI, but for now logout is the key action.
                } else {
                    setUser(user);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { user } = await authService.login(email, password);

            if (user) {
                // Check if banned immediatly
                const { isBanned, banReason } = await authService.checkUserBanStatus(user.id);
                if (isBanned) {
                    await authService.logout();
                    throw new Error(`Hesabınız askıya alınmıştır. ${banReason || ''}`);
                }

                setUser(user);
                // Log user login for tracking
                adminUserService.logUserLogin(user.id).catch(console.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string, fullName: string, gender?: string, agreements?: any) => {
        setLoading(true);
        try {
            await authService.signup(email, password, fullName, gender, agreements);
            setUser(user);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        await authService.resetPassword(email);
    };

    const updatePassword = async (newPassword: string) => {
        await authService.updatePassword(newPassword);
    };

    const updateEmail = async (newEmail: string) => {
        await authService.updateEmail(newEmail);
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
        updateEmail,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
