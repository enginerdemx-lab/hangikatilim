import React, { useEffect, useState } from 'react';
import { homeHeroApi } from '../../services/api/homeHero';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { HomeHero } from '../../types/database';
import { Image, Type, Link, Palette, Eye, Plus, Edit, Trash2, ArrowUp, ArrowDown, Search, MonitorSmartphone } from 'lucide-react';

export const HomeHeroSettings: React.FC = () => {
    const [slides, setSlides] = useState<HomeHero[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HomeHero | null>(null);

    const { success, error: showError } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        background_image_url: '',
        mobile_image_url: '', // Mobil görsel
        background_gradient_start: '#3B82F6',
        background_gradient_end: '#8B5CF6',
        image_fit_mode: 'cover' as 'cover' | 'contain',
        object_position_x: 50,
        object_position_y: 50,
        cta1_label: '',
        cta1_link: '',
        cta2_label: '',
        cta2_link: '',
        is_active: true,
    });

    // Preview mode state
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Save confirmation modal state
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all');

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        try {
            // First normalize any NULL or duplicate sort_order values
            await homeHeroApi.normalizeSortOrders();
            const data = await homeHeroApi.getAllSlides();
            setSlides(data);
        } catch (err) {
            showError('Hero slide\'lar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Show confirmation modal before submit
    const handleSubmitWithConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSaveConfirm(true);
    };

    // Actual submit logic after confirmation
    const handleConfirmedSubmit = async () => {
        setShowSaveConfirm(false);
        try {
            if (editingSlide) {
                await homeHeroApi.updateSlide(editingSlide.id, formData);
                success('Kaydedildi');
            } else {
                // Yeni slide için sort_order = mevcut slide sayısı (en sona ekle)
                const newSortOrder = slides.length;
                await homeHeroApi.createSlide({ ...formData, sort_order: newSortOrder });
                success('Kaydedildi');
            }

            resetForm();
            loadSlides();
        } catch (err) {
            showError('Kaydedilemedi: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        }
    };

    const handleEdit = (slide: HomeHero) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle || '',
            background_image_url: slide.background_image_url || '',
            mobile_image_url: slide.mobile_image_url || '',
            background_gradient_start: slide.background_gradient_start || '#3B82F6',
            background_gradient_end: slide.background_gradient_end || '#8B5CF6',
            image_fit_mode: slide.image_fit_mode || 'cover',
            object_position_x: slide.object_position_x ?? 50,
            object_position_y: slide.object_position_y ?? 50,
            cta1_label: slide.cta1_label || '',
            cta1_link: slide.cta1_link || '',
            cta2_label: slide.cta2_label || '',
            cta2_link: slide.cta2_link || '',
            is_active: slide.is_active ?? true,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu hero slide\'ı silmek istediğinizden emin misiniz?')) return;

        try {
            await homeHeroApi.deleteSlide(id);
            success('Hero slide silindi');
            loadSlides();
        } catch (err) {
            showError('Silme başarısız');
        }
    };

    // Move slide up in order
    const handleMoveUp = async (index: number) => {
        if (index === 0) return; // Already at top

        try {
            const currentSlide = slides[index];
            const prevSlide = slides[index - 1];

            // Swap sort_order values - use actual sort_order values from slides
            const currentSortOrder = currentSlide.sort_order ?? index;
            const prevSortOrder = prevSlide.sort_order ?? (index - 1);

            await homeHeroApi.reorderSlides([
                { id: currentSlide.id, sort_order: prevSortOrder },
                { id: prevSlide.id, sort_order: currentSortOrder }
            ]);

            success('Sıralama güncellendi');
            loadSlides();
        } catch (err) {
            showError('Sıralama güncellenemedi');
        }
    };

    // Move slide down in order
    const handleMoveDown = async (index: number) => {
        if (index >= slides.length - 1) return; // Already at bottom

        try {
            const currentSlide = slides[index];
            const nextSlide = slides[index + 1];

            // Swap sort_order values - use actual sort_order values from slides
            const currentSortOrder = currentSlide.sort_order ?? index;
            const nextSortOrder = nextSlide.sort_order ?? (index + 1);

            await homeHeroApi.reorderSlides([
                { id: currentSlide.id, sort_order: nextSortOrder },
                { id: nextSlide.id, sort_order: currentSortOrder }
            ]);

            success('Sıralama güncellendi');
            loadSlides();
        } catch (err) {
            showError('Sıralama güncellenemedi');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            background_image_url: '',
            mobile_image_url: '',
            background_gradient_start: '#3B82F6',
            background_gradient_end: '#8B5CF6',
            image_fit_mode: 'cover',
            object_position_x: 50,
            object_position_y: 50,
            cta1_label: '',
            cta1_link: '',
            cta2_label: '',
            cta2_link: '',
            is_active: true,
        });
        setEditingSlide(null);
        setShowForm(false);
    };
    const activeSlidesCount = slides.filter((slide) => slide.is_active).length;
    const passiveSlidesCount = slides.length - activeSlidesCount;
    const filteredSlides = slides.filter((slide) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
            query.length === 0 ||
            slide.title.toLowerCase().includes(query) ||
            (slide.subtitle || '').toLowerCase().includes(query) ||
            (slide.cta1_label || '').toLowerCase().includes(query) ||
            (slide.cta2_label || '').toLowerCase().includes(query);

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && slide.is_active) ||
            (statusFilter === 'passive' && !slide.is_active);

        return matchesQuery && matchesStatus;
    });

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
                        {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ana Sayfa Hero Slider</h1>
                        <p className="text-gray-600">
                            Ana sayfadaki buyuk banner alanini yonetin. Birden fazla slide ekleyerek slider olusturabilirsiniz.
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Toplam Slide</p>
                                <p className="text-xl font-semibold text-gray-900">{slides.length}</p>
                            </div>
                            <div className="rounded-lg border border-green-200 p-3 bg-green-50">
                                <p className="text-xs uppercase tracking-wide text-green-700">Aktif</p>
                                <p className="text-xl font-semibold text-green-700">{activeSlidesCount}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Pasif</p>
                                <p className="text-xl font-semibold text-gray-900">{passiveSlidesCount}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm inline-flex items-center gap-2 w-full lg:w-auto justify-center"
                    >
                        <Plus size={20} />
                        Yeni Slide Ekle
                    </button>
                </div>
            </div>
            {/* Form */}
            {/* Save Confirmation Modal */}
            {showSaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-fade-in-up">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Değişiklikleri Kaydet</h3>
                            <p className="text-gray-600 mb-6">Değişiklikleri kaydetmek istiyor musunuz?</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowSaveConfirm(false)}
                                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hayır
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmedSubmit}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Evet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="bg-white rounded-lg shadow-xl border-2 border-blue-100">
                    {/* Form Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingSlide ? '✏️ Slide Düzenle' : '➕ Yeni Slide Oluştur'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Tüm alanları doldurarak ana sayfa banner'ınızı özelleştirin
                            </p>
                        </div>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmitWithConfirm} className="p-6 space-y-8">
                        {/* Section 1: Metin İçeriği */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Type className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Metin İçeriği</h3>
                                    <p className="text-sm text-gray-500">Slide'ınızın başlık ve açıklama metinleri</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pl-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ana Başlık *
                                        <span className="text-xs font-normal text-gray-500 ml-2">(Büyük, kalın metin)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                                        placeholder="Örn: Tasarruf Finansmanı Hesaplama Aracı"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Alt Başlık / Açıklama
                                        <span className="text-xs font-normal text-gray-500 ml-2">(Opsiyonel, daha küçük metin)</span>
                                    </label>
                                    <textarea
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Örn: Kendi ödeme planınızı oluşturun, vade farkısız ev ve araç sahibi olmanın maliyetlerini anında hesaplayın."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Görsel & Renk */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Image className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Arka Plan Tasarımı</h3>
                                    <p className="text-sm text-gray-500">Görsel veya gradient renk seçin</p>
                                </div>
                            </div>

                            <div className="pl-4 space-y-6">
                                {/* Background Image */}
                                <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        📸 Arka Plan Görseli (Opsiyonel)
                                    </label>
                                    <ImageUpload
                                        folder="hero-backgrounds"
                                        currentImageUrl={formData.background_image_url}
                                        onUploadComplete={(url) => setFormData({ ...formData, background_image_url: url })}
                                        onDelete={() => setFormData({ ...formData, background_image_url: '' })}
                                        label="Masaüstü Görsel"
                                    />
                                    <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-200 space-y-1">
                                        <p className="text-xs text-gray-600">
                                            📐 <strong>Önerilen oran:</strong> 12:5 (örn: 1920×800, 2400×1000)
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            📏 <strong>Minimum boyut:</strong> 1920×800 piksel
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            💡 Oran uyduğu sürece daha büyük çözünürlükler kabul edilir.
                                        </p>
                                    </div>
                                </div>

                                {/* Mobile Image Upload */}
                                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Image className="text-orange-600" size={20} />
                                        <label className="text-sm font-semibold text-gray-700">
                                            📱 Mobil Görsel (Opsiyonel)
                                        </label>
                                    </div>
                                    <ImageUpload
                                        folder="hero-backgrounds-mobile"
                                        currentImageUrl={formData.mobile_image_url}
                                        onUploadComplete={(url) => setFormData({ ...formData, mobile_image_url: url })}
                                        onDelete={() => setFormData({ ...formData, mobile_image_url: '' })}
                                        label="Mobil Görsel"
                                    />
                                    <div className="mt-3 bg-orange-100 p-3 rounded border border-orange-300 space-y-1">
                                        <p className="text-xs text-gray-600">
                                            📐 <strong>Önerilen oran:</strong> 4:5 veya 9:16 (dikey)
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            📏 <strong>Önerilen boyut:</strong> 800×1000 veya 1080×1920 piksel
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            💡 Mobil görsel yüklenmezse masaüstü görsel kullanılır.
                                        </p>
                                    </div>
                                </div>

                                {/* Image Fit Mode */}
                                {formData.background_image_url && (
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Image className="text-purple-600" size={20} />
                                            <label className="text-sm font-semibold text-gray-700">
                                                🖼️ Görsel Sığdırma Modu
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.image_fit_mode === 'cover'
                                                ? 'border-purple-500 bg-purple-100'
                                                : 'border-gray-200 bg-white hover:border-purple-300'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="image_fit_mode"
                                                    value="cover"
                                                    checked={formData.image_fit_mode === 'cover'}
                                                    onChange={() => setFormData({ ...formData, image_fit_mode: 'cover' })}
                                                    className="mr-3"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Doldur (Cover)</div>
                                                    <div className="text-xs text-gray-500">Alanı tamamen kaplar, kenarlar kırpılabilir</div>
                                                </div>
                                            </label>

                                            <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.image_fit_mode === 'contain'
                                                ? 'border-purple-500 bg-purple-100'
                                                : 'border-gray-200 bg-white hover:border-purple-300'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="image_fit_mode"
                                                    value="contain"
                                                    checked={formData.image_fit_mode === 'contain'}
                                                    onChange={() => setFormData({ ...formData, image_fit_mode: 'contain' })}
                                                    className="mr-3"
                                                />
                                                <div>
                                                    <div className="font-semibold text-gray-900">Tam Sığdır (Contain)</div>
                                                    <div className="text-xs text-gray-500">Görsel tamamen görünür, boşluklar gradient ile doldurulur</div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Object Position (only for cover mode) */}
                                        {formData.image_fit_mode === 'cover' && (
                                            <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                    🎯 Odak Noktası (Kırpma Pozisyonu)
                                                </label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                                            Yatay Pozisyon: {formData.object_position_x}%
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={formData.object_position_x}
                                                            onChange={(e) => setFormData({ ...formData, object_position_x: parseInt(e.target.value) })}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                            <span>Sol</span>
                                                            <span>Orta</span>
                                                            <span>Sağ</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                                            Dikey Pozisyon: {formData.object_position_y}%
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={formData.object_position_y}
                                                            onChange={(e) => setFormData({ ...formData, object_position_y: parseInt(e.target.value) })}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                            <span>Üst</span>
                                                            <span>Orta</span>
                                                            <span>Alt</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-3">
                                                    💡 Kırpma sırasında hangi bölgenin görünmesini istiyorsanız o tarafa kaydırın.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Gradient Colors */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Palette className="text-purple-600" size={20} />
                                        <label className="text-sm font-semibold text-gray-700">
                                            🎨 Gradient Renkleri (Görsel yoksa kullanılır)
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-2">Başlangıç Rengi</label>
                                            <div className="flex gap-3 items-center">
                                                <input
                                                    type="color"
                                                    value={formData.background_gradient_start}
                                                    onChange={(e) => setFormData({ ...formData, background_gradient_start: e.target.value })}
                                                    className="h-14 w-14 rounded-lg border-2 border-gray-300 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.background_gradient_start}
                                                    onChange={(e) => setFormData({ ...formData, background_gradient_start: e.target.value })}
                                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="#3B82F6"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-2">Bitiş Rengi</label>
                                            <div className="flex gap-3 items-center">
                                                <input
                                                    type="color"
                                                    value={formData.background_gradient_end}
                                                    onChange={(e) => setFormData({ ...formData, background_gradient_end: e.target.value })}
                                                    className="h-14 w-14 rounded-lg border-2 border-gray-300 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.background_gradient_end}
                                                    onChange={(e) => setFormData({ ...formData, background_gradient_end: e.target.value })}
                                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="#8B5CF6"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: CTA Buttons */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-green-100">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Link className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Aksiyon Butonları (CTA)</h3>
                                    <p className="text-sm text-gray-500">Kullanıcıları yönlendiren butonlar</p>
                                </div>
                            </div>

                            <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CTA 1 */}
                                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                        Birinci Buton (Ana CTA)
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">Buton Metni</label>
                                            <input
                                                type="text"
                                                value={formData.cta1_label}
                                                onChange={(e) => setFormData({ ...formData, cta1_label: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Örn: Plan Oluştur"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">Link / Yönlendirme</label>
                                            <input
                                                type="text"
                                                value={formData.cta1_link}
                                                onChange={(e) => setFormData({ ...formData, cta1_link: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="#hesaplama veya /kampanyalar"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                💡 # ile sayfa içi bölüm, / ile başka sayfa
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA 2 */}
                                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                                    <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                        <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                        İkinci Buton (İkincil CTA)
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">Buton Metni</label>
                                            <input
                                                type="text"
                                                value={formData.cta2_label}
                                                onChange={(e) => setFormData({ ...formData, cta2_label: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="Örn: Sistem Nedir?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">Link / Yönlendirme</label>
                                            <input
                                                type="text"
                                                value={formData.cta2_link}
                                                onChange={(e) => setFormData({ ...formData, cta2_link: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="/hakkimizda"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                💡 Opsiyonel - Boş bırakılabilir
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Preview */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-yellow-100">
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <Eye className="text-yellow-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">Canlı Önizleme</h3>
                                    <p className="text-sm text-gray-500">Slide'ınızın nasıl görüneceğini görün</p>
                                </div>

                                {/* Preview Mode Tabs */}
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('desktop')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${previewMode === 'desktop'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        🖥️ Masaüstü
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('mobile')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${previewMode === 'mobile'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        📱 Mobil
                                    </button>
                                </div>
                            </div>

                            <div className="pl-4">
                                {previewMode === 'desktop' ? (
                                    // Desktop Preview
                                    <div
                                        className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-200"
                                        style={{
                                            aspectRatio: '12 / 5',
                                            minHeight: '320px',
                                            maxHeight: '520px',
                                            background: formData.background_image_url
                                                ? `linear-gradient(90deg, ${formData.background_gradient_start}, ${formData.background_gradient_end})`
                                                : `linear-gradient(90deg, ${formData.background_gradient_start}, ${formData.background_gradient_end})`
                                        }}
                                    >
                                        {/* Background Image with fit mode */}
                                        {formData.background_image_url && (
                                            <>
                                                {formData.image_fit_mode === 'contain' ? (
                                                    // Contain mode - show full image with gradient backdrop
                                                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl">
                                                        <img
                                                            src={formData.background_image_url}
                                                            alt="Banner"
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    // Cover mode - fill with object position
                                                    <div
                                                        className="absolute inset-0 rounded-3xl"
                                                        style={{
                                                            backgroundImage: `url(${formData.background_image_url})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: `${formData.object_position_x}% ${formData.object_position_y}%`
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>

                                        {/* Content Container - Same as public site */}
                                        <div className="relative z-10 w-full h-full px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 flex flex-col justify-center text-white">
                                            {/* Hero Content - Left aligned */}
                                            <div className="max-w-3xl">
                                                {/* Badge */}
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white mb-4 backdrop-blur-sm">
                                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                                    Katılım Uzmanı ile Geleceği Planla
                                                </div>

                                                {/* Title */}
                                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                                                    {formData.title || 'Başlık buraya gelecek'}
                                                </h2>

                                                {/* Subtitle */}
                                                {formData.subtitle && (
                                                    <p className="text-sm sm:text-base md:text-lg text-gray-100 mt-3 sm:mt-4 max-w-xl leading-relaxed opacity-90">
                                                        {formData.subtitle}
                                                    </p>
                                                )}

                                                {/* CTA Buttons - Left aligned */}
                                                <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
                                                    {formData.cta1_label && (
                                                        <div className="bg-white text-[#210CAE] font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-sm sm:text-base cursor-default">
                                                            {formData.cta1_label}
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {formData.cta2_label && (
                                                        <div className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl flex items-center gap-2 text-sm sm:text-base backdrop-blur-sm cursor-default">
                                                            {formData.cta2_label}
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fit Mode Indicator */}
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                            {formData.image_fit_mode === 'cover' ? 'Cover' : 'Contain'}
                                        </div>
                                    </div>
                                ) : (
                                    // Mobile Preview
                                    <div className="flex flex-col items-center">
                                        {/* Phone Frame */}
                                        <div
                                            className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl"
                                            style={{ width: '320px' }}
                                        >
                                            {/* Phone Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-20"></div>

                                            {/* Screen */}
                                            <div
                                                className="relative rounded-[2rem] overflow-hidden bg-white"
                                                style={{ width: '294px', height: '520px' }}
                                            >
                                                {/* Banner Preview */}
                                                <div
                                                    className="relative w-full overflow-hidden"
                                                    style={{
                                                        height: '340px',
                                                        background: `linear-gradient(90deg, ${formData.background_gradient_start}, ${formData.background_gradient_end})`
                                                    }}
                                                >
                                                    {/* Mobile Background Image */}
                                                    {(formData.mobile_image_url || formData.background_image_url) && (
                                                        <div
                                                            className="absolute inset-0"
                                                            style={{
                                                                backgroundImage: `url(${formData.mobile_image_url || formData.background_image_url})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center center'
                                                            }}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/10"></div>

                                                    {/* Content */}
                                                    <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[8px] font-medium mb-2 w-fit">
                                                            <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                                                            Katılım Uzmanı
                                                        </div>
                                                        <h3 className="text-sm font-bold leading-tight line-clamp-2">
                                                            {formData.title || 'Başlık'}
                                                        </h3>
                                                        {formData.subtitle && (
                                                            <p className="text-[10px] text-gray-200 mt-1 line-clamp-2">
                                                                {formData.subtitle}
                                                            </p>
                                                        )}
                                                        {formData.cta1_label && (
                                                            <div className="mt-3 bg-white text-[#210CAE] font-bold px-3 py-1.5 rounded-lg text-[10px] w-fit flex items-center gap-1">
                                                                {formData.cta1_label}
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mock content below banner */}
                                                <div className="p-3 space-y-2">
                                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-8 bg-gray-100 rounded mt-3"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image indicator */}
                                        <div className="mt-3 flex items-center gap-2 text-xs">
                                            {formData.mobile_image_url ? (
                                                <span className="text-green-600 font-medium">✅ Mobil görsel kullanılıyor</span>
                                            ) : formData.background_image_url ? (
                                                <span className="text-orange-500 font-medium">⚠️ Masaüstü görsel kullanılıyor (mobil yok)</span>
                                            ) : (
                                                <span className="text-gray-500">Görsel yüklenmedi</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                            ↑ Mobil cihazlarda bu şekilde görünecek
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active Status Toggle */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        {formData.is_active ? (
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 group-hover:text-gray-700 transition">
                                            {formData.is_active ? '✅ Slider Aktif' : '❌ Slider Pasif'}
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            {formData.is_active ? 'Bu slider sitede görünecek' : 'Bu slider sitede görünmeyecek'}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only"
                                    />
                                    <div className={`w-14 h-8 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-6 border-t-2">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                {editingSlide ? '✅ Değişiklikleri Kaydet' : '➕ Slide\'ı Oluştur'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-4 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                ❌ İptal
                            </button>
                        </div>
                    </form>
                </div >
            )}

                        {/* Slides List */}
            {
                !showForm && slides.length > 0 && (
                    <div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                                <div className="relative lg:col-span-2">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Baslik, alt baslik veya CTA ara..."
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'passive')}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">Tum Durumlar</option>
                                    <option value="active">Sadece Aktif</option>
                                    <option value="passive">Sadece Pasif</option>
                                </select>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
                                    <MonitorSmartphone size={16} />
                                    <span>{filteredSlides.length} / {slides.length} gosteriliyor</span>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">Mevcut Slide'lar ({filteredSlides.length})</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredSlides.map((slide) => {
                                const index = slides.findIndex((s) => s.id === slide.id);

                                return (
                                    <div key={slide.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-all">
                                        {/* Preview */}
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                                                Slide #{index + 1}
                                            </div>
                                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold z-10 ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                                {slide.is_active ? 'Aktif' : 'Pasif'}
                                            </div>
                                            <div
                                                className="h-56 flex items-center justify-center text-white p-6"
                                                style={{
                                                    background: slide.background_image_url
                                                        ? `url(${slide.background_image_url}) center/cover`
                                                        : `linear-gradient(to right, ${slide.background_gradient_start}, ${slide.background_gradient_end})`
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-black/20"></div>
                                                <div className="relative text-center">
                                                    <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{slide.title}</h3>
                                                    {slide.subtitle && (
                                                        <p className="text-sm opacity-90 line-clamp-2 drop-shadow-md">{slide.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info & Actions */}
                                        <div className="p-4 bg-gray-50">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {slide.cta1_label && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                                                        CTA 1: {slide.cta1_label}
                                                    </span>
                                                )}
                                                {slide.cta2_label && (
                                                    <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                                                        CTA 2: {slide.cta2_label}
                                                    </span>
                                                )}
                                                {!slide.cta1_label && !slide.cta2_label && (
                                                    <span className="text-xs text-gray-400 italic">Buton yok</span>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className={`p-2.5 rounded-lg border-2 transition-all ${index === 0
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                        : 'border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title="Yukari Tasi"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === slides.length - 1}
                                                    className={`p-2.5 rounded-lg border-2 transition-all ${index === slides.length - 1
                                                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                        : 'border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title="Asagi Tasi"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(slide)}
                                                    className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 font-semibold py-2.5 border border-blue-600 rounded-lg transition-all"
                                                >
                                                    <Edit size={16} />
                                                    Duzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(slide.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-white hover:bg-red-600 font-semibold py-2.5 border border-red-600 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredSlides.length === 0 && (
                            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
                                Arama ve filtreye uygun slide bulunamadi.
                            </div>
                        )}
                    </div>
                )
            }
            {/* Empty State */}
            {
                slides.length === 0 && !showForm && (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-6xl mb-4">🎨</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Hero Slide Yok</h3>
                        <p className="text-gray-600 mb-6">
                            Ana sayfanızda görünecek etkileyici banner'lar oluşturmaya başlayın
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg inline-flex items-center gap-2"
                        >
                            <Plus size={20} />
                            İlk Slide'ı Oluştur
                        </button>
                    </div>
                )
            }
        </div >
    );
};




