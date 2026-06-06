#!/usr/bin/env node
/**
 * Export all CRM leads to a TSV file for direct paste into Google Sheets.
 * Tab-separated values auto-distribute into columns on paste.
 *   node agent/export-tsv.js            -> all leads, with header
 *   node agent/export-tsv.js --no-header -> rows only (to append under existing data)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllLeads } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const noHeader = process.argv.includes("--no-header");

// Clean cell: strip tabs/newlines that would break TSV alignment
const cell = (v) => (v == null ? "" : String(v).replace(/[\t\n\r]+/g, " ").trim());

const cols = ["id","business_name","owner_name","city","state","phone","email","website","niche","lead_score","stage","pain_signal","notes"];
const leads = getAllLeads();
if (!leads.length) { console.log("No leads in CRM."); process.exit(0); }

const rows = [];
if (!noHeader) rows.push(cols.join("\t"));
for (const l of leads) rows.push(cols.map((c) => cell(l[c])).join("\t"));

const outPath = path.join(__dirname, "leads-for-sheets.tsv");
fs.writeFileSync(outPath, rows.join("\n"));

console.log(`\n📋 Wrote ${leads.length} leads -> agent/leads-for-sheets.tsv`);
console.log(`   Open it, Ctrl+A, Ctrl+C, then paste into your Google Sheet.\n`);
