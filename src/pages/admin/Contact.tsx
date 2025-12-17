import React, { useEffect, useState } from 'react';
import { contactApi, type ContactSettingsFormData } from '../../services/api/contact';
import { useToast } from '../../hooks/useToast';
import type { ContactSettings, ContactMessage, MessageStatus } from '../../types/database';

export const Contact: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'messages'>('settings');
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [settingsData, messagesData] = await Promise.all([
                contactApi.getSettings(),
                contactApi.getAllMessages(),
            ]);

            if (settingsData) {
                setSettings(settingsData);
                setFormData({
                    email: settingsData.email || '',
                    phone: settingsData.phone || '',
                    address: settingsData.address || '',
                    working_hours: settingsData.working_hours || '',
                    map_embed_url: settingsData.map_embed_url || '',
                });
            }
            setMessages(messagesData);
        } catch (error) {
            console.error('Failed to load contact data:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (settings?.id) {
                await contactApi.updateSettings(settings.id, formData);
                showToast('Kaydedildi', 'success');
            } else {
                await contactApi.createSettings(formData);
                showToast('Kaydedildi', 'success');
            }
            loadData();
        } catch (error) {
            console.error('Failed to save contact settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            showToast(`Kaydetme başarısız: ${errorMessage}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateMessageStatus = async (id: string, status: MessageStatus) => {
        try {
            await contactApi.updateMessageStatus(id, status);
            showToast('Mesaj durumu güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to update message status:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleDeleteMessage = async (id: string) => {
        if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

        try {
            await contactApi.deleteMessage(id);
            showToast('Mesaj silindi', 'success');
            loadData();
            if (selectedMessage?.id === id) {
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const getStatusBadge = (status: MessageStatus) => {
        const styles = {
            new: 'bg-blue-100 text-blue-800',
            read: 'bg-green-100 text-green-800',
            archived: 'bg-gray-100 text-gray-800',
        };

        const labels = {
            new: 'Yeni',
            read: 'Okundu',
            archived: 'Arşiv',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">İletişim Yönetimi</h1>
                <p className="text-gray-600 mt-2">İletişim bilgileri ve gelen mesajları yönetin</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'settings'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        İletişim Ayarları
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'messages'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Gelen Mesajlar
                        {messages.filter(m => m.status === 'new').length > 0 && (
                            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                {messages.filter(m => m.status === 'new').length}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">İletişim Bilgileri</h2>
                    <form onSubmit={handleSubmitSettings} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    E-posta
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="info@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+90 XXX XXX XX XX"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adres
                                </label>
                                <textarea
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tam adres..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Çalışma Saatleri
                                </label>
                                <input
                                    type="text"
                                    value={formData.working_hours || ''}
                                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Örn: Pzt-Cuma 09:00-18:00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Harita Embed URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.map_embed_url || ''}
                                    onChange={(e) => setFormData({ ...formData, map_embed_url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Google Maps embed URL"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Messages List */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold">
                                Mesajlar ({messages.length})
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    onClick={() => setSelectedMessage(message)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{message.name}</h3>
                                            <p className="text-sm text-gray-600">{message.email}</p>
                                        </div>
                                        {getStatusBadge(message.status)}
                                    </div>
                                    {message.subject && (
                                        <p className="text-sm font-medium text-gray-700 mb-1">{message.subject}</p>
                                    )}
                                    <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(message.created_at).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                            ))}

                            {messages.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Henüz mesaj yok
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Detail */}
                    <div className="lg:col-span-1">
                        {selectedMessage ? (
                            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Mesaj Detayı</h3>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">İsim</label>
                                    <p className="text-gray-900">{selectedMessage.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">E-posta</label>
                                    <p className="text-gray-900">{selectedMessage.email}</p>
                                </div>

                                {selectedMessage.phone && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Telefon</label>
                                        <p className="text-gray-900">{selectedMessage.phone}</p>
                                    </div>
                                )}

                                {selectedMessage.subject && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Konu</label>
                                        <p className="text-gray-900">{selectedMessage.subject}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mesaj</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Durum</label>
                                    <div className="mt-2 space-y-2">
                                        <button
                                            onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'read')}
                                            disabled={selectedMessage.status === 'read'}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            Okundu İşaretle
                                        </button>
                                        <button
                                            onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'archived')}
                                            disabled={selectedMessage.status === 'archived'}
                                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                                        >
                                            Arşivle
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                                Detayları görmek için bir mesaj seçin
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
