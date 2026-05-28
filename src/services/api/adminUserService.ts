import { supabase } from '../supabaseClient';

// Types for admin user management
export type AdminRoleType = 'superadmin' | 'social_media' | 'news_editor' | 'content_manager' | null;

export interface AdminUser {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    member_number: number;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    status: 'active' | 'inactive' | 'banned';
    ban_reason: string | null;
    created_at: string;
    last_login_at: string | null;
    last_sign_in_ip: string | null;
    login_count: number;
    calculation_count: number;
    admin_role: AdminRoleType;
    // Genel Bilgiler (Profile Details)
    education_level: string | null;
    employment_status: string | null;
    profession: string | null;
    work_experience: string | null;
    monthly_income: string | null;
    has_rent: boolean;
    rent_amount: number | null;
    preferred_finance_company: string | null;
    gender: string | null;
}

export interface AdminUserUpdate {
    full_name?: string;
    phone?: string;
    education_level?: string;
    employment_status?: string;
    profession?: string;
    work_experience?: string;
    monthly_income?: string;
    has_rent?: boolean;
    rent_amount?: number;
    preferred_finance_company?: string;
    gender?: string;
}

export interface LoginLog {
    id: string;
    ip_address: string | null;
    user_agent: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    logged_in_at: string;
}

export interface UserFilters {
    status?: 'active' | 'inactive' | 'banned' | 'all';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const adminUserService = {
    // ============================================
    // GET ALL USERS
    // ============================================
    async getAllUsers(filters?: UserFilters): Promise<AdminUser[]> {
        // Use RPC function for admin access
        const { data, error } = await supabase.rpc('get_all_users_admin');

        if (error) {
            console.error('Get all users error:', error);
            throw error;
        }

        let users = data as AdminUser[];

        // Apply client-side filters
        if (filters) {
            if (filters.status && filters.status !== 'all') {
                users = users.filter(u => u.status === filters.status);
            }

            if (filters.search) {
                const search = filters.search.toLowerCase();
                users = users.filter(u =>
                    u.full_name?.toLowerCase().includes(search) ||
                    u.email?.toLowerCase().includes(search) ||
                    u.phone?.includes(search) ||
                    u.member_number?.toString().includes(search)
                );
            }

            if (filters.dateFrom) {
                const from = new Date(filters.dateFrom);
                users = users.filter(u => new Date(u.created_at) >= from);
            }

            if (filters.dateTo) {
                const to = new Date(filters.dateTo);
                users = users.filter(u => new Date(u.created_at) <= to);
            }
        }

        return users;
    },

    // ============================================
    // GET USER BY ID
    // ============================================
    async getUserById(userId: string): Promise<AdminUser | null> {
        const users = await this.getAllUsers();
        return users.find(u => u.id === userId) || null;
    },

    // ============================================
    // UPDATE USER STATUS
    // ============================================
    async updateUserStatus(
        userId: string,
        status: 'active' | 'inactive' | 'banned',
        banReason?: string
    ): Promise<boolean> {
        const { data, error } = await supabase.rpc('update_user_status_admin', {
            p_user_id: userId,
            p_status: status,
            p_ban_reason: banReason || null
        });

        if (error) {
            console.error('Update user status error:', error);
            throw error;
        }

        return data as boolean;
    },

    // ============================================
    // BAN USER
    // ============================================
    async banUser(userId: string, reason: string): Promise<boolean> {
        return this.updateUserStatus(userId, 'banned', reason);
    },

    // ============================================
    // UNBAN USER
    // ============================================
    async unbanUser(userId: string): Promise<boolean> {
        return this.updateUserStatus(userId, 'active');
    },

    // ============================================
    // SET USER INACTIVE
    // ============================================
    async setUserInactive(userId: string): Promise<boolean> {
        return this.updateUserStatus(userId, 'inactive');
    },

    // ============================================
    // SET USER ACTIVE
    // ============================================
    async setUserActive(userId: string): Promise<boolean> {
        return this.updateUserStatus(userId, 'active');
    },

    // ============================================
    // UPDATE USER (ADMIN) - Direct table update
    // ============================================
    async updateUser(userId: string, updates: AdminUserUpdate) {
        // Build update object with only defined values
        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.education_level !== undefined) updateData.education_level = updates.education_level;
        if (updates.employment_status !== undefined) updateData.employment_status = updates.employment_status;
        if (updates.profession !== undefined) updateData.profession = updates.profession;
        if (updates.work_experience !== undefined) updateData.work_experience = updates.work_experience;
        if (updates.monthly_income !== undefined) updateData.monthly_income = updates.monthly_income;
        if (updates.has_rent !== undefined) updateData.has_rent = updates.has_rent;
        if (updates.rent_amount !== undefined) updateData.rent_amount = updates.rent_amount;
        if (updates.preferred_finance_company !== undefined) updateData.preferred_finance_company = updates.preferred_finance_company;
        if (updates.gender !== undefined) updateData.gender = updates.gender;

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('Update user error:', error);
            throw error;
        }
    },

    // ============================================
    // REMOVE AVATAR (ADMIN)
    // ============================================
    async removeAvatar(userId: string) {
        const { error } = await supabase.rpc('remove_user_avatar_admin', {
            p_user_id: userId
        });

        if (error) throw error;
    },

    // ============================================
    // UPDATE USER PROFILE (Admin)
    // ============================================
    async updateUserProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    },

    // ============================================
    // UPDATE ADMIN ROLE
    // ============================================
    async updateAdminRole(userId: string, role: AdminRoleType): Promise<void> {
        const { error } = await supabase.rpc('update_admin_role', {
            target_user_id: userId,
            new_role: role
        });

        if (error) {
            console.error('Update admin role error:', error);
            throw error;
        }
    },

    // ============================================
    // GET USER LOGIN HISTORY
    // ============================================
    async getUserLoginHistory(userId: string, limit: number = 50): Promise<LoginLog[]> {
        const { data, error } = await supabase.rpc('get_user_login_history', {
            p_user_id: userId
        });

        if (error) {
            console.error('Get login history error:', error);
            throw error;
        }

        return data as LoginLog[];
    },

    // ============================================
    // LOG USER LOGIN
    // ============================================
    async logUserLogin(userId: string): Promise<void> {
        // Detect device info
        const userAgent = navigator.userAgent;
        const deviceType = /Mobile|Android|iPhone/i.test(userAgent) ? 'mobile' :
            /Tablet|iPad/i.test(userAgent) ? 'tablet' : 'desktop';

        // Simple browser detection
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';

        // Simple OS detection
        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

        const { error } = await supabase.rpc('log_user_login', {
            p_user_id: userId,
            p_user_agent: userAgent,
            p_device_type: deviceType,
            p_browser: browser,
            p_os: os
        });

        if (error) {
            console.error('Log login error:', error);
            // Don't throw - this is non-critical
        }
    },

    // ============================================
    // DELETE USER (Soft delete by setting inactive)
    // ============================================
    async deleteUser(userId: string): Promise<void> {
        // For safety, we just set inactive instead of hard delete
        // Hard delete requires admin API access
        await this.setUserInactive(userId);
    },

    // ============================================
    // HARD DELETE USER (Permanently remove)
    // ============================================
    async hardDeleteUser(userId: string): Promise<void> {
        const { error } = await supabase.rpc('delete_user_permanently', {
            target_user_id: userId
        });

        if (error) {
            console.error('Hard delete user error:', error);
            throw error;
        }
    },

    // ============================================
    // EXPORT TO EXCEL
    // ============================================
    async exportToExcel(users: AdminUser[]): Promise<Blob> {
        // Create CSV content
        const headers = [
            'Üye No',
            'Ad Soyad',
            'E-posta',
            'Telefon',
            'Durum',
            'Kayıt Tarihi',
            'Son Giriş',
            'Giriş Sayısı',
            'Hesaplama Sayısı'
        ];

        const rows = users.map(user => [
            user.member_number,
            user.full_name || '',
            user.email || '',
            user.phone || '',
            user.status === 'active' ? 'Aktif' :
                user.status === 'inactive' ? 'Pasif' : 'Banlı',
            new Date(user.created_at).toLocaleDateString('tr-TR'),
            user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('tr-TR') : '-',
            user.login_count || 0,
            user.calculation_count || 0
        ]);

        // Build CSV with BOM for Excel UTF-8 support
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    },

    // ============================================
    // GET STATISTICS
    // ============================================
    async getStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        banned: number;
        todayLogins: number;
    }> {
        const users = await this.getAllUsers();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            inactive: users.filter(u => u.status === 'inactive').length,
            banned: users.filter(u => u.status === 'banned').length,
            todayLogins: users.filter(u =>
                u.last_login_at && new Date(u.last_login_at) >= today
            ).length
        };
    },

    // ============================================
    // SEND CONFIRMATION EMAIL (Resend)
    // ============================================
    async sendConfirmationEmail(email: string): Promise<void> {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) {
            console.error('Send confirmation email error:', error);
            throw error;
        }
    },

    // ============================================
    // SEND PASSWORD RESET EMAIL
    // ============================================
    async sendPasswordResetEmail(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            console.error('Send password reset email error:', error);
            throw error;
        }
    },

    // ============================================
    // GET SAVED CALCULATIONS (RPC Bypass)
    // ============================================
    async getUserCalculations(userId: string): Promise<any[]> {
        const { data, error } = await supabase.rpc('get_user_calculations_admin', {
            p_user_id: userId
        });

        if (error) {
            console.error('Get user calculations admin error:', error);
            throw error;
        }

        return data || [];
    }
};
