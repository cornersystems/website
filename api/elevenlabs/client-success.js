import { requireApiKey } from "../_auth.js";
import { findLeadByContact, sql, logTouch } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;
  const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });

  const rows = await sql`
    INSERT INTO client_success_requests (lead_id, business_name, name, email, phone,
      current_workflow, requested_change, business_reason, urgency,
      scope_or_pricing_risk, conversation_id, conversation_summary)
    VALUES (
      ${lead?.id || null}, ${d.business_name}, ${d.name || null}, ${d.email || null},
      ${d.phone || null}, ${d.current_workflow || null}, ${d.requested_change},
      ${d.business_reason || null}, ${d.urgency || null},
      ${d.scope_or_pricing_risk || false}, ${d.conversation_id}, ${d.conversation_summary || null}
    )
    RETURNING id
  `;

  if (lead) await logTouch(lead.id, "client_success", "csr_created", "open", { notes: d.requested_change });

  await notifyTeam({
    subject: `🔧 Client success request — ${d.business_name}`,
    html: notifyHtml(
      "Client success request",
      [
        leadRow("Business", d.business_name),
        leadRow("Contact", d.name),
        leadRow("Email", d.email),
        leadRow("Change requested", d.requested_change),
        leadRow("Business reason", d.business_reason),
        leadRow("Current workflow", d.current_workflow),
        leadRow("Urgency", d.urgency),
        leadRow("Scope/pricing risk", d.scope_or_pricing_risk ? "Yes" : "No"),
      ].join(""),
      d.conversation_summary || ""
    ),
  });

  return res.json({ ok: true, configured: true, request_id: rows[0].id });
}
