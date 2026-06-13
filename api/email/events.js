import { sql } from "../_db.js";
import { processInboundEmail } from "../_inbound.js";
import { readRawBody, isValidSvixSignature } from "../_webhook.js";

// Vercel/Next-style config: disable automatic body parsing so we can verify
// the raw payload against the svix signature before parsing it as JSON.
export const config = { api: { bodyParser: false } };

// Resend webhook — email.received plus email.opened / clicked / bounced /
// complained. Received emails are logged as inbox touches; delivery events
// match on touches.external_id (the Resend message id captured at send time).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const ok = isValidSvixSignature(
      secret,
      req.headers["svix-id"],
      req.headers["svix-timestamp"],
      req.headers["svix-signature"],
      rawBody
    );
    if (!ok) return res.status(401).json({ error: "Invalid signature" });
  }

  const { type, data } = rawBody ? JSON.parse(rawBody) : {};

  if (type === "email.received") {
    const result = await processInboundEmail(data);
    return res.json({ ok: true, matched: result.matched, lead_id: result.lead_id });
  }

  const messageId = data?.email_id;
  if (!messageId) return res.json({ ok: true });

  switch (type) {
    case "email.opened":
      await sql`UPDATE touches SET opened_at = COALESCE(opened_at, NOW()) WHERE external_id = ${messageId}`;
      break;
    case "email.clicked":
      await sql`UPDATE touches SET clicked_at = COALESCE(clicked_at, NOW()) WHERE external_id = ${messageId}`;
      break;
    case "email.bounced":
      await sql`UPDATE touches SET bounced_at = NOW(), status = 'bounced' WHERE external_id = ${messageId}`;
      break;
    case "email.complained":
      await sql`UPDATE touches SET status = 'complained' WHERE external_id = ${messageId}`;
      break;
    case "email.received": {
      const { from, to, subject, text, html } = data || {};
      if (from) {
        try {
          const { findLeadByContact, sql: dbSql, logTouch } = await import("../_db.js");
          const emailMatch = from.match(/<(.+?)>/) || [null, from];
          const fromEmail  = emailMatch[1]?.toLowerCase().trim();
          const fromName   = from.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || null;

          let lead = await findLeadByContact({ email: fromEmail });

          if (!lead) {
            const rows = await dbSql`
              INSERT INTO leads (business_name, owner_name, email, stage, source, contact_type, lead_tier, lead_score)
              VALUES (${fromName || fromEmail}, ${fromName}, ${fromEmail}, 'replied', 'inbound_email', 'inbound', 'warm', 50)
              RETURNING *
            `;
            lead = rows[0];
          } else {
            const advanceable = ["found", "emailed_d0", "emailed_d3", "emailed_d7"];
            if (advanceable.includes(lead.stage)) {
              await dbSql`UPDATE leads SET stage = 'replied', last_touched = NOW(), updated_at = NOW() WHERE id = ${lead.id}`;
            }
          }

          await logTouch(lead.id, "email", "reply_received", "received", {
            subject: subject || "(no subject)",
            body: (text || html || "").slice(0, 1000),
          });
        } catch (e) {
          console.error("Inbound email handling error:", e);
        }
      }
      break;
    }
    default:
      break;
  }

  return res.json({ ok: true });
}
