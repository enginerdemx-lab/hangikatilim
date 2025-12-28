/**
 * Calculator URL Parameters Utility
 * 
 * Enables shareable calculation links by syncing state with URL querystring.
 * Uses short parameter names to keep URLs compact.
 */

import { CalculationParams, AssetType, SystemType, IncreaseType, FeePaymentType } from '../../types';

// URL Parameter Keys (short names for compact URLs)
const PARAM_KEYS = {
    assetType: 't',           // HOME, CAR, WORKPLACE, ALL
    systemType: 's',          // LOTTERY, NON_LOTTERY
    targetAmount: 'amt',
    downPayment: 'dp',
    months: 'v',              // vade
    participationRate: 'pr',
    interimPayment1: 'ip1',
    interimMonth1: 'im1',
    interimPayment2: 'ip2',
    interimMonth2: 'im2',
    increaseType: 'it',
    installmentIncreaseRate: 'ir',
    customIncreasePeriod: 'cp',
} as const;

// Allowlist of valid parameter keys
const ALLOWED_PARAMS = new Set(Object.values(PARAM_KEYS));

// Default values for validation
const DEFAULTS = {
    targetAmount: 600000,
    downPayment: 60000,
    months: 24,
    participationRate: 8.5,
    interimPayment1: 0,
    interimMonth1: 12,
    interimPayment2: 0,
    interimMonth2: 24,
    installmentIncreaseRate: 0,
    customIncreasePeriod: 4,
};

// Limits for clamping
const LIMITS = {
    targetAmount: { min: 50000, max: 5000000 },
    downPayment: { min: 0, max: 5000000 },
    months: { min: 12, max: 360 },
    participationRate: { min: 7.0, max: 12.0 },
    installmentIncreaseRate: { min: 0, max: 100 },
};

/**
 * Clamp a number to min/max range
 */
const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Parse a number from string, return default if invalid
 */
const parseNumber = (value: string | null, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return defaultValue;
    return parsed;
};

/**
 * Parse an integer from string, return default if invalid
 */
const parseInt = (value: string | null, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = Number.parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return defaultValue;
    return parsed;
};

/**
 * Serialize calculation params to URL query string
 */
export const serializeStateToQuery = (params: CalculationParams): string => {
    const queryParams = new URLSearchParams();

    // Asset Type
    queryParams.set(PARAM_KEYS.assetType, params.assetType);

    // System Type
    queryParams.set(PARAM_KEYS.systemType, params.systemType);

    // Numbers (only if different from common defaults to keep URL shorter)
    queryParams.set(PARAM_KEYS.targetAmount, String(params.targetAmount));
    queryParams.set(PARAM_KEYS.downPayment, String(params.downPayment));
    queryParams.set(PARAM_KEYS.months, String(params.months));
    queryParams.set(PARAM_KEYS.participationRate, String(params.participationRate));

    // Interim payments (only if > 0)
    if (params.interimPayment1 > 0) {
        queryParams.set(PARAM_KEYS.interimPayment1, String(params.interimPayment1));
        queryParams.set(PARAM_KEYS.interimMonth1, String(params.interimMonth1));
    }
    if (params.interimPayment2 > 0) {
        queryParams.set(PARAM_KEYS.interimPayment2, String(params.interimPayment2));
        queryParams.set(PARAM_KEYS.interimMonth2, String(params.interimMonth2));
    }

    // Increase settings (only if enabled)
    if (params.increaseType !== IncreaseType.NONE) {
        queryParams.set(PARAM_KEYS.increaseType, params.increaseType);
        queryParams.set(PARAM_KEYS.installmentIncreaseRate, String(params.installmentIncreaseRate));
        if (params.increaseType === IncreaseType.CUSTOM && params.customIncreasePeriod) {
            queryParams.set(PARAM_KEYS.customIncreasePeriod, String(params.customIncreasePeriod));
        }
    }

    return queryParams.toString();
};

/**
 * Parse URL query string to partial calculation params
 * Returns only the parsed values; caller should merge with defaults
 */
export const parseQueryToState = (search: string): Partial<CalculationParams> => {
    if (!search || search === '?') return {};

    const urlParams = new URLSearchParams(search);
    const result: Partial<CalculationParams> = {};

    // Filter only allowed parameters (log warnings for unknown ones)
    const allowedKeyArray = Object.values(PARAM_KEYS);
    for (const [key] of urlParams.entries()) {
        if (!allowedKeyArray.includes(key as any)) {
            console.warn(`[URL Params] Ignoring unknown parameter: ${key}`);
        }
    }

    // Asset Type
    const assetType = urlParams.get(PARAM_KEYS.assetType) as AssetType | null;
    if (assetType && Object.values(AssetType).includes(assetType)) {
        result.assetType = assetType;
    }

    // System Type
    const systemType = urlParams.get(PARAM_KEYS.systemType) as SystemType | null;
    if (systemType && Object.values(SystemType).includes(systemType)) {
        result.systemType = systemType;
    }

    // Target Amount
    const targetAmount = parseInt(urlParams.get(PARAM_KEYS.targetAmount), 0);
    if (targetAmount > 0) {
        result.targetAmount = clamp(targetAmount, LIMITS.targetAmount.min, LIMITS.targetAmount.max);
    }

    // Down Payment
    const downPayment = parseInt(urlParams.get(PARAM_KEYS.downPayment), -1);
    if (downPayment >= 0) {
        result.downPayment = clamp(downPayment, LIMITS.downPayment.min, LIMITS.downPayment.max);
    }

    // Months
    const months = parseInt(urlParams.get(PARAM_KEYS.months), 0);
    if (months > 0) {
        result.months = clamp(months, LIMITS.months.min, LIMITS.months.max);
    }

    // Participation Rate
    const participationRate = parseNumber(urlParams.get(PARAM_KEYS.participationRate), 0);
    if (participationRate > 0) {
        result.participationRate = clamp(participationRate, LIMITS.participationRate.min, LIMITS.participationRate.max);
    }

    // Interim Payment 1
    const interimPayment1 = parseInt(urlParams.get(PARAM_KEYS.interimPayment1), 0);
    if (interimPayment1 > 0) {
        result.interimPayment1 = interimPayment1;
        const interimMonth1 = parseInt(urlParams.get(PARAM_KEYS.interimMonth1), 12);
        result.interimMonth1 = interimMonth1;
    }

    // Interim Payment 2
    const interimPayment2 = parseInt(urlParams.get(PARAM_KEYS.interimPayment2), 0);
    if (interimPayment2 > 0) {
        result.interimPayment2 = interimPayment2;
        const interimMonth2 = parseInt(urlParams.get(PARAM_KEYS.interimMonth2), 24);
        result.interimMonth2 = interimMonth2;
    }

    // Increase Type
    const increaseType = urlParams.get(PARAM_KEYS.increaseType) as IncreaseType | null;
    if (increaseType && Object.values(IncreaseType).includes(increaseType)) {
        result.increaseType = increaseType;

        // Increase Rate
        const installmentIncreaseRate = parseNumber(urlParams.get(PARAM_KEYS.installmentIncreaseRate), 0);
        if (installmentIncreaseRate > 0) {
            result.installmentIncreaseRate = clamp(installmentIncreaseRate, LIMITS.installmentIncreaseRate.min, LIMITS.installmentIncreaseRate.max);
        }

        // Custom Period
        if (increaseType === IncreaseType.CUSTOM) {
            const customIncreasePeriod = parseInt(urlParams.get(PARAM_KEYS.customIncreasePeriod), 4);
            result.customIncreasePeriod = customIncreasePeriod;
        }
    }

    return result;
};

/**
 * Build a complete shareable URL
 */
export const buildShareableUrl = (params: CalculationParams): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    const query = serializeStateToQuery(params);
    return query ? `${baseUrl}?${query}#calculator` : baseUrl;
};

/**
 * Debounce helper
 */
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Update URL without page reload
 */
export const updateUrlWithParams = (params: CalculationParams): void => {
    const url = buildShareableUrl(params);
    window.history.replaceState(null, '', url);
};

/**
 * Check if URL has calculation parameters
 */
export const hasUrlParams = (search: string): boolean => {
    if (!search || search === '?') return false;
    const urlParams = new URLSearchParams(search);

    for (const key of ALLOWED_PARAMS) {
        if (urlParams.has(key)) return true;
    }
    return false;
};
