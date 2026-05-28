import { supabase } from '../supabaseClient';

export type FavoriteItemType = 'company' | 'news' | 'blog';

export interface Favorite {
    id: string;
    user_id: string;
    item_type: FavoriteItemType;
    item_id: string;
    created_at: string;
}

export interface FavoriteWithDetails extends Favorite {
    title?: string;
    image_url?: string;
    slug?: string;
}

export const favoritesApi = {
    // Kullanıcının tüm favorilerini getir
    async getUserFavorites(userId: string, itemType?: FavoriteItemType): Promise<Favorite[]> {
        let query = supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (itemType) {
            query = query.eq('item_type', itemType);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    // Detaylı favorileri getir (başlık, resim vs. ile birlikte)
    async getUserFavoritesWithDetails(userId: string, itemType?: FavoriteItemType): Promise<FavoriteWithDetails[]> {
        const favorites = await this.getUserFavorites(userId, itemType);
        if (favorites.length === 0) return [];

        const enriched: FavoriteWithDetails[] = [];

        // Firma favorileri
        const companyFavs = favorites.filter(f => f.item_type === 'company');
        if (companyFavs.length > 0) {
            const { data: companies } = await supabase
                .from('companies')
                .select('id, name, logo_url')
                .in('id', companyFavs.map(f => f.item_id));

            const companyMap = new Map((companies || []).map(c => [c.id, c]));
            companyFavs.forEach(fav => {
                const company = companyMap.get(fav.item_id);
                enriched.push({
                    ...fav,
                    title: company?.name || 'Bilinmeyen Firma',
                    image_url: company?.logo_url,
                });
            });
        }

        // Haber favorileri
        const newsFavs = favorites.filter(f => f.item_type === 'news');
        if (newsFavs.length > 0) {
            const { data: news } = await supabase
                .from('news_posts')
                .select('id, title, cover_image_url, slug')
                .in('id', newsFavs.map(f => f.item_id));

            const newsMap = new Map((news || []).map(n => [n.id, n]));
            newsFavs.forEach(fav => {
                const post = newsMap.get(fav.item_id);
                enriched.push({
                    ...fav,
                    title: post?.title || 'Bilinmeyen Haber',
                    image_url: post?.cover_image_url,
                    slug: post?.slug,
                });
            });
        }

        // Blog favorileri
        const blogFavs = favorites.filter(f => f.item_type === 'blog');
        if (blogFavs.length > 0) {
            const { data: blogs } = await supabase
                .from('blog_posts')
                .select('id, title, cover_image_url, slug')
                .in('id', blogFavs.map(f => f.item_id));

            const blogMap = new Map((blogs || []).map(b => [b.id, b]));
            blogFavs.forEach(fav => {
                const post = blogMap.get(fav.item_id);
                enriched.push({
                    ...fav,
                    title: post?.title || 'Bilinmeyen Yazı',
                    image_url: post?.cover_image_url,
                    slug: post?.slug,
                });
            });
        }

        // Tarihe göre sırala
        enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return enriched;
    },

    // Favori ekle
    async addFavorite(userId: string, itemType: FavoriteItemType, itemId: string): Promise<Favorite> {
        const { data, error } = await supabase
            .from('favorites')
            .insert([{ user_id: userId, item_type: itemType, item_id: itemId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Favori sil
    async removeFavorite(userId: string, itemType: FavoriteItemType, itemId: string): Promise<void> {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('item_type', itemType)
            .eq('item_id', itemId);

        if (error) throw error;
    },

    // Favori toggle (ekle/çıkar)
    async toggleFavorite(userId: string, itemType: FavoriteItemType, itemId: string): Promise<boolean> {
        const isFav = await this.isFavorited(userId, itemType, itemId);

        if (isFav) {
            await this.removeFavorite(userId, itemType, itemId);
            return false;
        } else {
            await this.addFavorite(userId, itemType, itemId);
            return true;
        }
    },

    // Favori mi kontrol et
    async isFavorited(userId: string, itemType: FavoriteItemType, itemId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('item_type', itemType)
            .eq('item_id', itemId)
            .maybeSingle();

        if (error) return false;
        return !!data;
    },

    // Birden fazla öğenin favori durumunu toplu kontrol et
    async checkMultipleFavorites(userId: string, itemType: FavoriteItemType, itemIds: string[]): Promise<Set<string>> {
        if (itemIds.length === 0) return new Set();

        const { data, error } = await supabase
            .from('favorites')
            .select('item_id')
            .eq('user_id', userId)
            .eq('item_type', itemType)
            .in('item_id', itemIds);

        if (error) return new Set();
        return new Set((data || []).map(f => f.item_id));
    },

    // Favori sayısını getir
    async getFavoriteCount(itemType: FavoriteItemType, itemId: string): Promise<number> {
        const { data, error } = await supabase
            .rpc('get_favorite_count', { p_item_type: itemType, p_item_id: itemId });

        if (error) return 0;
        return data || 0;
    },
};
