#!/usr/bin/env node
/**
 * Seed the CRM with real Toronto Tier 2 + Tier 3 leads.
 * Tier 2: chiro, physio, sports medicine, recovery clinics (bigger budgets)
 * Tier 3: med spas, cosmetic dentists (biggest budgets, longer cycle)
 * Run once: node agent/seed-toronto-tier23.js
 */
import "dotenv/config";
import { upsertLead } from "./db.js";

const leads = [
  // ── Tier 2: Chiropractic ────────────────────────────────────────────────────
  { business_name: "Bloor-Avenue Chiropractic", city: "Toronto", state: "ON", phone: "(416) 920-2468", website: "https://downtowntorontochiropractor.com", niche: "Chiropractic clinic", lead_score: 7, pain_signal: "Multi-service clinic (chiro/massage/acupuncture) near two subway stations — high inbound volume across services, front desk can't catch every booking call.", notes: "Downtown, near Bay & Wellesley stations" },
  { business_name: "Beyond Chiropractic", city: "Toronto", state: "ON", phone: "(416) 703-6222", website: "https://beyondchiropractic.ca", niche: "Chiropractic clinic", lead_score: 8, pain_signal: "Financial-district clinic — patients are busy professionals who inquire after hours; no 24/7 booking means lost high-value patients.", notes: "Downtown financial district" },
  { business_name: "Transform Chiropractic", city: "Toronto", state: "ON", phone: "(416) 604-4184", website: "https://transformchiropractic.com", niche: "Chiropractic clinic", lead_score: 7, pain_signal: "Single-location clinic — reliant on front desk for intake, no missed-call recovery for new-patient inquiries.", notes: "" },
  { business_name: "Dr. Michael Berenstein Chiropractic", city: "Toronto", state: "ON", phone: "(416) 639-6234", website: "https://chiropractortoronto.com", niche: "Chiropractic clinic", lead_score: 7, pain_signal: "Solo-practitioner Bloor St clinic — owner is the practitioner, can't answer new-patient calls while treating.", notes: "151 Bloor St W Suite 840, M5S 1S4" },
  { business_name: "Toronto Chiropractic Centre", city: "Toronto", state: "ON", phone: "(416) 444-4679", website: "https://torontochiropracticcentre.com", niche: "Chiropractic clinic", lead_score: 7, pain_signal: "North York clinic on Lawrence — suburban location dependent on phone bookings, no online intake funnel visible.", notes: "1200 Lawrence Ave E Suite 201, M3A 1C1" },

  // ── Tier 2: Physiotherapy ─────────────────────────────────────────────────────
  { business_name: "Ace Physio", city: "Toronto", state: "ON", phone: "(416) 900-6653", website: "https://acephysio.ca", niche: "Physiotherapy clinic", lead_score: 7, pain_signal: "Downtown Carlton St clinic — injury patients want fast appointments; slow callback response loses them to competitors.", notes: "2 Carlton St Suite 1522" },
  { business_name: "Cornerstone Physiotherapy", city: "Toronto", state: "ON", phone: "(416) 363-1975", website: "https://cornerstonephysio.com", niche: "Physiotherapy clinic", lead_score: 8, pain_signal: "Multi-location practice (Union, College) — multi-site lead routing is a classic failure point with no centralized intake system.", notes: "Financial district + College Station" },
  { business_name: "Downtown Trilogy Physiotherapy", city: "Toronto", state: "ON", phone: "(416) 504-8383", website: "", niche: "Physiotherapy clinic", lead_score: 8, pain_signal: "No website surfaced — Adelaide St clinic relies on phone/referral, strong candidate for full lead-capture build.", notes: "366 Adelaide St E Unit 101, M5A 3X9" },
  { business_name: "St. George Physiotherapy", city: "Toronto", state: "ON", phone: "(416) 921-4587", website: "https://stgeorgephysio.ca", niche: "Physiotherapy clinic", lead_score: 7, pain_signal: "Bloor St clinic offering physio + massage — cross-service bookings need coordination the front desk struggles with.", notes: "180 Bloor St W Suite 1202, M5S 2V6" },
  { business_name: "Toronto Physiotherapy", city: "Toronto", state: "ON", phone: "(416) 792-5115", website: "https://torontophysiotherapy.ca", niche: "Physiotherapy clinic", lead_score: 7, pain_signal: "Two locations (Danforth + Yonge/St Clair) — split phone lines mean missed cross-location bookings.", notes: "442 Danforth Ave + 1246 Yonge St" },
  { business_name: "East Toronto Orthopaedic & Sports Injury Clinic", city: "Toronto", state: "ON", phone: "(416) 691-3943", website: "", niche: "Physiotherapy clinic", lead_score: 7, pain_signal: "Danforth sports-injury clinic, no website found — urgent-injury patients need instant response that phone-only can't give.", notes: "1577 Danforth Ave Unit 4, M4C 1H7" },

  // ── Tier 2: Sports Medicine / Recovery ────────────────────────────────────────
  { business_name: "Sports Medicine Rehabilitation", city: "Toronto", state: "ON", phone: "(416) 539-0302", website: "https://sportsmedicinerehabilitation.com", niche: "Sports medicine clinic", lead_score: 7, pain_signal: "Bloor St West rehab clinic — athlete clientele expects responsive, premium service; lagging intake undercuts the brand.", notes: "1539 Bloor St W" },
  { business_name: "SportsRehabTO", city: "Toronto", state: "ON", phone: "(416) 385-0110", website: "https://sportsrehabto.com", niche: "Sports medicine clinic", lead_score: 8, pain_signal: "Two locations (North York + Bloor/Ossington) sharing one number — high risk of missed bookings and no source tracking.", notes: "300 York Mills Rd + 878 Bloor St W" },
  { business_name: "Ace Sports Clinic", city: "Toronto", state: "ON", phone: "(833) 266-5223", website: "https://acesportsclinic.com", niche: "Sports medicine clinic", lead_score: 7, pain_signal: "Uses a toll-free line — likely call-volume heavy, prime fit for AI reception to handle overflow and after-hours.", notes: "Physio & osteo clinic" },
  { business_name: "Rebalance Sports Medicine", city: "Toronto", state: "ON", phone: "(416) 945-0865", website: "https://rebalancetoronto.com", niche: "Sports medicine clinic", lead_score: 8, pain_signal: "Two downtown locations (Yonge + University/King) — multi-site, multi-practitioner booking complexity with no unified system.", notes: "110 Yonge St + 155 University Ave" },
  { business_name: "Eardley Sports & Regenerative Medicine", city: "Toronto", state: "ON", phone: "(416) 901-8799", website: "https://eardleysportsmedicine.com", niche: "Sports medicine clinic", lead_score: 8, pain_signal: "Premium PRP/regenerative clinic — very high treatment value per patient, every missed inquiry is major lost revenue.", notes: "Toronto, M4S 1Y2" },

  // ── Tier 3: Med Spas ──────────────────────────────────────────────────────────
  { business_name: "Rejuvenation Med Spa", city: "Toronto", state: "ON", phone: "", website: "https://rejuvenationmedspa.ca", niche: "Med spa", lead_score: 8, pain_signal: "Portland St med spa, no public phone — injectables/laser clients book high-ticket treatments; web-only intake leaks leads.", notes: "67 Portland St" },
  { business_name: "VBeauty Medical Spa", city: "Toronto", state: "ON", phone: "(416) 839-1771", website: "https://vbeautyspa.com", niche: "Med spa", lead_score: 9, pain_signal: "Yorkville luxury med spa — affluent clientele, Botox/filler treatments worth $$$; a missed booking call is a massive loss.", notes: "Yorkville" },
  { business_name: "Elements Wellness Medispa", city: "Toronto", state: "ON", phone: "(416) 929-6181", website: "https://bestspatoronto.com", niche: "Med spa", lead_score: 8, pain_signal: "Yorkville medispa — premium aesthetics market, needs polished 24/7 intake to match brand and capture every consult.", notes: "Yorkville" },
  { business_name: "3D Lifestyle Toronto Downtown", city: "Toronto", state: "ON", phone: "(647) 868-5627", website: "https://3dlifestyle.ca", niche: "Med spa", lead_score: 8, pain_signal: "Franchise medispa on Clarence Square — high ad spend drives inquiries; without instant capture, paid leads are wasted.", notes: "5 Clarence Square" },
  { business_name: "The Scene Medical Beauty Bar", city: "Toronto", state: "ON", phone: "(416) 770-5784", website: "https://scenebeauty.ca", niche: "Med spa", lead_score: 8, pain_signal: "Botox/microneedling/IV bar — walk-in + booking hybrid model that needs strong intake to convert browsers to bookings.", notes: "Toronto" },

  // ── Tier 3: Cosmetic Dentists ─────────────────────────────────────────────────
  { business_name: "DLK Dental", city: "Toronto", state: "ON", phone: "(647) 350-7550", website: "https://dlkdental.com", niche: "Cosmetic dentist", lead_score: 8, pain_signal: "Yonge St cosmetic practice (implants/veneers) — high-value cases worth thousands; missed new-patient calls = lost cases.", notes: "4984 Yonge St" },
  { business_name: "Downtown Dental Clinic", city: "Toronto", state: "ON", phone: "(416) 513-9494", website: "https://downtowndentalclinic.com", niche: "Cosmetic dentist", lead_score: 7, pain_signal: "Busy Yonge St family + cosmetic practice — front desk overwhelmed at peak, after-hours inquiries go to voicemail.", notes: "819 Yonge St Ground Floor, M4W 2G9" },
  { business_name: "Chaplin Dental", city: "Toronto", state: "ON", phone: "(416) 485-4433", website: "https://torontodental.com", niche: "Cosmetic dentist", lead_score: 7, pain_signal: "Invisalign/veneer focus — high-consideration treatments that need fast follow-up to win against competitors.", notes: "" },
  { business_name: "Yorkville Dental Associates", city: "Toronto", state: "ON", phone: "(416) 924-4695", website: "https://yorkvilledental.net", niche: "Cosmetic dentist", lead_score: 8, pain_signal: "Bay St / Yorkville cosmetic practice — affluent area, premium cases, brand demands a flawless intake experience.", notes: "1235 Bay St Suite 600" },
  { business_name: "City Dental On Bay", city: "Toronto", state: "ON", phone: "(647) 957-2500", website: "https://citydentaltoronto.com", niche: "Cosmetic dentist", lead_score: 7, pain_signal: "Midtown Bay St practice — cosmetic transformations are high-ticket; slow lead response loses patients to nearby clinics.", notes: "1006 Bay St" },
];

let imported = 0;
for (const lead of leads) {
  try {
    upsertLead({ ...lead, owner_name: lead.owner_name || "", email: lead.email || "", instagram_handle: "", google_maps_url: "", notes: lead.notes || "" });
    imported++;
  } catch (e) {
    console.error(`Failed: ${lead.business_name} — ${e.message}`);
  }
}

console.log(`\n✅ Seeded ${imported}/${leads.length} real Toronto Tier 2 + Tier 3 leads.`);
console.log(`   Tier 2: chiro, physio, sports medicine`);
console.log(`   Tier 3: med spas, cosmetic dentists\n`);
