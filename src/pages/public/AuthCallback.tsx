import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const AuthCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the hash parameters from the URL
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const type = hashParams.get('type');

                if (accessToken && refreshToken) {
                    // Set the session with the tokens
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) throw error;

                    // Determine the message based on type
                    if (type === 'signup' || type === 'email_confirmation') {
                        setMessage('E-posta adresiniz başarıyla onaylandı!');
                    } else if (type === 'recovery') {
                        setMessage('Şifre sıfırlama bağlantısı doğrulandı!');
                        // Redirect to password reset page
                        setTimeout(() => navigate('/reset-password'), 2000);
                        setStatus('success');
                        return;
                    } else if (type === 'email_change') {
                        setMessage('E-posta adresiniz başarıyla değiştirildi!');
                    } else {
                        setMessage('Hesabınız başarıyla doğrulandı!');
                    }

                    setStatus('success');
                } else {
                    // No tokens, might be an error or invalid link
                    const error = hashParams.get('error');
                    const errorDescription = hashParams.get('error_description');

                    if (error) {
                        setMessage(errorDescription || 'Doğrulama işlemi başarısız oldu.');
                        setStatus('error');
                    } else {
                        // Try to get session - user might already be logged in
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            setMessage('Hesabınız zaten doğrulanmış!');
                            setStatus('success');
                        } else {
                            setMessage('Geçersiz veya süresi dolmuş bağlantı.');
                            setStatus('error');
                        }
                    }
                }
            } catch (error: any) {
                console.error('Auth callback error:', error);
                setMessage(error.message || 'Bir hata oluştu.');
                setStatus('error');
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-[#0855f8] mx-auto animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Doğrulanıyor...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Lütfen bekleyin, hesabınız doğrulanıyor.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Başarılı!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors"
                        >
                            Ana Sayfaya Git
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Hata!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-[#0855f8] hover:bg-[#0645d0] text-white rounded-xl font-bold transition-colors"
                            >
                                Giriş Yap
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors"
                            >
                                Ana Sayfaya Git
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
