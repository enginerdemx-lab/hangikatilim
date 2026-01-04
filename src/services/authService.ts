import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export const authService = {
    // ============================================
    // AUTHENTICATION
    // ============================================

    // Sign up with email and password
    async signup(email: string, password: string, fullName: string, gender?: string, agreements?: {
        terms: boolean;
        privacy: boolean;
        kvkk: boolean;
        consent: boolean;
        commercial: boolean;
    }) {
        console.log('[authService] Attempting signup for:', email);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    gender: gender || '',
                    // Map agreements to metadata keys expected by trigger
                    agreements_terms: agreements?.terms || false,
                    agreements_privacy: agreements?.privacy || false,
                    agreements_kvkk: agreements?.kvkk || false,
                    agreements_consent: agreements?.consent || false,
                    agreements_commercial: agreements?.commercial || false,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('[authService] Signup error:', error);
            console.error('[authService] Error message:', error.message);
            console.error('[authService] Error status:', error.status);
            console.error('[authService] Full error object:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('[authService] Signup successful:', data);
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

    // Resend confirmation email
    async resendConfirmationEmail(email: string) {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
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

    // Update email (user must be logged in, sends verification email)
    async updateEmail(newEmail: string) {
        const { error } = await supabase.auth.updateUser({
            email: newEmail,
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

    // ============================================
    // USER STATUS CHECKS
    // ============================================

    // Check if user is banned
    async checkUserBanStatus(userId: string): Promise<{ isBanned: boolean; banReason: string | null }> {
        // Query profile status directly
        const { data, error } = await supabase
            .from('profiles')
            .select('status, ban_reason')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Check ban status error:', error);
            // If error, assume not banned
            return { isBanned: false, banReason: null };
        }

        return {
            isBanned: data?.status === 'banned',
            banReason: data?.ban_reason || null
        };
    },
};

