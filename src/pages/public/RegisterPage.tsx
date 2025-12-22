import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, User, CheckCircle, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isValidName, validateEmailForRegistration } from '../../utils/validation';
import { LegalModal, LegalType } from '../../../components/LegalModal';
import { authService } from '../../services/authService';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { SiteSettings } from '../../types/database';

export const RegisterPage: React.FC = () => {
    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState('');

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Legal Checkboxes State
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        kvkk: false,
        consent: false,
        commercial: false // Optional
    });

    // Legal Modal State
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalModalType, setLegalModalType] = useState<LegalType>('TERMS');
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

    const { user, signup } = useAuth();
    const navigate = useNavigate();

    // Load Site Settings for Legal Text Titles
    useEffect(() => {
        const loadSettings = async () => {
            const data = await siteSettingsApi.getSettings();
            setSiteSettings(data);
        };
        loadSettings();
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 6) return 'Şifre en az 6 karakter olmalıdır.';
        return null;
    };

    const translateError = (message: string): string => {
        const translations: Record<string, string> = {
            'User already registered': 'Bu e-posta adresi zaten kayıtlı.',
            'Email already registered': 'Bu e-posta adresi zaten kayıtlı.',
            'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
            'Invalid email': 'Geçersiz e-posta adresi.',
            'Signup requires a valid password': 'Geçerli bir şifre gereklidir.',
        };
        return translations[message] || message || 'Kayıt olurken bir hata oluştu.';
    };

    const handleOpenLegal = (type: LegalType) => {
        setLegalModalType(type);
        setLegalModalOpen(true);
    };

    const handleLegalConfirm = () => {
        switch (legalModalType) {
            case 'TERMS': setAgreements(prev => ({ ...prev, terms: true })); break;
            case 'PRIVACY': setAgreements(prev => ({ ...prev, privacy: true })); break;
            case 'KVKK': setAgreements(prev => ({ ...prev, kvkk: true })); break;
            case 'CONSENT': setAgreements(prev => ({ ...prev, consent: true })); break;
            case 'COMMERCIAL': setAgreements(prev => ({ ...prev, commercial: true })); break;
        }
        setLegalModalOpen(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 1. Validation
        const nameValidation = isValidName(fullName);
        if (!nameValidation.valid) return setError(nameValidation.error!);

        const emailValidation = validateEmailForRegistration(email);
        if (!emailValidation.valid) return setError(emailValidation.error!);

        const passwordError = validatePassword(password);
        if (passwordError) return setError(passwordError);

        if (password !== confirmPassword) return setError('Şifreler eşleşmiyor.');

        // 2. Legal Checks
        if (!agreements.terms) return setError('Lütfen Kullanıcı Sözleşmesini onaylayın.');
        if (!agreements.privacy) return setError('Lütfen Gizlilik Politikasını onaylayın.');
        if (!agreements.kvkk) return setError('Lütfen KVKK Aydınlatma Metnini onaylayın.');
        if (!agreements.consent) return setError('Lütfen Açık Rıza Metnini onaylayın.');

        setLoading(true);
        try {
            await signup(email, password, fullName, gender);
            setSuccess(true);
        } catch (err: any) {
            setError(translateError(err.message));
        } finally {
            setLoading(false);
        }
    };

    // Success State
    if (success) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Kayıt Başarılı!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            E-posta adresinize doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#0855f8] text-white font-bold rounded-xl"
                        >
                            Giriş Sayfasına Git
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto">
                <LegalModal
                    isOpen={legalModalOpen}
                    type={legalModalType}
                    onClose={() => setLegalModalOpen(false)}
                    onConfirm={handleLegalConfirm}
                    siteSettings={siteSettings}
                />

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Yeni Hesap Oluşturun
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Hesaplamalarınızı kaydetmek için ücretsiz kayıt olun
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Name, Email, Password Fields - Same as before */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Adınız Soyadınız"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-posta Adresi</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="En az 6 karakter"
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Şifre Tekrar</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Şifrenizi tekrar girin"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Legal Checkboxes */}
                        <div className="space-y-3 pt-2">
                            {/* Helper to handle checkbox clicks */}
                            {(() => {
                                const handleCheckboxClick = (e: React.MouseEvent, type: LegalType, checked: boolean, key: keyof typeof agreements) => {
                                    e.preventDefault();
                                    if (checked) {
                                        setAgreements(prev => ({ ...prev, [key]: false }));
                                    } else {
                                        handleOpenLegal(type);
                                    }
                                };

                                return (
                                    <>
                                        {/* Terms */}
                                        <div
                                            className="flex items-start gap-3 cursor-pointer group"
                                            onClick={(e) => handleCheckboxClick(e, 'TERMS', agreements.terms, 'terms')}
                                        >
                                            <div className="relative mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="terms"
                                                    checked={agreements.terms}
                                                    readOnly
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center
                                                    ${agreements.terms
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-gray-300 dark:border-slate-500 group-hover:border-primary-500'
                                                    }`}
                                                >
                                                    {agreements.terms && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                                <span className="font-medium text-primary-600 hover:underline">Kullanıcı Sözleşmesi</span>'ni okudum ve onaylıyorum.
                                            </label>
                                        </div>

                                        {/* Privacy */}
                                        <div
                                            className="flex items-start gap-3 cursor-pointer group"
                                            onClick={(e) => handleCheckboxClick(e, 'PRIVACY', agreements.privacy, 'privacy')}
                                        >
                                            <div className="relative mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="privacy"
                                                    checked={agreements.privacy}
                                                    readOnly
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center
                                                    ${agreements.privacy
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-gray-300 dark:border-slate-500 group-hover:border-primary-500'
                                                    }`}
                                                >
                                                    {agreements.privacy && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                                <span className="font-medium text-primary-600 hover:underline">Gizlilik Politikası</span>'nı okudum ve onaylıyorum.
                                            </label>
                                        </div>

                                        {/* KVKK */}
                                        <div
                                            className="flex items-start gap-3 cursor-pointer group"
                                            onClick={(e) => handleCheckboxClick(e, 'KVKK', agreements.kvkk, 'kvkk')}
                                        >
                                            <div className="relative mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="kvkk"
                                                    checked={agreements.kvkk}
                                                    readOnly
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center
                                                    ${agreements.kvkk
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-gray-300 dark:border-slate-500 group-hover:border-primary-500'
                                                    }`}
                                                >
                                                    {agreements.kvkk && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                                <span className="font-medium text-primary-600 hover:underline">Aydınlatma Metni</span>'ni okudum ve anladım.
                                            </label>
                                        </div>

                                        {/* Consent */}
                                        <div
                                            className="flex items-start gap-3 cursor-pointer group"
                                            onClick={(e) => handleCheckboxClick(e, 'CONSENT', agreements.consent, 'consent')}
                                        >
                                            <div className="relative mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="consent"
                                                    checked={agreements.consent}
                                                    readOnly
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center
                                                    ${agreements.consent
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-gray-300 dark:border-slate-500 group-hover:border-primary-500'
                                                    }`}
                                                >
                                                    {agreements.consent && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                                <span className="font-medium text-primary-600 hover:underline">Açık Rıza Metni</span>'ni okudum ve kişisel verilerimin işlenmesine ve paylaşılmasına onay veriyorum.
                                            </label>
                                        </div>

                                        {/* Commercial (Optional) */}
                                        <div
                                            className="flex items-start gap-3 cursor-pointer group"
                                            onClick={(e) => handleCheckboxClick(e, 'COMMERCIAL', agreements.commercial, 'commercial')}
                                        >
                                            <div className="relative mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="commercial"
                                                    checked={agreements.commercial}
                                                    readOnly
                                                    className="peer sr-only"
                                                />
                                                <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center
                                                    ${agreements.commercial
                                                        ? 'bg-primary-600 border-primary-600'
                                                        : 'border-gray-300 dark:border-slate-500 group-hover:border-primary-500'
                                                    }`}
                                                >
                                                    {agreements.commercial && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                                                <span className="font-medium text-primary-600 hover:underline">Ticari Elektronik İleti Bilgilendirme Metni</span>'ni okudum ve tarafıma ileti gönderilmesini onaylıyorum.
                                            </label>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0855f8] hover:bg-[#0645d0] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Kayıt Ol
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Zaten hesabınız var mı?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                            >
                                Giriş Yap
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
