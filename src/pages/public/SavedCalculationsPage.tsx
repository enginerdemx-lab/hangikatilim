import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Trash2, Home, Car, Building2, Layers, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calculationService } from '../../services/api/calculationService';
import type { SavedCalculationData, CalculationType } from '../../../types';

export const SavedCalculationsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [calculations, setCalculations] = useState<SavedCalculationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<CalculationType>('tumu');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        loadCalculations();
    }, [user, filter, navigate]);

    const loadCalculations = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await calculationService.getUserCalculations(user.id, filter);
            setCalculations(data);
        } catch (error) {
            console.error('Load calculations error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (calculation: SavedCalculationData) => {
        try {
            const pdfBlob = await calculationService.downloadPDF(calculation.pdf_path);
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Hesaplama_${new Date(calculation.created_at).toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download PDF error:', error);
            alert('PDF indirilemedi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu hesaplamayı silmek istediğinizden emin misiniz?')) return;

        try {
            await calculationService.deleteCalculation(id);
            alert('Hesaplama silindi');
            loadCalculations();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Hesaplama silinemedi');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'ev': return 'Ev';
            case 'arac': return 'Araç';
            case 'isyeri': return 'İş Yeri';
            case 'tumu': return 'Tümü';
            default: return type;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'ev': return Home;
            case 'arac': return Car;
            case 'isyeri': return Building2;
            case 'tumu': return Layers;
            default: return FileText;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'ev': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'arac': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'isyeri': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'tumu': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Kayıtlı Hesaplamalarım
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Toplam {calculations.length} hesaplama
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/profil')}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
                        >
                            ← Profilime Dön
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 flex-wrap">
                        {(['tumu', 'ev', 'arac', 'isyeri'] as CalculationType[]).map((type) => {
                            const Icon = getTypeIcon(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${filter === type
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {getTypeLabel(type)}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Calculations List */}
                {calculations.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Henüz kayıtlı hesaplama yok
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Ana sayfada hesaplama yapıp "Kaydet" butonuna tıklayarak başlayın
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Hesaplama Yap
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {calculations.map((calc) => {
                            const Icon = getTypeIcon(calc.type);
                            const isExpanded = expandedId === calc.id;

                            return (
                                <div
                                    key={calc.id}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${getTypeColor(calc.type)}`}>
                                                        <Icon size={14} />
                                                        {getTypeLabel(calc.type)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar size={14} />
                                                        {new Date(calc.created_at).toLocaleDateString('tr-TR')}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Hedef Tutar</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {formatMoney(calc.data_json.params.targetAmount)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Vade</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {calc.data_json.result.schedule.length} Ay
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Aylık Taksit</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {formatMoney(calc.data_json.result.monthlyInstallment)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Ödeme</p>
                                                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                            {formatMoney(calc.data_json.result.totalPayable)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Details Toggle */}
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : calc.id)}
                                                    className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                                                >
                                                    <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    {isExpanded ? 'Detayları Gizle' : 'Detayları Göster'}
                                                </button>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => handleDownloadPDF(calc)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap"
                                                >
                                                    <Download size={16} />
                                                    PDF İndir
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(calc.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap"
                                                >
                                                    <Trash2 size={16} />
                                                    Sil
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Sistem</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.data_json.params.systemType === 'LOTTERY' ? 'Çekilişli' : 'Çekilişsiz'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Peşinat</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {formatMoney(calc.data_json.params.downPayment)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Katılım Payı</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            %{calc.data_json.params.participationRate.toFixed(1)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Teslimat Tarihi</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.data_json.result.deliveryDate}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">Tamamlanma</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {calc.data_json.result.completionDate}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">İlk Ödeme</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {formatMoney(calc.data_json.result.initialPayment)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedCalculationsPage;
