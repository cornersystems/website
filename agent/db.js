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

// ── Schema migration: add research columns if they don't exist ─────────────────
{
  const existing = db.prepare("PRAGMA table_info(leads)").all().map((c) => c.name);
  const migrations = [
    ["has_website",    "INTEGER DEFAULT 0"],
    ["website_url",    "TEXT"],
    ["has_chatbot",    "INTEGER DEFAULT 0"],
    ["has_voice_agent","INTEGER DEFAULT 0"],
    ["email_draft",    "TEXT"],
    ["last_researched","TEXT"],
  ];
  for (const [col, def] of migrations) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${def}`);
    }
  }
}

// ── Lead queries ──────────────────────────────────────────────────────────────
export function upsertLead(data) {
  // If discovery found a website URL, mark has_website = 1 immediately
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
    last_researched  = datetime('now'),
    updated_at       = datetime('now')
    WHERE id = ?`).run(
    data.email || "", data.website_url || "",
    data.has_website ? 1 : 0,
    data.has_chatbot ? 1 : 0,
    data.has_voice_agent ? 1 : 0,
    data.email_draft || "",
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
