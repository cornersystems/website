#!/usr/bin/env node
/**
 * Corner Systems — Daily Automation Orchestrator
 *
 * Runs every morning automatically (scheduled via cron / scheduled tasks).
 * Full pipeline in sequence:
 *   1. Research new leads (current geo phase, deep email dig, AI detection, email draft)
 *   2. Send email sequences (cold → d3 follow → d7 last-touch)
 *   3. Trigger outbound calls on non-responding leads
 *   4. Send 30-day client check-ins
 *   5. Sync everything to Google Sheets (Leads tab + Top 10 Today tab)
 *
 * Usage: node agent/daily-run.js
 */

import "dotenv/config";
import { researchNewLeads } from "./research-daily.js";
import { syncToSheets, syncTop10Daily } from "./sync-to-sheets.js";
import { getLeadsByStage, getLeadsSince, getCheckinsdue, updateCheckin, getStats } from "./db.js";
import { sendSequenceEmail } from "./email-outreach.js";
import { callLead } from "./call-leads.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DELAY = 1200; // ms between emails

async function run() {
  const startTime = Date.now();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       Corner Systems — Daily Automation Run          ║");
  console.log(`║       ${today.padEnd(46)}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");

  let newLeads = 0, sent = 0, called = 0, checkins = 0, skipped = 0;

  // ── 1. Research: find & deep-dive new leads ───────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  STEP 1 — Research New Leads");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  try {
    newLeads = await researchNewLeads();
  } catch (e) {
    console.error(`  Research failed: ${e.message}`);
  }

  // ── 2. Cold emails → fresh leads ─────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  STEP 2 — Email Sequences");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const freshLeads = getLeadsByStage("found");
  if (freshLeads.length) {
    console.log(`\n  📬 Cold emails — ${freshLeads.length} lead(s)`);
    for (const lead of freshLeads) {
      if (!lead.email) { skipped++; continue; }
      const ok = await sendSequenceEmail(lead, "cold_d0");
      ok ? sent++ : skipped++;
      await sleep(DELAY);
    }
  }

  const d3Leads = getLeadsSince("emailed_d0", 3);
  if (d3Leads.length) {
    console.log(`\n  📬 Day-3 follow-up — ${d3Leads.length} lead(s)`);
    for (const lead of d3Leads) {
      if (!lead.email) { skipped++; continue; }
      const ok = await sendSequenceEmail(lead, "follow_d3");
      ok ? sent++ : skipped++;
      await sleep(DELAY);
    }
  }

  const d7Leads = getLeadsSince("emailed_d3", 4);
  if (d7Leads.length) {
    console.log(`\n  📬 Day-7 last touch — ${d7Leads.length} lead(s)`);
    for (const lead of d7Leads) {
      if (!lead.email) { skipped++; continue; }
      const ok = await sendSequenceEmail(lead, "follow_d7");
      ok ? sent++ : skipped++;
      await sleep(DELAY);
    }
  }

  // ── 3. Outbound calls ────────────────────────────────────────────────────
  const callLeads = getLeadsSince("emailed_d7", 3);
  if (callLeads.length) {
    console.log(`\n  📞 Outbound calls — ${callLeads.length} lead(s)`);
    for (const lead of callLeads) {
      const ok = await callLead(lead);
      ok ? called++ : skipped++;
      await sleep(3000);
    }
  }

  // ── 4. Client check-ins ──────────────────────────────────────────────────
  const dueCheckins = getCheckinsdue();
  if (dueCheckins.length) {
    console.log(`\n  💬 Client check-ins — ${dueCheckins.length} due`);
    for (const client of dueCheckins) {
      const fakeLead = { id: client.lead_id, ...client };
      const ok = await sendSequenceEmail(fakeLead, "checkin_d30");
      if (ok) { updateCheckin(client.id); checkins++; }
      await sleep(DELAY);
    }
  }

  // ── 5. Sync to Google Sheets ─────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  STEP 3 — Google Sheets Sync");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (process.env.GOOGLE_SHEET_ID) {
    try {
      await syncToSheets();
      await syncTop10Daily();
    } catch (e) {
      console.error(`  Sheets sync failed: ${e.message}`);
    }
  } else {
    console.log("  (Google Sheets sync skipped — GOOGLE_SHEET_ID not set)");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const stats = getStats();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                    Daily Summary                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  New leads researched:  ${String(newLeads).padEnd(29)}║`);
  console.log(`║  Emails sent:           ${String(sent).padEnd(29)}║`);
  console.log(`║  Calls triggered:       ${String(called).padEnd(29)}║`);
  console.log(`║  Check-ins sent:        ${String(checkins).padEnd(29)}║`);
  console.log(`║  Skipped (no email):    ${String(skipped).padEnd(29)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║                    Pipeline State                    ║");
  for (const row of stats.stages) {
    const line = `  ${row.stage}: ${row.count}`;
    console.log(`║${line.padEnd(54)}║`);
  }
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Active clients:  ${String(stats.activeClients).padEnd(35)}║`);
  console.log(`║  MRR:             $${String(stats.mrr.toFixed(2)).padEnd(34)}║`);
  console.log(`║  Run time:        ${elapsed}s${" ".repeat(Math.max(0, 34 - elapsed.length - 1))}║`);
  console.log("╚══════════════════════════════════════════════════════╝\n");
}

run().catch((err) => {
  console.error("Daily run error:", err);
  process.exit(1);
});
