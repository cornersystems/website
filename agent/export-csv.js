#!/usr/bin/env node
/** Export all CRM leads to a timestamped CSV. */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllLeads } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function esc(v) {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

const leads = getAllLeads();
if (!leads.length) { console.log("No leads in CRM. Run seed-toronto-tier1.js or find-leads.js first."); process.exit(0); }

const cols = ["id","business_name","owner_name","city","state","phone","email","website","niche","lead_score","stage","pain_signal","notes"];
const rows = [cols.join(",")];
for (const l of leads) rows.push(cols.map((c) => esc(l[c])).join(","));

const date = new Date().toISOString().slice(0, 10);
const outPath = path.join(__dirname, `leads-export-${date}.csv`);
fs.writeFileSync(outPath, rows.join("\n"));

console.log(`\n📄 Exported ${leads.length} leads → agent/leads-export-${date}.csv\n`);
