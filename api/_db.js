import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

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
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

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
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  await sql`
    INSERT INTO touches (lead_id, type, channel, status, subject, body, notes)
    VALUES (${leadId}, ${type}, ${channel}, ${status},
      ${extra.subject || null}, ${extra.body || null}, ${extra.notes || null})
  `;
}
