import React, { useState, useEffect } from 'react';
import { storageService, type StorageFolder } from '../../services/storageService';
import { Link2, Upload, X, Check, Pencil } from 'lucide-react';

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
    const [urlPreviewSrc, setUrlPreviewSrc] = useState('');
    const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Update preview when currentImageUrl changes
    useEffect(() => {
        setPreview(currentImageUrl);
    }, [currentImageUrl]);

    // When switching to URL mode, show current URL for editing
    useEffect(() => {
        if (mode === 'url' && currentImageUrl && !urlInput) {
            setUrlInput(currentImageUrl);
            setUrlPreviewSrc(currentImageUrl);
            setUrlPreviewValid(true);
        }
    }, [mode, currentImageUrl]);

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

    const handleUrlPreview = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            setError('URL http:// veya https:// ile başlamalıdır');
            return;
        }

        setError(null);
        setUrlPreviewSrc(trimmed);
        setUrlPreviewValid(null); // Loading state
    };

    const handleUrlApply = () => {
        const trimmed = urlInput.trim();
        if (!trimmed || !urlPreviewValid) return;

        setError(null);
        setPreview(trimmed);
        onUploadComplete(trimmed);
        setShowConfirm(false);
        setUrlPreviewSrc('');
        setUrlPreviewValid(null);
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
            setUrlPreviewSrc('');
            setUrlPreviewValid(null);
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

            {/* Current URL display */}
            {currentImageUrl && !compact && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <Link2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate flex-1">{currentImageUrl}</span>
                    <button
                        type="button"
                        onClick={() => { setMode('url'); setUrlInput(currentImageUrl); setUrlPreviewSrc(currentImageUrl); setUrlPreviewValid(true); }}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
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
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => { setUrlInput(e.target.value); setUrlPreviewValid(null); setUrlPreviewSrc(''); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUrlPreview();
                                }
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={handleUrlPreview}
                            disabled={!urlInput.trim()}
                            className="px-4 py-2 bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-600 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Önizle
                        </button>
                    </div>

                    {/* URL Preview */}
                    {urlPreviewSrc && (
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Önizleme:</p>
                            <img
                                src={urlPreviewSrc}
                                alt="URL Önizleme"
                                className="max-h-48 rounded-lg object-contain mx-auto"
                                onError={() => {
                                    setUrlPreviewValid(false);
                                    setError('Görsel yüklenemedi. URL\'yi kontrol edin.');
                                }}
                                onLoad={() => {
                                    setUrlPreviewValid(true);
                                    setError(null);
                                }}
                            />
                            {urlPreviewValid === true && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Görsel başarıyla yüklendi
                                    </span>
                                    {!showConfirm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(true)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Bu Görseli Kullan
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Emin misiniz?</span>
                                            <button
                                                type="button"
                                                onClick={handleUrlApply}
                                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                Evet, Uygula
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(false)}
                                                className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                            >
                                                Hayır
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {urlPreviewValid === false && (
                                <p className="text-xs text-red-500 text-center">Görsel yüklenemedi — URL'yi düzenleyip tekrar deneyin.</p>
                            )}
                        </div>
                    )}
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
