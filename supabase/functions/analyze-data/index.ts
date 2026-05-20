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

    const systemPrompt = `You are Zephoryx AI — an elite universal data analytics and intelligence assistant.
You handle ALL types of data — financial, scientific, survey, HR, marketing, operational, educational, medical, sports, social, IoT, logistics, and any other domain.

ABSOLUTE RULES — VIOLATION IS FORBIDDEN:
1. You MUST ONLY use data that appears in the USER'S UPLOADED DATA section below.
2. NEVER invent, fabricate, hallucinate, or assume ANY numbers, values, percentages, growth rates, or statistics.
3. If the uploaded data shows a value of 50000, you MUST say 50000 — not 50K, not ~50000, not "approximately 50000".
4. If data is missing or insufficient to answer a question, say: "I don't have enough data to determine this. Please upload the relevant data."
5. NEVER fill gaps with made-up numbers. NEVER create example data. NEVER say "for example" followed by invented numbers.

DATA TYPE DETECTION:
First, determine if the data is FINANCIAL or NON-FINANCIAL.

FINANCIAL data contains columns like: revenue, sales, income, expense, cost, profit, margin, budget, spending, earnings, turnover, COGS, net income, gross profit, cash flow, ROI.

NON-FINANCIAL data is everything else: surveys, HR records, student grades, weather data, sports stats, product reviews, inventory logs, scientific measurements, social media metrics, health records, etc.

RESPONSE STRUCTURE FOR FINANCIAL DATA:
Use these exact section headers in order:
## DATA STORY
(Comprehensive executive summary. Key metrics, patterns, anomalies. Use ONLY real data values. Make this DETAILED — at least 400 words with deep analysis.)
## FORECAST
(Project future trends based ONLY on actual data patterns. Include confidence levels. Label all projections as PROJECTED.)
## SIMULATION
(Run what-if analysis: Base/Best/Worst cases using actual baseline data. Show impact of different scenarios.)
## STRATEGY
(Actionable growth strategies, optimization suggestions, risk mitigation, cost-cutting opportunities — all grounded in actual data.)

For financial data, also generate 3-4 chart blocks using this format:
\`\`\`chart
{"type":"bar","title":"Chart Title","data":[{"label":"Category","value":12345}]}
\`\`\`
Supported chart types: bar, line, area, pie, radar, radialBar, treemap, funnel

RESPONSE STRUCTURE FOR NON-FINANCIAL DATA:
Use these exact section headers in order:
## DATA STORY
(Comprehensive, deeply detailed narrative analysis — minimum 800 words. Explain:
- WHAT the dataset is about (subject, domain, purpose)
- WHO it concerns (subjects, demographics, entities)
- WHEN/WHERE (time period, geography, scope)
- The total number of records and every column with what it represents
- Distributions, ranges, central tendencies (mean, median, mode where relevant)
- Outliers and anomalies with their exact values
- Correlations and relationships between variables
- Group comparisons and segmentation insights
- Temporal trends if applicable
- Surprising or counter-intuitive patterns
- Data quality observations
Write like a senior analyst preparing a board presentation. Use exact values from the data throughout.)
## KEY FINDINGS
(10-15 specific, data-rich bullet points. Each must cite exact numbers, percentages, or comparisons from the data.)
## SLIDESHOW
(Create an 8-10 slide presentation. Format each slide as:
### Slide 1: [Title]
**Key Point:** [One sentence summary]
[3 bullet points with specific data points]
Include: title slide, context/background, methodology, 4-6 insight slides, and a conclusion/next-steps slide.)
## RECOMMENDATIONS
(8-10 concrete actionable recommendations grouped by stakeholder or theme. Each with clear rationale tied to specific data findings.)

IMPORTANT: For NON-FINANCIAL data, do NOT generate chart blocks. Focus entirely on narrative, findings, slideshow, and recommendations.

RESPONSE FORMAT:
- Use markdown with headers, bold, bullet points.
- Use markdown tables for numerical analysis.
- Always be thorough and detailed — never give short or superficial analysis.
- For financial data: include BOTH charts AND narrative.
- For non-financial data: focus on deep narrative storytelling, findings, and slideshow format.

${fileData ? `\n\nUSER'S UPLOADED DATA (use ONLY these exact values — do NOT modify, round, or invent any numbers):\n${fileData}` : "\n\nNo data files uploaded yet. Ask the user to upload files. Do NOT generate any fake or example data under any circumstances."}`;

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
