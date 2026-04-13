import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, is_active")
      .eq("api_key", apiKey)
      .single();

    if (keyError || !keyRow) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!keyRow.is_active) {
      return new Response(JSON.stringify({ error: "API key is deactivated" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("blocked")
      .eq("user_id", keyRow.user_id)
      .single();

    if (profile?.blocked) {
      return new Response(JSON.stringify({ error: "Account is blocked" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    const { messages, fileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Zephoryx AI — an elite universal data analytics and intelligence assistant.
You handle ALL types of data — financial, scientific, survey, HR, marketing, operational, educational, medical, sports, social, IoT, logistics, and any domain.

RULES:
1. ONLY use data provided in the uploaded data section. NEVER invent numbers.
2. For FINANCIAL data (revenue, sales, expense, cost, profit columns): provide Data Story, Forecast, Simulation, Strategy with charts.
3. For NON-FINANCIAL data: provide a detailed Data Story (600+ words), Key Findings, Slideshow (6-8 slides), and Recommendations. Do NOT generate chart blocks for non-financial data.
4. Always be thorough, specific, and cite exact values from the data.

${fileData ? `\nUSER'S UPLOADED DATA:\n${fileData}` : "\nNo data provided."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("public-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
