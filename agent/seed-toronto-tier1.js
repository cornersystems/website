#!/usr/bin/env node
/**
 * Seed the CRM with real Toronto Tier 1 leads researched via web search.
 * Run once: node agent/seed-toronto-tier1.js
 *
 * These are real businesses with real public contact info.
 * Pain signals are inferred from category + typical digital gaps — verify on the call.
 */
import "dotenv/config";
import { upsertLead } from "./db.js";

const leads = [
  // ── MMA gyms ────────────────────────────────────────────────────────────────
  { business_name: "Satori Fight Club", city: "Toronto", state: "ON", phone: "(647) 824-7298", website: "https://satorifightclub.com", niche: "MMA gym", lead_score: 8, pain_signal: "Boutique downtown fight club on Yonge St — high foot traffic but no visible online booking or after-hours intake.", notes: "901 Yonge St, M4W 2H2" },
  { business_name: "Rev MMA + Fitness", city: "North York", state: "ON", phone: "(416) 847-1020", website: "https://revmma.com", niche: "MMA gym", lead_score: 7, pain_signal: "Large multi-discipline gym — likely high inbound call/DM volume during peak hours that goes unanswered when coaches are on the mat.", notes: "150 Lesmill Rd, M3B 2T5" },
  { business_name: "Primal MMA Academy", city: "Toronto", state: "ON", phone: "(647) 782-4555", website: "", niche: "MMA gym", lead_score: 8, pain_signal: "No website found in search — strong signal of weak digital lead capture and reliance on phone/walk-in only.", notes: "388 Carlaw Ave Unit 16, M4M 2T4" },
  { business_name: "Toronto Top Team", city: "Toronto", state: "ON", phone: "(416) 750-8326", website: "", niche: "MMA gym", lead_score: 8, pain_signal: "Well-known competition gym — owner-operated, likely misses trial inquiries during training hours.", notes: "Listed on Tapology" },
  { business_name: "Toronto Striking Academy", city: "Vaughan", state: "ON", phone: "(416) 875-2899", email: "torontostrikingacademy@gmail.com", website: "https://torontostrikingacademy.com", niche: "MMA gym", lead_score: 7, pain_signal: "Uses a gmail address for business contact — no professional intake or CRM, leads likely lost in inbox.", notes: "411 Bradwick Dr Unit 11" },
  { business_name: "Xtreme Couture Toronto", city: "Etobicoke", state: "ON", phone: "(416) 503-1600", website: "https://xtremecouture.ca", niche: "MMA gym", lead_score: 7, pain_signal: "Franchise-affiliated gym — high brand search volume but no visible 24/7 capture for after-hours web visitors.", notes: "700 Kipling Ave, M8Z 5G3" },

  // ── BJJ academies ─────────────────────────────────────────────────────────────
  { business_name: "Toronto BJJ", city: "Toronto", state: "ON", phone: "", website: "https://torontobjj.com", niche: "BJJ academy", lead_score: 7, pain_signal: "High-traffic Bloor St location near transit — strong walk-in interest but no phone listed publicly, likely web-form only with slow follow-up.", notes: "813 Bloor St W" },
  { business_name: "The Academy Toronto", city: "Toronto", state: "ON", phone: "(416) 697-1127", website: "https://theacademytoronto.ca", niche: "BJJ academy", lead_score: 7, pain_signal: "Midtown academy — likely owner answers phone between classes, missing midday and evening trial calls.", notes: "33 Davisville Ave, M4S 2Y9" },
  { business_name: "BJJ United", city: "Toronto", state: "ON", phone: "(437) 988-7575", website: "", niche: "BJJ academy", lead_score: 8, pain_signal: "No website surfaced — relies on Yelp/social presence, strong candidate for lead capture + booking system.", notes: "949 St Clair Ave W, M6C 1C7" },
  { business_name: "Greenwood Brazilian Jiu-Jitsu", city: "Toronto", state: "ON", phone: "", website: "https://brazilianjiujitsutoronto.com", niche: "BJJ academy", lead_score: 6, pain_signal: "Leaside boutique academy — no phone listed, web-form intake only with no automated follow-up.", notes: "Bayview & Moore area" },
  { business_name: "Wolf Academy", city: "Toronto", state: "ON", phone: "(416) 841-2667", email: "dannycabrera@live.com", website: "https://wolfacademy.ca", niche: "BJJ academy", lead_score: 9, pain_signal: "Uses a personal @live.com email for business — zero professional intake infrastructure, leads handled manually by owner.", notes: "St Clair Ave W, Corso Italia" },
  { business_name: "Yonge Street BJJ", city: "Toronto", state: "ON", phone: "", website: "https://yongestreetbjj.com", niche: "BJJ academy", lead_score: 7, pain_signal: "Downtown near Wellesley Station — premium location, high inquiry volume, no visible after-hours coverage.", notes: "Downtown Toronto" },

  // ── Muay Thai gyms ────────────────────────────────────────────────────────────
  { business_name: "Old School Muay Thai", city: "Toronto", state: "ON", phone: "(416) 436-0226", website: "https://oldschoolmuaythai.com", niche: "Muay Thai gym", lead_score: 7, pain_signal: "Tucked-away rear-unit location — relies entirely on phone/web for discovery, misses calls during training.", notes: "254 Niagara St Rear Unit, M6J 1B9" },
  { business_name: "VRTU Muay Thai", city: "Toronto", state: "ON", phone: "(416) 482-2222", website: "https://vrtu.ca", niche: "Muay Thai gym", lead_score: 7, pain_signal: "Premium Eglinton location — likely high trial-class demand, no 24/7 intake for working professionals inquiring after hours.", notes: "243 Eglinton Ave W, M4R 1B1" },
  { business_name: "Montrait Muay Thai", city: "Toronto", state: "ON", phone: "(647) 889-5831", website: "https://montraitmuaythai.com", niche: "Muay Thai gym", lead_score: 7, pain_signal: "West-end Dundas studio — owner-operated, manual booking, no missed-call recovery.", notes: "1271 Dundas St W Unit 100, M6J 1X8" },
  { business_name: "Toronto Kickboxing & Muay Thai Academy (TKMT)", city: "Toronto", state: "ON", phone: "(647) 391-4536", website: "https://tkmtacademy.com", niche: "Muay Thai gym", lead_score: 7, pain_signal: "Two locations (Yonge + Queen W) sharing one phone line — high chance of missed calls and split lead tracking.", notes: "1992 Yonge St + 610 Queen St W" },
  { business_name: "Diamond Muay Thai", city: "Toronto", state: "ON", phone: "(416) 546-0559", website: "https://diamondmuaythai.ca", niche: "Muay Thai gym", lead_score: 7, pain_signal: "Leslieville combat gym — strong neighborhood demand, no visible online booking funnel.", notes: "3 Carlaw Ave" },
  { business_name: "Black Tigers Gym", city: "Toronto", state: "ON", phone: "(416) 751-4400", website: "https://blacktigersgym.com", niche: "Muay Thai gym", lead_score: 7, pain_signal: "Industrial-area gym (Curity Ave) — destination location dependent on strong intake to convert distant inquirers.", notes: "19 Curity Ave Unit 16, M4B 1X4" },

  // ── Boxing gyms ───────────────────────────────────────────────────────────────
  { business_name: "Sully's Boxing Gym", city: "Toronto", state: "ON", phone: "(416) 805-8108", email: "info@sullysboxinggym.com", website: "", niche: "Boxing gym", lead_score: 8, pain_signal: "Legendary Toronto gym, lower-level location — old-school operation, likely no CRM or automated follow-up on inquiries.", notes: "1554 Dundas St W lower level, M6H 1Z6" },
  { business_name: "Paul Brown Boxfit", city: "Toronto", state: "ON", phone: "(416) 706-6893", email: "info@paulbrownboxfit.ca", website: "https://paulbrownboxfit.ca", niche: "Boxing gym", lead_score: 7, pain_signal: "Boutique Yonge St boxfit studio — fitness-class model needs consistent booking + reminders to reduce no-shows.", notes: "661 Yonge St" },
  { business_name: "Atlas Boxing Club", city: "Toronto", state: "ON", phone: "(416) 240-0269", website: "", niche: "Boxing gym", lead_score: 8, pain_signal: "No website found — Bridgeland Ave location relies on phone/walk-in, prime candidate for lead capture build.", notes: "100 Bridgeland Ave" },
  { business_name: "Hardknocks Boxing Club", city: "Toronto", state: "ON", phone: "", website: "https://hardknocksboxingclub.com", niche: "Boxing gym", lead_score: 6, pain_signal: "Downtown Bathurst location — no public phone, web-only intake with unknown response time.", notes: "156 Bathurst St" },
  { business_name: "Bloor Street Fitness & Boxing", city: "Toronto", state: "ON", phone: "", website: "https://bloorstreetfitness.com", niche: "Boxing gym", lead_score: 6, pain_signal: "24/7 gym since 1994 — established but likely dated systems, no modern automated lead handling.", notes: "Bloor St" },

  // ── Personal training studios ──────────────────────────────────────────────────
  { business_name: "Studio Fitness", city: "Toronto", state: "ON", phone: "(416) 428-4802", email: "morgan@studio-fitness.com", website: "https://studio-fitness.com", niche: "Personal training studio", lead_score: 8, pain_signal: "Private studio with high client LTV — every missed consult inquiry is hundreds in lost revenue, no after-hours capture.", notes: "477 Richmond St W Unit 104" },
  { business_name: "3 Seasons Personal Training", city: "Toronto", state: "ON", phone: "", website: "https://3seasonspersonaltraining.com", niche: "Personal training studio", lead_score: 7, pain_signal: "Midtown Yonge studio — consult-driven sales model that lives or dies on fast lead response.", notes: "2652 Yonge St 2nd Floor, M4P 2J5" },
  { business_name: "KLABB Studios", city: "Toronto", state: "ON", phone: "", website: "https://klabbstudios.com", niche: "Personal training studio", lead_score: 7, pain_signal: "Premium Yonge St studio — high-ticket training, needs polished intake to match brand and capture every consult.", notes: "893 Yonge St" },
  { business_name: "Nielsen Fitness", city: "Toronto", state: "ON", phone: "", website: "https://nielsenfitness.com", niche: "Personal training studio", lead_score: 7, pain_signal: "Exclusive private studio in Leaside — by-appointment model where a missed inquiry is a lost high-value client.", notes: "29-209 Wicksteed Ave" },
  { business_name: "Trainer Pro", city: "Toronto", state: "ON", phone: "(877) 477-8767", website: "https://trainerpro.ca", niche: "Personal training studio", lead_score: 7, pain_signal: "In-home/mobile PT serving all of GTA — dispatch model heavily dependent on instant lead response and follow-up.", notes: "Serves Toronto + GTA" },
  { business_name: "Melrose Training", city: "Toronto", state: "ON", phone: "", website: "https://melrosetraining.ca", niche: "Personal training studio", lead_score: 7, pain_signal: "Three Toronto locations — multi-site lead routing is a common failure point with no central intake system.", notes: "Yonge/Bloor, King West, Distillery" },
];

let imported = 0;
for (const lead of leads) {
  try {
    upsertLead({
      ...lead,
      owner_name: lead.owner_name || "",
      email: lead.email || "",
      instagram_handle: "",
      google_maps_url: "",
      notes: lead.notes || "",
    });
    imported++;
  } catch (e) {
    console.error(`Failed: ${lead.business_name} — ${e.message}`);
  }
}

console.log(`\n✅ Seeded ${imported}/${leads.length} real Toronto Tier 1 leads into the CRM.`);
console.log(`   Categories: MMA, BJJ, Muay Thai, Boxing, Personal Training`);
console.log(`   Next: node agent/export-csv.js  (to get a spreadsheet)\n`);
