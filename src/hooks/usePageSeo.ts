import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pageSeoApi } from '../services/api/pageSeo';
import { siteSettingsApi } from '../services/api/siteSettings';

// In-memory cache to avoid re-fetching on every navigation
const seoCache: Record<string, { title: string; description: string }> = {};
let globalSiteSettingsCache: any = null;

/**
 * Hook that automatically sets page title, meta description, and canonical URL
 * based on the page_seo table in Supabase.
 * 
 * Usage: usePageSeo() — no arguments needed, it reads path from React Router.
 * For pages with a fallback title (e.g. before data loaded): usePageSeo('Fallback Title')
 */
export function usePageSeo(fallbackTitle?: string) {
    const location = useLocation();
    const appliedRef = useRef(false);

    // Normalize path: remove trailing slash except for root
    const pagePath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');

    useEffect(() => {
        appliedRef.current = false;

        // Set canonical immediately (doesn't need DB)
        setCanonical(`https://katilimuzmani.com${pagePath}`);

        const applySeoData = async () => {
            let globalImage = '';
            try {
                if (!globalSiteSettingsCache) {
                    globalSiteSettingsCache = await siteSettingsApi.getSettings();
                }
                globalImage = globalSiteSettingsCache?.og_image_url || '';
            } catch (err) {
                console.error('Site ayarları yüklenemedi:', err);
            }

            // Check if page SEO in cache
            if (seoCache[pagePath]) {
                applyMeta(seoCache[pagePath].title, seoCache[pagePath].description, globalImage);
                appliedRef.current = true;
                return;
            }

            // If fallback provided, set it immediately (will be overridden by DB data)
            if (fallbackTitle && !appliedRef.current) {
                document.title = fallbackTitle;
            }

            try {
                // Fetch from DB
                const seo = await pageSeoApi.getPageSeo(pagePath);
                if (seo && seo.seo_title) {
                    seoCache[pagePath] = { title: seo.seo_title, description: seo.seo_description || '' };
                    applyMeta(seo.seo_title, seo.seo_description || '', globalImage);
                    appliedRef.current = true;
                } else if (fallbackTitle && !appliedRef.current) {
                    document.title = fallbackTitle;
                    // Apply global image even if no specific SEO entry
                    applyMeta(fallbackTitle, '', globalImage);
                }
            } catch (err) {
                console.error('SEO verisi yüklenemedi:', err);
                if (fallbackTitle) document.title = fallbackTitle;
            }
        };
        
        applySeoData();

        // BreadcrumbList JSON-LD
        if (pagePath !== '/') {
            const PAGE_LABELS: Record<string, string> = {
                '/kampanyalar': 'Kampanyalar',
                '/katilim-firmalari': 'Katılım Firmaları',
                '/sektor-haberleri': 'Sektör Haberleri',
                '/blog': 'Blog',
                '/iletisim': 'İletişim',
                '/hakkimizda': 'Hakkımızda',
            };

            const breadcrumb = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Ana Sayfa',
                        'item': 'https://katilimuzmani.com'
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': PAGE_LABELS[pagePath] || pagePath.replace('/', ''),
                        'item': `https://katilimuzmani.com${pagePath}`
                    }
                ]
            };

            const oldBc = document.querySelector('script[data-seo="breadcrumb-jsonld"]');
            if (oldBc) oldBc.remove();

            const bcScript = document.createElement('script');
            bcScript.type = 'application/ld+json';
            bcScript.setAttribute('data-seo', 'breadcrumb-jsonld');
            bcScript.textContent = JSON.stringify(breadcrumb);
            document.head.appendChild(bcScript);
        }

        return () => {
            // Cleanup: restore default title on unmount
            document.title = 'Katılım Uzmanı';
            const bc = document.querySelector('script[data-seo="breadcrumb-jsonld"]');
            if (bc) bc.remove();
        };
    }, [pagePath]);
}

function applyMeta(title: string, description: string, ogImage?: string) {
    // Title
    if (title) {
        document.title = title;
    }

    // Meta description
    if (description) {
        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (meta) {
            meta.content = description;
        } else {
            meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }

        // Also update OG description
        const ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
        if (ogDesc) ogDesc.content = description;

        const twDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
        if (twDesc) twDesc.content = description;
    }

    // Update OG title
    if (title) {
        const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
        if (ogTitle) ogTitle.content = title;

        const twTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
        if (twTitle) twTitle.content = title;
    }

    // Update OG Image
    if (ogImage) {
        const metaOgImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (metaOgImage) metaOgImage.content = ogImage;

        const metaTwImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
        if (metaTwImage) metaTwImage.content = ogImage;
    }
}

function setCanonical(url: string) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (link) {
        link.href = url;
    } else {
        link = document.createElement('link');
        link.rel = 'canonical';
        link.href = url;
        document.head.appendChild(link);
    }
}
