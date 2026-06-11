import { sql } from "../_db.js";
import crypto from "crypto";

// Vercel/Next-style config: disable automatic body parsing so we can verify
// the raw payload against the svix signature before parsing it as JSON.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Resend signs webhooks via svix: HMAC-SHA256 of `${id}.${timestamp}.${body}`
// using the base64-decoded portion of the whsec_... secret.
function isValidSignature(secret, svixId, svixTimestamp, svixSignature, rawBody) {
  if (!svixId || !svixTimestamp || !svixSignature) return false;
  const secretBytes = Buffer.from(secret.split("_")[1] || "", "base64");
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);
  return svixSignature.split(" ").some((sig) => {
    const value = sig.split(",")[1];
    if (!value) return false;
    const valueBuf = Buffer.from(value);
    return valueBuf.length === expectedBuf.length && crypto.timingSafeEqual(valueBuf, expectedBuf);
  });
}

// Resend webhook — email.opened / clicked / bounced / complained.
// Matches on touches.external_id (the Resend message id captured at send time).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await readRawBody(req);

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const ok = isValidSignature(
      secret,
      req.headers["svix-id"],
      req.headers["svix-timestamp"],
      req.headers["svix-signature"],
      rawBody
    );
    if (!ok) return res.status(401).json({ error: "Invalid signature" });
  }

  const { type, data } = rawBody ? JSON.parse(rawBody) : {};
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
