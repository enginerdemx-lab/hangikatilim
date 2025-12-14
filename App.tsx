import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import { AdminLogin } from './src/pages/admin/AdminLogin';
import { AdminDashboard } from './src/pages/admin/AdminDashboard';
import { Campaigns } from './src/pages/admin/Campaigns';
import { Companies } from './src/pages/admin/Companies';
import { SiteSettings } from './src/pages/admin/SiteSettings';
import { Blog } from './src/pages/admin/Blog';
import { HomeHeroSettings } from './src/pages/admin/HomeHeroSettings';
import { Navigation } from './src/pages/admin/Navigation';
import { Ticker } from './src/pages/admin/Ticker';
import { Calculator } from './src/pages/admin/Calculator';
import { News } from './src/pages/admin/News';
import { Contact } from './src/pages/admin/Contact';
import { Media } from './src/pages/admin/Media';
import { HomeContent } from './src/pages/admin/HomeContent';
import { AdminLayout } from './src/components/admin/AdminLayout';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="home-content" element={<HomeContent />} />
                    <Route path="site-settings" element={<SiteSettings />} />
                    <Route path="navigation" element={<Navigation />} />
                    <Route path="ticker" element={<Ticker />} />
                    <Route path="home-hero" element={<HomeHeroSettings />} />
                    <Route path="calculator" element={<Calculator />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="news" element={<News />} />
                    <Route path="blog" element={<Blog />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="media" element={<Media />} />
                </Route>

                {/* Public Routes - All other routes go to MainApp */}
                <Route path="/*" element={<MainApp />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;

