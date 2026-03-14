import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a civic infrastructure issue detector for Bengaluru, India. Analyze the uploaded image and determine:
1. issue_type: one of "pothole", "garbage", "water_leakage", "broken_streetlight"
2. severity: one of "low", "medium", "high", "critical"
3. confidence: a number between 0 and 1 representing your confidence
4. suggested_title: a short descriptive title for this issue

You MUST respond using the suggest_issue tool.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this civic infrastructure image and detect the issue type, severity, and provide a suggested title." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_issue",
              description: "Return the detected civic issue details from the image",
              parameters: {
                type: "object",
                properties: {
                  issue_type: { type: "string", enum: ["pothole", "garbage", "water_leakage", "broken_streetlight"] },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  suggested_title: { type: "string" }
                },
                required: ["issue_type", "severity", "confidence", "suggested_title"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_issue" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-issue error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
