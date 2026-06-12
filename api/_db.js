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
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS auto_send_emails BOOLEAN`;
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
  if (email) {
    const rows = await sql`SELECT * FROM leads WHERE lower(email) = lower(${email}) LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  if (phone) {
    const rows = await sql`SELECT * FROM leads WHERE phone = ${phone} LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  if (business_name) {
    const rows = await sql`SELECT * FROM leads WHERE lower(business_name) = lower(${business_name}) LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  return null;
}

export async function upsertLead(data) {
  const existing = await findLeadByContact({
    email: data.email,
    phone: data.phone,
    business_name: data.business_name,
  });

  if (existing) {
    await sql`
      UPDATE leads SET
        owner_name      = COALESCE(NULLIF(${data.name || ""}, ""), owner_name),
        email           = COALESCE(NULLIF(${data.email || ""}, ""), email),
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
      WHERE id = ${existing.id}
    `;
    return existing.id;
  }

  const rows = await sql`
    INSERT INTO leads (business_name, owner_name, email, phone, website, city, state,
      lead_score, lead_tier, contact_type, source, niche, pain_signal, conversation_id, stage)
    VALUES (
      ${data.business_name || data.organization || "Unknown"},
      ${data.name || null},
      ${data.email || null},
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
}

export async function logTouch(leadId, type, channel, status, extra = {}) {
  const rows = await sql`
    INSERT INTO touches (lead_id, type, channel, status, subject, body, notes, external_id, recipient)
    VALUES (${leadId}, ${type}, ${channel}, ${status},
      ${extra.subject || null}, ${extra.body || null}, ${extra.notes || null}, ${extra.external_id || null}, ${extra.recipient || null})
    RETURNING id
  `;
  return rows[0].id;
}
