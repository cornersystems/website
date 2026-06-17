import { neon } from "@neondatabase/serverless";

// Lazy init — if DATABASE_URL is missing we want a readable error from the
// handler, not a module-load crash (FUNCTION_INVOCATION_FAILED).
let _sql = null;
function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in Vercel environment variables");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export function sql(strings, ...values) {
  return getSql()(strings, ...values);
}

export function normEmail(email) {
  const e = (email || "").trim().toLowerCase();
  return e || null;
}

export function normPhone(phone) {
  const p = (phone || "").replace(/\D/g, "");
  return p || null;
}

let schemaReady = false;
export async function ensureSchema() {
  if (schemaReady) return;
  await initSchema();
  schemaReady = true;
}

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id              SERIAL PRIMARY KEY,
      account_id      INTEGER,
      business_name   TEXT NOT NULL,
      owner_name      TEXT,
      city            TEXT,
      state           TEXT,
      phone           TEXT,
      email           TEXT,
      website         TEXT,
      instagram       TEXT,
      lead_score      INTEGER DEFAULT 0,
      pain_signal     TEXT,
      niche           TEXT,
      notes           TEXT,
      stage           TEXT NOT NULL DEFAULT 'found',
      source          TEXT,
      contact_type    TEXT DEFAULT 'prospect',
      lead_tier       TEXT DEFAULT 'unknown',
      conversation_id TEXT,
      last_touched    TIMESTAMPTZ,
      auto_send_emails BOOLEAN,
      google_maps     TEXT,
      has_website     BOOLEAN DEFAULT FALSE,
      website_url     TEXT,
      has_chatbot     BOOLEAN DEFAULT FALSE,
      has_voice_agent BOOLEAN DEFAULT FALSE,
      has_booking     BOOLEAN DEFAULT FALSE,
      detected_tools  TEXT,
      score_reason    TEXT,
      email_draft     TEXT,
      email_subject   TEXT,
      followup_d3_draft TEXT,
      followup_d7_draft TEXT,
      last_researched TIMESTAMPTZ,
      job_title       TEXT,
      linkedin        TEXT,
      assigned_owner  TEXT,
      deal_value      NUMERIC DEFAULT 0,
      forecast_category TEXT DEFAULT 'pipeline',
      close_probability INTEGER DEFAULT 20,
      expected_close_date DATE,
      current_cadence TEXT DEFAULT 'Default outbound',
      next_action     TEXT,
      next_action_at  TIMESTAMPTZ,
      lost_reason     TEXT,
      revenue_service TEXT,
      tags            TEXT,
      company_size    TEXT,
      revenue_estimate TEXT,
      locations_count INTEGER,
      ai_summary      TEXT,
      recommended_next_step TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS auto_send_emails BOOLEAN`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_id INTEGER`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_website BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_url TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_chatbot BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_voice_agent BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_booking BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS detected_tools TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reason TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_draft TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_subject TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_d3_draft TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_d7_draft TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_researched TIMESTAMPTZ`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_owner TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS forecast_category TEXT DEFAULT 'pipeline'`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS close_probability INTEGER DEFAULT 20`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_cadence TEXT DEFAULT 'Default outbound'`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue_service TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_size TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS revenue_estimate TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS locations_count INTEGER`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_summary TEXT`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS recommended_next_step TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS touches (
      id          SERIAL PRIMARY KEY,
      lead_id     INTEGER REFERENCES leads(id),
      type        TEXT NOT NULL,
      channel     TEXT,
      status      TEXT,
      subject     TEXT,
      body        TEXT,
      notes       TEXT,
      external_id TEXT,
      recipient   TEXT,
      opened_at   TIMESTAMPTZ,
      clicked_at  TIMESTAMPTZ,
      bounced_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS external_id TEXT`;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS recipient TEXT`;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ`;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ`;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ`;
  await sql`ALTER TABLE touches ADD COLUMN IF NOT EXISTS draft_raw TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id             SERIAL PRIMARY KEY,
      lead_id        INTEGER REFERENCES leads(id),
      business_name  TEXT NOT NULL,
      owner_name     TEXT,
      email          TEXT,
      phone          TEXT,
      plan           TEXT,
      mrr            NUMERIC DEFAULT 0,
      started_at     TIMESTAMPTZ DEFAULT NOW(),
      checkin_due    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
      status         TEXT DEFAULT 'active',
      notes          TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id                   SERIAL PRIMARY KEY,
      lead_id              INTEGER REFERENCES leads(id),
      business_name        TEXT NOT NULL,
      name                 TEXT,
      email                TEXT,
      phone                TEXT,
      issue_category       TEXT,
      affected_system      TEXT,
      issue_summary        TEXT NOT NULL,
      urgency              TEXT DEFAULT 'normal',
      customer_impact      TEXT,
      status               TEXT DEFAULT 'open',
      conversation_id      TEXT,
      conversation_summary TEXT,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS callbacks (
      id                        SERIAL PRIMARY KEY,
      lead_id                   INTEGER REFERENCES leads(id),
      name                      TEXT,
      email                     TEXT,
      phone                     TEXT,
      business_name             TEXT,
      preferred_callback_window TEXT,
      urgency                   TEXT,
      summary                   TEXT NOT NULL,
      requested_action          TEXT,
      status                    TEXT DEFAULT 'pending',
      conversation_id           TEXT,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS partners (
      id                        SERIAL PRIMARY KEY,
      name                      TEXT,
      email                     TEXT,
      phone                     TEXT,
      organization              TEXT,
      website                   TEXT,
      partner_type              TEXT,
      audience_or_network       TEXT,
      referral_fit              TEXT,
      services_of_interest      TEXT,
      requested_next_step       TEXT,
      preferred_callback_window TEXT,
      status                    TEXT DEFAULT 'new',
      conversation_id           TEXT,
      conversation_summary      TEXT,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS client_success_requests (
      id                    SERIAL PRIMARY KEY,
      lead_id               INTEGER REFERENCES leads(id),
      business_name         TEXT NOT NULL,
      name                  TEXT,
      email                 TEXT,
      phone                 TEXT,
      current_workflow      TEXT,
      requested_change      TEXT NOT NULL,
      business_reason       TEXT,
      urgency               TEXT,
      scope_or_pricing_risk BOOLEAN DEFAULT FALSE,
      status                TEXT DEFAULT 'open',
      conversation_id       TEXT,
      conversation_summary  TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id              SERIAL PRIMARY KEY,
      lead_id         INTEGER REFERENCES leads(id),
      start_at        TIMESTAMPTZ NOT NULL,
      end_at          TIMESTAMPTZ,
      status          TEXT NOT NULL DEFAULT 'booked',
      kind            TEXT DEFAULT 'discovery',
      source          TEXT,
      attendee_name   TEXT,
      attendee_email  TEXT,
      attendee_phone  TEXT,
      timezone        TEXT,
      external_uid    TEXT,
      notes           TEXT,
      conversation_id TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id                           SERIAL PRIMARY KEY,
      event_name                   TEXT NOT NULL,
      entry_mode                   TEXT NOT NULL,
      route                        TEXT,
      recommended_specialist_agent TEXT,
      action_taken                 TEXT,
      human_escalation             BOOLEAN DEFAULT FALSE,
      follow_up_required           BOOLEAN DEFAULT FALSE,
      conversation_id              TEXT,
      summary                      TEXT,
      created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id         SERIAL PRIMARY KEY,
      actor      TEXT NOT NULL,
      action     TEXT NOT NULL,
      lead_id    INTEGER,
      reason     TEXT,
      before     JSONB,
      after      JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL,
      website        TEXT,
      industry       TEXT,
      city           TEXT,
      state          TEXT,
      assigned_owner TEXT,
      health_score   INTEGER DEFAULT 75,
      tags           TEXT,
      notes          TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS crm_tasks (
      id           SERIAL PRIMARY KEY,
      lead_id      INTEGER REFERENCES leads(id),
      account_id   INTEGER REFERENCES accounts(id),
      opportunity_id INTEGER,
      title        TEXT NOT NULL,
      task_type    TEXT DEFAULT 'follow_up',
      status       TEXT DEFAULT 'open',
      due_at       TIMESTAMPTZ,
      assigned_to  TEXT,
      priority     TEXT DEFAULT 'normal',
      outcome      TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id                    SERIAL PRIMARY KEY,
      account_id            INTEGER REFERENCES accounts(id),
      lead_id               INTEGER REFERENCES leads(id),
      name                  TEXT NOT NULL,
      account_name          TEXT NOT NULL,
      contact_name          TEXT,
      contact_email         TEXT,
      stage                 TEXT DEFAULT 'found',
      deal_value            NUMERIC DEFAULT 0,
      forecast_category     TEXT DEFAULT 'pipeline',
      close_probability     INTEGER DEFAULT 20,
      expected_close_date   DATE,
      assigned_owner        TEXT,
      revenue_service       TEXT,
      next_action           TEXT,
      next_action_at        TIMESTAMPTZ,
      lost_reason           TEXT,
      ai_summary            TEXT,
      recommended_next_step TEXT,
      notes                 TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_stage_history (
      id             SERIAL PRIMARY KEY,
      opportunity_id INTEGER REFERENCES opportunities(id),
      from_stage     TEXT,
      to_stage       TEXT NOT NULL,
      actor          TEXT DEFAULT 'human:crm',
      reason         TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cadences (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      description TEXT,
      steps       JSONB NOT NULL,
      status      TEXT DEFAULT 'active',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cadence_enrollments (
      id                SERIAL PRIMARY KEY,
      cadence_id        INTEGER REFERENCES cadences(id),
      lead_id           INTEGER REFERENCES leads(id),
      opportunity_id    INTEGER REFERENCES opportunities(id),
      account_id        INTEGER REFERENCES accounts(id),
      status            TEXT DEFAULT 'active',
      current_step      INTEGER DEFAULT 0,
      next_step_at      TIMESTAMPTZ,
      enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_completed_at TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cadence_step_events (
      id            SERIAL PRIMARY KEY,
      enrollment_id INTEGER REFERENCES cadence_enrollments(id),
      step_index    INTEGER NOT NULL,
      action        TEXT DEFAULT 'completed',
      outcome       TEXT,
      completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_views (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      view_type  TEXT NOT NULL,
      filters    JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stage_history (
      id          SERIAL PRIMARY KEY,
      lead_id     INTEGER REFERENCES leads(id),
      from_stage  TEXT,
      to_stage    TEXT NOT NULL,
      actor       TEXT DEFAULT 'human:crm',
      reason      TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id                SERIAL PRIMARY KEY,
      script            TEXT NOT NULL DEFAULT 'pipeline',
      status            TEXT NOT NULL DEFAULT 'running',
      leads_processed   INTEGER DEFAULT 0,
      drafts_created    INTEGER DEFAULT 0,
      emails_sent       INTEGER DEFAULT 0,
      calls_triggered   INTEGER DEFAULT 0,
      skipped           INTEGER DEFAULT 0,
      error             TEXT,
      events            JSONB DEFAULT '[]'::jsonb,
      started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at      TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS pipeline_runs_started_idx ON pipeline_runs (started_at DESC)`;

  await sql`ALTER TABLE leads ADD CONSTRAINT leads_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) NOT VALID`.catch(() => {});
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ`;
  await sql`ALTER TABLE crm_tasks ADD COLUMN IF NOT EXISTS opportunity_id INTEGER`;

  await sql`
    INSERT INTO cadences (name, description, steps)
    VALUES (
      'Default outbound',
      'Enterprise default 30-day outbound sequence',
      ${JSON.stringify([
        { day: 1, type: "email", label: "Personalized Introduction Email" },
        { day: 2, type: "call", label: "Phone Call" },
        { day: 4, type: "email", label: "Follow-Up Email" },
        { day: 6, type: "call", label: "Phone Call" },
        { day: 8, type: "linkedin", label: "LinkedIn Touch" },
        { day: 10, type: "email", label: "Case Study Email" },
        { day: 14, type: "call", label: "Follow-Up Call" },
        { day: 21, type: "email", label: "Breakup Email" },
        { day: 30, type: "nurture", label: "Nurture Campaign" }
      ])}::jsonb
    )
    ON CONFLICT (name) DO NOTHING
  `;

  await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ`;

  await sql`CREATE INDEX IF NOT EXISTS touches_lead_id_idx ON touches (lead_id)`;
  await sql`CREATE INDEX IF NOT EXISTS touches_external_id_idx ON touches (external_id)`;
  await sql`CREATE INDEX IF NOT EXISTS touches_status_idx ON touches (status)`;
  await sql`CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads (stage)`;
  await sql`CREATE INDEX IF NOT EXISTS leads_account_id_idx ON leads (account_id) WHERE account_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS leads_next_followup_idx ON leads (next_followup_at) WHERE next_followup_at IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS leads_next_action_idx ON leads (next_action_at) WHERE next_action_at IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS leads_forecast_category_idx ON leads (forecast_category)`;
  await sql`CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON appointments (lead_id)`;
  await sql`CREATE INDEX IF NOT EXISTS appointments_start_at_idx ON appointments (start_at)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_log_lead_id_idx ON audit_log (lead_id)`;
  await sql`CREATE INDEX IF NOT EXISTS stage_history_lead_id_idx ON stage_history (lead_id)`;
  await sql`CREATE INDEX IF NOT EXISTS accounts_name_idx ON accounts (lower(name))`;
  await sql`CREATE INDEX IF NOT EXISTS crm_tasks_due_idx ON crm_tasks (due_at) WHERE status = 'open'`;
  await sql`CREATE INDEX IF NOT EXISTS opportunities_account_id_idx ON opportunities (account_id) WHERE account_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS opportunities_account_name_idx ON opportunities (lower(account_name))`;
  await sql`CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities (stage)`;
  await sql`CREATE INDEX IF NOT EXISTS opportunities_forecast_idx ON opportunities (forecast_category)`;
  await sql`CREATE INDEX IF NOT EXISTS opportunities_next_action_idx ON opportunities (next_action_at) WHERE next_action_at IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS opportunity_stage_history_opp_idx ON opportunity_stage_history (opportunity_id)`;
  await sql`CREATE INDEX IF NOT EXISTS cadence_enrollments_status_idx ON cadence_enrollments (status)`;
  await sql`CREATE INDEX IF NOT EXISTS cadence_enrollments_next_idx ON cadence_enrollments (next_step_at) WHERE status = 'active'`;
  await sql`CREATE INDEX IF NOT EXISTS cadence_step_events_enrollment_idx ON cadence_step_events (enrollment_id)`;

  // Guarded: the DB is shared with agent-network, which may own tables with
  // FKs to leads that this repo doesn't know about. A failed merge must not
  // take down the API — log it and continue; it retries on the next cold start.
  try {
    await dedupeLeadsOnce();
  } catch (err) {
    console.error("Lead dedup migration failed (non-fatal, will retry):", err);
  }
}

// Records who (actor, e.g. 'ai:classifier', 'ai:elevenlabs', 'human:crm') did
// what to a lead and why — every AI-initiated mutation must pass through here.
export async function logAudit(actor, action, { lead_id = null, reason = null, before = null, after = null } = {}) {
  await sql`
    INSERT INTO audit_log (actor, action, lead_id, reason, before, after)
    VALUES (${actor}, ${action}, ${lead_id}, ${reason},
      ${before ? JSON.stringify(before) : null}, ${after ? JSON.stringify(after) : null})
  `;
}

export async function startPipelineRun(script = "pipeline") {
  const rows = await sql`
    INSERT INTO pipeline_runs (script, status, started_at)
    VALUES (${script}, 'running', NOW())
    RETURNING id
  `;
  return rows[0].id;
}

export async function logPipelineEvent(runId, msg, level = "info") {
  const event = { t: new Date().toISOString(), level, msg };
  await sql`
    UPDATE pipeline_runs
    SET events = events || ${JSON.stringify([event])}::jsonb
    WHERE id = ${runId}
  `;
}

export async function endPipelineRun(runId, summary = {}, error = null) {
  await sql`
    UPDATE pipeline_runs SET
      status           = ${error ? "failed" : "completed"},
      leads_processed  = ${summary.leadsProcessed ?? 0},
      drafts_created   = ${summary.drafted ?? 0},
      emails_sent      = ${summary.sent ?? 0},
      calls_triggered  = ${summary.called ?? 0},
      skipped          = ${summary.skipped ?? 0},
      error            = ${error ?? null},
      completed_at     = NOW()
    WHERE id = ${runId}
  `;
}

// One-time: normalize emails, merge duplicate leads (same email, case/space
// variants), repoint child rows to the surviving lead, then enforce
// uniqueness. Guarded by the index's existence so it only runs once.
async function dedupeLeadsOnce() {
  const idx = await sql`SELECT 1 FROM pg_indexes WHERE indexname = 'leads_email_unique'`;
  if (idx.length) return;

  await sql`UPDATE leads SET email = NULLIF(lower(trim(email)), '') WHERE email IS DISTINCT FROM NULLIF(lower(trim(email)), '')`;

  await sql`UPDATE touches t SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE t.lead_id = k.id AND k.id <> k.keep_id`;
  await sql`UPDATE tickets t SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE t.lead_id = k.id AND k.id <> k.keep_id`;
  await sql`UPDATE callbacks c SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE c.lead_id = k.id AND k.id <> k.keep_id`;
  await sql`UPDATE client_success_requests c SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE c.lead_id = k.id AND k.id <> k.keep_id`;
  await sql`UPDATE clients c SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE c.lead_id = k.id AND k.id <> k.keep_id`;
  await sql`UPDATE appointments a SET lead_id = k.keep_id
    FROM (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE a.lead_id = k.id AND k.id <> k.keep_id`;

  await sql`DELETE FROM leads l
    USING (SELECT id, min(id) OVER (PARTITION BY email) AS keep_id FROM leads WHERE email IS NOT NULL) k
    WHERE l.id = k.id AND k.id <> k.keep_id`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique
    ON leads (lower(email)) WHERE email IS NOT NULL AND email <> ''`;
}

export async function getSetting(key, fallback = null) {
  const rows = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`;
  return rows[0] ? rows[0].value : fallback;
}

export async function setSetting(key, value) {
  await sql`
    INSERT INTO settings (key, value, updated_at) VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
  `;
}

// Resolve effective auto-send for a lead: per-lead override wins, else global default (off by default).
export async function shouldAutoSend(lead) {
  if (lead?.auto_send_emails !== null && lead?.auto_send_emails !== undefined) {
    return !!lead.auto_send_emails;
  }
  const def = await getSetting("auto_send_emails_default", "false");
  return def === "true";
}

export async function findLeadByContact({ email, phone, business_name }) {
  const e = normEmail(email);
  if (e) {
    const rows = await sql`SELECT * FROM leads WHERE lower(email) = ${e} LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  const digits = normPhone(phone);
  if (digits) {
    const rows = await sql`SELECT * FROM leads WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = ${digits} LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  if (business_name) {
    const rows = await sql`SELECT * FROM leads WHERE lower(business_name) = lower(${business_name}) LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  return null;
}

async function applyLeadUpdate(id, data) {
  await sql`
    UPDATE leads SET
      owner_name      = COALESCE(NULLIF(${data.name || ""}, ""), owner_name),
      email           = COALESCE(NULLIF(${normEmail(data.email) || ""}, ""), email),
      phone           = COALESCE(NULLIF(${data.phone || ""}, ""), phone),
      website         = COALESCE(NULLIF(${data.website || ""}, ""), website),
      city            = COALESCE(NULLIF(${data.city || ""}, ""), city),
      state           = COALESCE(NULLIF(${data.state || ""}, ""), state),
      lead_score      = GREATEST(lead_score, ${data.lead_score || 0}),
      lead_tier       = COALESCE(NULLIF(${data.lead_tier || ""}, ""), lead_tier),
      contact_type    = COALESCE(NULLIF(${data.contact_type || ""}, ""), contact_type),
      source          = COALESCE(NULLIF(${data.source || ""}, ""), source),
      conversation_id = COALESCE(NULLIF(${data.conversation_id || ""}, ""), conversation_id),
      last_touched    = NOW(),
      updated_at      = NOW()
    WHERE id = ${id}
  `;
  return id;
}

export async function upsertLead(data) {
  const existing = await findLeadByContact({
    email: data.email,
    phone: data.phone,
    business_name: data.business_name,
  });
  if (existing) return applyLeadUpdate(existing.id, data);

  try {
    const rows = await sql`
      INSERT INTO leads (business_name, owner_name, email, phone, website, city, state,
        lead_score, lead_tier, contact_type, source, niche, pain_signal, conversation_id, stage)
      VALUES (
        ${data.business_name || data.organization || "Unknown"},
        ${data.name || null},
        ${normEmail(data.email)},
        ${data.phone || null},
        ${data.website || null},
        ${data.city || null},
        ${data.state || null},
        ${data.lead_score || 0},
        ${data.lead_tier || "unknown"},
        ${data.contact_type || "prospect"},
        ${data.source || null},
        ${data.market || data.niche || null},
        ${data.pain_signal || null},
        ${data.conversation_id || null},
        'found'
      )
      RETURNING id
    `;
    return rows[0].id;
  } catch (err) {
    // Unique-violation race: another request created this lead between our
    // lookup and insert — fall back to updating the winner.
    if (err?.code === "23505") {
      const winner = await findLeadByContact({ email: data.email });
      if (winner) return applyLeadUpdate(winner.id, data);
    }
    throw err;
  }
}

export async function logTouch(leadId, type, channel, status, extra = {}) {
  const rows = await sql`
    INSERT INTO touches (lead_id, type, channel, status, subject, body, notes, external_id, recipient, draft_raw)
    VALUES (${leadId}, ${type}, ${channel}, ${status},
      ${extra.subject || null}, ${extra.body || null}, ${extra.notes || null}, ${extra.external_id || null}, ${extra.recipient || null}, ${extra.draft_raw || null})
    RETURNING id
  `;
  return rows[0].id;
}
