import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, X, Save, Eye, EyeOff } from 'lucide-react';
import {
    paymentPlanTemplatesApi,
    type PaymentPlanTemplate,
    type PaymentPlanTemplateInput,
} from '../../services/api/paymentPlanTemplates';
import { companiesApi } from '../../services/api/companies';
import type { Company } from '../../types/database';
import { useToast } from '../../hooks/useToast';

type Mode = 'multiplier' | 'manual';

interface FormState {
    name: string;
    description: string;
    company_id: string;
    target_amount: number;
    down_payment_percent: number;
    durations: number[]; // 4-6 elements
    mode: Mode;
    first_installment: number;
    multiplier: number;
    amounts: number[]; // 4-6 elements
    has_balloon: boolean;
    is_active: boolean;
    sort_order: number;
}

const emptyForm: FormState = {
    name: '',
    description: '',
    company_id: '',
    target_amount: 1000000,
    down_payment_percent: 40,
    durations: [6, 7, 6, 5],
    mode: 'multiplier',
    first_installment: 5000,
    multiplier: 2.62,
    amounts: [5000, 13100, 34322, 89924],
    has_balloon: true,
    is_active: true,
    sort_order: 0,
};

const formatTry = (v: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v);

export const PaymentPlanTemplates: React.FC = () => {
    const { showToast } = useToast();

    const [templates, setTemplates] = useState<PaymentPlanTemplate[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<PaymentPlanTemplate | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const [tpls, comps] = await Promise.all([
            paymentPlanTemplatesApi.list(),
            companiesApi.getActiveCompanies(),
        ]);
        setTemplates(tpls);
        setCompanies(comps);
        setLoading(false);
    };

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (tpl: PaymentPlanTemplate) => {
        setEditing(tpl);
        setForm({
            name: tpl.name,
            description: tpl.description || '',
            company_id: tpl.company_id || '',
            target_amount: tpl.target_amount,
            down_payment_percent: tpl.down_payment_percent,
            durations: (tpl.tier_durations && tpl.tier_durations.length >= 4 && tpl.tier_durations.length <= 6) ? tpl.tier_durations : [6, 7, 6, 5],
            mode: tpl.tier_first_installment != null ? 'multiplier' : 'manual',
            first_installment: tpl.tier_first_installment ?? 5000,
            multiplier: tpl.tier_multiplier ?? 2.62,
            amounts: (tpl.tier_amounts && tpl.tier_amounts.length >= 4 && tpl.tier_amounts.length <= 6) ? tpl.tier_amounts : [5000, 13100, 34322, 89924],
            has_balloon: tpl.has_balloon,
            is_active: tpl.is_active,
            sort_order: tpl.sort_order,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            showToast('Şablon adı gerekli', 'warning');
            return;
        }
        setSaving(true);
        try {
            const cnt = form.durations.length;
            const input: PaymentPlanTemplateInput = {
                name: form.name.trim(),
                description: form.description.trim(),
                company_id: form.company_id || null,
                target_amount: Number(form.target_amount) || 0,
                down_payment_percent: Number(form.down_payment_percent) || 0,
                tier_durations: form.durations.slice(0, cnt),
                tier_first_installment: form.mode === 'multiplier' ? Number(form.first_installment) || 0 : null,
                tier_multiplier: form.mode === 'multiplier' ? Number(form.multiplier) || 0 : null,
                tier_amounts: form.mode === 'manual' ? form.amounts.slice(0, cnt) : null,
                has_balloon: form.has_balloon,
                is_active: form.is_active,
                sort_order: Number(form.sort_order) || 0,
            };

            if (editing) {
                await paymentPlanTemplatesApi.update(editing.id, input);
                showToast('Şablon güncellendi', 'success');
            } else {
                await paymentPlanTemplatesApi.create(input);
                showToast('Şablon eklendi', 'success');
            }
            setShowForm(false);
            await load();
        } catch (err) {
            console.error(err);
            showToast('Kayıt hatası', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tpl: PaymentPlanTemplate) => {
        if (!window.confirm(`"${tpl.name}" şablonu silinsin mi?`)) return;
        try {
            await paymentPlanTemplatesApi.remove(tpl.id);
            showToast('Şablon silindi', 'success');
            await load();
        } catch (err) {
            console.error(err);
            showToast('Silme hatası', 'error');
        }
    };

    const toggleActive = async (tpl: PaymentPlanTemplate) => {
        try {
            await paymentPlanTemplatesApi.update(tpl.id, { is_active: !tpl.is_active });
            await load();
        } catch (err) {
            console.error(err);
            showToast('Güncelleme hatası', 'error');
        }
    };

    // Form preview: dönem taksit özeti
    const tierCount = form.durations.length;
    const previewAmounts = form.mode === 'multiplier'
        ? Array.from({ length: tierCount }, (_, i) => form.first_installment * Math.pow(form.multiplier, i))
        : form.amounts.slice(0, tierCount);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kademeli Plan Şablonları</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Firmaların yayınladığı, dönem dönem değişen ödeme planları (4 dönem + opsiyonel balon ödeme).
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow"
                >
                    <Plus size={18} /> Yeni Şablon
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
            ) : templates.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Henüz şablon eklenmemiş. Yukarıdan ilk şablonu ekleyin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(tpl => {
                        const company = companies.find(c => c.id === tpl.company_id);
                        return (
                            <div
                                key={tpl.id}
                                className={`bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all ${tpl.is_active ? 'border-gray-200 dark:border-slate-700' : 'border-gray-200 dark:border-slate-700 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{tpl.name}</h3>
                                        {company && <p className="text-xs text-gray-500">{company.name}</p>}
                                    </div>
                                    <button
                                        onClick={() => toggleActive(tpl)}
                                        title={tpl.is_active ? 'Aktif - tıklayarak gizle' : 'Pasif - tıklayarak yayına al'}
                                        className={`p-1.5 rounded ${tpl.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        {tpl.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 mb-3">
                                    <div>Hedef: <strong>{formatTry(tpl.target_amount)}</strong></div>
                                    <div>Peşinat: <strong>%{tpl.down_payment_percent}</strong></div>
                                    <div>Dönemler: <strong>{tpl.tier_durations.join(' / ')} ay</strong></div>
                                    <div>Balon: <strong>{tpl.has_balloon ? 'Var' : 'Yok'}</strong></div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(tpl)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
                                    >
                                        <Edit size={14} /> Düzenle
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tpl)}
                                        className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editing ? 'Şablonu Düzenle' : 'Yeni Şablon'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Şablon Adı</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="Örn. Albaraka Avantajlı Plan"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Firma</label>
                                    <select
                                        value={form.company_id}
                                        onChange={e => setForm({ ...form, company_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    >
                                        <option value="">— Genel —</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Sıra</label>
                                    <input
                                        type="number"
                                        value={form.sort_order}
                                        onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Hedef Tutar (TL)</label>
                                    <input
                                        type="number"
                                        value={form.target_amount}
                                        onChange={e => setForm({ ...form, target_amount: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Peşinat %</label>
                                    <input
                                        type="number"
                                        step={0.5}
                                        value={form.down_payment_percent}
                                        onChange={e => setForm({ ...form, down_payment_percent: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Açıklama</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Dönem süreleri */}
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Donem Sureleri (Ay)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (form.durations.length <= 4) return;
                                            setForm({
                                                ...form,
                                                durations: form.durations.slice(0, -1),
                                                amounts: form.amounts.slice(0, form.durations.length - 1),
                                            });
                                        }}
                                        disabled={form.durations.length <= 4}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                                    >−</button>
                                    <span className="w-6 text-center text-sm font-bold">{form.durations.length}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (form.durations.length >= 6) return;
                                            const newDur = [...form.durations, 6];
                                            const k = form.multiplier || 2.62;
                                            const t1 = form.first_installment || 5000;
                                            const newAmounts = [...form.amounts];
                                            while (newAmounts.length < newDur.length) {
                                                newAmounts.push(t1 * Math.pow(k, newAmounts.length));
                                            }
                                            setForm({ ...form, durations: newDur, amounts: newAmounts });
                                        }}
                                        disabled={form.durations.length >= 6}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                                    >+</button>
                                </div>
                            </div>
                            <div className={`grid gap-2 ${form.durations.length <= 4 ? 'grid-cols-4' : form.durations.length === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'}`}>
                                    {form.durations.map((_, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min={1}
                                            max={36}
                                            value={form.durations[i]}
                                            onChange={e => {
                                                const next = [...form.durations];
                                                next[i] = Math.max(1, Math.min(36, Number(e.target.value)));
                                                setForm({ ...form, durations: next });
                                            }}
                                            className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-center"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Mode toggle */}
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
                                <button
                                    onClick={() => setForm({ ...form, mode: 'multiplier' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold ${form.mode === 'multiplier' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                                >
                                    Çarpan ile
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, mode: 'manual' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold ${form.mode === 'manual' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                                >
                                    Manuel tutarlar
                                </button>
                            </div>

                            {form.mode === 'multiplier' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">1. Dönem Taksiti (TL)</label>
                                        <input
                                            type="number"
                                            value={form.first_installment}
                                            onChange={e => setForm({ ...form, first_installment: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Dönem Geçiş Çarpanı</label>
                                        <input
                                            type="number"
                                            step={0.01}
                                            min={1}
                                            max={10}
                                            value={form.multiplier}
                                            onChange={e => setForm({ ...form, multiplier: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={`grid gap-2 ${form.durations.length <= 4 ? 'grid-cols-4' : form.durations.length === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'}`}>
                                    {form.durations.map((_, i) => (
                                        <div key={i}>
                                            <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1 block">D{i + 1} (TL)</label>
                                            <input
                                                type="number"
                                                value={form.amounts[i] ?? 0}
                                                onChange={e => {
                                                    const next = [...form.amounts];
                                                    while (next.length <= i) next.push(0);
                                                    next[i] = Number(e.target.value);
                                                    setForm({ ...form, amounts: next });
                                                }}
                                                className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Önizleme */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Önizleme</p>
                                <div className={`grid gap-2 ${tierCount <= 4 ? 'grid-cols-4' : tierCount === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'}`}>
                                    {previewAmounts.map((amt, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 rounded p-2 border border-gray-100 dark:border-slate-700">
                                            <p className="text-[10px] text-gray-500">{i + 1}. Dönem · {form.durations[i]} ay</p>
                                            <p className="text-sm font-bold text-primary-600">{formatTry(Math.round(amt || 0))}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.has_balloon}
                                    onChange={e => setForm({ ...form, has_balloon: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Son ay balon ödeme (kalan bakiye)</span>
                            </label>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Yayında</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-slate-700">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentPlanTemplates;
