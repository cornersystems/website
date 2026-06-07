#!/usr/bin/env node
/**
 * Corner Systems — One-off re-score of existing leads
 *
 * The original lead scores were set by an LLM guessing at AI presence from
 * memory, which mis-scored businesses that already run booking/chat tools
 * (e.g. a med spa with Jane + live chat scored 9). This script fixes the
 * backlog: it re-detects tooling from each lead's live website using the
 * deterministic scraper, recomputes the score from a neutral baseline, and
 * writes a human-readable "why" reason.
 *
 * Safe to re-run — it only reads sites and updates score/reason/tools columns.
 * Does NOT contact any lead.
 *
 * Usage: node agent/rescore-existing.js
 */

import "dotenv/config";
import { getAllLeads, updateScoreMeta } from "./db.js";
import { detectTools } from "./detect-tools.js";
import { rescoreAfterResearch } from "./research-daily.js";

const NEUTRAL_BASE = 5;   // recompute from a clean baseline, not the unreliable old score
const CONCURRENCY  = 6;

async function rescoreOne(lead) {
  // Detect tooling from the live site (no website → nothing to detect)
  const toolInfo = lead.website
    ? await detectTools(lead.website)
    : { has_website: false, has_chatbot: false, has_booking: false, has_voice_agent: false, tools_found: [] };

  const research = {
    email:           lead.email,           // already known — affects score
    has_website:     toolInfo.has_website || !!lead.website,
    has_chatbot:     toolInfo.has_chatbot,
    has_booking:     toolInfo.has_booking,
    has_voice_agent: toolInfo.has_voice_agent,
    tools_found:     toolInfo.tools_found,
  };

  const { score, reason } = rescoreAfterResearch(NEUTRAL_BASE, lead.niche, research);

  updateScoreMeta(lead.id, {
    score,
    reason,
    tools:      toolInfo.tools_found.join(", "),
    hasBooking: toolInfo.has_booking,
  });

  return {
    name:   lead.business_name,
    from:   lead.lead_score,
    to:     score,
    tools:  toolInfo.tools_found,
  };
}

// Simple concurrency pool
async function runPool(items, worker, size) {
  const results = [];
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await worker(items[i]); }
      catch (e) { results[i] = { name: items[i].business_name, error: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, next));
  return results;
}

async function main() {
  const leads = getAllLeads();
  console.log(`\n🔄 Re-scoring ${leads.length} existing leads (detecting real tooling)...\n`);

  const results = await runPool(leads, rescoreOne, CONCURRENCY);

  // Sort by biggest drop so the corrections are obvious
  const moved = results
    .filter((r) => r && !r.error && r.from != null)
    .sort((a, b) => (a.to - a.from) - (b.to - b.from));

  console.log("Biggest corrections (score dropped — already had tooling):");
  for (const r of moved.slice(0, 12)) {
    if (r.to >= r.from) continue;
    const tools = r.tools.length ? ` [${r.tools.join(", ")}]` : "";
    console.log(`   ${r.name}: ${r.from} → ${r.to}${tools}`);
  }

  const dropped  = moved.filter((r) => r.to < r.from).length;
  const tooled   = results.filter((r) => r && r.tools && r.tools.length).length;
  const errors   = results.filter((r) => r && r.error).length;

  console.log(`\n✅ Done. ${dropped} leads dropped, ${tooled} found with existing tools, ${errors} errors.`);
  console.log("   Run: node agent/sync-to-sheets.js  to refresh the sheet.\n");
}

main().catch((err) => { console.error("Rescore error:", err); process.exit(1); });
