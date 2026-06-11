import { requireApiKey } from "../_auth.js";
import { upsertLead, logTouch } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const data = req.body;
  const leadId = await upsertLead(data);
  await logTouch(leadId, "crm", "cs_create_or_update_lead", "created", {
    notes: data.conversation_summary || null,
  });

  return res.json({ ok: true, configured: true, lead_id: leadId });
}
