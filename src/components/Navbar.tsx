import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { siteSettingsApi } from '../services/api/siteSettings';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme, activePage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // HARDCODED LOGO URLs - CHANGE THESE TO YOUR LOGO URLS
  // IMPORTANT: Use direct image URLs without spaces or special characters
  const logoUrl = 'https://i.imgur.com/4QfFVdm.png'; // Placeholder - replace with your logo
  const darkLogoUrl = 'https://i.imgur.com/4QfFVdm.png'; // Placeholder - replace with your logo

  const navItems = [
    { id: 'home', label: 'Ana Sayfa' },
    { id: 'campaigns', label: 'Kampanyalar' },
    { id: 'companies', label: 'Katılım Firmaları' },
    { id: 'news', label: 'Sektör Haberleri' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'İletişim' },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
  };

  // Determine which logo to use based on theme
  const currentLogo = theme === 'dark' ? darkLogoUrl : logoUrl;

  console.log('🎨 Current theme:', theme, '| Current logo:', currentLogo);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleNavClick('home')}
        >
          {currentLogo ? (
            <img
              src={currentLogo}
              alt="Hangi Katılım"
              className="h-10 md:h-12 w-auto object-contain transition-all"
            />
          ) : (
            <span className="text-xl font-bold text-gray-900 dark:text-white">Hangi Katılım</span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === item.id
                ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600'
                }`}
            >
              {item.label}
            </button>
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
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === item.id
                ? 'bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};