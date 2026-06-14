import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRight, Home, Car, Wallet, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { FAQ } from '../../../components/FAQ';
import { CompanyLogos } from '../../../components/CompanyLogos';
import { QuickLinksGrid } from '../../../components/QuickLinksGrid';
import { SectorNewsCarousel } from '../../components/SectorNewsCarousel';
import { homeHeroApi } from '../../services/api/homeHero';
import { usePageSeo } from '../../hooks/usePageSeo';
import type { HomeHero } from '../../types/database';

interface OutletContextType {
    theme: 'light' | 'dark';
}

const Calculator = React.lazy(() =>
    import('../../components/Calculator').then(module => ({ default: module.Calculator }))
);

// Cache constants
const HERO_CACHE_KEY = 'hero_slides_cache';
const HERO_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface HeroCache {
    slides: HomeHero[];
    timestamp: number;
}

// Get cached slides from localStorage
const getCachedSlides = (): HomeHero[] | null => {
    try {
        const cached = localStorage.getItem(HERO_CACHE_KEY);
        if (!cached) return null;

        const { slides }: HeroCache = JSON.parse(cached);

        // Return cached data (will be updated in background)
        return slides.length > 0 ? slides : null;
    } catch {
        return null;
    }
};

// Save slides to localStorage cache
const setCachedSlides = (slides: HomeHero[]) => {
    try {
        const cache: HeroCache = { slides, timestamp: Date.now() };
        localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // localStorage might be full or disabled
    }
};

const optimizeImageUrl = (url: string, width: number): string => {
    if (!url) return url;

    try {
        const parsed = new URL(url);
        if (parsed.pathname.includes('/storage/v1/object/public/')) {
            parsed.pathname = parsed.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
            parsed.searchParams.set('width', String(width));
            parsed.searchParams.set('quality', '74');
            parsed.searchParams.set('resize', 'cover');
            return parsed.toString();
        }
    } catch {
        // Keep non-URL or provider URLs untouched.
    }

    return url;
};

// Skeleton Loader Component - Same height as actual hero
const HeroSkeleton: React.FC = () => (
    <div className="relative overflow-hidden rounded-3xl min-h-[320px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[440px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700">
        {/* Shimmer animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"
            style={{ animation: 'shimmer 2s infinite' }} />

        <div className="h-full flex flex-col justify-center px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16">
            <div className="max-w-3xl space-y-4">
                {/* Badge skeleton */}
                <div className="w-48 h-6 bg-white/20 rounded-full animate-pulse" />
                {/* Title skeleton */}
                <div className="w-3/4 h-10 sm:h-12 bg-white/20 rounded-lg animate-pulse" />
                <div className="w-1/2 h-10 sm:h-12 bg-white/20 rounded-lg animate-pulse" />
                {/* Subtitle skeleton */}
                <div className="w-full max-w-xl h-4 bg-white/20 rounded mt-2 animate-pulse" />
                <div className="w-2/3 max-w-xl h-4 bg-white/20 rounded animate-pulse" />
                {/* Button skeletons */}
                <div className="flex gap-3 mt-4">
                    <div className="w-40 h-12 bg-white/30 rounded-xl animate-pulse" />
                    <div className="w-32 h-12 bg-white/10 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    </div>
);

const HomePage: React.FC = () => {
    const { theme } = useOutletContext<OutletContextType>();
    usePageSeo();

    // Her zaman taze veriyle başla: admin'de yapılan güncelleme anında görünür,
    // eski (önbellekteki) içerik kısa süre görünüp "yanıp sönme" yaşanmaz.
    const [heroSlides, setHeroSlides] = useState<HomeHero[] | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHeroSlides();
    }, []);

    const loadHeroSlides = async () => {
        try {
            const slides = await homeHeroApi.getAllSlides();
            setHeroSlides(slides);

            // Preload first slide image for instant display
            if (slides[0]?.background_image_url || slides[0]?.mobile_image_url) {
                const img = new Image();
                img.src = optimizeImageUrl(slides[0].mobile_image_url || slides[0].background_image_url || '', 768);
            }
        } catch (error) {
            console.error('Failed to load hero slides:', error);
            // Keep showing cached data if fetch fails
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-advance slider
    useEffect(() => {
        if (!heroSlides || heroSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlideIndex((prev: number) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroSlides?.length]);

    const scrollToSection = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Current slide (only when data exists)
    const currentSlide = heroSlides?.[currentSlideIndex];

    return (
        <>
            {/* Tek H1 — ana anahtar kelime. Görsel tasarımı bozmamak için ekran
                okuyucuya özel (sr-only); sayfadaki ilk ve tek H1 budur. */}
            <h1 className="sr-only">Tasarruf Finansmanı Hesaplama Aracı</h1>

            {/* Quick Links Section */}
            <section className="bg-gray-50 dark:bg-slate-900 pt-4 md:pt-5">
                <div className="container mx-auto px-3 md:px-4 max-w-7xl">
                    <QuickLinksGrid isOverlay={false} />
                </div>
            </section>

            {/* Hero Banner Section */}
            <section className="bg-gray-50 dark:bg-slate-900 py-3 md:py-5">
                <div className="container mx-auto px-3 md:px-4 max-w-7xl">
                    <div className="relative">
                        {/* Show skeleton when loading AND no cached data */}
                        {isLoading && !heroSlides ? (
                            <HeroSkeleton />
                        ) : heroSlides && heroSlides.length > 0 && currentSlide ? (
                            <>
                                {/* Desktop Hero (hidden on mobile) */}
                                <div
                                    className="relative text-white overflow-hidden rounded-3xl transition-all duration-300 w-full max-w-full hidden sm:block"
                                    style={{
                                        aspectRatio: '12 / 5',
                                        minHeight: '320px',
                                        maxHeight: '520px',
                                        background: `linear-gradient(90deg, ${currentSlide.background_gradient_start || '#4DC9E6'}, ${currentSlide.background_gradient_end || '#210CAE'})`
                                    }}
                                >
                                    {/* Desktop Background Image */}
                                    {currentSlide.background_image_url && (
                                        <>
                                            {currentSlide.image_fit_mode === 'contain' ? (
                                                <div className="absolute inset-0 flex items-center justify-center rounded-3xl overflow-hidden">
                                                    <img
                                                        src={optimizeImageUrl(currentSlide.background_image_url, 1200)}
                                                        alt="Banner"
                                                        className="max-w-full max-h-full object-contain transition-opacity duration-500"
                                                        loading="eager"
                                                        fetchPriority={currentSlideIndex === 0 ? 'high' : 'auto'}
                                                        decoding="async"
                                                    />
                                                </div>
                                            ) : (
                                                <img
                                                    src={optimizeImageUrl(currentSlide.background_image_url, 1200)}
                                                    alt=""
                                                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 rounded-3xl"
                                                    style={{ objectPosition: `${currentSlide.object_position_x ?? 50}% ${currentSlide.object_position_y ?? 50}%` }}
                                                    loading="eager"
                                                    fetchPriority={currentSlideIndex === 0 ? 'high' : 'auto'}
                                                    decoding="async"
                                                />
                                            )}
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/10 rounded-3xl pointer-events-none"></div>

                                    {/* Desktop Content */}
                                    <div className="relative z-10 w-full h-full px-6 md:px-8 py-8 md:py-10 flex flex-col justify-center">
                                        <div className="max-w-xl space-y-3">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-medium mb-3 animate-fade-in-up backdrop-blur-sm" style={{ color: currentSlide.badge_text_color || currentSlide.text_color || '#FFFFFF' }}>
                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentSlide.badge_text_color || currentSlide.text_color || '#FFFFFF' }}></span>
                                                Katılım Uzmanı ile Geleceği Planla
                                            </div>
                                            <p className="text-xl md:text-2xl font-semibold leading-snug tracking-tight line-clamp-2" style={{ color: currentSlide.text_color || undefined }}>
                                                {currentSlide.title}
                                            </p>
                                            {currentSlide.subtitle && (
                                                <p className="text-sm md:text-base text-gray-100 max-w-lg leading-relaxed opacity-90 line-clamp-2" style={{ color: currentSlide.text_color || undefined }}>
                                                    {currentSlide.subtitle}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                {currentSlide.cta1_label && (
                                                    <a
                                                        href={currentSlide.cta1_link || '#calculator'}
                                                        onClick={(e) => {
                                                            const link = currentSlide.cta1_link || '#calculator';
                                                            if (link.startsWith('#')) {
                                                                scrollToSection(e, link.substring(1));
                                                            }
                                                        }}
                                                        className="bg-white text-[#210CAE] font-semibold px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg text-sm"
                                                        style={{ backgroundColor: currentSlide.button_color || undefined, color: currentSlide.button_text_color || undefined }}
                                                    >
                                                        {currentSlide.cta1_label}
                                                        <ArrowRight size={16} />
                                                    </a>
                                                )}
                                                {currentSlide.cta2_label && (
                                                    <a
                                                        href={currentSlide.cta2_link || '#'}
                                                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-5 py-2.5 rounded-lg border border-white/20 flex items-center gap-2 transition-all text-sm"
                                                    >
                                                        {currentSlide.cta2_label}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Hero (visible only on mobile) */}
                                <div
                                    className="relative text-white overflow-hidden rounded-3xl transition-all duration-300 w-full max-w-full sm:hidden h-[280px]"
                                    style={{
                                        background: `linear-gradient(90deg, ${currentSlide.background_gradient_start || '#4DC9E6'}, ${currentSlide.background_gradient_end || '#210CAE'})`
                                    }}
                                >
                                    {/* Mobile Background Image */}
                                    {(currentSlide.mobile_image_url || currentSlide.background_image_url) && (
                                        <img
                                            src={optimizeImageUrl(currentSlide.mobile_image_url || currentSlide.background_image_url || '', 768)}
                                            alt=""
                                            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 rounded-3xl"
                                            loading="eager"
                                            fetchPriority={currentSlideIndex === 0 ? 'high' : 'auto'}
                                            decoding="async"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/10 rounded-3xl pointer-events-none"></div>

                                    {/* Mobile Content */}
                                    <div className="relative z-10 w-full h-full px-4 py-4 flex flex-col justify-end">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-medium mb-2 animate-fade-in-up backdrop-blur-sm" style={{ color: currentSlide.badge_text_color || currentSlide.text_color || '#FFFFFF' }}>
                                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: currentSlide.badge_text_color || currentSlide.text_color || '#FFFFFF' }}></span>
                                                Katılım Uzmanı ile Geleceği Planla
                                            </div>
                                            <p className="text-lg font-semibold leading-snug tracking-tight line-clamp-2" style={{ color: currentSlide.text_color || undefined }}>
                                                {currentSlide.title}
                                            </p>
                                            {currentSlide.subtitle && (
                                                <p className="text-xs text-gray-100 leading-relaxed opacity-90 line-clamp-2" style={{ color: currentSlide.text_color || undefined }}>
                                                    {currentSlide.subtitle}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {currentSlide.cta1_label && (
                                                    <a
                                                        href={currentSlide.cta1_link || '#calculator'}
                                                        onClick={(e) => {
                                                            const link = currentSlide.cta1_link || '#calculator';
                                                            if (link.startsWith('#')) {
                                                                scrollToSection(e, link.substring(1));
                                                            }
                                                        }}
                                                        className="bg-white text-[#210CAE] font-semibold px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all hover:shadow-lg text-xs"
                                                        style={{ backgroundColor: currentSlide.button_color || undefined, color: currentSlide.button_text_color || undefined }}
                                                    >
                                                        {currentSlide.cta1_label}
                                                        <ArrowRight size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Slider Navigation */}
                                {heroSlides.length > 1 && (
                                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2 z-30 pointer-events-auto">
                                        <button
                                            onClick={() => setCurrentSlideIndex((prev: number) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                                            className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                            aria-label="Önceki slide"
                                        >
                                            <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                                        </button>
                                        <div className="flex gap-1.5 sm:gap-2">
                                            {heroSlides.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentSlideIndex(index)}
                                                    className={`h-1.5 sm:h-2 rounded-full transition-all ${index === currentSlideIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 w-1.5 sm:w-2'
                                                        }`}
                                                    aria-label={`Slide ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentSlideIndex((prev: number) => (prev + 1) % heroSlides.length)}
                                            className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                            aria-label="Sonraki slide"
                                        >
                                            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Fallback skeleton if no data at all */
                            <HeroSkeleton />
                        )}
                    </div>
                </div>
            </section>

            <React.Suspense fallback={<div className="bg-white dark:bg-slate-900 min-h-[680px]" aria-hidden="true" />}>
                <Calculator theme={theme} />
            </React.Suspense>

            {/* Info Section */}
            <section id="info" className="bg-white dark:bg-slate-850 py-8 md:py-10 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-3 md:px-4 max-w-5xl">
                    <div className="text-center max-w-xl mx-auto mb-6 md:mb-8">
                        <h2 className="text-base md:text-lg font-semibold text-primary-900 dark:text-white mb-2">Tasarruf Finansmanı (Evim Sistemleri) Nedir?</h2>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Tasarruf finansmanı, bireylerin ev veya araba gibi büyük ölçekli yatırımları, faiz maliyeti olmadan, dayanışma ve sıra sistemiyle finanse etmelerini sağlayan bir yöntemdir.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-gray-50 dark:bg-slate-800 p-3 md:p-5 rounded-lg border border-gray-100 dark:border-slate-700 text-center hover:shadow-sm transition-all">
                            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-primary-600 dark:text-primary-400">
                                <Home size={18} />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Dayanışma Tasarrufu</h3>
                            <p className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                                Belirli bir amaca yönelik bir araya gelen kişiler, her ay düzenli ödemeler yaparak finansal güçlerini birleştirirler.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 p-3 md:p-5 rounded-lg border border-gray-100 dark:border-slate-700 text-center hover:shadow-sm transition-all">
                            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-primary-600 dark:text-primary-400">
                                <Wallet size={18} />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Faizsiz Sistem</h3>
                            <p className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                                Klasik kredi sistemlerinden farklı olarak, vade farkı veya faiz ödemezsiniz. Sadece organizasyon katılım bedeli alınır.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 p-3 md:p-5 rounded-lg border border-gray-100 dark:border-slate-700 text-center hover:shadow-sm transition-all">
                            <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
                                <Car size={18} />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Erken Teslimat</h3>
                            <p className="text-[11px] md:text-xs text-gray-600 dark:text-gray-400">
                                Noter huzurunda yapılan çekilişlerle veya peşinatlı sistemlerle, vadeniz bitmeden evinizi veya aracınızı teslim alabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sector News Carousel */}
            <SectorNewsCarousel maxItems={9} />

            <CompanyLogos />
            <FAQ />
        </>
    );
};

export default HomePage;
