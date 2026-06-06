#!/usr/bin/env node
/**
 * Corner Systems — Daily Automation (Research + Sheets Only)
 *
 * Runs every morning at 7am automatically.
 * Does NOT send any emails or make any calls — Thomas handles all outreach manually.
 *
 * What it does:
 *   1. Researches new leads in the current geographic phase
 *   2. Deep-dives to find real emails + detect AI presence
 *   3. Generates personalized cold email draft for each lead
 *   4. Syncs everything to Google Sheets:
 *        - "Leads" tab — full CRM with all research data
 *        - "Top 10 Today" tab — 10 best leads with emails + ready-to-send drafts
 *
 * Usage: node agent/daily-run.js
 */

import "dotenv/config";
import { researchNewLeads } from "./research-daily.js";
import { syncToSheets, syncTop10Daily } from "./sync-to-sheets.js";
import { getStats } from "./db.js";

async function run() {
  const startTime = Date.now();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       Corner Systems — Daily Research Run            ║");
  console.log(`║       ${today.padEnd(46)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── 1. Research new leads ─────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Finding new leads, hunting emails, checking AI presence...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let newLeads = 0;
  try {
    newLeads = await researchNewLeads();
  } catch (e) {
    console.error(`  Research failed: ${e.message}`);
  }

  // ── 2. Sync to Google Sheets ──────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Updating Google Sheets...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (process.env.GOOGLE_SHEET_ID) {
    try {
      await syncToSheets();
      await syncTop10Daily();
    } catch (e) {
      console.error(`  Sheets sync failed: ${e.message}`);
    }
  } else {
    console.log("  (Skipped — GOOGLE_SHEET_ID not set in .env)");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const stats = getStats();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                      Summary                         ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  New leads added today:  ${String(newLeads).padEnd(28)}║`);
  console.log(`║  Total in CRM:           ${String(stats.stages.reduce((s, r) => s + r.count, 0)).padEnd(28)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  for (const row of stats.stages) {
    const line = `  ${row.stage}: ${row.count}`;
    console.log(`║${line.padEnd(54)}║`);
  }
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Run time: ${elapsed}s${" ".repeat(Math.max(0, 43 - elapsed.length))}║`);
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\n📋 Open your sheet → 'Top 10 Today' tab → 10 leads ready to send.\n");
}

run().catch((err) => {
  console.error("Daily run error:", err);
  process.exit(1);
});
