import { ensureSchema, findLeadByContact, sql, logTouch } from "./_db.js";

// Process a Resend `email.received` event's data payload: match or create the
// lead, fetch the message body, and log a 'received' touch so it appears in
// the CRM inbox. Returns { matched, lead_id }.
export async function processInboundEmail(data) {
  const from = data?.from;
  if (!from) return { matched: false, lead_id: null, error: "No from address" };

  await ensureSchema();

  const emailMatch = from.match(/<(.+?)>/) || [null, from];
  const fromEmail  = emailMatch[1]?.toLowerCase().trim();
  const fromName   = from.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || null;

  // The email.received payload is metadata-only; the message body must be
  // retrieved separately from the Resend API.
  let body = "";
  if (data.email_id && process.env.RESEND_API_KEY) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${data.email_id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (r.ok) {
        const full = await r.json();
        body = full.text || full.html || "";
      } else {
        console.error("Failed to fetch received email body:", r.status, await r.text());
      }
    } catch (err) {
      console.error("Failed to fetch received email body:", err);
    }
  }

  let lead = await findLeadByContact({ email: fromEmail });
  const matched = !!lead;

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
    subject: data.subject || "(no subject)",
    body: body.slice(0, 10000),
    external_id: data.email_id || null,
    recipient: (Array.isArray(data.to) ? data.to[0] : data.to)?.toLowerCase() || null,
  });

  return { matched, lead_id: lead.id };
}
