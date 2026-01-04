import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// UTF-8 safe base64 encoding
function encodeBase64(str: string): string {
    const encoder = new TextEncoder();
    return base64Encode(encoder.encode(str));
}

// Manuel SMTP implementasyonu (Edge Runtime uyumlu)
async function sendViaSMTP(to: string, subject: string, html: string): Promise<void> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const SMTP_HOST = "mail.kurumsaleposta.com";
    const SMTP_PORT = 465;
    const SMTP_USER = "destek@katilimuzmani.com";
    const SMTP_PASS = Deno.env.get("SMTP_PASSWORD") || "dN_5_BXb18h6@wD:";

    console.log("[SMTP] Connecting to", SMTP_HOST, SMTP_PORT);

    // SSL/TLS bağlantısı kur
    const conn = await Deno.connectTls({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
    });

    const read = async (): Promise<string> => {
        const buf = new Uint8Array(1024);
        const n = await conn.read(buf);
        if (n === null) throw new Error("Connection closed");
        return decoder.decode(buf.subarray(0, n));
    };

    const write = async (cmd: string): Promise<void> => {
        console.log("[SMTP] >", cmd.substring(0, 100));
        await conn.write(encoder.encode(cmd + "\r\n"));
    };

    const readResponse = async (): Promise<string> => {
        const response = await read();
        console.log("[SMTP] <", response.trim());
        return response;
    };

    try {
        // Greeting
        await readResponse();

        // EHLO
        await write(`EHLO localhost`);
        await readResponse();

        // AUTH LOGIN (ASCII safe)
        await write("AUTH LOGIN");
        await readResponse();

        await write(btoa(SMTP_USER)); // ASCII only - safe
        await readResponse();

        await write(btoa(SMTP_PASS)); // ASCII only - safe
        const authResponse = await readResponse();
        if (!authResponse.startsWith("235")) {
            throw new Error("Authentication failed: " + authResponse);
        }

        // MAIL FROM
        await write(`MAIL FROM:<${SMTP_USER}>`);
        await readResponse();

        // RCPT TO
        await write(`RCPT TO:<${to}>`);
        await readResponse();

        // DATA
        await write("DATA");
        await readResponse();

        // Email content - UTF-8 safe encoding
        const fromName = "Katilim Uzmani"; // ASCII version to avoid encoding issues
        const emailContent = [
            `From: ${fromName} <${SMTP_USER}>`,
            `To: <${to}>`,
            `Subject: =?UTF-8?B?${encodeBase64(subject)}?=`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            ``,
            encodeBase64(html),
            `.`
        ].join("\r\n");

        await write(emailContent);
        const sendResponse = await readResponse();
        if (!sendResponse.startsWith("250")) {
            throw new Error("Send failed: " + sendResponse);
        }

        // QUIT
        await write("QUIT");
        await readResponse();

        console.log("[SMTP] Email sent successfully!");

    } finally {
        conn.close();
    }
}

serve(async (req: Request) => {
    console.log("[send-email] Function called");

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, subject, html } = await req.json();
        console.log("[send-email] Request:", { to, subject, htmlLength: html?.length });

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        await sendViaSMTP(to, subject, html);
        console.log("[send-email] Email sent successfully to:", to);

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("[send-email] Error:", err);
        return new Response(
            JSON.stringify({ success: false, error: String(err) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
