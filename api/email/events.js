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
    default:
      break;
  }

  return res.json({ ok: true });
}
