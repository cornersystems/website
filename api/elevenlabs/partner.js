import { requireApiKey } from "../_auth.js";
import { sql } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;

  const rows = await sql`
    INSERT INTO partners (name, email, phone, organization, website, partner_type,
      audience_or_network, referral_fit, services_of_interest,
      requested_next_step, preferred_callback_window, conversation_id, conversation_summary)
    VALUES (
      ${d.name || null}, ${d.email || null}, ${d.phone || null},
      ${d.organization || null}, ${d.website || null}, ${d.partner_type || null},
      ${d.audience_or_network || null}, ${d.referral_fit}, ${d.services_of_interest || null},
      ${d.requested_next_step}, ${d.preferred_callback_window || null},
      ${d.conversation_id}, ${d.conversation_summary || null}
    )
    RETURNING id
  `;

  await notifyTeam({
    subject: `🤝 Partner inquiry — ${d.organization || d.name}`,
    html: notifyHtml(
      "New partner intake",
      [
        leadRow("Name", d.name),
        leadRow("Organization", d.organization),
        leadRow("Email", d.email),
        leadRow("Phone", d.phone),
        leadRow("Partner type", d.partner_type),
        leadRow("Audience/network", d.audience_or_network),
        leadRow("Referral fit", d.referral_fit),
        leadRow("Next step", d.requested_next_step),
        leadRow("Callback window", d.preferred_callback_window),
      ].join(""),
      d.conversation_summary || ""
    ),
  });

  return res.json({ ok: true, configured: true, partner_id: rows[0].id });
}
