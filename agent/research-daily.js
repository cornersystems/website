#!/usr/bin/env node
/**
 * Corner Systems — Daily Lead Research Agent
 *
 * Runs automatically each day. Finds new leads in the current geographic
 * phase, deep-dives to find real contact emails, detects whether the
 * business already has a website / AI chatbot / voice agent, and
 * generates a personalized cold outreach email draft stored in the CRM.
 *
 * Usage:  node agent/research-daily.js
 * Called: automatically by agent/daily-run.js
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { upsertLead, updateResearchData, getUnresearchedLeads } from "./db.js";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Geographic expansion schedule ─────────────────────────────────────────────
// Phase advances automatically based on days elapsed since launch.
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
  0: ["MMA gym", "boxing gym", "Muay Thai gym"],                          // Sun
  1: ["chiropractic clinic", "physiotherapy clinic", "rehab clinic"],     // Mon
  2: ["med spa", "cosmetic clinic", "laser clinic"],                      // Tue
  3: ["BJJ academy", "martial arts school", "personal training studio"],  // Wed
  4: ["sports medicine clinic", "massage therapy clinic", "osteopathy"],  // Thu
  5: ["dental practice", "cosmetic dentistry", "skin clinic"],            // Fri
  6: ["boutique fitness studio", "CrossFit gym", "wellness studio"],      // Sat
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

// ── Claude helper ─────────────────────────────────────────────────────────────
async function askClaude(systemPrompt, userPrompt, useSearch = true) {
  const tools = useSearch
    ? [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }]
    : [];

  const resp = await claude.messages.create({
    model: useSearch ? "claude-opus-4-5" : "claude-haiku-4-5-20251001",
    max_tokens: useSearch ? 4000 : 600,
    ...(tools.length ? { tools } : {}),
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Return the final text block (after any tool use)
  const text = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return text.trim();
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
  const raw = await askClaude(
    `You are a B2B lead researcher for Corner Systems, which sells AI front-office systems to service businesses.
     Return ONLY valid JSON — no commentary before or after.`,
    `Search Google Maps and the web for ${nicheList} businesses in ${area}.
     Find 20 real businesses. For each, collect as much of the following as possible:
     - business_name (string)
     - owner_name (string or null)
     - phone (string or null — include country code if available)
     - website (URL or null)
     - instagram_handle (string or null — without the @)
     - google_maps_url (string or null)
     - niche (pick the closest from: ${nicheList})
     - city (string)
     - state (use province abbreviation e.g. ON, BC)
     - lead_score (integer 1-10: higher if small/medium independent business with no obvious AI tools)
     - pain_signal (1 sentence — what's the likely front-office gap for this type of business?)
     - notes (any useful detail you found)

     Return a JSON object: { "leads": [ ...20 objects... ] }
     Do NOT make up businesses. Only include real, verifiable results.`
  );

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
  const raw = await askClaude(
    `You are a contact information researcher. Your ONLY job is to find real email addresses and
     check whether a small business already has an AI chatbot or voice agent.
     Return ONLY valid JSON.`,
    `Research this business:
     Name: ${business.business_name}
     City: ${business.city}, ${business.state}
     Website: ${business.website || "unknown"}
     Phone: ${business.phone || "unknown"}

     Tasks:
     1. FIND THEIR EMAIL ADDRESS. Try ALL of these:
        a. Search "${business.business_name} ${business.city} email contact"
        b. If they have a website, look at /contact, /about, footer
        c. Search "${business.business_name} ${business.city} instagram" — check bio
        d. Search "${business.business_name} ${business.city} facebook" — check About tab
        e. Try info@[domain], hello@[domain], [firstname]@[domain] if you found a website domain

     2. Confirm whether they have a working WEBSITE (true/false).

     3. Check if their website or Google listing mentions:
        - A CHATBOT or live chat (Intercom, Tidio, Drift, LiveChat widget, "chat with us", etc.) → has_chatbot
        - An AI VOICE AGENT or answering service ("AI receptionist", "never miss a call", etc.) → has_voice_agent

     Return ONLY this JSON:
     {
       "email": "found@email.com or null",
       "website_url": "https://... or null",
       "has_website": true or false,
       "has_chatbot": true or false,
       "has_voice_agent": true or false,
       "research_notes": "brief note on what you found"
     }`
  );

  return parseJson(raw) || {
    email: null, website_url: null,
    has_website: !!business.website,
    has_chatbot: false, has_voice_agent: false,
    research_notes: "Deep research returned no parseable result",
  };
}

// ── Step 3: Generate personalized email draft ─────────────────────────────────
async function draftEmail(lead) {
  return await askClaude(
    `You write short, punchy cold outreach emails for Corner Systems. No fluff. Peer-to-peer tone.`,
    `Write a cold outreach email from Thomas at Corner Systems to ${lead.owner_name || "the owner"}
     of ${lead.business_name}, a ${lead.niche} in ${lead.city}.

     Pain signal: "${lead.pain_signal}"
     Has website: ${lead.has_website ? "yes" : "no"}
     Has chatbot already: ${lead.has_chatbot ? "yes" : "no"}
     Has voice agent already: ${lead.has_voice_agent ? "yes" : "no"}

     Rules:
     - 4-6 sentences MAX. No fluff.
     - Lead with a specific observation about their front-office gap.
     - If they already have a chatbot/voice agent, angle is "upgrade/improve" not "you're missing this".
     - One clear CTA: book a 20-min discovery call — https://cornersystems.vercel.app/#contact
     - Sign off as Thomas.
     - Do NOT include a subject line. Body only.`,
    false  // no web search needed for drafting
  );
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

  // Deep research the top leads that still need email/AI check
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

      // Small delay to be respectful of API rate limits
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n   📧 ${emailsFound}/${needsResearch.length} emails found`);
  return added;
}

// Run directly
const isDirect = process.argv[1]?.endsWith("research-daily.js");
if (isDirect) {
  researchNewLeads().catch((err) => {
    console.error("Research error:", err);
    process.exit(1);
  });
}
