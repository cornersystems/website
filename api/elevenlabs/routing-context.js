import { requireApiKey } from "../_auth.js";
import { findLeadByContact, sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const { phone, email, business_name, conversation_id, entry_mode } = req.body;

  const lead = await findLeadByContact({ email, phone, business_name });

  if (!lead) {
    return res.json({ found: false, entry_mode, configured: true });
  }

  // Get last 3 touches
  const touches = await sql`
    SELECT type, channel, status, created_at FROM touches
    WHERE lead_id = ${lead.id}
    ORDER BY created_at DESC LIMIT 3
  `;

  return res.json({
    found: true,
    configured: true,
    lead_id: lead.id,
    contact_type: lead.contact_type,
    stage: lead.stage,
    lead_tier: lead.lead_tier,
    business_name: lead.business_name,
    owner_name: lead.owner_name,
    email: lead.email,
    phone: lead.phone,
    pain_signal: lead.pain_signal,
    notes: lead.notes,
    recent_touches: touches,
  });
}
