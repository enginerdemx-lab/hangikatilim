import React, { useState, useEffect } from 'react';
import { homeContentApi } from '../../services/api/homeContent';
import { ImageUpload } from '../../components/admin/ImageUpload';

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

export const HomeContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('faq');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
    const [logos, setLogos] = useState<CompanyLogo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Editing states
    const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
    const [editingCard, setEditingCard] = useState<InfoCard | null>(null);
    const [editingLogo, setEditingLogo] = useState<CompanyLogo | null>(null);

    // Form states
    const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
    const [cardForm, setCardForm] = useState({ title: '', description: '', icon_name: '' });
    const [logoForm, setLogoForm] = useState({ company_name: '', logo_url: '' });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
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
            setError(err.message || 'Veri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const showError = (msg: string) => {
        setError(msg);
        setTimeout(() => setError(''), 5000);
    };

    // FAQ CRUD
    const handleCreateFAQ = async () => {
        if (!faqForm.question || !faqForm.answer) {
            showError('Soru ve cevap alanları zorunludur');
            return;
        }
        try {
            await homeContentApi.createFAQ({
                question: faqForm.question,
                answer: faqForm.answer,
                order_index: faqs.length
            });
            showSuccess('FAQ başarıyla eklendi');
            setFaqForm({ question: '', answer: '' });
            loadData();
        } catch (err: any) {
            showError(err.message || 'FAQ eklenirken hata oluştu');
        }
    };

    const handleUpdateFAQ = async () => {
        if (!editingFAQ) return;
        try {
            await homeContentApi.updateFAQ(editingFAQ.id, {
                question: editingFAQ.question,
                answer: editingFAQ.answer,
                order_index: editingFAQ.order_index
            });
            showSuccess('FAQ başarıyla güncellendi');
            setEditingFAQ(null);
            loadData();
        } catch (err: any) {
            showError(err.message || 'FAQ güncellenirken hata oluştu');
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (!confirm('Bu FAQ\'yi silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteFAQ(id);
            showSuccess('FAQ başarıyla silindi');
            loadData();
        } catch (err: any) {
            showError(err.message || 'FAQ silinirken hata oluştu');
        }
    };

    // Info Card CRUD
    const handleCreateCard = async () => {
        if (!cardForm.title || !cardForm.description) {
            showError('Başlık ve açıklama alanları zorunludur');
            return;
        }
        try {
            await homeContentApi.createInfoCard({
                title: cardForm.title,
                description: cardForm.description,
                icon_name: cardForm.icon_name,
                order_index: infoCards.length
            });
            showSuccess('Bilgi kartı başarıyla eklendi');
            setCardForm({ title: '', description: '', icon_name: '' });
            loadData();
        } catch (err: any) {
            showError(err.message || 'Bilgi kartı eklenirken hata oluştu');
        }
    };

    const handleUpdateCard = async () => {
        if (!editingCard) return;
        try {
            await homeContentApi.updateInfoCard(editingCard.id, {
                title: editingCard.title,
                description: editingCard.description,
                icon_name: editingCard.icon_name,
                order_index: editingCard.order_index
            });
            showSuccess('Bilgi kartı başarıyla güncellendi');
            setEditingCard(null);
            loadData();
        } catch (err: any) {
            showError(err.message || 'Bilgi kartı güncellenirken hata oluştu');
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('Bu bilgi kartını silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteInfoCard(id);
            showSuccess('Bilgi kartı başarıyla silindi');
            loadData();
        } catch (err: any) {
            showError(err.message || 'Bilgi kartı silinirken hata oluştu');
        }
    };

    // Company Logo CRUD
    const handleCreateLogo = async () => {
        if (!logoForm.company_name || !logoForm.logo_url) {
            showError('Firma adı ve logo URL alanları zorunludur');
            return;
        }
        try {
            await homeContentApi.createCompanyLogo({
                company_name: logoForm.company_name,
                logo_url: logoForm.logo_url,
                order_index: logos.length
            });
            showSuccess('Logo başarıyla eklendi');
            setLogoForm({ company_name: '', logo_url: '' });
            loadData();
        } catch (err: any) {
            showError(err.message || 'Logo eklenirken hata oluştu');
        }
    };

    const handleUpdateLogo = async () => {
        if (!editingLogo) return;
        try {
            await homeContentApi.updateCompanyLogo(editingLogo.id, {
                company_name: editingLogo.company_name,
                logo_url: editingLogo.logo_url,
                order_index: editingLogo.order_index
            });
            showSuccess('Logo başarıyla güncellendi');
            setEditingLogo(null);
            loadData();
        } catch (err: any) {
            showError(err.message || 'Logo güncellenirken hata oluştu');
        }
    };

    const handleDeleteLogo = async (id: string) => {
        if (!confirm('Bu logoyu silmek istediğinizden emin misiniz?')) return;
        try {
            await homeContentApi.deleteCompanyLogo(id);
            showSuccess('Logo başarıyla silindi');
            loadData();
        } catch (err: any) {
            showError(err.message || 'Logo silinirken hata oluştu');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ana Sayfa İçerik Yönetimi</h1>
                <p className="text-gray-600">FAQ, Bilgi Kartları ve Şirket Logolarını yönetin</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    ✓ {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    ✗ {error}
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'faq'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        ❓ FAQ
                    </button>
                    <button
                        onClick={() => setActiveTab('info-cards')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'info-cards'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📋 Bilgi Kartları
                    </button>
                    <button
                        onClick={() => setActiveTab('logos')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'logos'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🏢 Şirket Logoları
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Yükleniyor...</p>
                </div>
            ) : (
                <>
                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <div className="space-y-6">
                            {/* Add New FAQ Form */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h2 className="text-lg font-bold mb-4">Yeni FAQ Ekle</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Soru</label>
                                        <input
                                            type="text"
                                            value={faqForm.question}
                                            onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Soru giriniz..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cevap</label>
                                        <textarea
                                            value={faqForm.answer}
                                            onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={4}
                                            placeholder="Cevap giriniz..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateFAQ}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        FAQ Ekle
                                    </button>
                                </div>
                            </div>

                            {/* FAQ List */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold">Mevcut FAQ'ler ({faqs.length})</h2>
                                {faqs.map((faq) => (
                                    <div key={faq.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                        {editingFAQ?.id === faq.id ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editingFAQ.question}
                                                    onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <textarea
                                                    value={editingFAQ.answer}
                                                    onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleUpdateFAQ}
                                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        Kaydet
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingFAQ(null)}
                                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                                    >
                                                        İptal
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900 mb-2">{faq.question}</h3>
                                                        <p className="text-gray-600">{faq.answer}</p>
                                                    </div>
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => setEditingFAQ(faq)}
                                                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteFAQ(faq.id)}
                                                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Cards Tab */}
                    {activeTab === 'info-cards' && (
                        <div className="space-y-6">
                            {/* Add New Card Form */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h2 className="text-lg font-bold mb-4">Yeni Bilgi Kartı Ekle</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                                        <input
                                            type="text"
                                            value={cardForm.title}
                                            onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Başlık giriniz..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                                        <textarea
                                            value={cardForm.description}
                                            onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows={3}
                                            placeholder="Açıklama giriniz..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">İkon Adı (opsiyonel)</label>
                                        <input
                                            type="text"
                                            value={cardForm.icon_name}
                                            onChange={(e) => setCardForm({ ...cardForm, icon_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Örn: home, car, building"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateCard}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Kart Ekle
                                    </button>
                                </div>
                            </div>

                            {/* Cards List */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold">Mevcut Bilgi Kartları ({infoCards.length})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {infoCards.map((card) => (
                                        <div key={card.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                            {editingCard?.id === card.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editingCard.title}
                                                        onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                    <textarea
                                                        value={editingCard.description}
                                                        onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        rows={3}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingCard.icon_name || ''}
                                                        onChange={(e) => setEditingCard({ ...editingCard, icon_name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="İkon adı"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleUpdateCard}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingCard(null)}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-3">
                                                        {card.icon_name && (
                                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                                                                <span className="text-2xl">{card.icon_name}</span>
                                                            </div>
                                                        )}
                                                        <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                                                        <p className="text-sm text-gray-600">{card.description}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingCard(card)}
                                                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCard(card.id)}
                                                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Logos Tab */}
                    {activeTab === 'logos' && (
                        <div className="space-y-6">
                            {/* Add New Logo Form */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h2 className="text-lg font-bold mb-4">Yeni Şirket Logosu Ekle</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left column - Form inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı</label>
                                            <input
                                                type="text"
                                                value={logoForm.company_name}
                                                onChange={(e) => setLogoForm({ ...logoForm, company_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Şirket adı giriniz..."
                                            />
                                        </div>

                                        {/* File Upload Option */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Yükle (Dosya)</label>
                                            <ImageUpload
                                                folder="logos"
                                                currentImageUrl={logoForm.logo_url}
                                                onUploadComplete={(url) => setLogoForm({ ...logoForm, logo_url: url })}
                                                label=""
                                                accept="image/*"
                                            />
                                        </div>

                                        {/* OR divider */}
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white text-gray-500">veya</span>
                                            </div>
                                        </div>

                                        {/* URL Input Option */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (Harici Link)</label>
                                            <input
                                                type="text"
                                                value={logoForm.logo_url}
                                                onChange={(e) => setLogoForm({ ...logoForm, logo_url: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </div>

                                        <button
                                            onClick={handleCreateLogo}
                                            disabled={!logoForm.company_name || !logoForm.logo_url}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Logo Ekle
                                        </button>
                                    </div>

                                    {/* Right column - Live Preview */}
                                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6">
                                        <p className="text-sm font-medium text-gray-500 mb-4">Canlı Önizleme</p>
                                        {logoForm.logo_url ? (
                                            <div className="text-center">
                                                <div className="w-40 h-40 bg-white rounded-lg shadow-sm flex items-center justify-center p-4 mb-3">
                                                    <img
                                                        src={logoForm.logo_url}
                                                        alt="Logo önizleme"
                                                        className="max-w-full max-h-full object-contain"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="12">Görsel Yok</text></svg>';
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">{logoForm.company_name || 'Şirket Adı'}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">Logo yükleyin veya URL girin</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logos List */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold">Mevcut Şirket Logoları ({logos.length})</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {logos.map((logo) => (
                                        <div key={logo.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                            {editingLogo?.id === logo.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editingLogo.company_name}
                                                        onChange={(e) => setEditingLogo({ ...editingLogo, company_name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="Şirket adı"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingLogo.logo_url}
                                                        onChange={(e) => setEditingLogo({ ...editingLogo, logo_url: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="Logo URL"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleUpdateLogo}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingLogo(null)}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="mb-3">
                                                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                                                            <img
                                                                src={logo.logo_url}
                                                                alt={logo.company_name}
                                                                className="max-w-full max-h-full object-contain p-2"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Logo</text></svg>';
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-sm font-medium text-center text-gray-900">{logo.company_name}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingLogo(logo)}
                                                            className="flex-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                                        >
                                                            Düzenle
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLogo(logo.id)}
                                                            className="flex-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            Sil
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
