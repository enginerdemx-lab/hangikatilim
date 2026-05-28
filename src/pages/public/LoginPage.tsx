import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Resend email states
    const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Cooldown timer effect
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [user, navigate, location]);

    const handleResendEmail = async () => {
        if (resendCooldown > 0 || resendLoading) return;

        setResendLoading(true);
        setResendSuccess(false);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            setResendSuccess(true);
            setResendCooldown(60); // 60 seconds cooldown
        } catch (err) {
            setError('E-posta gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsEmailNotConfirmed(false);
        setResendSuccess(false);

        if (!email || !password) {
            setError('Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err: any) {
            // Check if it's email not confirmed error
            if (err.message === 'Email not confirmed') {
                setIsEmailNotConfirmed(true);
                setError('E-posta adresiniz henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.');
            } else {
                // Translate Supabase error messages to Turkish
                const translateError = (message: string): string => {
                    const translations: Record<string, string> = {
                        'Invalid login credentials': 'Geçersiz e-posta veya şifre.',
                        'User not found': 'Kullanıcı bulunamadı.',
                        'Invalid email or password': 'Geçersiz e-posta veya şifre.',
                        'Too many requests': 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.',
                        'Email already registered': 'Bu e-posta adresi zaten kayıtlı.',
                    };
                    return translations[message] || message || 'Giriş yapılırken bir hata oluştu.';
                };
                setError(translateError(err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto">
                {/* Page Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Hesabınıza Giriş Yapın
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Hesaplamalarınızı kaydetmek ve yönetmek için giriş yapın
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>

                                        {/* Resend Email Button - Only show if email not confirmed */}
                                        {isEmailNotConfirmed && (
                                            <div className="mt-3">
                                                {resendSuccess ? (
                                                    <div className="flex items-center gap-2 text-green-600 text-sm">
                                                        <CheckCircle size={16} />
                                                        <span>E-posta gönderildi! Lütfen gelen kutunuzu kontrol edin.</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResendEmail}
                                                        disabled={resendCooldown > 0 || resendLoading}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {resendLoading ? (
                                                            <RefreshCw size={14} className="animate-spin" />
                                                        ) : (
                                                            <Mail size={14} />
                                                        )}
                                                        {resendCooldown > 0
                                                            ? `Tekrar gönder (${resendCooldown}s)`
                                                            : 'Doğrulama Maili Tekrar Gönder'
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                E-posta Adresi
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="E-posta adresiniz"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
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

                        {/* Forgot Password Link */}
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
                            >
                                Şifremi unuttum
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0855f8] hover:bg-[#0645d0] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Giriş Yap
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hesabınız yok mu?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                            >
                                Kayıt Ol
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
