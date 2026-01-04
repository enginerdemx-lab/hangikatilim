import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { uiEffectsApi, SnowConfig, DEFAULT_SNOW_CONFIG } from '../services/api/uiEffects';
import { startSnow, updateSnow, stopSnow, isSnowRunning } from '../utils/snowEffect';

/**
 * SnowOverlay Component
 * 
 * Renders a canvas-based snow effect that:
 * - Loads config from Supabase on mount
 * - Subscribes to realtime updates OR polls every 10 seconds
 * - Respects excludedPages setting
 * - Handles winterMode (auto-enable Dec/Jan/Feb)
 * - Works on all devices including mobile
 */
export const SnowOverlay: React.FC = () => {
    const location = useLocation();
    const configRef = useRef<SnowConfig>(DEFAULT_SNOW_CONFIG);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Check if current month is winter (December, January, February)
    const isWinterMonth = useCallback((): boolean => {
        const month = new Date().getMonth();
        return month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
    }, []);

    // Check if current page is excluded
    const isPageExcluded = useCallback((config: SnowConfig, pathname: string): boolean => {
        if (!config.excludedPages || config.excludedPages.length === 0) {
            return false;
        }

        return config.excludedPages.some(page => {
            // Exact match or starts with (for nested routes)
            if (page === pathname) return true;
            if (pathname.startsWith(page + '/')) return true;
            return false;
        });
    }, []);

    // Determine if snow should be active
    const shouldShowSnow = useCallback((config: SnowConfig, pathname: string): boolean => {
        // If page is excluded, don't show
        if (isPageExcluded(config, pathname)) {
            return false;
        }

        // If winterMode is enabled, auto-activate during winter months
        if (config.winterMode) {
            return isWinterMonth();
        }

        // Otherwise, use the enabled flag
        return config.enabled;
    }, [isPageExcluded, isWinterMonth]);

    // Apply snow effect based on config and route
    const applySnowEffect = useCallback((config: SnowConfig) => {
        configRef.current = config;
        const pathname = location.pathname;

        if (shouldShowSnow(config, pathname)) {
            if (isSnowRunning()) {
                updateSnow(config);
            } else {
                startSnow(config);
            }
        } else {
            stopSnow();
        }
    }, [location.pathname, shouldShowSnow]);

    // Fetch initial config and setup subscriptions
    useEffect(() => {
        let isMounted = true;

        const loadConfig = async () => {
            try {
                const config = await uiEffectsApi.getSnowConfig();
                if (isMounted) {
                    applySnowEffect(config);
                }
            } catch (error) {
                console.error('[SnowOverlay] Failed to load config:', error);
            }
        };

        // Initial load
        loadConfig();

        // Setup Supabase Realtime subscription
        try {
            unsubscribeRef.current = uiEffectsApi.subscribeToSnowConfig((newConfig) => {
                if (isMounted) {
                    console.log('[SnowOverlay] Realtime config update received');
                    applySnowEffect(newConfig);
                }
            });
        } catch (error) {
            console.warn('[SnowOverlay] Realtime subscription failed, falling back to polling');
        }

        // Fallback polling every 10 seconds (in case realtime fails)
        pollingRef.current = setInterval(() => {
            loadConfig();
        }, 10000);

        return () => {
            isMounted = false;

            // Cleanup realtime subscription
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }

            // Cleanup polling
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }

            // Stop snow effect
            stopSnow();
        };
    }, [applySnowEffect]);

    // Re-evaluate when route changes
    useEffect(() => {
        applySnowEffect(configRef.current);
    }, [location.pathname, applySnowEffect]);

    // This component doesn't render anything visible
    // The snow effect is rendered directly to a canvas appended to document.body
    return null;
};

export default SnowOverlay;
