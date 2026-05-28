import { supabase } from '../supabaseClient';

export interface PageSeoData {
    id?: string;
    page_path: string;
    page_label: string;
    seo_title: string;
    seo_description: string;
    created_at?: string;
    updated_at?: string;
}

// Default SEO values for each page (used for initial setup)
export const DEFAULT_PAGE_SEO: Omit<PageSeoData, 'id' | 'created_at' | 'updated_at'>[] = [
    {
        page_path: '/',
        page_label: 'Ana Sayfa',
        seo_title: 'Katılım Uzmanı | Tasarruf Finansmanı Hesaplama ve Karşılaştırma',
        seo_description: 'Türkiye\'nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Konut, araç ve iş yeri finansmanı kampanyalarını karşılaştırın. Faizsiz hayallerinize ulaşın.',
    },
    {
        page_path: '/kampanyalar',
        page_label: 'Kampanyalar',
        seo_title: 'Tasarruf Finansman Kampanyaları 2026 | Güncel Fırsatlar | Katılım Uzmanı',
        seo_description: 'En güncel tasarruf finansmanı kampanyalarını karşılaştırın. Konut, araç ve iş yeri için uygun ödeme planları ve taksit seçeneklerini keşfedin.',
    },
    {
        page_path: '/katilim-firmalari',
        page_label: 'Katılım Firmaları',
        seo_title: 'Katılım Finansman Şirketleri Karşılaştırma | Katılım Uzmanı',
        seo_description: 'Türkiye\'deki tüm tasarruf finansman şirketlerini karşılaştırın. Eminevim, Birevim, Katılımevim, Fuzul Ev ve daha fazlası. Güvenilir firma analizleri.',
    },
    {
        page_path: '/sektor-haberleri',
        page_label: 'Sektör Haberleri',
        seo_title: 'Tasarruf Finansmanı Sektör Haberleri | Son Gelişmeler | Katılım Uzmanı',
        seo_description: 'Tasarruf finansmanı sektöründeki son gelişmeler, şirket haberleri ve mevzuat değişiklikleri. Katılım bankacılığı dünyasından güncel haberler.',
    },
    {
        page_path: '/blog',
        page_label: 'Blog',
        seo_title: 'Katılım Bankacılığı Blog | Rehber ve Yazılar | Katılım Uzmanı',
        seo_description: 'Tasarruf finansmanı, katılım bankacılığı ve faizsiz finans hakkında bilgilendirici yazılar ve rehberler. Finansal okuryazarlığınızı artırın.',
    },
    {
        page_path: '/iletisim',
        page_label: 'İletişim',
        seo_title: 'İletişim | Katılım Uzmanı',
        seo_description: 'Katılım Uzmanı ile iletişime geçin. Sorularınız, önerileriniz ve iş birliği talepleriniz için bize ulaşın.',
    },
    {
        page_path: '/hakkimizda',
        page_label: 'Hakkımızda',
        seo_title: 'Hakkımızda | Katılım Uzmanı',
        seo_description: 'Katılım Uzmanı hakkında bilgi edinin. Misyonumuz, vizyonumuz ve Türkiye\'nin en kapsamlı tasarruf finansmanı platformu olma hedefimiz.',
    },
];

export const pageSeoApi = {
    // Get all page SEO entries
    async getAllPageSeo(): Promise<PageSeoData[]> {
        const { data, error } = await supabase
            .from('page_seo')
            .select('*')
            .order('page_path');

        if (error) throw error;
        return data || [];
    },

    // Get SEO for a specific page path
    async getPageSeo(pagePath: string): Promise<PageSeoData | null> {
        const { data, error } = await supabase
            .from('page_seo')
            .select('*')
            .eq('page_path', pagePath)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Upsert (insert or update) page SEO
    async upsertPageSeo(entry: Omit<PageSeoData, 'id' | 'created_at' | 'updated_at'>): Promise<PageSeoData> {
        const { data, error } = await supabase
            .from('page_seo')
            .upsert(
                { ...entry, updated_at: new Date().toISOString() },
                { onConflict: 'page_path' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Bulk upsert all pages
    async bulkUpsertPageSeo(entries: Omit<PageSeoData, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
        const { error } = await supabase
            .from('page_seo')
            .upsert(
                entries.map(e => ({ ...e, updated_at: new Date().toISOString() })),
                { onConflict: 'page_path' }
            );

        if (error) throw error;
    },

    // Initialize with defaults (only inserts, doesn't overwrite existing)
    async initializeDefaults(): Promise<void> {
        const existing = await this.getAllPageSeo();
        const existingPaths = new Set(existing.map(e => e.page_path));
        const toInsert = DEFAULT_PAGE_SEO.filter(d => !existingPaths.has(d.page_path));

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('page_seo')
                .insert(toInsert);

            if (error) throw error;
        }
    },
};
