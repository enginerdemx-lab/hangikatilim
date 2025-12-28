import React, { useState, useEffect, useMemo } from 'react';
import { homeContentApi } from '../../services/api/homeContent';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import { Search, Plus, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Pencil, Trash2, HelpCircle, LayoutGrid, Building2, X, Check } from 'lucide-react';

type TabType = 'faq' | 'info-cards' | 'logos';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    order_index: number;
}

interface InfoCard {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    order_index: number;
}

interface CompanyLogo {
    id: string;
    company_name: string;
    logo_url: string;
    order_index: number;
}

// Reusable Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005] ${className}`}>
        {title && (
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

// Input Field Component
const InputField: React.FC<{
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}> = ({ label, value, onChange, placeholder, rows }) => (
    <div>
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
        {rows ? (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
            />
        ) : (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
            />
        )}
    </div>
);

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
        {type === 'success' ? <Check size={18} /> : <X size={18} />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1"><X size={14} /></button>
    </div>
);

export const HomeContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('faq');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
    const [logos, setLogos] = useState<CompanyLogo[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Editing states
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [editingCard, setEditingCard] = useState<InfoCard | null>(null);
    const [editingLogo, setEditingLogo] = useState<CompanyLogo | null>(null);
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
    const [addingNew, setAddingNew] = useState(false);

    // Form states
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [cardForm, setCardForm] = useState({ title: '', description: '', icon_name: '' });
    const [logoForm, setLogoForm] = useState({ company_name: '', logo_url: '' });

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'faq') {
                const data = await homeContentApi.getFAQs();
                setFaqs(data || []);
            } else if (activeTab === 'info-cards') {
                const data = await homeContentApi.getInfoCards();
                setInfoCards(data || []);
            } else if (activeTab === 'logos') {
                const data = await homeContentApi.getCompanyLogos();
                setLogos(data || []);
            }
        } catch (err: any) {
            showToast(err.message || 'Veri yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Trigger site refresh
    const handleViewLive = () => {
        // Dispatch event to invalidate any client-side cache
        window.dispatchEvent(new CustomEvent('homeContentUpdated'));
        showToast('İçerik canlıya yansıtıldı', 'success');
        // Open homepage in new tab
        setTimeout(() => window.open('/', '_blank'), 500);
    };

    // Filtered items based on search
    const filteredFaqs = useMemo(() => {
        if (!searchQuery.trim()) return faqs;
        const q = searchQuery.toLowerCase();
        return faqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }, [faqs, searchQuery]);

    const filteredCards = useMemo(() => {
        if (!searchQuery.trim()) return infoCards;
        const q = searchQuery.toLowerCase();
        return infoCards.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }, [infoCards, searchQuery]);

    const filteredLogos = useMemo(() => {
        if (!searchQuery.trim()) return logos;
        const q = searchQuery.toLowerCase();
        return logos.filter(l => l.company_name.toLowerCase().includes(q));
    }, [logos, searchQuery]);

    // FAQ CRUD
    const handleCreateFAQ = async () => {
        if (!faqForm.question || !faqForm.answer) {
            showToast('Soru ve cevap alanları zorunludur', 'error');
            return;
        }
        try {
            await homeContentApi.createFAQ({ question: faqForm.question, answer: faqForm.answer, order_index: faqs.length });
            showToast('FAQ eklendi', 'success');
            setFaqForm({ question: '', answer: '' });
            setAddingNew(false);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleUpdateFAQ = async () => {
        if (!editingFAQ) return;
        try {
            await homeContentApi.updateFAQ(editingFAQ.id, { question: editingFAQ.question, answer: editingFAQ.answer, order_index: editingFAQ.order_index });
            showToast('FAQ güncellendi', 'success');
            setEditingFAQ(null);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (!confirm('Bu FAQ\'yi silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteFAQ(id);
            showToast('FAQ silindi', 'success');
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    // Info Card CRUD
    const handleCreateCard = async () => {
        if (!cardForm.title || !cardForm.description) {
            showToast('Başlık ve açıklama zorunludur', 'error');
            return;
        }
        try {
            await homeContentApi.createInfoCard({ title: cardForm.title, description: cardForm.description, icon_name: cardForm.icon_name, order_index: infoCards.length });
            showToast('Bilgi kartı eklendi', 'success');
            setCardForm({ title: '', description: '', icon_name: '' });
            setAddingNew(false);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleUpdateCard = async () => {
        if (!editingCard) return;
        try {
            await homeContentApi.updateInfoCard(editingCard.id, { title: editingCard.title, description: editingCard.description, icon_name: editingCard.icon_name, order_index: editingCard.order_index });
            showToast('Bilgi kartı güncellendi', 'success');
            setEditingCard(null);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('Bu bilgi kartını silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteInfoCard(id);
            showToast('Bilgi kartı silindi', 'success');
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    // Company Logo CRUD
    const handleCreateLogo = async () => {
        if (!logoForm.company_name || !logoForm.logo_url) {
            showToast('Firma adı ve logo URL zorunludur', 'error');
            return;
        }
        try {
            await homeContentApi.createCompanyLogo({ company_name: logoForm.company_name, logo_url: logoForm.logo_url, order_index: logos.length });
            showToast('Logo eklendi', 'success');
            setLogoForm({ company_name: '', logo_url: '' });
            setAddingNew(false);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleUpdateLogo = async () => {
        if (!editingLogo) return;
        try {
            await homeContentApi.updateCompanyLogo(editingLogo.id, { company_name: editingLogo.company_name, logo_url: editingLogo.logo_url, order_index: editingLogo.order_index });
            showToast('Logo güncellendi', 'success');
            setEditingLogo(null);
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const handleDeleteLogo = async (id: string) => {
        if (!confirm('Bu logoyu silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteCompanyLogo(id);
            showToast('Logo silindi', 'success');
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Hata oluştu', 'error');
        }
    };

    const tabs = [
        { id: 'faq' as TabType, label: 'FAQ', icon: <HelpCircle size={16} />, count: faqs.length },
        { id: 'info-cards' as TabType, label: 'Bilgi Kartları', icon: <LayoutGrid size={16} />, count: infoCards.length },
        { id: 'logos' as TabType, label: 'Şirket Logoları', icon: <Building2 size={16} />, count: logos.length },
    ];

    if (loading && faqs.length === 0 && infoCards.length === 0 && logos.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pb-4 -mx-6 px-6 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ana Sayfa İçerik Yönetimi</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">FAQ, Bilgi Kartları ve Şirket Logolarını yönetin</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                title="Yenile"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handleViewLive}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                            >
                                <ExternalLink size={16} />
                                Siteyi Canlı Gör
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="İçerik ara (FAQ, başlık, açıklama...)"
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Pill Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setAddingNew(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <>
                            {/* Add New FAQ Button/Form */}
                            {!addingNew ? (
                                <button
                                    onClick={() => setAddingNew(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <Plus size={18} />
                                    Yeni FAQ Ekle
                                </button>
                            ) : (
                                <Card title="Yeni FAQ Ekle">
                                    <div className="space-y-4">
                                        <InputField
                                            label="Soru"
                                            value={faqForm.question}
                                            onChange={(v) => setFaqForm({ ...faqForm, question: v })}
                                            placeholder="Soru giriniz..."
                                        />
                                        <InputField
                                            label="Cevap"
                                            value={faqForm.answer}
                                            onChange={(v) => setFaqForm({ ...faqForm, answer: v })}
                                            placeholder="Cevap giriniz..."
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setAddingNew(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                İptal
                                            </button>
                                            <button onClick={handleCreateFAQ} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                                                FAQ Ekle
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* FAQ List - Accordion Style */}
                            {filteredFaqs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <HelpCircle size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p>{searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz FAQ eklenmemiş'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredFaqs.map((faq) => (
                                        <div key={faq.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-200 hover:shadow-md">
                                            {editingFAQ?.id === faq.id ? (
                                                <div className="p-4 space-y-3">
                                                    <InputField value={editingFAQ.question} onChange={(v) => setEditingFAQ({ ...editingFAQ, question: v })} placeholder="Soru" />
                                                    <InputField value={editingFAQ.answer} onChange={(v) => setEditingFAQ({ ...editingFAQ, answer: v })} placeholder="Cevap" rows={3} />
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditingFAQ(null)} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">İptal</button>
                                                        <button onClick={handleUpdateFAQ} className="px-3 py-1.5 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg">Kaydet</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                                        className="w-full flex items-center justify-between p-4 text-left"
                                                    >
                                                        <span className="font-medium text-slate-900 dark:text-white">{faq.question}</span>
                                                        {expandedFAQ === faq.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                                                    </button>
                                                    {expandedFAQ === faq.id && (
                                                        <div className="px-4 pb-4 pt-0">
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{faq.answer}</p>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => setEditingFAQ(faq)} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                                                    <Pencil size={12} /> Düzenle
                                                                </button>
                                                                <button onClick={() => handleDeleteFAQ(faq.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                                    <Trash2 size={12} /> Sil
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Info Cards Tab */}
                    {activeTab === 'info-cards' && (
                        <>
                            {!addingNew ? (
                                <button
                                    onClick={() => setAddingNew(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <Plus size={18} />
                                    Yeni Bilgi Kartı Ekle
                                </button>
                            ) : (
                                <Card title="Yeni Bilgi Kartı Ekle">
                                    <div className="space-y-4">
                                        <InputField label="Başlık" value={cardForm.title} onChange={(v) => setCardForm({ ...cardForm, title: v })} placeholder="Başlık giriniz..." />
                                        <InputField label="Açıklama" value={cardForm.description} onChange={(v) => setCardForm({ ...cardForm, description: v })} placeholder="Açıklama giriniz..." rows={3} />
                                        <InputField label="İkon Adı (opsiyonel)" value={cardForm.icon_name} onChange={(v) => setCardForm({ ...cardForm, icon_name: v })} placeholder="Örn: home, car, building" />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setAddingNew(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">İptal</button>
                                            <button onClick={handleCreateCard} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">Kart Ekle</button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {filteredCards.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <LayoutGrid size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p>{searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz bilgi kartı eklenmemiş'}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredCards.map((card) => (
                                        <div key={card.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                                            {editingCard?.id === card.id ? (
                                                <div className="space-y-3">
                                                    <InputField value={editingCard.title} onChange={(v) => setEditingCard({ ...editingCard, title: v })} placeholder="Başlık" />
                                                    <InputField value={editingCard.description} onChange={(v) => setEditingCard({ ...editingCard, description: v })} placeholder="Açıklama" rows={2} />
                                                    <InputField value={editingCard.icon_name || ''} onChange={(v) => setEditingCard({ ...editingCard, icon_name: v })} placeholder="İkon adı" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingCard(null)} className="flex-1 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">İptal</button>
                                                        <button onClick={handleUpdateCard} className="flex-1 px-3 py-1.5 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg">Kaydet</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {card.icon_name && (
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3 text-slate-500">
                                                            <span className="text-lg">{card.icon_name}</span>
                                                        </div>
                                                    )}
                                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{card.title}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{card.description}</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingCard(card)} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                                            <Pencil size={12} /> Düzenle
                                                        </button>
                                                        <button onClick={() => handleDeleteCard(card.id)} className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                            <Trash2 size={12} /> Sil
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Logos Tab */}
                    {activeTab === 'logos' && (
                        <>
                            {!addingNew ? (
                                <button
                                    onClick={() => setAddingNew(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <Plus size={18} />
                                    Yeni Şirket Logosu Ekle
                                </button>
                            ) : (
                                <Card title="Yeni Şirket Logosu Ekle">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <InputField label="Şirket Adı" value={logoForm.company_name} onChange={(v) => setLogoForm({ ...logoForm, company_name: v })} placeholder="Şirket adı giriniz..." />
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Logo Yükle</label>
                                                <ImageUpload
                                                    folder="logos"
                                                    currentImageUrl={logoForm.logo_url}
                                                    onUploadComplete={(url) => setLogoForm({ ...logoForm, logo_url: url })}
                                                    label=""
                                                    accept="image/*"
                                                    compact
                                                />
                                            </div>
                                            <InputField label="veya Logo URL" value={logoForm.logo_url} onChange={(v) => setLogoForm({ ...logoForm, logo_url: v })} placeholder="https://example.com/logo.png" />
                                            <div className="flex gap-2">
                                                <button onClick={() => setAddingNew(false)} className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">İptal</button>
                                                <button onClick={handleCreateLogo} disabled={!logoForm.company_name || !logoForm.logo_url} className="flex-1 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Logo Ekle</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                                            <p className="text-xs text-slate-500 mb-3">Önizleme</p>
                                            {logoForm.logo_url ? (
                                                <img src={logoForm.logo_url} alt="Önizleme" className="max-w-[120px] max-h-[80px] object-contain" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Görsel Yok</text></svg>'; }} />
                                            ) : (
                                                <div className="w-[120px] h-[80px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">Logo yükleyin</div>
                                            )}
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{logoForm.company_name || 'Şirket Adı'}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {filteredLogos.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Building2 size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p>{searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz logo eklenmemiş'}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredLogos.map((logo) => (
                                        <div key={logo.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                                            {editingLogo?.id === logo.id ? (
                                                <div className="space-y-3">
                                                    <InputField value={editingLogo.company_name} onChange={(v) => setEditingLogo({ ...editingLogo, company_name: v })} placeholder="Şirket adı" />
                                                    <InputField value={editingLogo.logo_url} onChange={(v) => setEditingLogo({ ...editingLogo, logo_url: v })} placeholder="Logo URL" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingLogo(null)} className="flex-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">İptal</button>
                                                        <button onClick={handleUpdateLogo} className="flex-1 px-2 py-1 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded">Kaydet</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="aspect-[3/2] bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                                                        <img src={logo.logo_url} alt={logo.company_name} className="max-w-full max-h-full object-contain p-2" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">Logo</text></svg>'; }} />
                                                    </div>
                                                    <p className="text-sm font-medium text-center text-slate-900 dark:text-white truncate mb-2">{logo.company_name}</p>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setEditingLogo(logo)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                                            <Pencil size={10} />
                                                        </button>
                                                        <button onClick={() => handleDeleteLogo(logo.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};
