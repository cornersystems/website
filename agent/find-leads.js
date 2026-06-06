#!/usr/bin/env node
/**
 * Corner Systems — Lead Research Agent
 *
 * Usage:
 *   node agent/find-leads.js --niche "MMA gyms" --location "Austin, TX" --count 20
 *   node agent/find-leads.js --niche "BJJ academies" --location "Miami, FL"
 *
 * Output: agent/leads-<niche>-<location>-<date>.csv
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { upsertLead } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const NICHE    = get("--niche")    || "MMA gyms";
const LOCATION = get("--location") || "United States";
const COUNT    = parseInt(get("--count") || "15", 10);

// ── Anthropic client ──────────────────────────────────────────────────────────
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── CSV helpers ───────────────────────────────────────────────────────────────
function escapeCSV(val) {
  if (val == null) return "";
  const s = String(val).replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escapeCSV(row[h])).join(","));
  return lines.join("\n");
}

// ── Agent loop ────────────────────────────────────────────────────────────────
async function runAgent() {
  const systemPrompt = `You are a B2B sales research agent for Corner Systems, a company that builds
AI-powered front office systems for service businesses (AI receptionists, lead capture, CRM, follow-up automation).

Your job: find ${COUNT} real ${NICHE} in ${LOCATION} that are likely losing leads because of poor
front-office coverage — missed calls, slow DM replies, no follow-up system.

For each lead, research and return:
- business_name
- owner_name (if findable)
- city
- state
- website (full URL)
- phone
- email (if public)
- instagram_handle (without @)
- google_maps_url
- lead_score (1-10, based on: busy gym with reviews but no booking system = high score)
- pain_signal (one sentence: what signals they're losing leads — e.g. "47 Google reviews but no online booking, goes to voicemail")
- notes (anything useful for the cold outreach)

Use web search to find real businesses with real contact info. Do not invent data.
Prioritize gyms with:
- High Google review counts (shows traffic) but weak digital systems
- No online booking
- Instagram presence but inconsistent or slow replies
- Missing or outdated websites
- No chatbot or contact form

When you have all ${COUNT} leads fully researched, output ONLY a JSON array — no markdown, no explanation.
Each item must have all fields above (use empty string if not found).`;

  const messages = [
    {
      role: "user",
      content: `Research and find ${COUNT} ${NICHE} in ${LOCATION} that would benefit from Corner Systems' front-office coverage. Return the results as a JSON array.`,
    },
  ];

  console.log(`\n🔍 Corner Systems Lead Agent`);
  console.log(`   Niche:    ${NICHE}`);
  console.log(`   Location: ${LOCATION}`);
  console.log(`   Target:   ${COUNT} leads\n`);

  let leads = [];
  let iterations = 0;
  const maxIterations = 12;

  while (iterations < maxIterations) {
    iterations++;
    process.stdout.write(`   [${iterations}] Researching...`);

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages,
    });

    process.stdout.write(` stop_reason: ${response.stop_reason}\n`);

    // Show search activity
    for (const block of response.content) {
      if (block.type === "tool_use" && block.name === "web_search") {
        console.log(`   🌐 Searching: "${block.input.query}"`);
      }
      if (block.type === "text" && block.text.trim()) {
        const preview = block.text.trim().slice(0, 120).replace(/\n/g, " ");
        console.log(`   💬 ${preview}${block.text.length > 120 ? "…" : ""}`);
      }
    }

    // If done, extract JSON
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock) {
        const raw = textBlock.text.trim();
        // Strip markdown code fences if present
        const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        try {
          leads = JSON.parse(jsonStr);
          console.log(`\n✅ Found ${leads.length} leads\n`);
        } catch {
          // Try to extract JSON array from text
          const match = raw.match(/\[[\s\S]*\]/);
          if (match) {
            try { leads = JSON.parse(match[0]); } catch { /* fall through */ }
          }
          if (!leads.length) {
            console.error("⚠️  Could not parse JSON from response. Raw output saved to agent/raw-output.txt");
            fs.writeFileSync(path.join(__dirname, "raw-output.txt"), raw);
          }
        }
      }
      break;
    }

    // Handle tool calls
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        // web_search tool results are handled automatically by the API
        // We just need to pass back a placeholder so the loop continues
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Search completed. Continue researching and compiling leads.",
        });
      }
      messages.push({ role: "user", content: toolResults });
    }
  }

  if (!leads.length) {
    console.log("No leads extracted. Check agent/raw-output.txt if it exists.");
    process.exit(1);
  }

  // ── Import to CRM ─────────────────────────────────────────────────────────
  let imported = 0;
  for (const lead of leads) {
    try {
      upsertLead({ ...lead, niche: NICHE });
      imported++;
    } catch (e) {
      console.warn(`  ⚠️  CRM import failed for ${lead.business_name}: ${e.message}`);
    }
  }
  console.log(`📥 Imported ${imported}/${leads.length} leads into pipeline CRM\n`);

  // ── Output CSV ────────────────────────────────────────────────────────────
  const slug = `${NICHE}-${LOCATION}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `leads-${slug}-${date}.csv`;
  const outPath = path.join(__dirname, filename);

  fs.writeFileSync(outPath, toCSV(leads));
  console.log(`📄 Saved: agent/${filename}`);
  console.log(`   ${leads.length} leads · ${fs.statSync(outPath).size} bytes\n`);

  // Quick preview
  console.log("── Preview (first 3) ─────────────────────────────────────────");
  for (const lead of leads.slice(0, 3)) {
    console.log(`\n  ${lead.business_name} — ${lead.city}, ${lead.state}`);
    if (lead.owner_name)  console.log(`  Owner:  ${lead.owner_name}`);
    if (lead.website)     console.log(`  Web:    ${lead.website}`);
    if (lead.phone)       console.log(`  Phone:  ${lead.phone}`);
    if (lead.email)       console.log(`  Email:  ${lead.email}`);
    if (lead.pain_signal) console.log(`  Signal: ${lead.pain_signal}`);
    console.log(`  Score:  ${lead.lead_score}/10`);
  }
  console.log("\n──────────────────────────────────────────────────────────────\n");
}

runAgent().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
