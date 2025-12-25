import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import emailService from '../../services/api/emailService';

const UnsubscribePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleUnsubscribe = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Geçersiz abonelik iptal bağlantısı.');
                return;
            }

            try {
                const result = await emailService.unsubscribe(token);
                if (result) {
                    setStatus('success');
                    setMessage('E-posta bildirimleriniz başarıyla iptal edildi.');
                } else {
                    setStatus('error');
                    setMessage('Abonelik iptal edilemedi. Bağlantı geçersiz veya süresi dolmuş olabilir.');
                }
            } catch (error) {
                console.error('Unsubscribe error:', error);
                setStatus('error');
                setMessage('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            }
        };

        handleUnsubscribe();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center">
                {/* Icon */}
                <div className="mb-6">
                    {status === 'loading' && (
                        <div className="w-20 h-20 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Loader className="w-10 h-10 text-blue-400 animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-4">
                    {status === 'loading' && 'İşleniyor...'}
                    {status === 'success' && 'Abonelik İptal Edildi'}
                    {status === 'error' && 'Hata Oluştu'}
                </h1>

                {/* Message */}
                <p className="text-slate-300 mb-8">
                    {status === 'loading' ? 'Aboneliğiniz iptal ediliyor...' : message}
                </p>

                {/* Logo/Brand */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span className="text-slate-400 text-sm">Katılım Uzmanı Bildirim Merkezi</span>
                </div>

                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                >
                    Ana Sayfaya Dön
                </Link>

                {/* Additional info */}
                {status === 'success' && (
                    <p className="text-slate-500 text-sm mt-6">
                        İstediğiniz zaman profil ayarlarınızdan bildirimleri tekrar açabilirsiniz.
                    </p>
                )}
            </div>
        </div>
    );
};

export default UnsubscribePage;
