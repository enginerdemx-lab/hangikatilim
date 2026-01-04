import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Admin imports
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
import { Sponsors as AdminSponsors } from './pages/admin/Sponsors';
import { Feedback as AdminFeedback } from './pages/admin/Feedback';
import { PushNotifications } from './pages/admin/PushNotifications';
import { Users } from './pages/admin/Members';
import EmailNotifications from './pages/admin/EmailNotifications';
import { SocialMediaGenerator } from './pages/admin/SocialMediaGenerator';



// Public Layout
import { PublicLayout } from './layouts/PublicLayout';
import { ScrollToHash } from './components/ScrollToHash';
import NotFoundPage from './pages/public/NotFoundPage';

// Lazy loaded public pages
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
const UnsubscribePage = lazy(() => import('./pages/public/UnsubscribePage'));

// Loading component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Yükleniyor...</p>
    </div>
  </div>
);

import { PushPermissionModal } from './components/PushPermissionModal';

const App: React.FC = () => {
  React.useEffect(() => {
    // DEBUG: Check permission on load
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      // console.log('Bildirim izni yok:', Notification.permission);
    }

    const initNotification = async () => {
      try {
        const { onForegroundMessage } = await import('./lib/firebase');
        onForegroundMessage(async (payload) => {
          // console.log('[App] Foreground message:', payload);

          // Native Notification for Foreground
          const title = payload.notification?.title || payload.data?.title || 'Yeni Bildirim';
          const options = {
            body: payload.notification?.body || payload.data?.body || '',
            icon: '/notification-icon-v2.png',
            badge: '/notification-icon-v2.png',
            data: {
              url: payload.data?.url || payload.fcmOptions?.link || '/'
            },
            image: payload.data?.image || undefined,
          };

          // Show Native Browser Notification
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready;
              registration.showNotification(title, options);
            } catch (e) {
              console.error('Error showing native notification:', e);
              // Fallback to non-SW notification
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(title, options);
              }
            }
          }
        });
      } catch (error) {
        console.error('Notification init error:', error);
      }
    };
    initNotification();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<Users />} />
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
            <Route path="sponsors" element={<AdminSponsors />} />
            <Route path="email-notifications" element={<EmailNotifications />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="push-notifications" element={<PushNotifications />} />
            <Route path="social-media-generator" element={<SocialMediaGenerator />} />
            <Route path="push_notifications" element={<Navigate to="/admin/push-notifications" replace />} />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
            <Route path="kampanyalar" element={<Suspense fallback={<PageLoader />}><CampaignsPage /></Suspense>} />
            <Route path="katilim-firmalari" element={<Suspense fallback={<PageLoader />}><CompaniesPage /></Suspense>} />
            <Route path="sektor-haberleri" element={<Suspense fallback={<PageLoader />}><NewsPage /></Suspense>} />
            <Route path="sektor-haberleri/:slug" element={<Suspense fallback={<PageLoader />}><NewsDetailPage /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
            <Route path="blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogDetailPage /></Suspense>} />
            <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
            <Route path="register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
            <Route path="profil" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
            <Route path="profil/hesaplamalar" element={<Suspense fallback={<PageLoader />}><SavedCalculationsPage /></Suspense>} />
          </Route>

          {/* Unsubscribe */}
          <Route path="/unsubscribe/:token" element={<Suspense fallback={<PageLoader />}><UnsubscribePage /></Suspense>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>


      </BrowserRouter>
      <PushPermissionModal />
    </AuthProvider>
  );
};

export default App;
