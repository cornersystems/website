import { requireClerkAuth } from "../_auth.js";
import { sql, findLeadByContact, logTouch, logAudit, initSchema, ensureSchema, getSetting, setSetting } from "../_db.js";

// Returns only the fields that actually changed between a DB row and request body.
function diffFields(before, body, fields) {
  const b = {}, a = {};
  for (const key of fields) {
    if (!(key in body)) continue;
    const prev = before[key] ?? null;
    const next = body[key] ?? null;
    if (String(prev) !== String(next)) { b[key] = prev; a[key] = next; }
  }
  return Object.keys(b).length ? { before: b, after: a } : null;
}
import { getSendPolicy, setSendPolicy } from "../_policy.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Thomas at Corner Systems <tmorris@cornersystems.co>";

// Maps an outreach sequence (touches.channel) to the lead stage it advances to on send.
const STAGE_MAP = { cold_d0: "emailed_d0", follow_d3: "emailed_d3", follow_d7: "emailed_d7" };
const ENTERPRISE_STAGES = [
  "found", "researched", "emailed_d0", "contacted", "replied", "discovery_booked",
  "qualified", "proposal_sent", "negotiation", "verbal_agreement", "client", "dead",
];
const FORECAST_CATEGORIES = ["pipeline", "best_case", "commit", "closed_won", "closed_lost"];
const LOST_REASONS = ["no_budget", "no_response", "competitor_won", "bad_timing", "not_decision_maker", "no_need", "pricing", "internal_decision"];

function inferredProbability(stage, explicit) {
  const n = Number(explicit);
  if (Number.isFinite(n) && n >= 0) return Math.min(100, Math.max(0, n));
  const byStage = {
    found: 10, researched: 15, emailed_d0: 20, emailed_d3: 25, emailed_d7: 25,
    called: 30, contacted: 35, replied: 45, discovery_booked: 55, qualified: 65,
    proposal_sent: 72, negotiation: 82, verbal_agreement: 92, client: 100, dead: 0,
    churned: 0,
  };
  return byStage[stage] ?? 20;
}

function inferredForecast(stage, explicit) {
  if (FORECAST_CATEGORIES.includes(explicit)) return explicit;
  if (stage === "client") return "closed_won";
  if (stage === "dead" || stage === "churned") return "closed_lost";
  if (["negotiation", "verbal_agreement"].includes(stage)) return "commit";
  if (["qualified", "proposal_sent", "discovery_booked"].includes(stage)) return "best_case";
  return "pipeline";
}

function nextCadenceDate(steps = [], currentIndex = 0, nextIndex = 0) {
  const currentDay = Number(steps[currentIndex]?.day || 0);
  const nextDay = Number(steps[nextIndex]?.day || currentDay + 1);
  const deltaDays = Math.max(1, nextDay - currentDay);
  return new Date(Date.now() + deltaDays * 86400000).toISOString();
}

async function findOrCreateAccount({ name, website = null, industry = null, city = null, state = null, assigned_owner = null } = {}) {
  const accountName = (name || "").trim();
  if (!accountName) return null;
  const existing = await sql`SELECT * FROM accounts WHERE lower(name) = lower(${accountName}) ORDER BY id ASC LIMIT 1`;
  if (existing[0]) return existing[0];
  const rows = await sql`
    INSERT INTO accounts (name, website, industry, city, state, assigned_owner)
    VALUES (${accountName}, ${website || null}, ${industry || null}, ${city || null}, ${state || null}, ${assigned_owner || null})
    RETURNING *
  `;
  return rows[0];
}

function emailHtml(body) {
  return `<div style="font-family:sans-serif;max-width:560px">
  <img src="https://cornersystems.co/assets/cs-email-header.png" alt="Corner Systems" width="560" style="width:100%;border-radius:8px 8px 0 0;display:block;margin-bottom:24px" />
  <div style="font-size:15px;line-height:1.7;color:#1a1a1a">
${body.replace(/\n/g, "<br>")}
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
    Corner Systems · hello@cornersystems.co · <a href="https://cornersystems.co" style="color:#999">cornersystems.co</a>
  </div>
</div>`;
}

export default async function handler(req, res) {
  try {
    return await route(req, res);
  } catch (err) {
    console.error("CRM API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function route(req, res) {
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
    const [stages, mrr, clients, openTickets, pendingCallbacks, newThisWeek, pendingDrafts, hotLeads, followups, inboxNew] = await Promise.all([
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
      sql`SELECT COUNT(*) as count FROM touches WHERE status = 'received' AND created_at >= NOW() - INTERVAL '7 days'`,
    ]);
    return res.json({
      stages, mrr: Number(mrr[0].total), activeClients: Number(clients[0].count),
      openTickets: Number(openTickets[0].count), pendingCallbacks: Number(pendingCallbacks[0].count),
      newThisWeek: Number(newThisWeek[0].count),
      pendingDrafts: Number(pendingDrafts[0].count),
      hotLeadsCount: Number(hotLeads[0].count),
      followupsCount: Number(followups[0].count),
      inboxCount: Number(inboxNew[0].count),
      total: stages.reduce((s, r) => s + Number(r.count), 0),
    });
  }

  // ── dashboard ──────────────────────────────────────────────────────────────
  if (resource === "dashboard" && req.method === "GET") {
    const windowCounts = (rows) => rows[0];
    const [emails, replies, newLeads, stages, mrr, clients, pendingDrafts, forecast, tasks, meetingsToday, wonMonth, wonQuarter, lostReasons, revenueTrend] = await Promise.all([
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
      sql`
        SELECT
          COALESCE(SUM(COALESCE(deal_value, 0)), 0)::numeric AS pipeline_value,
          COALESCE(SUM(COALESCE(deal_value, 0) * inferred.close_probability / 100.0), 0)::numeric AS weighted_value,
          COUNT(*) FILTER (WHERE stage NOT IN ('client','dead','churned'))::int AS open_opportunities,
          COUNT(*) FILTER (WHERE stage = 'client')::int AS won_deals,
          COUNT(*) FILTER (WHERE stage IN ('dead','churned'))::int AS lost_deals
        FROM (
          SELECT deal_value, stage, ${null} AS unused,
            CASE
              WHEN close_probability IS NOT NULL THEN close_probability
              WHEN stage = 'client' THEN 100
              WHEN stage IN ('dead','churned') THEN 0
              WHEN stage IN ('negotiation','verbal_agreement') THEN 85
              WHEN stage IN ('qualified','proposal_sent','discovery_booked') THEN 65
              WHEN stage IN ('replied','contacted','called') THEN 40
              ELSE 20
            END AS close_probability
          FROM leads
          WHERE stage NOT IN ('dead','churned') OR COALESCE(deal_value, 0) > 0
        ) inferred
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE next_action_at::date = CURRENT_DATE)::int AS due_today,
          COUNT(*) FILTER (WHERE next_action_at < NOW())::int AS overdue,
          COUNT(*) FILTER (WHERE next_action_at >= NOW() AND next_action_at < NOW() + INTERVAL '7 days')::int AS upcoming_week
        FROM leads
        WHERE next_action IS NOT NULL OR next_action_at IS NOT NULL
      `,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE start_at::date = CURRENT_DATE AND status = 'booked'`,
      sql`SELECT COALESCE(SUM(deal_value),0)::numeric AS total FROM leads WHERE stage = 'client' AND updated_at >= date_trunc('month', NOW())`,
      sql`SELECT COALESCE(SUM(deal_value),0)::numeric AS total FROM leads WHERE stage = 'client' AND updated_at >= date_trunc('quarter', NOW())`,
      sql`
        SELECT COALESCE(lost_reason, 'unspecified') AS reason, COUNT(*)::int AS count, COALESCE(SUM(deal_value),0)::numeric AS value
        FROM leads
        WHERE stage IN ('dead','churned')
        GROUP BY COALESCE(lost_reason, 'unspecified')
        ORDER BY count DESC
        LIMIT 8
      `,
      sql`
        SELECT to_char(date_trunc('month', updated_at), 'YYYY-MM') AS month, COALESCE(SUM(deal_value),0)::numeric AS value
        FROM leads
        WHERE stage = 'client' AND updated_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', updated_at)
        ORDER BY month
      `,
    ]);
    return res.json({
      emails: windowCounts(emails),
      replies: windowCounts(replies),
      newLeads: windowCounts(newLeads),
      stages,
      mrr: Number(mrr[0].total),
      activeClients: Number(clients[0].count),
      pendingDrafts: Number(pendingDrafts[0].count),
      forecast: {
        pipelineValue: Number(forecast[0].pipeline_value),
        weightedValue: Number(forecast[0].weighted_value),
        openOpportunities: Number(forecast[0].open_opportunities),
        wonDeals: Number(forecast[0].won_deals),
        lostDeals: Number(forecast[0].lost_deals),
        wonThisMonth: Number(wonMonth[0].total),
        wonThisQuarter: Number(wonQuarter[0].total),
        revenueGoal: 25000,
      },
      tasks: tasks[0],
      meetingsToday: Number(meetingsToday[0].count),
      lostReasons,
      revenueTrend,
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

  // ── enterprise pipeline board ─────────────────────────────────────────────
  if (resource === "kanban" && req.method === "GET") {
    const { owner, forecast, search } = req.query;
    const q = search ? `%${search}%` : null;
    let cards;
    if (owner && forecast && q) {
      cards = await sql`
        SELECT * FROM leads
        WHERE COALESCE(assigned_owner, 'Unassigned') = ${owner}
          AND COALESCE(forecast_category, 'pipeline') = ${forecast}
          AND (business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q} OR niche ILIKE ${q} OR tags ILIKE ${q})
        ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST
        LIMIT 300`;
    } else if (owner && q) {
      cards = await sql`
        SELECT * FROM leads
        WHERE COALESCE(assigned_owner, 'Unassigned') = ${owner}
          AND (business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q} OR niche ILIKE ${q} OR tags ILIKE ${q})
        ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST
        LIMIT 300`;
    } else if (forecast && q) {
      cards = await sql`
        SELECT * FROM leads
        WHERE COALESCE(forecast_category, 'pipeline') = ${forecast}
          AND (business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q} OR niche ILIKE ${q} OR tags ILIKE ${q})
        ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST
        LIMIT 300`;
    } else if (owner && forecast) {
      cards = await sql`
        SELECT * FROM leads
        WHERE COALESCE(assigned_owner, 'Unassigned') = ${owner}
          AND COALESCE(forecast_category, 'pipeline') = ${forecast}
        ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST
        LIMIT 300`;
    } else if (owner) {
      cards = await sql`SELECT * FROM leads WHERE COALESCE(assigned_owner, 'Unassigned') = ${owner} ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST LIMIT 300`;
    } else if (forecast) {
      cards = await sql`SELECT * FROM leads WHERE COALESCE(forecast_category, 'pipeline') = ${forecast} ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST LIMIT 300`;
    } else if (q) {
      cards = await sql`
        SELECT * FROM leads
        WHERE business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q} OR niche ILIKE ${q} OR tags ILIKE ${q}
        ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST
        LIMIT 300`;
    } else {
      cards = await sql`SELECT * FROM leads ORDER BY COALESCE(next_action_at, updated_at) ASC NULLS LAST LIMIT 300`;
    }

    const stageStats = await sql`
      SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(deal_value),0)::numeric AS value
      FROM leads
      GROUP BY stage
    `;
    return res.json({ stages: ENTERPRISE_STAGES, cards, stageStats });
  }

  // ── forecast dashboard ────────────────────────────────────────────────────
  if (resource === "forecast" && req.method === "GET") {
    const [summary, byCategory, byRep, byIndustry, byService, monthly, quarterly, stageConversions] = await Promise.all([
      sql`
        WITH revenue_records AS (
          SELECT deal_value, stage, close_probability, expected_close_date, updated_at, forecast_category, assigned_owner, niche AS industry, revenue_service
          FROM leads
          UNION ALL
          SELECT o.deal_value, o.stage, o.close_probability, o.expected_close_date, o.updated_at, o.forecast_category, o.assigned_owner, a.industry, o.revenue_service
          FROM opportunities o
          LEFT JOIN accounts a ON a.id = o.account_id
        )
        SELECT
          COALESCE(SUM(deal_value),0)::numeric AS pipeline_value,
          COALESCE(SUM(deal_value * COALESCE(close_probability, 20) / 100.0),0)::numeric AS weighted_value,
          COALESCE(SUM(deal_value) FILTER (WHERE stage = 'client' AND updated_at >= date_trunc('month', NOW())),0)::numeric AS won_month,
          COALESCE(SUM(deal_value) FILTER (WHERE stage = 'client' AND updated_at >= date_trunc('quarter', NOW())),0)::numeric AS won_quarter
        FROM revenue_records
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, stage, close_probability, forecast_category FROM leads
          UNION ALL
          SELECT deal_value, stage, close_probability, forecast_category FROM opportunities
        )
        SELECT COALESCE(forecast_category, 'pipeline') AS forecast_category,
          COUNT(*)::int AS count,
          COALESCE(SUM(deal_value),0)::numeric AS value,
          COALESCE(SUM(deal_value * COALESCE(close_probability, 20) / 100.0),0)::numeric AS weighted_value
        FROM revenue_records
        GROUP BY COALESCE(forecast_category, 'pipeline')
        ORDER BY value DESC
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, close_probability, assigned_owner FROM leads
          UNION ALL
          SELECT deal_value, close_probability, assigned_owner FROM opportunities
        )
        SELECT COALESCE(assigned_owner, 'Unassigned') AS owner,
          COUNT(*)::int AS count,
          COALESCE(SUM(deal_value),0)::numeric AS value,
          COALESCE(SUM(deal_value * COALESCE(close_probability, 20) / 100.0),0)::numeric AS weighted_value
        FROM revenue_records
        GROUP BY COALESCE(assigned_owner, 'Unassigned')
        ORDER BY weighted_value DESC
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, niche AS industry FROM leads
          UNION ALL
          SELECT o.deal_value, a.industry FROM opportunities o LEFT JOIN accounts a ON a.id = o.account_id
        )
        SELECT COALESCE(industry, 'Unknown') AS industry,
          COUNT(*)::int AS count,
          COALESCE(SUM(deal_value),0)::numeric AS value
        FROM revenue_records
        GROUP BY COALESCE(industry, 'Unknown')
        ORDER BY value DESC
        LIMIT 10
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, revenue_service FROM leads
          UNION ALL
          SELECT deal_value, revenue_service FROM opportunities
        )
        SELECT COALESCE(revenue_service, 'Unspecified') AS service,
          COUNT(*)::int AS count,
          COALESCE(SUM(deal_value),0)::numeric AS value
        FROM revenue_records
        GROUP BY COALESCE(revenue_service, 'Unspecified')
        ORDER BY value DESC
        LIMIT 10
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, close_probability, expected_close_date, updated_at, stage FROM leads
          UNION ALL
          SELECT deal_value, close_probability, expected_close_date, updated_at, stage FROM opportunities
        )
        SELECT to_char(COALESCE(expected_close_date, updated_at)::date, 'YYYY-MM') AS period,
          COALESCE(SUM(deal_value * COALESCE(close_probability, 20) / 100.0),0)::numeric AS weighted_value
        FROM revenue_records
        WHERE stage NOT IN ('dead','churned')
        GROUP BY to_char(COALESCE(expected_close_date, updated_at)::date, 'YYYY-MM')
        ORDER BY period
        LIMIT 12
      `,
      sql`
        WITH revenue_records AS (
          SELECT deal_value, close_probability, expected_close_date, updated_at, stage FROM leads
          UNION ALL
          SELECT deal_value, close_probability, expected_close_date, updated_at, stage FROM opportunities
        )
        SELECT to_char(date_trunc('quarter', COALESCE(expected_close_date, updated_at)), 'YYYY "Q"Q') AS period,
          COALESCE(SUM(deal_value * COALESCE(close_probability, 20) / 100.0),0)::numeric AS weighted_value
        FROM revenue_records
        WHERE stage NOT IN ('dead','churned')
        GROUP BY date_trunc('quarter', COALESCE(expected_close_date, updated_at))
        ORDER BY min(COALESCE(expected_close_date, updated_at))
        LIMIT 8
      `,
      sql`
        SELECT to_stage AS stage, COUNT(*)::int AS movements
        FROM stage_history
        GROUP BY to_stage
        ORDER BY movements DESC
      `,
    ]);
    return res.json({ summary: summary[0], byCategory, byRep, byIndustry, byService, monthly, quarterly, stageConversions });
  }

  // ── tasks and next actions ────────────────────────────────────────────────
  if (resource === "tasks" && req.method === "GET") {
    const [leadTasks, opportunityTasks, crmTasks] = await Promise.all([
      sql`
        SELECT
          id, id AS lead_id, business_name, owner_name, email, stage, assigned_owner,
          deal_value, next_action AS title, 'lead_next_action' AS task_type,
          'open' AS status, next_action_at AS due_at, 'normal' AS priority
        FROM leads
        WHERE next_action IS NOT NULL OR next_action_at IS NOT NULL
      `,
      sql`
        SELECT
          id, id AS opportunity_id, account_id, lead_id, account_name AS business_name,
          contact_name AS owner_name, contact_email AS email, stage, assigned_owner,
          deal_value, next_action AS title, 'opportunity_next_action' AS task_type,
          'open' AS status, next_action_at AS due_at, 'normal' AS priority
        FROM opportunities
        WHERE next_action IS NOT NULL OR next_action_at IS NOT NULL
      `,
      sql`
        SELECT
          t.*,
          COALESCE(l.business_name, o.account_name) AS business_name,
          COALESCE(l.owner_name, o.contact_name) AS owner_name,
          COALESCE(l.email, o.contact_email) AS email,
          COALESCE(l.stage, o.stage) AS stage,
          COALESCE(l.deal_value, o.deal_value) AS deal_value,
          COALESCE(l.assigned_owner, o.assigned_owner, t.assigned_to) AS assigned_owner,
          o.account_name
        FROM crm_tasks t
        LEFT JOIN leads l ON l.id = t.lead_id
        LEFT JOIN opportunities o ON o.id = t.opportunity_id
        WHERE t.status = 'open'
      `,
    ]);
    const rows = [...leadTasks, ...opportunityTasks, ...crmTasks].sort((a, b) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    }).slice(0, 200);
    return res.json(rows);
  }

  if (resource === "tasks" && req.method === "POST") {
    const { lead_id, account_id, opportunity_id, title, task_type, due_at, assigned_to, priority } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const rows = await sql`
      INSERT INTO crm_tasks (lead_id, account_id, opportunity_id, title, task_type, due_at, assigned_to, priority)
      VALUES (${lead_id || null}, ${account_id || null}, ${opportunity_id || null}, ${title}, ${task_type || "follow_up"}, ${due_at || null}, ${assigned_to || null}, ${priority || "normal"})
      RETURNING *
    `;
    return res.json(rows[0]);
  }

  if (resource === "tasks" && req.method === "PATCH") {
    const { id, status, outcome } = req.body;
    if (!id || !status) return res.status(400).json({ error: "id and status required" });
    await sql`
      UPDATE crm_tasks
      SET status = ${status}, outcome = COALESCE(${outcome || null}, outcome),
        completed_at = CASE WHEN ${status} = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = ${id}
    `;
    return res.json({ ok: true });
  }

  // ── standalone opportunities ──────────────────────────────────────────────
  if (resource === "opportunities" && req.method === "GET") {
    const { stage, search, account } = req.query;
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    let rows;
    if (search) {
      const q = `%${search}%`;
      rows = await sql`
        SELECT o.*, a.website, a.industry
        FROM opportunities o
        LEFT JOIN accounts a ON a.id = o.account_id
        WHERE o.name ILIKE ${q}
          OR o.account_name ILIKE ${q}
          OR o.contact_name ILIKE ${q}
          OR o.contact_email ILIKE ${q}
          OR o.assigned_owner ILIKE ${q}
          OR o.revenue_service ILIKE ${q}
        ORDER BY o.updated_at DESC
        LIMIT 200 OFFSET ${offset}
      `;
    } else if (account) {
      rows = await sql`
        SELECT o.*, a.website, a.industry
        FROM opportunities o
        LEFT JOIN accounts a ON a.id = o.account_id
        WHERE lower(o.account_name) = lower(${account})
        ORDER BY o.updated_at DESC
        LIMIT 200 OFFSET ${offset}
      `;
    } else if (stage) {
      rows = await sql`
        SELECT o.*, a.website, a.industry
        FROM opportunities o
        LEFT JOIN accounts a ON a.id = o.account_id
        WHERE o.stage = ${stage}
        ORDER BY o.updated_at DESC
        LIMIT 200 OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT o.*, a.website, a.industry
        FROM opportunities o
        LEFT JOIN accounts a ON a.id = o.account_id
        ORDER BY o.updated_at DESC
        LIMIT 200 OFFSET ${offset}
      `;
    }
    return res.json(rows);
  }

  if (resource === "opportunities" && req.method === "POST") {
    const {
      name, account_name, lead_id, contact_name, contact_email, stage = "found",
      deal_value = 0, forecast_category, close_probability, expected_close_date,
      assigned_owner, revenue_service, next_action, next_action_at, notes,
      ai_summary, recommended_next_step,
    } = req.body;
    const opportunityName = (name || "").trim();
    const accountName = (account_name || "").trim();
    if (!opportunityName || !accountName) return res.status(400).json({ error: "name and account_name required" });
    if (!ENTERPRISE_STAGES.includes(stage)) return res.status(400).json({ error: `Invalid stage. Allowed: ${ENTERPRISE_STAGES.join(", ")}` });
    const account = await findOrCreateAccount({ name: accountName, assigned_owner });
    const rows = await sql`
      INSERT INTO opportunities (
        account_id, lead_id, name, account_name, contact_name, contact_email, stage,
        deal_value, forecast_category, close_probability, expected_close_date,
        assigned_owner, revenue_service, next_action, next_action_at, notes,
        ai_summary, recommended_next_step
      )
      VALUES (
        ${account?.id || null}, ${lead_id || null}, ${opportunityName}, ${accountName},
        ${contact_name || null}, ${contact_email || null}, ${stage},
        ${Number(deal_value) || 0}, ${inferredForecast(stage, forecast_category)},
        ${inferredProbability(stage, close_probability)}, ${expected_close_date || null},
        ${assigned_owner || null}, ${revenue_service || null}, ${next_action || null},
        ${next_action_at || null}, ${notes || null}, ${ai_summary || null},
        ${recommended_next_step || null}
      )
      RETURNING *
    `;
    await sql`
      INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, actor, reason)
      VALUES (${rows[0].id}, null, ${stage}, 'human:crm', 'Opportunity created')
    `;
    return res.json(rows[0]);
  }

  if (resource === "opportunities" && req.method === "PATCH") {
    const {
      id, name, account_name, contact_name, contact_email, stage, deal_value,
      forecast_category, close_probability, expected_close_date, assigned_owner,
      revenue_service, next_action, next_action_at, lost_reason, notes,
      ai_summary, recommended_next_step, reason,
    } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    const beforeRows = await sql`SELECT * FROM opportunities WHERE id = ${id}`;
    const before = beforeRows[0];
    if (!before) return res.status(404).json({ error: "Opportunity not found" });
    if ((stage === "dead" || stage === "churned") && !lost_reason && !before.lost_reason) {
      return res.status(400).json({ error: `lost_reason required when marking a deal lost. Allowed: ${LOST_REASONS.join(", ")}` });
    }
    if (account_name !== undefined) {
      const account = await findOrCreateAccount({ name: account_name, assigned_owner: assigned_owner || before.assigned_owner });
      await sql`UPDATE opportunities SET account_name = ${account_name || before.account_name}, account_id = ${account?.id || before.account_id || null}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (name !== undefined) await sql`UPDATE opportunities SET name = ${name || before.name}, updated_at = NOW() WHERE id = ${id}`;
    if (contact_name !== undefined) await sql`UPDATE opportunities SET contact_name = ${contact_name || null}, updated_at = NOW() WHERE id = ${id}`;
    if (contact_email !== undefined) await sql`UPDATE opportunities SET contact_email = ${contact_email || null}, updated_at = NOW() WHERE id = ${id}`;
    if (stage !== undefined) {
      if (!ENTERPRISE_STAGES.includes(stage)) return res.status(400).json({ error: `Invalid stage. Allowed: ${ENTERPRISE_STAGES.join(", ")}` });
      await sql`
        UPDATE opportunities
        SET stage = ${stage},
          forecast_category = ${inferredForecast(stage, forecast_category ?? before.forecast_category)},
          close_probability = ${inferredProbability(stage, close_probability ?? before.close_probability)},
          lost_reason = COALESCE(${lost_reason || null}, lost_reason),
          updated_at = NOW()
        WHERE id = ${id}
      `;
      if (before.stage !== stage) {
        await sql`
          INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, actor, reason)
          VALUES (${id}, ${before.stage || null}, ${stage}, 'human:crm', ${reason || null})
        `;
      }
    }
    if (deal_value !== undefined) await sql`UPDATE opportunities SET deal_value = ${Number(deal_value) || 0}, updated_at = NOW() WHERE id = ${id}`;
    if (forecast_category !== undefined) {
      if (!FORECAST_CATEGORIES.includes(forecast_category)) return res.status(400).json({ error: `Invalid forecast_category. Allowed: ${FORECAST_CATEGORIES.join(", ")}` });
      await sql`UPDATE opportunities SET forecast_category = ${forecast_category}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (close_probability !== undefined) await sql`UPDATE opportunities SET close_probability = ${Math.min(100, Math.max(0, Number(close_probability) || 0))}, updated_at = NOW() WHERE id = ${id}`;
    if (expected_close_date !== undefined) await sql`UPDATE opportunities SET expected_close_date = ${expected_close_date || null}, updated_at = NOW() WHERE id = ${id}`;
    if (assigned_owner !== undefined) await sql`UPDATE opportunities SET assigned_owner = ${assigned_owner || null}, updated_at = NOW() WHERE id = ${id}`;
    if (revenue_service !== undefined) await sql`UPDATE opportunities SET revenue_service = ${revenue_service || null}, updated_at = NOW() WHERE id = ${id}`;
    if (next_action !== undefined) await sql`UPDATE opportunities SET next_action = ${next_action || null}, updated_at = NOW() WHERE id = ${id}`;
    if (next_action_at !== undefined) await sql`UPDATE opportunities SET next_action_at = ${next_action_at || null}, updated_at = NOW() WHERE id = ${id}`;
    if (lost_reason !== undefined) await sql`UPDATE opportunities SET lost_reason = ${lost_reason || null}, updated_at = NOW() WHERE id = ${id}`;
    if (notes !== undefined) await sql`UPDATE opportunities SET notes = ${notes || null}, updated_at = NOW() WHERE id = ${id}`;
    if (ai_summary !== undefined) await sql`UPDATE opportunities SET ai_summary = ${ai_summary || null}, updated_at = NOW() WHERE id = ${id}`;
    if (recommended_next_step !== undefined) await sql`UPDATE opportunities SET recommended_next_step = ${recommended_next_step || null}, updated_at = NOW() WHERE id = ${id}`;
    const rows = await sql`SELECT * FROM opportunities WHERE id = ${id}`;
    const diff = diffFields(before, req.body, [
      "name", "stage", "deal_value", "forecast_category", "close_probability",
      "expected_close_date", "assigned_owner", "revenue_service", "next_action",
      "next_action_at", "lost_reason", "account_name", "contact_name", "contact_email",
    ]);
    if (diff) await logAudit("human:crm", "update_opportunity", { before: diff.before, after: diff.after, reason: reason || null });
    return res.json(rows[0]);
  }

  // ── account-level CRM ─────────────────────────────────────────────────────
  if (resource === "accounts" && req.method === "GET") {
    const accounts = await sql`
      WITH account_rows AS (
        SELECT
          COALESCE(a.id, 0) AS id,
          COALESCE(a.name, l.business_name) AS name,
          COALESCE(a.website, l.website_url, l.website) AS website,
          COALESCE(a.industry, l.niche) AS industry,
          COALESCE(a.city, l.city) AS city,
          COALESCE(a.state, l.state) AS state,
          COALESCE(a.assigned_owner, l.assigned_owner, 'Unassigned') AS assigned_owner,
          COALESCE(a.tags, l.tags) AS tags,
          1::int AS contacts,
          0::int AS standalone_opportunities,
          COALESCE(l.deal_value, 0)::numeric AS pipeline_value,
          l.updated_at AS last_activity_at,
          CASE WHEN l.stage NOT IN ('client','dead','churned') THEN 1 ELSE 0 END::int AS open_opportunities,
          CASE WHEN l.stage = 'client' THEN 1 ELSE 0 END::int AS won_opportunities,
          CASE WHEN l.next_action IS NULL OR l.next_action_at IS NULL THEN 1 ELSE 0 END::int AS missing_followup,
          CASE WHEN l.last_touched < NOW() - INTERVAL '14 days' OR l.last_touched IS NULL THEN 1 ELSE 0 END::int AS stale_records
        FROM leads l
        LEFT JOIN accounts a ON a.id = l.account_id

        UNION ALL

        SELECT
          COALESCE(a.id, 0) AS id,
          COALESCE(a.name, o.account_name) AS name,
          a.website AS website,
          a.industry AS industry,
          a.city AS city,
          a.state AS state,
          COALESCE(a.assigned_owner, o.assigned_owner, 'Unassigned') AS assigned_owner,
          a.tags AS tags,
          0::int AS contacts,
          1::int AS standalone_opportunities,
          COALESCE(o.deal_value, 0)::numeric AS pipeline_value,
          o.updated_at AS last_activity_at,
          CASE WHEN o.stage NOT IN ('client','dead','churned') THEN 1 ELSE 0 END::int AS open_opportunities,
          CASE WHEN o.stage = 'client' THEN 1 ELSE 0 END::int AS won_opportunities,
          CASE WHEN o.next_action IS NULL OR o.next_action_at IS NULL THEN 1 ELSE 0 END::int AS missing_followup,
          CASE WHEN o.updated_at < NOW() - INTERVAL '14 days' THEN 1 ELSE 0 END::int AS stale_records
        FROM opportunities o
        LEFT JOIN accounts a ON a.id = o.account_id
      )
      SELECT
        MIN(id)::int AS id,
        name,
        MAX(website) AS website,
        MAX(industry) AS industry,
        MAX(city) AS city,
        MAX(state) AS state,
        MAX(assigned_owner) AS assigned_owner,
        MAX(tags) AS tags,
        SUM(contacts)::int AS contacts,
        SUM(standalone_opportunities)::int AS opportunities,
        COALESCE(SUM(pipeline_value),0)::numeric AS pipeline_value,
        MAX(last_activity_at) AS last_activity_at,
        SUM(open_opportunities)::int AS open_opportunities,
        SUM(won_opportunities)::int AS won_opportunities,
        LEAST(100, GREATEST(0, 100
          - SUM(missing_followup)::int * 12
          - SUM(stale_records)::int * 8
        ))::int AS health_score
      FROM account_rows
      GROUP BY lower(name), name
      ORDER BY pipeline_value DESC, last_activity_at DESC NULLS LAST
      LIMIT 200
    `;
    return res.json(accounts);
  }

  if (resource === "accounts" && req.method === "PATCH") {
    const { id, name, website, industry, city, state, assigned_owner, tags, notes } = req.body;
    if (!id && !name) return res.status(400).json({ error: "id or name required" });
    const account = id
      ? (await sql`SELECT * FROM accounts WHERE id = ${id} LIMIT 1`)[0]
      : await findOrCreateAccount({ name });
    if (!account) return res.status(404).json({ error: "Account not found" });
    if (name !== undefined) await sql`UPDATE accounts SET name = ${name || account.name}, updated_at = NOW() WHERE id = ${account.id}`;
    if (website !== undefined) await sql`UPDATE accounts SET website = ${website || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (industry !== undefined) await sql`UPDATE accounts SET industry = ${industry || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (city !== undefined) await sql`UPDATE accounts SET city = ${city || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (state !== undefined) await sql`UPDATE accounts SET state = ${state || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (assigned_owner !== undefined) await sql`UPDATE accounts SET assigned_owner = ${assigned_owner || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (tags !== undefined) await sql`UPDATE accounts SET tags = ${tags || null}, updated_at = NOW() WHERE id = ${account.id}`;
    if (notes !== undefined) await sql`UPDATE accounts SET notes = ${notes || null}, updated_at = NOW() WHERE id = ${account.id}`;
    const rows = await sql`SELECT * FROM accounts WHERE id = ${account.id}`;
    const diff = diffFields(account, req.body, ["name", "website", "industry", "city", "state", "assigned_owner", "tags", "notes"]);
    if (diff) await logAudit("human:crm", "update_account", { before: diff.before, after: diff.after });
    return res.json(rows[0]);
  }

  if (resource === "account-detail" && req.method === "GET") {
    const name = (req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "name required" });
    const accountRows = await sql`SELECT * FROM accounts WHERE lower(name) = lower(${name}) ORDER BY id ASC LIMIT 1`;
    const contacts = await sql`SELECT * FROM leads WHERE lower(business_name) = lower(${name}) ORDER BY updated_at DESC LIMIT 100`;
    const opportunities = await sql`
      SELECT *
      FROM opportunities
      WHERE lower(account_name) = lower(${name})
        OR account_id = ${accountRows[0]?.id || -1}
      ORDER BY updated_at DESC
      LIMIT 100
    `;
    const timeline = await sql`
      SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email
      FROM touches t JOIN leads l ON l.id = t.lead_id
      WHERE lower(l.business_name) = lower(${name})
      ORDER BY t.created_at DESC
      LIMIT 100
    `;
    const stageHistory = await sql`
      SELECT h.*, l.business_name, l.owner_name
      FROM stage_history h JOIN leads l ON l.id = h.lead_id
      WHERE lower(l.business_name) = lower(${name})
      ORDER BY
        h.created_at DESC
      LIMIT 100
    `;
    const opportunityStageHistory = await sql`
      SELECT h.*, o.name AS opportunity_name, o.account_name, o.contact_name
      FROM opportunity_stage_history h JOIN opportunities o ON o.id = h.opportunity_id
      WHERE lower(o.account_name) = lower(${name})
        OR o.account_id = ${accountRows[0]?.id || -1}
      ORDER BY h.created_at DESC
      LIMIT 100
    `;
    return res.json({ account: accountRows[0] || { name }, contacts, opportunities, timeline, stageHistory, opportunityStageHistory });
  }

  // ── cadence library ───────────────────────────────────────────────────────
  if (resource === "cadences") {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM cadences ORDER BY created_at DESC`;
      return res.json(rows);
    }
    if (req.method === "POST") {
      const { name, description, steps } = req.body;
      if (!name || !Array.isArray(steps)) return res.status(400).json({ error: "name and steps[] required" });
      const rows = await sql`
        INSERT INTO cadences (name, description, steps)
        VALUES (${name}, ${description || null}, ${JSON.stringify(steps)}::jsonb)
        ON CONFLICT (name) DO UPDATE SET description = ${description || null}, steps = ${JSON.stringify(steps)}::jsonb, updated_at = NOW()
        RETURNING *
      `;
      return res.json(rows[0]);
    }
  }

  if (resource === "cadence-enrollments") {
    if (req.method === "GET") {
      const filterLeadId = req.query.lead_id ? Number(req.query.lead_id) : null;
      const filterOppId  = req.query.opportunity_id ? Number(req.query.opportunity_id) : null;

      // When filtering to a specific record, return just the matching rows (no summary).
      if (filterLeadId || filterOppId) {
        const rows = filterLeadId
          ? await sql`
              SELECT e.*, c.name AS cadence_name, c.steps
              FROM cadence_enrollments e
              LEFT JOIN cadences c ON c.id = e.cadence_id
              WHERE e.lead_id = ${filterLeadId} AND e.status NOT IN ('removed')
              ORDER BY e.updated_at DESC
            `
          : await sql`
              SELECT e.*, c.name AS cadence_name, c.steps
              FROM cadence_enrollments e
              LEFT JOIN cadences c ON c.id = e.cadence_id
              WHERE e.opportunity_id = ${filterOppId} AND e.status NOT IN ('removed')
              ORDER BY e.updated_at DESC
            `;
        return res.json({ summary: null, rows });
      }

      const [summary, rows] = await Promise.all([
        sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'active')::int AS active,
            COUNT(*) FILTER (WHERE status = 'paused')::int AS paused,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'active' AND next_step_at < NOW())::int AS overdue,
            COUNT(*) FILTER (WHERE status = 'active' AND next_step_at::date = CURRENT_DATE)::int AS due_today
          FROM cadence_enrollments
        `,
        sql`
          SELECT
            e.*, c.name AS cadence_name, c.steps,
            l.business_name, l.owner_name, l.email,
            o.name AS opportunity_name, o.account_name, o.contact_name, o.contact_email,
            a.name AS account_name_direct
          FROM cadence_enrollments e
          LEFT JOIN cadences c ON c.id = e.cadence_id
          LEFT JOIN leads l ON l.id = e.lead_id
          LEFT JOIN opportunities o ON o.id = e.opportunity_id
          LEFT JOIN accounts a ON a.id = e.account_id
          ORDER BY e.next_step_at ASC NULLS LAST, e.updated_at DESC
          LIMIT 200
        `,
      ]);
      return res.json({ summary: summary[0], rows });
    }

    if (req.method === "POST") {
      const { cadence_id, lead_id, opportunity_id, account_id, next_step_at } = req.body;
      if (!cadence_id || (!lead_id && !opportunity_id && !account_id)) {
        return res.status(400).json({ error: "cadence_id and one target id required" });
      }
      const cadenceRows = await sql`SELECT * FROM cadences WHERE id = ${cadence_id}`;
      const cadence = cadenceRows[0];
      if (!cadence) return res.status(404).json({ error: "Cadence not found" });
      const steps = Array.isArray(cadence.steps) ? cadence.steps : [];
      const rows = await sql`
        INSERT INTO cadence_enrollments (cadence_id, lead_id, opportunity_id, account_id, current_step, next_step_at)
        VALUES (${cadence_id}, ${lead_id || null}, ${opportunity_id || null}, ${account_id || null}, 0, ${next_step_at || nextCadenceDate(steps, 0, 0)})
        RETURNING *
      `;
      return res.json(rows[0]);
    }

    if (req.method === "PATCH") {
      const { id, action, outcome } = req.body;
      if (!id || !action) return res.status(400).json({ error: "id and action required" });
      const enrollmentRows = await sql`
        SELECT e.*, c.steps
        FROM cadence_enrollments e
        LEFT JOIN cadences c ON c.id = e.cadence_id
        WHERE e.id = ${id}
      `;
      const enrollment = enrollmentRows[0];
      if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
      const steps = Array.isArray(enrollment.steps) ? enrollment.steps : [];

      if (action === "pause" || action === "resume" || action === "remove") {
        const status = action === "pause" ? "paused" : action === "resume" ? "active" : "removed";
        await sql`UPDATE cadence_enrollments SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
      } else if (action === "restart") {
        await sql`
          UPDATE cadence_enrollments
          SET status = 'active', current_step = 0, next_step_at = ${nextCadenceDate(steps, 0, 0)}, updated_at = NOW()
          WHERE id = ${id}
        `;
      } else if (action === "complete_step") {
        const currentStep = Number(enrollment.current_step || 0);
        const nextStep = currentStep + 1;
        const hasNext = nextStep < steps.length;
        await sql`
          INSERT INTO cadence_step_events (enrollment_id, step_index, action, outcome)
          VALUES (${id}, ${currentStep}, 'completed', ${outcome || null})
        `;
        await sql`
          UPDATE cadence_enrollments
          SET current_step = ${hasNext ? nextStep : currentStep},
            status = ${hasNext ? "active" : "completed"},
            next_step_at = ${hasNext ? nextCadenceDate(steps, currentStep, nextStep) : null},
            last_completed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${id}
        `;
      } else {
        return res.status(400).json({ error: "Unknown action" });
      }
      const rows = await sql`SELECT * FROM cadence_enrollments WHERE id = ${id}`;
      return res.json(rows[0]);
    }
  }

  // ── pipeline health monitoring ────────────────────────────────────────────
  if (resource === "health" && req.method === "GET") {
    const [summary, risks] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE stage NOT IN ('client','dead','churned'))::int AS open_opportunities,
          COUNT(*) FILTER (WHERE stage NOT IN ('client','dead','churned') AND (next_action IS NULL OR next_action_at IS NULL))::int AS missing_next_action,
          COUNT(*) FILTER (WHERE stage NOT IN ('client','dead','churned') AND COALESCE(deal_value,0) = 0)::int AS missing_deal_value,
          COUNT(*) FILTER (WHERE stage NOT IN ('client','dead','churned') AND (last_touched IS NULL OR last_touched < NOW() - INTERVAL '14 days'))::int AS stale_opportunities
        FROM leads
      `,
      sql`
        SELECT *,
          ARRAY_REMOVE(ARRAY[
            CASE WHEN next_action IS NULL OR next_action_at IS NULL THEN 'Missing next action' END,
            CASE WHEN COALESCE(deal_value,0) = 0 THEN 'Missing deal value' END,
            CASE WHEN last_touched IS NULL OR last_touched < NOW() - INTERVAL '14 days' THEN 'No recent activity' END
          ], NULL) AS risk_flags
        FROM leads
        WHERE stage NOT IN ('client','dead','churned')
          AND (
            next_action IS NULL OR next_action_at IS NULL OR
            COALESCE(deal_value,0) = 0 OR
            last_touched IS NULL OR last_touched < NOW() - INTERVAL '14 days'
          )
        ORDER BY lead_score DESC, updated_at DESC
        LIMIT 100
      `,
    ]);
    const s = summary[0];
    const penalties = Number(s.missing_next_action || 0) + Number(s.missing_deal_value || 0) + Number(s.stale_opportunities || 0);
    const denom = Math.max(1, Number(s.open_opportunities || 0) * 3);
    return res.json({ summary: { ...s, healthScore: Math.max(0, Math.round(100 - (penalties / denom) * 100)) }, risks });
  }

  // ── saved views ───────────────────────────────────────────────────────────
  if (resource === "saved-views") {
    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM saved_views ORDER BY created_at DESC LIMIT 100`;
      return res.json(rows);
    }
    if (req.method === "POST") {
      const { name, view_type, filters } = req.body;
      if (!name || !view_type) return res.status(400).json({ error: "name and view_type required" });
      const rows = await sql`
        INSERT INTO saved_views (name, view_type, filters)
        VALUES (${name}, ${view_type}, ${JSON.stringify(filters || {})}::jsonb)
        RETURNING *
      `;
      return res.json(rows[0]);
    }
  }

  // ── global search ─────────────────────────────────────────────────────────
  if (resource === "search" && req.method === "GET") {
    const qRaw = (req.query.q || "").trim();
    if (!qRaw) return res.json([]);
    const q = `%${qRaw}%`;
    const results = await sql`
      SELECT id, business_name, owner_name, email, phone, niche, stage, tags, assigned_owner, lead_score, deal_value, updated_at
      FROM leads
      WHERE business_name ILIKE ${q}
        OR owner_name ILIKE ${q}
        OR email ILIKE ${q}
        OR phone ILIKE ${q}
        OR niche ILIKE ${q}
        OR stage ILIKE ${q}
        OR tags ILIKE ${q}
        OR assigned_owner ILIKE ${q}
      ORDER BY updated_at DESC
      LIMIT 30
    `;
    return res.json(results);
  }

  // ── activity (touches feed) ───────────────────────────────────────────────
  if (resource === "activity" && req.method === "GET") {
    const { lead_id } = req.query;
    const [touches, stages, tasks] = lead_id
      ? await Promise.all([
        sql`
          SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email
          FROM touches t JOIN leads l ON l.id = t.lead_id
          WHERE t.lead_id = ${lead_id}
          ORDER BY t.created_at DESC LIMIT 200
        `,
        sql`
          SELECT h.id, h.lead_id, 'stage_change' AS type, 'pipeline' AS channel, 'completed' AS status,
            CONCAT('Stage changed from ', COALESCE(h.from_stage, 'unknown'), ' to ', h.to_stage) AS subject,
            h.reason AS notes, NULL AS body, NULL AS external_id, NULL AS recipient,
            NULL AS opened_at, NULL AS clicked_at, NULL AS bounced_at, h.created_at,
            l.business_name, l.owner_name, l.email AS lead_email
          FROM stage_history h JOIN leads l ON l.id = h.lead_id
          WHERE h.lead_id = ${lead_id}
          ORDER BY h.created_at DESC LIMIT 100
        `,
        sql`
          SELECT t.id, t.lead_id, 'task' AS type, t.task_type AS channel, t.status,
            t.title AS subject, t.outcome AS notes, NULL AS body, NULL AS external_id, NULL AS recipient,
            NULL AS opened_at, NULL AS clicked_at, NULL AS bounced_at, COALESCE(t.completed_at, t.created_at) AS created_at,
            l.business_name, l.owner_name, l.email AS lead_email
          FROM crm_tasks t LEFT JOIN leads l ON l.id = t.lead_id
          WHERE t.lead_id = ${lead_id}
          ORDER BY COALESCE(t.completed_at, t.created_at) DESC LIMIT 100
        `,
      ])
      : await Promise.all([
        sql`
          SELECT t.*, l.business_name, l.owner_name, l.email AS lead_email
          FROM touches t JOIN leads l ON l.id = t.lead_id
          ORDER BY t.created_at DESC LIMIT 200
        `,
        sql`
          SELECT h.id, h.lead_id, 'stage_change' AS type, 'pipeline' AS channel, 'completed' AS status,
            CONCAT('Stage changed from ', COALESCE(h.from_stage, 'unknown'), ' to ', h.to_stage) AS subject,
            h.reason AS notes, NULL AS body, NULL AS external_id, NULL AS recipient,
            NULL AS opened_at, NULL AS clicked_at, NULL AS bounced_at, h.created_at,
            l.business_name, l.owner_name, l.email AS lead_email
          FROM stage_history h JOIN leads l ON l.id = h.lead_id
          ORDER BY h.created_at DESC LIMIT 100
        `,
        sql`
          SELECT t.id, t.lead_id, 'task' AS type, t.task_type AS channel, t.status,
            t.title AS subject, t.outcome AS notes, NULL AS body, NULL AS external_id, NULL AS recipient,
            NULL AS opened_at, NULL AS clicked_at, NULL AS bounced_at, COALESCE(t.completed_at, t.created_at) AS created_at,
            l.business_name, l.owner_name, l.email AS lead_email
          FROM crm_tasks t LEFT JOIN leads l ON l.id = t.lead_id
          ORDER BY COALESCE(t.completed_at, t.created_at) DESC LIMIT 100
        `,
      ]);
    return res.json([...touches, ...stages, ...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 250));
  }

  // ── leads ──────────────────────────────────────────────────────────────────
  if (resource === "leads" && req.method === "GET") {
    const { stage, search } = req.query;
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    let leads;
    if (search) {
      const q = `%${search}%`;
      leads = await sql`
        SELECT * FROM leads
        WHERE business_name ILIKE ${q} OR owner_name ILIKE ${q} OR email ILIKE ${q}
          OR phone ILIKE ${q} OR niche ILIKE ${q} OR stage ILIKE ${q}
          OR tags ILIKE ${q} OR assigned_owner ILIKE ${q}
        ORDER BY updated_at DESC LIMIT 200 OFFSET ${offset}`;
    } else if (stage) {
      leads = await sql`SELECT * FROM leads WHERE stage=${stage} ORDER BY updated_at DESC LIMIT 200 OFFSET ${offset}`;
    } else {
      leads = await sql`SELECT * FROM leads ORDER BY updated_at DESC LIMIT 200 OFFSET ${offset}`;
    }
    return res.json(leads);
  }

  // PATCH /leads — per-lead auto-send override, and manual edits to
  // stage / tier / notes from the lead detail drawer
  if (resource === "leads" && req.method === "PATCH") {
    const {
      id, auto_send_emails, stage, lead_tier, notes, deal_value, forecast_category,
      close_probability, expected_close_date, assigned_owner, job_title, linkedin,
      current_cadence, next_action, next_action_at, lost_reason, revenue_service,
      tags, company_size, revenue_estimate, locations_count, ai_summary,
      recommended_next_step,
    } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    const beforeRows = await sql`SELECT * FROM leads WHERE id = ${id}`;
    const before = beforeRows[0];
    if (!before) return res.status(404).json({ error: "Lead not found" });
    if ((stage === "dead" || stage === "churned") && !lost_reason && !before.lost_reason) {
      return res.status(400).json({ error: `lost_reason required when marking a deal lost. Allowed: ${LOST_REASONS.join(", ")}` });
    }
    if (auto_send_emails !== undefined) {
      await sql`UPDATE leads SET auto_send_emails = ${auto_send_emails}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (stage !== undefined) {
      const nextForecast = inferredForecast(stage, forecast_category ?? before.forecast_category);
      const nextProbability = inferredProbability(stage, close_probability ?? before.close_probability);
      await sql`
        UPDATE leads
        SET stage = ${stage}, forecast_category = ${nextForecast}, close_probability = ${nextProbability},
          last_touched = NOW(), updated_at = NOW()
        WHERE id = ${id}`;
      if (before.stage !== stage) {
        await sql`
          INSERT INTO stage_history (lead_id, from_stage, to_stage, actor, reason)
          VALUES (${id}, ${before.stage || null}, ${stage}, 'human:crm', ${req.body.reason || null})
        `;
      }
    }
    if (lead_tier !== undefined) {
      await sql`UPDATE leads SET lead_tier = ${lead_tier}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (notes !== undefined) {
      await sql`UPDATE leads SET notes = ${notes}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (deal_value !== undefined) await sql`UPDATE leads SET deal_value = ${deal_value || 0}, updated_at = NOW() WHERE id = ${id}`;
    if (forecast_category !== undefined) {
      if (!FORECAST_CATEGORIES.includes(forecast_category)) return res.status(400).json({ error: `Invalid forecast_category. Allowed: ${FORECAST_CATEGORIES.join(", ")}` });
      await sql`UPDATE leads SET forecast_category = ${forecast_category}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (close_probability !== undefined) await sql`UPDATE leads SET close_probability = ${Math.min(100, Math.max(0, Number(close_probability) || 0))}, updated_at = NOW() WHERE id = ${id}`;
    if (expected_close_date !== undefined) await sql`UPDATE leads SET expected_close_date = ${expected_close_date || null}, updated_at = NOW() WHERE id = ${id}`;
    if (assigned_owner !== undefined) await sql`UPDATE leads SET assigned_owner = ${assigned_owner || null}, updated_at = NOW() WHERE id = ${id}`;
    if (job_title !== undefined) await sql`UPDATE leads SET job_title = ${job_title || null}, updated_at = NOW() WHERE id = ${id}`;
    if (linkedin !== undefined) await sql`UPDATE leads SET linkedin = ${linkedin || null}, updated_at = NOW() WHERE id = ${id}`;
    if (current_cadence !== undefined) await sql`UPDATE leads SET current_cadence = ${current_cadence || null}, updated_at = NOW() WHERE id = ${id}`;
    if (next_action !== undefined) await sql`UPDATE leads SET next_action = ${next_action || null}, updated_at = NOW() WHERE id = ${id}`;
    if (next_action_at !== undefined) await sql`UPDATE leads SET next_action_at = ${next_action_at || null}, next_followup_at = ${next_action_at || null}, updated_at = NOW() WHERE id = ${id}`;
    if (lost_reason !== undefined) await sql`UPDATE leads SET lost_reason = ${lost_reason || null}, updated_at = NOW() WHERE id = ${id}`;
    if (revenue_service !== undefined) await sql`UPDATE leads SET revenue_service = ${revenue_service || null}, updated_at = NOW() WHERE id = ${id}`;
    if (tags !== undefined) await sql`UPDATE leads SET tags = ${tags || null}, updated_at = NOW() WHERE id = ${id}`;
    if (company_size !== undefined) await sql`UPDATE leads SET company_size = ${company_size || null}, updated_at = NOW() WHERE id = ${id}`;
    if (revenue_estimate !== undefined) await sql`UPDATE leads SET revenue_estimate = ${revenue_estimate || null}, updated_at = NOW() WHERE id = ${id}`;
    if (locations_count !== undefined) await sql`UPDATE leads SET locations_count = ${locations_count || null}, updated_at = NOW() WHERE id = ${id}`;
    if (ai_summary !== undefined) await sql`UPDATE leads SET ai_summary = ${ai_summary || null}, updated_at = NOW() WHERE id = ${id}`;
    if (recommended_next_step !== undefined) await sql`UPDATE leads SET recommended_next_step = ${recommended_next_step || null}, updated_at = NOW() WHERE id = ${id}`;
    const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
    const diff = diffFields(before, req.body, [
      "stage", "lead_tier", "auto_send_emails", "deal_value", "forecast_category",
      "close_probability", "expected_close_date", "assigned_owner", "job_title",
      "current_cadence", "next_action", "next_action_at", "lost_reason",
      "revenue_service", "tags", "company_size", "revenue_estimate", "notes",
    ]);
    if (diff) await logAudit("human:crm", "update_lead", { lead_id: id, before: diff.before, after: diff.after, reason: req.body.reason || null });
    return res.json(rows[0] || { ok: true });
  }

  if (resource === "bulk-leads" && req.method === "PATCH") {
    const { ids, stage, lead_tier, assigned_owner, next_action, next_action_at } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids[] required" });
    const cleanIds = ids.map(Number).filter(Boolean);
    if (cleanIds.length === 0) return res.status(400).json({ error: "valid ids[] required" });

    if (stage !== undefined) {
      if ((stage === "dead" || stage === "churned") && !req.body.lost_reason) {
        return res.status(400).json({ error: "lost_reason required for bulk lost updates" });
      }
      const beforeRows = await sql`SELECT id, stage FROM leads WHERE id = ANY(${cleanIds})`;
      await sql`
        UPDATE leads
        SET stage = ${stage},
          forecast_category = ${inferredForecast(stage, req.body.forecast_category)},
          close_probability = ${inferredProbability(stage, req.body.close_probability)},
          lost_reason = COALESCE(${req.body.lost_reason || null}, lost_reason),
          last_touched = NOW(),
          updated_at = NOW()
        WHERE id = ANY(${cleanIds})
      `;
      for (const row of beforeRows) {
        if (row.stage !== stage) {
          await sql`
            INSERT INTO stage_history (lead_id, from_stage, to_stage, actor, reason)
            VALUES (${row.id}, ${row.stage || null}, ${stage}, 'human:crm', ${req.body.reason || "Bulk update"})
          `;
        }
      }
    }
    if (lead_tier !== undefined) await sql`UPDATE leads SET lead_tier = ${lead_tier}, updated_at = NOW() WHERE id = ANY(${cleanIds})`;
    if (assigned_owner !== undefined) await sql`UPDATE leads SET assigned_owner = ${assigned_owner || null}, updated_at = NOW() WHERE id = ANY(${cleanIds})`;
    if (next_action !== undefined) await sql`UPDATE leads SET next_action = ${next_action || null}, updated_at = NOW() WHERE id = ANY(${cleanIds})`;
    if (next_action_at !== undefined) await sql`UPDATE leads SET next_action_at = ${next_action_at || null}, next_followup_at = ${next_action_at || null}, updated_at = NOW() WHERE id = ANY(${cleanIds})`;

    const updated = await sql`SELECT * FROM leads WHERE id = ANY(${cleanIds})`;
    const changed = {};
    if (stage !== undefined) changed.stage = stage;
    if (lead_tier !== undefined) changed.lead_tier = lead_tier;
    if (assigned_owner !== undefined) changed.assigned_owner = assigned_owner;
    if (next_action !== undefined) changed.next_action = next_action;
    if (Object.keys(changed).length) {
      await logAudit("human:crm", "bulk_update_leads", { after: { ...changed, lead_ids: cleanIds }, reason: req.body.reason || `Bulk update ${cleanIds.length} lead(s)` });
    }
    return res.json(updated);
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

  // ── audit (AI + human action log, read-only) ───────────────────────────────
  if (resource === "audit" && req.method === "GET") {
    const entries = await sql`
      SELECT a.*, l.business_name
      FROM audit_log a LEFT JOIN leads l ON l.id = a.lead_id
      ORDER BY a.created_at DESC LIMIT 200`;
    return res.json(entries);
  }

  // ── appointments ─────────────────────────────────────────────────────────
  if (resource === "appointments") {
    if (req.method === "GET") {
      const appointments = await sql`
        SELECT a.*, l.business_name AS lead_business_name, l.stage, l.lead_tier
        FROM appointments a LEFT JOIN leads l ON l.id = a.lead_id
        ORDER BY a.start_at DESC LIMIT 200`;
      return res.json(appointments);
    }
    if (req.method === "PATCH") {
      const { id, status } = req.body;
      const allowed = ["booked", "completed", "no_show", "cancelled"];
      if (!id || !allowed.includes(status)) {
        return res.status(400).json({ error: `id and status (${allowed.join("/")}) required` });
      }
      await sql`UPDATE appointments SET status=${status}, updated_at=NOW() WHERE id=${id}`;
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
  Corner Systems · <a href="https://cornersystems.co" style="color:#999">cornersystems.co</a>
</div></div>`;

    const result = await resend.emails.send({
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
          replyTo: "hello@cornersystems.co",
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

  // ── inbox ─────────────────────────────────────────────────────────────────
  if (resource === "inbox" && req.method === "GET") {
    const messages = await sql`
      SELECT
        t.id, t.created_at, t.subject, t.body, t.channel, t.type,
        t.lead_id, t.recipient,
        l.business_name, l.owner_name, l.email AS lead_email, l.stage, l.lead_tier
      FROM touches t
      LEFT JOIN leads l ON l.id = t.lead_id
      WHERE t.status = 'received'
      ORDER BY t.created_at DESC
      LIMIT 200
    `;
    return res.json(messages);
  }

  // ── outbox ────────────────────────────────────────────────────────────────
  if (resource === "outbox" && req.method === "GET") {
    const messages = await sql`
      SELECT
        t.id, t.created_at, t.subject, t.body, t.channel, t.type, t.status,
        t.lead_id, COALESCE(t.recipient, l.email) AS recipient,
        t.opened_at, t.clicked_at, t.bounced_at, t.external_id,
        l.business_name, l.owner_name, l.email AS lead_email, l.stage, l.lead_tier
      FROM touches t
      LEFT JOIN leads l ON l.id = t.lead_id
      WHERE t.type = 'email' AND t.status IN ('sent', 'failed')
      ORDER BY t.created_at DESC
      LIMIT 200
    `;
    return res.json(messages);
  }

  // ── settings ───────────────────────────────────────────────────────────────
  if (resource === "settings") {
    if (req.method === "GET") {
      const autoSendDefault = await getSetting("auto_send_emails_default", "false");
      const policy = await getSendPolicy();
      return res.json({ auto_send_emails_default: autoSendDefault === "true", ai_send_policy: policy });
    }
    if (req.method === "PATCH") {
      const { auto_send_emails_default, ai_send_policy } = req.body;
      if (auto_send_emails_default === undefined && ai_send_policy === undefined) {
        return res.status(400).json({ error: "auto_send_emails_default or ai_send_policy required" });
      }
      if (auto_send_emails_default !== undefined) {
        if (typeof auto_send_emails_default !== "boolean") {
          return res.status(400).json({ error: "auto_send_emails_default must be boolean" });
        }
        await setSetting("auto_send_emails_default", auto_send_emails_default ? "true" : "false");
      }
      let policy;
      if (ai_send_policy !== undefined) {
        policy = await setSendPolicy(ai_send_policy);
      }
      return res.json({ ok: true, ...(policy ? { ai_send_policy: policy } : {}) });
    }
  }

  return res.status(404).json({ error: `Unknown resource: ${resource}` });
}
