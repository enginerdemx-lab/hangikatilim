import React, { useState, useEffect } from 'react';
import { storageService, type StorageFolder } from '../../services/storageService';
import { Link2, Upload, X } from 'lucide-react';

interface ImageUploadProps {
    folder: StorageFolder;
    currentImageUrl?: string;
    onUploadComplete: (url: string) => void;
    onDelete?: () => void;
    label?: string;
    accept?: string;
    compact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    folder,
    currentImageUrl,
    onUploadComplete,
    onDelete,
    label = 'Görsel Yükle',
    accept = 'image/*',
    compact = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(currentImageUrl);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [urlInput, setUrlInput] = useState('');

    // Update preview when currentImageUrl changes
    useEffect(() => {
        setPreview(currentImageUrl);
    }, [currentImageUrl]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase
            const url = await storageService.uploadFile(file, folder);
            onUploadComplete(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yükleme başarısız');
            setPreview(currentImageUrl);
        } finally {
            setUploading(false);
        }
    };

    const handleUrlSubmit = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;

        // Basic URL validation
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            setError('URL http:// veya https:// ile başlamalıdır');
            return;
        }

        setError(null);
        setPreview(trimmed);
        onUploadComplete(trimmed);
        setUrlInput('');
    };

    const handleDelete = async () => {
        if (!currentImageUrl || !onDelete) return;

        try {
            // Only delete from Supabase if it's a Supabase URL
            if (currentImageUrl.includes('supabase')) {
                await storageService.deleteFile(currentImageUrl);
            }
            setPreview(undefined);
            setUrlInput('');
            onDelete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Silme başarısız');
        }
    };

    return (
        <div className="space-y-3">
            {!compact && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

            {/* Preview */}
            {preview && (
                <div className="relative inline-block">
                    <img
                        src={preview}
                        alt="Preview"
                        className={`${compact ? 'w-20 h-20' : 'w-32 h-32'} object-cover rounded-lg border-2 border-gray-200 dark:border-slate-600`}
                        onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="10">Yüklenemedi</text></svg>';
                        }}
                    />
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => { setMode('file'); setError(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'file'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Upload className="w-3 h-3" />
                    Dosya Yükle
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('url'); setError(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'url'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <Link2 className="w-3 h-3" />
                    URL Yapıştır
                </button>
            </div>

            {/* File Upload */}
            {mode === 'file' && (
                <div>
                    <label
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {uploading ? 'Yükleniyor...' : preview ? 'Görseli Değiştir' : 'Görsel Seç'}
                        </span>
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {/* URL Input */}
            {mode === 'url' && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Uygula
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};
