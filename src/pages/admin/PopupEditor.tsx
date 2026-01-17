import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Eye, Image, Type, Palette,
    Clock, Calendar, Mail, LayoutTemplate, AlertCircle,
    CornerRightDown, Square, Maximize, X, Upload
} from 'lucide-react';
import { popupApi, Popup } from '../../services/popupApi';
import { supabase } from '../../services/supabaseClient';

const TEMPLATES = [
    { key: 'announcement', label: 'Duyuru', icon: '📢', desc: 'Başlık, metin ve buton' },
    { key: 'discount', label: 'Kampanya', icon: '🏷️', desc: 'Görsel, countdown ve buton' },
    { key: 'email', label: 'E-posta', icon: '📧', desc: 'E-posta toplama formu' },
    { key: 'membership', label: 'Üyelik', icon: '👤', desc: 'Kayıt/Giriş yönlendirme' },
    { key: 'custom', label: 'Özel', icon: '✨', desc: 'Tam özelleştirme' },
];

const TYPES = [
    { key: 'corner', label: 'Köşe', icon: CornerRightDown, desc: 'Sağ alt köşede' },
    { key: 'modal', label: 'Modal', icon: Square, desc: 'Ekran ortasında' },
    { key: 'fullscreen', label: 'Tam Ekran', icon: Maximize, desc: 'Tüm ekranı kaplar' },
];

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato'];

const defaultPopup: Partial<Popup> = {
    name: '',
    type: 'corner',
    template: 'announcement',
    title: '',
    subtitle: '',
    body_text: '',
    image_url: '',
    button1_text: 'Tamam',
    button1_url: '',
    button1_style: { bg: '#3b82f6', text: '#ffffff' },
    button2_text: '',
    button2_url: '',
    button2_style: { bg: '#e5e7eb', text: '#374151' },
    styles: {
        bgColor: '#ffffff',
        titleFont: 'Inter',
        titleSize: '24px',
        titleColor: '#111827',
        bodyFont: 'Inter',
        bodySize: '14px',
        bodyColor: '#6b7280',
        borderRadius: '16px'
    },
    trigger_type: 'delay',
    trigger_delay_seconds: 3,
    trigger_scroll_percent: 50,
    show_once_per_session: true,
    show_on_pages: ['*'],
    show_countdown: false,
    collect_email: false,
    email_placeholder: 'E-posta adresiniz',
    email_button_text: 'Abone Ol',
    is_active: false,
    priority: 0
};

export const PopupEditor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [popup, setPopup] = useState<Partial<Popup>>(defaultPopup);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'trigger'>('content');
    const [showPreview, setShowPreview] = useState(true);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setError(null);
            const fileExt = file.name.split('.').pop();
            const fileName = `popup_${Date.now()}.${fileExt}`;
            const filePath = `popups/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            setPopup({ ...popup, image_url: data.publicUrl });
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(`Görsel yüklenemedi: ${err.message || 'Bilinmeyen hata'}`);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPopup(id);
        }
    }, [id]);

    const fetchPopup = async (popupId: string) => {
        try {
            setLoading(true);
            const data = await popupApi.getById(popupId);
            if (data) {
                setPopup(data);
            }
        } catch (err) {
            setError('Popup yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!popup.name) {
            setError('Popup adı gerekli');
            return;
        }

        try {
            setSaving(true);
            if (isEditing && id) {
                await popupApi.update(id, popup);
            } else {
                await popupApi.create(popup);
            }
            navigate('/admin/popups');
        } catch (err) {
            setError('Kaydetme hatası');
        } finally {
            setSaving(false);
        }
    };

    const updateStyles = (key: string, value: string) => {
        setPopup(prev => ({
            ...prev,
            styles: { ...prev.styles!, [key]: value }
        }));
    };

    const updateButton1Style = (key: string, value: string) => {
        setPopup(prev => ({
            ...prev,
            button1_style: { ...prev.button1_style!, [key]: value }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/popups')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Popup Düzenle' : 'Yeni Popup'}
                            </h1>
                            <p className="text-sm text-gray-500">{popup.name || 'İsimsiz popup'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showPreview
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            <Eye size={18} />
                            Önizleme
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={20} />
                        <span className="text-red-700">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Editor Panel */}
                    <div className="space-y-6">
                        {/* Popup Name */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Popup Adı *
                            </label>
                            <input
                                type="text"
                                value={popup.name || ''}
                                onChange={(e) => setPopup({ ...popup, name: e.target.value })}
                                placeholder="Örn: Yeni Yıl Kampanyası"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Template Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <LayoutTemplate size={18} />
                                Şablon Seçin
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setPopup({ ...popup, template: t.key as any })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${popup.template === t.key
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-2xl">{t.icon}</span>
                                        <div className="font-medium mt-2">{t.label}</div>
                                        <div className="text-xs text-gray-500">{t.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                Popup Türü
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {TYPES.map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setPopup({ ...popup, type: t.key as any })}
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${popup.type === t.key
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <t.icon className="mx-auto mb-2" size={24} />
                                        <div className="font-medium">{t.label}</div>
                                        <div className="text-xs text-gray-500">{t.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                {[
                                    { key: 'content', label: 'İçerik', icon: Type },
                                    { key: 'style', label: 'Stil', icon: Palette },
                                    { key: 'trigger', label: 'Zamanlama', icon: Clock },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Content Tab */}
                                {activeTab === 'content' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Başlık</label>
                                            <input
                                                type="text"
                                                value={popup.title || ''}
                                                onChange={(e) => setPopup({ ...popup, title: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                placeholder="Başlık yazın..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Alt Başlık</label>
                                            <input
                                                type="text"
                                                value={popup.subtitle || ''}
                                                onChange={(e) => setPopup({ ...popup, subtitle: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                placeholder="Alt başlık (opsiyonel)..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Açıklama</label>
                                            <textarea
                                                value={popup.body_text || ''}
                                                onChange={(e) => setPopup({ ...popup, body_text: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                rows={3}
                                                placeholder="Açıklama metni..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Görsel</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={popup.image_url || ''}
                                                    onChange={(e) => setPopup({ ...popup, image_url: e.target.value })}
                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                    placeholder="URL girin veya yükleyin..."
                                                />
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {uploading ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Upload size={18} />
                                                    )}
                                                    Yükle
                                                </button>
                                            </div>
                                            {popup.image_url && (
                                                <div className="mt-2">
                                                    <img
                                                        src={popup.image_url}
                                                        alt="Önizleme"
                                                        className="h-20 w-auto rounded-lg border object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Buton 1 Metni</label>
                                                <input
                                                    type="text"
                                                    value={popup.button1_text || ''}
                                                    onChange={(e) => setPopup({ ...popup, button1_text: e.target.value })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Buton 1 URL</label>
                                                <input
                                                    type="text"
                                                    value={popup.button1_url || ''}
                                                    onChange={(e) => setPopup({ ...popup, button1_url: e.target.value })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                    placeholder="/sayfa veya https://..."
                                                />
                                            </div>
                                        </div>
                                        {popup.template === 'membership' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Buton 2 Metni</label>
                                                    <input
                                                        type="text"
                                                        value={popup.button2_text || ''}
                                                        onChange={(e) => setPopup({ ...popup, button2_text: e.target.value })}
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Buton 2 URL</label>
                                                    <input
                                                        type="text"
                                                        value={popup.button2_url || ''}
                                                        onChange={(e) => setPopup({ ...popup, button2_url: e.target.value })}
                                                        className="w-full px-4 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {popup.template === 'email' && (
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <label className="flex items-center gap-2 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={popup.collect_email}
                                                        onChange={(e) => setPopup({ ...popup, collect_email: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <span className="font-medium">E-posta Toplama Aktif</span>
                                                </label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={popup.email_placeholder || ''}
                                                        onChange={(e) => setPopup({ ...popup, email_placeholder: e.target.value })}
                                                        className="px-4 py-2 border rounded-lg"
                                                        placeholder="Placeholder"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={popup.email_button_text || ''}
                                                        onChange={(e) => setPopup({ ...popup, email_button_text: e.target.value })}
                                                        className="px-4 py-2 border rounded-lg"
                                                        placeholder="Buton metni"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Style Tab */}
                                {activeTab === 'style' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Arka Plan</label>
                                                <input
                                                    type="color"
                                                    value={popup.styles?.bgColor || '#ffffff'}
                                                    onChange={(e) => updateStyles('bgColor', e.target.value)}
                                                    className="w-full h-10 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Köşe Yuvarlaklığı</label>
                                                <select
                                                    value={popup.styles?.borderRadius || '16px'}
                                                    onChange={(e) => updateStyles('borderRadius', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                >
                                                    <option value="0">Keskin</option>
                                                    <option value="8px">Az Yuvarlak</option>
                                                    <option value="16px">Yuvarlak</option>
                                                    <option value="24px">Çok Yuvarlak</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Başlık Fontu</label>
                                                <select
                                                    value={popup.styles?.titleFont || 'Inter'}
                                                    onChange={(e) => updateStyles('titleFont', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                >
                                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Başlık Boyutu</label>
                                                <select
                                                    value={popup.styles?.titleSize || '24px'}
                                                    onChange={(e) => updateStyles('titleSize', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                >
                                                    <option value="18px">Küçük</option>
                                                    <option value="24px">Normal</option>
                                                    <option value="32px">Büyük</option>
                                                    <option value="40px">Çok Büyük</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Başlık Rengi</label>
                                                <input
                                                    type="color"
                                                    value={popup.styles?.titleColor || '#111827'}
                                                    onChange={(e) => updateStyles('titleColor', e.target.value)}
                                                    className="w-full h-10 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Metin Fontu</label>
                                                <select
                                                    value={popup.styles?.bodyFont || 'Inter'}
                                                    onChange={(e) => updateStyles('bodyFont', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                >
                                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Metin Boyutu</label>
                                                <select
                                                    value={popup.styles?.bodySize || '14px'}
                                                    onChange={(e) => updateStyles('bodySize', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                >
                                                    <option value="12px">Küçük</option>
                                                    <option value="14px">Normal</option>
                                                    <option value="16px">Büyük</option>
                                                    <option value="18px">Çok Büyük</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Metin Rengi</label>
                                                <input
                                                    type="color"
                                                    value={popup.styles?.bodyColor || '#6b7280'}
                                                    onChange={(e) => updateStyles('bodyColor', e.target.value)}
                                                    className="w-full h-10 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Buton Arka Plan</label>
                                                <input
                                                    type="color"
                                                    value={popup.button1_style?.bg || '#3b82f6'}
                                                    onChange={(e) => updateButton1Style('bg', e.target.value)}
                                                    className="w-full h-10 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Buton Yazı Rengi</label>
                                                <input
                                                    type="color"
                                                    value={popup.button1_style?.text || '#ffffff'}
                                                    onChange={(e) => updateButton1Style('text', e.target.value)}
                                                    className="w-full h-10 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Trigger Tab */}
                                {activeTab === 'trigger' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Tetikleme</label>
                                            <select
                                                value={popup.trigger_type || 'delay'}
                                                onChange={(e) => setPopup({ ...popup, trigger_type: e.target.value as any })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            >
                                                <option value="immediate">Hemen göster</option>
                                                <option value="delay">Gecikmeli</option>
                                                <option value="scroll">Scroll yüzdesi</option>
                                                <option value="exit_intent">Çıkış niyeti</option>
                                            </select>
                                        </div>
                                        {popup.trigger_type === 'delay' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Gecikme (saniye): {popup.trigger_delay_seconds}s
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="30"
                                                    value={popup.trigger_delay_seconds || 3}
                                                    onChange={(e) => setPopup({ ...popup, trigger_delay_seconds: parseInt(e.target.value) })}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                        {popup.trigger_type === 'scroll' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Scroll yüzdesi: %{popup.trigger_scroll_percent}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    step="10"
                                                    value={popup.trigger_scroll_percent || 50}
                                                    onChange={(e) => setPopup({ ...popup, trigger_scroll_percent: parseInt(e.target.value) })}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={popup.show_once_per_session}
                                                onChange={(e) => setPopup({ ...popup, show_once_per_session: e.target.checked })}
                                                className="rounded"
                                            />
                                            <label className="text-sm">Oturum başına bir kez göster</label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Öncelik</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={popup.priority || 0}
                                                onChange={(e) => setPopup({ ...popup, priority: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Yüksek öncelikli popup'lar önce gösterilir</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 min-h-[600px] relative overflow-hidden">
                            <div className="text-center text-sm text-gray-500 mb-4">Canlı Önizleme</div>

                            {/* Simulated Page */}
                            <div className="bg-white rounded-lg h-[500px] relative overflow-hidden">
                                <div className="p-4 bg-gray-100 text-xs text-gray-400">Site içeriği...</div>

                                {/* Popup Preview */}
                                {popup.type === 'corner' && (
                                    <div
                                        className="absolute bottom-4 right-4 w-72 shadow-2xl"
                                        style={{
                                            backgroundColor: popup.styles?.bgColor,
                                            borderRadius: popup.styles?.borderRadius
                                        }}
                                    >
                                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                            <X size={16} />
                                        </button>
                                        {popup.image_url && (
                                            <img src={popup.image_url} alt="" className="w-full h-32 object-cover rounded-t-[inherit]" />
                                        )}
                                        <div className="p-4">
                                            {popup.title && (
                                                <h3 style={{
                                                    fontFamily: popup.styles?.titleFont,
                                                    fontSize: popup.styles?.titleSize,
                                                    color: popup.styles?.titleColor
                                                }} className="font-bold mb-1">
                                                    {popup.title}
                                                </h3>
                                            )}
                                            {popup.subtitle && (
                                                <p className="text-sm text-gray-500 mb-2">{popup.subtitle}</p>
                                            )}
                                            {popup.body_text && (
                                                <p style={{
                                                    fontFamily: popup.styles?.bodyFont,
                                                    fontSize: popup.styles?.bodySize,
                                                    color: popup.styles?.bodyColor
                                                }} className="mb-4">
                                                    {popup.body_text}
                                                </p>
                                            )}
                                            {popup.collect_email && popup.template === 'email' && (
                                                <input
                                                    type="email"
                                                    placeholder={popup.email_placeholder}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                                                    disabled
                                                />
                                            )}
                                            {popup.button1_text && (
                                                <button
                                                    className="w-full py-2 rounded-lg font-medium text-sm"
                                                    style={{
                                                        backgroundColor: popup.button1_style?.bg,
                                                        color: popup.button1_style?.text
                                                    }}
                                                >
                                                    {popup.button1_text}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {popup.type === 'modal' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                                        <div
                                            className="w-80 shadow-2xl relative"
                                            style={{
                                                backgroundColor: popup.styles?.bgColor,
                                                borderRadius: popup.styles?.borderRadius
                                            }}
                                        >
                                            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                                                <X size={18} />
                                            </button>
                                            {popup.image_url && (
                                                <img src={popup.image_url} alt="" className="w-full h-36 object-cover rounded-t-[inherit]" />
                                            )}
                                            <div className="p-5">
                                                {popup.title && (
                                                    <h3 style={{
                                                        fontFamily: popup.styles?.titleFont,
                                                        fontSize: popup.styles?.titleSize,
                                                        color: popup.styles?.titleColor
                                                    }} className="font-bold mb-2 text-center">
                                                        {popup.title}
                                                    </h3>
                                                )}
                                                {popup.body_text && (
                                                    <p style={{
                                                        fontFamily: popup.styles?.bodyFont,
                                                        fontSize: popup.styles?.bodySize,
                                                        color: popup.styles?.bodyColor
                                                    }} className="mb-4 text-center">
                                                        {popup.body_text}
                                                    </p>
                                                )}
                                                {popup.button1_text && (
                                                    <button
                                                        className="w-full py-2.5 rounded-lg font-medium"
                                                        style={{
                                                            backgroundColor: popup.button1_style?.bg,
                                                            color: popup.button1_style?.text
                                                        }}
                                                    >
                                                        {popup.button1_text}
                                                    </button>
                                                )}
                                                {popup.button2_text && (
                                                    <button
                                                        className="w-full py-2.5 rounded-lg font-medium mt-2"
                                                        style={{
                                                            backgroundColor: popup.button2_style?.bg,
                                                            color: popup.button2_style?.text
                                                        }}
                                                    >
                                                        {popup.button2_text}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PopupEditor;
