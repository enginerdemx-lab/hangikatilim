
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Calculator } from './components/Calculator';
import { FAQ } from './components/FAQ';
import { CompanyLogos } from './components/CompanyLogos';
import { HowItWorks } from './components/HowItWorks';
import { Chatbot } from './components/Chatbot';
import { ArrowRight, Home, Car, Wallet, Facebook, Twitter, Instagram, Linkedin, Info, Mail, ChevronRight, ChevronLeft } from 'lucide-react';
import { CampaignsPage } from './components/pages/CampaignsPage';
import { CompaniesPage } from './components/pages/CompaniesPage';
import { ContactPage } from './components/pages/ContactPage';
import { BlogPage } from './components/pages/BlogPage';
import { NewsPage } from './components/pages/NewsPage';
import { NewsTicker } from './components/NewsTicker';
import { LegalModal, LegalType } from './components/LegalModal';
import { homeHeroApi } from './src/services/api/homeHero';
import type { HomeHero } from './src/types/database';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalType>('KVKK');

  // Routing State
  const [activePage, setActivePage] = useState<string>('home');

  // Hero Slides State
  const [heroSlides, setHeroSlides] = useState<HomeHero[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);

  // Load Hero Slides
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
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleOpenLegal = (type: LegalType) => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    // If on another page, go home first then scroll (simplified for this demo)
    if (activePage !== 'home') {
      setActivePage('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Render Content Based on Active Page
  const renderContent = () => {
    switch (activePage) {
      case 'campaigns':
        return <CampaignsPage onNavigate={setActivePage} />;
      case 'companies':
        return <CompaniesPage />;
      case 'news':
        return <NewsPage />;
      case 'contact':
        return <ContactPage />;
      case 'blog':
        return <BlogPage />;
      case 'home':
      default:
        const currentSlide = heroSlides[currentSlideIndex];

        return (
          <>
            {/* Hero Section - Dynamic from Supabase */}
            {heroLoading ? (
              <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </section>
            ) : heroSlides.length > 0 && currentSlide ? (
              <div className="container mx-auto px-4 pt-4">
                <section className="relative text-white overflow-hidden min-h-[300px] md:min-h-[400px] rounded-2xl shadow-xl">
                  {/* All Slides - Stacked with opacity transition */}
                  {heroSlides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-1000 flex items-center ${index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                      {/* Background */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: slide.background_image_url
                            ? `url(${slide.background_image_url}) center/cover`
                            : `linear-gradient(to right, ${slide.background_gradient_start}, ${slide.background_gradient_end})`
                        }}
                      ></div>
                      <div className="absolute inset-0 bg-black/30"></div>

                      <div className="container mx-auto px-6 md:px-20 relative z-10">
                        <div className="max-w-2xl ml-4 md:ml-12">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white mb-6 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            Hangi Katılım ile Geleceği Planla
                          </div>

                          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
                            {slide.title}
                          </h1>

                          {slide.subtitle && (
                            <p className="text-base md:text-xl text-gray-100 mb-8 max-w-2xl leading-relaxed opacity-95">
                              {slide.subtitle}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {slide.cta1_label && slide.cta1_link && (
                              <a
                                href={slide.cta1_link}
                                onClick={(e) => {
                                  if (slide.cta1_link.startsWith('#')) {
                                    scrollToSection(e, slide.cta1_link.substring(1));
                                  }
                                }}
                                className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-base"
                              >
                                {slide.cta1_label}
                                <ArrowRight size={20} />
                              </a>
                            )}

                            {slide.cta2_label && slide.cta2_link && (
                              <a
                                href={slide.cta2_link}
                                onClick={(e) => {
                                  if (slide.cta2_link.startsWith('#')) {
                                    scrollToSection(e, slide.cta2_link.substring(1));
                                  } else if (slide.cta2_link.startsWith('/')) {
                                    e.preventDefault();
                                    setActivePage(slide.cta2_link.substring(1));
                                  }
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-base backdrop-blur-sm"
                              >
                                {slide.cta2_label}
                                <Info size={20} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Slider Controls */}
                  {heroSlides.length > 1 && (
                    <>
                      {/* Navigation Arrows - Hidden on mobile */}
                      <button
                        onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all z-20 items-center justify-center"
                        aria-label="Önceki slide"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all z-20 items-center justify-center"
                        aria-label="Sonraki slide"
                      >
                        <ChevronRight size={24} />
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {heroSlides.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlideIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentSlideIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75 w-2'
                              }`}
                            aria-label={`Slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            ) : (
              // Fallback hero if no slides
              <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-black/10"></div>

                <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white mb-4 animate-fade-in-up backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      Hangi Katılım ile Geleceği Planla
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
                      Tasarruf Finansmanı <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DC9E6] to-white">Hesaplama Aracı</span>
                    </h1>
                    <p className="text-base md:text-lg text-gray-100 mb-8 max-w-2xl leading-relaxed opacity-90">
                      Kendi ödeme planınızı oluşturun, vade farksız ev ve araç sahibi olmanın maliyetlerini anında hesaplayın.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="#calculator"
                        onClick={(e) => scrollToSection(e, 'calculator')}
                        className="bg-white text-[#210CAE] font-bold px-6 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-sm"
                      >
                        Plan Oluştur
                        <ArrowRight size={18} />
                      </a>
                      <a
                        href="#info"
                        onClick={(e) => scrollToSection(e, 'info')}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 text-sm backdrop-blur-sm"
                      >
                        Sistem Nedir?
                        <Info size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <Calculator theme={theme} />

            <HowItWorks />

            {/* Information Section */}
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-primary-200 selection:text-primary-900 transition-colors duration-300 relative flex flex-col">
      <NewsTicker onNavigate={setActivePage} />
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="flex-grow">
        {renderContent()}
      </main>

      <LegalModal
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      <Chatbot />

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-gray-400 pt-16 pb-12 border-t border-gray-800 dark:border-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand Column */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-4">Hangi Katılım</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed mb-6">
                Türkiye'nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Hayallerinize faizsiz ulaşın.
              </p>
              <div className="flex justify-center md:justify-start gap-4">
                <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-6">Hızlı Erişim</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => setActivePage('home')} className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto">
                    <ChevronRight size={14} /> Ana Sayfa
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePage('campaigns')} className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto">
                    <ChevronRight size={14} /> Güncel Kampanyalar
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePage('companies')} className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto">
                    <ChevronRight size={14} /> Katılım Firmaları
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePage('blog')} className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto">
                    <ChevronRight size={14} /> Blog & Haberler
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePage('contact')} className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors w-full md:w-auto">
                    <ChevronRight size={14} /> İletişim
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info Column */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-6">Bize Ulaşın</h3>
              <ul className="space-y-4">
                <li className="flex items-center justify-center md:justify-start gap-3 text-sm">
                  <Mail size={18} className="text-primary-500" />
                  <span>info@hangikatilim.com</span>
                </li>
              </ul>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <img src="https://hangikatilim.com/images/apple-store.png" alt="App Store" className="w-32 h-10 object-contain cursor-pointer hover:scale-105 transition-transform" />
                <img src="https://hangikatilim.com/images/google-play.png" alt="Google Play" className="w-32 h-10 object-contain cursor-pointer hover:scale-105 transition-transform" />
                <img src="https://hangikatilim.com/images/app-gallery.png" alt="App Gallery" className="w-32 h-10 object-contain cursor-pointer hover:scale-105 transition-transform" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-400">Hangi Katılım Platformu © 2025</p>
            <div className="flex gap-6 text-xs text-gray-500">
              <button onClick={() => handleOpenLegal('TERMS')} className="hover:text-white transition-colors">Kullanım Şartları</button>
              <button onClick={() => handleOpenLegal('KVKK')} className="hover:text-white transition-colors">Aydınlatma Metni</button>
              <button onClick={() => handleOpenLegal('CONSENT')} className="hover:text-white transition-colors">Açık Rıza Metni</button>
            </div>
          </div>

          <p className="text-[10px] text-gray-600 dark:text-gray-700 text-center mt-6 max-w-4xl mx-auto leading-relaxed">
            Bu uygulama bilgilendirme amaçlıdır. Hesaplanan tutarlar ve teslimat tarihleri, seçilen parametrelere göre tahmini olarak sunulmaktadır. Kesin sonuçlar için ilgili tasarruf finansman şirketleri ile görüşülmelidir.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
