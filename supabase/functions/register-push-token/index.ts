
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers - STRICTLY as requested
const corsHeaders = {
    "Access-Control-Allow-Origin": "https://katilimuzmani.com", // Strict origin
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // 1. Handle CORS preflight (OPTIONS request) cleanly
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Wrap body parsing in try-catch to handle empty bodies gracefully
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: "Invalid JSON body" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { token, userAgent, platform } = body;

        if (!token || typeof token !== "string") {
            return new Response(
                JSON.stringify({ error: "Token is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user ID from auth header if present
        let userId: string | null = null;
        const authHeader = req.headers.get("Authorization");
        if (authHeader) {
            const tokenStr = authHeader.replace("Bearer ", "");
            const { data: { user }, error } = await supabase.auth.getUser(tokenStr);
            if (!error && user) {
                userId = user.id;
            }
        }

        // Prepare data for upsert
        const upsertData: any = {
            token,
            user_id: userId,
            platform: platform || "web",
            is_enabled: true,
            last_seen_at: new Date().toISOString(),
        };

        if (userAgent) {
            upsertData.user_agent = userAgent;
        }

        const { data, error } = await supabase
            .from("push_subscriptions")
            .upsert(
                upsertData,
                {
                    onConflict: "token",
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single();

        if (error) {
            console.error("Upsert error:", error);
            return new Response(
                JSON.stringify({ error: "Failed to register subscription: " + error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Token registered:", token.substring(0, 20) + "...");

        return new Response(
            JSON.stringify({ success: true, id: data.id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("General Error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error: " + String(err) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
