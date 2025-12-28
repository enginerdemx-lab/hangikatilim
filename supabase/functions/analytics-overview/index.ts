// Supabase Edge Function: Analytics Overview
// Fetches GA4 data using Google Analytics Data API
// Deploy: supabase functions deploy analytics-overview

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Simple in-memory cache (5 minute TTL)
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Check cache first
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            console.log('Returning cached data');
            return new Response(JSON.stringify(cache.data), { headers: corsHeaders });
        }

        // Get credentials from environment
        const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        const propertyId = Deno.env.get('GA4_PROPERTY_ID');

        if (!serviceAccountJson || !propertyId) {
            throw new Error('Missing GA4 configuration. Set GOOGLE_SERVICE_ACCOUNT and GA4_PROPERTY_ID secrets.');
        }

        const credentials = JSON.parse(serviceAccountJson);

        // Get access token using service account
        const tokenResponse = await getAccessToken(credentials);

        // Date range: last 7 days
        const dateRange = { startDate: '7daysAgo', endDate: 'today' };

        // Fetch main metrics (users, sessions, pageViews)
        const metricsData = await runReport(propertyId, tokenResponse, {
            dateRanges: [dateRange],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
            ],
        });

        // Fetch event counts
        const eventsData = await runReport(propertyId, tokenResponse, {
            dateRanges: [dateRange],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'eventName',
                    inListFilter: {
                        values: ['pdf_download', 'ai_button_click', 'calculation_saved', 'share_link_copy', 'share_whatsapp'],
                    },
                },
            },
        });

        // Fetch top 10 pages
        const pagesData = await runReport(propertyId, tokenResponse, {
            dateRanges: [dateRange],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10,
        });

        // Parse main metrics
        const mainMetrics = metricsData.rows?.[0]?.metricValues || [];

        // Parse events
        const events: Record<string, number> = {
            pdf_download: 0,
            ai_button_click: 0,
            calculation_saved: 0,
            share_link_copy: 0,
            share_whatsapp: 0,
        };
        eventsData.rows?.forEach((row: any) => {
            const eventName = row.dimensionValues?.[0]?.value || '';
            if (events.hasOwnProperty(eventName)) {
                events[eventName] = parseInt(row.metricValues?.[0]?.value || '0');
            }
        });

        // Parse top pages
        const topPages = pagesData.rows?.map((row: any) => ({
            path: row.dimensionValues?.[0]?.value || '',
            views: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || [];

        const responseData = {
            // Status fields for Data Health card
            status: 'ok' as const,
            lastFetchedAt: new Date().toISOString(),
            hasError: false,
            errorMessage: null as string | null,
            // Analytics data
            users: parseInt(mainMetrics[0]?.value || '0'),
            sessions: parseInt(mainMetrics[1]?.value || '0'),
            pageViews: parseInt(mainMetrics[2]?.value || '0'),
            events,
            topPages,
            lastUpdated: new Date().toISOString(),
        };

        // Update cache
        cache = { data: responseData, timestamp: Date.now() };

        return new Response(JSON.stringify(responseData), { headers: corsHeaders });

    } catch (error) {
        console.error('GA4 API Error:', error);
        const errorMessage = error.message || 'Failed to fetch analytics data';
        return new Response(
            JSON.stringify({
                // Status fields for Data Health card
                status: 'error' as const,
                lastFetchedAt: new Date().toISOString(),
                hasError: true,
                errorMessage: errorMessage,
                // Empty analytics data
                error: errorMessage,
                users: 0,
                sessions: 0,
                pageViews: 0,
                events: { pdf_download: 0, ai_button_click: 0, calculation_saved: 0 },
                topPages: [],
                lastUpdated: new Date().toISOString(),
            }),
            { status: 500, headers: corsHeaders }
        );
    }
});

// Get OAuth2 access token using service account
async function getAccessToken(credentials: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expire = now + 3600;

    // Create JWT header
    const header = { alg: 'RS256', typ: 'JWT' };

    // Create JWT claims
    const claims = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: expire,
    };

    // Sign JWT
    const jwt = await signJwt(header, claims, credentials.private_key);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to get access token: ' + JSON.stringify(data));
    }

    return data.access_token;
}

// Sign JWT using RSA-SHA256
async function signJwt(header: any, payload: any, privateKey: string): Promise<string> {
    const encoder = new TextEncoder();

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import private key
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Sign
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${unsignedToken}.${signatureB64}`;
}

// Run GA4 Data API report
async function runReport(propertyId: string, accessToken: string, body: any) {
    const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GA4 API error: ${response.status} ${errorText}`);
    }

    return response.json();
}
