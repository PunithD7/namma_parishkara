import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
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
            content: `You are the Bengaluru Civic AI Assistant. You help citizens with civic services in Bengaluru, Karnataka, India.

Key knowledge:
- BBMP (Bruhat Bengaluru Mahanagara Palike) manages roads, waste, and general civic infrastructure
- BWSSB (Bangalore Water Supply and Sewerage Board) handles water supply and sewerage
- BESCOM handles electricity supply
- Street lighting falls under BBMP Electrical Division

Reporting issues:
- Citizens can report potholes, garbage dumps, water leakages, and broken streetlights
- Each issue gets a unique complaint ID starting with BLR-
- Issues are routed to: BBMP Roads (potholes), Waste Management (garbage), BWSSB (water leakage), Street Lighting (broken streetlights)
- Status workflow: Reported → Under Review → In Progress → Resolved

Contact info:
- BBMP helpline: 080-22660000
- BWSSB helpline: 1916
- BESCOM helpline: 1912

Be helpful, concise, and provide actionable guidance. Use markdown formatting.`
          },
          ...messages.filter((m: any) => m.role === "user" || m.role === "assistant")
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("civic-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
