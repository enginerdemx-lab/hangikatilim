import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowRight, Home, Car, Wallet, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calculator } from '../../../components/Calculator';
import { FAQ } from '../../../components/FAQ';
import { CompanyLogos } from '../../../components/CompanyLogos';
import { homeHeroApi } from '../../services/api/homeHero';
import type { HomeHero } from '../../types/database';

interface OutletContextType {
    theme: 'light' | 'dark';
}

const HomePage: React.FC = () => {
    const { theme } = useOutletContext<OutletContextType>();
    const [heroSlides, setHeroSlides] = useState<HomeHero[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [heroLoading, setHeroLoading] = useState(true);

    useEffect(() => {
        loadHeroSlides();
    }, []);

    const loadHeroSlides = async () => {
        try {
            const slides = await homeHeroApi.getAllSlides();
            setHeroSlides(slides);
        } catch (error) {
            console.error('Failed to load hero slides:', error);
        } finally {
            setHeroLoading(false);
        }
    };

    // Auto-advance slider
    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlideIndex((prev: number) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroSlides.length]);

    const scrollToSection = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const currentSlide = heroSlides[currentSlideIndex];

    return (
        <>
            {/* Hero Section - Fixed Height Slider */}
            <section className="bg-gray-50 dark:bg-slate-900 py-6 md:py-10">
                <div className="container mx-auto px-4">
                    {/* 
                        Fixed Height Container - Prevents CLS (Cumulative Layout Shift)
                        Mobile: 280px, SM: 320px, MD: 360px, LG: 400px
                    */}
                    <div
                        className="relative text-white overflow-hidden rounded-3xl h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px]"
                        style={{
                            background: currentSlide?.background_image_url
                                ? undefined
                                : `linear-gradient(90deg, ${currentSlide?.background_gradient_start || '#4DC9E6'}, ${currentSlide?.background_gradient_end || '#210CAE'})`
                        }}
                    >
                        {/* Background Image - object-cover ensures no distortion */}
                        {currentSlide?.background_image_url && (
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${currentSlide.background_image_url})` }}
                            />
                        )}
                        <div className="absolute inset-0 bg-black/10"></div>

                        {/* Content Container - Flexbox for vertical centering */}
                        <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-8 md:px-12 py-6 md:py-8">
                            <div className="max-w-3xl">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-medium text-white mb-3 animate-fade-in-up backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse"></span>
                                    Hangi Katılım ile Geleceği Planla
                                </div>

                                {/* Title - line-clamp prevents overflow */}
                                <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2 sm:mb-3 tracking-tight line-clamp-2">
                                    {currentSlide?.title || 'Hayalindeki Eve Faizsiz Ulaş!'}
                                </h1>

                                {/* Subtitle - line-clamp-2 limits to 2 lines max */}
                                {currentSlide?.subtitle && (
                                    <p className="text-xs sm:text-sm md:text-base text-gray-100 mb-4 sm:mb-6 max-w-xl leading-relaxed opacity-90 line-clamp-2">
                                        {currentSlide.subtitle}
                                    </p>
                                )}

                                {/* CTA Buttons */}
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {(currentSlide?.cta1_label || !currentSlide) && (
                                        <a
                                            href={currentSlide?.cta1_link || '#calculator'}
                                            onClick={(e) => {
                                                const link = currentSlide?.cta1_link || '#calculator';
                                                if (link.startsWith('#')) {
                                                    scrollToSection(e, link.substring(1));
                                                }
                                            }}
                                            className="bg-white text-[#210CAE] font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-xs sm:text-sm"
                                        >
                                            {currentSlide?.cta1_label || 'Hesaplamaya Başla'}
                                            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                                        </a>
                                    )}
                                    {currentSlide?.cta2_label && (
                                        <a
                                            href={currentSlide?.cta2_link || '#info'}
                                            onClick={(e) => {
                                                const link = currentSlide?.cta2_link || '#info';
                                                if (link.startsWith('#')) {
                                                    scrollToSection(e, link.substring(1));
                                                }
                                            }}
                                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-xs sm:text-sm backdrop-blur-sm"
                                        >
                                            {currentSlide.cta2_label}
                                            <Info size={14} className="sm:w-4 sm:h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Slider Navigation - Positioned at bottom */}
                            {heroSlides.length > 1 && (
                                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex items-center gap-1.5 sm:gap-2">
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
