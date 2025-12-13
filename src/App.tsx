import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Calculator } from './components/Calculator';
import { FAQ } from './components/FAQ';
import { CompanyLogos } from './components/CompanyLogos';
import { HowItWorks } from './components/HowItWorks';
import { Chatbot } from './components/Chatbot';
import { MobileAppPromo } from './components/MobileAppPromo';
import { ArrowRight, Home, Car, Wallet, Facebook, Twitter, Instagram, Linkedin, Info, Mail, ChevronRight } from 'lucide-react';
import { CampaignsPage } from './components/pages/CampaignsPage';
import { CompaniesPage } from './components/pages/CompaniesPage';
import { ContactPage } from './components/pages/ContactPage';
import { BlogPage } from './components/pages/BlogPage';
import { NewsPage } from './components/pages/NewsPage';
import { NewsTicker } from './components/NewsTicker';
import { LegalModal, LegalType } from './components/LegalModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';

const PublicApp: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalType>('KVKK');
  const [activePage, setActivePage] = useState<string>('home');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Default: Light mode (removed: auto dark mode detection)
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
        return (
          <>
            <section className="relative bg-[linear-gradient(90deg,#4DC9E6,#210CAE)] text-white overflow-hidden transition-colors duration-300">
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

            <Calculator
              theme={theme}
            />

            <HowItWorks />

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

            <MobileAppPromo />

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

      <footer className="bg-gray-900 dark:bg-slate-950 text-gray-400 pt-16 pb-12 border-t border-gray-800 dark:border-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;