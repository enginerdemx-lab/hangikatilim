import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Download, Plus, Trash2, Upload, RefreshCw, X, Image, Info } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '../../services/supabaseClient';

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

const defaultRow = (): CalculationRow => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    hedefTutar: '',
    pesinat: '',
    taksit: '',
    vade: '',
    katilimBedeli: '',
    teslimatAyi: '',
});

type ImageSize = 'landscape' | 'square' | 'portrait';

const SIZE_OPTIONS: { key: ImageSize; label: string; width: number; height: number }[] = [
    { key: 'landscape', label: '1600 × 900', width: 1600, height: 900 },
    { key: 'square', label: '1000 × 1000', width: 1000, height: 1000 },
    { key: 'portrait', label: '1080 × 1440', width: 1080, height: 1440 },
];

// Format number with Turkish thousand separators
const formatNumber = (value: string): string => {
    const num = value.replace(/\D/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('tr-TR').format(parseInt(num));
};

const formatTL = (val: number) => new Intl.NumberFormat('tr-TR').format(val) + ' TL';

export const SocialMediaGenerator: React.FC = () => {
    const [title, setTitle] = useState('TASARRUF FİNANSMAN (EVİM SİSTEMLERİ)');
    const [subtitle, setSubtitle] = useState('ÖRNEK ÖDEME TABLOSU');
    const [legalText, setLegalText] = useState('Tablodaki tutarlar tahmini olup, değişiklik gösterebilir. Sonuçlar tamamen bilgilendirme amaçlıdır.');
    const [rows, setRows] = useState<CalculationRow[]>([]);
    const [size, setSize] = useState<ImageSize>('landscape');
    const [downloading, setDownloading] = useState(false);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [useSiteLogo, setUseSiteLogo] = useState(true);
    const [siteLogo, setSiteLogo] = useState<string | null>(null);

    // Auto-calculate form state
    const [autoTarget, setAutoTarget] = useState('');
    const [autoDownPaymentRate, setAutoDownPaymentRate] = useState(40);
    const [autoMonths, setAutoMonths] = useState(24);
    const [autoRate, setAutoRate] = useState(7);

    // Template state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Font size control - direct pixel value per size type
    const [fontSizePerSize, setFontSizePerSize] = useState<Record<ImageSize, number>>({
        landscape: 24,
        portrait: 22,
        square: 20
    });

    // Get current font size for selected size
    const currentFontSize = fontSizePerSize[size];
    const setCurrentFontSize = (value: number) => {
        setFontSizePerSize(prev => ({ ...prev, [size]: value }));
    };

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                title: templateName, // Using title column for the template name
                subtitle: subtitle, // Store subtitle just in case
                rows: rows,
                settings: {
                    title_text: title, // Store actual visual title in settings
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

    // Add calculated row to table
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

        // Calculate delivery month based on 40% threshold
        const threshold = targetNum * 0.40;
        const remainingToThreshold = Math.max(0, threshold - downPayment);
        const monthsToReachThreshold = installment > 0 ? Math.ceil(remainingToThreshold / installment) : 0;

        // Minimum 6 months (BDDK Rule - 150 days minimum -> 6th installment) or when 40% is reached
        const deliveryMonthCount = Math.max(6, monthsToReachThreshold);

        const now = new Date();
        now.setMonth(now.getMonth() + deliveryMonthCount);
        const deliveryDate = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

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
                backgroundColor: '#f3f4f6', // Ensure background color is captured
            });

            const link = document.createElement('a');
            link.download = `katilim - uzmani - tablo - ${selectedSize.width}x${selectedSize.height} -${Date.now()}.png`;
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

    const { rowHeight, fontSize, headerHeight, containerPadding, footerHeight } = (() => {
        // Use actual row count for calculation
        const rowCount = rows.length || 1;
        const isPortrait = selectedSize.key === 'portrait';

        // Fixed header and footer areas
        const headerArea = 100; // Logo + title area
        const footerArea = 40; // Legal text area
        const tableHeaderHeight = 45;

        // Padding
        const padY = isPortrait ? 60 : 30;
        const padX = isPortrait ? 30 : 50;

        // Calculate available height for data rows (not header)
        const availableForRows = selectedSize.height - headerArea - footerArea - (padY * 2) - tableHeaderHeight;

        // Each row should take equal space to fill the container perfectly
        const calculatedRowHeight = Math.floor(availableForRows / rowCount);

        // Font size should be roughly half of row height for good readability
        // But also respect the slider value as a maximum
        const autoFontSize = Math.floor(calculatedRowHeight * 0.45); // 45% of row height
        const finalFontSize = Math.min(currentFontSize, autoFontSize);

        console.log('Layout calc:', {
            rowCount,
            availableForRows,
            calculatedRowHeight,
            autoFontSize,
            sliderValue: currentFontSize,
            finalFontSize
        });

        return {
            rowHeight: calculatedRowHeight,
            fontSize: Math.max(12, finalFontSize), // Minimum 12px for readability
            headerHeight: tableHeaderHeight,
            containerPadding: `${padY}px ${padX}px`,
            footerHeight: footerArea
        };
    })();

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
                        Hesaplama tablonuzu paylaşım için görsel olarak oluşturun
                    </p>
                </div>
                <button
                    onClick={downloadImage}
                    disabled={downloading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
                >
                    {downloading ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
                    {downloading ? 'Oluşturuluyor...' : 'PNG İndir'}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">

                    {/* TOP SECTION: Calculation & Rows */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3 mb-4">Hesaplama ve Satırlar</h2>

                        {/* Auto Calculate Section */}
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Calculator size={18} className="text-green-600" />
                                <span className="text-sm font-bold text-gray-800">Otomatik Hesaplama & Ekleme</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-600 mb-1">Hedef Tutar</label>
                                    <input type="text" placeholder="2.000.000" value={autoTarget}
                                        onChange={(e) => setAutoTarget(formatNumber(e.target.value))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Peşinat (%)</label>
                                    <input type="number" value={autoDownPaymentRate} onChange={(e) => setAutoDownPaymentRate(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Vade (Ay)</label>
                                    <input type="number" value={autoMonths} onChange={(e) => setAutoMonths(parseInt(e.target.value) || 24)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-600 mb-1">Katılım Oranı (%)</label>
                                    <input type="number" step="0.5" value={autoRate} onChange={(e) => setAutoRate(parseFloat(e.target.value) || 7)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                                </div>
                            </div>

                            <button onClick={addCalculatedRow} disabled={rows.length >= 20}
                                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                <Plus size={16} /> Satıra Ekle
                            </button>
                        </div>

                        {/* Manual Rows */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">Satırlar ({rows.length}/20)</label>
                                <button onClick={addRow} disabled={rows.length >= 20}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50">
                                    <Plus size={16} /> Boş Satır Ekle
                                </button>
                            </div>


                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {rows.map((row, index) => (
                                    <div key={row.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-500">Satır {index + 1}</span>
                                            {rows.length > 1 && (
                                                <button onClick={() => removeRow(row.id)} className="text-red-500 hover:text-red-600 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input type="text" placeholder="Hedef Tutar" value={row.hedefTutar}
                                                onChange={(e) => updateRow(row.id, 'hedefTutar', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                            <input type="text" placeholder="Peşinat" value={row.pesinat}
                                                onChange={(e) => updateRow(row.id, 'pesinat', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                            <input type="text" placeholder="Taksit" value={row.taksit}
                                                onChange={(e) => updateRow(row.id, 'taksit', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                            <input type="text" placeholder="Vade" value={row.vade}
                                                onChange={(e) => updateRow(row.id, 'vade', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                            <input type="text" placeholder="Katılım Bedeli" value={row.katilimBedeli}
                                                onChange={(e) => updateRow(row.id, 'katilimBedeli', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                            <input type="text" placeholder="Teslimat Ayı" value={row.teslimatAyi}
                                                onChange={(e) => updateRow(row.id, 'teslimatAyi', e.target.value)}
                                                className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Visual Settings */}
                    <div className="border-t pt-6 border-gray-100 dark:border-slate-700">
                        <details className="space-y-5 group" open>
                            <summary className="text-lg font-bold text-gray-800 dark:text-white mb-4 cursor-pointer list-none flex items-center justify-between">
                                <span>Görsel Ayarları</span>
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>

                            <div className="space-y-5 animate-fade-in pt-2">
                                {/* Logo Section */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => setUseSiteLogo(true)}
                                            className={`px - 4 py - 2 rounded - lg border - 2 text - sm font - medium transition - all ${useSiteLogo && !customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'} `}
                                        >
                                            Site Logosu
                                        </button>
                                        <div className="relative">
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`px - 4 py - 2 rounded - lg border - 2 text - sm font - medium transition - all flex items - center gap - 2 ${customLogo ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'} `}
                                            >
                                                <Upload size={16} /> Özel Logo Yükle
                                            </button>
                                        </div>
                                        {customLogo && (
                                            <button onClick={clearCustomLogo} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Title & Subtitle */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Başlık</label>
                                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alt Başlık</label>
                                        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
                                    </div>
                                </div>

                                {/* Legal Text */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yasal Metin (Alt Footer)</label>
                                    <textarea
                                        value={legalText}
                                        onChange={(e) => setLegalText(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                                        placeholder="Örn: Tablodaki tutarlar tahmini olup, değişiklik gösterebilir."
                                    />
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Minimal Saved Templates Footer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                        <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors">
                                <span>Kaydedilen Şablonlar ({templates.length})</span>
                                <span className="text-xs text-primary-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="mt-3 space-y-3 animate-fade-in">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Şablon ismi..."
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                    <button
                                        onClick={saveTemplate}
                                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                                    >
                                        Kaydet
                                    </button>
                                </div>

                                <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {templates.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700 group/item transition-colors">
                                            <div
                                                className="flex-1 cursor-pointer truncate"
                                                onClick={() => loadTemplate(t)}
                                                title="Tıklayarak yükle"
                                            >
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.title}</span>
                                                <span className="text-[10px] text-gray-400 ml-2">{new Date(t.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {templates.length === 0 && <span className="text-xs text-gray-400 text-center block py-1">Kayıtlı şablon yok</span>}
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Önizleme</h2>

                        {/* Size Selector Moved Here */}
                        <div className="flex gap-1">
                            {SIZE_OPTIONS.map(opt => (
                                <button key={opt.key} onClick={() => setSize(opt.key)}
                                    className={`py - 1.5 px - 3 rounded - md border text - xs font - medium transition - all ${size === opt.key ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'} `}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size Control */}
                    {/* Font Size Control - Per Size */}
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            Yazı Boyutu ({size === 'landscape' ? '1600×900' : size === 'portrait' ? '1080×1440' : '1000×1000'}):
                        </span>
                        <input
                            type="range"
                            min="12"
                            max="50"
                            step="1"
                            value={currentFontSize}
                            onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <span className="text-xs font-bold text-primary-600 w-12 text-right">{currentFontSize}px</span>
                    </div>

                    <div className="overflow-auto border border-gray-200 rounded-xl p-4 bg-gray-100">
                        <div style={{
                            transform: `scale(${Math.min(0.45, 550 / selectedSize.width)})`,
                            transformOrigin: 'top left',
                            width: selectedSize.width,
                            height: selectedSize.height,
                        }}>
                            {/* ===== LIGHT THEME DESIGN MATCHING REFERENCE ===== */}
                            <div
                                ref={previewRef}
                                style={{
                                    width: selectedSize.width,
                                    height: selectedSize.height,
                                    background: '#f3f4f6', // Light gray background
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    padding: containerPadding,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {/* White Container Card with Rounded Top */}
                                <div style={{
                                    background: 'white',
                                    borderRadius: '30px', // Uniform rounded corners
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    padding: containerPadding,
                                }}>
                                    {/* Header Section */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        marginBottom: '25px', // Reduced margin
                                        gap: '20px'
                                    }}>
                                        {/* Logo Area */}
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

                                        {/* Vertical Separator */}
                                        <div style={{ width: '2px', height: '50px', background: '#e5e7eb', margin: '0 5px' }}></div>

                                        {/* Title Area */}
                                        <div>
                                            <div style={{
                                                fontSize: '24px',
                                                fontWeight: 900,
                                                color: 'black',
                                                textTransform: 'uppercase',
                                                letterSpacing: '-0.5px'
                                            }}>
                                                {title}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '2px' }}>
                                                <div style={{ fontSize: '12px', color: '#666' }}>www.katilimuzmani.com</div>
                                                <div style={{ fontSize: '18px', fontWeight: 400, color: 'black' }}>{subtitle}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Section */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Table Header - White BG, Black Text */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(6, 1fr)',
                                            marginBottom: '0',
                                        }}>
                                            {['EV / ARABA', 'PEŞİNAT', 'TAKSİT', 'VADE', 'KATILIM BEDELİ', 'TESLİMAT AYI'].map((header, i) => (
                                                <div key={header} style={{
                                                    padding: '10px 5px',
                                                    textAlign: 'center',
                                                    color: 'black',
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                }}>
                                                    {header}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Table Rows - Blue BG, White Text */}
                                        <div style={{
                                            background: '#1d4ed8', // Bright Blue
                                            borderRadius: '0 0 15px 15px', // Rounded bottom
                                            overflow: 'hidden',
                                        }}>
                                            {rows.map((row, index) => (
                                                <div key={row.id} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                                    borderBottom: index < rows.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                                    height: `${rowHeight}px`,
                                                }}>
                                                    {[
                                                        { value: row.hedefTutar },
                                                        { value: row.pesinat },
                                                        { value: row.taksit },
                                                        { value: row.vade },
                                                        { value: row.katilimBedeli },
                                                        { value: row.teslimatAyi },
                                                    ].map((cell, colIndex) => (
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
                                                            {cell.value || '-'}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Legal Text Footer */}
                                    {legalText && (
                                        <div style={{
                                            marginTop: '15px',
                                            fontSize: '10px',
                                            color: '#6b7280',
                                            textAlign: 'center',
                                            fontStyle: 'italic',
                                            borderTop: '1px solid #e5e7eb',
                                            paddingTop: '10px'
                                        }}>
                                            {legalText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Önizleme küçültülmüş gösterilmektedir. İndirilen görsel {selectedSize.width}×{selectedSize.height} piksel boyutunda olacaktır.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SocialMediaGenerator;
