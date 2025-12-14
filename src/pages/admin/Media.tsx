import React, { useEffect, useState } from 'react';
import { mediaApi, type MediaFile } from '../../services/api/media';
import { storageService } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';

export const Media: React.FC = () => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [folders] = useState<string[]>(['logos', 'campaign-images', 'blog-covers', 'news-covers', 'other']);
    const { showToast } = useToast();

    useEffect(() => {
        loadFiles();
    }, [selectedFolder]);

    const loadFiles = async () => {
        try {
            const data = await mediaApi.listFiles(selectedFolder);
            setFiles(data.filter(file => file.name !== '.emptyFolderPlaceholder'));
        } catch (error) {
            console.error('Failed to load files:', error);
            showToast('Dosyalar yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('Dosya boyutu 10MB\'dan küçük olmalıdır', 'error');
            return;
        }

        setUploading(true);

        try {
            const folder = selectedFolder || 'other';
            await storageService.uploadFile(file, folder as any);
            showToast('Dosya yüklendi', 'success');
            loadFiles();
        } catch (error) {
            console.error('Failed to upload file:', error);
            showToast('Yükleme başarısız', 'error');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

        try {
            const filePath = selectedFolder ? `${selectedFolder}/${fileName}` : fileName;
            await mediaApi.deleteFile(filePath);
            showToast('Dosya silindi', 'success');
            loadFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const copyUrl = (fileName: string) => {
        const filePath = selectedFolder ? `${selectedFolder}/${fileName}` : fileName;
        const url = mediaApi.getPublicUrl(filePath);

        navigator.clipboard.writeText(url).then(() => {
            showToast('URL kopyalandı', 'success');
        }).catch(() => {
            showToast('Kopyalama başarısız', 'error');
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const isImage = (fileName: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Medya Kütüphanesi</h1>
                <p className="text-gray-600 mt-2">Yüklenen görselleri ve dosyaları yönetin</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Folder Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Klasör Seç
                        </label>
                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tüm Dosyalar</option>
                            {folders.map((folder) => (
                                <option key={folder} value={folder}>
                                    {folder}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosya Yükle
                        </label>
                        <label
                            className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">
                                {uploading ? 'Yükleniyor...' : 'Dosya Seç veya Sürükle'}
                            </span>
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                accept="image/*"
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Maksimum dosya boyutu: 10MB
                        </p>
                    </div>
                </div>
            </div>

            {/* Files Grid */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Dosyalar ({files.length})
                    {selectedFolder && <span className="text-sm text-gray-500 ml-2">/ {selectedFolder}</span>}
                </h2>

                {files.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file) => {
                            const filePath = selectedFolder ? `${selectedFolder}/${file.name}` : file.name;
                            const publicUrl = mediaApi.getPublicUrl(filePath);

                            return (
                                <div
                                    key={file.id}
                                    className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
                                >
                                    {/* Image Preview */}
                                    {isImage(file.name) ? (
                                        <div className="aspect-square bg-gray-200">
                                            <img
                                                src={publicUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square bg-gray-200 flex items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {file.metadata?.size ? formatFileSize(file.metadata.size) : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {file.created_at ? new Date(file.created_at).toLocaleDateString('tr-TR') : 'N/A'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => copyUrl(file.name)}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                            title="URL Kopyala"
                                        >
                                            📋 Kopyala
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.name)}
                                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                            title="Sil"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2">Bu klasörde dosya yok</p>
                        <p className="text-sm">Yukarıdan dosya yükleyebilirsiniz</p>
                    </div>
                )}
            </div>
        </div>
    );
};
