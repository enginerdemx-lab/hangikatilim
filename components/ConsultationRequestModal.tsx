import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Wallet, Shuffle, Zap, Send, CheckCircle, AlertCircle, Check, Headphones, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { LegalModal, LegalType } from './LegalModal';
import { siteSettingsApi } from '../src/services/api/siteSettings';
import { consultationRequestService } from '../src/services/api/consultationRequestService';
import type { SiteSettings } from '../src/types/database';
import { TURKEY_CITIES } from '../src/data/turkeyCities';

const AMOUNT_PRESETS = [500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000];

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  defaultSystemType?: 'CEKILISLI' | 'CEKILISSIZ';
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  amount: string;
  monthlyPayment: string;
  city: string;
  district: string;
  systemType: 'CEKILISLI' | 'CEKILISSIZ' | '';
  consent: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  amount?: string;
  monthlyPayment?: string;
  city?: string;
  district?: string;
  systemType?: string;
  consent?: string;
}

const formatCurrency = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('tr-TR').format(parseInt(digits, 10));
};

export const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({
  isOpen,
  onClose,
  defaultAmount,
  defaultSystemType,
}) => {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    amount: defaultAmount ? new Intl.NumberFormat('tr-TR').format(defaultAmount) : '',
    monthlyPayment: '',
    city: '',
    district: '',
    systemType: defaultSystemType || '',
    consent: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalType>('KVKK');

  useEffect(() => {
    if (isOpen && !siteSettings) {
      siteSettingsApi.getSettings().then((s) => s && setSiteSettings(s)).catch(() => {});
    }
  }, [isOpen, siteSettings]);

  const openLegal = (type: LegalType) => {
    if (type === 'DATA_SHARING' && siteSettings?.data_sharing_url) {
      window.open(siteSettings.data_sharing_url, '_blank', 'noopener,noreferrer');
      return;
    }
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        amount: defaultAmount ? new Intl.NumberFormat('tr-TR').format(defaultAmount) : prev.amount,
        systemType: defaultSystemType || prev.systemType,
      }));
    }
  }, [isOpen, defaultAmount, defaultSystemType]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Ad gerekli';
    if (!form.lastName.trim()) newErrors.lastName = 'Soyad gerekli';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) newErrors.phone = 'Telefon gerekli';
    else if (phoneDigits.length < 10) newErrors.phone = 'Geçersiz telefon';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) newErrors.email = 'E-posta gerekli';
    else if (!emailRegex.test(form.email)) newErrors.email = 'Geçersiz e-posta';
    const amountDigits = form.amount.replace(/\D/g, '');
    if (!amountDigits || parseInt(amountDigits, 10) < 1000) newErrors.amount = 'Tutar girin';
    if (!form.city) newErrors.city = 'İl seçin';
    if (!form.systemType) newErrors.systemType = 'Sistem seçin';
    if (!form.consent) newErrors.consent = 'Onay vermelisiniz';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const result = await consultationRequestService.submit({
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      email: form.email,
      amount: parseInt(form.amount.replace(/\D/g, ''), 10) || 0,
      monthly_payment: form.monthlyPayment ? parseInt(form.monthlyPayment.replace(/\D/g, ''), 10) : null,
      city: form.city || null,
      district: form.district || null,
      system_type: form.systemType as 'CEKILISLI' | 'CEKILISSIZ',
      consent: form.consent,
    });
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'consultation_request_submitted', {
        amount: form.amount.replace(/\D/g, ''),
        system_type: form.systemType,
        success: result.success,
      });
    }
    setSubmitting(false);
    if (result.success) setSubmitted(true);
    else setErrors({ consent: result.error || 'Talep gönderilemedi.' });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      if (submitted) {
        setForm({ firstName: '', lastName: '', phone: '', email: '', amount: '', monthlyPayment: '', city: '', district: '', systemType: '', consent: false });
        setErrors({});
        setSubmitted(false);
      }
    }, 200);
  };

  if (!isOpen) return null;

  // Kompakt input class
  const inp = (hasError?: boolean) =>
    `w-full bg-gray-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900'
        : 'border-gray-200 dark:border-slate-700 focus:border-[#0855f8] focus:ring-[#0855f8]/20'
    }`;
  const inpIcon = (hasError?: boolean) =>
    `w-full bg-gray-50 dark:bg-slate-800 border rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900'
        : 'border-gray-200 dark:border-slate-700 focus:border-[#0855f8] focus:ring-[#0855f8]/20'
    }`;
  const lbl = 'block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[96vh] overflow-y-auto rounded-2xl shadow-2xl bg-white dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (compact) */}
        <div className="relative bg-gradient-to-br from-[#0855f8] to-[#0645d0] px-4 py-3 rounded-t-2xl">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Headphones size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-tight">Ücretsiz Danışmanlık Talebi</h3>
              <p className="text-blue-100 text-[10px] mt-0.5">Size en uygun planı sunalım</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-5">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <CheckCircle size={26} className="text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Talebiniz Alındı!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">Uzmanlarımız en kısa sürede sizinle iletişime geçecektir.</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-lg bg-[#0855f8] hover:bg-[#0645d0] text-white text-xs font-semibold transition-colors"
              >
                Tamam
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              {/* Ad + Soyad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Ad</label>
                  <div className="relative">
                    <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Adınız"
                      className={inpIcon(!!errors.firstName)}
                    />
                  </div>
                  {errors.firstName && <p className="text-[10px] text-red-500 mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className={lbl}>Soyad</label>
                  <div className="relative">
                    <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Soyadınız"
                      className={inpIcon(!!errors.lastName)}
                    />
                  </div>
                  {errors.lastName && <p className="text-[10px] text-red-500 mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              {/* Telefon + E-posta */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Telefon</label>
                  <div className="relative">
                    <Phone size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className={inpIcon(!!errors.phone)}
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <label className={lbl}>E-posta</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inpIcon(!!errors.email)}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
                </div>
              </div>

              {/* İl + İlçe */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>İl</label>
                  <div className="relative">
                    <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
                    <select
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className={`${inpIcon(!!errors.city)} appearance-none`}
                    >
                      <option value="">Seçiniz</option>
                      {TURKEY_CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  {errors.city && <p className="text-[10px] text-red-500 mt-0.5">{errors.city}</p>}
                </div>
                <div>
                  <label className={lbl}>İlçe</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="İlçe (ops.)"
                    className={inp()}
                  />
                </div>
              </div>

              {/* Finansman + Taksit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Finansman Tutarı</label>
                  <div className="flex items-stretch gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(form.amount.replace(/\D/g, ''), 10) || 0;
                        // Mevcut tutardan kucuk olan en buyuk preset'i bul; yoksa en kucuge sar
                        const prev = [...AMOUNT_PRESETS].reverse().find((p) => p < cur) ?? AMOUNT_PRESETS[AMOUNT_PRESETS.length - 1];
                        setForm({ ...form, amount: new Intl.NumberFormat('tr-TR').format(prev) });
                      }}
                      aria-label="Onceki tutar"
                      className="shrink-0 w-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-[#0855f8] hover:text-white hover:border-[#0855f8] transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="relative flex-1 min-w-0">
                      <Wallet size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: formatCurrency(e.target.value) })}
                        placeholder="500.000"
                        className={inpIcon(!!errors.amount) + ' pr-7'}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-500">TL</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(form.amount.replace(/\D/g, ''), 10) || 0;
                        // Mevcut tutardan buyuk olan en kucuk preset'i bul; yoksa en buyuge sar
                        const next = AMOUNT_PRESETS.find((p) => p > cur) ?? AMOUNT_PRESETS[0];
                        setForm({ ...form, amount: new Intl.NumberFormat('tr-TR').format(next) });
                      }}
                      aria-label="Sonraki tutar"
                      className="shrink-0 w-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-[#0855f8] hover:text-white hover:border-[#0855f8] transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  {errors.amount && <p className="text-[10px] text-red-500 mt-0.5">{errors.amount}</p>}
                </div>
                <div>
                  <label className={lbl}>Aylık Taksit <span className="text-gray-400 font-normal">(ops.)</span></label>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.monthlyPayment}
                      onChange={(e) => setForm({ ...form, monthlyPayment: formatCurrency(e.target.value) })}
                      placeholder="10.000"
                      className={inpIcon() + ' pr-9'}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-500">TL/ay</span>
                  </div>
                </div>
              </div>

              {/* Preset chip'ler */}
              <div className="grid grid-cols-5 gap-1">
                {AMOUNT_PRESETS.map((p) => {
                  const current = parseInt(form.amount.replace(/\D/g, ''), 10) || 0;
                  const active = current === p;
                  const label = p >= 1_000_000 ? `${p / 1_000_000}M` : `${p / 1000}K`;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, amount: new Intl.NumberFormat('tr-TR').format(p) })}
                      className={`py-1 rounded-md text-[10px] font-bold border transition-all ${
                        active
                          ? 'bg-[#0855f8] border-[#0855f8] text-white'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-[#0855f8]/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Sistem Türü */}
              <div>
                <label className={lbl}>Sistem Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, systemType: 'CEKILISLI' })}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-semibold border-2 transition-all ${
                      form.systemType === 'CEKILISLI'
                        ? 'bg-[#0855f8] border-[#0855f8] text-white'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-[#0855f8]/40'
                    }`}
                  >
                    <Shuffle size={12} /> Çekilişli
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, systemType: 'CEKILISSIZ' })}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-semibold border-2 transition-all ${
                      form.systemType === 'CEKILISSIZ'
                        ? 'bg-[#0855f8] border-[#0855f8] text-white'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-[#0855f8]/40'
                    }`}
                  >
                    <Zap size={12} /> Çekilişsiz
                  </button>
                </div>
                {errors.systemType && <p className="text-[10px] text-red-500 mt-0.5">{errors.systemType}</p>}
              </div>

              {/* Consent (kompakt) */}
              <label className="flex items-start gap-1.5 cursor-pointer select-none mt-0.5">
                <div className="relative flex items-center mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    form.consent ? 'bg-[#0855f8] border-[#0855f8]' :
                    errors.consent ? 'bg-white dark:bg-slate-800 border-red-400' :
                    'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
                  }`}>
                    <Check size={9} className={`text-white ${form.consent ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight">
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('KVKK'); }} className="font-semibold text-[#0855f8] hover:underline">KVKK</button>
                  {', '}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('CONSENT'); }} className="font-semibold text-[#0855f8] hover:underline">Aydinlatma</button>
                  {' ve '}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLegal('DATA_SHARING'); }} className="font-semibold text-[#0855f8] hover:underline">Veri Paylasimi</button>
                  {' kapsaminda verilerimin islenmesine, paylasilmasina ve iletisime onay veriyorum.'}
                </span>
              </label>
              {errors.consent && <p className="text-[10px] text-red-500">{errors.consent}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-br from-[#0855f8] to-[#0645d0] hover:from-[#0645d0] hover:to-[#053bb0] text-white font-bold text-sm transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <><AlertCircle size={14} className="animate-pulse" /> Gonderiliyor...</>
                ) : (
                  <><Send size={14} /> Talebimi Gonder</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <LegalModal
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
};
