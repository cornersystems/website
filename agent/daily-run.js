#!/usr/bin/env node
/**
 * Corner Systems — Daily Automation
 *
 * Runs every morning at 7am. Research only — no emails, no calls.
 *
 * Run order:
 *   1. Read-back phase (BEFORE research, BEFORE sync)
 *      a. Leads tab   → apply dead marks + persist notes
 *      b. Top 10 tab  → advance "Sent?" marks to emailed_d0
 *      c. Follow-ups  → advance D3/D7 sent marks
 *      d. Replies tab → advance Gmail replies to 'replied'
 *      e. Inbound tab → add website contact form leads to CRM
 *   2. Research new leads
 *   3. Sync all tabs
 *      - Leads, Top 10 Today, 📬 Follow-ups, 🔥 Hot Leads, 📊 Dashboard
 *
 * Usage: node agent/daily-run.js
 */

import "dotenv/config";
import { researchNewLeads } from "./research-daily.js";
import {
  syncToSheets,
  archiveYesterdayTop10,
  syncTop10Daily,
  syncFollowUpQueue,
  syncHotLeads,
  syncDashboard,
  readBackLeadOverrides,
  readBackTop10SentMarks,
  readBackFollowUpSentMarks,
  readBackReplies,
  markReplyProcessed,
  readBackInboundLeads,
  markInboundProcessed,
} from "./sync-to-sheets.js";
import {
  markLeadSent,
  markLeadReplied,
  markLeadDead,
  updateLeadNotes,
  addInboundLead,
  getStats,
} from "./db.js";

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

  // ── 1. Read-back phase ────────────────────────────────────────────────────
  if (hasSheets) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Reading back sheet changes from yesterday...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // a. Dead marks + notes from Leads tab
    try {
      const { dead, noteUpdates } = await readBackLeadOverrides();

      for (const bizName of dead) {
        const ok = markLeadDead(bizName);
        console.log(ok
          ? `   💀 Killed: ${bizName}`
          : `   ⚠️  Not found for dead mark: ${bizName}`);
      }
      for (const { business_name, notes } of noteUpdates) {
        updateLeadNotes(business_name, notes);
      }
      if (noteUpdates.length) {
        console.log(`   📝 Persisted notes for ${noteUpdates.length} lead(s)`);
      }
    } catch (e) {
      console.error(`  Lead overrides read-back failed: ${e.message}`);
    }

    // b. Top 10 sent marks → emailed_d0
    // c. Follow-up sent marks → emailed_d3 / emailed_d7
    let markedCount = 0;
    try {
      const top10Sent = await readBackTop10SentMarks();
      for (const { business_name, stage } of top10Sent) {
        const ok = markLeadSent(business_name, stage);
        if (ok) { console.log(`   📬 Sent (${stage}): ${business_name}`); markedCount++; }
      }

      const fuSent = await readBackFollowUpSentMarks();
      for (const { business_name, stage } of fuSent) {
        const ok = markLeadSent(business_name, stage);
        if (ok) { console.log(`   📬 Sent (${stage}): ${business_name}`); markedCount++; }
      }

      if (markedCount === 0) console.log("   (No sent marks — continuing)");
      else console.log(`\n   📬 ${markedCount} lead(s) advanced`);
    } catch (e) {
      console.error(`  Sent-mark read-back failed: ${e.message}`);
    }

    // d. Gmail replies → 'replied'
    try {
      const replies = await readBackReplies();
      let replyCount = 0;
      for (const reply of replies) {
        const ok = markLeadReplied(reply.business_name);
        if (ok) {
          await markReplyProcessed(reply.sheetRow);
          console.log(`   💬 Reply → replied: ${reply.business_name}`);
          replyCount++;
        }
      }
      if (replyCount > 0) {
        console.log(`\n   🎉 ${replyCount} lead(s) moved to 'replied' — check Hot Leads`);
      }
    } catch (e) {
      console.error(`  Reply read-back failed: ${e.message}`);
    }

    // e. Inbound website leads
    try {
      const inbound = await readBackInboundLeads();
      let inboundCount = 0;
      for (const lead of inbound) {
        addInboundLead(lead);
        await markInboundProcessed(lead.sheetRow);
        console.log(`   🌐 Inbound added: ${lead.business} (${lead.email})`);
        inboundCount++;
      }
      if (inboundCount > 0) {
        console.log(`\n   🌐 ${inboundCount} website lead(s) added to CRM — check Hot Leads`);
      }
    } catch (e) {
      console.error(`  Inbound read-back failed: ${e.message}`);
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

  // ── 3. Sync all tabs ──────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Updating Google Sheets...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (hasSheets) {
    try {
      await syncToSheets();       // Leads tab (with Mark Dead + Notes columns)
      await archiveYesterdayTop10(); // copy current Top 10 → "Top 10 — Yesterday" first
      await syncTop10Daily();     // Top 10 Today (regenerates after archiving)
      await syncFollowUpQueue();  // 📬 Follow-ups
      await syncHotLeads();       // 🔥 Hot Leads
      await syncDashboard();      // 📊 Dashboard
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
  console.log(`║  New leads today:   ${String(newLeads).padEnd(33)}║`);
  console.log(`║  Total in CRM:      ${String(total).padEnd(33)}║`);
  console.log(`║  Active clients:    ${String(stats.activeClients).padEnd(33)}║`);
  console.log(`║  MRR:               $${String(stats.mrr.toFixed(0)).padEnd(32)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  for (const row of stats.stages) {
    const line = `  ${row.stage}: ${row.count}`;
    console.log(`║${line.padEnd(54)}║`);
  }
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Run time: ${elapsed}s${" ".repeat(Math.max(0, 43 - elapsed.length))}║`);
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\n📋 Your sheet tabs:");
  console.log("   → 📊 Dashboard     — pipeline health at a glance");
  console.log("   → Top 10 Today     — send these, mark yes when done");
  console.log("   → 🔥 Hot Leads     — replied / inbound — needs your reply");
  console.log("   → 📬 Follow-ups    — D3/D7 nudges due today");
  console.log("   → Leads            — full CRM (edit Notes, Mark Dead here)\n");
}

run().catch((err) => {
  console.error("Daily run error:", err);
  process.exit(1);
});
