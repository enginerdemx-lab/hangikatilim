import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Admin imports (not lazy loaded for now)
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { HomeContent } from './pages/admin/HomeContent';
import { SiteSettings } from './pages/admin/SiteSettings';
import { Ticker } from './pages/admin/Ticker';
import { HomeHeroSettings } from './pages/admin/HomeHeroSettings';
import { Calculator as AdminCalculator } from './pages/admin/Calculator';
import { News as AdminNews } from './pages/admin/News';
import { Blog as AdminBlog } from './pages/admin/Blog';
import { Contact as AdminContact } from './pages/admin/Contact';
import { Media } from './pages/admin/Media';
import { Campaigns as AdminCampaigns } from './pages/admin/Campaigns';
import { Companies as AdminCompanies } from './pages/admin/Companies';
import { QuickLinks } from './pages/admin/QuickLinks';

// Inline test component
const TestUsersPage = () => <div>TEST USERS PAGE WORKS</div>;

// Public Layout
import { PublicLayout } from './layouts/PublicLayout';
import { ScrollToHash } from './components/ScrollToHash';

// Lazy loaded public pages for code splitting
const HomePage = lazy(() => import('./pages/public/HomePage'));
const CampaignsPage = lazy(() => import('./pages/public/CampaignsPage'));
const CompaniesPage = lazy(() => import('./pages/public/CompaniesPage'));
const NewsPage = lazy(() => import('./pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/public/NewsDetailPage'));
const BlogPage = lazy(() => import('./pages/public/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/public/BlogDetailPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/public/ProfilePage'));
const SavedCalculationsPage = lazy(() => import('./pages/public/SavedCalculationsPage'));

// Loading component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Yükleniyor...</p>
    </div>
  </div>
);

// 404 Page
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-600 mt-4">Sayfa bulunamadı</p>
      <a href="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Ana Sayfaya Dön
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        {/* Admin Routes - Must be BEFORE public routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<TestUsersPage />} />
          <Route path="home-content" element={<HomeContent />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="ticker" element={<Ticker />} />
          <Route path="home-hero" element={<HomeHeroSettings />} />
          <Route path="calculator" element={<AdminCalculator />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="media" element={<Media />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="quick-links" element={<QuickLinks />} />
        </Route>

        {/* Public Routes with Layout */}
        <Route path="/" element={<PublicLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="kampanyalar"
            element={
              <Suspense fallback={<PageLoader />}>
                <CampaignsPage />
              </Suspense>
            }
          />
          <Route
            path="katilim-firmalari"
            element={
              <Suspense fallback={<PageLoader />}>
                <CompaniesPage />
              </Suspense>
            }
          />
          <Route
            path="sektor-haberleri"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewsPage />
              </Suspense>
            }
          />
          <Route
            path="sektor-haberleri/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewsDetailPage />
              </Suspense>
            }
          />
          <Route
            path="blog"
            element={
              <Suspense fallback={<PageLoader />}>
                <BlogPage />
              </Suspense>
            }
          />
          <Route
            path="blog/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <BlogDetailPage />
              </Suspense>
            }
          />
          <Route
            path="iletisim"
            element={
              <Suspense fallback={<PageLoader />}>
                <ContactPage />
              </Suspense>
            }
          />
          {/* Auth Routes */}
          <Route
            path="login"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="register"
            element={
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            }
          />
          {/* Profile Routes */}
          <Route
            path="profil"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="profil/hesaplamalar"
            element={
              <Suspense fallback={<PageLoader />}>
                <SavedCalculationsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Global 404 - Catches everything else */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;