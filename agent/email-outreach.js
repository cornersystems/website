/**
 * Corner Systems — Email Outreach
 * Sends personalised cold email sequences via Resend.
 * Each email is written by Claude based on the lead's pain signal.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { logTouch, updateStage } from "./db.js";

const resend  = new Resend(process.env.RESEND_API_KEY);
const claude  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FROM    = "Thomas at Corner Systems <cornersystemsai@gmail.com>";
const REPLY_TO = "cornersystemsai@gmail.com";

// ── Email templates (Claude personalises the body) ────────────────────────────

const SEQUENCES = {
  cold_d0: {
    subjectTemplate: (lead) => `Quick question for ${lead.business_name}`,
    stage: "emailed_d0",
    prompt: (lead) => `Write a cold outreach email from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}, a ${lead.niche} in ${lead.city}, ${lead.state}.

Pain signal we found: "${lead.pain_signal}"

Corner Systems sells AI front-office systems for gyms and service businesses — AI receptionists, lead capture, follow-up automation, CRM. Pricing: $149-$499/month + setup.

Rules:
- 4-6 sentences MAX. No fluff.
- Lead with the specific pain signal you found — make them feel like we did our homework.
- One clear CTA: book a 20-minute discovery call (link: https://cornersystems.vercel.app/#contact)
- Tone: direct, confident, peer-to-peer. Not salesy.
- No subject line in the response — just the email body.
- Sign off as Thomas.

Output ONLY the email body. Nothing else.`,
  },

  follow_d3: {
    subjectTemplate: (lead) => `Re: Quick question for ${lead.business_name}`,
    stage: "emailed_d3",
    prompt: (lead) => `Write a short follow-up email (day 3) from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}.

Context: We emailed them 3 days ago about their front-office coverage gaps (${lead.pain_signal}). No reply yet.

Rules:
- 2-3 sentences MAX.
- Reference that you sent something a few days ago.
- Add one new hook: "We just helped a [similar gym type] in [similar region] cut their response time from 4 hours to under 2 minutes."
- Same CTA: 20-minute call at https://cornersystems.vercel.app/#contact
- Sign off as Thomas.

Output ONLY the email body. Nothing else.`,
  },

  follow_d7: {
    subjectTemplate: (lead) => `Last one — ${lead.business_name}`,
    stage: "emailed_d7",
    prompt: (lead) => `Write a final "breakup" follow-up email (day 7) from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}.

Context: We've emailed twice. Still no reply.

Rules:
- 2-3 sentences.
- Friendly, zero pressure. Let them know this is the last email.
- Leave the door open with a soft CTA ("If timing ever changes, the link is below.").
- Link: https://cornersystems.vercel.app/#contact
- Sign off as Thomas.

Output ONLY the email body. Nothing else.`,
  },

  onboard_w1: {
    subjectTemplate: (lead) => `You're all set — here's what's next, ${lead.business_name}`,
    stage: null,
    prompt: (lead) => `Write a warm onboarding email (first week) from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}, a new client.

Rules:
- Welcome them properly.
- Tell them the 3 things happening in week 1: setup call scheduled, intake flow being mapped, first test run.
- Invite them to reply with any questions.
- Keep it under 6 sentences.
- Sign off as Thomas.

Output ONLY the email body. Nothing else.`,
  },

  checkin_d30: {
    subjectTemplate: (lead) => `Quick check-in — how's everything going at ${lead.business_name}?`,
    stage: null,
    prompt: (lead) => `Write a 30-day client check-in email from Thomas at Corner Systems to ${lead.owner_name || "the owner"} of ${lead.business_name}.

Rules:
- Warm, genuine tone.
- Ask 2 specific questions: (1) What's working well? (2) Anything feeling off or that we could do better?
- Mention that their input directly shapes what we build next.
- Keep it short — 4 sentences max.
- Sign off as Thomas.

Output ONLY the email body. Nothing else.`,
  },
};

// ── Core send function ────────────────────────────────────────────────────────

async function personalise(prompt) {
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content[0].text.trim();
}

export async function sendSequenceEmail(lead, sequenceKey) {
  const seq = SEQUENCES[sequenceKey];
  if (!seq) throw new Error(`Unknown sequence: ${sequenceKey}`);
  if (!lead.email) {
    console.log(`  ⚠️  No email for ${lead.business_name} — skipping`);
    return false;
  }

  const subject = seq.subjectTemplate(lead);
  const body    = await personalise(seq.prompt(lead));

  const html = `<div style="font-family:sans-serif;max-width:560px">
  <img src="https://cornersystems.vercel.app/assets/cs-email-header.png" alt="Corner Systems" width="560" style="width:100%;border-radius:8px 8px 0 0;display:block;margin-bottom:24px" />
  <div style="font-size:15px;line-height:1.7;color:#1a1a1a">
${body.replace(/\n/g, "<br>")}
  </div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
    Corner Systems · cornersystemsai@gmail.com · <a href="https://cornersystems.vercel.app" style="color:#999">cornersystems.vercel.app</a>
  </div>
</div>`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: lead.email,
      subject,
      html,
    });

    logTouch(lead.id, "email", sequenceKey, "sent", { subject, body });
    if (seq.stage) updateStage(lead.id, seq.stage);

    console.log(`  ✉️  Sent [${sequenceKey}] → ${lead.email} (${lead.business_name})`);
    return true;
  } catch (err) {
    console.error(`  ❌  Email failed for ${lead.business_name}: ${err.message}`);
    logTouch(lead.id, "email", sequenceKey, "failed", { subject, notes: err.message });
    return false;
  }
}

export { SEQUENCES };
