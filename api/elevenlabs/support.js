import { requireApiKey } from "../_auth.js";
import { findLeadByContact, sql, logTouch } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;
  const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });

  const rows = await sql`
    INSERT INTO tickets (lead_id, business_name, name, email, phone,
      issue_category, affected_system, issue_summary, urgency,
      customer_impact, conversation_id, conversation_summary)
    VALUES (
      ${lead?.id || null}, ${d.business_name}, ${d.name || null}, ${d.email || null},
      ${d.phone || null}, ${d.issue_category || null}, ${d.affected_system || null},
      ${d.issue_summary}, ${d.urgency || "normal"}, ${d.customer_impact || null},
      ${d.conversation_id}, ${d.conversation_summary || null}
    )
    RETURNING id
  `;

  if (lead) await logTouch(lead.id, "support", "ticket_created", "open", { notes: d.issue_summary });

  await notifyTeam({
    subject: `🎫 Support ticket — ${d.business_name} [${d.urgency || "normal"}]`,
    html: notifyHtml(
      "New support ticket",
      [
        leadRow("Business", d.business_name),
        leadRow("Contact", d.name),
        leadRow("Email", d.email),
        leadRow("Phone", d.phone),
        leadRow("Category", d.issue_category),
        leadRow("System", d.affected_system),
        leadRow("Urgency", d.urgency),
        leadRow("Impact", d.customer_impact),
        leadRow("Issue", d.issue_summary),
      ].join(""),
      d.conversation_summary || ""
    ),
  });

  return res.json({ ok: true, configured: true, ticket_id: rows[0].id });
}
