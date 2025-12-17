import React, { useEffect, useState } from 'react';
import {
    Home, Car, Calculator, Gift, Building2, CreditCard, Wallet,
    TrendingUp, Shield, FileText, Users, Phone, Mail, HelpCircle,
    Settings, Star, Zap, Award, Target, Percent, PiggyBank,
    Landmark, Briefcase, BarChart3, Plus, Trash2, Edit2,
    ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, Save,
    type LucideIcon
} from 'lucide-react';
import { quickLinksApi, type QuickLinksSettings, type QuickLinksItem, type QuickLinksItemFormData } from '../../services/api/quickLinks';
import { useToast } from '../../hooks/useToast';
import { SubmitButton } from '../../components/admin/SubmitButton';

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

// Preview Card Component
const PreviewCard: React.FC<{ item: QuickLinksItemFormData | QuickLinksItem; isNew?: boolean }> = ({ item, isNew }) => {
    const IconComponent = getIcon(item.icon);
    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center relative ${!('is_active' in item) || item.is_active ? '' : 'opacity-50'}`}>
            {item.badge_text && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] font-bold rounded-full">
                    {item.badge_text}
                </span>
            )}
            {isNew && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded-full">
                    YENİ
                </span>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-xs font-semibold text-gray-800 truncate">{item.title || 'Başlık'}</h4>
        </div>
    );
};

export const QuickLinks: React.FC = () => {
    const [settings, setSettings] = useState<QuickLinksSettings | null>(null);
    const [items, setItems] = useState<QuickLinksItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<QuickLinksItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState<QuickLinksItemFormData>({
        title: '',
        icon: 'Home',
        link_url: '/',
        is_external: false,
        badge_text: '',
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

    const handleSaveSettings = async () => {
        setIsConfirmOpen(false);
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

    const handleConfirmSave = () => {
        setIsConfirmOpen(true);
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
            is_active: item.is_active,
            order_no: item.order_no
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kartı silmek istediğinizden emin misiniz?')) return;

        try {
            await quickLinksApi.deleteItem(id);
            showToast('Kart silindi', 'success');
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
            showToast('Sıra güncellendi', 'success');
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
            showToast('Sıra güncellendi', 'success');
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
            is_active: true,
            order_no: 0
        });
        setEditingItem(null);
        setIsFormOpen(false);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kısayol Kareleri</h1>
                    <p className="text-gray-600 mt-1">Ana sayfadaki hızlı erişim kartlarını yönetin</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
                >
                    <Plus size={20} />
                    <span className="font-semibold">Yeni Kart Ekle</span>
                </button>
            </div>

            {/* Live Preview */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Eye size={18} className="text-blue-600" />
                    <h2 className="font-semibold text-gray-900">Canlı Önizleme</h2>
                </div>

                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{settingsForm.section_title || 'Başlık'}</h3>
                    <p className="text-gray-600">{settingsForm.section_subtitle || 'Alt başlık'}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {items.filter(i => i.is_active).map((item) => (
                        <PreviewCard key={item.id} item={item} />
                    ))}
                    {isFormOpen && formData.title && (
                        <PreviewCard item={formData} isNew={!editingItem} />
                    )}
                </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Bölüm Ayarları</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                        <input
                            type="text"
                            value={settingsForm.section_title}
                            onChange={(e) => setSettingsForm({ ...settingsForm, section_title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="En Avantajlı Finansal Fırsatlar"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alt Başlık</label>
                        <input
                            type="text"
                            value={settingsForm.section_subtitle}
                            onChange={(e) => setSettingsForm({ ...settingsForm, section_subtitle: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Kıyasla, Yakala!"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={settingsForm.is_enabled}
                            onChange={(e) => setSettingsForm({ ...settingsForm, is_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Bölümü Göster</span>
                    </label>
                    <button
                        onClick={handleConfirmSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={16} />
                        Ayarları Kaydet
                    </button>
                </div>
            </div>

            {/* Add/Edit Form Modal */}
            {isFormOpen && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingItem ? '✏️ Kartı Düzenle' : '✨ Yeni Kart Ekle'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    <form onSubmit={handleSubmitItem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Başlık <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ev Kredisi"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="/kampanyalar"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İkon Seç</label>
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 p-4 bg-gray-50 rounded-xl max-h-40 overflow-y-auto">
                                {availableIcons.map(({ name, icon: IconComp }) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: name })}
                                        className={`p-3 rounded-lg transition-all ${formData.icon === name
                                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                                            : 'bg-white text-gray-600 hover:bg-blue-50 border'
                                            }`}
                                        title={name}
                                    >
                                        <IconComp size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Badge (Opsiyonel)</label>
                                <input
                                    type="text"
                                    value={formData.badge_text || ''}
                                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="Yeni"
                                />
                            </div>
                            <div className="flex items-center gap-6 pt-8">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_external || false}
                                        onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 flex items-center gap-1">
                                        <ExternalLink size={14} /> Harici Link
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active !== false}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Aktif</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingItem ? '💾 Güncelle' : '✨ Ekle'}
                            </SubmitButton>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                            >
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">📦 Kart Listesi ({items.length})</h2>
                </div>

                <div className="divide-y">
                    {items.map((item, index) => {
                        const IconComponent = getIcon(item.icon);
                        return (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                                <div className="flex items-center gap-4">
                                    {/* Reorder buttons */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            <ChevronUp size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === items.length - 1}
                                            className={`p-1 rounded ${index === items.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            <ChevronDown size={18} />
                                        </button>
                                    </div>

                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-blue-600" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                            {item.badge_text && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    {item.badge_text}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            {item.link_url}
                                            {item.is_external && <ExternalLink size={12} />}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(item.id, item.is_active)}
                                            className={`p-2 rounded-lg transition ${item.is_active
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                            title={item.is_active ? 'Pasife Al' : 'Aktife Al'}
                                        >
                                            {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kart yok</h3>
                            <p className="text-gray-600">İlk kartınızı eklemek için yukarıdaki butonu kullanın.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {isConfirmOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Save size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Değişiklikleri kaydetmek istiyor musunuz?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Bu işlem ana sayfadaki kısayol alanını güncelleyecek.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
