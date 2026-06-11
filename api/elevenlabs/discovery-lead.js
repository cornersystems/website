import { requireApiKey } from "../_auth.js";
import { upsertLead, logTouch, sql } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;
  const leadId = await upsertLead({
    name: d.name, email: d.email, phone: d.phone,
    business_name: d.business_name, website: d.website,
    city: d.location, market: d.market, lead_score: d.lead_score || 8,
    lead_tier: d.lead_tier || "warm", contact_type: "prospect",
    source: d.source_page || "elevenlabs", conversation_id: d.conversation_id,
    pain_signal: d.main_bottleneck,
  });

  await sql`
    UPDATE leads SET
      stage      = 'replied',
      last_touched = NOW(),
      updated_at   = NOW()
    WHERE id = ${leadId} AND stage IN ('found','emailed_d0','emailed_d3','emailed_d7')
  `;

  await logTouch(leadId, "call", "discovery_lead", "received", {
    notes: d.conversation_summary || d.main_bottleneck,
  });

  await notifyTeam({
    subject: `🔥 New discovery lead — ${d.business_name || d.name || "Unknown"}`,
    html: notifyHtml(
      "New discovery call request",
      [
        leadRow("Name", d.name),
        leadRow("Business", d.business_name),
        leadRow("Email", d.email),
        leadRow("Phone", d.phone),
        leadRow("Location", d.location),
        leadRow("Market", d.market),
        leadRow("Bottleneck", d.main_bottleneck),
        leadRow("Urgency", d.urgency),
        leadRow("Budget notes", d.budget_notes),
        leadRow("Preferred time", d.preferred_time),
        leadRow("Tier", d.lead_tier),
        leadRow("Score", d.lead_score),
        leadRow("Services", d.services_of_interest),
      ].join(""),
      d.conversation_summary ? `<strong>Summary:</strong> ${d.conversation_summary}` : ""
    ),
  });

  return res.json({ ok: true, configured: true, lead_id: leadId,
    message: "Discovery details captured. Team will follow up shortly." });
}
