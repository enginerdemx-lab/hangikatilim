import React, { useEffect, useState, useMemo } from 'react';
import {
    Home, Car, Calculator, Gift, Building2, CreditCard, Wallet,
    TrendingUp, Shield, FileText, Users, Phone, Mail, HelpCircle,
    Settings, Star, Zap, Award, Target, Percent, PiggyBank,
    Landmark, Briefcase, BarChart3, Plus, Trash2, Edit2,
    Eye, EyeOff, ExternalLink, Save, Search, RefreshCw, X,
    GripVertical, ChevronDown,
    type LucideIcon
} from 'lucide-react';
import { quickLinksApi, type QuickLinksSettings, type QuickLinksItem, type QuickLinksItemFormData } from '../../services/api/quickLinks';
import { useToast } from '../../hooks/useToast';

// Available icons
const availableIcons: { name: string; icon: LucideIcon }[] = [
    { name: 'Home', icon: Home },
    { name: 'Car', icon: Car },
    { name: 'Calculator', icon: Calculator },
    { name: 'Gift', icon: Gift },
    { name: 'Building2', icon: Building2 },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Wallet', icon: Wallet },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Shield', icon: Shield },
    { name: 'FileText', icon: FileText },
    { name: 'Users', icon: Users },
    { name: 'Phone', icon: Phone },
    { name: 'Mail', icon: Mail },
    { name: 'HelpCircle', icon: HelpCircle },
    { name: 'Settings', icon: Settings },
    { name: 'Star', icon: Star },
    { name: 'Zap', icon: Zap },
    { name: 'Award', icon: Award },
    { name: 'Target', icon: Target },
    { name: 'Percent', icon: Percent },
    { name: 'PiggyBank', icon: PiggyBank },
    { name: 'Landmark', icon: Landmark },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'BarChart3', icon: BarChart3 },
];

const getIcon = (name: string): LucideIcon => {
    return availableIcons.find(i => i.name === name)?.icon || Home;
};

// =============================================================================
// Reusable Components
// =============================================================================

// Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; titleRight?: React.ReactNode }> =
    ({ children, className = '', title, titleRight }) => (
        <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 ${className}`}>
            {title && (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                    {titleRight}
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );

// Toggle Switch Component
const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);

// Preview Card Component (Mono style)
const PreviewCard: React.FC<{ item: QuickLinksItemFormData | QuickLinksItem; isNew?: boolean }> = ({ item, isNew }) => {
    const IconComponent = getIcon(item.icon);
    const isActive = !('is_active' in item) || item.is_active;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-center relative transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${!isActive ? 'opacity-50' : ''}`}>
            {item.badge_text && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-full border border-slate-200 dark:border-slate-600">
                    {item.badge_text}
                </span>
            )}
            {isNew && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold rounded-full">
                    YENİ
                </span>
            )}
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <IconComponent className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title || 'Başlık'}</h4>
        </div>
    );
};

// =============================================================================
// Main Component
// =============================================================================

export const QuickLinks: React.FC = () => {
    const [settings, setSettings] = useState<QuickLinksSettings | null>(null);
    const [items, setItems] = useState<QuickLinksItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<QuickLinksItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'custom' | 'az' | 'za' | 'created'>('custom');
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState<QuickLinksItemFormData>({
        title: '',
        icon: 'Home',
        link_url: '/',
        is_external: false,
        badge_text: '',
        badge_color: 'slate',
        badge_animation: 'none',
        is_active: true,
        order_no: 0
    });

    // Settings form
    const [settingsForm, setSettingsForm] = useState({
        section_title: '',
        section_subtitle: '',
        is_enabled: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [settingsData, itemsData] = await Promise.all([
                quickLinksApi.getSettings(),
                quickLinksApi.getAllItems()
            ]);

            if (settingsData) {
                setSettings(settingsData);
                setSettingsForm({
                    section_title: settingsData.section_title || '',
                    section_subtitle: settingsData.section_subtitle || '',
                    is_enabled: settingsData.is_enabled
                });
            }
            setItems(itemsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filtered and sorted items
    const displayItems = useMemo(() => {
        let result = [...items];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.link_url.toLowerCase().includes(q)
            );
        }

        // Sort
        switch (sortBy) {
            case 'az':
                result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
                break;
            case 'za':
                result.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
                break;
            case 'created':
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            default: // custom order
                result.sort((a, b) => a.order_no - b.order_no);
        }

        return result;
    }, [items, searchQuery, sortBy]);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await quickLinksApi.updateSettings(settingsForm);
            showToast('Ayarlar kaydedildi', 'success');
            loadData();
        } catch (error) {
            showToast('Kaydetme başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.link_url) {
            showToast('Başlık ve link zorunludur', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingItem) {
                await quickLinksApi.updateItem(editingItem.id, formData);
                showToast('Kart güncellendi', 'success');
            } else {
                await quickLinksApi.createItem({
                    ...formData,
                    order_no: items.length
                });
                showToast('Kart eklendi', 'success');
            }
            resetForm();
            loadData();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: QuickLinksItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            icon: item.icon,
            link_url: item.link_url,
            is_external: item.is_external,
            badge_text: item.badge_text || '',
            badge_color: item.badge_color || 'slate',
            badge_animation: item.badge_animation || 'none',
            is_active: item.is_active,
            order_no: item.order_no
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await quickLinksApi.deleteItem(id);
            showToast('Kart silindi', 'success');
            setDeleteConfirmId(null);
            loadData();
        } catch (error) {
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            await quickLinksApi.toggleActive(id, !currentState);
            showToast('Durum güncellendi', 'success');
            loadData();
        } catch (error) {
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

        try {
            await quickLinksApi.reorderItems(
                newItems.map((item, i) => ({ id: item.id, order_no: i }))
            );
            setItems(newItems);
        } catch (error) {
            showToast('Sıralama başarısız', 'error');
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

        try {
            await quickLinksApi.reorderItems(
                newItems.map((item, i) => ({ id: item.id, order_no: i }))
            );
            setItems(newItems);
        } catch (error) {
            showToast('Sıralama başarısız', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            icon: 'Home',
            link_url: '/',
            is_external: false,
            badge_text: '',
            badge_color: 'slate',
            badge_animation: 'none',
            is_active: true,
            order_no: 0
        });
        setEditingItem(null);
        setIsFormOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* ============================================================= */}
            {/* Sticky Header */}
            {/* ============================================================= */}
            <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pb-4 -mx-6 px-6 pt-2">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kısayol Kareleri</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ana sayfadaki hızlı erişim kartlarını yönetin</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Kart ara..."
                                className="pl-10 pr-4 py-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                            />
                        </div>
                        {/* Refresh */}
                        <button
                            onClick={loadData}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Yenile"
                        >
                            <RefreshCw size={18} />
                        </button>
                        {/* Add New */}
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Yeni Kart Ekle
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================= */}
            {/* Live Preview Section */}
            {/* ============================================================= */}
            <Card title="Canlı Önizleme">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{settingsForm.section_title || 'Başlık'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{settingsForm.section_subtitle || 'Alt başlık'}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.filter(i => i.is_active).map((item) => (
                        <PreviewCard key={item.id} item={item} />
                    ))}
                    {isFormOpen && formData.title && (
                        <PreviewCard item={formData} isNew={!editingItem} />
                    )}
                    {items.filter(i => i.is_active).length === 0 && !isFormOpen && (
                        <div className="col-span-full text-center py-8 text-slate-400">
                            Aktif kart yok
                        </div>
                    )}
                </div>
            </Card>

            {/* ============================================================= */}
            {/* Section Settings */}
            {/* ============================================================= */}
            <Card title="Bölüm Ayarları">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Başlık</label>
                        <input
                            type="text"
                            value={settingsForm.section_title}
                            onChange={(e) => setSettingsForm({ ...settingsForm, section_title: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                            placeholder="En Avantajlı Finansal Fırsatlar"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alt Başlık</label>
                        <input
                            type="text"
                            value={settingsForm.section_subtitle}
                            onChange={(e) => setSettingsForm({ ...settingsForm, section_subtitle: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                            placeholder="Kıyasla, Yakala!"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Toggle
                        checked={settingsForm.is_enabled}
                        onChange={(v) => setSettingsForm({ ...settingsForm, is_enabled: v })}
                        label="Bölümü Göster"
                    />
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-400 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                    >
                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                        Kaydet
                    </button>
                </div>
            </Card>

            {/* ============================================================= */}
            {/* Cards List */}
            {/* ============================================================= */}
            <Card
                title={`Kart Listesi (${items.length})`}
                titleRight={
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-slate-300"
                        >
                            <option value="custom">Özel Sıra</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                            <option value="created">Oluşturma Tarihi</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                }
            >
                <div className="space-y-2">
                    {displayItems.map((item, index) => {
                        const IconComponent = getIcon(item.icon);
                        const actualIndex = items.findIndex(i => i.id === item.id);

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                {/* Drag Handle */}
                                <div className="text-slate-300 dark:text-slate-600 cursor-grab">
                                    <GripVertical size={18} />
                                </div>

                                {/* Icon */}
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900 dark:text-white truncate">{item.title}</h4>
                                        {item.badge_text && (
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                                                {item.badge_text}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                        {item.link_url}
                                        {item.is_external && <ExternalLink size={12} />}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Move buttons (only in custom sort) */}
                                    {sortBy === 'custom' && (
                                        <>
                                            <button
                                                onClick={() => handleMoveUp(actualIndex)}
                                                disabled={actualIndex === 0}
                                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                                                title="Yukarı"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(actualIndex)}
                                                disabled={actualIndex === items.length - 1}
                                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                                                title="Aşağı"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </>
                                    )}
                                    {/* Toggle Active */}
                                    <button
                                        onClick={() => handleToggleActive(item.id, item.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${item.is_active
                                            ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        title={item.is_active ? 'Pasife Al' : 'Aktife Al'}
                                    >
                                        {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    {/* Edit */}
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {/* Delete */}
                                    <button
                                        onClick={() => setDeleteConfirmId(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {displayItems.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus size={24} className="text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kart yok'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {searchQuery ? 'Farklı bir arama deneyin' : 'İlk kartınızı eklemek için yukarıdaki butonu kullanın'}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* ============================================================= */}
            {/* Add/Edit Form Modal */}
            {/* ============================================================= */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingItem ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitItem} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Başlık <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                                        placeholder="Ev Kredisi"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Link URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.link_url}
                                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                                        placeholder="/kampanyalar"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İkon Seç</label>
                                <div className="grid grid-cols-8 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl max-h-32 overflow-y-auto">
                                    {availableIcons.map(({ name, icon: IconComp }) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: name })}
                                            className={`p-2.5 rounded-lg transition-all ${formData.icon === name
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                }`}
                                            title={name}
                                        >
                                            <IconComp size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Metni</label>
                                    <input
                                        type="text"
                                        value={formData.badge_text || ''}
                                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                                        placeholder="Güncel"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Rengi</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'slate', color: 'bg-slate-500' },
                                            { id: 'blue', color: 'bg-blue-500' },
                                            { id: 'green', color: 'bg-green-500' },
                                            { id: 'red', color: 'bg-red-500' },
                                            { id: 'orange', color: 'bg-orange-500' },
                                            { id: 'purple', color: 'bg-purple-500' },
                                        ].map(({ id, color }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, badge_color: id })}
                                                className={`w-8 h-8 rounded-lg ${color} transition-all ${formData.badge_color === id
                                                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                                                        : 'opacity-60 hover:opacity-100'
                                                    }`}
                                                title={id}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Animasyonu</label>
                                    <select
                                        value={formData.badge_animation || 'none'}
                                        onChange={(e) => setFormData({ ...formData, badge_animation: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                                    >
                                        <option value="none">Yok</option>
                                        <option value="pulse">Pulse (Nabız)</option>
                                        <option value="bounce">Bounce (Zıplama)</option>
                                        <option value="ping">Ping (Yayılma)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <Toggle
                                    checked={formData.is_external || false}
                                    onChange={(v) => setFormData({ ...formData, is_external: v })}
                                    label="Harici Link"
                                />
                                <Toggle
                                    checked={formData.is_active !== false}
                                    onChange={(v) => setFormData({ ...formData, is_active: v })}
                                    label="Aktif"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-400 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                                >
                                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingItem ? 'Güncelle' : 'Ekle'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Delete Confirmation Modal */}
            {/* ============================================================= */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <div className="text-center">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Kartı Sil
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Bu kartı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
