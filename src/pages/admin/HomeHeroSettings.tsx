import React, { useEffect, useState } from 'react';
import { homeHeroApi } from '../../services/api/homeHero';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { HomeHero } from '../../types/database';
import { Image, Type, Link, Palette, Eye, Plus, Edit, Trash2 } from 'lucide-react';

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
        background_gradient_start: '#3B82F6',
        background_gradient_end: '#8B5CF6',
        cta1_label: '',
        cta1_link: '',
        cta2_label: '',
        cta2_link: '',
    });

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        try {
            const data = await homeHeroApi.getAllSlides();
            setSlides(data);
        } catch (err) {
            showError('Hero slide\'lar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingSlide) {
                await homeHeroApi.updateSlide(editingSlide.id, formData);
                success('Hero slide güncellendi');
            } else {
                await homeHeroApi.createSlide(formData);
                success('Hero slide oluşturuldu');
            }

            resetForm();
            loadSlides();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'İşlem başarısız');
        }
    };

    const handleEdit = (slide: HomeHero) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle || '',
            background_image_url: slide.background_image_url || '',
            background_gradient_start: slide.background_gradient_start || '#3B82F6',
            background_gradient_end: slide.background_gradient_end || '#8B5CF6',
            cta1_label: slide.cta1_label || '',
            cta1_link: slide.cta1_link || '',
            cta2_label: slide.cta2_label || '',
            cta2_link: slide.cta2_link || '',
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

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            background_image_url: '',
            background_gradient_start: '#3B82F6',
            background_gradient_end: '#8B5CF6',
            cta1_label: '',
            cta1_link: '',
            cta2_label: '',
            cta2_link: '',
        });
        setEditingSlide(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Ana Sayfa Hero Slider</h1>
                        <p className="text-blue-100">
                            Ana sayfadaki büyük banner alanını yönetin. Birden fazla slide ekleyerek slider oluşturabilirsiniz.
                        </p>
                        <div className="mt-4 flex items-center gap-4 text-sm">
                            <span className="bg-white/20 px-3 py-1 rounded-full">
                                {slides.length} Slide
                            </span>
                            <span className="text-blue-100">
                                • Önerilen görsel boyutu: 1920x800 px
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Yeni Slide Ekle
                    </button>
                </div>
            </div>

            {/* Form */}
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

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                                        label="Arka Plan"
                                    />
                                    <p className="text-xs text-gray-500 mt-3 bg-blue-50 p-3 rounded border border-blue-200">
                                        💡 <strong>İpucu:</strong> Görsel yoksa aşağıdaki gradient renkleri kullanılır. Önerilen boyut: 1920x800 px
                                    </p>
                                </div>

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
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Canlı Önizleme</h3>
                                    <p className="text-sm text-gray-500">Slide'ınızın nasıl görüneceğini görün</p>
                                </div>
                            </div>

                            <div className="pl-4">
                                <div
                                    className="relative h-80 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-200"
                                    style={{
                                        background: formData.background_image_url
                                            ? `url(${formData.background_image_url}) center/cover`
                                            : `linear-gradient(to right, ${formData.background_gradient_start}, ${formData.background_gradient_end})`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-black/30"></div>
                                    <div className="relative h-full flex flex-col items-center justify-center text-center px-8 text-white">
                                        <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                                            {formData.title || 'Başlık buraya gelecek'}
                                        </h2>
                                        {formData.subtitle && (
                                            <p className="text-lg mb-8 max-w-2xl drop-shadow-md opacity-90">
                                                {formData.subtitle}
                                            </p>
                                        )}
                                        <div className="flex gap-4">
                                            {formData.cta1_label && (
                                                <div className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold shadow-lg">
                                                    {formData.cta1_label}
                                                </div>
                                            )}
                                            {formData.cta2_label && (
                                                <div className="bg-white/20 backdrop-blur-sm text-white border-2 border-white px-6 py-3 rounded-lg font-bold">
                                                    {formData.cta2_label}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                </div>
            )}

            {/* Slides List */}
            {!showForm && slides.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Mevcut Slide'lar ({slides.length})</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {slides.map((slide, index) => (
                            <div key={slide.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-100 hover:border-blue-300 transition-all">
                                {/* Preview */}
                                <div className="relative">
                                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                                        Slide #{index + 1}
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
                                                🔵 {slide.cta1_label}
                                            </span>
                                        )}
                                        {slide.cta2_label && (
                                            <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                                                🟣 {slide.cta2_label}
                                            </span>
                                        )}
                                        {!slide.cta1_label && !slide.cta2_label && (
                                            <span className="text-xs text-gray-400 italic">Buton yok</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(slide)}
                                            className="flex-1 flex items-center justify-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 font-semibold py-2.5 border-2 border-blue-600 rounded-lg transition-all"
                                        >
                                            <Edit size={16} />
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(slide.id)}
                                            className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-white hover:bg-red-600 font-semibold py-2.5 border-2 border-red-600 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {slides.length === 0 && !showForm && (
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
            )}
        </div>
    );
};
