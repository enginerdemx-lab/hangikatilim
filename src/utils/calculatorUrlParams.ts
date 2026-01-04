/**
 * Calculator URL Parameters Utility - REFACTORED
 * 
 * Türkçe parametre isimleri ile paylaşılabilir URL oluşturma.
 * URL sadece "Linki Kopyala" veya "WhatsApp" butonuna basıldığında üretilir.
 * Input/slider değişimlerinde URL ASLA güncellenmez.
 */

import { CalculationParams, AssetType, SystemType, IncreaseType, CalculationResult } from '../../types';

// Türkçe URL Parametre Mapping
const ASSET_TYPE_MAP = {
    [AssetType.HOME]: 'ev',
    [AssetType.CAR]: 'arac',
    [AssetType.WORKPLACE]: 'isyeri',
    [AssetType.ALL]: 'tumu',
} as const;

const ASSET_TYPE_REVERSE: Record<string, AssetType> = {
    'ev': AssetType.HOME,
    'arac': AssetType.CAR,
    'isyeri': AssetType.WORKPLACE,
    'tumu': AssetType.ALL,
};

const SYSTEM_TYPE_MAP = {
    [SystemType.LOTTERY]: 'cekilisli',
    [SystemType.NON_LOTTERY]: 'cekilissiz',
} as const;

const SYSTEM_TYPE_REVERSE: Record<string, SystemType> = {
    'cekilisli': SystemType.LOTTERY,
    'cekilissiz': SystemType.NON_LOTTERY,
};

// Türkçe parametre isimleri
const PARAM_KEYS = {
    tip: 'tip',
    sistem: 'sistem',
    tutar: 'tutar',
    pesinat: 'pesinat',
    vade: 'vade',
    oran: 'oran',
} as const;

// Limits for validation
const LIMITS = {
    tutar: { min: 50000, max: 5000000 },
    pesinat: { min: 0, max: 5000000 },
    vade: { min: 12, max: 360 },
    oran: { min: 7.0, max: 12.0 },
};

/**
 * Clamp a number to min/max range
 */
const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Normalize number: "600.000" → 600000, "8,5" → 8.5
 */
const normalizeNumber = (val: number | string): string => {
    if (typeof val === 'string') {
        // Remove dots as thousand separators, replace comma with dot for decimals
        val = val.replace(/\./g, '').replace(',', '.');
    }
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '0';
    // Return integer for whole numbers, otherwise keep decimals
    return Number.isInteger(num) ? String(num) : num.toFixed(1).replace('.0', '');
};

/**
 * Build shareable URL with Turkish parameter names
 * Only call this when user clicks "Copy Link" or "WhatsApp" button
 */
export const buildShareUrl = (params: CalculationParams): string => {
    const base = window.location.origin + window.location.pathname;

    const qs = new URLSearchParams({
        [PARAM_KEYS.tip]: ASSET_TYPE_MAP[params.assetType] || 'ev',
        [PARAM_KEYS.sistem]: SYSTEM_TYPE_MAP[params.systemType] || 'cekilisli',
        [PARAM_KEYS.tutar]: normalizeNumber(params.targetAmount),
        [PARAM_KEYS.pesinat]: normalizeNumber(params.downPayment),
        [PARAM_KEYS.vade]: String(params.months),
        [PARAM_KEYS.oran]: normalizeNumber(params.participationRate),
    });

    return `${base}?${qs.toString()}#calculator`;
};

/**
 * Parse URL query string to partial calculation params (on page load)
 */
export const parseQueryToState = (search: string): Partial<CalculationParams> => {
    if (!search || search === '?') return {};

    const urlParams = new URLSearchParams(search);
    const result: Partial<CalculationParams> = {};

    // Tip (Asset Type)
    const tip = urlParams.get(PARAM_KEYS.tip);
    if (tip && ASSET_TYPE_REVERSE[tip]) {
        result.assetType = ASSET_TYPE_REVERSE[tip];
    }

    // Sistem (System Type)
    const sistem = urlParams.get(PARAM_KEYS.sistem);
    if (sistem && SYSTEM_TYPE_REVERSE[sistem]) {
        result.systemType = SYSTEM_TYPE_REVERSE[sistem];
    }

    // Tutar (Target Amount)
    const tutar = urlParams.get(PARAM_KEYS.tutar);
    if (tutar) {
        const val = parseInt(tutar, 10);
        if (!isNaN(val) && val > 0) {
            result.targetAmount = clamp(val, LIMITS.tutar.min, LIMITS.tutar.max);
        }
    }

    // Peşinat (Down Payment)
    const pesinat = urlParams.get(PARAM_KEYS.pesinat);
    if (pesinat) {
        const val = parseInt(pesinat, 10);
        if (!isNaN(val) && val >= 0) {
            result.downPayment = clamp(val, LIMITS.pesinat.min, LIMITS.pesinat.max);
        }
    }

    // Vade (Months)
    const vade = urlParams.get(PARAM_KEYS.vade);
    if (vade) {
        const val = parseInt(vade, 10);
        if (!isNaN(val) && val > 0) {
            result.months = clamp(val, LIMITS.vade.min, LIMITS.vade.max);
        }
    }

    // Oran (Participation Rate)
    const oran = urlParams.get(PARAM_KEYS.oran);
    if (oran) {
        const val = parseFloat(oran);
        if (!isNaN(val) && val > 0) {
            result.participationRate = clamp(val, LIMITS.oran.min, LIMITS.oran.max);
        }
    }

    return result;
};

/**
 * Check if URL has any calculation parameters
 */
export const hasUrlParams = (search: string): boolean => {
    if (!search || search === '?') return false;
    const urlParams = new URLSearchParams(search);

    for (const key of Object.values(PARAM_KEYS)) {
        if (urlParams.has(key)) return true;
    }
    return false;
};

/**
 * Format currency for WhatsApp message (Turkish format)
 */
export const formatCurrencyForShare = (val: number): string => {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val);
};

/**
 * Build WhatsApp share message
 */
export interface ShareValues {
    tutar: number;
    pesinat: number;
    vade: number;
    oran: number;
    shareUrl: string;
    customTemplate?: string;
}

export const buildWhatsAppMessage = (values: ShareValues): string => {
    const tutarTL = formatCurrencyForShare(values.tutar);
    const pesinatTL = formatCurrencyForShare(values.pesinat);

    // If custom template exists from admin panel, use it
    if (values.customTemplate) {
        return values.customTemplate
            .replace('{tutar}', tutarTL)
            .replace('{pesinat}', pesinatTL)
            .replace('{vade}', String(values.vade))
            .replace('{oran}', String(values.oran))
            .replace('{link}', values.shareUrl);
    }

    // Default template
    return `Katılım Uzmanı hesaplama sonucum:
Tutar: ${tutarTL} ₺
Peşinat: ${pesinatTL} ₺
Vade: ${values.vade} ay
Katılım payı: %${values.oran}
Link: ${values.shareUrl}`;
};

/**
 * Open WhatsApp with message
 */
export const openWhatsApp = (message: string): void => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
};

// REMOVED: debounce, updateUrlWithParams, serializeStateToQuery, buildShareableUrl
// These are no longer needed since we don't auto-update URL
