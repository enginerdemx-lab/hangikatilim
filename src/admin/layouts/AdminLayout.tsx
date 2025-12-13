import React from 'react';
import { Link, Outlet, useLocation, Routes, Route } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Activity, Users, LogOut, ChevronRight } from 'lucide-react';

// Import admin pages
import { AdminDashboard } from '../../pages/admin/AdminDashboard';
import { PopularSearchesAdmin } from '../../pages/admin/PopularSearches';
// Add other admin page imports as needed

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/content', icon: FileText, label: 'İçerik Yönetimi' },
    { path: '/admin/seo', icon: Settings, label: 'SEO Ayarları' },
    { path: '/admin/logs', icon: Activity, label: 'Loglar ve Aktiviteler' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight">Hangi Katılım</h2>
          <p className="text-xs text-slate-400 mt-1">Yönetim Paneli</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">Admin</span>
            <ChevronRight size={14} />
            <span className="capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content with Routes */}
        <div className="flex-1 overflow-auto p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="popular-searches" element={<PopularSearchesAdmin />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};