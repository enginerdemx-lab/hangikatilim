import { supabase } from '../supabaseClient';
import type { UserProfile, ProfileUpdate, NotificationPreferences, UserAgreements } from '../../../types';

export const profileService = {
    // ============================================
    // PROFILE MANAGEMENT
    // ============================================

    // Get user profile
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // Update user profile
    async updateProfile(userId: string, updates: ProfileUpdate): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    },

    // ============================================
    // AVATAR MANAGEMENT
    // ============================================

    // Upload avatar
    async uploadAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar.png`; // Always use .png for consistency

        // Delete existing avatar if exists
        await supabase.storage
            .from('user-files')
            .remove([fileName]);

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
            .from('user-files')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('user-files')
            .getPublicUrl(fileName);

        // Update profile with avatar URL
        await this.updateProfile(userId, { avatar_url: publicUrl });

        return publicUrl;
    },

    // Delete avatar
    async deleteAvatar(userId: string): Promise<void> {
        const fileName = `${userId}/avatar.png`;

        const { error } = await supabase.storage
            .from('user-files')
            .remove([fileName]);

        if (error) throw error;

        // Update profile to remove avatar URL
        await this.updateProfile(userId, { avatar_url: null });
    },

    // ============================================
    // NOTIFICATION PREFERENCES
    // ============================================

    // Get notification preferences
    async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // Update notification preferences
    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>
    ): Promise<void> {
        const { error } = await supabase
            .from('notification_preferences')
            .update(preferences)
            .eq('user_id', userId);

        if (error) throw error;
    },

    // ============================================
    // USER AGREEMENTS
    // ============================================

    // Get user agreements
    async getAgreements(userId: string): Promise<UserAgreements | null> {
        const { data, error } = await supabase
            .from('user_agreements')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // Update user agreements
    async updateAgreements(
        userId: string,
        agreements: Partial<Omit<UserAgreements, 'user_id' | 'accepted_at'>>
    ): Promise<void> {
        const { error } = await supabase
            .from('user_agreements')
            .update({
                ...agreements,
                accepted_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) throw error;
    },

    // ============================================
    // ACCOUNT DELETION
    // ============================================

    // Delete account (requires RPC function on Supabase)
    async deleteAccount(userId: string): Promise<void> {
        // This requires a Supabase Edge Function or RPC
        // For now, we'll just delete the profile data
        // The actual user deletion should be handled server-side for security

        // Delete all user files from storage
        const { data: files } = await supabase.storage
            .from('user-files')
            .list(userId);

        if (files && files.length > 0) {
            const filePaths = files.map(file => `${userId}/${file.name}`);
            await supabase.storage
                .from('user-files')
                .remove(filePaths);
        }

        // Note: The actual user record in auth.users should be deleted
        // via a server-side function for security. Client-side deletion
        // is not recommended. You should create a Supabase Edge Function
        // or use the Supabase Management API from a secure backend.

        throw new Error('Account deletion must be performed by admin. Please contact support.');
    },
};
