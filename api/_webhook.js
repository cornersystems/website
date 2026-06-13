import crypto from "crypto";

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Resend signs webhooks via svix: HMAC-SHA256 of `${id}.${timestamp}.${body}`
// using the base64-decoded portion of the whsec_... secret.
export function isValidSvixSignature(secret, svixId, svixTimestamp, svixSignature, rawBody) {
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
