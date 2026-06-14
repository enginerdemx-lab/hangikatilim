import React, { useEffect, useState, useMemo } from 'react';
import {
    consultationRequestService,
    type ConsultationRequest,
    type ConsultationStatus,
    type ConsultationRequestStats,
} from '../../services/api/consultationRequestService';
import {
    RefreshCw,
    Trash2,
    Phone,
    Mail,
    Wallet,
    Search,
    Headphones,
    CheckCircle,
    Clock,
    Archive,
    PhoneCall,
    User,
    ChevronDown,
    Copy,
    Calendar,
    MapPin,
    Save,
    StickyNote,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

type StatusFilter = 'all' | ConsultationStatus;

const STATUS_LABELS: Record<ConsultationStatus, { label: string; color: string; icon: React.ReactNode }> = {
    new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock size={12} /> },
    contacted: { label: 'Arandı', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <PhoneCall size={12} /> },
    completed: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={12} /> },
    archived: { label: 'Arşiv', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Archive size={12} /> },
};

export const ConsultationRequests: React.FC = () => {
    const [requests, setRequests] = useState<ConsultationRequest[]>([]);
    const [stats, setStats] = useState<ConsultationRequestStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
    const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
    const { isSuperAdmin } = useAuth(); // Yalnızca superadmin talep silebilir

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [list, s] = await Promise.all([
                consultationRequestService.list({ status: filter, limit: 500 }),
                consultationRequestService.stats(),
            ]);
            setRequests(list);
            setStats(s);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return requests;
        return requests.filter(r =>
            `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
            r.phone.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
        );
    }, [requests, search]);

    const handleStatusChange = async (id: string, status: ConsultationStatus) => {
        setUpdatingId(id);
        const ok = await consultationRequestService.updateStatus(id, status);
        if (ok) {
            setRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
            const s = await consultationRequestService.stats();
            setStats(s);
        }
        setUpdatingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu danışmanlık talebini silmek istediğinize emin misiniz?')) return;
        setDeletingId(id);
        const ok = await consultationRequestService.remove(id);
        if (ok) {
            setRequests(prev => prev.filter(r => r.id !== id));
            const s = await consultationRequestService.stats();
            setStats(s);
        }
        setDeletingId(null);
    };

    const handleNoteChange = (id: string, value: string) => {
        setRequests(prev => prev.map(r => (r.id === id ? { ...r, admin_note: value } : r)));
    };

    const handleSaveNote = async (id: string) => {
        const target = requests.find(r => r.id === id);
        if (!target) return;
        setSavingNoteId(id);
        const ok = await consultationRequestService.updateNote(id, target.admin_note ?? '');
        if (ok) {
            setSavedNoteId(id);
            setTimeout(() => setSavedNoteId(prev => (prev === id ? null : prev)), 1500);
        }
        setSavingNoteId(null);
    };

    const formatDate = (s: string) =>
        new Date(s).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR').format(n) + ' TL';

    const copyToClipboard = (text: string) => {
        navigator.clipboard?.writeText(text);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Headphones className="w-8 h-8 text-[#0855f8]" />
                        Danışmanlık Talepleri
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Hesaplayıcıdan gelen ücretsiz danışmanlık başvuruları</p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0855f8] text-white rounded-lg hover:bg-[#0645d0] disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {([
                        { key: 'all', label: 'Toplam', count: stats.total, color: 'border-[#0855f8] bg-blue-50 text-[#0855f8]' },
                        { key: 'new', label: 'Yeni', count: stats.new, color: 'border-blue-400 bg-blue-50 text-blue-700' },
                        { key: 'contacted', label: 'Arandı', count: stats.contacted, color: 'border-amber-400 bg-amber-50 text-amber-700' },
                        { key: 'completed', label: 'Tamamlandı', count: stats.completed, color: 'border-green-400 bg-green-50 text-green-700' },
                        { key: 'archived', label: 'Arşiv', count: stats.archived, color: 'border-gray-400 bg-gray-50 text-gray-700' },
                    ] as Array<{ key: StatusFilter; label: string; count: number; color: string }>).map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilter(s.key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                filter === s.key
                                    ? s.color + ' shadow-md scale-[1.02]'
                                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-2xl font-bold">{s.count}</div>
                            <div className="text-xs font-medium mt-1">{s.label}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ad, telefon veya e-posta ara..."
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0855f8]/30 focus:border-[#0855f8]"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-[#0855f8] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {search ? 'Aramanıza uygun talep bulunamadı' : 'Henüz danışmanlık talebi yok'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map(r => (
                        <div
                            key={r.id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-[#0855f8]/10 flex items-center justify-center flex-shrink-0">
                                        <User size={18} className="text-[#0855f8]" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                            {r.first_name} {r.last_name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.created_at)}</p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_LABELS[r.status].color}`}
                                >
                                    {STATUS_LABELS[r.status].icon}
                                    {STATUS_LABELS[r.status].label}
                                </span>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
                                <button
                                    onClick={() => copyToClipboard(r.phone)}
                                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg group transition-colors text-left"
                                    title="Kopyala"
                                >
                                    <Phone size={14} className="text-[#0855f8] flex-shrink-0" />
                                    <span className="flex-1 font-medium">{r.phone}</span>
                                    <Copy size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                </button>
                                <button
                                    onClick={() => copyToClipboard(r.email)}
                                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg group transition-colors text-left"
                                    title="Kopyala"
                                >
                                    <Mail size={14} className="text-[#0855f8] flex-shrink-0" />
                                    <span className="flex-1 truncate">{r.email}</span>
                                    <Copy size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                </button>
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                                    <Wallet size={14} className="text-[#0855f8]" />
                                    <span className="font-semibold">{formatCurrency(r.amount)}</span>
                                </div>
                                {r.monthly_payment != null && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                                        <Calendar size={14} className="text-[#0855f8]" />
                                        <span className="font-semibold">{formatCurrency(r.monthly_payment)}</span>
                                        <span className="text-xs text-gray-500">/ ay</span>
                                    </div>
                                )}
                                {(r.city || r.district) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                                        <MapPin size={14} className="text-[#0855f8]" />
                                        <span className="font-medium">{[r.city, r.district].filter(Boolean).join(' / ')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg">
                                    <span className="text-xs font-semibold text-[#0855f8] uppercase">Sistem:</span>
                                    <span className="font-semibold">{r.system_type === 'CEKILISLI' ? 'Çekilişli' : 'Çekilişsiz'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 flex-wrap flex-1">
                                    <a
                                        href={`tel:${r.phone}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        <Phone size={12} /> Ara
                                    </a>
                                    <a
                                        href={`mailto:${r.email}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        <Mail size={12} /> Mail
                                    </a>
                                    <a
                                        href={`https://wa.me/${r.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba ${r.first_name}, KatılımUzmanı'ndan ulaşıyoruz.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        WhatsApp
                                    </a>

                                    {/* Not — Ara/Mail/WhatsApp'ın yanında, her talep için */}
                                    <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                        <StickyNote size={13} className="text-gray-400 flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={r.admin_note ?? ''}
                                            onChange={e => handleNoteChange(r.id, e.target.value)}
                                            placeholder="Not ekle..."
                                            className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0855f8]/30"
                                        />
                                        <button
                                            onClick={() => handleSaveNote(r.id)}
                                            disabled={savingNoteId === r.id}
                                            title="Notu kaydet"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                                        >
                                            {savingNoteId === r.id ? (
                                                <RefreshCw size={12} className="animate-spin" />
                                            ) : savedNoteId === r.id ? (
                                                <CheckCircle size={12} />
                                            ) : (
                                                <Save size={12} />
                                            )}
                                            {savedNoteId === r.id ? 'Kaydedildi' : 'Kaydet'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Status select */}
                                    <div className="relative">
                                        <select
                                            value={r.status}
                                            onChange={e => handleStatusChange(r.id, e.target.value as ConsultationStatus)}
                                            disabled={updatingId === r.id}
                                            className="appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0855f8]/30 cursor-pointer"
                                        >
                                            <option value="new">Yeni</option>
                                            <option value="contacted">Arandı</option>
                                            <option value="completed">Tamamlandı</option>
                                            <option value="archived">Arşiv</option>
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>

                                    {/* Silme yalnızca superadmin'e açık (Satış Danışmanı silemez) */}
                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            disabled={deletingId === r.id}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Sil"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultationRequests;
