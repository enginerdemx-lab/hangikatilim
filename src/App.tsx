import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Admin imports — LAZY: admin paneli (tiptap editör dahil) artık ana bundle'a
// girmiyor; sadece /admin'e girilince yükleniyor. Public ziyaretçi indirmez.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const HomeContent = lazy(() => import('./pages/admin/HomeContent').then(m => ({ default: m.HomeContent })));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings').then(m => ({ default: m.SiteSettings })));
const Ticker = lazy(() => import('./pages/admin/Ticker').then(m => ({ default: m.Ticker })));
const HomeHeroSettings = lazy(() => import('./pages/admin/HomeHeroSettings').then(m => ({ default: m.HomeHeroSettings })));
const AdminCalculator = lazy(() => import('./pages/admin/Calculator').then(m => ({ default: m.Calculator })));
const AdminPaymentPlanTemplates = lazy(() => import('./pages/admin/PaymentPlanTemplates').then(m => ({ default: m.PaymentPlanTemplates })));
const AdminNews = lazy(() => import('./pages/admin/News').then(m => ({ default: m.News })));
const AdminBlog = lazy(() => import('./pages/admin/Blog').then(m => ({ default: m.Blog })));
const AdminBlogCategories = lazy(() => import('./pages/admin/BlogCategories').then(m => ({ default: m.BlogCategories })));
const AdminContact = lazy(() => import('./pages/admin/Contact').then(m => ({ default: m.Contact })));
const Media = lazy(() => import('./pages/admin/Media').then(m => ({ default: m.Media })));
const AdminCampaigns = lazy(() => import('./pages/admin/Campaigns').then(m => ({ default: m.Campaigns })));
const AdminCompanies = lazy(() => import('./pages/admin/Companies').then(m => ({ default: m.Companies })));
const QuickLinks = lazy(() => import('./pages/admin/QuickLinks').then(m => ({ default: m.QuickLinks })));
const AdminSponsors = lazy(() => import('./pages/admin/Sponsors').then(m => ({ default: m.Sponsors })));
const AdminFeedback = lazy(() => import('./pages/admin/Feedback').then(m => ({ default: m.Feedback })));
const PushNotifications = lazy(() => import('./pages/admin/PushNotifications').then(m => ({ default: m.PushNotifications })));
const Users = lazy(() => import('./pages/admin/Members').then(m => ({ default: m.Users })));
const EmailNotifications = lazy(() => import('./pages/admin/EmailNotifications'));
const SocialMediaGenerator = lazy(() => import('./pages/admin/SocialMediaGenerator').then(m => ({ default: m.SocialMediaGenerator })));
const AboutSettings = lazy(() => import('./pages/admin/AboutSettings').then(m => ({ default: m.AboutSettings })));
const CampaignBanners = lazy(() => import('./pages/admin/CampaignBanners').then(m => ({ default: m.CampaignBanners })));
const PdfDownloadLogs = lazy(() => import('./pages/admin/PdfDownloadLogs').then(m => ({ default: m.PdfDownloadLogs })));
const AdminReviews = lazy(() => import('./pages/admin/Reviews').then(m => ({ default: m.Reviews })));
const AdminConsultationRequests = lazy(() => import('./pages/admin/ConsultationRequests').then(m => ({ default: m.ConsultationRequests })));

// Lazy loaded popup pages
const PopupManager = lazy(() => import('./pages/admin/PopupManager'));
const PopupEditor = lazy(() => import('./pages/admin/PopupEditor'));
const DeferredPushPermissionModal = lazy(() =>
  import('./components/PushPermissionModal').then(m => ({ default: m.PushPermissionModal }))
);
const DeferredPopupProvider = lazy(() =>
  import('./components/PopupProvider').then(m => ({ default: m.PopupProvider }))
);


// Public Layout
import { PublicLayout } from './layouts/PublicLayout';
import { ScrollToHash } from './components/ScrollToHash';
import NotFoundPage from './pages/public/NotFoundPage';

// Lazy loaded public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const CampaignsPage = lazy(() => import('./pages/public/CampaignsPage'));
const CompaniesPage = lazy(() => import('./pages/public/CompaniesPage'));
const CompanyDetailPage = lazy(() => import('./pages/public/CompanyDetailPage'));
const CampaignDetailPage = lazy(() => import('./pages/public/CampaignDetailPage'));
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
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FavoritesPage = lazy(() => import('./pages/public/FavoritesPage'));
const AuthCallback = lazy(() => import('./pages/public/AuthCallback'));

// Loading component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Yükleniyor...</p>
    </div>
  </div>
);

const DeferredAppOverlays: React.FC = () => {
  const [enabled, setEnabled] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => setEnabled(true), { timeout: 4000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(() => setEnabled(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  if (!enabled || location.pathname.startsWith('/admin')) return null;

  return (
    <Suspense fallback={null}>
      <DeferredPopupProvider>{null}</DeferredPopupProvider>
      <DeferredPushPermissionModal />
    </Suspense>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let cancelled = false;
    let cleanupIdle = () => { };
    let unsubscribe: (() => void) | null = null;
    const initNotification = async () => {
      try {
        const { onForegroundMessage } = await import('./lib/firebase');
        if (cancelled) return;
        unsubscribe = onForegroundMessage(async (payload) => {
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

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(initNotification, { timeout: 5000 });
      cleanupIdle = () => (window as any).cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(initNotification, 3000);
      cleanupIdle = () => window.clearTimeout(id);
    }

    return () => {
      cancelled = true;
      cleanupIdle();
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          {/* Admin Routes — hepsi lazy + Suspense (ana bundle'dan çıkarıldı) */}
          <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
          <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="members" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
            <Route path="home-content" element={<Suspense fallback={<PageLoader />}><HomeContent /></Suspense>} />
            <Route path="site-settings" element={<Suspense fallback={<PageLoader />}><SiteSettings /></Suspense>} />
            <Route path="ticker" element={<Suspense fallback={<PageLoader />}><Ticker /></Suspense>} />
            <Route path="home-hero" element={<Suspense fallback={<PageLoader />}><HomeHeroSettings /></Suspense>} />
            <Route path="calculator" element={<Suspense fallback={<PageLoader />}><AdminCalculator /></Suspense>} />
            <Route path="payment-plan-templates" element={<Suspense fallback={<PageLoader />}><AdminPaymentPlanTemplates /></Suspense>} />
            <Route path="news" element={<Suspense fallback={<PageLoader />}><AdminNews /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><AdminBlog /></Suspense>} />
            <Route path="blog-categories" element={<Suspense fallback={<PageLoader />}><AdminBlogCategories /></Suspense>} />
            <Route path="contact" element={<Suspense fallback={<PageLoader />}><AdminContact /></Suspense>} />
            <Route path="media" element={<Suspense fallback={<PageLoader />}><Media /></Suspense>} />
            <Route path="campaigns" element={<Suspense fallback={<PageLoader />}><AdminCampaigns /></Suspense>} />
            <Route path="companies" element={<Suspense fallback={<PageLoader />}><AdminCompanies /></Suspense>} />
            <Route path="quick-links" element={<Suspense fallback={<PageLoader />}><QuickLinks /></Suspense>} />
            <Route path="sponsors" element={<Suspense fallback={<PageLoader />}><AdminSponsors /></Suspense>} />
            <Route path="email-notifications" element={<Suspense fallback={<PageLoader />}><EmailNotifications /></Suspense>} />
            <Route path="feedback" element={<Suspense fallback={<PageLoader />}><AdminFeedback /></Suspense>} />
            <Route path="push-notifications" element={<Suspense fallback={<PageLoader />}><PushNotifications /></Suspense>} />
            <Route path="social-media-generator" element={<Suspense fallback={<PageLoader />}><SocialMediaGenerator /></Suspense>} />
            <Route path="about-settings" element={<Suspense fallback={<PageLoader />}><AboutSettings /></Suspense>} />
            <Route path="campaign-banners" element={<Suspense fallback={<PageLoader />}><CampaignBanners /></Suspense>} />
            <Route path="pdf-logs" element={<Suspense fallback={<PageLoader />}><PdfDownloadLogs /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<PageLoader />}><AdminReviews /></Suspense>} />
            <Route path="consultation-requests" element={<Suspense fallback={<PageLoader />}><AdminConsultationRequests /></Suspense>} />
            <Route path="popups" element={<Suspense fallback={<PageLoader />}><PopupManager /></Suspense>} />
            <Route path="popups/new" element={<Suspense fallback={<PageLoader />}><PopupEditor /></Suspense>} />
            <Route path="popups/edit/:id" element={<Suspense fallback={<PageLoader />}><PopupEditor /></Suspense>} />
            <Route path="push_notifications" element={<Navigate to="/admin/push-notifications" replace />} />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
            <Route path="kampanyalar" element={<Suspense fallback={<PageLoader />}><CampaignsPage /></Suspense>} />
            <Route path="kampanyalar/:slug" element={<Suspense fallback={<PageLoader />}><CampaignDetailPage /></Suspense>} />
            <Route path="katilim-firmalari" element={<Suspense fallback={<PageLoader />}><CompaniesPage /></Suspense>} />
            <Route path="katilim-firmalari/:slug" element={<Suspense fallback={<PageLoader />}><CompanyDetailPage /></Suspense>} />
            <Route path="sektor-haberleri" element={<Suspense fallback={<PageLoader />}><NewsPage /></Suspense>} />
            <Route path="sektor-haberleri/:slug" element={<Suspense fallback={<PageLoader />}><NewsDetailPage /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
            <Route path="blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogDetailPage /></Suspense>} />
            <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
            <Route path="register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
            <Route path="auth/callback" element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />
            <Route path="profil" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
            <Route path="profil/hesaplamalar" element={<Suspense fallback={<PageLoader />}><SavedCalculationsPage /></Suspense>} />
            <Route path="profil/favoriler" element={<Suspense fallback={<PageLoader />}><FavoritesPage /></Suspense>} />
            <Route path="hakkimizda" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
          </Route>

          {/* Unsubscribe */}
          <Route path="/unsubscribe/:token" element={<Suspense fallback={<PageLoader />}><UnsubscribePage /></Suspense>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <DeferredAppOverlays />

      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
