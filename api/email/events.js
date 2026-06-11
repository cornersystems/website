import { sql } from "../_db.js";

// Resend webhook — email.delivered / opened / clicked / bounced / complained.
// Matches on touches.external_id (the Resend message id captured at send time).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Resend signs webhooks with svix — verify if secret is set
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers["svix-signature"];
    if (!sig || !sig.includes(secret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const { type, data } = req.body || {};
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
