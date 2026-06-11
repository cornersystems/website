import { requireClerkAuth } from "../_auth.js";
import { sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  if (req.method === "PATCH") {
    const { id, status } = req.body;
    await sql`UPDATE callbacks SET status = ${status} WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  const callbacks = await sql`
    SELECT * FROM callbacks ORDER BY created_at DESC LIMIT 100
  `;
  return res.json(callbacks);
}
