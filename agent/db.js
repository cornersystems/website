/**
 * Corner Systems — Pipeline CRM
 * SQLite database. Single file, no server, lives in agent/pipeline.db
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database lives in AppData (NOT OneDrive) — SQLite + OneDrive = corruption
const DB_PATH = process.env.CS_DB_PATH ||
  path.join(process.env.LOCALAPPDATA || path.join(path.dirname(__dirname), ".."), "CornerSystems", "pipeline.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    owner_name    TEXT,
    city          TEXT,
    state         TEXT,
    phone         TEXT,
    email         TEXT,
    website       TEXT,
    instagram     TEXT,
    google_maps   TEXT,
    lead_score    INTEGER DEFAULT 0,
    pain_signal   TEXT,
    niche         TEXT,
    notes         TEXT,
    stage         TEXT NOT NULL DEFAULT 'found',
    -- stages: found, emailed_d0, emailed_d3, emailed_d7, called,
    --         replied, discovery_booked, client, churned, dead
    last_touched  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS touches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id     INTEGER NOT NULL REFERENCES leads(id),
    type        TEXT NOT NULL,  -- email | call | note | reply | booking
    channel     TEXT,           -- cold_d0 | follow_d3 | follow_d7 | call_d10 | etc.
    status      TEXT,           -- sent | delivered | opened | replied | completed | failed
    subject     TEXT,
    body        TEXT,
    call_sid    TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clients (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id        INTEGER REFERENCES leads(id),
    business_name  TEXT NOT NULL,
    owner_name     TEXT,
    email          TEXT,
    phone          TEXT,
    plan           TEXT,
    mrr            REAL DEFAULT 0,
    started_at     TEXT,
    checkin_due    TEXT,
    status         TEXT DEFAULT 'active',  -- active | at_risk | churned
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Schema migrations — add columns if they don't exist ───────────────────────
{
  const existing = db.prepare("PRAGMA table_info(leads)").all().map((c) => c.name);
  const migrations = [
    ["has_website",        "INTEGER DEFAULT 0"],
    ["website_url",        "TEXT"],
    ["has_chatbot",        "INTEGER DEFAULT 0"],
    ["has_voice_agent",    "INTEGER DEFAULT 0"],
    ["email_draft",        "TEXT"],
    ["email_subject",      "TEXT"],          // NEW — subject line for cold email
    ["followup_d3_draft",  "TEXT"],          // NEW — pre-written D3 follow-up body
    ["followup_d7_draft",  "TEXT"],          // NEW — pre-written D7 follow-up body
    ["last_researched",    "TEXT"],
  ];
  for (const [col, def] of migrations) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── Lead queries ──────────────────────────────────────────────────────────────
export function upsertLead(data) {
  const hasWebsite = (data.website && data.website.trim()) ? 1 : 0;

  const existing = db.prepare(
    "SELECT id FROM leads WHERE business_name = ? AND city = ?"
  ).get(data.business_name, data.city || "");

  if (existing) {
    db.prepare(`UPDATE leads SET owner_name=?, city=?, state=?, phone=?, email=?, website=?,
      instagram=?, google_maps=?, lead_score=?, pain_signal=?, niche=?, notes=?,
      has_website = CASE WHEN ? = 1 THEN 1 ELSE has_website END,
      website_url = COALESCE(NULLIF(?, ''), website_url),
      updated_at=datetime('now')
      WHERE id=?`).run(
      data.owner_name, data.city, data.state, data.phone, data.email,
      data.website, data.instagram_handle, data.google_maps_url,
      data.lead_score, data.pain_signal, data.niche, data.notes,
      hasWebsite, data.website || "",
      existing.id
    );
    return existing.id;
  }
  const result = db.prepare(`INSERT INTO leads
    (business_name, owner_name, city, state, phone, email, website, website_url,
     instagram, google_maps, lead_score, pain_signal, niche, notes, has_website)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    data.business_name, data.owner_name, data.city, data.state,
    data.phone, data.email, data.website, data.website || "",
    data.instagram_handle, data.google_maps_url,
    data.lead_score, data.pain_signal, data.niche, data.notes,
    hasWebsite
  );
  return result.lastInsertRowid;
}

export function updateStage(leadId, stage) {
  db.prepare("UPDATE leads SET stage=?, last_touched=datetime('now'), updated_at=datetime('now') WHERE id=?")
    .run(stage, leadId);
}

export function updateLeadScore(leadId, score) {
  db.prepare("UPDATE leads SET lead_score=?, updated_at=datetime('now') WHERE id=?")
    .run(score, leadId);
}

export function logTouch(leadId, type, channel, status, extra = {}) {
  db.prepare(`INSERT INTO touches (lead_id, type, channel, status, subject, body, call_sid, notes)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    leadId, type, channel, status,
    extra.subject || null, extra.body || null, extra.call_sid || null, extra.notes || null
  );
}

export function getLeadsByStage(stage) {
  return db.prepare("SELECT * FROM leads WHERE stage=? ORDER BY lead_score DESC").all(stage);
}

export function getLeadsSince(stage, days) {
  return db.prepare(`SELECT l.* FROM leads l
    WHERE l.stage=? AND l.last_touched < datetime('now', '-${days} days')
    ORDER BY l.lead_score DESC`).all(stage);
}

export function getLead(id) {
  return db.prepare("SELECT * FROM leads WHERE id=?").get(id);
}

export function getAllLeads() {
  return db.prepare("SELECT * FROM leads ORDER BY updated_at DESC").all();
}

export function updateResearchData(leadId, data) {
  db.prepare(`UPDATE leads SET
    email            = COALESCE(NULLIF(?, ''), email),
    website_url      = COALESCE(NULLIF(?, ''), website_url),
    has_website      = ?,
    has_chatbot      = ?,
    has_voice_agent  = ?,
    email_draft      = COALESCE(NULLIF(?, ''), email_draft),
    email_subject    = COALESCE(NULLIF(?, ''), email_subject),
    last_researched  = datetime('now'),
    updated_at       = datetime('now')
    WHERE id = ?`).run(
    data.email || "", data.website_url || "",
    data.has_website ? 1 : 0,
    data.has_chatbot ? 1 : 0,
    data.has_voice_agent ? 1 : 0,
    data.email_draft || "",
    data.email_subject || "",
    leadId
  );
}

// Top 10 uncontacted leads that have an email — for daily outreach sheet
export function getTop10ForOutreach() {
  return db.prepare(`
    SELECT * FROM leads
    WHERE email IS NOT NULL AND email != ''
      AND stage IN ('found', 'researched')
    ORDER BY lead_score DESC, created_at ASC
    LIMIT 10
  `).all();
}

// All un-researched leads (no email_draft yet and have a name)
export function getUnresearchedLeads(limit = 30) {
  return db.prepare(`
    SELECT * FROM leads
    WHERE (last_researched IS NULL OR email_draft IS NULL)
      AND business_name IS NOT NULL
    ORDER BY lead_score DESC, created_at ASC
    LIMIT ?
  `).all(limit);
}

// ── Reply + hot lead queries ──────────────────────────────────────────────────

// Leads that replied, booked, or converted — the active pipeline
export function getHotLeads() {
  return db.prepare(`
    SELECT * FROM leads
    WHERE stage IN ('replied', 'discovery_booked', 'client')
    ORDER BY last_touched DESC
  `).all();
}

// Mark a lead as having replied to outreach (called when Gmail reply detected)
export function markLeadReplied(businessName) {
  const lead = db.prepare(
    "SELECT id, stage FROM leads WHERE lower(trim(business_name)) = lower(trim(?))"
  ).get(businessName);
  if (!lead) return false;
  // Don't overwrite a stage that's already further along
  const advanceable = ["found", "emailed_d0", "emailed_d3", "emailed_d7"];
  if (!advanceable.includes(lead.stage)) return false;
  updateStage(lead.id, "replied");
  logTouch(lead.id, "email", "reply_received", "received");
  return true;
}

// ── Follow-up queue queries ───────────────────────────────────────────────────

// Leads that had first email sent 3+ days ago — need D3 follow-up
export function getD3FollowUps() {
  return db.prepare(`
    SELECT * FROM leads
    WHERE stage = 'emailed_d0'
      AND last_touched < datetime('now', '-3 days')
      AND email IS NOT NULL AND email != ''
    ORDER BY lead_score DESC
  `).all();
}

// Leads that had D3 follow-up sent 4+ days ago — need D7 final touch
export function getD7FollowUps() {
  return db.prepare(`
    SELECT * FROM leads
    WHERE stage = 'emailed_d3'
      AND last_touched < datetime('now', '-4 days')
      AND email IS NOT NULL AND email != ''
    ORDER BY lead_score DESC
  `).all();
}

/**
 * Mark a lead as sent — called when Tom marks "yes" in the sheet.
 * stage: 'emailed_d0' | 'emailed_d3' | 'emailed_d7'
 * Returns true if lead was found and updated, false otherwise.
 */
export function markLeadSent(businessName, stage = "emailed_d0") {
  const channelMap = {
    emailed_d0: "cold_d0",
    emailed_d3: "follow_d3",
    emailed_d7: "follow_d7",
  };

  // Case-insensitive match on business name
  const lead = db.prepare(
    "SELECT id, stage FROM leads WHERE lower(trim(business_name)) = lower(trim(?))"
  ).get(businessName);

  if (!lead) return false;

  // Don't downgrade a stage (in case of duplicate marks)
  const stageOrder = ["found", "emailed_d0", "emailed_d3", "emailed_d7", "replied", "discovery_booked", "client"];
  const currentIdx = stageOrder.indexOf(lead.stage);
  const newIdx     = stageOrder.indexOf(stage);
  if (newIdx <= currentIdx) return false;  // already at or past this stage

  updateStage(lead.id, stage);
  logTouch(lead.id, "email", channelMap[stage] || stage, "sent");
  return true;
}

// ── Client queries ────────────────────────────────────────────────────────────
export function addClient(data) {
  return db.prepare(`INSERT INTO clients (lead_id, business_name, owner_name, email, phone, plan, mrr, started_at, checkin_due)
    VALUES (?,?,?,?,?,?,?,datetime('now'), datetime('now', '+30 days'))`).run(
    data.lead_id, data.business_name, data.owner_name, data.email, data.phone, data.plan, data.mrr
  );
}

export function getCheckinsdue() {
  return db.prepare("SELECT * FROM clients WHERE checkin_due <= datetime('now') AND status='active'").all();
}

export function updateCheckin(clientId) {
  db.prepare("UPDATE clients SET checkin_due=datetime('now', '+30 days') WHERE id=?").run(clientId);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export function getStats() {
  const stages = db.prepare("SELECT stage, COUNT(*) as count FROM leads GROUP BY stage").all();
  const mrr    = db.prepare("SELECT SUM(mrr) as total FROM clients WHERE status='active'").get();
  const clients = db.prepare("SELECT COUNT(*) as count FROM clients WHERE status='active'").get();
  return { stages, mrr: mrr?.total || 0, activeClients: clients?.count || 0 };
}

export default db;
