#!/usr/bin/env node
/**
 * Corner Systems — Daily Automation (Research + Sheets Only)
 *
 * Runs every morning at 7am automatically.
 * Does NOT send any emails or make any calls — Thomas handles all outreach manually.
 *
 * What it does (in order):
 *   1. Reads "Top 10 Today" sheet — advances any leads Tom marked "yes" to emailed_d0
 *   2. Reads "📬 Follow-ups" sheet — advances D3/D7 sent marks to emailed_d3/emailed_d7
 *   3. Researches new leads in the current geographic phase
 *   4. Syncs everything to Google Sheets:
 *        - "Leads" tab        — full CRM sorted by score
 *        - "Top 10 Today" tab — 10 best leads, subject + email body + Sent? column
 *        - "📬 Follow-ups" tab — D3 and D7 follow-up queue with pre-written messages
 *
 * Usage: node agent/daily-run.js
 */

import "dotenv/config";
import { researchNewLeads } from "./research-daily.js";
import {
  syncToSheets,
  syncTop10Daily,
  syncFollowUpQueue,
  readBackTop10SentMarks,
  readBackFollowUpSentMarks,
} from "./sync-to-sheets.js";
import { markLeadSent, getStats } from "./db.js";

async function run() {
  const startTime = Date.now();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       Corner Systems — Daily Research Run            ║");
  console.log(`║       ${today.padEnd(46)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const hasSheets = !!process.env.GOOGLE_SHEET_ID;

  // ── 1. Read back sent marks from last night ───────────────────────────────
  if (hasSheets) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Checking for leads Tom marked as sent yesterday...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let markedCount = 0;
    try {
      // Top 10 tab — cold emails sent → emailed_d0
      const top10Sent = await readBackTop10SentMarks();
      for (const { business_name, stage } of top10Sent) {
        const ok = markLeadSent(business_name, stage);
        if (ok) {
          console.log(`   ✅ Marked sent (${stage}): ${business_name}`);
          markedCount++;
        } else {
          console.log(`   ⚠️  Not found in DB: ${business_name}`);
        }
      }

      // Follow-up tab — D3/D7 follow-ups sent
      const fuSent = await readBackFollowUpSentMarks();
      for (const { business_name, stage } of fuSent) {
        const ok = markLeadSent(business_name, stage);
        if (ok) {
          console.log(`   ✅ Marked sent (${stage}): ${business_name}`);
          markedCount++;
        } else {
          console.log(`   ⚠️  Not found in DB: ${business_name}`);
        }
      }

      if (markedCount === 0) {
        console.log("   (No new sent marks found — continuing)");
      } else {
        console.log(`\n   📬 ${markedCount} lead(s) advanced in pipeline`);
      }
    } catch (e) {
      console.error(`  Sent-mark read-back failed: ${e.message}`);
    }
  }

  // ── 2. Research new leads ─────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Finding new leads, hunting emails, checking AI presence...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  let newLeads = 0;
  try {
    newLeads = await researchNewLeads();
  } catch (e) {
    console.error(`  Research failed: ${e.message}`);
  }

  // ── 3. Sync to Google Sheets ──────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Updating Google Sheets...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (hasSheets) {
    try {
      await syncToSheets();
      await syncTop10Daily();
      await syncFollowUpQueue();
    } catch (e) {
      console.error(`  Sheets sync failed: ${e.message}`);
    }
  } else {
    console.log("  (Skipped — GOOGLE_SHEET_ID not set in .env)");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const stats   = getStats();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const total   = stats.stages.reduce((s, r) => s + r.count, 0);

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                      Summary                         ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  New leads added today:  ${String(newLeads).padEnd(28)}║`);
  console.log(`║  Total in CRM:           ${String(total).padEnd(28)}║`);
  console.log(`║  Active clients (MRR):   $${String(stats.mrr.toFixed(0)).padEnd(27)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  for (const row of stats.stages) {
    const line = `  ${row.stage}: ${row.count}`;
    console.log(`║${line.padEnd(54)}║`);
  }
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Run time: ${elapsed}s${" ".repeat(Math.max(0, 43 - elapsed.length))}║`);
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\n📋 Open your sheet:");
  console.log("   → 'Top 10 Today'   — copy subject + body, send emails, type YES when done");
  console.log("   → '📬 Follow-ups'  — anyone needing a D3 or D7 follow-up today\n");
}

run().catch((err) => {
  console.error("Daily run error:", err);
  process.exit(1);
});
