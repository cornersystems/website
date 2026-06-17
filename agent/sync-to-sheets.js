#!/usr/bin/env node
/**
 * Corner Systems — Google Sheets Sync
 *
 * Syncs CRM to three tabs in your Google Sheet:
 *   1. "Leads"         — full lead list with all research data (auto-sorted by score)
 *   2. "Top 10 Today"  — 10 best uncontacted leads with subject + email draft + Sent? column
 *   3. "📬 Follow-ups" — D3 and D7 follow-up queues with pre-written follow-up messages
 *
 * The "Sent?" column is a feedback loop:
 *   - Tom types "yes" next to any lead he emails
 *   - Next morning, daily-run.js reads it back and advances that lead's stage in the DB
 *   - Those leads then disappear from tomorrow's Top 10 and appear in the Follow-up tab on day 3/7
 *
 * Runs automatically every day via agent/daily-run.js
 * Can also be run manually: node agent/sync-to-sheets.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import {
  getAllLeads, getTop10ForOutreach, getD3FollowUps, getD7FollowUps,
  getHotLeads, getDashboardStats,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID      = process.env.GOOGLE_SHEET_ID;
const KEY_PATH      = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./agent/google-key.json";
const LEADS_TAB     = process.env.GOOGLE_SHEET_TAB || "Leads";
const TOP10_TAB     = "Top 10 Today";
const TOP10_YDAY_TAB = "Top 10 — Yesterday";  // archive of the previous day's Top 10
const FOLLOWUP_TAB  = "📬 Follow-ups";
const REPLIES_TAB   = "📩 Replies";    // written by Apps Script, read by this agent
const HOT_TAB       = "🔥 Hot Leads"; // replied, booked, clients
const DASHBOARD_TAB = "📊 Dashboard"; // auto-generated pipeline overview
const INBOUND_TAB   = "🌐 Inbound";   // website contact form leads (written by Apps Script)

// ── Column definitions ────────────────────────────────────────────────────────

// Full leads tab
// ⚠️  If you add columns here, update LEADS_*_COL constants below too
const LEAD_COLS = [
  "business_name", "owner_name", "city", "state", "phone", "email",
  "website", "niche", "lead_score", "stage", "pain_signal",
  "has_website", "has_chatbot", "has_voice_agent", "has_booking",
  "detected_tools", "score_reason", "notes",
  "_mark_dead",   // user-editable: type "yes" to kill this lead
];
const LEAD_HEADERS = [
  "Rank", "Business", "Owner", "City", "State", "Phone", "Email",
  "Website", "Niche", "Score", "Stage", "Pain Signal",
  "Has Website", "Has AI Chatbot", "Has Voice Agent", "Has Booking",
  "Detected Tools", "Why Score", "Notes",
  "⚠️ Mark Dead? (type yes)",
];

// Column indices in the Leads tab row array (0-indexed, Rank is [0])
const LEADS_BIZ_COL    = 1;   // "Business"
const LEADS_REASON_COL = 17;  // "Why Score"
const LEADS_NOTES_COL  = 18;  // "Notes"
const LEADS_DEAD_COL   = 19;  // "⚠️ Mark Dead?"

// Top 10 tab — columns in display order
// ⚠️  If you change this order, update the COLUMN INDEX CONSTANTS below too
const TOP10_COLS = [
  "business_name",  // col 1 (after Rank)
  "email_subject",  // col 2 — subject line
  "email_draft",    // col 3 — email body
  "_sent",          // col 4 — "Sent?" user-editable — NOT a real DB column
  "owner_name",     // col 5
  "city",           // col 6
  "email",          // col 7
  "niche",          // col 8
  "lead_score",     // col 9
  "pain_signal",    // col 10
  "has_chatbot",    // col 11
  "has_voice_agent",// col 12
];
const TOP10_HEADERS = [
  "Rank",
  "Business",
  "📋 Subject Line — copy this",
  "✉️ Email Body — personalise & send",
  "✅ Sent? (type yes)",
  "Owner",
  "City",
  "Email",
  "Niche",
  "Score",
  "Pain Signal",
  "Has AI Chatbot",
  "Has Voice Agent",
];

// Column index constants for read-back (0-indexed within the row array, after Rank at [0])
// These correspond to TOP10_HEADERS positions
const TOP10_BIZ_COL  = 1;  // "Business"
const TOP10_SENT_COL = 4;  // "✅ Sent?"

// Follow-up tab data columns
const FOLLOWUP_HEADERS = [
  "Business", "Email", "📋 Subject — copy this", "✉️ Follow-up Message — copy this",
  "✅ Sent? (type yes)", "Niche", "Score",
];
const FU_BIZ_COL  = 0;
const FU_SENT_COL = 4;

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

// ── Archive the previous day's Top 10 ─────────────────────────────────────────
// Call this BEFORE syncTop10Daily() regenerates "Top 10 Today". It copies the
// current Top 10 (i.e. yesterday's) into the "Top 10 — Yesterday" tab so the
// list you reviewed yesterday is never lost when today's is written.
export async function archiveYesterdayTop10() {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);

  if (!existingTabs.includes(TOP10_TAB)) return;  // nothing to archive yet

  const cur = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${TOP10_TAB}!A:Z`,
  });
  const rows = cur.data.values || [];
  if (rows.length < 2) return;  // only a header / empty — skip

  await ensureTab(sheets, TOP10_YDAY_TAB, existingTabs);
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${TOP10_YDAY_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TOP10_YDAY_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
  console.log(`   📦 Archived previous Top 10 → "${TOP10_YDAY_TAB}"`);
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
        if (c === "_mark_dead")  return "";  // always blank — user fills in
        if (c === "has_website" || c === "has_chatbot" || c === "has_voice_agent" || c === "has_booking") return boolLabel(l[c]);
        return l[c] == null ? "" : String(l[c]);
      }),
    ]),
  ];

  // ── SAFETY GUARD ────────────────────────────────────────────────────────────
  // Never overwrite a fuller sheet with a depleted DB. (On 2026-06-08 a reset DB
  // cleared 75 real leads down to 20.) If the Leads tab already holds many more
  // leads than the DB is about to write, ABORT instead of clearing. Override only
  // with CS_FORCE_SYNC=1 for a deliberate reset.
  let existingRows = 0;
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: `${LEADS_TAB}!A:A`,
    });
    existingRows = Math.max(0, (existing.data.values?.length || 0) - 1); // minus header
  } catch { existingRows = 0; }

  if (existingRows >= 10 && leads.length < Math.floor(existingRows * 0.7) && process.env.CS_FORCE_SYNC !== "1") {
    throw new Error(
      `🛑 SYNC ABORTED (safety guard): the DB has only ${leads.length} leads but the ` +
      `"${LEADS_TAB}" tab already holds ${existingRows}. Refusing to clear it — that would ` +
      `destroy data. Investigate the DB. To force a deliberate reset, set CS_FORCE_SYNC=1.`
    );
  }

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${LEADS_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  // Style the header row and Mark Dead column
  const meta2    = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetId2 = meta2.data.sheets.find((s) => s.properties.title === LEADS_TAB)?.properties.sheetId;
  if (sheetId2 != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Header row
          {
            repeatCell: {
              range: { sheetId: sheetId2, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: LEAD_HEADERS.length },
              cell: { userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.12, green: 0.13, blue: 0.16 },
              }},
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          // Mark Dead column header — red tint
          {
            repeatCell: {
              range: { sheetId: sheetId2, startRowIndex: 0, endRowIndex: 1, startColumnIndex: LEADS_DEAD_COL, endColumnIndex: LEADS_DEAD_COL + 1 },
              cell: { userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.6, green: 0.1, blue: 0.1 },
              }},
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          // Notes column wide
          {
            updateDimensionProperties: {
              range: { sheetId: sheetId2, dimension: "COLUMNS", startIndex: LEADS_NOTES_COL, endIndex: LEADS_NOTES_COL + 1 },
              properties: { pixelSize: 280 },
              fields: "pixelSize",
            },
          },
          // Business name column wide
          {
            updateDimensionProperties: {
              range: { sheetId: sheetId2, dimension: "COLUMNS", startIndex: LEADS_BIZ_COL, endIndex: LEADS_BIZ_COL + 1 },
              properties: { pixelSize: 200 },
              fields: "pixelSize",
            },
          },
          // "Why Score" column wide (the score breakdown)
          {
            updateDimensionProperties: {
              range: { sheetId: sheetId2, dimension: "COLUMNS", startIndex: LEADS_REASON_COL, endIndex: LEADS_REASON_COL + 1 },
              properties: { pixelSize: 300 },
              fields: "pixelSize",
            },
          },
        ],
      },
    });
  }

  // ── Conditional formatting: scores, stages, dead-row greying ───────────────
  if (sheetId2 != null) {
    const dataEnd  = leads.length + 1;       // header is row 0
    const scoreCol = 9;                        // "Score"
    const stageCol = 10;                       // "Stage"
    const stageLetter = "K";                   // col 10 → K, for custom formula
    const fullCols = LEAD_HEADERS.length;

    // Wipe existing rules first so they don't stack on each daily run
    const lsMeta   = meta2.data.sheets.find((s) => s.properties.title === LEADS_TAB);
    const existingRuleCount = (lsMeta?.conditionalFormats || []).length;
    const wipeRequests = Array.from({ length: existingRuleCount }, () => ({
      deleteConditionalFormatRule: { sheetId: sheetId2, index: 0 },
    }));

    const scoreRange = { sheetId: sheetId2, startRowIndex: 1, endRowIndex: dataEnd, startColumnIndex: scoreCol, endColumnIndex: scoreCol + 1 };
    const stageRange = { sheetId: sheetId2, startRowIndex: 1, endRowIndex: dataEnd, startColumnIndex: stageCol, endColumnIndex: stageCol + 1 };
    const fullRange  = { sheetId: sheetId2, startRowIndex: 1, endRowIndex: dataEnd, startColumnIndex: 0, endColumnIndex: fullCols };

    const boolRule = (range, condition, bg, fg) => ({
      addConditionalFormatRule: {
        index: 0,
        rule: {
          ranges: [range],
          booleanRule: {
            condition,
            format: { backgroundColor: bg, textFormat: fg ? { foregroundColor: fg } : undefined },
          },
        },
      },
    });

    const C = {
      greenBg:  { red: 0.78, green: 0.92, blue: 0.79 },
      amberBg:  { red: 0.99, green: 0.95, blue: 0.78 },
      greyBg:   { red: 0.93, green: 0.93, blue: 0.93 },
      blueBg:   { red: 0.80, green: 0.89, blue: 0.99 },
      hotGreen: { red: 0.71, green: 0.88, blue: 0.72 },
      greyTxt:  { red: 0.6,  green: 0.6,  blue: 0.6  },
      darkTxt:  { red: 0.1,  green: 0.3,  blue: 0.15 },
    };

    const cfRequests = [
      // Score: 8-10 green, 5-7 amber, <5 grey
      boolRule(scoreRange, { type: "NUMBER_GREATER_THAN_EQ", values: [{ userEnteredValue: "8" }] }, C.greenBg),
      boolRule(scoreRange, { type: "NUMBER_BETWEEN", values: [{ userEnteredValue: "5" }, { userEnteredValue: "7" }] }, C.amberBg),
      boolRule(scoreRange, { type: "NUMBER_LESS", values: [{ userEnteredValue: "5" }] }, C.greyBg),

      // Stage colours
      boolRule(stageRange, { type: "TEXT_EQ", values: [{ userEnteredValue: "client" }] }, C.hotGreen, C.darkTxt),
      boolRule(stageRange, { type: "TEXT_EQ", values: [{ userEnteredValue: "discovery_booked" }] }, C.blueBg),
      boolRule(stageRange, { type: "TEXT_EQ", values: [{ userEnteredValue: "replied" }] }, C.greenBg),
      boolRule(stageRange, { type: "TEXT_STARTS_WITH", values: [{ userEnteredValue: "emailed" }] }, C.blueBg),

      // Dead rows — grey the ENTIRE row (custom formula on stage col)
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [fullRange],
            booleanRule: {
              condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: `=$${stageLetter}2="dead"` }] },
              format: {
                backgroundColor: C.greyBg,
                textFormat: { foregroundColor: C.greyTxt, italic: true, strikethrough: true },
              },
            },
          },
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [...wipeRequests, ...cfRequests] },
    });
  }

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

  const colCount = TOP10_HEADERS.length;
  const titleRow = [`📅 Top 10 Leads — ${today}`, ...Array(colCount - 1).fill("")];
  const subRow   = [
    "Copy the subject + body → paste into Gmail → personalise the opener if you have time → send → type YES in the Sent? column.",
    ...Array(colCount - 1).fill(""),
  ];
  const blankRow = Array(colCount).fill("");

  const rows = top10.map((l, i) => [
    String(i + 1),
    ...TOP10_COLS.map((c) => {
      if (c === "_sent")          return "";       // blank for Tom to fill in
      if (c === "has_chatbot" || c === "has_voice_agent") return boolLabel(l[c]);
      if (c === "email_subject")  return l.email_subject || "(not generated — run research-daily.js)";
      if (c === "email_draft")    return l.email_draft    || "(not generated — run research-daily.js)";
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

  // ── Formatting ─────────────────────────────────────────────────────────────
  const sheetId = meta.data.sheets.find((s) => s.properties.title === TOP10_TAB)?.properties.sheetId;
  if (sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Bold title row
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
              cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13 } } },
              fields: "userEnteredFormat.textFormat",
            },
          },
          // Header row style — dark bg + white text so labels are visible
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: colCount },
              cell: { userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.12, green: 0.13, blue: 0.16 },
              }},
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          // Business name column width
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 },
              properties: { pixelSize: 200 },
              fields: "pixelSize",
            },
          },
          // Subject line column width
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 2, endIndex: 3 },
              properties: { pixelSize: 280 },
              fields: "pixelSize",
            },
          },
          // Email body column — wide
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 },
              properties: { pixelSize: 520 },
              fields: "pixelSize",
            },
          },
          // Sent? column — narrow
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 4, endIndex: 5 },
              properties: { pixelSize: 120 },
              fields: "pixelSize",
            },
          },
          // Wrap text in subject + body columns (data rows)
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 4, endRowIndex: 14, startColumnIndex: 2, endColumnIndex: 4 },
              cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
              fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
            },
          },
          // Blue highlight on subject column header
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 2, endColumnIndex: 3 },
              cell: { userEnteredFormat: {
                backgroundColor: { red: 0.086, green: 0.247, blue: 0.624 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              }},
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          // Blue highlight on email body column header
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 3, endColumnIndex: 4 },
              cell: { userEnteredFormat: {
                backgroundColor: { red: 0.086, green: 0.247, blue: 0.624 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              }},
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          // Green highlight on Sent? column header
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 5 },
              cell: { userEnteredFormat: {
                backgroundColor: { red: 0.18, green: 0.49, blue: 0.20 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              }},
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
        ],
      },
    });
  }

  console.log(`✅ Synced ${top10.length} leads → "${TOP10_TAB}" tab`);
  return top10.length;
}

// ── Tab 3: Follow-up Queue ────────────────────────────────────────────────────

function d3Template(lead) {
  const first = lead.owner_name ? lead.owner_name.split(" ")[0] : "there";
  return [
    `Hi ${first},`,
    "",
    `Wanted to make sure my last note didn't get buried — I know things move fast.`,
    "",
    `Quick recap: we help ${lead.niche || "businesses"} like yours make sure every call, DM, and enquiry gets a professional response — automatically, 24/7. Most owners we talk to are losing 2–4 leads a week just to slow or missed replies.`,
    "",
    `Worth 20 minutes to see if it fits? Book here: https://cornersystems.co/contact`,
    "",
    `Thomas\nCorner Systems AI`,
  ].join("\n");
}

function d7Template(lead) {
  const first = lead.owner_name ? lead.owner_name.split(" ")[0] : "there";
  return [
    `Hi ${first},`,
    "",
    `Last one from me — I'll leave it here.`,
    "",
    `If you ever want to look at tightening up your front-office response times, I'm easy to reach. No pitch, just a quick conversation.`,
    "",
    `https://cornersystems.co/contact`,
    "",
    `Thomas\nCorner Systems AI`,
  ].join("\n");
}

export async function syncFollowUpQueue() {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);
  await ensureTab(sheets, FOLLOWUP_TAB, existingTabs);

  const d3Leads = getD3FollowUps();
  const d7Leads = getD7FollowUps();

  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const colCount = FOLLOWUP_HEADERS.length;
  const pad = (n) => Array(colCount - 1).fill("");

  const rows = [
    [`📬 Follow-up Queue — ${today}`, ...pad()],
    [`These leads already heard from you. Time to follow up. Short, warm, no pressure. Type YES in Sent? when done.`, ...pad()],
    Array(colCount).fill(""),

    // ── D3 section ──────────────────────────────────────────────────────────
    [`⏰ DAY 3 FOLLOW-UPS — ${d3Leads.length} lead(s)`, ...pad()],
    FOLLOWUP_HEADERS,
    ...(d3Leads.length
      ? d3Leads.map((l) => [
          l.business_name,
          l.email || "",
          `Re: your front office — quick follow-up`,
          d3Template(l),
          "",   // Sent? — Tom fills this in
          l.niche || "",
          String(l.lead_score || ""),
        ])
      : [["— No D3 follow-ups today —", ...pad()]]
    ),

    Array(colCount).fill(""),

    // ── D7 section ──────────────────────────────────────────────────────────
    [`🏁 DAY 7 FINAL TOUCH — ${d7Leads.length} lead(s)`, ...pad()],
    FOLLOWUP_HEADERS,
    ...(d7Leads.length
      ? d7Leads.map((l) => [
          l.business_name,
          l.email || "",
          `Last note — ${l.business_name}`,
          d7Template(l),
          "",   // Sent? — Tom fills this in
          l.niche || "",
          String(l.lead_score || ""),
        ])
      : [["— No D7 follow-ups today —", ...pad()]]
    ),
  ];

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${FOLLOWUP_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${FOLLOWUP_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });

  // ── Formatting for follow-up tab ──────────────────────────────────────────
  const sheetId = meta.data.sheets.find((s) => s.properties.title === FOLLOWUP_TAB)?.properties.sheetId;
  if (sheetId != null) {
    // D3 header row is at index 4; D7 header row is at 4 + d3Leads.length + 1 + 3
    const d3DataStart  = 5;
    const d3DataEnd    = d3DataStart + Math.max(d3Leads.length, 1);
    const d7HeaderRow  = d3DataEnd + 3; // blank + section label + headers
    const d7DataStart  = d7HeaderRow + 1;
    const d7DataEnd    = d7DataStart + Math.max(d7Leads.length, 1);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Title row bold
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
              cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13 } } },
              fields: "userEnteredFormat.textFormat",
            },
          },
          // Message body column wide
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 },
              properties: { pixelSize: 500 },
              fields: "pixelSize",
            },
          },
          // Subject column
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 2, endIndex: 3 },
              properties: { pixelSize: 280 },
              fields: "pixelSize",
            },
          },
          // Business name column
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
              properties: { pixelSize: 210 },
              fields: "pixelSize",
            },
          },
          // Sent? column narrow
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 4, endIndex: 5 },
              properties: { pixelSize: 120 },
              fields: "pixelSize",
            },
          },
          // Wrap text in message body + subject for D3 data
          {
            repeatCell: {
              range: { sheetId, startRowIndex: d3DataStart, endRowIndex: d3DataEnd, startColumnIndex: 2, endColumnIndex: 4 },
              cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
              fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
            },
          },
          // Wrap text for D7 data
          {
            repeatCell: {
              range: { sheetId, startRowIndex: d7DataStart, endRowIndex: d7DataEnd, startColumnIndex: 2, endColumnIndex: 4 },
              cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" } },
              fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
            },
          },
        ],
      },
    });
  }

  console.log(`✅ Synced follow-up queue → "${FOLLOWUP_TAB}" tab (${d3Leads.length} D3, ${d7Leads.length} D7)`);
  return { d3: d3Leads.length, d7: d7Leads.length };
}

// ── Read-back: detect what Tom marked as sent overnight ───────────────────────

/**
 * Reads the "Top 10 Today" tab and returns business names Tom marked as sent.
 * These get advanced to 'emailed_d0' stage in the DB before the next sync.
 */
export async function readBackTop10SentMarks() {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TOP10_TAB}!A1:Z20`,
    });
    const rows = response.data.values || [];

    // Find the header row by looking for our "Business" header
    const headerIdx = rows.findIndex((r) => r[TOP10_BIZ_COL] === "Business");
    if (headerIdx === -1) return [];

    const sent = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row      = rows[i] || [];
      const sentVal  = (row[TOP10_SENT_COL] || "").toLowerCase().trim();
      const bizName  = (row[TOP10_BIZ_COL]  || "").trim();
      if (bizName && sentVal && sentVal !== "") {
        sent.push({ business_name: bizName, stage: "emailed_d0" });
      }
    }
    if (sent.length) {
      console.log(`   📬 Found ${sent.length} sent mark(s) in "${TOP10_TAB}" — advancing stages...`);
    }
    return sent;
  } catch (e) {
    console.log(`   ⚠️  Could not read Top 10 sent marks: ${e.message}`);
    return [];
  }
}

/**
 * Reads the "📬 Follow-ups" tab and returns business names Tom marked as sent,
 * along with the correct stage (d3 or d7) based on which section they're in.
 */
export async function readBackFollowUpSentMarks() {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${FOLLOWUP_TAB}!A1:Z60`,
    });
    const rows = response.data.values || [];

    const sent = [];
    let currentStage = null;

    for (const row of rows) {
      const cell0 = (row[0] || "").trim();

      // Detect which section we're in
      if (cell0.includes("DAY 3 FOLLOW-UPS"))  { currentStage = "emailed_d3"; continue; }
      if (cell0.includes("DAY 7 FINAL TOUCH")) { currentStage = "emailed_d7"; continue; }
      if (cell0 === "Business")                 { continue; } // skip header rows

      if (!currentStage) continue;

      const bizName = (row[FU_BIZ_COL]  || "").trim();
      const sentVal = (row[FU_SENT_COL] || "").toLowerCase().trim();

      if (bizName && sentVal && sentVal !== "") {
        sent.push({ business_name: bizName, stage: currentStage });
      }
    }

    if (sent.length) {
      console.log(`   📬 Found ${sent.length} follow-up sent mark(s) in "${FOLLOWUP_TAB}" — advancing stages...`);
    }
    return sent;
  } catch (e) {
    console.log(`   ⚠️  Could not read Follow-up sent marks: ${e.message}`);
    return [];
  }
}

// ── Read-back: Leads tab overrides (Mark Dead + Notes) ───────────────────────

/**
 * Reads the Leads tab before the daily sync overwrites it.
 * Returns dead leads to kill and notes to persist.
 * Must be called BEFORE syncToSheets() so DB is updated first.
 */
export async function readBackLeadOverrides() {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${LEADS_TAB}!A1:R1000`,
    });
    const rows = response.data.values || [];
    if (rows.length < 2) return { dead: [], noteUpdates: [] };

    const headers     = rows[0];
    const bizIdx      = headers.indexOf("Business");
    const notesIdx    = headers.indexOf("Notes");
    const deadIdx     = headers.findIndex((h) => h?.includes("Mark Dead"));

    if (bizIdx === -1) return { dead: [], noteUpdates: [] };

    const dead        = [];
    const noteUpdates = [];

    for (let i = 1; i < rows.length; i++) {
      const row     = rows[i] || [];
      const bizName = (row[bizIdx]  || "").trim();
      if (!bizName) continue;

      if (deadIdx !== -1) {
        const deadVal = (row[deadIdx] || "").toLowerCase().trim();
        if (deadVal) dead.push(bizName);
      }

      if (notesIdx !== -1) {
        const notesVal = (row[notesIdx] || "").trim();
        if (notesVal) noteUpdates.push({ business_name: bizName, notes: notesVal });
      }
    }

    if (dead.length)        console.log(`   💀 ${dead.length} lead(s) marked dead in sheet`);
    if (noteUpdates.length) console.log(`   📝 ${noteUpdates.length} note(s) to persist`);

    return { dead, noteUpdates };
  } catch (e) {
    console.log(`   ⚠️  Could not read lead overrides: ${e.message}`);
    return { dead: [], noteUpdates: [] };
  }
}

// ── Tab: 📊 Dashboard ─────────────────────────────────────────────────────────

export async function syncDashboard() {
  const sheets = await getSheets();
  const meta   = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);
  await ensureTab(sheets, DASHBOARD_TAB, existingTabs);

  const s    = getDashboardStats();
  const now  = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const stageDisplayNames = {
    found:             "Found (not contacted)",
    emailed_d0:        "Emailed — Day 0",
    emailed_d3:        "Emailed — Day 3",
    emailed_d7:        "Emailed — Day 7",
    replied:           "💬 Replied",
    discovery_booked:  "📅 Discovery Booked",
    client:            "✅ Client",
    dead:              "💀 Dead / Not interested",
    inbound:           "🌐 Inbound (website form)",
  };

  const funnelRows = s.stages.map((r) => [
    stageDisplayNames[r.stage] || r.stage,
    String(r.count),
  ]);

  const emailPct  = s.total > 0 ? Math.round((s.withEmail    / s.total) * 100) : 0;
  const noEmailPct= s.total > 0 ? Math.round((s.withoutEmail / s.total) * 100) : 0;

  const rows = [
    [`📊 CORNER SYSTEMS — PIPELINE DASHBOARD`, ""],
    [`Updated: ${now}`, ""],
    ["", ""],

    ["PIPELINE FUNNEL", ""],
    ["Stage", "Count"],
    ...funnelRows,
    ["Total tracked", String(s.total)],
    ["", ""],

    ["EMAIL COVERAGE", ""],
    ["Leads with email",    `${s.withEmail} (${emailPct}%)`],
    ["Leads without email", `${s.withoutEmail} (${noEmailPct}%)`],
    ["Leads with AI tools already", String(s.withAI)],
    ["", ""],

    ["THIS WEEK (last 7 days)", ""],
    ["New leads found",        String(s.newThisWeek)],
    ["Cold emails sent",       String(s.coldSent)],
    ["D3 follow-ups sent",     String(s.d3Sent)],
    ["D7 final touches sent",  String(s.d7Sent)],
    ["Replies received",       String(s.repliesIn)],
    ["Inbound (website form)", String(s.inboundForm)],
    ["Reply rate",             s.replyRate],
    ["", ""],

    ["REVENUE", ""],
    ["Active clients", String(s.activeClients)],
    ["Monthly MRR",   `$${s.mrr.toFixed(0)}`],
    ["", ""],

    ["TOP NICHES IN PIPELINE", ""],
    ["Niche", "Leads"],
    ...s.topNiches.map((n) => [n.niche, String(n.count)]),
  ];

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${DASHBOARD_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${DASHBOARD_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });

  // ── Formatting ─────────────────────────────────────────────────────────────
  const sheetId = meta.data.sheets.find((s) => s.properties.title === DASHBOARD_TAB)?.properties.sheetId;
  if (sheetId != null) {
    // Classify each row so we can style it correctly
    const SECTION_TITLES = [
      "PIPELINE FUNNEL", "EMAIL COVERAGE", "THIS WEEK (last 7 days)",
      "REVENUE", "TOP NICHES IN PIPELINE",
    ];
    const SUBHEADERS   = ["Stage", "Niche"];   // col-A value of the two-column sub-headers
    const KEY_METRICS  = ["Total tracked", "Reply rate", "Monthly MRR"];

    const sectionRows = [];
    const subHeaderRows = [];
    const keyMetricRows = [];
    const blankRows = [];

    rows.forEach((row, i) => {
      const a = row[0] || "";
      if (i < 2) return; // title + updated handled separately
      if (a === "")                              blankRows.push(i);
      else if (SECTION_TITLES.includes(a))       sectionRows.push(i);
      else if (SUBHEADERS.includes(a))           subHeaderRows.push(i);
      else if (KEY_METRICS.includes(a))          keyMetricRows.push(i);
    });

    const totalRows = rows.length;

    const requests = [
      // Freeze the title + updated rows
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 2 } },
          fields: "gridProperties.frozenRowCount",
        },
      },
      // Hide gridlines for a clean dashboard look
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { hideGridlines: true } },
          fields: "gridProperties.hideGridlines",
        },
      },
      // Column widths
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 300 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 160 },
          fields: "pixelSize",
        },
      },
      // Default row height for all data rows — breathing room
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: totalRows },
          properties: { pixelSize: 30 },
          fields: "pixelSize",
        },
      },
      // Title row — tall, large, white on dark
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 48 },
          fields: "pixelSize",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
          cell: { userEnteredFormat: {
            textFormat: { bold: true, fontSize: 15, foregroundColor: { red: 1, green: 1, blue: 1 } },
            backgroundColor: { red: 0.07, green: 0.08, blue: 0.10 },
            verticalAlignment: "MIDDLE",
            horizontalAlignment: "LEFT",
            padding: { left: 12 },
          }},
          fields: "userEnteredFormat(textFormat,backgroundColor,verticalAlignment,horizontalAlignment,padding)",
        },
      },
      // "Updated:" row — italic grey
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 2 },
          cell: { userEnteredFormat: {
            textFormat: { italic: true, fontSize: 9, foregroundColor: { red: 0.5, green: 0.5, blue: 0.5 } },
            backgroundColor: { red: 0.07, green: 0.08, blue: 0.10 },
            verticalAlignment: "MIDDLE",
            padding: { left: 12 },
          }},
          fields: "userEnteredFormat(textFormat,backgroundColor,verticalAlignment,padding)",
        },
      },
      // Right-align the entire count/value column (data rows)
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: totalRows, startColumnIndex: 1, endColumnIndex: 2 },
          cell: { userEnteredFormat: { horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" } },
          fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)",
        },
      },
      // Left padding + middle align on label column
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: totalRows, startColumnIndex: 0, endColumnIndex: 1 },
          cell: { userEnteredFormat: { verticalAlignment: "MIDDLE", padding: { left: 12 } } },
          fields: "userEnteredFormat(verticalAlignment,padding)",
        },
      },
      // Section header rows — full amber bar, taller, larger
      ...sectionRows.map((rowIdx) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 2 },
          cell: { userEnteredFormat: {
            textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 0.96, green: 0.69, blue: 0.21 } },
            backgroundColor: { red: 0.13, green: 0.12, blue: 0.09 },
            verticalAlignment: "MIDDLE",
            padding: { left: 12 },
          }},
          fields: "userEnteredFormat(textFormat,backgroundColor,verticalAlignment,padding)",
        },
      })),
      // Section header rows — taller
      ...sectionRows.map((rowIdx) => ({
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIdx, endIndex: rowIdx + 1 },
          properties: { pixelSize: 38 },
          fields: "pixelSize",
        },
      })),
      // Sub-header rows (Stage/Count, Niche/Leads) — bold grey, subtle bg
      ...subHeaderRows.map((rowIdx) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 2 },
          cell: { userEnteredFormat: {
            textFormat: { bold: true, fontSize: 9, foregroundColor: { red: 0.45, green: 0.47, blue: 0.5 } },
            backgroundColor: { red: 0.96, green: 0.96, blue: 0.97 },
          }},
          fields: "userEnteredFormat(textFormat,backgroundColor)",
        },
      })),
      // Key metric rows — bold, slightly highlighted
      ...keyMetricRows.map((rowIdx) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 2 },
          cell: { userEnteredFormat: {
            textFormat: { bold: true, fontSize: 11 },
            backgroundColor: { red: 0.99, green: 0.97, blue: 0.90 },
          }},
          fields: "userEnteredFormat(textFormat,backgroundColor)",
        },
      })),
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests },
    });
  }

  console.log(`✅ Dashboard synced → "${DASHBOARD_TAB}" tab`);
}

// ── Read-back: Inbound leads from Apps Script ─────────────────────────────────

/**
 * Reads the "🌐 Inbound" tab written by the Apps Script contact form tracker.
 * Returns unprocessed rows so daily-run can add them to the DB as hot leads.
 */
export async function readBackInboundLeads() {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INBOUND_TAB}!A1:H100`,
    });
    const rows = response.data.values || [];
    if (rows.length < 2) return [];

    const unprocessed = [];
    for (let i = 1; i < rows.length; i++) {
      const row       = rows[i] || [];
      const processed = (row[6] || "").trim();
      const business  = (row[1] || "").trim();
      if (!processed && business) {
        unprocessed.push({
          sheetRow:   i + 1,
          name:       row[0] || "",
          business:   row[1] || "",
          email:      row[2] || "",
          bottleneck: row[3] || "",
          bestTime:   row[4] || "",
          date:       row[5] || "",
        });
      }
    }

    if (unprocessed.length) {
      console.log(`   🌐 Found ${unprocessed.length} unprocessed inbound lead(s)`);
    }
    return unprocessed;
  } catch (e) {
    console.log(`   ⚠️  Could not read Inbound tab (may not exist yet): ${e.message}`);
    return [];
  }
}

export async function markInboundProcessed(sheetRow) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${INBOUND_TAB}!G${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [["✅ Added to CRM"]] },
  });
}

// ── Read-back: Gmail replies logged by Apps Script ───────────────────────────

/**
 * Reads the "📩 Replies" tab written by the Apps Script Gmail tracker.
 * Returns unprocessed rows so daily-run can advance their stage to 'replied'.
 */
export async function readBackReplies() {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${REPLIES_TAB}!A1:G200`,
    });
    const rows = response.data.values || [];
    if (rows.length < 2) return [];

    const unprocessed = [];
    for (let i = 1; i < rows.length; i++) {
      const row       = rows[i] || [];
      const processed = (row[5] || "").trim();
      const bizName   = (row[0] || "").trim();
      if (!processed && bizName) {
        unprocessed.push({
          sheetRow:      i + 1,   // 1-indexed row number in the sheet
          business_name: bizName,
          from_email:    row[1] || "",
          subject:       row[2] || "",
          date:          row[3] || "",
          preview:       row[4] || "",
        });
      }
    }

    if (unprocessed.length) {
      console.log(`   📩 Found ${unprocessed.length} unprocessed reply(ies) in "${REPLIES_TAB}"`);
    }
    return unprocessed;
  } catch (e) {
    console.log(`   ⚠️  Could not read Replies tab: ${e.message}`);
    return [];
  }
}

/**
 * Marks a reply row as processed so it isn't re-processed tomorrow.
 * Called after the DB stage has been updated successfully.
 */
export async function markReplyProcessed(sheetRow) {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${REPLIES_TAB}!F${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [["✅ Done"]] },
  });
}

// ── Tab: 🔥 Hot Leads ─────────────────────────────────────────────────────────

/**
 * Writes a focused view of replied / booked / client leads.
 * This is Tom's active sales list — everything that needs a next action.
 */
export async function syncHotLeads() {
  const sheets = await getSheets();
  const meta   = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTabs = meta.data.sheets.map((s) => s.properties.title);
  await ensureTab(sheets, HOT_TAB, existingTabs);

  const hot   = getHotLeads();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const HEADERS = [
    "Business", "Owner", "Email", "Phone",
    "Stage", "Last Touched", "Niche", "Score", "Notes",
  ];

  const stageLabel = {
    replied:          "💬 Replied",
    discovery_booked: "📅 Call Booked",
    client:           "✅ Client",
  };

  const titleRow = [`🔥 Hot Leads — ${today}`, ...Array(HEADERS.length - 1).fill("")];
  const subRow   = [
    hot.length
      ? `${hot.length} lead(s) need your attention. These replied or are in active conversations.`
      : "No hot leads yet — keep sending. They'll appear here when someone replies.",
    ...Array(HEADERS.length - 1).fill(""),
  ];

  const dataRows = hot.map((l) => [
    l.business_name,
    l.owner_name  || "—",
    l.email       || "—",
    l.phone       || "—",
    stageLabel[l.stage] || l.stage,
    l.last_touched ? l.last_touched.slice(0, 10) : "—",
    l.niche       || "—",
    String(l.lead_score || "—"),
    l.notes       || "",
  ]);

  const values = [titleRow, subRow, Array(HEADERS.length).fill(""), HEADERS, ...dataRows];

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${HOT_TAB}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${HOT_TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  // Formatting
  const sheetId = meta.data.sheets.find((s) => s.properties.title === HOT_TAB)?.properties.sheetId;
  if (sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          // Title bold + large
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: HEADERS.length },
              cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 13 } } },
              fields: "userEnteredFormat.textFormat",
            },
          },
          // Header row — dark bg, white text
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: HEADERS.length },
              cell: { userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.12, green: 0.13, blue: 0.16 },
              }},
              fields: "userEnteredFormat(textFormat,backgroundColor)",
            },
          },
          // Business name column wide
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
              properties: { pixelSize: 210 },
              fields: "pixelSize",
            },
          },
          // Email column wide
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 2, endIndex: 3 },
              properties: { pixelSize: 220 },
              fields: "pixelSize",
            },
          },
          // Notes column wide
          {
            updateDimensionProperties: {
              range: { sheetId, dimension: "COLUMNS", startIndex: 8, endIndex: 9 },
              properties: { pixelSize: 300 },
              fields: "pixelSize",
            },
          },
        ],
      },
    });
  }

  console.log(`✅ Synced ${hot.length} hot lead(s) → "${HOT_TAB}" tab`);
  return hot.length;
}

// ── Run directly ──────────────────────────────────────────────────────────────
const isDirect = process.argv[1]?.endsWith("sync-to-sheets.js");
if (isDirect) {
  (async () => {
    await syncToSheets();
    await syncTop10Daily();
    await syncFollowUpQueue();
    await syncHotLeads();
    await syncDashboard();
  })().catch((err) => {
    console.error("Sheets sync error:", err.message);
    if (err.message.toLowerCase().includes("permission")) {
      console.error("   → Share the sheet with the service account email (Editor access).");
    }
    process.exit(1);
  });
}
