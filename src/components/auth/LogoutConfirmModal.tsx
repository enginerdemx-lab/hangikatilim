import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const [loading, setLoading] = React.useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            onClose();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
                        <AlertTriangle size={32} className="text-orange-600 dark:text-orange-400" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Çıkış Yapmak İstiyor Musunuz?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kaydedilmemiş değişiklikler kaybolabilir.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                    </button>
                </div>
            </div>
        </div>
    );
};
