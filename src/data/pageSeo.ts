// Static, build-time SEO metadata for every public route.
//
// WHY THIS EXISTS:
// The site is a client-rendered React SPA. Search/AdSense crawlers and our
// build-time prerenderer need a UNIQUE <title> + meta description for every page,
// available synchronously (without waiting for a Supabase round-trip). These
// static defaults are applied immediately by usePageSeo(); the admin panel can
// still override any page via the Supabase `page_seo` table.

export interface PageSeo {
    title: string;
    description: string;
}

const SITE_NAME = 'Katılım Uzmanı';

export const DEFAULT_SEO: PageSeo = {
    title: `${SITE_NAME} | Tasarruf Finansmanı Hesaplayıcı`,
    description:
        "Türkiye'nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Katılım bankacılığı ile hayallerinize faizsiz ulaşın.",
};

// Keyed by normalized pathname (no trailing slash, except root '/').
export const STATIC_PAGE_SEO: Record<string, PageSeo> = {
    '/': {
        title: `${SITE_NAME} | Tasarruf Finansmanı Hesaplama`,
        description:
            "Tasarruf finansmanı (evim ve araç sistemleri) ödeme planınızı saniyeler içinde hesaplayın, katılım firmalarını karşılaştırın ve size en uygun faizsiz finansman seçeneğini bulun.",
    },
    '/kampanyalar': {
        title: 'Tasarruf Finansmanı Kampanyaları | ' + SITE_NAME,
        description:
            'Katılım ve tasarruf finansmanı firmalarının güncel kampanyalarını, indirim ve avantajlarını tek sayfada keşfedin. Size en uygun faizsiz finansman kampanyasını seçin.',
    },
    '/katilim-firmalari': {
        title: 'Katılım Firmaları Karşılaştırma | ' + SITE_NAME,
        description:
            'Türkiye’deki tasarruf finansmanı ve katılım firmalarını inceleyin; teslim süreleri, organizasyon ücretleri ve koşullarını karşılaştırarak doğru firmayı seçin.',
    },
    '/sektor-haberleri': {
        title: 'Sektör Haberleri | Tasarruf Finansmanı | ' + SITE_NAME,
        description:
            'Tasarruf finansmanı, katılım bankacılığı ve faizsiz finans dünyasındaki son gelişmeler, mevzuat değişiklikleri ve şirket haberleri.',
    },
    '/blog': {
        title: 'Blog | Tasarruf Finansmanı Rehberleri | ' + SITE_NAME,
        description:
            'Tasarruf finansmanı, evim ve araç sistemleri, faizsiz ev/araç sahibi olma süreçleri hakkında uzman rehberler, ipuçları ve detaylı blog yazıları.',
    },
    '/iletisim': {
        title: 'İletişim | ' + SITE_NAME + "'na Ulaşın",
        description:
            'Tasarruf finansmanı ve katılım firmaları hakkındaki sorularınız için Katılım Uzmanı ekibine ulaşın; danışmanlık talebi oluşturun, görüş ve önerilerinizi iletin.',
    },
    '/hakkimizda': {
        title: 'Hakkımızda | ' + SITE_NAME,
        description:
            'Katılım Uzmanı; tasarruf finansmanı ve faizsiz finansman sistemlerini şeffaf biçimde karşılaştırmanız için kurulan bağımsız bir bilgi ve hesaplama platformudur.',
    },
};

// Routes the prerenderer always emits as static HTML (the "must be filled" pages).
// Detail pages (blog/news/company/campaign slugs) are discovered dynamically by
// crawling the rendered listing pages, so they are not hard-coded here.
export const STATIC_PRERENDER_ROUTES: string[] = [
    '/',
    '/kampanyalar',
    '/katilim-firmalari',
    '/sektor-haberleri',
    '/blog',
    '/iletisim',
    '/hakkimizda',
];

export function getStaticSeo(pathname: string): PageSeo | undefined {
    const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    return STATIC_PAGE_SEO[path];
}

/**
 * Build an SEO <title> that never exceeds `max` (default 60) characters.
 *
 * Strategy — the first variant that fits wins:
 *   1. `${base} | ${fullSuffix}`   e.g. "Yazı Başlığı | Katılım Uzmanı Blog"
 *   2. `${base} | Katılım Uzmanı`  (short brand-only suffix)
 *   3. `${base}`                   (no suffix at all)
 *   4. base truncated at a word boundary (when the base alone already exceeds max)
 *
 * This fixes the existing long titles AND prevents recurrence: the long
 * "| Katılım Uzmanı Blog/Haberler/Kampanyalar" suffix is only appended while it
 * still fits in 60 characters, otherwise it degrades gracefully.
 */
export function buildSeoTitle(base: string, fullSuffix?: string, max = 60): string {
    const t = (base || '').trim();
    if (!t) return SITE_NAME;

    if (fullSuffix) {
        const withFull = `${t} | ${fullSuffix}`;
        if (withFull.length <= max) return withFull;
    }

    const withBrand = `${t} | ${SITE_NAME}`;
    if (withBrand.length <= max) return withBrand;

    if (t.length <= max) return t;

    // Base title alone is already too long → cut at the last word boundary ≤ max.
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
}
