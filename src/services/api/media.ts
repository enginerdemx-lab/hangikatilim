import { supabase } from '../supabaseClient';

export interface MediaFile {
    name: string;
    id: string;
    updated_at?: string;
    created_at?: string;
    last_accessed_at?: string;
    metadata?: {
        size?: number;
        mimetype?: string;
        cacheControl?: string;
    };
}

export const mediaApi = {
    // List all files in a specific folder
    async listFiles(folder: string = ''): Promise<MediaFile[]> {
        const { data, error } = await supabase
            .storage
            .from('media')
            .list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) throw error;
        return data || [];
    },

    // Get public URL for a file
    getPublicUrl(filePath: string): string {
        const { data } = supabase
            .storage
            .from('media')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // Upload an image to storage
    async uploadImage(file: File, folder: string = 'blog-content'): Promise<string> {
        const fileExt = file.name.split('.').pop() || 'webp';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase
            .storage
            .from('media')
            .upload(filePath, file, {
                cacheControl: '31536000',
                upsert: false,
            });

        if (error) throw error;

        return this.getPublicUrl(filePath);
    },

    // Delete a file
    async deleteFile(filePath: string): Promise<void> {
        const { error } = await supabase
            .storage
            .from('media')
            .remove([filePath]);

        if (error) throw error;
    },

    // Get all folders
    async listFolders(): Promise<string[]> {
        // Common folders used in the app
        return [
            'logos',
            'campaign-images',
            'blog-covers',
            'news-covers',
            'other',
        ];
    },
};
