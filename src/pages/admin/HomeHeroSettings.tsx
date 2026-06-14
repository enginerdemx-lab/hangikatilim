import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeHeroApi } from '../../services/api/homeHero';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { HomeHero } from '../../types/database';
import {
    Image as ImageIcon, Type, Link as LinkIcon, Palette, Eye, Plus, Edit, Trash2,
    ArrowUp, ArrowDown, Search, MonitorSmartphone, Monitor, Smartphone,
    Save, Check, AlertTriangle, X, ChevronLeft,
} from 'lucide-react';

// ---- Shared minimal style tokens -------------------------------------------
const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const hintClass = 'text-xs text-gray-500 mt-1.5';

type FormState = {
    title: string;
    subtitle: string;
    background_image_url: string;
    mobile_image_url: string;
    background_gradient_start: string;
    background_gradient_end: string;
    image_fit_mode: 'cover' | 'contain';
    object_position_x: number;
    object_position_y: number;
    cta1_label: string;
    cta1_link: string;
    cta2_label: string;
    cta2_link: string;
    text_color: string;
    button_color: string;
    button_text_color: string;
    badge_text_color: string;
    is_active: boolean;
};

const EMPTY_FORM: FormState = {
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
    text_color: '#FFFFFF',
    button_color: '#FFFFFF',
    button_text_color: '#210CAE',
    badge_text_color: '#FFFFFF',
    is_active: true,
};

// Reusable minimal section card --------------------------------------------
const SectionCard: React.FC<{
    icon: React.ElementType;
    title: string;
    desc?: string;
    children: React.ReactNode;
    right?: React.ReactNode;
}> = ({ icon: Icon, title, desc, children, right }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 shrink-0">
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                {desc && <p className="text-sm text-gray-500">{desc}</p>}
            </div>
            {right}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

export const HomeHeroSettings: React.FC = () => {
    const navigate = useNavigate();
    const [slides, setSlides] = useState<HomeHero[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HomeHero | null>(null);

    const { success, error: showError } = useToast();

    // Form state + the snapshot taken when the form was opened (for dirty check)
    const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
    const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);

    // Preview mode state
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    // Modals
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [leaveConfirm, setLeaveConfirm] = useState<
        | null
        | { type: 'nav'; to: string }
        | { type: 'close' }
    >(null);

    // List filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'passive'>('all');

    const isDirty = showForm && JSON.stringify(formData) !== JSON.stringify(initialForm);

    useEffect(() => {
        loadSlides();
    }, []);

    // Warn on browser tab close / refresh / external navigation while dirty
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    // Intercept in-app link clicks (sidebar etc.) while dirty -> custom modal
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const anchor = (e.target as HTMLElement | null)?.closest?.('a');
            if (!anchor) return;
            if (anchor.getAttribute('target') === '_blank') return;
            const href = anchor.getAttribute('href');
            if (!href || !href.startsWith('/')) return;
            const dest = new URL(href, window.location.origin);
            if (dest.pathname === window.location.pathname) return;
            e.preventDefault();
            e.stopPropagation();
            setLeaveConfirm({ type: 'nav', to: href });
        };
        document.addEventListener('click', handler, true);
        return () => document.removeEventListener('click', handler, true);
    }, [isDirty]);

    const loadSlides = async () => {
        try {
            await homeHeroApi.normalizeSortOrders();
            const data = await homeHeroApi.getAllSlides();
            setSlides(data);
        } catch (err) {
            showError('Hero slide\'lar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Ask for confirmation before saving
    const handleSubmitWithConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSaveConfirm(true);
    };

    const handleConfirmedSubmit = async () => {
        setShowSaveConfirm(false);
        try {
            if (editingSlide) {
                await homeHeroApi.updateSlide(editingSlide.id, formData);
            } else {
                const newSortOrder = slides.length;
                await homeHeroApi.createSlide({ ...formData, sort_order: newSortOrder });
            }
            success('Değişiklikler kaydedildi');
            closeForm();
            loadSlides();
        } catch (err) {
            showError('Kaydedilemedi: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        }
    };

    const openNewForm = () => {
        setEditingSlide(null);
        setFormData(EMPTY_FORM);
        setInitialForm(EMPTY_FORM);
        setPreviewMode('desktop');
        setShowForm(true);
    };

    const handleEdit = (slide: HomeHero) => {
        const next: FormState = {
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
            text_color: slide.text_color || '#FFFFFF',
            button_color: slide.button_color || '#FFFFFF',
            button_text_color: slide.button_text_color || '#210CAE',
            badge_text_color: slide.badge_text_color || '#FFFFFF',
            is_active: slide.is_active ?? true,
        };
        setEditingSlide(slide);
        setFormData(next);
        setInitialForm(next);
        setPreviewMode('desktop');
        setShowForm(true);
    };

    // Close form without dirty check (used after save / after confirmed leave)
    const closeForm = () => {
        setFormData(EMPTY_FORM);
        setInitialForm(EMPTY_FORM);
        setEditingSlide(null);
        setShowForm(false);
    };

    // User clicked cancel / X -> guard if dirty
    const handleCancel = () => {
        if (isDirty) {
            setLeaveConfirm({ type: 'close' });
        } else {
            closeForm();
        }
    };

    const handleConfirmedLeave = () => {
        const action = leaveConfirm;
        setLeaveConfirm(null);
        // Drop dirty state first so beforeunload / interceptor don't refire
        closeForm();
        if (action && action.type === 'nav') {
            navigate(action.to);
        }
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

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        try {
            const currentSlide = slides[index];
            const prevSlide = slides[index - 1];
            const currentSortOrder = currentSlide.sort_order ?? index;
            const prevSortOrder = prevSlide.sort_order ?? (index - 1);
            await homeHeroApi.reorderSlides([
                { id: currentSlide.id, sort_order: prevSortOrder },
                { id: prevSlide.id, sort_order: currentSortOrder },
            ]);
            success('Sıralama güncellendi');
            loadSlides();
        } catch (err) {
            showError('Sıralama güncellenemedi');
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index >= slides.length - 1) return;
        try {
            const currentSlide = slides[index];
            const nextSlide = slides[index + 1];
            const currentSortOrder = currentSlide.sort_order ?? index;
            const nextSortOrder = nextSlide.sort_order ?? (index + 1);
            await homeHeroApi.reorderSlides([
                { id: currentSlide.id, sort_order: nextSortOrder },
                { id: nextSlide.id, sort_order: currentSortOrder },
            ]);
            success('Sıralama güncellendi');
            loadSlides();
        } catch (err) {
            showError('Sıralama güncellenemedi');
        }
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
        return (
            <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary-600" />
            </div>
        );
    }

    // ===================== FORM VIEW =====================
    if (showForm) {
        return (
            <>
                <form id="hero-form" onSubmit={handleSubmitWithConfirm} className="space-y-5 pb-28">
                    {/* Compact form header */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                            title="Geri"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-gray-900 truncate">
                                {editingSlide ? 'Slide Düzenle' : 'Yeni Slide'}
                            </h1>
                            <p className="text-sm text-gray-500">Ana sayfa banner alanını özelleştirin</p>
                        </div>
                    </div>

                    {/* Metin İçeriği */}
                    <SectionCard icon={Type} title="Metin İçeriği" desc="Başlık ve açıklama metinleri">
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>
                                    Ana Başlık <span className="text-primary-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className={inputClass}
                                    placeholder="Örn: Tasarruf Finansmanı Hesaplama Aracı"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Alt Başlık / Açıklama</label>
                                <textarea
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    rows={3}
                                    className={inputClass}
                                    placeholder="Kısa, açıklayıcı bir metin (opsiyonel)"
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* Renkler */}
                    <SectionCard icon={Palette} title="Renkler" desc="Yazı ve buton renkleri">
                        <div className="space-y-3 max-w-lg">
                            {([
                                { key: 'text_color', label: 'Yazı rengi', presets: ['#FFFFFF', '#0F172A', '#185FA5'] },
                                { key: 'badge_text_color', label: 'Rozet yazı rengi', presets: ['#FFFFFF', '#0F172A', '#185FA5'] },
                                { key: 'button_color', label: 'Buton rengi', presets: ['#FFFFFF', '#185FA5', '#D85A30'] },
                                { key: 'button_text_color', label: 'Buton yazı rengi', presets: ['#210CAE', '#FFFFFF', '#0F172A'] },
                            ] as const).map((row) => (
                                <div key={row.key} className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-gray-700">{row.label}</span>
                                    <div className="flex items-center gap-2">
                                        {row.presets.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, [row.key]: c })}
                                                className={`h-7 w-7 rounded-full border transition ${(formData as any)[row.key] === c ? 'ring-2 ring-primary-500 ring-offset-1 border-transparent' : 'border-gray-300'}`}
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={(formData as any)[row.key]}
                                            onChange={(e) => setFormData({ ...formData, [row.key]: e.target.value })}
                                            className="h-7 w-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                                            title="Özel renk"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Arka Plan Tasarımı */}
                    <SectionCard icon={ImageIcon} title="Arka Plan Tasarımı" desc="Görsel veya gradient renk">
                        <div className="space-y-5">
                            {/* Desktop image */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <label className={labelClass}>Arka Plan Görseli — Masaüstü</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.background_image_url}
                                        onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
                                        placeholder="Görsel URL'sini yapıştır (önerilen)"
                                        className={inputClass}
                                    />
                                    {formData.background_image_url && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, background_image_url: '' })}
                                            className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-300 whitespace-nowrap transition"
                                        >
                                            Temizle
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 my-3">veya aşağıdan dosya yükle:</p>
                                <ImageUpload
                                    folder="hero-backgrounds"
                                    currentImageUrl={formData.background_image_url}
                                    onUploadComplete={(url) => setFormData({ ...formData, background_image_url: url })}
                                    onDelete={() => setFormData({ ...formData, background_image_url: '' })}
                                    label="Masaüstü Görsel"
                                />
                                <p className={hintClass}>
                                    Önerilen oran 12:5 (örn. 1920×800, 2400×1000). Minimum 1920×800 px.
                                </p>
                            </div>

                            {/* Mobile image */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <label className={labelClass}>Mobil Görsel (opsiyonel)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.mobile_image_url}
                                        onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                                        placeholder="Mobil görsel URL'sini yapıştır"
                                        className={inputClass}
                                    />
                                    {formData.mobile_image_url && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mobile_image_url: '' })}
                                            className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-300 whitespace-nowrap transition"
                                        >
                                            Temizle
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 my-3">veya dosya yükle:</p>
                                <ImageUpload
                                    folder="hero-backgrounds-mobile"
                                    currentImageUrl={formData.mobile_image_url}
                                    onUploadComplete={(url) => setFormData({ ...formData, mobile_image_url: url })}
                                    onDelete={() => setFormData({ ...formData, mobile_image_url: '' })}
                                    label="Mobil Görsel"
                                />
                                <p className={hintClass}>
                                    Önerilen oran 4:5 veya 9:16 (dikey). Yüklenmezse masaüstü görsel kullanılır.
                                </p>
                            </div>

                            {/* Fit mode */}
                            {formData.background_image_url && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                    <label className={labelClass}>Görsel Sığdırma Modu</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                        {([
                                            { val: 'cover', title: 'Doldur (Cover)', desc: 'Alanı tamamen kaplar, kenarlar kırpılabilir' },
                                            { val: 'contain', title: 'Tam Sığdır (Contain)', desc: 'Görsel tam görünür, boşluklar gradient ile dolar' },
                                        ] as const).map((opt) => (
                                            <label
                                                key={opt.val}
                                                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${formData.image_fit_mode === opt.val ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="image_fit_mode"
                                                    value={opt.val}
                                                    checked={formData.image_fit_mode === opt.val}
                                                    onChange={() => setFormData({ ...formData, image_fit_mode: opt.val })}
                                                    className="mt-0.5 accent-primary-600"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{opt.title}</div>
                                                    <div className="text-xs text-gray-500">{opt.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    {formData.image_fit_mode === 'cover' && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                                    Yatay pozisyon: {formData.object_position_x}%
                                                </label>
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={formData.object_position_x}
                                                    onChange={(e) => setFormData({ ...formData, object_position_x: parseInt(e.target.value) })}
                                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Sol</span><span>Orta</span><span>Sağ</span></div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                                    Dikey pozisyon: {formData.object_position_y}%
                                                </label>
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={formData.object_position_y}
                                                    onChange={(e) => setFormData({ ...formData, object_position_y: parseInt(e.target.value) })}
                                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                                />
                                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Üst</span><span>Orta</span><span>Alt</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gradient */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                <label className={labelClass}>Gradient Renkleri</label>
                                <p className="text-xs text-gray-500 mb-3">Görsel yoksa arka plan olarak kullanılır.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {([
                                        { key: 'background_gradient_start', label: 'Başlangıç rengi', ph: '#3B82F6' },
                                        { key: 'background_gradient_end', label: 'Bitiş rengi', ph: '#8B5CF6' },
                                    ] as const).map((g) => (
                                        <div key={g.key}>
                                            <label className="block text-xs font-medium text-gray-600 mb-2">{g.label}</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={(formData as any)[g.key]}
                                                    onChange={(e) => setFormData({ ...formData, [g.key]: e.target.value })}
                                                    className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer p-0 bg-transparent shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={(formData as any)[g.key]}
                                                    onChange={(e) => setFormData({ ...formData, [g.key]: e.target.value })}
                                                    className={inputClass}
                                                    placeholder={g.ph}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* CTA */}
                    <SectionCard icon={LinkIcon} title="Aksiyon Butonları (CTA)" desc="Kullanıcıyı yönlendiren butonlar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {([
                                { n: 1, labelKey: 'cta1_label', linkKey: 'cta1_link', title: 'Birinci Buton (Ana CTA)', lblPh: 'Örn: Plan Oluştur', lnkPh: '#hesaplama veya /kampanyalar', hint: '# ile sayfa içi bölüm, / ile başka sayfa' },
                                { n: 2, labelKey: 'cta2_label', linkKey: 'cta2_link', title: 'İkinci Buton (İkincil CTA)', lblPh: 'Örn: Sistem Nedir?', lnkPh: '/hakkimizda', hint: 'Opsiyonel — boş bırakılabilir' },
                            ] as const).map((cta) => (
                                <div key={cta.n} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white text-xs">{cta.n}</span>
                                        {cta.title}
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buton Metni</label>
                                            <input
                                                type="text"
                                                value={(formData as any)[cta.labelKey]}
                                                onChange={(e) => setFormData({ ...formData, [cta.labelKey]: e.target.value })}
                                                className={inputClass}
                                                placeholder={cta.lblPh}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Link / Yönlendirme</label>
                                            <input
                                                type="text"
                                                value={(formData as any)[cta.linkKey]}
                                                onChange={(e) => setFormData({ ...formData, [cta.linkKey]: e.target.value })}
                                                className={inputClass}
                                                placeholder={cta.lnkPh}
                                            />
                                            <p className={hintClass}>{cta.hint}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Preview */}
                    <SectionCard
                        icon={Eye}
                        title="Canlı Önizleme"
                        desc="Slide'ınızın nasıl görüneceği"
                        right={
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${previewMode === 'desktop' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Monitor size={15} /> Masaüstü
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${previewMode === 'mobile' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Smartphone size={15} /> Mobil
                                </button>
                            </div>
                        }
                    >
                        {previewMode === 'desktop' ? (
                            <div
                                className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                                style={{
                                    aspectRatio: '12 / 5',
                                    minHeight: '300px',
                                    maxHeight: '520px',
                                    background: `linear-gradient(90deg, ${formData.background_gradient_start}, ${formData.background_gradient_end})`,
                                }}
                            >
                                {formData.background_image_url && (
                                    formData.image_fit_mode === 'contain' ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <img src={formData.background_image_url} alt="Banner" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                backgroundImage: `url(${formData.background_image_url})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: `${formData.object_position_x}% ${formData.object_position_y}%`,
                                            }}
                                        />
                                    )
                                )}
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="relative z-10 w-full h-full px-6 sm:px-8 md:px-12 lg:px-16 py-10 lg:py-16 flex flex-col justify-center text-white">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium mb-4 backdrop-blur-sm" style={{ color: formData.badge_text_color || '#FFFFFF' }}>
                                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: formData.badge_text_color || '#FFFFFF' }} />
                                            Katılım Uzmanı ile Geleceği Planla
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight" style={{ color: formData.text_color || undefined }}>
                                            {formData.title || 'Başlık buraya gelecek'}
                                        </h2>
                                        {formData.subtitle && (
                                            <p className="text-sm sm:text-base md:text-lg mt-3 sm:mt-4 max-w-xl leading-relaxed opacity-90" style={{ color: formData.text_color || undefined }}>
                                                {formData.subtitle}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8">
                                            {formData.cta1_label && (
                                                <div className="font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-sm sm:text-base cursor-default" style={{ backgroundColor: formData.button_color || '#FFFFFF', color: formData.button_text_color || '#210CAE' }}>
                                                    {formData.cta1_label}
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                </div>
                                            )}
                                            {formData.cta2_label && (
                                                <div className="bg-white/10 text-white border border-white/20 font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl flex items-center gap-2 text-sm sm:text-base backdrop-blur-sm cursor-default">
                                                    {formData.cta2_label}
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-xl" style={{ width: '320px' }}>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-20" />
                                    <div className="relative rounded-[2rem] overflow-hidden bg-white" style={{ width: '294px', height: '520px' }}>
                                        <div
                                            className="relative w-full overflow-hidden"
                                            style={{ height: '340px', background: `linear-gradient(90deg, ${formData.background_gradient_start}, ${formData.background_gradient_end})` }}
                                        >
                                            {(formData.mobile_image_url || formData.background_image_url) && (
                                                <div
                                                    className="absolute inset-0"
                                                    style={{ backgroundImage: `url(${formData.mobile_image_url || formData.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center center' }}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/10" />
                                            <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[8px] font-medium mb-2 w-fit" style={{ color: formData.badge_text_color || '#FFFFFF' }}>
                                                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: formData.badge_text_color || '#FFFFFF' }} />
                                                    Katılım Uzmanı
                                                </div>
                                                <h3 className="text-sm font-bold leading-tight line-clamp-2" style={{ color: formData.text_color || undefined }}>
                                                    {formData.title || 'Başlık'}
                                                </h3>
                                                {formData.subtitle && (
                                                    <p className="text-[10px] mt-1 line-clamp-2 opacity-90" style={{ color: formData.text_color || undefined }}>
                                                        {formData.subtitle}
                                                    </p>
                                                )}
                                                {formData.cta1_label && (
                                                    <div className="mt-3 font-bold px-3 py-1.5 rounded-lg text-[10px] w-fit flex items-center gap-1" style={{ backgroundColor: formData.button_color || '#FFFFFF', color: formData.button_text_color || '#210CAE' }}>
                                                        {formData.cta1_label}
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            <div className="h-8 bg-gray-100 rounded mt-3" />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-gray-500">
                                    {formData.mobile_image_url
                                        ? 'Mobil görsel kullanılıyor'
                                        : formData.background_image_url
                                            ? 'Masaüstü görsel kullanılıyor (mobil yok)'
                                            : 'Görsel yüklenmedi'}
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* Active toggle */}
                    <SectionCard icon={Eye} title="Yayın Durumu" desc="Bu slide sitede gösterilsin mi?">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">
                                {formData.is_active ? 'Slider aktif — sitede görünür' : 'Slider pasif — sitede görünmez'}
                            </span>
                            <span className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="sr-only"
                                />
                                <span className={`block w-12 h-7 rounded-full transition-colors ${formData.is_active ? 'bg-primary-600' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                </span>
                            </span>
                        </label>
                    </SectionCard>
                </form>

                {/* ===== Sticky bottom action bar ===== */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
                    <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            {isDirty ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    Kaydedilmemiş değişiklikler
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                                    <Check size={15} /> {editingSlide ? 'Değişiklik yok' : 'Yeni slide'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                form="hero-form"
                                disabled={!isDirty}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Save size={16} />
                                {editingSlide ? 'Değişiklikleri Kaydet' : 'Slide\'ı Oluştur'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save confirmation modal */}
                {showSaveConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-4">
                                <Save size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Değişiklikleri kaydet</h3>
                            <p className="text-sm text-gray-500 mt-1.5">Yaptığınız değişiklikleri kaydetmek istiyor musunuz?</p>
                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSaveConfirm(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmedSubmit}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
                                >
                                    Evet, kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unsaved-changes leave confirmation modal */}
                {leaveConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Değişiklikler kaydedilmedi</h3>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Kaydedilmemiş değişiklikleriniz var. Ayrılırsanız bu değişiklikler kaybolacak.
                            </p>
                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setLeaveConfirm(null)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Sayfada kal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmedLeave}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition"
                                >
                                    Kaydetmeden ayrıl
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ===================== LIST VIEW =====================
    return (
        <div className="space-y-5">
            {/* Page header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Ana Sayfa Hero Slider</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Ana sayfadaki büyük banner alanını yönetin. Birden fazla slide ekleyerek slider oluşturabilirsiniz.
                        </p>
                        <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
                            {[
                                { label: 'Toplam', value: slides.length, dot: 'bg-gray-400' },
                                { label: 'Aktif', value: activeSlidesCount, dot: 'bg-primary-500' },
                                { label: 'Pasif', value: passiveSlidesCount, dot: 'bg-gray-300' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-lg border border-gray-200 p-3">
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                                    </p>
                                    <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={openNewForm}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition w-full lg:w-auto"
                    >
                        <Plus size={18} />
                        Yeni Slide Ekle
                    </button>
                </div>
            </div>

            {/* Filters + list */}
            {slides.length > 0 && (
                <div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                            <div className="relative lg:col-span-2">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Başlık, alt başlık veya CTA ara..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'passive')}
                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="active">Sadece Aktif</option>
                                <option value="passive">Sadece Pasif</option>
                            </select>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
                                <MonitorSmartphone size={16} />
                                <span>{filteredSlides.length} / {slides.length} gösteriliyor</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filteredSlides.map((slide) => {
                            const index = slides.findIndex((s) => s.id === slide.id);
                            return (
                                <div key={slide.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-primary-300 transition">
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 bg-gray-900/70 text-white px-2.5 py-1 rounded-md text-xs font-semibold z-10 backdrop-blur-sm">
                                            #{index + 1}
                                        </div>
                                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold z-10 ${slide.is_active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {slide.is_active ? 'Aktif' : 'Pasif'}
                                        </div>
                                        <div
                                            className="h-48 flex items-center justify-center text-white p-6"
                                            style={{
                                                background: slide.background_image_url
                                                    ? `url(${slide.background_image_url}) center/cover`
                                                    : `linear-gradient(to right, ${slide.background_gradient_start}, ${slide.background_gradient_end})`,
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-black/25" />
                                            <div className="relative text-center">
                                                <h3 className="text-xl font-bold mb-1 drop-shadow">{slide.title}</h3>
                                                {slide.subtitle && (
                                                    <p className="text-sm opacity-90 line-clamp-2 drop-shadow">{slide.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-2 mb-4 min-h-[1.5rem]">
                                            {slide.cta1_label && (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                                                    CTA 1: {slide.cta1_label}
                                                </span>
                                            )}
                                            {slide.cta2_label && (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
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
                                                className={`p-2.5 rounded-lg border transition ${index === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50'}`}
                                                title="Yukarı Taşı"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === slides.length - 1}
                                                className={`p-2.5 rounded-lg border transition ${index === slides.length - 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50'}`}
                                                title="Aşağı Taşı"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(slide)}
                                                className="flex-1 flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-white hover:bg-primary-600 font-semibold py-2.5 border border-primary-600 rounded-lg transition"
                                            >
                                                <Edit size={16} /> Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slide.id)}
                                                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-white hover:bg-red-600 font-semibold px-4 py-2.5 border border-gray-300 hover:border-red-600 rounded-lg transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredSlides.length === 0 && (
                        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                            Arama ve filtreye uygun slide bulunamadı.
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {slides.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 mx-auto mb-4">
                        <ImageIcon size={26} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Henüz hero slide yok</h3>
                    <p className="text-sm text-gray-500 mb-6">Ana sayfanızda görünecek ilk banner'ı oluşturun.</p>
                    <button
                        onClick={openNewForm}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition"
                    >
                        <Plus size={18} /> İlk Slide'ı Oluştur
                    </button>
                </div>
            )}
        </div>
    );
};
