import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, ExternalLink, Info, ShieldCheck, Star } from 'lucide-react';
import { companiesApi } from '../../src/services/api/companies';
import { reviewsApi } from '../../src/services/api/reviews';
import type { Company, CompanyRatingStats } from '../../src/types/database';



export const CompaniesPage: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState<Record<string, CompanyRatingStats>>({});

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await companiesApi.getActiveCompanies();
            setCompanies(data);

            // Load ratings for all companies in parallel
            const ratingResults = await Promise.all(
                data.map(async (c) => {
                    try {
                        const stats = await reviewsApi.getRatingStats(c.id);
                        return { id: c.id, stats };
                    } catch { return null; }
                })
            );
            const ratingsMap: Record<string, CompanyRatingStats> = {};
            ratingResults.forEach((r) => {
                if (r && r.stats.total_reviews > 0) ratingsMap[r.id] = r.stats;
            });
            setRatings(ratingsMap);
        } catch (error) {
            console.error('Failed to load companies:', error);
        } finally {
            setLoading(false);
        }
    };

    // Skeleton Loader Component
    const CompanySkeleton = () => (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center gap-6 animate-pulse">
            {/* Logo Skeleton */}
            <div className="w-full md:w-48 h-24 bg-gray-200 dark:bg-slate-700 rounded-xl flex-shrink-0"></div>

            <div className="flex-1 space-y-3">
                {/* Title Skeleton */}
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48"></div>
                {/* Subtitle Skeleton */}
                <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-64"></div>
                {/* Description Skeleton */}
                <div className="h-4 bg-gray-100 dark:bg-slate-600 rounded w-full max-w-md"></div>
                <div className="h-4 bg-gray-100 dark:bg-slate-600 rounded w-3/4 max-w-sm"></div>
                {/* Tags Skeleton */}
                <div className="flex gap-2 pt-2">
                    <div className="h-6 w-20 bg-gray-100 dark:bg-slate-600 rounded"></div>
                    <div className="h-6 w-16 bg-gray-100 dark:bg-slate-600 rounded"></div>
                    <div className="h-6 w-24 bg-green-100 dark:bg-green-900/30 rounded"></div>
                </div>
            </div>

            {/* Button Skeleton */}
            <div className="w-full md:w-40 h-12 bg-blue-100 dark:bg-slate-700 rounded-xl"></div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header Skeleton */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex-1 space-y-4 animate-pulse">
                            <div className="h-6 w-32 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
                            <div className="h-8 w-80 bg-gray-200 dark:bg-slate-700 rounded"></div>
                            <div className="h-4 w-full max-w-lg bg-gray-100 dark:bg-slate-600 rounded"></div>
                            <div className="h-4 w-3/4 max-w-md bg-gray-100 dark:bg-slate-600 rounded"></div>
                        </div>
                        <div className="w-full md:w-1/3 h-40 bg-blue-50 dark:bg-slate-900/50 rounded-2xl animate-pulse"></div>
                    </div>

                    {/* Company Cards Skeleton */}
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <CompanySkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Intro */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <ShieldCheck size={16} />
                            BDDK Lisanslı
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Güvenilir Tasarruf Finansman Şirketleri
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            6361 sayılı Kanun kapsamında Bankacılık Düzenleme ve Denetleme Kurumu (BDDK) tarafından denetlenen, yasal lisansa sahip şirketler listesi aşağıdadır. Bu firmalar, devlet güvencesi ve denetimi altında faaliyet göstermektedir.
                        </p>
                    </div>
                    <div className="w-full md:w-1/3 bg-primary-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-primary-100 dark:border-slate-700">
                        <h3 className="font-bold text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">
                            <Info size={18} /> Neden Lisanslı Firma?
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                Ödemeleriniz yasal güvence altındadır.
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                Sözleşme haklarınız korunur.
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                Şeffaf ve denetlenebilir süreçler.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Companies List */}
                <div className="grid grid-cols-1 gap-6">
                    {companies.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Henüz firma eklenmemiş.
                        </div>
                    ) : (
                        companies.map((company) => (
                            <div key={company.id} className="group bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6">

                                {/* Logo */}
                                <div className="w-full md:w-48 h-24 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 border border-gray-100 dark:border-slate-700 p-4">
                                    {company.logo_url ? (
                                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 size={32} />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{company.name}</h2>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold mb-3">
                                        {company.name} TASARRUF FİNANSMAN A.Ş.
                                    </p>
                                    {company.description && (
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                            {company.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-4">
                                        {company.founded_year && (
                                            <span className="text-xs bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                                Kuruluş: {company.founded_year}
                                            </span>
                                        )}
                                        {company.branch_count && (
                                            <span className="text-xs bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                                Şube: {company.branch_count}+
                                            </span>
                                        )}
                                        {company.is_licensed && (
                                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded flex items-center gap-1">
                                                <ShieldCheck size={12} /> Lisanslı
                                            </span>
                                        )}
                                        {ratings[company.id] && (
                                            <span className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                                {ratings[company.id].avg_rating} ({ratings[company.id].total_reviews})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-3 mt-2 md:mt-0">
                                    {company.website_url && (
                                        <a
                                            href={company.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 md:w-40 bg-primary-50 dark:bg-slate-900 hover:bg-primary-100 dark:hover:bg-slate-700 text-primary-700 dark:text-primary-400 font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            Siteye Git <ExternalLink size={16} />
                                        </a>
                                    )}
                                    <a
                                        href={`/katilim-firmalari/${company.name
                                            .toLowerCase()
                                            .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                                            .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i')
                                            .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                                        className="flex-1 md:w-40 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Info size={16} /> Firma Hakkında
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-12 text-center">
                    <a
                        href="https://www.bddk.org.tr/Kurulus/Liste/89"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 transition-colors font-medium border-b border-gray-300 dark:border-gray-600 pb-0.5 hover:border-primary-600"
                    >
                        Resmi BDDK Listesini Görüntülemek İçin Tıklayın <ExternalLink size={14} />
                    </a>
                </div>

            </div>
        </div>
    );
};
