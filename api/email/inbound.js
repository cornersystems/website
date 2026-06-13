import { processInboundEmail } from "../_inbound.js";
import { readRawBody, isValidSvixSignature } from "../_webhook.js";

// Vercel/Next-style config: disable automatic body parsing so we can verify
// the raw payload against the svix signature before parsing it as JSON.
export const config = { api: { bodyParser: false } };

// Dedicated Resend `email.received` endpoint. The combined webhook at
// /api/email/events also handles email.received, so registering either
// endpoint in Resend works.
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

  const rawBody = await readRawBody(req);

  const secret = process.env.RESEND_INBOUND_SECRET || process.env.RESEND_WEBHOOK_SECRET;
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

  // Resend webhook envelope: { type: "email.received", data: { email_id, from, to, subject, ... } }
  const { type, data } = rawBody ? JSON.parse(rawBody) : {};
  if (type !== "email.received") return res.json({ ok: true, ignored: type || null });

  const result = await processInboundEmail(data);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json({ ok: true, matched: result.matched, lead_id: result.lead_id });
}
