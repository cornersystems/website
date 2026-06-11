import { requireClerkAuth } from "../_auth.js";
import { initSchema } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  await initSchema();
  return res.json({ ok: true, message: "Schema initialized." });
}
