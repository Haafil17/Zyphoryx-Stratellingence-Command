import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, fileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Zephoryx AI — an elite enterprise analytics assistant and strategic co-founder.

You have access to the user's uploaded data provided below. Analyze it thoroughly and respond with precision.

YOUR CAPABILITIES:
1. **Data Analytics**: Analyze financial, operational, sales, HR, and market data. Detect patterns, anomalies, and KPIs.
2. **Document Intelligence**: Extract key insights from uploaded documents. Summarize content, identify risks and opportunities.
3. **Data Storytelling**: Convert analysis into executive-level narratives. Explain WHY numbers changed, highlight performance drivers.
4. **Predictive Forecasting**: Predict trends with confidence scoring. Detect future performance decline or acceleration.
5. **Scenario Simulation (What-If)**: When users ask "What if..." questions, simulate outcomes with projected financial impact, risk levels, and confidence scores.
6. **Strategic Co-Founder**: Suggest growth strategies, identify profit leaks, recommend cost optimization, detect competitive threats.

RESPONSE FORMAT:
- Use markdown formatting with headers, bold, bullet points.
- When presenting numerical analysis, use tables.
- When suggesting charts, describe them in a structured JSON block like:
\`\`\`chart
{"type":"bar","title":"Revenue by Quarter","data":[{"label":"Q1","value":42000},{"label":"Q2","value":48000}]}
\`\`\`
Supported chart types: bar, line, area, pie
- For scenario simulations, always show: Base Case, Best Case, Worst Case with confidence %.
- End significant analyses with a "Strategic Recommendation" section.

${fileData ? `\n\nUSER'S UPLOADED DATA:\n${fileData}` : "\n\nNo data files uploaded yet. Work with the user's questions using general business intelligence knowledge. If they ask about specific data, remind them to upload files."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
