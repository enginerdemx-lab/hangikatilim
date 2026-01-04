import { supabase } from '../supabaseClient';

// Snow Effect Configuration Interface
export interface SnowConfig {
    enabled: boolean;
    intensity: number;      // 0-200
    speed: number;          // 0.2-3.0
    sizeMin: number;        // 0.5-4.0
    sizeMax: number;        // 0.5-4.0
    wind: number;           // -1.0 to 1.0
    opacity: number;        // 0.1-1.0
    winterMode: boolean;
    excludedPages: string[];
}

// Default snow configuration
export const DEFAULT_SNOW_CONFIG: SnowConfig = {
    enabled: false,
    intensity: 120,
    speed: 1.2,
    sizeMin: 0.8,
    sizeMax: 2.6,
    wind: 0.2,
    opacity: 0.85,
    winterMode: false,
    excludedPages: []
};

export const uiEffectsApi = {
    // Get snow effect configuration
    async getSnowConfig(): Promise<SnowConfig> {
        const { data, error } = await supabase
            .from('ui_effects')
            .select('value')
            .eq('key', 'snow_effect')
            .single();

        if (error) {
            console.warn('Snow config fetch error, using defaults:', error.message);
            return DEFAULT_SNOW_CONFIG;
        }

        return { ...DEFAULT_SNOW_CONFIG, ...(data?.value as SnowConfig) };
    },

    // Update snow effect configuration
    async updateSnowConfig(config: Partial<SnowConfig>): Promise<SnowConfig> {
        // First get current config
        const currentConfig = await this.getSnowConfig();
        const newConfig = { ...currentConfig, ...config };

        console.log('[Snow] Saving config:', newConfig);

        // Try to update existing row first
        const { data: updateData, error: updateError } = await supabase
            .from('ui_effects')
            .update({
                value: newConfig,
                updated_at: new Date().toISOString()
            })
            .eq('key', 'snow_effect')
            .select('value')
            .single();

        if (updateError) {
            console.log('[Snow] Update failed, trying insert:', updateError.message);

            // If update failed (row doesn't exist), try insert
            const { data: insertData, error: insertError } = await supabase
                .from('ui_effects')
                .insert({
                    key: 'snow_effect',
                    value: newConfig,
                    updated_at: new Date().toISOString()
                })
                .select('value')
                .single();

            if (insertError) {
                console.error('[Snow] Insert also failed:', insertError);
                throw insertError;
            }

            console.log('[Snow] Insert successful:', insertData);
            return insertData?.value as SnowConfig || newConfig;
        }

        console.log('[Snow] Update successful:', updateData);
        return updateData?.value as SnowConfig || newConfig;
    },

    // Subscribe to snow config changes (Realtime)
    subscribeToSnowConfig(callback: (config: SnowConfig) => void) {
        const channel = supabase
            .channel('snow_effect_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ui_effects',
                    filter: 'key=eq.snow_effect'
                },
                (payload) => {
                    console.log('[Snow] Realtime update received:', payload);
                    if (payload.new && payload.new.value) {
                        callback(payload.new.value as SnowConfig);
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Snow] Realtime subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
