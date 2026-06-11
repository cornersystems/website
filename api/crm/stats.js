import { requireClerkAuth } from "../_auth.js";
import { sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  const [stages, mrr, clients, openTickets, pendingCallbacks, newThisWeek] = await Promise.all([
    sql`SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC`,
    sql`SELECT COALESCE(SUM(mrr), 0) as total FROM clients WHERE status = 'active'`,
    sql`SELECT COUNT(*) as count FROM clients WHERE status = 'active'`,
    sql`SELECT COUNT(*) as count FROM tickets WHERE status = 'open'`,
    sql`SELECT COUNT(*) as count FROM callbacks WHERE status = 'pending'`,
    sql`SELECT COUNT(*) as count FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'`,
  ]);

  return res.json({
    stages,
    mrr: Number(mrr[0].total),
    activeClients: Number(clients[0].count),
    openTickets: Number(openTickets[0].count),
    pendingCallbacks: Number(pendingCallbacks[0].count),
    newThisWeek: Number(newThisWeek[0].count),
    total: stages.reduce((s, r) => s + Number(r.count), 0),
  });
}
