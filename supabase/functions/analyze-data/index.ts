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

CRITICAL RULES:
- You MUST ONLY use the actual data provided below. NEVER invent, fabricate, or assume any numbers, values, or statistics.
- If the user's data shows specific values, use EXACTLY those values in your analysis. Do not round, estimate, or modify them.
- If you don't have enough data to answer a question, say so clearly. Never fill gaps with made-up data.
- When generating charts, the data values MUST come directly from the uploaded data.

YOUR CAPABILITIES:
1. **Data Analytics**: Analyze financial, operational, sales, HR, and market data. Detect patterns, anomalies, and KPIs using ONLY the provided data.
2. **Document Intelligence**: Extract key insights from uploaded documents. Summarize content, identify risks and opportunities.
3. **Data Storytelling**: Convert analysis into executive-level narratives. Explain WHY numbers changed, highlight performance drivers. Use ONLY real data points.
4. **Predictive Forecasting**: Project trends based on the actual data patterns. Always include confidence levels and state assumptions clearly.
5. **Scenario Simulation (What-If)**: When users ask "What if..." questions, simulate outcomes based on the actual baseline data. Show Base Case, Best Case, Worst Case with confidence %.
6. **Strategic Co-Founder**: Suggest growth strategies, identify issues, recommend optimizations — all grounded in the actual data provided.

RESPONSE FORMAT:
- Use markdown formatting with headers, bold, bullet points for clear readability.
- When presenting numerical analysis, use markdown tables.
- When generating charts, use this exact JSON format inside a chart code block:
\`\`\`chart
{"type":"bar","title":"Chart Title","data":[{"label":"Category","value":12345}]}
\`\`\`
Supported chart types: bar, line, area, pie
- Chart data values MUST match the uploaded data exactly.
- For comprehensive analysis requests, include BOTH charts AND a narrative summary.
- End significant analyses with a "Strategic Recommendation" section.

${fileData ? `\n\nUSER'S UPLOADED DATA (use ONLY these values):\n${fileData}` : "\n\nNo data files uploaded yet. Ask the user to upload files before performing analysis. Do NOT generate fake data."}`;

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
