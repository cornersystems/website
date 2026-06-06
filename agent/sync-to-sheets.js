#!/usr/bin/env node
/**
 * Corner Systems — Google Sheets Sync
 *
 * Syncs CRM to two tabs in your Google Sheet:
 *   1. "Leads"       — full lead list with all research data (auto-sorted by score)
 *   2. "Top 10 Today" — today's 10 best uncontacted leads + pre-drafted outreach email
 *
 * Runs automatically every day via agent/daily-run.js
 * Can also be run manually: node agent/sync-to-sheets.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { getAllLeads, getTop10ForOutreach } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./agent/google-key.json";
const LEADS_TAB = process.env.GOOGLE_SHEET_TAB || "Leads";
const TOP10_TAB = "Top 10 Today";

// ── Column definitions ────────────────────────────────────────────────────────
const LEAD_COLS = [
  "business_name", "owner_name", "city", "state", "phone", "email",
  "website", "niche", "lead_score", "stage", "pain_signal",
  "has_website", "has_chatbot", "has_voice_agent", "notes",
];

const LEAD_HEADERS = [
  "Rank", "Business", "Owner", "City", "State", "Phone", "Email",
  "Website", "Niche", "Score", "Stage", "Pain Signal",
  "Has Website", "Has AI Chatbot", "Has Voice Agent", "Notes",
];

const TOP10_COLS = [
  "business_name", "owner_name", "city", "phone", "email",
  "niche", "lead_score", "pain_signal",
  "has_website", "has_chatbot", "has_voice_agent", "email_draft",
];

const TOP10_HEADERS = [
  "Rank", "Business", "Owner", "City", "Phone", "Email",
  "Niche", "Score", "Pain Signal",
  "Has Website", "Has AI Chatbot", "Has Voice Agent",
  "⚡ OUTREACH EMAIL — Copy, personalise, send",
];

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getSheets() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID in .env");
  const keyFile = path.resolve(__dirname, "..", KEY_PATH);
  if (!fs.existsSync(keyFile)) {
    throw new Error(`Service account key not found at ${keyFile}`);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureTab(sheets, tabName, existingTabs) {
  if (!existingTabs.includes(tabName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    console.log(`   Created tab "${tabName}"`);
  }
}

function boolLabel(val) {
  if (val === 1 || val === true) return "✅ Yes";
  if (val === 0 || val === false) return "❌ No";
  return "—";
}

// ── Tab 1: Full Leads list ────────────────────────────────────────────────────
export async function syncToSheets() {
  const sheets = await getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);

  await ensureTab(sheets, LEADS_TAB, existingTabs);

  const leads = getAllLeads().sort(
    (a, b) => (b.lead_score || 0) - (a.lead_score || 0) || a.business_name.localeCompare(b.business_name)
  );

  const values = [
    LEAD_HEADERS,
    ...leads.map((l, i) => [
      String(i + 1),
      ...LEAD_COLS.map((c) => {
        if (c === "has_website" || c === "has_chatbot" || c === "has_voice_agent") {
          return boolLabel(l[c]);
        }
        return l[c] == null ? "" : String(l[c]);
      }),
    ]),
  ];

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${LEADS_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  console.log(`\n✅ Synced ${leads.length} leads → "${LEADS_TAB}" tab`);
  return leads.length;
}

// ── Tab 2: Top 10 Today ───────────────────────────────────────────────────────
export async function syncTop10Daily() {
  const sheets = await getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);

  await ensureTab(sheets, TOP10_TAB, existingTabs);

  const top10 = getTop10ForOutreach();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const titleRow = [`📅 Top 10 Leads — ${today}`, "", "", "", "", "", "", "", "", "", "", "", ""];
  const subRow   = ["Send 10 emails today. Review each draft, personalise the opener if you have time, hit send.", ...Array(12).fill("")];
  const blankRow = Array(TOP10_HEADERS.length).fill("");

  const rows = top10.map((l, i) => [
    String(i + 1),
    ...TOP10_COLS.map((c) => {
      if (c === "has_website" || c === "has_chatbot" || c === "has_voice_agent") {
        return boolLabel(l[c]);
      }
      if (c === "email_draft") {
        return l.email_draft || "(draft not generated yet — run research-daily.js)";
      }
      return l[c] == null ? "" : String(l[c]);
    }),
  ]);

  const values = [titleRow, subRow, blankRow, TOP10_HEADERS, ...rows];

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${TOP10_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TOP10_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  // Style: bold the header row (row 4) and widen the email draft column
  const sheetId = meta.data.sheets.find((s) => s.properties.title === TOP10_TAB)?.properties.sheetId;
  if (sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Bold title
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 13 },
              cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 12 } } },
              fields: "userEnteredFormat.textFormat",
            },
          },
          // Bold header row
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 13 },
              cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.035, green: 0.039, blue: 0.047 } } },
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          // Widen the email draft column (column 12 = index 12)
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 12, endIndex: 13 },
              properties: { pixelSize: 520 },
              fields: "pixelSize",
            },
          },
          // Wrap text in email draft column
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 4, endRowIndex: 14, startColumnIndex: 12, endColumnIndex: 13 },
              cell: { userEnteredFormat: { wrapStrategy: "WRAP" } },
              fields: "userEnteredFormat.wrapStrategy",
            },
          },
        ],
      },
    });
  }

  console.log(`✅ Synced ${top10.length} leads → "${TOP10_TAB}" tab`);
  return top10.length;
}

// Run directly
const isDirect = process.argv[1]?.endsWith("sync-to-sheets.js");
if (isDirect) {
  (async () => {
    await syncToSheets();
    await syncTop10Daily();
  })().catch((err) => {
    console.error("Sheets sync error:", err.message);
    if (err.message.toLowerCase().includes("permission")) {
      console.error("   → Share the sheet with the service account email (Editor access).");
    }
    process.exit(1);
  });
}
