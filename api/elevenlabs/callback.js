import { requireApiKey } from "../_auth.js";
import { findLeadByContact, sql, logTouch } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;
  const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });

  const rows = await sql`
    INSERT INTO callbacks (lead_id, name, email, phone, business_name,
      preferred_callback_window, urgency, summary, requested_action, conversation_id)
    VALUES (
      ${lead?.id || null}, ${d.name || null}, ${d.email || null}, ${d.phone || null},
      ${d.business_name || null}, ${d.preferred_callback_window}, ${d.urgency || null},
      ${d.summary}, ${d.requested_action || null}, ${d.conversation_id}
    )
    RETURNING id
  `;

  if (lead) await logTouch(lead.id, "callback", "callback_requested", "pending", { notes: d.summary });

  await notifyTeam({
    subject: `📞 Callback request — ${d.business_name || d.name || "Unknown"}`,
    html: notifyHtml(
      "Callback request",
      [
        leadRow("Name", d.name),
        leadRow("Business", d.business_name),
        leadRow("Phone", d.phone),
        leadRow("Email", d.email),
        leadRow("Preferred window", d.preferred_callback_window),
        leadRow("Urgency", d.urgency),
        leadRow("Summary", d.summary),
        leadRow("Action needed", d.requested_action),
      ].join("")
    ),
  });

  return res.json({ ok: true, configured: true, callback_id: rows[0].id });
}
