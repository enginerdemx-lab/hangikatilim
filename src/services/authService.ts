import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export const authService = {
    // ============================================
    // AUTHENTICATION
    // ============================================

    // Sign up with email and password
    async signup(email: string, password: string, fullName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) throw error;
        return data;
    },

    // Login with email and password
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    // Logout
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // ============================================
    // PASSWORD MANAGEMENT
    // ============================================

    // Send password reset email
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) throw error;
    },

    // Update password (user must be logged in)
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
    },

    // ============================================
    // USER INFO
    // ============================================

    // Get current user
    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Check if user is authenticated
    async isAuthenticated(): Promise<boolean> {
        const user = await this.getCurrentUser();
        return user !== null;
    },

    // Update user metadata
    async updateUserMetadata(data: { full_name?: string }) {
        const { error } = await supabase.auth.updateUser({
            data,
        });

        if (error) throw error;
    },

    // ============================================
    // SESSION MANAGEMENT
    // ============================================

    // Get current session
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // Listen to auth state changes
    onAuthStateChange(callback: (user: User | null) => void) {
        return supabase.auth.onAuthStateChange((_event, session) => {
            callback(session?.user ?? null);
        });
    },

    // ============================================
    // EMAIL VERIFICATION
    // ============================================

    // Resend verification email
    async resendVerificationEmail(email: string) {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) throw error;
    },

    // Verify OTP
    async verifyOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) throw error;
        return data;
    },
};

