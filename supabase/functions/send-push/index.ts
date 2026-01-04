/**
 * Send Push Notification Edge Function
 * 
 * Sends push notifications to all active subscribers using FCM HTTP v1 API.
 * Admin-only endpoint with permissive CORS.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Generate FCM access token from service account
 */
async function getFCMAccessToken(serviceAccount: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    // Create JWT payload
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: getNumericDate(0),
        exp: getNumericDate(3600),
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    // Parse private key
    const pemContents = serviceAccount.private_key
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\n/g, "");

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    // Create JWT
    const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, cryptoKey);

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        console.error("Token exchange failed:", tokenData);
        throw new Error("Failed to get FCM access token");
    }

    return tokenData.access_token;
}

/**
 * Send FCM message to a single token
 */
async function sendFCMMessage(
    accessToken: string,
    projectId: string,
    token: string,
    title: string,
    body: string,
    url?: string,
    image?: string
): Promise<{ success: boolean; error?: string }> {
    const message = {
        message: {
            token,
            notification: {
                title,
                body,
            },
            webpush: {
                fcm_options: {
                    link: url || "/",
                },
                notification: {
                    icon: "/notification-icon-v2.png",
                    badge: "/notification-icon-v2.png",
                    image: image || undefined,
                },
            },
            data: {
                url: url || "/",
                title,
                body,
                image: image || "",
            },
        },
    };

    try {
        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("FCM send error:", data);
            return { success: false, error: data.error?.message || "Unknown error" };
        }

        return { success: true };
    } catch (err) {
        console.error("FCM request error:", err);
        return { success: false, error: String(err) };
    }
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verify admin authorization
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Authorization required" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Invalid token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if user is admin
        const { data: adminData, error: adminError } = await supabase
            .from("admin_users")
            .select("id, is_active")
            .eq("id", user.id)
            .eq("is_active", true)
            .single();

        if (adminError || !adminData) {
            return new Response(
                JSON.stringify({ error: "Admin access required" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const { title, body, url, image } = await req.json();

        if (!title || !body) {
            return new Response(
                JSON.stringify({ error: "Title and body are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get Firebase service account
        const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (!serviceAccountJson) {
            return new Response(
                JSON.stringify({ error: "Firebase not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        const projectId = serviceAccount.project_id;

        // Get FCM access token
        console.log("Getting FCM access token...");
        const accessToken = await getFCMAccessToken(serviceAccount);
        console.log("FCM access token obtained");

        // Get all active push subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select("token")
            .eq("is_enabled", true);

        if (subError) {
            console.error("Failed to fetch subscriptions:", subError);
            return new Response(
                JSON.stringify({ error: "Failed to fetch subscriptions" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ sentCount: 0, errorCount: 0, message: "No active subscriptions" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Sending to ${subscriptions.length} subscribers...`);

        // Send to all subscribers
        let sentCount = 0;
        let errorCount = 0;
        const invalidTokens: string[] = [];

        for (const sub of subscriptions) {
            const result = await sendFCMMessage(accessToken, projectId, sub.token, title, body, url, image);

            if (result.success) {
                sentCount++;
            } else {
                errorCount++;
                // Track invalid tokens for cleanup
                if (result.error?.includes("UNREGISTERED") || result.error?.includes("INVALID_ARGUMENT")) {
                    invalidTokens.push(sub.token);
                }
            }
        }

        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
            console.log(`Cleaning up ${invalidTokens.length} invalid tokens...`);
            await supabase
                .from("push_subscriptions")
                .update({ is_enabled: false })
                .in("token", invalidTokens);
        }

        console.log(`Push complete: ${sentCount} sent, ${errorCount} errors`);

        return new Response(
            JSON.stringify({ sentCount, errorCount, total: subscriptions.length }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Error:", err);
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
