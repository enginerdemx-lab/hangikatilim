import { supabase } from '../supabaseClient';
import type {
    SavedCalculationData,
    CalculationSaveRequest,
    CalculationType
} from '../../../types';

export const calculationService = {
    // ============================================
    // SAVE CALCULATION
    // ============================================

    // Save a new calculation with PDF
    async saveCalculation(request: CalculationSaveRequest & { userId: string }): Promise<string> {
        const { userId, type, params, result, pdfBlob } = request;

        // 1. Generate unique ID for this calculation
        const calculationId = crypto.randomUUID();

        // 2. Parallelize Upload and DB Insert
        const pdfPath = `${userId}/calculations/${calculationId}.pdf`;

        // Create upload promise
        const uploadPromise = supabase.storage
            .from('user-files')
            .upload(pdfPath, pdfBlob, {
                contentType: 'application/pdf',
                cacheControl: '3600',
            });

        // Create DB insert promise
        const dbPromise = supabase
            .from('calculations')
            .insert({
                id: calculationId,
                user_id: userId,
                type,
                data_json: {
                    params,
                    result,
                },
                pdf_path: pdfPath,
            });

        // Execute both in parallel
        const [uploadResult, dbResult] = await Promise.all([uploadPromise, dbPromise]);

        // Check for errors
        if (uploadResult.error) {
            // If upload failed, try to cleanup DB just in case (though doubtful it finished if parallel, but good practice)
            await supabase.from('calculations').delete().eq('id', calculationId);
            throw uploadResult.error;
        }

        if (dbResult.error) {
            // If DB failed, cleanup upload
            await supabase.storage.from('user-files').remove([pdfPath]);
            throw dbResult.error;
        }

        return calculationId;
    },

    // ============================================
    // RETRIEVE CALCULATIONS
    // ============================================

    // Get all calculations for a user
    async getUserCalculations(
        userId: string,
        type?: CalculationType
    ): Promise<SavedCalculationData[]> {
        let query = supabase
            .from('calculations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Filter by type if provided
        if (type && type !== 'tumu') {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    // Get a single calculation by ID
    async getCalculation(calculationId: string): Promise<SavedCalculationData | null> {
        const { data, error } = await supabase
            .from('calculations')
            .select('*')
            .eq('id', calculationId)
            .single();

        if (error) throw error;
        return data;
    },

    // ============================================
    // PDF DOWNLOAD
    // ============================================

    // Download PDF from storage
    async downloadPDF(pdfPath: string): Promise<Blob> {
        const { data, error } = await supabase.storage
            .from('user-files')
            .download(pdfPath);

        if (error) throw error;
        return data;
    },

    // Get signed URL for PDF download (alternative method)
    async getPDFDownloadUrl(pdfPath: string, expiresIn: number = 3600): Promise<string> {
        const { data, error } = await supabase.storage
            .from('user-files')
            .createSignedUrl(pdfPath, expiresIn);

        if (error) throw error;
        return data.signedUrl;
    },

    // ============================================
    // DELETE CALCULATION
    // ============================================

    // Delete a calculation and its PDF
    async deleteCalculation(calculationId: string): Promise<void> {
        // 1. Get the calculation to find the PDF path
        const calculation = await this.getCalculation(calculationId);

        if (!calculation) {
            throw new Error('Calculation not found');
        }

        // 2. Delete the PDF from storage
        const { error: storageError } = await supabase.storage
            .from('user-files')
            .remove([calculation.pdf_path]);

        if (storageError) {
            console.warn('Failed to delete PDF from storage:', storageError);
            // Continue anyway to delete the database record
        }

        // 3. Delete the calculation record from database
        const { error: dbError } = await supabase
            .from('calculations')
            .delete()
            .eq('id', calculationId);

        if (dbError) throw dbError;
    },

    // ============================================
    // STATISTICS
    // ============================================

    // Get calculation count by type for a user
    async getCalculationStats(userId: string): Promise<Record<CalculationType, number>> {
        const { data, error } = await supabase
            .from('calculations')
            .select('type')
            .eq('user_id', userId);

        if (error) throw error;

        const stats: Record<CalculationType, number> = {
            ev: 0,
            arac: 0,
            isyeri: 0,
            tumu: 0,
        };

        data?.forEach(calc => {
            stats[calc.type as CalculationType]++;
        });

        return stats;
    },
};
