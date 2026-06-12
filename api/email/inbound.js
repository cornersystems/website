import { findLeadByContact, sql, logTouch } from "../_db.js";

export default async function handler(req, res) {
  try {
    return await route(req, res);
  } catch (err) {
    console.error("Inbound email error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function route(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Resend signs inbound webhooks with svix — verify if secret is set
  const secret = process.env.RESEND_INBOUND_SECRET;
  if (secret) {
    const sig = req.headers["svix-signature"];
    if (!sig || !sig.includes(secret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const { from, subject, text } = req.body;
  if (!from) return res.status(400).json({ error: "No from address" });

  // Extract email address from "Name <email>" format
  const emailMatch = from.match(/<(.+?)>/) || [null, from];
  const fromEmail  = emailMatch[1]?.toLowerCase().trim();

  const lead = await findLeadByContact({ email: fromEmail });
  if (!lead) {
    return res.json({ ok: true, matched: false });
  }

  // Don't overwrite stages that are already further along
  const advanceable = ["found", "emailed_d0", "emailed_d3", "emailed_d7"];
  if (advanceable.includes(lead.stage)) {
    await sql`
      UPDATE leads SET stage = 'replied', last_touched = NOW(), updated_at = NOW()
      WHERE id = ${lead.id}
    `;
  }

  await logTouch(lead.id, "email", "reply_received", "received", {
    subject: subject || "(no subject)",
    body: (text || "").slice(0, 1000),
  });

  return res.json({ ok: true, matched: true, lead_id: lead.id });
}
