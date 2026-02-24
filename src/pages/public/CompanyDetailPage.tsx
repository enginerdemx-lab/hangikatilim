import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companiesApi } from '../../services/api/companies';
import type { Company } from '../../types/database';
import {
    ArrowLeft,
    Building2,
    Calendar,
    MapPin,
    Globe,
    ShieldCheck,
    Loader2,
    ExternalLink
} from 'lucide-react';

const CompanyDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadCompany = async () => {
            if (!slug) {
                setError(true);
                setLoading(false);
                return;
            }

            try {
                const data = await companiesApi.getCompanyBySlug(slug);
                if (data) {
                    setCompany(data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Failed to load company:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadCompany();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
                <Building2 size={48} className="text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Firma Bulunamadı</h1>
                <p className="text-gray-500 dark:text-gray-400">Aradığınız firma mevcut değil veya kaldırılmış olabilir.</p>
                <Link
                    to="/katilim-firmalari"
                    className="mt-4 flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                    <ArrowLeft size={18} />
                    Firmalara Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 md:py-12">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Back Link */}
                <Link
                    to="/katilim-firmalari"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 font-medium mb-8 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Tüm Firmalara Dön
                </Link>

                {/* Company Header */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 md:p-8 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Logo */}
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-slate-700 flex-shrink-0 p-4">
                            {company.logo_url ? (
                                <img
                                    src={company.logo_url}
                                    alt={company.name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Building2 size={48} className="text-gray-400" />
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {company.name}
                                </h1>
                                {company.is_licensed && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                                        <ShieldCheck size={14} />
                                        BDDK Lisanslı
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold mb-4">
                                {company.name} TASARRUF FİNANSMAN A.Ş.
                            </p>

                            {/* Description */}
                            {company.description && (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                    {company.description}
                                </p>
                            )}

                            {/* Detailed About Content (Rich Text) */}
                            {company.about_content && (
                                <div
                                    className="prose prose-sm md:prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: company.about_content }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Company Details Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Founded Year */}
                    {company.founded_year && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kuruluş Yılı</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white pl-[52px]">
                                {company.founded_year}
                            </p>
                        </div>
                    )}

                    {/* Branch Count */}
                    {company.branch_count && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                                    <MapPin size={20} />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Şube Sayısı</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white pl-[52px]">
                                {company.branch_count}+
                            </p>
                        </div>
                    )}
                </div>

                {/* License Info */}
                {company.is_licensed && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <ShieldCheck size={24} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-green-800 dark:text-green-300 mb-1">BDDK Lisanslı Firma</h3>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    Bu firma, 6361 sayılı Kanun kapsamında Bankacılık Düzenleme ve Denetleme Kurumu (BDDK)
                                    tarafından lisanslanmış ve denetlenen yasal bir tasarruf finansman şirketidir.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Website Button */}
                {company.website_url && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Resmi Web Sitesi</p>
                                    <p className="text-gray-900 dark:text-white font-medium">{company.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
                                </div>
                            </div>
                            <a
                                href={company.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Siteye Git
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Bu sayfadaki bilgiler genel bilgilendirme amaçlıdır. Güncel ve detaylı bilgi için firmanın resmi web sitesini ziyaret ediniz.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailPage;
