import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, language } = await req.json();
    if (!text || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Text too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an NLP analysis engine for Bengaluru civic complaints. Analyze the citizen complaint text and extract structured data.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with these exact fields:

{
  "issue_type": one of "pothole", "garbage", "water_leakage", "broken_streetlight",
  "severity": one of "low", "medium", "high", "critical",
  "sentiment": one of "positive", "neutral", "negative", "very_negative",
  "sentiment_score": number between -1.0 and 1.0,
  "urgency": one of "low", "medium", "high",
  "keywords": array of 3-5 key terms extracted,
  "location": extracted location or null,
  "suggested_title": a short title (max 60 chars) for the complaint,
  "confidence": number between 0.0 and 1.0,
  "summary": one sentence summary of the issue
}

Rules:
- If text mentions roads, potholes, damaged roads → issue_type: "pothole"
- If text mentions garbage, waste, trash, dumping, smell → issue_type: "garbage"
- If text mentions water, leak, pipe, drainage, flooding, sewage → issue_type: "water_leakage"
- If text mentions light, streetlight, dark, lamp → issue_type: "broken_streetlight"
- Duration mentions ("3 days", "weeks") increase urgency
- Words like "terrible", "dangerous", "urgent", "emergency" increase severity
- Multiple issues or safety hazards → severity: "high" or "critical"
- The text may be in English, Kannada, or Hindi. Handle all languages.`
          },
          {
            role: "user",
            content: `Analyze this civic complaint:\n\n"${text}"`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse NLP analysis");
    }

    // Validate and sanitize
    const validTypes = ["pothole", "garbage", "water_leakage", "broken_streetlight"];
    const validSeverities = ["low", "medium", "high", "critical"];
    const validUrgencies = ["low", "medium", "high"];

    const result = {
      issue_type: validTypes.includes(parsed.issue_type) ? parsed.issue_type : "pothole",
      severity: validSeverities.includes(parsed.severity) ? parsed.severity : "medium",
      sentiment: parsed.sentiment || "neutral",
      sentiment_score: typeof parsed.sentiment_score === "number" ? parsed.sentiment_score : 0,
      urgency: validUrgencies.includes(parsed.urgency) ? parsed.urgency : "medium",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      location: parsed.location || null,
      suggested_title: parsed.suggested_title || "Civic Issue Report",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      summary: parsed.summary || "",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-complaint-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
