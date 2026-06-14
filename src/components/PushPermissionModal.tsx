
import React, { useState, useEffect } from 'react';
import { Bell, X, CalendarClock, Ban } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const PushPermissionModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkPermissionStatus();
    }, []);

    const syncToken = async () => {
        try {
            const { requestNotificationPermission } = await import('../lib/firebase');
            const token = await requestNotificationPermission();
            if (token) {
                await supabase.functions.invoke('register-push-token', {
                    body: {
                        token,
                        userAgent: navigator.userAgent,
                        platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'web'
                    },
                });
            }
        } catch (error) {
            console.error('Token sync error:', error);
        }
    };

    const checkPermissionStatus = () => {
        // 1. Check native permission
        if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted') {
                syncToken(); // Ensure token is in DB even if granted
                return;
            }
            if (Notification.permission === 'denied') {
                return; // Denied by browser, can't ask
            }
        }

        // 2. Check localStorage logic
        const status = localStorage.getItem('push_permission_status');
        const timestamp = localStorage.getItem('push_permission_timestamp');
        const now = Date.now();

        if (status === 'never') {
            // 30 days cooldown for 'never'
            if (timestamp && now - parseInt(timestamp) < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        if (status === 'later') {
            // 7 days cooldown for 'later'
            if (timestamp && now - parseInt(timestamp) < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // Show modal if we passed checks
        // slight delay to not show immediately on render
        setTimeout(() => setIsOpen(true), 2000);
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            const { requestNotificationPermission } = await import('../lib/firebase');
            const token = await requestNotificationPermission();

            if (token) {
                // Register with Edge Function
                const { error } = await supabase.functions.invoke('register-push-token', {
                    body: {
                        token,
                        userAgent: navigator.userAgent,
                        platform: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'web'
                    },
                });

                if (error) throw error;

                localStorage.setItem('push_permission_status', 'granted');
                setIsOpen(false);
                // Dispatch event or callback if needed
            } else {
                // Permission denied by user in native prompt
                handleNever();
            }
        } catch (err) {
            console.error('Registration failed:', err);
            // alert('Bildirim izni alınırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleLater = () => {
        localStorage.setItem('push_permission_status', 'later');
        localStorage.setItem('push_permission_timestamp', Date.now().toString());
        setIsOpen(false);
    };

    const handleNever = () => {
        localStorage.setItem('push_permission_status', 'never');
        localStorage.setItem('push_permission_timestamp', Date.now().toString());
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 max-w-sm md:bottom-8 md:left-8 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-5">
                    <Bell size={100} />
                </div>

                <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full shrink-0 text-primary-600 dark:text-primary-400">
                        <Bell size={24} />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                Bildirimlere İzin Ver
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Önemli gelişmelerden, fırsatlardan ve duyurulardan anında haberdar olmak ister misiniz?
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                            >
                                {loading ? 'İşleniyor...' : 'İzin Ver'}
                            </button>

                            <button
                                onClick={handleLater}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                title="7 gün sonra sor"
                            >
                                <CalendarClock size={16} />
                            </button>

                            <button
                                onClick={handleNever}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                title="Tekrar sorma"
                            >
                                <Ban size={16} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLater}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
