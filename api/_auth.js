import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Guard for ElevenLabs webhook endpoints — shared API key in X-API-Key header.
// If CS_ELEVENLABS_API_KEY is not set, the check is skipped (dev convenience).
export function requireApiKey(req, res) {
  const expected = process.env.CS_ELEVENLABS_API_KEY;
  if (!expected) return true; // not configured — open
  const provided = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (provided !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// Guard for CRM dashboard endpoints — Clerk JWT in Authorization header.
export async function requireClerkAuth(req, res) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error("No token");
    const payload = await clerk.verifyToken(token);
    return payload;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}
