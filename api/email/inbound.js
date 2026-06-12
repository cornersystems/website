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

  const secret = process.env.RESEND_INBOUND_SECRET;
  if (secret) {
    const sig = req.headers["svix-signature"];
    if (!sig || !sig.includes(secret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const { from, to, subject, text, html } = req.body;
  if (!from) return res.status(400).json({ error: "No from address" });

  const emailMatch = from.match(/<(.+?)>/) || [null, from];
  const fromEmail  = emailMatch[1]?.toLowerCase().trim();
  const fromName   = from.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || null;

  let lead = await findLeadByContact({ email: fromEmail });

  if (!lead) {
    // New contact — create a lead so it shows in the inbox
    const rows = await sql`
      INSERT INTO leads (business_name, owner_name, email, stage, source, contact_type, lead_tier, lead_score)
      VALUES (
        ${fromName || fromEmail},
        ${fromName},
        ${fromEmail},
        'replied',
        'inbound_email',
        'inbound',
        'warm',
        50
      )
      RETURNING *
    `;
    lead = rows[0];
  } else {
    // Known lead — advance stage if applicable
    const advanceable = ["found", "emailed_d0", "emailed_d3", "emailed_d7"];
    if (advanceable.includes(lead.stage)) {
      await sql`
        UPDATE leads SET stage = 'replied', last_touched = NOW(), updated_at = NOW()
        WHERE id = ${lead.id}
      `;
    }
  }

  await logTouch(lead.id, "email", "reply_received", "received", {
    subject: subject || "(no subject)",
    body: (text || html || "").slice(0, 1000),
  });

  return res.json({ ok: true, matched: !!lead, lead_id: lead.id });
}
