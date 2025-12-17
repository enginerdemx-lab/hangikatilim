import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRight, Home, Car, Wallet, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calculator } from '../../../components/Calculator';
import { FAQ } from '../../../components/FAQ';
import { CompanyLogos } from '../../../components/CompanyLogos';
import { QuickLinksGrid } from '../../../components/QuickLinksGrid';
import { homeHeroApi } from '../../services/api/homeHero';
import type { HomeHero } from '../../types/database';

interface OutletContextType {
    theme: 'light' | 'dark';
}

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

    // Initialize with cached data or null (NEVER empty array with fallbacks!)
    const [heroSlides, setHeroSlides] = useState<HomeHero[] | null>(() => getCachedSlides());
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(heroSlides === null);

    useEffect(() => {
        loadHeroSlides();
    }, []);

    const loadHeroSlides = async () => {
        try {
            const slides = await homeHeroApi.getAllSlides();
            setHeroSlides(slides);
            setCachedSlides(slides); // Update cache

            // Preload first slide image for instant display
            if (slides[0]?.background_image_url) {
                const img = new Image();
                img.src = slides[0].background_image_url;
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
            {/* Quick Links Section - BEFORE Hero Banner */}
            <section className="bg-gray-50 dark:bg-slate-900 pt-6 md:pt-8">
                <div className="container mx-auto px-4">
                    <QuickLinksGrid isOverlay={false} />
                </div>
            </section>

            {/* Hero Banner Section */}
            <section className="bg-gray-50 dark:bg-slate-900 pt-4 md:pt-6 pb-8 md:pb-16">
                <div className="container mx-auto px-4">
                    <div className="relative">
                        {/* Show skeleton when loading AND no cached data */}
                        {isLoading && !heroSlides ? (
                            <HeroSkeleton />
                        ) : heroSlides && heroSlides.length > 0 && currentSlide ? (
                            <div
                                className="relative text-white overflow-visible rounded-3xl min-h-[320px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[440px] transition-all duration-300 flex"
                                style={{
                                    background: currentSlide.background_image_url
                                        ? undefined
                                        : `linear-gradient(90deg, ${currentSlide.background_gradient_start || '#4DC9E6'}, ${currentSlide.background_gradient_end || '#210CAE'})`
                                }}
                            >
                                {/* Background Image */}
                                {currentSlide.background_image_url && (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 rounded-3xl"
                                        style={{ backgroundImage: `url(${currentSlide.background_image_url})` }}
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>

                                {/* Content Container - Flexbox for vertical centering */}
                                <div className="relative z-10 w-full px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 flex flex-col justify-center">
                                    {/* Hero Content */}
                                    <div className="max-w-3xl">
                                        {/* Badge */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-medium text-white mb-4 sm:mb-5 animate-fade-in-up backdrop-blur-sm">
                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse"></span>
                                            Hangi Katılım ile Geleceği Planla
                                        </div>

                                        {/* Title */}
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight line-clamp-2">
                                            {currentSlide.title}
                                        </h1>

                                        {/* Subtitle */}
                                        {currentSlide.subtitle && (
                                            <p className="text-sm sm:text-base md:text-lg text-gray-100 mt-3 sm:mt-4 max-w-xl leading-relaxed opacity-90 line-clamp-2">
                                                {currentSlide.subtitle}
                                            </p>
                                        )}

                                        {/* CTA Buttons - Only show if label exists, NO FALLBACK */}
                                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
                                            {currentSlide.cta1_label && (
                                                <a
                                                    href={currentSlide.cta1_link || '#calculator'}
                                                    onClick={(e) => {
                                                        const link = currentSlide.cta1_link || '#calculator';
                                                        if (link.startsWith('#')) {
                                                            scrollToSection(e, link.substring(1));
                                                        }
                                                    }}
                                                    className="bg-white text-[#210CAE] font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-sm sm:text-base"
                                                >
                                                    {currentSlide.cta1_label}
                                                    <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                                                </a>
                                            )}
                                            {currentSlide.cta2_label && (
                                                <a
                                                    href={currentSlide.cta2_link || '#info'}
                                                    onClick={(e) => {
                                                        const link = currentSlide.cta2_link || '#info';
                                                        if (link.startsWith('#')) {
                                                            scrollToSection(e, link.substring(1));
                                                        }
                                                    }}
                                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-sm sm:text-base backdrop-blur-sm"
                                                >
                                                    {currentSlide.cta2_label}
                                                    <Info size={16} className="sm:w-5 sm:h-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Slider Navigation */}
                                    {heroSlides.length > 1 && (
                                        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2">
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
                                </div>
                            </div>
                        ) : (
                            /* Fallback skeleton if no data at all */
                            <HeroSkeleton />
                        )}
                    </div>
                </div>
            </section>

            <Calculator theme={theme} />

            {/* Info Section */}
            <section id="info" className="bg-white dark:bg-slate-850 py-16 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl font-bold text-primary-900 dark:text-white mb-4">Tasarruf Finansmanı (Evim Sistemleri) Nedir?</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Tasarruf finansmanı, bireylerin ev veya araba gibi büyük ölçekli yatırımları, faiz maliyeti olmadan, dayanışma ve sıra sistemiyle finanse etmelerini sağlayan bir yöntemdir.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg transition-all">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
                                <Home size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Dayanışma Tasarrufu</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Belirli bir amaca yönelik bir araya gelen kişiler, her ay düzenli ödemeler yaparak finansal güçlerini birleştirirler.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg transition-all">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
                                <Wallet size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Faizsiz Sistem</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Klasik kredi sistemlerinden farklı olarak, vade farkı veya faiz ödemezsiniz. Sadece organizasyon katılım bedeli alınır.
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg transition-all">
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                                <Car size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Erken Teslimat</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Noter huzurunda yapılan çekilişlerle veya peşinatlı sistemlerle, vadeniz bitmeden evinizi veya aracınızı teslim alabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <CompanyLogos />
            <FAQ />
        </>
    );
};

export default HomePage;
