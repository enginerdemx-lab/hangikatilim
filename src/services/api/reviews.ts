import { supabase } from '../supabaseClient';
import type { CompanyReview, CompanyRatingStats } from '../../types/database';

export const reviewsApi = {
  // Onaylanmış yorumları getir (public)
  async getApprovedReviews(companyId: string): Promise<CompanyReview[]> {
    const { data, error } = await supabase
      .from('company_reviews')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Kullanıcı isimlerini ayrı çek
    const userIds = [...new Set(data.filter(r => !r.is_anonymous).map(r => r.user_id))];
    let profilesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p: any) => { profilesMap[p.id] = p.full_name || 'Kullanıcı'; });
      }
    }

    return data.map((r: any) => ({
      ...r,
      user_name: r.is_anonymous ? 'Anonim Kullanıcı' : (profilesMap[r.user_id] || 'Kullanıcı'),
    }));
  },

  // Firma puan istatistikleri
  async getRatingStats(companyId: string): Promise<CompanyRatingStats> {
    const { data, error } = await supabase.rpc('get_company_rating_stats', {
      p_company_id: companyId,
    });

    if (error) throw error;

    if (data && Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    // Tek satır dönebilir (array değil)
    if (data && !Array.isArray(data)) {
      return data as CompanyRatingStats;
    }

    return {
      avg_rating: 0,
      total_reviews: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    };
  },

  // Kullanıcının bu firmaya yorumu var mı?
  async hasUserReviewed(companyId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_user_reviewed', {
      p_company_id: companyId,
      p_user_id: userId,
    });

    if (error) return false;
    return !!data;
  },

  // Kullanıcının kendi yorumunu getir
  async getUserReview(companyId: string, userId: string): Promise<CompanyReview | null> {
    const { data, error } = await supabase
      .from('company_reviews')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Yorum ekle
  async addReview(review: {
    company_id: string;
    user_id: string;
    rating: number;
    title?: string;
    comment: string;
    pros?: string;
    cons?: string;
    is_anonymous?: boolean;
  }): Promise<CompanyReview> {
    const { data, error } = await supabase
      .from('company_reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Bu firmaya zaten yorum yapmışsınız.');
      }
      throw error;
    }
    return data;
  },

  // Yorum güncelle (sadece pending durumundayken)
  async updateReview(reviewId: string, updates: {
    rating?: number;
    title?: string;
    comment?: string;
    pros?: string;
    cons?: string;
    is_anonymous?: boolean;
  }): Promise<CompanyReview> {
    const { data, error } = await supabase
      .from('company_reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Yorum sil
  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('company_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  },

  // ===== ADMIN =====

  // Tüm yorumları getir (admin) - join'siz, ayrı sorgularla
  async getAllReviews(status?: string): Promise<CompanyReview[]> {
    let query = supabase
      .from('company_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Firma bilgilerini ayrı çek
    const companyIds = [...new Set(data.map(r => r.company_id))];
    const userIds = [...new Set(data.map(r => r.user_id))];

    const [companiesRes, profilesRes] = await Promise.all([
      supabase.from('companies').select('id, name, logo_url').in('id', companyIds),
      supabase.from('profiles').select('id, full_name').in('id', userIds),
    ]);

    const companiesMap: Record<string, { name: string; logo_url: string }> = {};
    const profilesMap: Record<string, string> = {};

    if (companiesRes.data) {
      companiesRes.data.forEach((c: any) => {
        companiesMap[c.id] = { name: c.name, logo_url: c.logo_url || '' };
      });
    }
    if (profilesRes.data) {
      profilesRes.data.forEach((p: any) => {
        profilesMap[p.id] = p.full_name || 'Kullanıcı';
      });
    }

    return data.map((r: any) => ({
      ...r,
      user_name: profilesMap[r.user_id] || 'Kullanıcı',
      company_name: companiesMap[r.company_id]?.name || '',
      company_logo_url: companiesMap[r.company_id]?.logo_url || '',
    }));
  },

  // Yorum durumunu güncelle (admin)
  async updateReviewStatus(reviewId: string, status: 'approved' | 'rejected', adminNote?: string): Promise<void> {
    const { error } = await supabase
      .from('company_reviews')
      .update({ status, admin_note: adminNote || null })
      .eq('id', reviewId);

    if (error) throw error;
  },

  // Admin yorum sil
  async adminDeleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('company_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  },
};
