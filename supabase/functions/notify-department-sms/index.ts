import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { issue_id } = await req.json();

    if (!issue_id) {
      return new Response(
        JSON.stringify({ error: "Missing issue_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch issue
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issue_id)
      .single();

    if (issueError || !issue) {
      return new Response(
        JSON.stringify({ error: "Issue not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentMessages: { to: string; sid: string; type: string }[] = [];

    // Helper to send SMS
    async function sendSms(to: string, body: string): Promise<string | null> {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: TWILIO_PHONE_NUMBER!, Body: body }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error(`SMS to ${to} failed:`, JSON.stringify(result));
        return null;
      }
      return result.sid;
    }

    // 1. Send SMS to department for high/critical new issues
    if (issue.severity === "high" || issue.severity === "critical") {
      const { data: dept } = await supabase
        .from("department_contacts")
        .select("*")
        .eq("department", issue.department)
        .single();

      if (dept?.phone) {
        const deptMsg = `🚨 Bengaluru Civic AI Alert\n\nNew ${issue.severity.toUpperCase()} priority issue!\n\nType: ${issue.issue_type}\nTitle: ${issue.title}\nComplaint: ${issue.complaint_id}\nAddress: ${issue.address || "N/A"}\n\nPlease take immediate action.`;
        const sid = await sendSms(dept.phone, deptMsg);
        if (sid) sentMessages.push({ to: dept.phone, sid, type: "department" });
      }
    }

    // 2. Send SMS to citizen (for resolved status or new report confirmation)
    const { data: citizenProfile } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("user_id", issue.user_id)
      .single();

    if (citizenProfile?.phone) {
      const citizenPhone = citizenProfile.phone.startsWith('+') ? citizenProfile.phone : `+91${citizenProfile.phone}`;
      let citizenMsg: string;
      if (issue.status === "resolved") {
        citizenMsg = `✅ Bengaluru Civic AI\n\nHi ${citizenProfile.full_name || "Citizen"},\n\nYour complaint ${issue.complaint_id} (${issue.title}) has been RESOLVED.\n\nThank you for helping improve Bengaluru!`;
      } else {
        citizenMsg = `📋 Bengaluru Civic AI\n\nHi ${citizenProfile.full_name || "Citizen"},\n\nYour complaint ${issue.complaint_id} has been submitted successfully.\n\nIssue: ${issue.title}\nSeverity: ${issue.severity.toUpperCase()}\n\nYou will be notified of updates.`;
      }
      const sid = await sendSms(citizenPhone, citizenMsg);
      if (sid) sentMessages.push({ to: citizenPhone, sid, type: "citizen" });
    }

    return new Response(
      JSON.stringify({ success: true, messages: sentMessages }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-department-sms error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
