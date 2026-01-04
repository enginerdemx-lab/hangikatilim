/**
 * Admin Push Notifications Page
 * 
 * Allows admins to send push notifications to all subscribers.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, Loader2, AlertCircle, CheckCircle, Link as LinkIcon, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface PushStats {
    total: number;
    enabled: number;
}

export const PushNotifications: React.FC = () => {
    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');

    // UI state
    const [isSending, setIsSending] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [stats, setStats] = useState<PushStats>({ total: 0, enabled: 0 });
    const [result, setResult] = useState<{ success: boolean; message: string; sentCount?: number; errorCount?: number } | null>(null);

    // Load subscriber stats
    const loadStats = async () => {
        setIsLoadingStats(true);
        try {
            const { data, error, count } = await supabase
                .from('push_subscriptions')
                .select('*', { count: 'exact' });

            if (error) throw error;

            const enabledCount = data?.filter(s => s.is_enabled).length || 0;
            setStats({
                total: count || 0,
                enabled: enabledCount,
            });
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setIsLoadingStats(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        if (!title.trim() || !body.trim()) {
            setResult({ success: false, message: 'Başlık ve mesaj zorunludur.' });
            return;
        }

        setIsSending(true);

        try {
            const { data, error } = await supabase.functions.invoke('send-push', {
                body: {
                    title: title.trim(),
                    body: body.trim(),
                    url: url.trim() || undefined,
                    image: image.trim() || undefined,
                },
            });

            if (error) {
                console.error('Send push error:', error);
                setResult({
                    success: false,
                    message: `Hata: ${error.message}`,
                });
                return;
            }

            setResult({
                success: true,
                message: `Bildirim gönderildi!`,
                sentCount: data?.sentCount || 0,
                errorCount: data?.errorCount || 0,
            });

            // Clear form on success
            setTitle('');
            setBody('');
            setBody('');
            setUrl('');
            setImage('');

            // Refresh stats
            loadStats();
        } catch (err: any) {
            console.error('Send push error:', err);
            setResult({
                success: false,
                message: err.message || 'Bir hata oluştu',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Bell className="w-7 h-7 text-primary-600" />
                        Push Bildirimleri
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Tüm abonelere push bildirimi gönderin
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Subscriber Stats Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                Aboneler
                            </h3>
                            <button
                                onClick={loadStats}
                                disabled={isLoadingStats}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoadingStats ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {isLoadingStats ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <span className="text-slate-600 dark:text-slate-400">Toplam Abone</span>
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{stats.total}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <span className="text-green-700 dark:text-green-400">Aktif</span>
                                    <span className="font-bold text-green-700 dark:text-green-400 text-lg">{stats.enabled}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Not:</strong> Bildirimler sadece izin veren kullanıcılara gönderilir.
                            Kullanıcılar sağ üstteki zil ikonundan bildirimleri etkinleştirebilir.
                        </p>
                    </div>
                </div>

                {/* Send Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary-600" />
                            Yeni Bildirim Gönder
                        </h3>

                        <form onSubmit={handleSend} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Başlık *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Bildirim başlığı"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    maxLength={65}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">{title.length}/65 karakter</p>
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Mesaj *
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Bildirim içeriği"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                    maxLength={240}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">{body.length}/240 karakter</p>
                            </div>

                            {/* URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <LinkIcon className="w-4 h-4 inline mr-1" />
                                    Hedef URL (opsiyonel)
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://katilimuzmani.com/kampanyalar"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1">Bildirime tıklandığında açılacak sayfa</p>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                    Görsel URL (Opsiyonel)
                                </label>
                                <input
                                    type="url"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://ornek.com/gorsel.jpg"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1">Bildirimde görünecek büyük görsel</p>
                            </div>

                            {/* Result Message */}
                            {result && (
                                <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    }`}>
                                    {result.success ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                            {result.message}
                                        </p>
                                        {result.sentCount !== undefined && (
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                Gönderilen: {result.sentCount} | Hata: {result.errorCount}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSending || stats.enabled === 0}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {stats.enabled} Aboneye Gönder
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PushNotifications;
