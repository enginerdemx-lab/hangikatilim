import React, { useEffect, useState, useMemo } from 'react';
import { contactApi, type ContactSettingsFormData } from '../../services/api/contact';
import { useToast } from '../../hooks/useToast';
import type { ContactSettings, ContactMessage, MessageStatus } from '../../types/database';
import { RefreshCw, Save, Search, Mail, Phone, MapPin, Clock, X, Check, Archive, Trash2, MessageSquare } from 'lucide-react';

// Reusable Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm ${className}`}>
        {children}
    </div>
);

// Status Badge Component
const StatusBadge: React.FC<{ status: MessageStatus }> = ({ status }) => {
    const styles = {
        new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        read: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    };
    const labels = { new: 'Yeni', read: 'Okundu', archived: 'Arşiv' };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

// Message Detail Drawer Component
const MessageDetailDrawer: React.FC<{
    message: ContactMessage | null;
    onClose: () => void;
    onStatusChange: (id: string, status: MessageStatus) => void;
    onDelete: (id: string) => void;
}> = ({ message, onClose, onStatusChange, onDelete }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 shadow-xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mesaj Detayı</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Sender Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold text-lg">
                            {message.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{message.name}</h4>
                            <p className="text-sm text-slate-500">{message.email}</p>
                            {message.phone && <p className="text-sm text-slate-500">{message.phone}</p>}
                        </div>
                        <StatusBadge status={message.status} />
                    </div>

                    {/* Subject */}
                    {message.subject && (
                        <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Konu</p>
                            <p className="text-slate-900 dark:text-white font-medium">{message.subject}</p>
                        </div>
                    )}

                    {/* Message Body */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Mesaj</p>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-slate-500">
                        {new Date(message.created_at).toLocaleString('tr-TR', {
                            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </p>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <button
                            onClick={() => onStatusChange(message.id, 'read')}
                            disabled={message.status === 'read'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium transition-colors hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={16} />
                            Okundu İşaretle
                        </button>
                        <button
                            onClick={() => onStatusChange(message.id, 'archived')}
                            disabled={message.status === 'archived'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Archive size={16} />
                            Arşivle
                        </button>
                        <button
                            onClick={() => { if (confirm('Bu mesajı silmek istediğinize emin misiniz?')) onDelete(message.id); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                        >
                            <Trash2 size={16} />
                            Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Contact: React.FC = () => {
    const [settings, setSettings] = useState<ContactSettings | null>(null);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<ContactSettingsFormData>({
        email: '',
        phone: '',
        address: '',
        working_hours: '',
        map_embed_url: '',
    });
    const [originalData, setOriginalData] = useState<ContactSettingsFormData | null>(null);

    // Messages filter state
    const [messageSearch, setMessageSearch] = useState('');
    const [messageFilter, setMessageFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsData, messagesData] = await Promise.all([
                contactApi.getSettings(),
                contactApi.getAllMessages(),
            ]);

            if (settingsData) {
                setSettings(settingsData);
                const formValues: ContactSettingsFormData = {
                    email: settingsData.email || '',
                    phone: settingsData.phone || '',
                    address: settingsData.address || '',
                    working_hours: settingsData.working_hours || '',
                    map_embed_url: settingsData.map_embed_url || '',
                };
                setFormData(formValues);
                setOriginalData(formValues);
            }
            setMessages(messagesData);
        } catch (error) {
            console.error('Failed to load contact data:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(formData) !== JSON.stringify(originalData);
    }, [formData, originalData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (settings?.id) {
                await contactApi.updateSettings(settings.id, formData);
            } else {
                await contactApi.createSettings(formData);
            }
            showToast('Ayarlar kaydedildi', 'success');
            setOriginalData(formData);
            loadData();
        } catch (error) {
            console.error('Failed to save contact settings:', error);
            showToast('Kaydetme başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMessageStatus = async (id: string, status: MessageStatus) => {
        try {
            await contactApi.updateMessageStatus(id, status);
            showToast('Mesaj durumu güncellendi', 'success');
            loadData();
            if (selectedMessage?.id === id) {
                setSelectedMessage({ ...selectedMessage, status });
            }
        } catch (error) {
            console.error('Failed to update message status:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            await contactApi.deleteMessage(id);
            showToast('Mesaj silindi', 'success');
            loadData();
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (error) {
            console.error('Failed to delete message:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    // Filtered messages
    const filteredMessages = useMemo(() => {
        let result = messages;
        if (messageFilter !== 'all') {
            result = result.filter(m => m.status === messageFilter);
        }
        if (messageSearch.trim()) {
            const q = messageSearch.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.subject || '').toLowerCase().includes(q) ||
                m.message.toLowerCase().includes(q)
            );
        }
        return result;
    }, [messages, messageFilter, messageSearch]);

    const stats = {
        total: messages.length,
        unread: messages.filter(m => m.status === 'new').length,
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">İletişim Yönetimi</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">İletişim bilgileri ve gelen mesajları yönetin</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {settings?.updated_at && (
                            <span className="text-xs text-slate-500 hidden sm:inline">
                                Son: {new Date(settings.updated_at).toLocaleDateString('tr-TR')}
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white dark:text-slate-900 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <><RefreshCw size={16} className="animate-spin" /> Kaydediliyor...</>
                            ) : (
                                <><Save size={16} /> Kaydet</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Contact Settings (smaller) */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <Card className="p-5">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">İletişim Ayarları</h2>
                            <div className="space-y-4">
                                {/* Email & Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            <Mail size={14} className="text-slate-400" />
                                            E-posta
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            placeholder="info@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            <Phone size={14} className="text-slate-400" />
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            placeholder="+90 XXX XXX XX XX"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <MapPin size={14} className="text-slate-400" />
                                        Adres
                                    </label>
                                    <textarea
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
                                        placeholder="Tam adres..."
                                    />
                                </div>

                                {/* Working Hours & Map URL */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            <Clock size={14} className="text-slate-400" />
                                            Çalışma Saatleri
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.working_hours || ''}
                                            onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            placeholder="Pzt-Cuma 09:00-18:00"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                            <MapPin size={14} className="text-slate-400" />
                                            Harita URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.map_embed_url || ''}
                                            onChange={(e) => setFormData({ ...formData, map_embed_url: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            placeholder="Google Maps embed URL"
                                        />
                                        <p className="mt-1 text-xs text-slate-500">İletişim sayfasında gösterilir</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Messages Panel (larger) */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <Card className="overflow-hidden">
                            {/* Messages Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={18} className="text-slate-500" />
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Gelen Mesajlar</h2>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500">Toplam: {stats.total}</span>
                                        {stats.unread > 0 && (
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                                                {stats.unread} yeni
                                            </span>
                                        )}
                                        <button onClick={loadData} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Search & Filters */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={messageSearch}
                                            onChange={(e) => setMessageSearch(e.target.value)}
                                            placeholder="Mesajlarda ara..."
                                            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent placeholder-slate-400"
                                        />
                                    </div>
                                    <select
                                        value={messageFilter}
                                        onChange={(e) => setMessageFilter(e.target.value as typeof messageFilter)}
                                        className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="new">Okunmamış</option>
                                        <option value="read">Okundu</option>
                                        <option value="archived">Arşiv</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredMessages.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <MessageSquare size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            {messageSearch || messageFilter !== 'all' ? 'Filtrelerle eşleşen mesaj yok' : 'Henüz mesaj yok'}
                                        </p>
                                    </div>
                                ) : (
                                    filteredMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => setSelectedMessage(msg)}
                                            className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedMessage?.id === msg.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Unread dot */}
                                                {msg.status === 'new' && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-sm truncate ${msg.status === 'new' ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {msg.name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                                            {new Date(msg.created_at).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate mb-1">{msg.email}</p>
                                                    {msg.subject && (
                                                        <p className={`text-sm truncate mb-1 ${msg.status === 'new' ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {msg.subject}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{msg.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Message Detail Drawer */}
            <MessageDetailDrawer
                message={selectedMessage}
                onClose={() => setSelectedMessage(null)}
                onStatusChange={handleUpdateMessageStatus}
                onDelete={handleDeleteMessage}
            />
        </>
    );
};
