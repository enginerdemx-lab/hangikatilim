import { supabase } from './supabaseClient';

export type StorageFolder = 'logos' | 'campaign-images' | 'blog-covers' | 'news-covers' | 'badges';


export const storageService = {
    /**
     * Upload a file to Supabase Storage
     * @param file - File to upload
     * @param folder - Target folder in media bucket
     * @param filename - Optional custom filename (auto-generated if not provided)
     * @returns Public URL of uploaded file
     */
    async uploadFile(
        file: File,
        folder: StorageFolder,
        filename?: string
    ): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = filename || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Delete a file from Supabase Storage
     * @param url - Public URL of the file to delete
     */
    async deleteFile(url: string): Promise<void> {
        // Extract file path from URL
        // URL format: https://{project}.supabase.co/storage/v1/object/public/media/{folder}/{filename}
        const urlParts = url.split('/media/');
        if (urlParts.length < 2) {
            throw new Error('Invalid file URL');
        }

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('media')
            .remove([filePath]);

        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
    },

    /**
     * List all files in a folder
     * @param folder - Folder to list files from
     */
    async listFiles(folder: StorageFolder) {
        const { data, error } = await supabase.storage
            .from('media')
            .list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            throw new Error(`List failed: ${error.message}`);
        }

        return data;
    },
};
