import { requireClerkAuth } from "../_auth.js";
import { sql, findLeadByContact, logTouch, initSchema, ensureSchema } from "../_db.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Thomas at Corner Systems <tmorris@cornersystems.co>";

export default async function handler(req, res) {
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  await ensureSchema();
  const resource = req.query.resource;

  // ── init-db ────────────────────────────────────────────────────────────────
  if (resource === "init-db" && req.method === "POST") {
    await initSchema();
    return res.json({ ok: true, message: "Schema initialized." });
  }

  // ── stats ──────────────────────────────────────────────────────────────────
  if (resource === "stats" && req.method === "GET") {
    const [stages, mrr, clients, openTickets, pendingCallbacks, newThisWeek] = await Promise.all([
      sql`SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC`,
      sql`SELECT COALESCE(SUM(mrr),0) as total FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM tickets WHERE status='open'`,
      sql`SELECT COUNT(*) as count FROM callbacks WHERE status='pending'`,
      sql`SELECT COUNT(*) as count FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'`,
    ]);
    return res.json({
      stages, mrr: Number(mrr[0].total), activeClients: Number(clients[0].count),
      openTickets: Number(openTickets[0].count), pendingCallbacks: Number(pendingCallbacks[0].count),
      newThisWeek: Number(newThisWeek[0].count),
      total: stages.reduce((s, r) => s + Number(r.count), 0),
    });
  }

  // ── leads ──────────────────────────────────────────────────────────────────
  if (resource === "leads" && req.method === "GET") {
    const { stage, search } = req.query;
    let leads;
    if (search) {
      const q = `%${search}%`;
      leads = await sql`SELECT * FROM leads WHERE business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q} ORDER BY updated_at DESC LIMIT 200`;
    } else if (stage) {
      leads = await sql`SELECT * FROM leads WHERE stage=${stage} ORDER BY updated_at DESC LIMIT 200`;
    } else {
      leads = await sql`SELECT * FROM leads ORDER BY updated_at DESC LIMIT 200`;
    }
    return res.json(leads);
  }

  // ── tickets ────────────────────────────────────────────────────────────────
  if (resource === "tickets") {
    if (req.method === "GET") {
      const tickets = await sql`SELECT * FROM tickets ORDER BY CASE urgency WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, created_at DESC LIMIT 100`;
      return res.json(tickets);
    }
    if (req.method === "PATCH") {
      await sql`UPDATE tickets SET status=${req.body.status}, updated_at=NOW() WHERE id=${req.body.id}`;
      return res.json({ ok: true });
    }
  }

  // ── callbacks ──────────────────────────────────────────────────────────────
  if (resource === "callbacks") {
    if (req.method === "GET") {
      const callbacks = await sql`SELECT * FROM callbacks ORDER BY created_at DESC LIMIT 100`;
      return res.json(callbacks);
    }
    if (req.method === "PATCH") {
      await sql`UPDATE callbacks SET status=${req.body.status} WHERE id=${req.body.id}`;
      return res.json({ ok: true });
    }
  }

  // ── email-send ─────────────────────────────────────────────────────────────
  if (resource === "email-send" && req.method === "POST") {
    const { to_email, to_name, subject, body, lead_id } = req.body;
    if (!to_email || !subject || !body) return res.status(400).json({ error: "to_email, subject, and body required" });

    const html = `<div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
<div style="font-size:15px;line-height:1.75">${body.replace(/\n/g, "<br>")}</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
  Corner Systems · <a href="https://cornersystems.vercel.app" style="color:#999">cornersystems.vercel.app</a>
</div></div>`;

    await resend.emails.send({
      from: FROM, replyTo: "tmorris@cornersystems.co",
      to: to_name ? `${to_name} <${to_email}>` : to_email,
      subject, html,
    });

    const lead = lead_id ? { id: lead_id } : await findLeadByContact({ email: to_email });
    if (lead?.id) await logTouch(lead.id, "email", "crm_outbound", "sent", { subject, body });

    return res.json({ ok: true });
  }

  return res.status(404).json({ error: `Unknown resource: ${resource}` });
}
