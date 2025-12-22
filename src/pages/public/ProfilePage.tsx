import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Bell, Shield, FileText, Loader2, Calculator, LogOut,
    ChevronDown, ChevronUp, Camera, Check, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api/profileService';
import type { UserProfile, NotificationPreferences } from '../../../types';

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
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar name={profile?.full_name || user?.email || ''} size="lg" />
                            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-700 rounded-full shadow-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                                <Camera size={16} className="text-gray-600 dark:text-gray-400" />
                            </button>
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
                    <CollapsibleCard title="Kişisel Bilgiler" icon={<User size={20} />} defaultOpen={true}>
                        <ProfileInfoForm
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
                        <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Sözleşme kabul sistemi yakında eklenecektir.
                        </div>
                    </CollapsibleCard>

                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// Profile Info Form
const ProfileInfoForm: React.FC<{
    profile: UserProfile | null;
    userId: string;
    onUpdate: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ profile, userId, onUpdate, showToast }) => {
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateProfile(userId, { full_name: fullName, phone });
            showToast('Profil bilgileri güncellendi!', 'success');
            onUpdate();
        } catch (error) {
            showToast('Profil güncellenemedi', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ad Soyad
                </label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors"
                    placeholder="Adınız Soyadınız"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                </label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors"
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
    const [updating, setUpdating] = useState(false);
    const { updatePassword } = useAuth();

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            showToast('Yeni şifreler eşleşmiyor', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'error');
            return;
        }

        setUpdating(true);
        try {
            await updatePassword(newPassword);
            showToast('Şifre başarıyla güncellendi!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            showToast('Şifre güncellenemedi', 'error');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Yeni Şifre
                </label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors"
                    placeholder="En az 6 karakter"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Yeni Şifre Tekrar
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#0855f8] outline-none text-gray-900 dark:text-white transition-colors"
                    placeholder="Şifreyi tekrar girin"
                />
            </div>

            <button
                onClick={handlePasswordChange}
                disabled={updating}
                className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
                {updating ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
        </div>
    );
};

export default ProfilePage;
