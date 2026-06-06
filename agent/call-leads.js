/**
 * Corner Systems — ElevenLabs Outbound Call Trigger
 * Fires an outbound call to a lead using your ElevenLabs agent.
 *
 * Requires:
 *   ELEVENLABS_API_KEY  — from elevenlabs.io
 *   ELEVENLABS_AGENT_ID — your outbound sales agent ID
 *   ELEVENLABS_PHONE_NUMBER_ID — your purchased ElevenLabs phone number
 */

import { logTouch, updateStage } from "./db.js";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

export async function callLead(lead) {
  if (!lead.phone) {
    console.log(`  ⚠️  No phone for ${lead.business_name} — skipping call`);
    return false;
  }

  const apiKey       = process.env.ELEVENLABS_API_KEY;
  const agentId      = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumId   = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  if (!apiKey || !agentId || !phoneNumId) {
    console.log("  ⚠️  Missing ElevenLabs env vars — skipping call");
    return false;
  }

  // Format phone to E.164
  const phone = lead.phone.replace(/\D/g, "");
  const e164  = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  // Dynamic variables injected into the agent's prompt at call time
  const dynamicVars = {
    lead_name:      lead.owner_name || "there",
    business_name:  lead.business_name,
    city:           lead.city || "",
    niche:          lead.niche || "gym",
    pain_signal:    lead.pain_signal || "front-office coverage gaps",
    website:        lead.website || "",
    lead_score:     String(lead.lead_score || 0),
  };

  try {
    const res = await fetch(`${ELEVENLABS_API}/convai/twilio/outbound-call`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumId,
        to_number: e164,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVars,
          conversation_config_override: {
            agent: {
              first_message: `Hi, is this ${dynamicVars.lead_name}? This is Thomas calling from Corner Systems. I'm reaching out because I noticed ${dynamicVars.business_name} might be missing some inbound leads — do you have 2 minutes?`,
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const callSid = data.call_sid || data.conversation_id || "unknown";

    logTouch(lead.id, "call", "outbound_d10", "completed", { call_sid: callSid });
    updateStage(lead.id, "called");

    console.log(`  📞 Called ${e164} (${lead.business_name}) — SID: ${callSid}`);
    return true;
  } catch (err) {
    console.error(`  ❌  Call failed for ${lead.business_name}: ${err.message}`);
    logTouch(lead.id, "call", "outbound_d10", "failed", { notes: err.message });
    return false;
  }
}
