import React from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    isDanger = false,
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`rounded-full p-3 ${isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        {isDanger ? (
                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                        ) : (
                            <AlertCircle size={32} className="text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors text-white disabled:opacity-50
                            ${isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {loading ? 'İşleniyor...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
