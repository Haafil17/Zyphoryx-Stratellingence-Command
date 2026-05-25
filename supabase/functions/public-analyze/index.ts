import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const SYSTEM_PROMPT_BASE = `You are Zephoryx AI — an elite universal data, document, image, and code intelligence assistant.
You handle ANY input: financial spreadsheets, surveys, HR / scientific / marketing / operational / educational / medical / sports / IoT / logistics data, plain documents (essays, contracts, reports, books), source code in any language, and images (charts, photos, screenshots, diagrams).

ABSOLUTE RULES:
1. ONLY use data that appears in the USER'S UPLOADED DATA section or attached images. NEVER invent.
2. If a value is 50000, say 50000.
3. If insufficient data, say "I don't have enough data to determine this."

STEP 1 — CLASSIFY: FINANCIAL / DATASET / CODE / DOCUMENT / IMAGE.

STEP 2 — RESPOND with the exact section headers below for that category.

▼ FINANCIAL:
## DATA STORY (400+ words, exact values)
## FORECAST (projections from actual data)
## SIMULATION (base/best/worst what-if)
## STRATEGY (actionable recommendations)
Also emit 3-4 chart blocks: \`\`\`chart\n{"type":"bar","title":"...","data":[{"label":"...","value":123}]}\n\`\`\`
Types: bar, line, area, pie, radar, radialBar, treemap, funnel.

▼ DATASET:
## DATA STORY (800+ words, every column explained, distributions, outliers, correlations)
## KEY FINDINGS (10-15 bullets citing exact numbers)
## SLIDESHOW (8-10 slides as "### Slide N: Title" + **Key Point:** + 3 bullets)
## RECOMMENDATIONS (8-10 grouped actions)

▼ CODE:
## CODE OVERVIEW (language, purpose, LOC, entry points)
## ARCHITECTURE & STRUCTURE (modules, dependencies, data flow)
## LINE-BY-LINE / FUNCTION EXPLANATION (walk through every function with fenced code snippets)
## ISSUES & BUGS (specific bugs, anti-patterns, security risks)
## IMPROVEMENT SUGGESTIONS (refactors with BEFORE/AFTER code)
## COMPLEXITY & QUALITY METRICS (per-function complexity, readability)

▼ DOCUMENT:
## DOCUMENT SUMMARY (TL;DR + 600+ word detailed summary)
## KEY POINTS (10-15 bullets with quoted phrases)
## ENTITIES & FACTS (markdown table: people, orgs, dates, numbers)
## SENTIMENT & TONE
## QUESTIONS THIS DOCUMENT ANSWERS (8-12 Q&A)
## ACTION ITEMS / TAKEAWAYS

▼ IMAGE:
## IMAGE DESCRIPTION (detailed per-image)
## OBJECTS & TEXT DETECTED (bullets, OCR-quoted text)
## CHART/DIAGRAM DATA (markdown table + \`\`\`chart\`\`\` block when applicable)
## CONTEXT & INTERPRETATION
## RECOMMENDATIONS

Always use markdown headers, bold, bullets, tables, and fenced code. Be exhaustive.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys").select("id, user_id, is_active").eq("api_key", apiKey).single();

    if (keyError || !keyRow) return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!keyRow.is_active) return new Response(JSON.stringify({ error: "API key is deactivated" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("blocked").eq("user_id", keyRow.user_id).single();
    if (profile?.blocked) return new Response(JSON.stringify({ error: "Account is blocked" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    const body = await req.json();
    const { messages, fileData, images, stream = true } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${fileData ? `USER'S UPLOADED DATA:\n${fileData}` : "No text data uploaded."}`;

    const outgoing = Array.isArray(messages) ? [...messages] : [{ role: "user", content: "Analyze the uploaded input." }];
    if (Array.isArray(images) && images.length > 0) {
      for (let i = outgoing.length - 1; i >= 0; i--) {
        if (outgoing[i].role === "user") {
          const textContent = typeof outgoing[i].content === "string" ? outgoing[i].content : "";
          outgoing[i] = {
            role: "user",
            content: [
              { type: "text", text: textContent || "Analyze the attached image(s)." },
              ...images
                .filter((img: { dataUrl?: string }) => typeof img?.dataUrl === "string" && img.dataUrl.startsWith("data:"))
                .map((img: { dataUrl: string }) => ({ type: "image_url", image_url: { url: img.dataUrl } })),
            ],
          };
          break;
        }
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...outgoing],
        stream: Boolean(stream),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (stream) {
      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }
    const result = await response.json();
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("public-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
