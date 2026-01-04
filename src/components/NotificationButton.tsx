/**
 * Notification Button Component
 * 
 * Allows users to enable push notifications.
 * Shows different states based on permission status.
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Loader2, Check } from 'lucide-react';
import { requestNotificationPermission, getNotificationStatus } from '../lib/firebase';
import { supabase } from '../services/supabaseClient';

interface NotificationButtonProps {
    variant?: 'icon' | 'full';
    className?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
    variant = 'icon',
    className = '',
}) => {
    const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'granted' | 'default'>('loading');
    const [isRegistering, setIsRegistering] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const currentStatus = getNotificationStatus();
        setStatus(currentStatus === 'supported' ? 'default' : currentStatus);
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const registerToken = async (token: string) => {
        try {
            // Call Supabase Edge Function to register token
            const { data, error } = await supabase.functions.invoke('register-push-token', {
                body: {
                    token,
                    userAgent: navigator.userAgent,
                    platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'web'
                },
            });

            if (error) {
                console.error('[NotificationButton] Registration error:', error);
                throw error;
            }

            console.log('[NotificationButton] Token registered:', data);
            return true;
        } catch (err) {
            console.error('[NotificationButton] Failed to register token:', err);
            return false;
        }
    };

    const handleEnableNotifications = async () => {
        if (status === 'unsupported') {
            showToast('Tarayıcınız bildirimleri desteklemiyor', 'error');
            return;
        }

        if (status === 'denied') {
            showToast('Bildirim izni reddedildi. Tarayıcı ayarlarından izin verin.', 'error');
            return;
        }

        setIsRegistering(true);

        try {
            const token = await requestNotificationPermission();

            if (token) {
                const registered = await registerToken(token);
                if (registered) {
                    setStatus('granted');
                    showToast('Bildirimler başarıyla etkinleştirildi!', 'success');
                } else {
                    showToast('Bildirim kaydı başarısız oldu', 'error');
                }
            } else {
                // Permission was denied or token couldn't be obtained
                const newStatus = getNotificationStatus();
                setStatus(newStatus === 'supported' ? 'default' : newStatus);

                if (newStatus === 'denied') {
                    showToast('Bildirim izni verilmedi', 'error');
                } else {
                    showToast('Bildirimler etkinleştirilemedi', 'error');
                }
            }
        } catch (error) {
            console.error('[NotificationButton] Error:', error);
            showToast('Bir hata oluştu', 'error');
        } finally {
            setIsRegistering(false);
        }
    };

    // Render icon-only variant
    if (variant === 'icon') {
        return (
            <>
                <button
                    onClick={handleEnableNotifications}
                    disabled={isRegistering || status === 'unsupported' || status === 'loading'}
                    className={`relative p-2 rounded-xl transition-all ${status === 'granted'
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                        : status === 'denied'
                            ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        } ${className}`}
                    title={
                        status === 'granted'
                            ? 'Bildirimler açık'
                            : status === 'denied'
                                ? 'Bildirim izni reddedildi'
                                : 'Bildirimleri aç'
                    }
                >
                    {isRegistering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : status === 'granted' ? (
                        <BellRing className="w-5 h-5" />
                    ) : status === 'denied' ? (
                        <BellOff className="w-5 h-5" />
                    ) : (
                        <Bell className="w-5 h-5" />
                    )}
                </button>

                {/* Toast notification */}
                {toast && (
                    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up ${toast.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {toast.type === 'success' ? <Check size={18} /> : <BellOff size={18} />}
                        {toast.message}
                    </div>
                )}
            </>
        );
    }

    // Render full button variant
    return (
        <>
            <button
                onClick={handleEnableNotifications}
                disabled={isRegistering || status === 'unsupported' || status === 'loading' || status === 'granted'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${status === 'granted'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                    : status === 'denied'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    } ${className}`}
            >
                {isRegistering ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Etkinleştiriliyor...
                    </>
                ) : status === 'granted' ? (
                    <>
                        <BellRing className="w-4 h-4" />
                        Bildirimler Açık
                    </>
                ) : status === 'denied' ? (
                    <>
                        <BellOff className="w-4 h-4" />
                        İzin Reddedildi
                    </>
                ) : (
                    <>
                        <Bell className="w-4 h-4" />
                        Bildirimleri Aç
                    </>
                )}
            </button>

            {/* Toast notification */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {toast.type === 'success' ? <Check size={18} /> : <BellOff size={18} />}
                    {toast.message}
                </div>
            )}
        </>
    );
};

export default NotificationButton;
