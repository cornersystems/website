#!/usr/bin/env node
/**
 * Corner Systems — Google Sheets Sync
 * Pushes all CRM leads to your Google Sheet automatically.
 *
 * Setup (one-time): see agent/GOOGLE-SHEETS-SETUP.md
 *
 * Requires in .env:
 *   GOOGLE_SHEET_ID=1Z2mNEyKcsPwJWX3eqnSA3cflt--gb3f6x3ErN9m9jdA
 *   GOOGLE_SERVICE_ACCOUNT_KEY=./agent/google-key.json   (path to the JSON key)
 *
 * Usage:
 *   node agent/sync-to-sheets.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import { getAllLeads } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
const KEY_PATH  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "./agent/google-key.json";
const TAB_NAME  = process.env.GOOGLE_SHEET_TAB || "Leads";

const COLS = ["business_name","owner_name","city","state","phone","email","website","niche","lead_score","stage","pain_signal","notes"];
const HEADERS = ["Rank","Business","Owner","City","State","Phone","Email","Website","Niche","Score","Stage","Pain Signal","Notes"];

export async function syncToSheets() {
  if (!SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID in .env");
  const keyFile = path.resolve(__dirname, "..", KEY_PATH);
  if (!fs.existsSync(keyFile)) {
    throw new Error(`Service account key not found at ${keyFile} (see agent/GOOGLE-SHEETS-SETUP.md)`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Ensure the target tab exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabExists = meta.data.sheets.some((s) => s.properties.title === TAB_NAME);
  if (!tabExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: TAB_NAME } } }] },
    });
    console.log(`   Created tab "${TAB_NAME}"`);
  }

  // Rank by lead score (highest value first), then by business name
  const leads = getAllLeads().sort((a, b) =>
    (b.lead_score || 0) - (a.lead_score || 0) ||
    a.business_name.localeCompare(b.business_name)
  );
  const values = [
    HEADERS,
    ...leads.map((l, i) => [String(i + 1), ...COLS.map((c) => (l[c] == null ? "" : String(l[c])))]),
  ];

  // Clear then write — keeps the sheet a clean mirror of the CRM
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${TAB_NAME}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  console.log(`\n✅ Synced ${leads.length} leads to Google Sheet tab "${TAB_NAME}"`);
  console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}\n`);
  return leads.length;
}

// Run directly (node agent/sync-to-sheets.js) vs imported by pipeline
const isDirect = process.argv[1] && process.argv[1].endsWith("sync-to-sheets.js");
if (isDirect) {
  syncToSheets().catch((err) => {
    console.error("Sheets sync error:", err.message);
    if (err.message.toLowerCase().includes("permission")) {
      console.error("   → Share the sheet with the service account email (Editor access).");
    }
    process.exit(1);
  });
}
