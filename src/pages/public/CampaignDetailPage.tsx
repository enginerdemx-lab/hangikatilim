import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Share2, Building2, Truck, Check, Wallet, ExternalLink } from 'lucide-react';
import { campaignsApi } from '../../services/api/campaigns';
import { BlogContent } from '../../components/BlogContent';
import type { Campaign } from '../../types/database';

const CampaignDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadCampaign();
        }
    }, [slug]);

    // SEO meta tags
    useEffect(() => {
        if (campaign) {
            const pageTitle = `${campaign.title} | Katılım Uzmanı Kampanyalar`;
            const pageDesc = campaign.bullet_points?.join('. ') || campaign.title;
            const pageUrl = `https://katilimuzmani.com/kampanyalar/${campaign.slug || campaign.id}`;

            document.title = pageTitle;

            // Meta description
            let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            if (metaDesc) { metaDesc.content = pageDesc; }
            else { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; metaDesc.content = pageDesc; document.head.appendChild(metaDesc); }

            // Canonical
            let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
            if (canonical) { canonical.href = pageUrl; }
            else { canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = pageUrl; document.head.appendChild(canonical); }

            // OG Tags
            const ogTags: Record<string, string> = {
                'og:title': pageTitle,
                'og:description': pageDesc,
                'og:url': pageUrl,
                'og:type': 'article',
                'og:image': campaign.image_url || '',
            };
            Object.entries(ogTags).forEach(([prop, content]) => {
                if (!content) return;
                let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
                if (tag) { tag.content = content; }
                else { tag = document.createElement('meta'); tag.setAttribute('property', prop); tag.content = content; document.head.appendChild(tag); }
            });
        }

        return () => {
            document.title = 'Katılım Uzmanı';
        };
    }, [campaign]);

    const loadCampaign = async () => {
        try {
            setLoading(true);

            // Try slug first, then ID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug!);

            let data: Campaign | null = null;
            if (isUUID) {
                data = await campaignsApi.getCampaignById(slug!);
            } else {
                data = await campaignsApi.getCampaignBySlug(slug!);
            }

            if (!data) {
                setError('Kampanya bulunamadı');
            } else {
                setCampaign(data);
            }
        } catch (err: any) {
            console.error('Error loading campaign:', err);
            setError('Kampanya yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR').format(val);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share && campaign) {
            try {
                await navigator.share({
                    title: campaign.title,
                    text: campaign.bullet_points?.[0] || '',
                    url: url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            await navigator.clipboard.writeText(url);
            alert('Bağlantı kopyalandı!');
        }
    };

    const getBadgeInfo = (badgeType?: string | null) => {
        switch (badgeType) {
            case 'faizsiz_firsat': return { label: 'Faizsiz Fırsat', color: 'bg-orange-100 text-orange-700' };
            case 'ozel_kampanya': return { label: 'Özel Kampanya', color: 'bg-blue-100 text-blue-700' };
            case 'sponsorlu': return { label: 'Sponsorlu', color: 'bg-purple-100 text-purple-700' };
            case 'hemen_teslim': return { label: 'Hemen Teslim', color: 'bg-red-100 text-red-700' };
            default: return { label: 'Fırsat', color: 'bg-green-100 text-green-700' };
        }
    };

    // Reading time estimate
    const getReadingTime = (content: string) => {
        const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} dk okuma`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Kampanya Bulunamadı
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Aradığınız kampanya mevcut değil veya kaldırılmış olabilir.
                        </p>
                        <Link
                            to="/kampanyalar"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Kampanyalara Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const badge = getBadgeInfo(campaign.badge_type);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <Link
                    to="/kampanyalar"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
                >
                    <ArrowLeft size={20} />
                    Kampanyalara Dön
                </Link>

                <div className="max-w-4xl mx-auto">
                    {/* Campaign Image - contained, original proportions */}
                    {campaign.image_url && (
                        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
                            {/* Desktop image */}
                            <img
                                src={campaign.image_url}
                                alt={campaign.title}
                                className="w-full h-auto hidden md:block"
                            />
                            {/* Mobile image */}
                            <img
                                src={campaign.mobile_image_url || campaign.image_url}
                                alt={campaign.title}
                                className="w-full h-auto md:hidden"
                            />
                        </div>
                    )}

                    {/* Compact Info Bar */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 md:p-6 mb-6">
                        {/* Row 1: Badge + Title */}
                        <div className="flex items-start gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 ${badge.color} rounded-full text-xs font-bold mt-1 flex-shrink-0`}>
                                {campaign.badge_type === 'hemen_teslim' && <Truck size={12} />}
                                {badge.label}
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {campaign.title}
                            </h1>
                        </div>

                        {/* Row 2: Company + Stats + Date — all inline */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {campaign.company && (
                                <div className="flex items-center gap-2">
                                    {campaign.company.logo_url && (
                                        <img src={campaign.company.logo_url} alt={campaign.company.name} className="w-5 h-5 object-contain rounded" />
                                    )}
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{campaign.company.name}</span>
                                </div>
                            )}
                            {(campaign.vade_months || 0) > 0 && (
                                <span className="flex items-center gap-1"><Calendar size={14} className="text-blue-500" />{campaign.vade_months} Ay</span>
                            )}
                            {(campaign.amount_tl || 0) > 0 && (
                                <span className="flex items-center gap-1"><Wallet size={14} className="text-green-500" />{formatMoney(campaign.amount_tl || 0)} TL</span>
                            )}
                            <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(campaign.updated_at || campaign.created_at)}</span>
                            {campaign.content && (
                                <span className="flex items-center gap-1"><Clock size={14} />{getReadingTime(campaign.content)}</span>
                            )}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto"
                            >
                                <Share2 size={14} />
                                Paylaş
                            </button>
                        </div>

                        {/* Bullet points — compact */}
                        {campaign.bullet_points && campaign.bullet_points.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                                {campaign.bullet_points.map((point: string, idx: number) => (
                                    <span key={idx} className="flex items-center gap-1.5">
                                        <Check size={13} className="text-green-500 flex-shrink-0" />
                                        {point}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* CTA — compact row */}
                        <div className="flex items-center gap-3">
                            {campaign.application_link && (
                                <button
                                    onClick={() => window.open(campaign.application_link, '_blank')}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm"
                                >
                                    <ExternalLink size={16} />
                                    {campaign.application_button_text || 'Hemen Başvur'}
                                </button>
                            )}
                            {campaign.terms_link && (
                                <a
                                    href={campaign.terms_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-semibold text-gray-500 hover:text-blue-600 hover:underline"
                                >
                                    {campaign.terms_button_text || 'Koşulları İncele'}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Rich Content */}
                    {campaign.content && (
                        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-10 mb-6">
                            <BlogContent html={campaign.content} />
                        </article>
                    )}

                    {/* Footer Nav */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Son güncelleme: {formatDate(campaign.updated_at || campaign.created_at)}
                        </div>
                        <Link
                            to="/kampanyalar"
                            className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                            Tüm Kampanyaları Gör
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetailPage;
