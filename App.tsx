import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';

// Admin imports
import { AdminLogin } from './src/pages/admin/AdminLogin';
import { AdminDashboard } from './src/pages/admin/AdminDashboard';
import { Campaigns as AdminCampaigns } from './src/pages/admin/Campaigns';
import { Companies as AdminCompanies } from './src/pages/admin/Companies';
import { SiteSettings } from './src/pages/admin/SiteSettings';
import { Blog as AdminBlog } from './src/pages/admin/Blog';
import { HomeHeroSettings } from './src/pages/admin/HomeHeroSettings';
import { Navigation } from './src/pages/admin/Navigation';
import { Ticker } from './src/pages/admin/Ticker';
import { Calculator as AdminCalculator } from './src/pages/admin/Calculator';
import { News as AdminNews } from './src/pages/admin/News';
import { Contact as AdminContact } from './src/pages/admin/Contact';
import { Media } from './src/pages/admin/Media';
import { HomeContent } from './src/pages/admin/HomeContent';
import { AdminLayout } from './src/components/admin/AdminLayout';
import { QuickLinks } from './src/pages/admin/QuickLinks';
import { EmailNotifications } from './src/pages/admin/EmailNotifications';
import { Users as AdminUsers } from './src/pages/admin/Members';

// Public Layout and Pages
import { PublicLayout } from './src/layouts/PublicLayout';

// Lazy loaded public pages for code splitting
const HomePage = lazy(() => import('./src/pages/public/HomePage'));
const CampaignsPage = lazy(() => import('./src/pages/public/CampaignsPage'));
const CompaniesPage = lazy(() => import('./src/pages/public/CompaniesPage'));
const NewsPage = lazy(() => import('./src/pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('./src/pages/public/NewsDetailPage'));
const BlogPage = lazy(() => import('./src/pages/public/BlogPage'));
const BlogDetailPage = lazy(() => import('./src/pages/public/BlogDetailPage'));
const ContactPage = lazy(() => import('./src/pages/public/ContactPage'));
const ProfilePage = lazy(() => import('./src/pages/public/ProfilePage'));
const SavedCalculationsPage = lazy(() => import('./src/pages/public/SavedCalculationsPage'));
const LoginPage = lazy(() => import('./src/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./src/pages/public/RegisterPage'));
const AuthCallback = lazy(() => import('./src/pages/public/AuthCallback'));

// Auth Guard
import { RequireAuth } from './src/components/RequireAuth';

// Loading component
const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
    </div>
);


const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Auth Callback Route - outside of PublicLayout for cleaner UI */}
                    <Route
                        path="/auth/callback"
                        element={
                            <Suspense fallback={<PageLoader />}>
                                <AuthCallback />
                            </Suspense>
                        }
                    />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="home-content" element={<HomeContent />} />
                        <Route path="site-settings" element={<SiteSettings />} />
                        <Route path="navigation" element={<Navigation />} />
                        <Route path="ticker" element={<Ticker />} />
                        <Route path="home-hero" element={<HomeHeroSettings />} />
                        <Route path="calculator" element={<AdminCalculator />} />
                        <Route path="companies" element={<AdminCompanies />} />
                        <Route path="campaigns" element={<AdminCampaigns />} />
                        <Route path="news" element={<AdminNews />} />
                        <Route path="blog" element={<AdminBlog />} />
                        <Route path="contact" element={<AdminContact />} />
                        <Route path="media" element={<Media />} />
                        <Route path="quick-links" element={<QuickLinks />} />
                        <Route path="email-notifications" element={<EmailNotifications />} />
                        <Route path="users" element={<AdminUsers />} />
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
                        <Route
                            path="profil"
                            element={
                                <RequireAuth>
                                    <Suspense fallback={<PageLoader />}>
                                        <ProfilePage />
                                    </Suspense>
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="profil/hesaplamalar"
                            element={
                                <RequireAuth>
                                    <Suspense fallback={<PageLoader />}>
                                        <SavedCalculationsPage />
                                    </Suspense>
                                </RequireAuth>
                            }
                        />
                        {/* Auth Routes - Inside PublicLayout to keep navbar/header */}
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
                    </Route>

                    {/* Global 404 - MUST be OUTSIDE of PublicLayout to not catch admin routes */}
                    <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <h1 className="text-6xl font-bold text-gray-300">404</h1>
                                <p className="text-xl text-gray-600 mt-4">Sayfa bulunamadı</p>
                                <a href="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Ana Sayfaya Dön
                                </a>
                            </div>
                        </div>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;

