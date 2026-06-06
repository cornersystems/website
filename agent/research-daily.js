#!/usr/bin/env node
/**
 * Corner Systems — Daily Lead Research Agent
 *
 * Runs automatically each day. Finds new leads in the current geographic
 * phase, deep-dives to find real contact emails, detects whether the
 * business already has a website / AI chatbot / voice agent, generates
 * a personalized cold outreach email + subject line, and rescores each
 * lead after research is complete.
 *
 * Powered by Claude Code CLI (claude -p) — uses your existing Claude
 * subscription. No separate Anthropic API key needed.
 *
 * Usage:  node agent/research-daily.js
 * Called: automatically by agent/daily-run.js
 */

import "dotenv/config";
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import { upsertLead, updateResearchData, updateLeadScore, getUnresearchedLeads } from "./db.js";

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

// ── Niche priority scoring ────────────────────────────────────────────────────
// Higher-value niches (more MRR potential) get a score boost after research.
const NICHE_PRIORITY_BOOST = [
  { keywords: ["med spa", "medspa", "cosmetic clinic", "laser clinic", "cosmetic dentistry", "aesthetic clinic"], boost: 3 },
  { keywords: ["dental practice", "dentist", "skin clinic"],                                                       boost: 2 },
  { keywords: ["chiropractic", "physiotherapy", "sports medicine", "osteopathy", "rehab clinic"],                  boost: 1 },
];

function nichePriorityBoost(niche) {
  if (!niche) return 0;
  const lower = niche.toLowerCase();
  for (const { keywords, boost } of NICHE_PRIORITY_BOOST) {
    if (keywords.some((k) => lower.includes(k))) return boost;
  }
  return 0;
}

/**
 * Recalculate lead score after deep research completes.
 * Takes the original discovery score and adjusts based on real findings.
 */
function rescoreAfterResearch(originalScore, niche, research) {
  let score = originalScore || 5;

  // Email found = real outreach opportunity
  if (research.email) score += 2;
  else score -= 1;

  // Already has AI tools = harder sell, lower priority
  if (research.has_chatbot) score -= 3;
  if (research.has_voice_agent) score -= 4;

  // No website = more opportunity (they're behind the curve)
  if (!research.has_website) score += 1;

  // Niche value boost
  score += nichePriorityBoost(niche);

  return Math.max(1, Math.min(10, Math.round(score)));
}

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
const CLAUDE_CMD = "C:\\Users\\thoma\\AppData\\Roaming\\npm\\claude.cmd";
const TMP_DIR    = "C:\\Temp";
const TMP_PROMPT = `${TMP_DIR}\\cs-prompt.txt`;

function askClaude(prompt) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(TMP_PROMPT, prompt, "utf8");

  const result = spawnSync(
    "cmd.exe",
    ["/c", `${CLAUDE_CMD} --output-format text --dangerously-skip-permissions < ${TMP_PROMPT}`],
    {
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: os.homedir(),
      windowsHide: true,
    }
  );

  try { fs.unlinkSync(TMP_PROMPT); } catch {}

  if (result.error) throw new Error(`Claude CLI error: ${result.error.message}`);

  const stderr = (result.stderr || "").trim();
  if (result.status !== 0) {
    if (stderr.toLowerCase().includes("not logged in") || stderr.toLowerCase().includes("/login")) {
      throw new Error("Claude CLI not logged in. Run: claude  (in a terminal window)");
    }
    throw new Error(`Claude CLI failed (exit ${result.status}): ${stderr.slice(0, 300)}`);
  }

  return result.stdout.trim();
}

function parseJson(text) {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  try {
    const match = stripped.match(/\{[\s\S]*\}/);
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

  const raw = askClaude(prompt);
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

  const raw = askClaude(prompt);
  return parseJson(raw) || {
    email: null, website_url: null,
    has_website: !!business.website,
    has_chatbot: false, has_voice_agent: false,
    research_notes: "No parseable result",
  };
}

// ── Step 3: Generate subject line + personalized email draft ──────────────────
async function draftEmail(lead) {
  const ownerFirst = lead.owner_name ? lead.owner_name.split(" ")[0] : null;
  const greeting   = ownerFirst ? `Hi ${ownerFirst},` : "Hi there,";
  const hasChatbot = lead.has_chatbot ? "yes" : "no";
  const hasVoice   = lead.has_voice_agent ? "yes" : "no";
  const angle      = (lead.has_chatbot || lead.has_voice_agent)
    ? "they already have some AI tools — angle on upgrading or filling the gaps they still have"
    : "they have no AI front-office tools — angle on what they're currently losing";

  const prompt = `Write a cold outreach email from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}, a ${lead.niche} in ${lead.city}.

Context:
- Pain signal: "${lead.pain_signal}"
- Has website: ${lead.has_website ? "yes" : "no"}
- Has chatbot already: ${hasChatbot}
- Has voice agent already: ${hasVoice}
- Angle: ${angle}

Corner Systems builds AI front-office systems: AI chat, missed-call recovery, DM automation, lead capture, CRM handoff. Pricing starts at $149/month.

Rules for the EMAIL BODY:
- Start with: ${greeting}
- 4-6 sentences MAX. No fluff. Peer-to-peer tone. No buzzwords.
- Lead with a specific observation about their front-office gap based on the pain signal.
- One clear CTA: book a 20-minute discovery call at https://cornersystems.vercel.app/contact
- Sign off: "Thomas\nCorner Systems AI"
- Body only. No subject line in the body.

Rules for the SUBJECT LINE:
- 6-9 words, lowercase, sounds like a human sent it, not a marketing email
- Reference their specific business type or gap, not generic
- Good examples: "quick question about your front desk", "missing leads after 9pm?", "your instagram DMs after hours"
- Bad examples: "Revolutionize Your Business With AI", "Partnership Opportunity"

Return ONLY valid JSON with no extra text:
{
  "subject": "...",
  "body": "..."
}`;

  const raw    = askClaude(prompt);
  const parsed = parseJson(raw);

  return {
    subject: parsed?.subject || `quick question — ${lead.business_name}`,
    body:    parsed?.body    || raw,
  };
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
  console.log(`\n🔬 Deep-researching ${needsResearch.length} leads for emails, AI presence & drafts...`);

  let emailsFound = 0;
  for (const lead of needsResearch) {
    try {
      process.stdout.write(`   ${lead.business_name}... `);

      // Step 2: deep research
      const research = await deepResearch(lead);

      // Step 3: draft email (subject + body)
      const { subject, body } = await draftEmail({ ...lead, ...research });

      // Rescore based on real findings
      const newScore = rescoreAfterResearch(lead.lead_score, lead.niche, research);

      // Persist everything
      updateResearchData(lead.id, {
        ...research,
        email_draft:   body,
        email_subject: subject,
      });
      updateLeadScore(lead.id, newScore);

      if (research.email) emailsFound++;

      const scoreStr = `score ${lead.lead_score || "?"} → ${newScore}`;
      console.log(research.email ? `✅ ${research.email} (${scoreStr})` : `⚠️  no email (${scoreStr})`);

      // Small pause between Claude calls
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
