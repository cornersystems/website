#!/usr/bin/env node
/**
 * Corner Systems — Daily Lead Research Agent
 *
 * Runs automatically each day. Finds new leads in the current geographic
 * phase, deep-dives to find real contact emails, detects whether the
 * business already has a website / AI chatbot / voice agent, and
 * generates a personalized cold outreach email draft stored in the CRM.
 *
 * Powered by Claude Code CLI (claude -p) — uses your existing Claude
 * subscription. No separate Anthropic API key needed.
 *
 * Usage:  node agent/research-daily.js
 * Called: automatically by agent/daily-run.js
 */

import "dotenv/config";
import { spawnSync } from "child_process";
import { upsertLead, updateResearchData, getUnresearchedLeads } from "./db.js";

// ── Geographic expansion schedule ─────────────────────────────────────────────
const START_DATE = new Date("2026-06-06T00:00:00-05:00");

const GEO_PHASES = [
  {
    phase: 1, startDay: 0, label: "Toronto Core",
    areas: ["Toronto ON", "North York ON", "Scarborough ON", "Etobicoke ON", "Downtown Toronto ON"],
  },
  {
    phase: 2, startDay: 30, label: "Greater Toronto Area",
    areas: ["Mississauga ON", "Brampton ON", "Markham ON", "Vaughan ON", "Oakville ON",
            "Richmond Hill ON", "Pickering ON", "Ajax ON", "Whitby ON"],
  },
  {
    phase: 3, startDay: 60, label: "Golden Horseshoe",
    areas: ["Hamilton ON", "Burlington ON", "Waterloo ON", "Kitchener ON",
            "Cambridge ON", "Barrie ON", "Oshawa ON", "Guelph ON"],
  },
  {
    phase: 4, startDay: 90, label: "Southern Ontario",
    areas: ["London ON", "Windsor ON", "Kingston ON", "Ottawa ON",
            "St Catharines ON", "Niagara Falls ON", "Brantford ON", "Peterborough ON"],
  },
  {
    phase: 5, startDay: 150, label: "Ontario Wide",
    areas: ["Thunder Bay ON", "Sudbury ON", "Sault Ste Marie ON",
            "North Bay ON", "Timmins ON", "Cornwall ON"],
  },
  {
    phase: 6, startDay: 210, label: "Western Canada",
    areas: ["Vancouver BC", "Surrey BC", "Burnaby BC", "Calgary AB",
            "Edmonton AB", "Winnipeg MB", "Saskatoon SK", "Regina SK"],
  },
];

// Niches rotated by day of week so we never spam one vertical
const NICHE_ROTATION = {
  0: ["MMA gym", "boxing gym", "Muay Thai gym"],
  1: ["chiropractic clinic", "physiotherapy clinic", "rehab clinic"],
  2: ["med spa", "cosmetic clinic", "laser clinic"],
  3: ["BJJ academy", "martial arts school", "personal training studio"],
  4: ["sports medicine clinic", "massage therapy clinic", "osteopathy"],
  5: ["dental practice", "cosmetic dentistry", "skin clinic"],
  6: ["boutique fitness studio", "CrossFit gym", "wellness studio"],
};

// ── Phase selection ───────────────────────────────────────────────────────────
function getCurrentPhase() {
  const daysElapsed = Math.floor((Date.now() - START_DATE.getTime()) / 86_400_000);
  let phase = GEO_PHASES[0];
  for (const p of GEO_PHASES) {
    if (daysElapsed >= p.startDay) phase = p;
    else break;
  }
  return { phase, daysElapsed };
}

function getDailyTargets() {
  const { phase, daysElapsed } = getCurrentPhase();
  const dayOfWeek = new Date().getDay();
  const niches = NICHE_ROTATION[dayOfWeek];
  const areaIndex = daysElapsed % phase.areas.length;
  const area = phase.areas[areaIndex];
  return { area, niches, phaseLabel: phase.label, daysElapsed };
}

// ── Claude CLI helper ─────────────────────────────────────────────────────────
// Uses `claude -p` — your Claude Code subscription, zero API cost.
function askClaude(prompt, useSearch = false) {
  const args = ["-p", prompt, "--output-format", "text"];

  if (useSearch) {
    // Allow web search tools when discovering leads
    args.push("--allowedTools", "WebSearch,WebFetch");
  }

  const result = spawnSync("claude", args, {
    encoding: "utf8",
    timeout: 120_000,          // 2 min per call
    maxBuffer: 10 * 1024 * 1024,
    shell: true,               // needed on Windows to resolve PATH
    windowsHide: true,
  });

  if (result.error) {
    const msg = result.error.message || "";
    if (msg.includes("ENOENT") || msg.includes("not found")) {
      throw new Error(
        "Claude CLI not found. Open a terminal and run: claude login\n" +
        "This is a one-time setup that uses your existing Claude subscription."
      );
    }
    throw new Error(`Claude CLI spawn error: ${msg}`);
  }

  const stderr = (result.stderr || "").trim();
  if (result.status !== 0) {
    if (stderr.toLowerCase().includes("not logged in") || stderr.toLowerCase().includes("please run /login")) {
      throw new Error(
        "Claude CLI is not logged in.\n" +
        "Open a terminal and run:  claude login\n" +
        "It will open your browser — click Authorize. One-time setup."
      );
    }
    throw new Error(`Claude CLI failed (exit ${result.status}): ${stderr.slice(0, 300)}`);
  }

  return result.stdout.trim();
}

function parseJson(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// ── Step 1: Discover new businesses ──────────────────────────────────────────
async function discoverLeads(area, niches) {
  console.log(`\n🔍 Discovering leads in ${area} — niches: ${niches.join(", ")}`);

  const nicheList = niches.join(", ");
  const prompt = `You are a B2B lead researcher for Corner Systems, which sells AI front-office systems to service businesses.
Return ONLY valid JSON — no commentary before or after.

Search the web for ${nicheList} businesses in ${area}.
Find 20 real businesses. For each, collect:
- business_name (string)
- owner_name (string or null)
- phone (string or null)
- website (URL or null)
- instagram_handle (string or null — without the @)
- google_maps_url (string or null)
- niche (pick the closest from: ${nicheList})
- city (string)
- state (province abbreviation e.g. ON, BC)
- lead_score (integer 1-10: higher if small/medium independent business with no obvious AI tools)
- pain_signal (1 sentence — what's the likely front-office gap for this type of business?)
- notes (any useful detail)

Return JSON: { "leads": [ ...20 objects... ] }
Only include real, verifiable businesses. Do NOT make any up.`;

  const raw = askClaude(prompt, true);
  const parsed = parseJson(raw);

  if (!parsed?.leads?.length) {
    console.log("   ⚠️  No leads parsed from discovery response");
    return [];
  }
  console.log(`   Found ${parsed.leads.length} businesses`);
  return parsed.leads;
}

// ── Step 2: Deep-dive — find real email + detect AI presence ─────────────────
async function deepResearch(business) {
  const prompt = `You are a contact information researcher. Find real email addresses and check for AI tools.
Return ONLY valid JSON.

Research this business:
Name: ${business.business_name}
City: ${business.city}, ${business.state || "ON"}
Website: ${business.website || "unknown"}
Phone: ${business.phone || "unknown"}

Tasks:
1. FIND THEIR EMAIL. Try:
   - Search "${business.business_name} ${business.city} email contact"
   - If they have a website, check /contact, /about, footer
   - Search "${business.business_name} ${business.city} instagram" — check bio
   - Try info@[domain], hello@[domain] if you found their domain

2. Confirm they have a working website (true/false)

3. Check if website/Google listing mentions:
   - A chatbot / live chat widget → has_chatbot
   - An AI voice agent / "never miss a call" service → has_voice_agent

Return ONLY:
{
  "email": "found@email.com or null",
  "website_url": "https://... or null",
  "has_website": true or false,
  "has_chatbot": true or false,
  "has_voice_agent": true or false,
  "research_notes": "brief note on what you found"
}`;

  const raw = askClaude(prompt, true);
  return parseJson(raw) || {
    email: null, website_url: null,
    has_website: !!business.website,
    has_chatbot: false, has_voice_agent: false,
    research_notes: "No parseable result",
  };
}

// ── Step 3: Generate personalized email draft ─────────────────────────────────
async function draftEmail(lead) {
  const prompt = `Write a short cold outreach email from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}, a ${lead.niche} in ${lead.city}.

Pain signal: "${lead.pain_signal}"
Has website: ${lead.has_website ? "yes" : "no"}
Has chatbot already: ${lead.has_chatbot ? "yes" : "no"}
Has voice agent already: ${lead.has_voice_agent ? "yes" : "no"}

Rules:
- 4-6 sentences MAX. No fluff. Peer-to-peer tone.
- Lead with a specific observation about their front-office gap.
- If they already have a chatbot/voice agent, angle is "upgrade/improve" not "you're missing this".
- One clear CTA: book a 20-min discovery call — https://cornersystems.vercel.app/#contact
- Sign off as Thomas.
- Body only. No subject line.`;

  return askClaude(prompt, false);
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function researchNewLeads() {
  const { area, niches, phaseLabel, daysElapsed } = getDailyTargets();

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  Lead Research — Day ${String(daysElapsed).padEnd(27)}║`);
  console.log(`║  Phase: ${phaseLabel.padEnd(41)}║`);
  console.log(`║  Area:  ${area.padEnd(41)}║`);
  console.log(`╚══════════════════════════════════════════════════╝`);

  // Discover new businesses
  const discovered = await discoverLeads(area, niches);
  if (!discovered.length) return 0;

  // Upsert into CRM — skip duplicates automatically
  let added = 0;
  for (const biz of discovered) {
    try {
      upsertLead({
        ...biz,
        instagram_handle: biz.instagram_handle,
        google_maps_url: biz.google_maps_url,
        state: biz.state || "ON",
      });
      added++;
    } catch (e) {
      // duplicate or bad data — skip silently
    }
  }
  console.log(`\n   📥 ${added} new leads added to CRM`);

  // Deep research leads that still need email/AI check
  const needsResearch = getUnresearchedLeads(15);
  console.log(`\n🔬 Deep-researching ${needsResearch.length} leads for emails & AI presence...`);

  let emailsFound = 0;
  for (const lead of needsResearch) {
    try {
      process.stdout.write(`   ${lead.business_name}... `);
      const research = await deepResearch(lead);
      const draft = await draftEmail({ ...lead, ...research });

      updateResearchData(lead.id, { ...research, email_draft: draft });

      if (research.email) emailsFound++;
      console.log(research.email ? `✅ ${research.email}` : "⚠️  no email found");

      // Small pause between calls
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.log(`❌ ${e.message.split("\n")[0]}`);
    }
  }

  console.log(`\n   📧 ${emailsFound}/${needsResearch.length} emails found`);
  return added;
}

// Run directly
const isDirect = process.argv[1]?.endsWith("research-daily.js");
if (isDirect) {
  researchNewLeads().catch((err) => {
    console.error("\nResearch error:", err.message);
    process.exit(1);
  });
}
