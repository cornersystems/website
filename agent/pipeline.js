#!/usr/bin/env node
/**
 * Corner Systems — Sales Pipeline Orchestrator
 *
 * Run this daily (manually or via cron):
 *   node agent/pipeline.js
 *
 * What it does each run:
 *   1. Sends cold emails to all fresh leads (stage: found)
 *   2. Sends day-3 follow-up to leads with no reply (stage: emailed_d0, 3+ days ago)
 *   3. Sends day-7 last-touch (stage: emailed_d3, 4+ days ago)
 *   4. Triggers outbound ElevenLabs calls (stage: emailed_d7, 3+ days ago)
 *   5. Sends 30-day check-ins to active clients
 *   6. Prints pipeline summary
 */

import "dotenv/config";
import { getLeadsByStage, getLeadsSince, getCheckinsdue, updateCheckin, getStats } from "./db.js";
import { sendSequenceEmail } from "./email-outreach.js";
import { callLead } from "./call-leads.js";

const DELAY_MS = 1200; // 1.2s between sends — avoid rate limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║      Corner Systems — Pipeline Run               ║");
  console.log(`║      ${new Date().toLocaleString().padEnd(44)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  let sent = 0, called = 0, checkins = 0, skipped = 0;

  // ── Step 1: Cold emails → new leads ───────────────────────────────────────
  const freshLeads = getLeadsByStage("found");
  if (freshLeads.length) {
    console.log(`📬 Cold emails — ${freshLeads.length} fresh lead(s)\n`);
    for (const lead of freshLeads) {
      const ok = await sendSequenceEmail(lead, "cold_d0");
      ok ? sent++ : skipped++;
      await sleep(DELAY_MS);
    }
  }

  // ── Step 2: Day-3 follow-up ────────────────────────────────────────────────
  const d3Leads = getLeadsSince("emailed_d0", 3);
  if (d3Leads.length) {
    console.log(`\n📬 Day-3 follow-up — ${d3Leads.length} lead(s)\n`);
    for (const lead of d3Leads) {
      const ok = await sendSequenceEmail(lead, "follow_d3");
      ok ? sent++ : skipped++;
      await sleep(DELAY_MS);
    }
  }

  // ── Step 3: Day-7 last touch ───────────────────────────────────────────────
  const d7Leads = getLeadsSince("emailed_d3", 4);
  if (d7Leads.length) {
    console.log(`\n📬 Day-7 last touch — ${d7Leads.length} lead(s)\n`);
    for (const lead of d7Leads) {
      const ok = await sendSequenceEmail(lead, "follow_d7");
      ok ? sent++ : skipped++;
      await sleep(DELAY_MS);
    }
  }

  // ── Step 4: Outbound calls — after email sequence with no reply ────────────
  const callLeads = getLeadsSince("emailed_d7", 3);
  if (callLeads.length) {
    console.log(`\n📞 Outbound calls — ${callLeads.length} lead(s)\n`);
    for (const lead of callLeads) {
      const ok = await callLead(lead);
      ok ? called++ : skipped++;
      await sleep(3000); // 3s between calls
    }
  }

  // ── Step 5: Client 30-day check-ins ───────────────────────────────────────
  const dueCheckins = getCheckinsdue();
  if (dueCheckins.length) {
    console.log(`\n💬 Client check-ins — ${dueCheckins.length} due\n`);
    for (const client of dueCheckins) {
      const fakeLead = { id: client.lead_id, ...client };
      const ok = await sendSequenceEmail(fakeLead, "checkin_d30");
      if (ok) { updateCheckin(client.id); checkins++; }
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const stats = getStats();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                  Run Summary                     ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Emails sent:      ${String(sent).padEnd(30)}║`);
  console.log(`║  Calls triggered:  ${String(called).padEnd(30)}║`);
  console.log(`║  Check-ins sent:   ${String(checkins).padEnd(30)}║`);
  console.log(`║  Skipped:          ${String(skipped).padEnd(30)}║`);
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║                  Pipeline State                  ║");

  for (const row of stats.stages) {
    const line = `  ${row.stage}:  ${row.count}`;
    console.log(`║${line.padEnd(50)}║`);
  }

  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Active clients:   ${String(stats.activeClients).padEnd(30)}║`);
  console.log(`║  MRR:              $${String(stats.mrr.toFixed(2)).padEnd(29)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");
}

run().catch((err) => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
