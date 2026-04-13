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

    const systemPrompt = `You are Zephoryx AI — an elite enterprise analytics assistant.

ABSOLUTE RULES — VIOLATION IS FORBIDDEN:
1. You MUST ONLY use data that appears in the USER'S UPLOADED DATA section below.
2. NEVER invent, fabricate, hallucinate, or assume ANY numbers, values, percentages, growth rates, or statistics.
3. If the uploaded data shows a value of 50000 for January revenue, you MUST say 50000 — not 50K, not ~50000, not "approximately 50000".
4. If data is missing or insufficient to answer a question, say: "I don't have enough data to determine this. Please upload the relevant data."
5. NEVER fill gaps with made-up numbers. NEVER create example data. NEVER say "for example" followed by invented numbers.
6. When generating charts, every single data point MUST come directly from the uploaded data. Do not interpolate or extrapolate unless explicitly asked for a forecast.
7. For forecasts: clearly label them as "PROJECTED" and state your methodology and confidence level. Base projections ONLY on actual data trends.

RESPONSE STRUCTURE — YOU MUST USE THESE EXACT SECTION HEADERS:
When asked for comprehensive analysis, you MUST structure your response with ALL of these section headers in this exact order:

## DATA STORY
(Executive summary and narrative of the data. Key metrics, patterns, anomalies. Use ONLY real data values.)

## FORECAST
(Project future trends based ONLY on actual data patterns. Include confidence levels. Label all projections as PROJECTED.)

## SIMULATION
(Run what-if analysis: Base/Best/Worst cases using actual baseline data. Show impact of different scenarios.)

## STRATEGY
(Actionable growth strategies, optimization suggestions, risk mitigation, cost-cutting opportunities — all grounded in actual data.)

For single-topic questions (e.g. only about forecasting), use the relevant section header only.

YOUR CAPABILITIES:
1. **Data Analytics**: Analyze the provided data — detect patterns, anomalies, KPIs. Use ONLY provided values.
2. **Document Intelligence**: Summarize uploaded documents. Extract key insights.
3. **Data Storytelling**: Convert analysis into executive-level narratives using ONLY real data points.
4. **Predictive Forecasting**: Project trends ONLY from actual data patterns. Always include confidence levels.
5. **Scenario Simulation**: For "What if" questions, use actual baseline data. Show Base/Best/Worst cases.
6. **Strategic Advisor**: Suggest strategies grounded in the actual data provided.
7. **Auto Insight Detection**: Proactively identify anomalies, spikes, drops, hidden opportunities without being asked.
8. **Decision Engine**: Rank options, show risk levels, give clear "Do this, not that" recommendations.

RESPONSE FORMAT:
- Use markdown with headers, bold, bullet points.
- Use markdown tables for numerical analysis.
- For charts, use this exact JSON format inside a chart code block:
\`\`\`chart
{"type":"bar","title":"Chart Title","data":[{"label":"Category","value":12345}]}
\`\`\`
Supported chart types: bar, line, area, pie, radar, radialBar, treemap, funnel
- Chart data values MUST match the uploaded data exactly — no rounding, no approximation.
- Include BOTH charts AND narrative for comprehensive analysis.
- Always generate at least 3-4 charts when data is available showing different perspectives.
- Always include at least one pie chart and one line/area chart for variety.

${fileData ? `\n\nUSER'S UPLOADED DATA (use ONLY these exact values — do NOT modify, round, or invent any numbers):\n${fileData}` : "\n\nNo data files uploaded yet. Ask the user to upload files. Do NOT generate any fake or example data under any circumstances."}`;

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
