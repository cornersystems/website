// One-off recovery: import the leads currently in the Google Sheet "Leads" tab
// into the local DB, preserving stage/score/notes. Adds only leads not already
// present (matched on business_name + city). Does NOT write back to the sheet.
import "dotenv/config";
import { google } from "googleapis";
import Database from "better-sqlite3";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./agent/google-key.json";
const TAB = process.env.GOOGLE_SHEET_TAB || "Leads";
const DB_PATH = process.env.CS_DB_PATH || "C:/Users/thoma/AppData/Local/CornerSystems/pipeline.db";

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });
const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB}!A:Z` });
const rows = (res.data.values || []).slice(1); // drop header

const yes = (v) => (/yes|✅/i.test(v || "") ? 1 : /no|❌/i.test(v || "") ? 0 : null);
const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; };

const db = new Database(DB_PATH);
const cols = new Set(db.prepare("PRAGMA table_info(leads)").all().map((c) => c.name));
const findExisting = db.prepare("SELECT id FROM leads WHERE business_name = ? AND city = ?");

const records = rows.map((r) => ({
  business_name: (r[1] || "").trim(),
  owner_name: r[2] || null,
  city: r[3] || null,
  state: r[4] || null,
  phone: r[5] || null,
  email: r[6] || null,
  website: r[7] || null,
  niche: r[8] || null,
  lead_score: num(r[9]),
  stage: (r[10] || "found").trim() || "found",
  pain_signal: r[11] || null,
  has_website: yes(r[12]) ?? (r[7] ? 1 : 0),
  has_chatbot: yes(r[13]) ?? 0,
  has_voice_agent: yes(r[14]) ?? 0,
  has_booking: yes(r[15]) ?? 0,
  detected_tools: r[16] || null,
  score_reason: r[17] || null,
  notes: r[18] || null,
  created_at: "2026-06-06 12:00:00", // mark as pre-existing (not "today")
}));

let added = 0, skipped = 0;
const tx = db.transaction((recs) => {
  for (const rec of recs) {
    if (!rec.business_name) { skipped++; continue; }
    if (findExisting.get(rec.business_name, rec.city || "")) { skipped++; continue; }
    const entries = Object.entries(rec).filter(([k]) => cols.has(k));
    const keys = entries.map(([k]) => k);
    db.prepare(`INSERT INTO leads (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
      .run(...entries.map(([, v]) => v));
    added++;
  }
});
tx(records);

console.log(`sheet rows read : ${rows.length}`);
console.log(`added to DB     : ${added}`);
console.log(`skipped (dupe/blank): ${skipped}`);
console.log(`DB total now    : ${db.prepare("SELECT COUNT(1) c FROM leads").get().c}`);
console.log(`by stage        :`, JSON.stringify(db.prepare("SELECT stage, COUNT(1) c FROM leads GROUP BY stage").all()));
db.close();
