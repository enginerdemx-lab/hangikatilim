import React, { useState, useEffect } from 'react';
import {
    FileDown,
    Search,
    RefreshCw,
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    Globe,
    TrendingUp,
    Filter,
    X,
    Lock,
    Unlock,
} from 'lucide-react';
import { pdfDownloadService, PdfDownloadLog, PdfDownloadFilters } from '../../services/api/pdfDownloadService';

// ============================================
// COMPONENT
// ============================================

export const PdfDownloadLogs: React.FC = () => {
    const [logs, setLogs] = useState<PdfDownloadLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<PdfDownloadFilters>({});
    const [showFilters, setShowFilters] = useState(false);

    // Stats
    const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // IP Security
    const [ipUnlocked, setIpUnlocked] = useState(false);
    const [ipPassword, setIpPassword] = useState('');
    const [showIpPrompt, setShowIpPrompt] = useState(false);
    const IP_PASSWORD = '8441';

    // ============================================
    // DATA LOADING
    // ============================================

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await pdfDownloadService.getAllLogs({
                ...filters,
                search: searchTerm || undefined,
            });
            setLogs(data);
        } catch (error) {
            console.error('Load PDF logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await pdfDownloadService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Load stats error:', error);
        }
    };

    useEffect(() => {
        loadLogs();
        loadStats();
    }, []);

    useEffect(() => {
        loadLogs();
        setCurrentPage(1);
    }, [filters]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleSearch = () => {
        setCurrentPage(1);
        loadLogs();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleExportCSV = () => {
        const headers = ['Tarih', 'Üye Adı', 'Hesaplama Tipi', 'Hedef Tutar', 'Peşinat', 'Vade (Ay)', 'Sistem', 'IP Adresi'];
        const rows = logs.map(log => [
            formatDate(log.created_at),
            log.user_full_name || '-',
            getTypeLabel(log.calculation_type),
            log.target_amount?.toLocaleString('tr-TR') || '-',
            log.down_payment?.toLocaleString('tr-TR') || '-',
            log.months?.toString() || '-',
            getSystemLabel(log.system_type),
            log.ip_address && ipUnlocked ? log.ip_address : '***',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdf_indirme_loglari_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ============================================
    // HELPERS
    // ============================================

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'ev': return 'Gayrimenkul';
            case 'arac': return 'Araç';
            case 'isyeri': return 'İş Yeri';
            case 'tumu': return 'Tümü';
            default: return type;
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'ev': return 'bg-blue-100 text-blue-700';
            case 'arac': return 'bg-green-100 text-green-700';
            case 'isyeri': return 'bg-purple-100 text-purple-700';
            case 'tumu': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getSystemLabel = (type: string | null) => {
        if (!type) return '-';
        return type === 'LOTTERY' ? 'Çekilişli' : 'Çekilişsiz';
    };

    const formatCurrency = (val: number | null) => {
        if (val === null || val === undefined) return '-';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
    };

    // Pagination
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const paginatedLogs = logs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileDown className="text-blue-600" /> PDF İndirme Logları
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Üyelerin PDF indirme geçmişi ve detayları
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { loadLogs(); loadStats(); }}
                        className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <Download size={18} />
                        CSV'ye Aktar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileDown size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Toplam İndirme</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.today}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Bugün</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.thisWeek}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Bu Hafta</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Globe size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.thisMonth}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Bu Ay</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İsim, telefon veya IP ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Calculation Type Filter */}
                    <select
                        value={filters.calculationType || 'all'}
                        onChange={(e) => setFilters({ ...filters, calculationType: e.target.value })}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Tüm Tipler</option>
                        <option value="ev">Gayrimenkul</option>
                        <option value="arac">Araç</option>
                        <option value="isyeri">İş Yeri</option>
                        <option value="tumu">Tümü</option>
                    </select>

                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Ara
                    </button>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <Filter size={18} />
                        Tarih Filtresi
                    </button>
                </div>

                {/* Date Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bitiş Tarihi</label>
                            <input
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({});
                                    setSearchTerm('');
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                <X size={16} />
                                Filtreleri Temizle
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tarih</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Üye</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Hesaplama Tipi</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Hedef Tutar</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Peşinat</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Vade</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Sistem</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    <div className="flex items-center gap-2">
                                        IP Adresi
                                        {!ipUnlocked ? (
                                            <button
                                                onClick={() => setShowIpPrompt(true)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                                                title="IP adreslerini görmek için şifre girin"
                                            >
                                                <Lock size={14} className="text-red-500" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setIpUnlocked(false); setIpPassword(''); }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                                                title="IP adreslerini gizle"
                                            >
                                                <Unlock size={14} className="text-green-500" />
                                            </button>
                                        )}
                                    </div>
                                    {showIpPrompt && !ipUnlocked && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="password"
                                                placeholder="Şifre"
                                                value={ipPassword}
                                                onChange={(e) => setIpPassword(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (ipPassword === IP_PASSWORD) {
                                                            setIpUnlocked(true);
                                                            setShowIpPrompt(false);
                                                        } else {
                                                            setIpPassword('');
                                                        }
                                                    }
                                                }}
                                                className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => {
                                                    if (ipPassword === IP_PASSWORD) {
                                                        setIpUnlocked(true);
                                                        setShowIpPrompt(false);
                                                    } else {
                                                        setIpPassword('');
                                                    }
                                                }}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Aç
                                            </button>
                                            <button
                                                onClick={() => { setShowIpPrompt(false); setIpPassword(''); }}
                                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300"
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <FileDown className="mx-auto mb-2 opacity-30" size={32} />
                                        Henüz PDF indirme kaydı bulunmuyor
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                    {log.user_full_name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {log.user_full_name || 'İsimsiz'}
                                                    </div>
                                                    {log.user_phone && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.user_phone}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getTypeBadgeColor(log.calculation_type)}`}>
                                                {getTypeLabel(log.calculation_type)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {formatCurrency(log.target_amount)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatCurrency(log.down_payment)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {log.months ? `${log.months} ay` : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {getSystemLabel(log.system_type)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {ipUnlocked ? (log.ip_address || '-') : '•••.•••.•••.•••'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Toplam {logs.length} kayıttan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, logs.length)} arası gösteriliyor
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg font-medium text-gray-900 dark:text-white">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfDownloadLogs;
