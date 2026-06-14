import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, X, User, LogIn, LogOut, Calculator, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';


interface PublicNavbarProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ theme, toggleTheme }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [darkLogoUrl, setDarkLogoUrl] = useState('');
    const [logoLoaded, setLogoLoaded] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

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

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setShowLogoutConfirm(false);
            setShowUserMenu(false);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const currentLogo = theme === 'dark' ? darkLogoUrl : logoUrl;

    const navItems = [
        { to: '/', label: 'Ana Sayfa', end: true },
        { to: '/kampanyalar', label: 'Kampanyalar' },
        { to: '/katilim-firmalari', label: 'Katılım Firmaları' },
        { to: '/sektor-haberleri', label: 'Sektör Haberleri' },
        { to: '/blog', label: 'Blog' },
    ];

    return (
        <>
            <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">

                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <img
                            src={currentLogo}
                            alt="Katılım Uzmanı"
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
                        {/* Notification Button */}


                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
                            title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {/* Auth Buttons */}
                        {!loading && (
                            <>
                                {user ? (
                                    /* User Menu Dropdown */
                                    <div className="relative hidden lg:block" ref={userMenuRef}>
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-slate-700 transition-all"
                                        >
                                            <User size={18} />
                                            <span className="text-sm font-medium max-w-[150px] truncate">
                                                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Hesabım'}
                                            </span>
                                            <ChevronDown size={16} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showUserMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 animate-fade-in z-50">
                                                <Link
                                                    to="/profil"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                >
                                                    <User size={16} />
                                                    Profilim
                                                </Link>
                                                <Link
                                                    to="/profil/hesaplamalar"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                >
                                                    <Calculator size={16} />
                                                    Hesaplamalarım
                                                </Link>
                                                <hr className="my-2 border-gray-100 dark:border-slate-700" />
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        setShowLogoutConfirm(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                                >
                                                    <LogOut size={16} />
                                                    Çıkış Yap
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Login Button */
                                    <Link
                                        to="/login"
                                        className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#0855f8] hover:bg-[#0645d0] text-white text-sm font-bold rounded-lg transition-all"
                                    >
                                        <LogIn size={16} />
                                        Giriş Yap
                                    </Link>
                                )}
                            </>
                        )}

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

                        {/* Mobile Auth Section */}
                        <hr className="my-3 border-gray-100 dark:border-slate-700" />
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <Link
                                            to="/profil"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        >
                                            <User size={18} />
                                            Profilim
                                        </Link>
                                        <Link
                                            to="/profil/hesaplamalar"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        >
                                            <Calculator size={18} />
                                            Hesaplamalarım
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                        >
                                            <LogOut size={18} />
                                            Çıkış Yap
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white text-sm font-bold rounded-lg transition-all"
                                    >
                                        <LogIn size={18} />
                                        Giriş Yap
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                )}
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100 dark:border-slate-700">
                        <div className="text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                <LogOut className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Çıkış Yapmak İstiyor musunuz?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Oturumunuz sonlandırılacak ve ana sayfaya yönlendirileceksiniz.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

