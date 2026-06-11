import { requireClerkAuth } from "../_auth.js";
import { sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  const { stage, search } = req.query;

  let leads;
  if (search) {
    const q = `%${search}%`;
    leads = await sql`
      SELECT * FROM leads
      WHERE business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q}
      ORDER BY updated_at DESC LIMIT 200
    `;
  } else if (stage) {
    leads = await sql`SELECT * FROM leads WHERE stage = ${stage} ORDER BY updated_at DESC LIMIT 200`;
  } else {
    leads = await sql`SELECT * FROM leads ORDER BY updated_at DESC LIMIT 200`;
  }

  return res.json(leads);
}
