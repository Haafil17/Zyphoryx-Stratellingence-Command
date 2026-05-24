import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const summary = typeof body.summary === "string" ? body.summary.slice(0, 20000) : "";
    if (!summary) {
      return new Response(JSON.stringify({ error: "Missing summary" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Zephoryx Finance Advisor — an elite CFO-level AI that analyzes a user's real revenue and expense data and gives sharp, actionable financial guidance.

ABSOLUTE RULES:
- Use ONLY the numbers provided. Never invent values.
- Cite exact figures (totals, categories, months).
- Be specific, direct, and confident — like a senior CFO advising a founder.

OUTPUT STRUCTURE (use these markdown headers exactly):
## 💰 Financial Health Score
(Give a score X/100 with a one-line verdict: Excellent / Healthy / Caution / Critical)

## 📊 Snapshot
(3-5 bullets with exact totals: total revenue, total expenses, net profit/loss, profit margin %, savings rate)

## 🔥 Top Expense Drains
(Rank top 3 expense categories with amounts and % of total expenses)

## 📈 Revenue Insights
(Top revenue sources, trends across months, any concerning drops)

## ⚠️ Red Flags
(2-4 specific risks visible in the data — e.g., expense category growing faster than revenue, single revenue source dependency, negative months)

## ✅ Action Plan (Next 30 Days)
(5-7 concrete, prioritized actions with expected $ impact where possible. Each starts with a verb: "Cut...", "Negotiate...", "Reallocate...")

## 🎯 90-Day Outlook
(Projection based on current trends with best/base/worst case numbers grounded in the actual data)

Be tough but constructive. No fluff.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is my finance data:\n\n${summary}\n\nGive me your full analysis and action plan.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
