import React, { useEffect, useState, useMemo } from 'react';
import { calculatorApi, type CalculatorSettingsFormData } from '../../services/api/calculator';
import { useToast } from '../../hooks/useToast';
import type { CalculatorSettings } from '../../types/database';
import { RefreshCw, Save, RotateCcw, AlertCircle, Info } from 'lucide-react';

// Reusable Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({
    children, className = '', hover = false
}) => (
    <div className={`
        rounded-2xl border border-slate-200 dark:border-slate-700 
        bg-white dark:bg-slate-800 p-6 shadow-sm 
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:scale-[1.01]' : ''}
        ${className}
    `}>
        {children}
    </div>
);

// Input Field Component
const InputField: React.FC<{
    label: string;
    value: number | string;
    onChange: (value: string) => void;
    type?: 'text' | 'number';
    suffix?: string;
    placeholder?: string;
    helperText?: string;
    error?: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
}> = ({ label, value, onChange, type = 'text', suffix, placeholder, helperText, error, required, min, max, step }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label} {required && <span className="text-slate-400">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                className={`w-full px-3 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:border-transparent transition-colors ${error
                        ? 'border-amber-400 focus:ring-amber-200 dark:focus:ring-amber-800'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-slate-300 dark:focus:ring-slate-600'
                    } ${suffix ? 'pr-10' : ''}`}
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>
            )}
        </div>
        {helperText && !error && (
            <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
        {error && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
            </p>
        )}
    </div>
);

// Textarea Field Component
const TextareaField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
    rows?: number;
}> = ({ label, value, onChange, placeholder, helperText, rows = 3 }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
        </label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
        />
        {helperText && (
            <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
    </div>
);

export const Calculator: React.FC = () => {
    const [settings, setSettings] = useState<CalculatorSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<CalculatorSettingsFormData>({
        default_amount: 50000,
        min_amount: 10000,
        max_amount: 1000000,
        min_vade: 3,
        max_vade: 36,
        description: '',
        help_text: '',
    });

    const [originalData, setOriginalData] = useState<CalculatorSettingsFormData | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await calculatorApi.getSettings();
            if (data) {
                setSettings(data);
                const formValues: CalculatorSettingsFormData = {
                    default_amount: data.default_amount,
                    min_amount: data.min_amount,
                    max_amount: data.max_amount,
                    min_vade: data.min_vade,
                    max_vade: data.max_vade,
                    description: data.description || '',
                    help_text: data.help_text || '',
                };
                setFormData(formValues);
                setOriginalData(formValues);
            }
        } catch (error) {
            console.error('Failed to load calculator settings:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Check if form has changes
    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(formData) !== JSON.stringify(originalData);
    }, [formData, originalData]);

    // Validation errors
    const errors = useMemo(() => {
        const errs: Record<string, string> = {};
        if (formData.min_amount >= formData.max_amount) {
            errs.min_amount = 'Minimum tutar maksimumdan küçük olmalı';
        }
        if (formData.default_amount < formData.min_amount || formData.default_amount > formData.max_amount) {
            errs.default_amount = 'Varsayılan tutar, min-max aralığında olmalı';
        }
        if (formData.min_vade >= formData.max_vade) {
            errs.min_vade = 'Minimum vade maksimumdan küçük olmalı';
        }
        return errs;
    }, [formData]);

    const hasErrors = Object.keys(errors).length > 0;

    const handleReset = () => {
        if (originalData) {
            setFormData(originalData);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasErrors) return;

        setSaving(true);
        try {
            if (settings?.id) {
                await calculatorApi.updateSettings(settings.id, formData);
            } else {
                await calculatorApi.createSettings(formData);
            }
            showToast('Ayarlar kaydedildi', 'success');
            setOriginalData(formData);
            loadData();
        } catch (error) {
            console.error('Failed to save calculator settings:', error);
            showToast('Kaydetme başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hesaplama Ayarları</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Tasarruf hesaplayıcısı için varsayılan değerleri yönetin
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Geri Al"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                        title="Yenile"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !hasChanges || hasErrors}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white dark:text-slate-900 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <><RefreshCw size={16} className="animate-spin" /> Kaydediliyor...</>
                        ) : (
                            <><Save size={16} /> Ayarları Kaydet</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Settings Cards */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Amount Settings Card */}
                    <Card>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Tutar Ayarları</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <InputField
                                label="Varsayılan Tutar"
                                value={formData.default_amount}
                                onChange={(v) => setFormData({ ...formData, default_amount: parseInt(v) || 0 })}
                                type="number"
                                suffix="₺"
                                required
                                step={1000}
                                error={errors.default_amount}
                                helperText="Hesaplayıcı açıldığında görünecek"
                            />
                            <InputField
                                label="Minimum Tutar"
                                value={formData.min_amount}
                                onChange={(v) => setFormData({ ...formData, min_amount: parseInt(v) || 0 })}
                                type="number"
                                suffix="₺"
                                required
                                step={1000}
                                error={errors.min_amount}
                            />
                            <InputField
                                label="Maksimum Tutar"
                                value={formData.max_amount}
                                onChange={(v) => setFormData({ ...formData, max_amount: parseInt(v) || 0 })}
                                type="number"
                                suffix="₺"
                                required
                                step={1000}
                            />
                        </div>
                    </Card>

                    {/* Term Settings Card */}
                    <Card>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Vade Ayarları</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Minimum Vade"
                                value={formData.min_vade}
                                onChange={(v) => setFormData({ ...formData, min_vade: parseInt(v) || 0 })}
                                type="number"
                                suffix="ay"
                                required
                                min={1}
                                error={errors.min_vade}
                            />
                            <InputField
                                label="Maksimum Vade"
                                value={formData.max_vade}
                                onChange={(v) => setFormData({ ...formData, max_vade: parseInt(v) || 0 })}
                                type="number"
                                suffix="ay"
                                required
                                min={1}
                            />
                        </div>
                    </Card>

                    {/* Text Settings Card */}
                    <Card>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Açıklama Metinleri</h3>
                        <div className="space-y-4">
                            <TextareaField
                                label="Açıklama"
                                value={formData.description || ''}
                                onChange={(v) => setFormData({ ...formData, description: v })}
                                placeholder="Hesaplayıcı için genel açıklama..."
                                helperText="Hesaplayıcı başlığının altında görünür"
                            />
                            <TextareaField
                                label="Yardım Metni"
                                value={formData.help_text || ''}
                                onChange={(v) => setFormData({ ...formData, help_text: v })}
                                placeholder="Kullanıcılar için yardım metni..."
                                helperText="Yardım ikonuna tıklandığında gösterilir"
                            />
                        </div>
                    </Card>
                </div>

                {/* Right Column - Preview */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={18} className="text-slate-500" />
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Önizleme</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tutar Aralığı</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formData.min_amount.toLocaleString('tr-TR')} - {formData.max_amount.toLocaleString('tr-TR')} ₺
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Varsayılan</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formData.default_amount.toLocaleString('tr-TR')} ₺
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Vade Aralığı</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {formData.min_vade} - {formData.max_vade} ay
                                </span>
                            </div>
                            {formData.description && (
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 mb-1">Açıklama:</p>
                                    <p className="text-slate-700 dark:text-slate-300 text-xs">{formData.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Sync Info */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                💡 Bu ayarlar kaydedildiğinde otomatik olarak site tarafındaki hesaplayıcıya yansır.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </form>
    );
};
