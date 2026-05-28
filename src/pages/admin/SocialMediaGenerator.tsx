import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Download, Plus, Trash2, Upload, RefreshCw, X, Image, Table, Grid3X3, Palette, RotateCcw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '../../services/supabaseClient';
import { calculateDeliveryMonth } from '../../utils/deliveryCalculation';

// ===== TYPES =====
interface CalculationRow {
    id: string;
    hedefTutar: string;
    pesinat: string;
    taksit: string;
    vade: string;
    katilimBedeli: string;
    teslimatAyi: string;
}

interface Template {
    id: string;
    created_at: string;
    title: string;
    subtitle: string;
    rows: CalculationRow[];
    settings: any;
}

type GeneratorMode = 'calculation' | 'campaign';
type ImageSize = 'landscape' | 'square' | 'portrait' | 'story';

interface CampaignTableRow {
    amount: number;
}

interface ColorSettings {
    headerBg: string;
    titleBg: string;
    amountColumnBg: string;
    titleColor: string;        // Title text color (black)
    badgeColor: string;        // Single color for all vade badges
}

// ===== CONSTANTS =====
const SIZE_OPTIONS: { key: ImageSize; label: string; width: number; height: number; padding?: string }[] = [
    { key: 'landscape', label: '1600 × 900', width: 1600, height: 900 },
    { key: 'square', label: '1000 × 1000', width: 1000, height: 1000 },
    { key: 'portrait', label: '1080 × 1440', width: 1080, height: 1440 },
    { key: 'story', label: '1080 × 1920', width: 1080, height: 1920, padding: '80px 40px' },
];

const DEFAULT_MONTHS = [
    { name: 'Haziran', vade: 15 },
    { name: 'Temmuz', vade: 17 },
    { name: 'Ağustos', vade: 20 },
    { name: 'Eylül', vade: 22 },
    { name: 'Ekim', vade: 25 },
    { name: 'Kasım', vade: 27 },
    { name: 'Aralık', vade: 30 }
];

const DEFAULT_COLORS: ColorSettings = {
    headerBg: '#115bf8',           // Blue for header & amount column
    titleBg: '#ffffff',            // White background
    amountColumnBg: '#115bf8',     // Same as header
    titleColor: '#000000',         // Black title text
    badgeColor: '#115bf8'          // Single blue color for all vade badges
};

const STORAGE_KEY = 'socialMediaGeneratorColors';

// ===== HELPERS =====
const formatNumber = (value: string): string => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('tr-TR').format(parseInt(num));
};

const formatTL = (val: number) => new Intl.NumberFormat('tr-TR').format(val) + ' TL';

const formatTLCompact = (val: number) => '₺ ' + new Intl.NumberFormat('tr-TR').format(val);

const defaultRow = (): CalculationRow => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    hedefTutar: '',
    pesinat: '',
    taksit: '',
    vade: '',
    katilimBedeli: '',
    teslimatAyi: '',
});

// Load colors from localStorage
const loadSavedColors = (): ColorSettings => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_COLORS, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load saved colors:', e);
    }
    return DEFAULT_COLORS;
};

// Save colors to localStorage
const saveColors = (colors: ColorSettings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    } catch (e) {
        console.error('Failed to save colors:', e);
    }
};

// ===== MAIN COMPONENT =====
export const SocialMediaGenerator: React.FC = () => {
    // Mode Selection
    const [mode, setMode] = useState<GeneratorMode>('campaign');

    // Common State
    const [size, setSize] = useState<ImageSize>('landscape');
    const [downloading, setDownloading] = useState(false);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [useSiteLogo, setUseSiteLogo] = useState(true);
    const [siteLogo, setSiteLogo] = useState<string | null>(null);

    // Color Settings - Load from localStorage
    const [colors, setColors] = useState<ColorSettings>(loadSavedColors);
    const [showColorPanel, setShowColorPanel] = useState(false);

    // Calculation Mode State
    const [title, setTitle] = useState('TASARRUF FİNANSMAN (EVİM SİSTEMLERİ)');
    const [subtitle, setSubtitle] = useState('ÖRNEK ÖDEME TABLOSU');
    const [legalText, setLegalText] = useState('Tablodaki tutarlar tahmini olup, değişiklik gösterebilir.');
    const [rows, setRows] = useState<CalculationRow[]>([]);
    const [autoTarget, setAutoTarget] = useState('');
    const [autoDownPaymentRate, setAutoDownPaymentRate] = useState(40);
    const [autoMonths, setAutoMonths] = useState(24);
    const [autoRate, setAutoRate] = useState(7);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [fontSizePerSize, setFontSizePerSize] = useState<Record<ImageSize, number>>({
        landscape: 24,
        portrait: 22,
        square: 20,
        story: 18
    });

    // Campaign Mode State
    const [campaignTitle, setCampaignTitle] = useState('Peşinatsız Erken Teslimat Kampanyası');
    const [campaignRows, setCampaignRows] = useState<CampaignTableRow[]>([
        { amount: 500000 },
        { amount: 600000 },
        { amount: 750000 },
        { amount: 800000 },
        { amount: 900000 },
        { amount: 1000000 },
        { amount: 1200000 },
        { amount: 1300000 },
        { amount: 1500000 },
        { amount: 1750000 },
        { amount: 2000000 },
        { amount: 2500000 },
        { amount: 3000000 },
        { amount: 4000000 },
        { amount: 5000000 },
        { amount: 7500000 },
        { amount: 10000000 },
        { amount: 20000000 },
    ]);
    const [campaignAmountInput, setCampaignAmountInput] = useState('');

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current font size for selected size
    const currentFontSize = fontSizePerSize[size];
    const setCurrentFontSize = (value: number) => {
        setFontSizePerSize(prev => ({ ...prev, [size]: value }));
    };

    // Save colors whenever they change
    useEffect(() => {
        saveColors(colors);
    }, [colors]);

    useEffect(() => {
        fetchTemplates();
        const loadSiteLogo = async () => {
            try {
                const { data } = await supabase.from('site_settings').select('logo_url').single();
                if (data?.logo_url) setSiteLogo(data.logo_url);
            } catch (err) {
                console.error('Failed to load site logo:', err);
            }
        };
        loadSiteLogo();
    }, []);

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase
                .from('social_media_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) {
            alert('Lütfen şablon için bir isim girin.');
            return;
        }

        try {
            const { error } = await supabase.from('social_media_templates').insert({
                title: templateName,
                subtitle: subtitle,
                rows: rows,
                settings: {
                    title_text: title,
                    size,
                    autoTarget,
                    autoDownPaymentRate
                }
            });

            if (error) throw error;

            alert('Şablon başarıyla kaydedildi.');
            setTemplateName('');
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Şablon kaydedilirken bir hata oluştu.');
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase.from('social_media_templates').delete().eq('id', id);
            if (error) throw error;
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const loadTemplate = (template: Template) => {
        if (!window.confirm('Mevcut tablonuzun üzerine yazılacak. Devam etmek istiyor musunuz?')) return;

        setRows(template.rows || []);
        if (template.settings?.title_text) setTitle(template.settings.title_text);
        if (template.subtitle) setSubtitle(template.subtitle);
        if (template.settings?.size) setSize(template.settings.size);
    };

    const addRow = () => {
        if (rows.length >= 20) {
            alert('Maksimum 20 satır ekleyebilirsiniz.');
            return;
        }
        setRows([...rows, defaultRow()]);
    };

    const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id));

    const updateRow = (id: string, field: keyof CalculationRow, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomLogo(event.target?.result as string);
                setUseSiteLogo(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearCustomLogo = () => {
        setCustomLogo(null);
        setUseSiteLogo(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addCalculatedRow = () => {
        if (rows.length >= 20) {
            alert('Maksimum 20 satır ekleyebilirsiniz.');
            return;
        }

        const targetNum = parseInt(autoTarget.replace(/\D/g, ''));
        if (!targetNum || targetNum <= 0) {
            alert('Lütfen geçerli bir hedef tutar girin.');
            return;
        }

        const downPayment = Math.round(targetNum * (autoDownPaymentRate / 100));
        const financingAmount = targetNum - downPayment;
        const installment = Math.round(financingAmount / autoMonths);
        const fee = Math.round(targetNum * (autoRate / 100));

        const deliveryResult = calculateDeliveryMonth({
            amount: targetNum,
            dpAmount: downPayment,
            monthlyPayment: installment,
            termMonths: autoMonths
        });

        const deliveryDate = deliveryResult.deliveryDateFormatted;

        const newRow: CalculationRow = {
            id: Date.now().toString(),
            hedefTutar: formatTL(targetNum),
            pesinat: `${formatTL(downPayment)} (% ${autoDownPaymentRate})`,
            taksit: formatTL(installment),
            vade: `${autoMonths} Ay`,
            katilimBedeli: `${formatTL(fee)} (% ${autoRate})`,
            teslimatAyi: deliveryDate,
        };

        setRows([...rows, newRow]);
        setAutoTarget('');
    };

    // Campaign Mode Functions
    const addCampaignAmount = () => {
        const val = parseInt(campaignAmountInput.replace(/\D/g, ''));
        if (val) {
            setCampaignRows([...campaignRows, { amount: val }]);
            setCampaignAmountInput('');
        }
    };

    const removeCampaignRow = (index: number) => {
        setCampaignRows(campaignRows.filter((_, i) => i !== index));
    };

    const resetColors = () => {
        setColors(DEFAULT_COLORS);
    };

    const downloadImage = async () => {
        if (!previewRef.current) return;
        setDownloading(true);
        const selectedSize = SIZE_OPTIONS.find(s => s.key === size)!;

        try {
            const dataUrl = await toPng(previewRef.current, {
                width: selectedSize.width,
                height: selectedSize.height,
                quality: 1,
                pixelRatio: 2,
                backgroundColor: colors.titleBg,
            });

            const link = document.createElement('a');
            link.download = `sosyal-medya-${mode}-${selectedSize.width}x${selectedSize.height}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Görsel oluşturulurken bir hata oluştu.');
        } finally {
            setDownloading(false);
        }
    };

    const selectedSize = SIZE_OPTIONS.find(s => s.key === size)!;
    const currentLogo = useSiteLogo ? siteLogo : customLogo;

    // Layout calculations for calculation mode
    const { rowHeight, fontSize, headerHeight, containerPadding, footerHeight } = (() => {
        const rowCount = rows.length || 1;
        const isPortrait = selectedSize.key === 'portrait';
        const headerArea = 100;
        const footerArea = 40;
        const tableHeaderHeight = 45;
        const padY = isPortrait ? 60 : 30;
        const padX = isPortrait ? 30 : 50;
        const availableForRows = selectedSize.height - headerArea - footerArea - (padY * 2) - tableHeaderHeight;
        const calculatedRowHeight = Math.floor(availableForRows / rowCount);
        const autoFontSize = Math.floor(calculatedRowHeight * 0.45);
        const finalFontSize = Math.min(currentFontSize, autoFontSize);

        return {
            rowHeight: calculatedRowHeight,
            fontSize: Math.max(12, finalFontSize),
            headerHeight: tableHeaderHeight,
            containerPadding: `${padY}px ${padX}px`,
            footerHeight: footerArea
        };
    })();

    // ===== RENDER =====
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Image className="text-primary-600" />
                        Sosyal Medya Görseli Oluşturucu
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Hesaplama veya kampanya tablonuzu paylaşım için görsel olarak oluşturun
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Color Settings Toggle */}
                    <button
                        onClick={() => setShowColorPanel(!showColorPanel)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${showColorPanel ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <Palette size={18} />
                        <span className="text-sm font-medium">Renkler</span>
                    </button>

                    <button
                        onClick={downloadImage}
                        disabled={downloading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
                    >
                        {downloading ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
                        {downloading ? 'Oluşturuluyor...' : 'PNG İndir'}
                    </button>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl w-fit">
                <button
                    onClick={() => setMode('campaign')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'campaign'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                >
                    <Grid3X3 size={18} />
                    Kampanya Tablosu
                </button>
                <button
                    onClick={() => setMode('calculation')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'calculation'
                        ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                >
                    <Table size={18} />
                    Hesaplama Tablosu
                </button>
            </div>

            {/* Color Settings Panel */}
            {showColorPanel && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Palette size={18} />
                            Renk Ayarları
                        </h3>
                        <button
                            onClick={resetColors}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <RotateCcw size={14} />
                            Sıfırla
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Arka Plan</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors.titleBg}
                                    onChange={(e) => setColors({ ...colors, titleBg: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={colors.titleBg}
                                    onChange={(e) => setColors({ ...colors, titleBg: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-slate-700 w-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tablo Header</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors.headerBg}
                                    onChange={(e) => setColors({ ...colors, headerBg: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={colors.headerBg}
                                    onChange={(e) => setColors({ ...colors, headerBg: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-slate-700 w-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tutar Kolonu</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors.amountColumnBg}
                                    onChange={(e) => setColors({ ...colors, amountColumnBg: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={colors.amountColumnBg}
                                    onChange={(e) => setColors({ ...colors, amountColumnBg: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-slate-700 w-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Başlık Rengi</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors.titleColor}
                                    onChange={(e) => setColors({ ...colors, titleColor: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={colors.titleColor}
                                    onChange={(e) => setColors({ ...colors, titleColor: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-slate-700 w-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Vade Rozeti Rengi</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={colors.badgeColor}
                                    onChange={(e) => setColors({ ...colors, badgeColor: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={colors.badgeColor}
                                    onChange={(e) => setColors({ ...colors, badgeColor: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 dark:bg-slate-700 w-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">

                    {/* ===== CAMPAIGN MODE FORM ===== */}
                    {mode === 'campaign' && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3">Kampanya Tablosu Ayarları</h2>

                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setUseSiteLogo(true)}
                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${useSiteLogo && !customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        Site Logosu
                                    </button>
                                    <div className="relative">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2 ${customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <Upload size={16} /> Özel Logo
                                        </button>
                                    </div>
                                    {customLogo && (
                                        <button onClick={clearCustomLogo} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Add Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Araç/Konut Tutarı Ekle</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Örn: 500.000"
                                        value={campaignAmountInput}
                                        onChange={(e) => setCampaignAmountInput(formatNumber(e.target.value))}
                                        onKeyDown={(e) => e.key === 'Enter' && addCampaignAmount()}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <button
                                        onClick={addCampaignAmount}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Row List */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tutar Listesi ({campaignRows.length})</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {campaignRows.map((row, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{formatTLCompact(row.amount)}</span>
                                            <button onClick={() => removeCampaignRow(i)} className="text-red-500 hover:text-red-700 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== CALCULATION MODE FORM ===== */}
                    {mode === 'calculation' && (
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3">Hesaplama Tablosu</h2>

                            {/* Auto Calculate Section */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calculator size={18} className="text-green-600" />
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">Otomatik Hesaplama</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Hedef Tutar</label>
                                        <input type="text" placeholder="2.000.000" value={autoTarget}
                                            onChange={(e) => setAutoTarget(formatNumber(e.target.value))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Peşinat (%)</label>
                                        <input type="number" value={autoDownPaymentRate} onChange={(e) => setAutoDownPaymentRate(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vade (Ay)</label>
                                        <input type="number" value={autoMonths} onChange={(e) => setAutoMonths(parseInt(e.target.value) || 24)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Katılım Oranı (%)</label>
                                        <input type="number" step="0.5" value={autoRate} onChange={(e) => setAutoRate(parseFloat(e.target.value) || 7)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                </div>

                                <button onClick={addCalculatedRow} disabled={rows.length >= 20}
                                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Plus size={16} /> Satıra Ekle
                                </button>
                            </div>

                            {/* Logo & Titles */}
                            <div className="space-y-4 pt-4 border-t dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setUseSiteLogo(true)}
                                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium ${useSiteLogo && !customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-slate-600'}`}>
                                            Site Logosu
                                        </button>
                                        <div className="relative">
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            <button onClick={() => fileInputRef.current?.click()}
                                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium flex items-center gap-2 ${customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-slate-600'}`}>
                                                <Upload size={16} /> Özel Logo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Başlık</label>
                                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alt Başlık</label>
                                        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Manual Rows */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {rows.map((row, index) => (
                                    <div key={row.id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Satır {index + 1}</span>
                                            {rows.length > 1 && (
                                                <button onClick={() => removeRow(row.id)} className="text-red-500 hover:text-red-600 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input type="text" placeholder="Hedef Tutar" value={row.hedefTutar}
                                                onChange={(e) => updateRow(row.id, 'hedefTutar', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                            <input type="text" placeholder="Peşinat" value={row.pesinat}
                                                onChange={(e) => updateRow(row.id, 'pesinat', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                            <input type="text" placeholder="Taksit" value={row.taksit}
                                                onChange={(e) => updateRow(row.id, 'taksit', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                            <input type="text" placeholder="Vade" value={row.vade}
                                                onChange={(e) => updateRow(row.id, 'vade', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                            <input type="text" placeholder="Katılım Bedeli" value={row.katilimBedeli}
                                                onChange={(e) => updateRow(row.id, 'katilimBedeli', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                            <input type="text" placeholder="Teslimat Ayı" value={row.teslimatAyi}
                                                onChange={(e) => updateRow(row.id, 'teslimatAyi', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b dark:border-slate-700 pb-3 gap-2">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Önizleme</h2>
                        <div className="flex flex-wrap gap-1">
                            {SIZE_OPTIONS.map(opt => (
                                <button key={opt.key} onClick={() => setSize(opt.key)}
                                    className={`py-1.5 px-2 sm:px-3 rounded-md border text-xs font-medium transition-all ${size === opt.key ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 text-gray-600 dark:text-gray-400'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size Control */}
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Yazı Boyutu</label>
                        <input
                            type="range"
                            min={10}
                            max={40}
                            step={1}
                            value={currentFontSize}
                            onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
                            className="flex-1 h-1.5 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums w-8 text-center">{currentFontSize}px</span>
                    </div>

                    <div className="overflow-auto border border-gray-200 dark:border-slate-600 rounded-xl p-4 bg-gray-100 dark:bg-slate-900">
                        <div style={{
                            transform: `scale(${Math.min(0.45, 550 / selectedSize.width)})`,
                            transformOrigin: 'top left',
                            width: selectedSize.width,
                            height: selectedSize.height,
                        }}>

                            {/* ===== CAMPAIGN TABLE PREVIEW ===== */}
                            {mode === 'campaign' && (
                                <div
                                    ref={previewRef}
                                    style={{
                                        width: selectedSize.width,
                                        height: selectedSize.height,
                                        background: colors.titleBg,
                                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                        padding: selectedSize.padding || '40px 50px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    {/* Header Row: Logo + Title */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                                        {/* Logo */}
                                        <div style={{ flexShrink: 0 }}>
                                            {currentLogo ? (
                                                <img src={currentLogo} alt="Logo" style={{ height: '50px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} crossOrigin="anonymous" />
                                            ) : (
                                                <div style={{ color: colors.titleColor, lineHeight: 1 }}>
                                                    <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px' }}>Katılım</span>
                                                    <span style={{ fontSize: '32px', fontWeight: 400, letterSpacing: '-0.5px' }}>Uzmanı</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: selectedSize.key === 'portrait' ? '36px' : '42px',
                                                fontWeight: 700,
                                                lineHeight: 1.1,
                                            }}>
                                                <span style={{ color: colors.titleColor, fontStyle: 'italic' }}>Peşinatsız</span>
                                                {' '}
                                                <span style={{ color: colors.titleColor, fontStyle: 'italic', textDecoration: 'underline', textDecorationThickness: '3px', textUnderlineOffset: '4px' }}>Erken Teslimat</span>
                                                {' '}
                                                <span style={{ color: colors.titleColor, fontWeight: 700 }}>Kampanyası</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Container */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        {/* Table Header - Rounded Top Corners */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: `120px repeat(${DEFAULT_MONTHS.length}, 1fr)`,
                                            background: colors.headerBg,
                                            borderRadius: '8px 8px 0 0',
                                        }}>
                                            <div style={{
                                                padding: '12px 10px',
                                                textAlign: 'center',
                                                color: 'white',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                borderRight: '1px solid rgba(255,255,255,0.2)'
                                            }}>
                                                Araç/Konut
                                            </div>
                                            {DEFAULT_MONTHS.map((m, i) => (
                                                <div key={m.name} style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'center',
                                                    color: 'white',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    borderRight: i < DEFAULT_MONTHS.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                                }}>
                                                    {m.name}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Table Body */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                                            {campaignRows.map((row, idx) => (
                                                <div key={idx} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: `120px repeat(${DEFAULT_MONTHS.length}, 1fr)`,
                                                    flex: 1,
                                                    minHeight: '32px',
                                                }}>
                                                    {/* Amount Column - Same color as header */}
                                                    <div style={{
                                                        background: colors.headerBg,
                                                        padding: '6px 8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        borderBottom: idx < campaignRows.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                                        borderRight: '1px solid rgba(255,255,255,0.2)',
                                                    }}>
                                                        {formatTLCompact(row.amount)}
                                                    </div>

                                                    {/* Installment Cells - All white background */}
                                                    {DEFAULT_MONTHS.map((m, colIdx) => {
                                                        const installment = Math.round(row.amount / m.vade);
                                                        return (
                                                            <div key={m.name} style={{
                                                                background: '#ffffff',
                                                                padding: '6px 6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#1e3a5f',
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                borderRight: colIdx < DEFAULT_MONTHS.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                                borderBottom: idx < campaignRows.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                            }}>
                                                                {formatTLCompact(installment)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vade Badges Row */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `120px repeat(${DEFAULT_MONTHS.length}, 1fr)`,
                                        marginTop: '15px',
                                    }}>
                                        <div></div>
                                        {DEFAULT_MONTHS.map((m, i) => (
                                            <div key={m.name} style={{
                                                padding: '4px 2px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}>
                                                <div style={{
                                                    background: colors.badgeColor,
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    whiteSpace: 'nowrap',
                                                    letterSpacing: '0.5px',
                                                }}>
                                                    {m.vade} AY VADE
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ===== CALCULATION TABLE PREVIEW ===== */}
                            {mode === 'calculation' && (
                                <div
                                    ref={previewRef}
                                    style={{
                                        width: selectedSize.width,
                                        height: selectedSize.height,
                                        background: '#f3f4f6',
                                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                        padding: containerPadding,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '30px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        padding: containerPadding,
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '25px', gap: '20px' }}>
                                            <div style={{ flexShrink: 0 }}>
                                                {currentLogo ? (
                                                    <img src={currentLogo} alt="Logo" style={{ height: '60px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} crossOrigin="anonymous" />
                                                ) : (
                                                    <div>
                                                        <div style={{ fontSize: '30px', fontWeight: 800, color: '#000', lineHeight: 0.9 }}>Katılım</div>
                                                        <div style={{ fontSize: '30px', fontWeight: 400, color: '#000', lineHeight: 0.9 }}>Uzmanı</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: '2px', height: '50px', background: '#e5e7eb', margin: '0 5px' }}></div>
                                            <div>
                                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'black', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{title}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '2px' }}>
                                                    <div style={{ fontSize: '12px', color: '#666' }}>www.katilimuzmani.com</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 400, color: 'black' }}>{subtitle}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: '0' }}>
                                                {['EV / ARABA', 'PEŞİNAT', 'TAKSİT', 'VADE', 'KATILIM BEDELİ', 'TESLİMAT AYI'].map((header) => (
                                                    <div key={header} style={{ padding: '10px 5px', textAlign: 'center', color: 'black', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                                                        {header}
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ background: '#1d4ed8', borderRadius: '0 0 15px 15px', overflow: 'hidden' }}>
                                                {rows.map((row, index) => (
                                                    <div key={row.id} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(6, 1fr)',
                                                        borderBottom: index < rows.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                                        height: `${rowHeight}px`,
                                                    }}>
                                                        {[row.hedefTutar, row.pesinat, row.taksit, row.vade, row.katilimBedeli, row.teslimatAyi].map((cell, colIndex) => (
                                                            <div key={colIndex} style={{
                                                                padding: '0 5px',
                                                                textAlign: 'center',
                                                                color: 'white',
                                                                fontSize: `${fontSize}px`,
                                                                fontWeight: 700,
                                                                borderRight: colIndex < 5 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {cell || '-'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {legalText && (
                                            <div style={{ marginTop: 'auto', paddingTop: '15px', fontSize: '11px', color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
                                                {legalText}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                        Önizleme küçültülmüş gösterilmektedir. İndirilen görsel {selectedSize.width}×{selectedSize.height} piksel boyutunda olacaktır.
                    </p>

                    {/* Mobile PNG Download Button */}
                    <button
                        onClick={downloadImage}
                        disabled={downloading}
                        className="w-full mt-4 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                İndiriliyor...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                PNG İndir
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialMediaGenerator;
