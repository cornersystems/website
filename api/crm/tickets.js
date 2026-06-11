import { requireClerkAuth } from "../_auth.js";
import { sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  if (req.method === "PATCH") {
    const { id, status } = req.body;
    await sql`UPDATE tickets SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  const tickets = await sql`
    SELECT * FROM tickets ORDER BY
      CASE urgency WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      created_at DESC
    LIMIT 100
  `;
  return res.json(tickets);
}
