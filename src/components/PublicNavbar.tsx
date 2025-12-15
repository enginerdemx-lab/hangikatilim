import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface PublicNavbarProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ theme, toggleTheme }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [darkLogoUrl, setDarkLogoUrl] = useState('');
    const [logoLoaded, setLogoLoaded] = useState(false);

    useEffect(() => {
        const loadLogos = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('logo_url, dark_logo_url')
                    .single();

                if (error) {
                    console.warn('Could not fetch logos from database:', error.message);
                    return;
                }

                if (data && data.logo_url) {
                    setLogoUrl(data.logo_url);
                    setDarkLogoUrl(data.dark_logo_url || data.logo_url);
                    setLogoLoaded(true);
                }
            } catch (err) {
                console.warn('Error loading logos');
            }
        };

        loadLogos();
    }, []);

    const currentLogo = theme === 'dark' ? darkLogoUrl : logoUrl;

    const navItems = [
        { to: '/', label: 'Ana Sayfa', end: true },
        { to: '/kampanyalar', label: 'Kampanyalar' },
        { to: '/katilim-firmalari', label: 'Katılım Firmaları' },
        { to: '/sektor-haberleri', label: 'Sektör Haberleri' },
        { to: '/blog', label: 'Blog' },
        { to: '/iletisim', label: 'İletişim' },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img
                        src={currentLogo}
                        alt="Hangi Katılım"
                        className="h-10 md:h-12 w-auto object-contain transition-opacity duration-300"
                        style={{ opacity: logoLoaded ? 1 : 0 }}
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
                        title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl py-4 px-4 flex flex-col gap-2 animate-fade-in h-[calc(100vh-80px)] overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </nav>
    );
};
