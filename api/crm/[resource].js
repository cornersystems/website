import { requireClerkAuth } from "../_auth.js";
import { sql, findLeadByContact, logTouch, initSchema, ensureSchema, getSetting, setSetting } from "../_db.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Thomas at Corner Systems <tmorris@cornersystems.co>";

// Maps an outreach sequence (touches.channel) to the lead stage it advances to on send.
const STAGE_MAP = { cold_d0: "emailed_d0", follow_d3: "emailed_d3", follow_d7: "emailed_d7" };

function emailHtml(body) {
  return `<div style="font-family:sans-serif;max-width:560px">
  <img src="https://cornersystems.vercel.app/assets/cs-email-header.png" alt="Corner Systems" width="560" style="width:100%;border-radius:8px 8px 0 0;display:block;margin-bottom:24px" />
  <div style="font-size:15px;line-height:1.7;color:#1a1a1a">
${body.replace(/\n/g, "<br>")}
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
    Corner Systems · cornersystemsai@gmail.com · <a href="https://cornersystems.vercel.app" style="color:#999">cornersystems.vercel.app</a>
  </div>
</div>`;
}

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
    const [stages, mrr, clients, openTickets, pendingCallbacks, newThisWeek, pendingDrafts, hotLeads, followups] = await Promise.all([
      sql`SELECT stage, COUNT(*) as count FROM leads GROUP BY stage ORDER BY count DESC`,
      sql`SELECT COALESCE(SUM(mrr),0) as total FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM tickets WHERE status='open'`,
      sql`SELECT COUNT(*) as count FROM callbacks WHERE status='pending'`,
      sql`SELECT COUNT(*) as count FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) as count FROM touches WHERE status='pending_review'`,
      sql`SELECT COUNT(*) as count FROM leads WHERE lead_tier = 'hot' AND stage NOT IN ('client','dead','churned')`,
      sql`
        SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != '' AND (
          (stage = 'emailed_d0' AND last_touched < NOW() - INTERVAL '3 days') OR
          (stage = 'emailed_d3' AND last_touched < NOW() - INTERVAL '4 days')
        )
      `,
    ]);
    return res.json({
      stages, mrr: Number(mrr[0].total), activeClients: Number(clients[0].count),
      openTickets: Number(openTickets[0].count), pendingCallbacks: Number(pendingCallbacks[0].count),
      newThisWeek: Number(newThisWeek[0].count),
      pendingDrafts: Number(pendingDrafts[0].count),
      hotLeadsCount: Number(hotLeads[0].count),
      followupsCount: Number(followups[0].count),
      total: stages.reduce((s, r) => s + Number(r.count), 0),
    });
  }

  // ── dashboard ──────────────────────────────────────────────────────────────
  if (resource === "dashboard" && req.method === "GET") {
    const windowCounts = (rows) => rows[0];
    const [emails, replies, newLeads, stages, mrr, clients, pendingDrafts] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE)::int AS yesterday,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS week,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::int AS month
        FROM touches WHERE type = 'email' AND status = 'sent'
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE)::int AS yesterday,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS week,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::int AS month
        FROM touches WHERE status = 'received'
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE)::int AS yesterday,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::int AS week,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::int AS month
        FROM leads
      `,
      sql`SELECT stage, COUNT(*)::int as count FROM leads GROUP BY stage ORDER BY count DESC`,
      sql`SELECT COALESCE(SUM(mrr),0) as total FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM clients WHERE status='active'`,
      sql`SELECT COUNT(*) as count FROM touches WHERE status='pending_review'`,
    ]);
    return res.json({
      emails: windowCounts(emails),
      replies: windowCounts(replies),
      newLeads: windowCounts(newLeads),
      stages,
      mrr: Number(mrr[0].total),
      activeClients: Number(clients[0].count),
      pendingDrafts: Number(pendingDrafts[0].count),
    });
  }

  // ── hot leads ──────────────────────────────────────────────────────────────
  if (resource === "hot-leads" && req.method === "GET") {
    const leads = await sql`
      SELECT * FROM leads
      WHERE lead_tier = 'hot' AND stage NOT IN ('client','dead','churned')
      ORDER BY lead_score DESC, last_touched DESC NULLS LAST
      LIMIT 100
    `;
    return res.json(leads);
  }

  // ── follow-ups due ─────────────────────────────────────────────────────────
  if (resource === "followups" && req.method === "GET") {
    const [d3, d7] = await Promise.all([
      sql`
        SELECT *, 'd3' as followup_type FROM leads
        WHERE stage = 'emailed_d0' AND last_touched < NOW() - INTERVAL '3 days'
          AND email IS NOT NULL AND email != ''
        ORDER BY lead_score DESC
      `,
      sql`
        SELECT *, 'd7' as followup_type FROM leads
        WHERE stage = 'emailed_d3' AND last_touched < NOW() - INTERVAL '4 days'
          AND email IS NOT NULL AND email != ''
        ORDER BY lead_score DESC
      `,
    ]);
    return res.json([...d3, ...d7]);
  }

  // ── activity (touches feed) ───────────────────────────────────────────────
  if (resource === "activity" && req.method === "GET") {
    const { lead_id } = req.query;
    const touches = lead_id
      ? await sql`
          SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email
          FROM touches t JOIN leads l ON l.id = t.lead_id
          WHERE t.lead_id = ${lead_id}
          ORDER BY t.created_at DESC LIMIT 200
        `
      : await sql`
          SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email
          FROM touches t JOIN leads l ON l.id = t.lead_id
          ORDER BY t.created_at DESC LIMIT 200
        `;
    return res.json(touches);
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

  // PATCH /leads — per-lead auto-send override, and manual edits to
  // stage / tier / notes from the lead detail drawer
  if (resource === "leads" && req.method === "PATCH") {
    const { id, auto_send_emails, stage, lead_tier, notes } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    if (auto_send_emails !== undefined) {
      await sql`UPDATE leads SET auto_send_emails = ${auto_send_emails}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (stage !== undefined) {
      await sql`UPDATE leads SET stage = ${stage}, last_touched = NOW(), updated_at = NOW() WHERE id = ${id}`;
    }
    if (lead_tier !== undefined) {
      await sql`UPDATE leads SET lead_tier = ${lead_tier}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (notes !== undefined) {
      await sql`UPDATE leads SET notes = ${notes}, updated_at = NOW() WHERE id = ${id}`;
    }
    const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
    return res.json(rows[0] || { ok: true });
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
    if (lead?.id) await logTouch(lead.id, "email", "crm_outbound", "sent", { subject, body, external_id: result.data?.id });

    return res.json({ ok: true });
  }

  // ── drafts (AI-drafted emails awaiting review) ───────────────────────────────
  if (resource === "drafts") {
    if (req.method === "GET") {
      const drafts = await sql`
        SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email, l.lead_score, l.lead_tier, l.niche, l.city, l.state
        FROM touches t
        JOIN leads l ON l.id = t.lead_id
        WHERE t.status = 'pending_review'
        ORDER BY t.created_at ASC
      `;
      return res.json(drafts);
    }

    if (req.method === "PATCH") {
      const { id, action, subject, body } = req.body;
      if (!id || !action) return res.status(400).json({ error: "id and action required" });

      const rows = await sql`
        SELECT t.*, l.email AS lead_email, l.business_name
        FROM touches t JOIN leads l ON l.id = t.lead_id
        WHERE t.id = ${id}
      `;
      const draft = rows[0];
      if (!draft) return res.status(404).json({ error: "Draft not found" });
      if (draft.status !== "pending_review") return res.status(400).json({ error: `Draft already ${draft.status}` });

      if (action === "edit") {
        await sql`UPDATE touches SET subject = COALESCE(${subject}, subject), body = COALESCE(${body}, body) WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === "reject") {
        await sql`UPDATE touches SET status = 'rejected' WHERE id = ${id}`;
        return res.json({ ok: true });
      }

      if (action === "approve") {
        const finalSubject = subject || draft.subject;
        const finalBody    = body || draft.body;
        if (!draft.lead_email) return res.status(400).json({ error: "Lead has no email address" });

        const result = await resend.emails.send({
          from: FROM,
          replyTo: "cornersystemsai@gmail.com",
          to: draft.lead_email,
          subject: finalSubject,
          html: emailHtml(finalBody),
        });

        await sql`
          UPDATE touches SET status = 'sent', subject = ${finalSubject}, body = ${finalBody}, external_id = ${result.data?.id || null}
          WHERE id = ${id}
        `;

        const stage = STAGE_MAP[draft.channel];
        if (stage) {
          await sql`UPDATE leads SET stage = ${stage}, last_touched = NOW(), updated_at = NOW() WHERE id = ${draft.lead_id}`;
        }

        return res.json({ ok: true, external_id: result.data?.id || null });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  }

  // ── settings ───────────────────────────────────────────────────────────────
  if (resource === "settings") {
    if (req.method === "GET") {
      const autoSendDefault = await getSetting("auto_send_emails_default", "false");
      return res.json({ auto_send_emails_default: autoSendDefault === "true" });
    }
    if (req.method === "PATCH") {
      const { auto_send_emails_default } = req.body;
      if (typeof auto_send_emails_default !== "boolean") {
        return res.status(400).json({ error: "auto_send_emails_default (boolean) required" });
      }
      await setSetting("auto_send_emails_default", auto_send_emails_default ? "true" : "false");
      return res.json({ ok: true });
    }
  }

  return res.status(404).json({ error: `Unknown resource: ${resource}` });
}
