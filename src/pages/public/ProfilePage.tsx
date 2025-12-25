import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Bell, Shield, FileText, Loader2, Calculator, LogOut,
    ChevronDown, ChevronUp, Camera, Check, X, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api/profileService';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { LegalModal, LegalType } from '../../../components/LegalModal';
import type { UserProfile, NotificationPreferences, UserAgreements } from '../../../types';
import type { SiteSettings } from '../../types/database';

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span className="font-medium">{message}</span>
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (val: boolean) => void; label: string; description?: string }> = ({
    enabled, onChange, label, description
}) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#0855f8]' : 'bg-gray-300 dark:bg-slate-600'
                }`}
        >
            <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
        </button>
    </div>
);

// Avatar Component
const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'lg' }) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const sizeClasses = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-16 h-16 text-xl',
        lg: 'w-24 h-24 text-3xl'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#0855f8] to-[#0645d0] flex items-center justify-center text-white font-bold shadow-lg`}>
            {initials}
        </div>
    );
};

// Profile Completion Progress
const ProfileProgress: React.FC<{ profile: UserProfile | null; email?: string }> = ({ profile, email }) => {
    const calculateProgress = () => {
        let filled = 0;
        let total = 4;

        if (email) filled++;
        if (profile?.full_name) filled++;
        if (profile?.phone) filled++;
        if (profile?.avatar_url) filled++;

        return Math.round((filled / total) * 100);
    };

    const progress = calculateProgress();

    return (
        <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Profil Tamamlanma</span>
                <span className="font-bold text-[#0855f8]">%{progress}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#0855f8] to-[#0645d0] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// Collapsible Card Component (for mobile)
const CollapsibleCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0855f8]/10 rounded-lg text-[#0855f8]">
                        {icon}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 dark:border-slate-700 pt-4 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        loadUserData();
    }, [user, navigate]);

    const loadUserData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [profileData, notifData] = await Promise.all([
                profileService.getProfile(user.id),
                profileService.getNotificationPreferences(user.id),
            ]);
            setProfile(profileData);
            setNotifications(notifData);
        } catch (error) {
            console.error('Load user data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            showToast('Çıkış yapılamadı', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-[#0855f8] mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 sm:py-8">
            <div className="container mx-auto px-4 max-w-2xl">

                {/* Profile Header Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Avatar with Upload */}
                        <div className="relative">
                            {profile?.avatar_url ? (
                                <img
                                    src={`${profile.avatar_url}?t=${new Date().getTime()}`}
                                    alt="Profil Fotoğrafı"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                                />
                            ) : (
                                <Avatar name={profile?.full_name || user?.email || ''} size="lg" />
                            )}
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !user) return;

                                    // 2MB Limit Check
                                    if (file.size > 2 * 1024 * 1024) {
                                        showToast('Dosya boyutu 2MB\'dan küçük olmalıdır.', 'error');
                                        return;
                                    }

                                    try {
                                        showToast('Fotoğraf yükleniyor...', 'success');
                                        await profileService.uploadAvatar(user.id, file);
                                        await loadUserData();
                                        showToast('Profil fotoğrafı güncellendi!', 'success');
                                    } catch (error) {
                                        console.error('Avatar upload error:', error);
                                        showToast('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.', 'error');
                                    }
                                }}
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                            >
                                <Camera size={16} className="text-gray-600 dark:text-gray-400" />
                            </label>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {profile?.full_name || 'Kullanıcı'}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {user?.email}
                            </p>
                            <ProfileProgress profile={profile} email={user?.email} />
                        </div>
                    </div>
                </div>

                {/* Email Verification Warning */}
                {user && !user.email_confirmed_at && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                                E-posta Adresinizi Onaylayın
                            </h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                                Hesabınızı tam olarak kullanabilmek için e-posta adresinizi onaylamanız gerekmektedir.
                                E-postanızı onaylayana kadar hesaplamalarınızı kaydedemezsiniz.
                            </p>
                            <button
                                onClick={async () => {
                                    try {
                                        const { authService } = await import('../../services/authService');
                                        await authService.resendConfirmationEmail(user.email!);
                                        showToast('Onay e-postası tekrar gönderildi!', 'success');
                                    } catch (error) {
                                        showToast('E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.', 'error');
                                    }
                                }}
                                className="text-sm font-medium text-yellow-800 dark:text-yellow-300 underline hover:no-underline"
                            >
                                Onay E-postasını Tekrar Gönder
                            </button>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => navigate('/profil/hesaplamalar')}
                        className="flex items-center justify-center gap-2 bg-[#0855f8] hover:bg-[#0645d0] text-white py-4 px-4 rounded-xl font-bold transition-colors shadow-lg shadow-[#0855f8]/20"
                    >
                        <Calculator size={20} />
                        <span className="hidden sm:inline">Kayıtlı Hesaplamalarım</span>
                        <span className="sm:hidden">Hesaplamalar</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-4 px-4 rounded-xl font-bold transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Çıkış Yap</span>
                    </button>
                </div>

                {/* Settings Cards */}
                <div className="space-y-4">

                    {/* Personal Info Card */}
                    <CollapsibleCard title="Kişisel Bilgiler" icon={<User size={20} />}>
                        <ProfileInfoForm
                            profile={profile}
                            userId={user!.id}
                            onUpdate={loadUserData}
                            showToast={showToast}
                        />
                    </CollapsibleCard>

                    {/* General Info Card - Genel Bilgiler */}
                    <CollapsibleCard title="Genel Bilgiler" icon={<FileText size={20} />}>
                        <GeneralInfoForm
                            profile={profile}
                            userId={user!.id}
                            onUpdate={loadUserData}
                            showToast={showToast}
                        />
                    </CollapsibleCard>

                    {/* Notifications Card */}
                    <CollapsibleCard title="İletişim Tercihleri" icon={<Bell size={20} />}>
                        <NotificationsForm
                            preferences={notifications}
                            userId={user!.id}
                            onUpdate={loadUserData}
                            showToast={showToast}
                        />
                    </CollapsibleCard>

                    {/* Security Card */}
                    <CollapsibleCard title="Güvenlik" icon={<Shield size={20} />}>
                        <SecurityForm showToast={showToast} />
                    </CollapsibleCard>

                    {/* Agreements Card */}
                    <CollapsibleCard title="Sözleşmeler" icon={<FileText size={20} />}>
                        <AgreementsList
                            userId={user!.id}
                        />
                    </CollapsibleCard>

                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// Profile Info Form - Ad Soyad, Cinsiyet, Doğum Tarihi ve Telefon
const ProfileInfoForm: React.FC<{
    profile: UserProfile | null;
    userId: string;
    onUpdate: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ profile, userId, onUpdate, showToast }) => {
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [gender, setGender] = useState((profile as any)?.gender || '');
    const [birthDate, setBirthDate] = useState((profile as any)?.birth_date || '');
    const [saving, setSaving] = useState(false);

    // Sync form state when profile changes
    useEffect(() => {
        setFullName(profile?.full_name || '');
        setPhone(profile?.phone || '');
        setGender((profile as any)?.gender || '');
        setBirthDate((profile as any)?.birth_date || '');
    }, [profile]);

    const genderOptions = [
        { value: '', label: 'Seçiniz' },
        { value: 'erkek', label: 'Erkek' },
        { value: 'kadin', label: 'Kadın' },
        { value: 'belirtmek_istemiyorum', label: 'Belirtmek İstemiyorum' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateProfile(userId, {
                full_name: fullName,
                phone,
                gender,
                birth_date: birthDate || null
            } as any);
            showToast('Profil bilgileri güncellendi!', 'success');
            onUpdate();
        } catch (error) {
            showToast('Profil güncellenemedi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors";

    return (
        <div className="space-y-4">
            {/* Ad Soyad */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ad Soyad
                </label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Adınız Soyadınız"
                />
            </div>

            {/* Cinsiyet */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cinsiyet
                </label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                    {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            {/* Doğum Tarihi */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Doğum Tarihi
                </label>
                <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            {/* Telefon */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                </label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="5XX XXX XX XX"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
                {saving ? 'Kaydediliyor...' : 'Güncelle'}
            </button>
        </div>
    );
};

// Notifications Form
const NotificationsForm: React.FC<{
    preferences: NotificationPreferences | null;
    userId: string;
    onUpdate: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ preferences, userId, onUpdate, showToast }) => {
    const [emailEnabled, setEmailEnabled] = useState(preferences?.email_enabled ?? true);
    const [smsEnabled, setSmsEnabled] = useState(preferences?.sms_enabled ?? false);
    const [marketingAllowed, setMarketingAllowed] = useState(preferences?.marketing_allowed ?? false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateNotificationPreferences(userId, {
                email_enabled: emailEnabled,
                sms_enabled: smsEnabled,
                marketing_allowed: marketingAllowed,
            });
            showToast('Tercihler güncellendi!', 'success');
            onUpdate();
        } catch (error) {
            showToast('Tercihler güncellenemedi', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                <ToggleSwitch
                    enabled={emailEnabled}
                    onChange={setEmailEnabled}
                    label="E-posta Bildirimleri"
                    description="Önemli güncellemeler için"
                />
                <ToggleSwitch
                    enabled={smsEnabled}
                    onChange={setSmsEnabled}
                    label="SMS Bildirimleri"
                    description="Acil durumlar için"
                />
                <ToggleSwitch
                    enabled={marketingAllowed}
                    onChange={setMarketingAllowed}
                    label="Pazarlama İzni"
                    description="Kampanya ve fırsatlar"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
        </div>
    );
};

// Security Form
const SecurityForm: React.FC<{ showToast: (msg: string, type: 'success' | 'error') => void }> = ({ showToast }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const { user, updatePassword, updateEmail } = useAuth();

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            showToast('Yeni şifreler eşleşmiyor', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'error');
            return;
        }

        setUpdatingPassword(true);
        try {
            await updatePassword(newPassword);
            showToast('Şifre başarıyla güncellendi!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            showToast('Şifre güncellenemedi', 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleEmailChange = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            showToast('Geçerli bir e-posta adresi girin', 'error');
            return;
        }

        if (newEmail === user?.email) {
            showToast('Yeni e-posta mevcut e-posta ile aynı olamaz', 'error');
            return;
        }

        setUpdatingEmail(true);
        try {
            await updateEmail(newEmail);
            showToast('Doğrulama e-postası gönderildi! Yeni e-postanızı kontrol edin.', 'success');
            setNewEmail('');
        } catch (error: any) {
            const errorMsg = error.message?.includes('already')
                ? 'Bu e-posta adresi zaten kullanılıyor'
                : 'E-posta güncellenemedi';
            showToast(errorMsg, 'error');
        } finally {
            setUpdatingEmail(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors";

    return (
        <div className="space-y-6">
            {/* Email Change Section */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">E-posta Değiştir</h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mevcut E-posta
                    </label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className={`${inputClass} opacity-60 cursor-not-allowed`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni E-posta
                    </label>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className={inputClass}
                        placeholder="yeni@email.com"
                    />
                </div>
                <button
                    onClick={handleEmailChange}
                    disabled={updatingEmail}
                    className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    {updatingEmail ? 'Gönderiliyor...' : 'E-posta Değiştir'}
                </button>
            </div>

            <hr className="border-gray-200 dark:border-slate-600" />

            {/* Password Change Section */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Şifre Değiştir</h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder="En az 6 karakter"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre Tekrar
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Şifreyi tekrar girin"
                    />
                </div>

                <button
                    onClick={handlePasswordChange}
                    disabled={updatingPassword}
                    className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    {updatingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
            </div>
        </div>
    );
};

// General Info Form - Genel Bilgiler
const GeneralInfoForm: React.FC<{
    profile: UserProfile | null;
    userId: string;
    onUpdate: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ profile, userId, onUpdate, showToast }) => {
    const [educationLevel, setEducationLevel] = useState(profile?.education_level || '');
    const [employmentStatus, setEmploymentStatus] = useState(profile?.employment_status || '');
    const [profession, setProfession] = useState(profile?.profession || '');
    const [workExperience, setWorkExperience] = useState(profile?.work_experience || '');
    const [monthlyIncome, setMonthlyIncome] = useState(profile?.monthly_income || '');
    const [hasRent, setHasRent] = useState(profile?.has_rent || false);
    const [rentAmount, setRentAmount] = useState(profile?.rent_amount?.toString() || '');
    const [preferredFinanceCompany, setPreferredFinanceCompany] = useState(profile?.preferred_finance_company || '');
    const [saving, setSaving] = useState(false);

    // Options
    const educationOptions = [
        { value: '', label: 'Seçiniz' },
        { value: 'ilkokul', label: 'İlkokul' },
        { value: 'ortaokul', label: 'Ortaokul' },
        { value: 'lise', label: 'Lise' },
        { value: 'onlisans', label: 'Önlisans' },
        { value: 'lisans', label: 'Lisans' },
        { value: 'yukseklisans', label: 'Yüksek Lisans' },
        { value: 'doktora', label: 'Doktora' },
    ];

    const employmentOptions = [
        { value: '', label: 'Seçiniz' },
        { value: 'ozel_sektor', label: 'Özel Sektör' },
        { value: 'kamu', label: 'Kamu' },
        { value: 'serbest', label: 'Serbest Meslek' },
        { value: 'emekli', label: 'Emekli' },
        { value: 'ogrenci', label: 'Öğrenci' },
        { value: 'calismiyor', label: 'Çalışmıyor' },
    ];

    const workExperienceOptions = [
        { value: '', label: 'Seçiniz' },
        { value: '0-1', label: '0-1 Yıl' },
        { value: '1-5', label: '1-5 Yıl' },
        { value: '5-10', label: '5-10 Yıl' },
        { value: '10-20', label: '10-20 Yıl' },
        { value: '20+', label: '20+ Yıl' },
    ];

    const incomeOptions = [
        { value: '', label: 'Seçiniz' },
        { value: '0-15000', label: '0 - 15.000 TL' },
        { value: '15000-30000', label: '15.000 - 30.000 TL' },
        { value: '30000-50000', label: '30.000 - 50.000 TL' },
        { value: '50000-75000', label: '50.000 - 75.000 TL' },
        { value: '75000-100000', label: '75.000 - 100.000 TL' },
        { value: '100000+', label: '100.000+ TL' },
    ];

    const financeCompanyOptions = [
        { value: '', label: 'Seçiniz' },
        { value: 'eminevim', label: 'Eminevim' },
        { value: 'katilimevim', label: 'Katılımevim' },
        { value: 'fuzul', label: 'Fuzul' },
        { value: 'birevim', label: 'Birevim' },
        { value: 'sinpas', label: 'Sinpaş Yapı Tasarruf Sandığı' },
        { value: 'emlak_katilim', label: 'Emlak Katılım' },
        { value: 'imece', label: 'İMECE' },
        { value: 'albayrak', label: 'Albayrak Finans' },
        { value: 'iyi_finans', label: 'İyi Finans' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateProfile(userId, {
                education_level: educationLevel || null,
                employment_status: employmentStatus || null,
                profession: profession || null,
                work_experience: workExperience || null,
                monthly_income: monthlyIncome || null,
                has_rent: hasRent,
                rent_amount: rentAmount ? parseInt(rentAmount) : null,
                preferred_finance_company: preferredFinanceCompany || null,
            } as any);
            showToast('Genel bilgiler güncellendi!', 'success');
            onUpdate();
        } catch (error) {
            showToast('Bilgiler güncellenemedi', 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectClass = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors appearance-none cursor-pointer";
    const inputClass = "w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors";

    return (
        <div className="space-y-4">
            {/* Eğitim Durumu */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Eğitim Durumun
                </label>
                <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className={selectClass}>
                    {educationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            {/* Çalışma Durumu */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Çalışma Durumun
                </label>
                <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} className={selectClass}>
                    {employmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            {/* Meslek */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mesleğin
                </label>
                <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className={inputClass}
                    placeholder="Örn: Mühendis, Öğretmen..."
                />
            </div>

            {/* Çalışma Süresi */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Toplam Çalışma Süren
                </label>
                <select value={workExperience} onChange={(e) => setWorkExperience(e.target.value)} className={selectClass}>
                    {workExperienceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            {/* Aylık Gelir */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Aylık Gelirin
                </label>
                <select value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className={selectClass}>
                    {incomeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            {/* Kira */}
            <div>
                <ToggleSwitch
                    enabled={hasRent}
                    onChange={setHasRent}
                    label="Kira Ödüyor musun?"
                    description="Aylık kira giderin var mı?"
                />
            </div>

            {/* Kira Tutarı */}
            {hasRent && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Kira Tutarın (TL)
                    </label>
                    <input
                        type="number"
                        value={rentAmount}
                        onChange={(e) => setRentAmount(e.target.value)}
                        className={inputClass}
                        placeholder="Örn: 15000"
                    />
                </div>
            )}

            {/* Tercih Edilen Tasarruf Finansman Şirketi */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tercih Ettiğin Tasarruf Finansman Şirketi
                </label>
                <select value={preferredFinanceCompany} onChange={(e) => setPreferredFinanceCompany(e.target.value)} className={selectClass}>
                    {financeCompanyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
        </div>
    );
};


// Agreements List Component
const AgreementsList: React.FC<{ userId: string }> = ({ userId }) => {
    const [agreements, setAgreements] = useState<UserAgreements | null>(null);
    const [loading, setLoading] = useState(true);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalModalType, setLegalModalType] = useState<LegalType>('TERMS');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [agreementsData, settingsData] = await Promise.all([
                    profileService.getAgreements(userId),
                    siteSettingsApi.getSettings()
                ]);
                setAgreements(agreementsData);
                setSiteSettings(settingsData);
            } catch (error) {
                console.error('Load agreements error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId]);

    const handleOpenLegal = (type: LegalType) => {
        setLegalModalType(type);
        setLegalModalOpen(true);
    };

    if (loading) return <div className="text-center py-4 text-gray-500">Yükleniyor...</div>;

    if (!agreements) return <div className="text-center py-4 text-gray-500">Sözleşme bilgisi bulunamadı.</div>;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const AgreementItem = ({ label, accepted, date, type }: { label: string, accepted: boolean, date?: string, type: LegalType }) => (
        <button
            onClick={() => handleOpenLegal(type)}
            className="w-full flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg px-2 transition-colors text-left"
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${accepted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {accepted ? <Check size={14} /> : <X size={14} />}
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                    {date && accepted && <p className="text-xs text-gray-500">Onay Tarihi: {formatDate(date)}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {accepted && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        Onaylandı
                    </span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
            </div>
        </button>
    );

    return (
        <>
            <LegalModal
                isOpen={legalModalOpen}
                type={legalModalType}
                onClose={() => setLegalModalOpen(false)}
                onConfirm={() => setLegalModalOpen(false)}
                siteSettings={siteSettings}
            />
            <div className="space-y-1">
                <AgreementItem
                    label="Kullanıcı Sözleşmesi"
                    accepted={agreements.terms_accepted}
                    date={agreements.accepted_at || undefined}
                    type="TERMS"
                />
                <AgreementItem
                    label="Gizlilik Politikası"
                    accepted={agreements.privacy_accepted || agreements.membership_accepted}
                    date={agreements.accepted_at || undefined}
                    type="PRIVACY"
                />
                <AgreementItem
                    label="KVKK Aydınlatma Metni"
                    accepted={agreements.kvkk_accepted}
                    date={agreements.accepted_at || undefined}
                    type="KVKK"
                />
                <AgreementItem
                    label="Açık Rıza Metni"
                    accepted={agreements.open_consent_accepted}
                    date={agreements.accepted_at || undefined}
                    type="CONSENT"
                />
                <AgreementItem
                    label="Ticari Elektronik İleti Onayı"
                    accepted={agreements.commercial_accepted}
                    date={agreements.accepted_at || undefined}
                    type="COMMERCIAL"
                />
            </div>
        </>
    );
};

export default ProfilePage;
