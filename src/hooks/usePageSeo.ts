import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pageSeoApi } from '../services/api/pageSeo';
import { siteSettingsApi } from '../services/api/siteSettings';
import { getStaticSeo } from '../data/pageSeo';

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

    // Normalize path: remove trailing slash except for root.
    // pagePath stays slash-less because it keys the static + Supabase SEO maps.
    const pagePath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');

    // Canonical / og:url use the trailing-slash form. The server 301-redirects the
    // slash-less variant to the slash-ful one, so every page must self-reference the
    // slash-ful URL — otherwise the canonical itself points at a redirect (or, when
    // left at the index.html default, at the home page) and the page won't index.
    const SITE_ORIGIN = 'https://katilimuzmani.com';
    const canonicalUrl = pagePath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${pagePath}/`;

    useEffect(() => {
        appliedRef.current = false;

        // Set canonical + og:url immediately (no DB needed). Both self-reference the
        // slash-ful URL so a crawler never sees a canonical/og:url that 301-redirects.
        setCanonical(canonicalUrl);
        setOgUrl(canonicalUrl);

        // Apply STATIC per-route SEO synchronously. This guarantees every page has a
        // unique, crawlable <title>/description on first paint and in the prerendered
        // HTML — even before, or entirely without, a Supabase round-trip. A matching
        // row in the Supabase `page_seo` table (if any) still overrides it below.
        const staticSeo = getStaticSeo(pagePath);
        if (staticSeo) {
            applyMeta(staticSeo.title, staticSeo.description, '');
            appliedRef.current = true;
        } else if (fallbackTitle) {
            document.title = fallbackTitle;
        }

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
                        'item': `${SITE_ORIGIN}/`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': PAGE_LABELS[pagePath] || pagePath.replace('/', ''),
                        'item': canonicalUrl
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
            // NOTE: we intentionally do NOT reset document.title here. The next route's
            // usePageSeo() sets its own title synchronously on mount, so resetting to a
            // generic title would only cause a brief, visible title flicker.
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

function setOgUrl(url: string) {
    // index.html ships a hard-coded og:url pointing at the home page. Without this
    // update every prerendered page would advertise the home URL as its og:url.
    let tag = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (tag) {
        tag.content = url;
    } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', 'og:url');
        tag.content = url;
        document.head.appendChild(tag);
    }
}
