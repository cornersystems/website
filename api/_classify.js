import Anthropic from "@anthropic-ai/sdk";

// Classifies an inbound email reply and drafts a short response.
// Model matches the outreach pipeline's drafting tier (fast + cheap for
// per-webhook volume); override with CLAUDE_CLASSIFY_MODEL.
const MODEL = process.env.CLAUDE_CLASSIFY_MODEL || "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["interested", "question", "not_now", "unsubscribe", "other"],
      description: "interested = wants a call/demo/pricing; question = asking something answerable; not_now = polite decline or bad timing; unsubscribe = stop contacting; other = auto-reply, bounce notice, spam, vendor pitch",
    },
    reasoning: { type: "string", description: "One sentence explaining the classification" },
    draft_reply: {
      type: "string",
      description: "Short plain-text reply draft for interested/question emails; empty string otherwise",
    },
  },
  required: ["category", "reasoning", "draft_reply"],
  additionalProperties: false,
};

const SYSTEM = `You triage inbound email replies for Corner Systems, which sells AI front-office systems (AI receptionists, lead capture, missed-call recovery, booking, follow-up automation) to gyms, clinics, and med spas. Plans run $179-$899/month plus setup.

Classify the email and, when it is from a real prospect who is interested or asking a question, draft a brief reply (2-5 sentences, plain text, no subject line). Be direct and helpful, never pushy. If they want to talk, propose a short discovery call and ask for a time that works. Sign off as "Tom". For not_now, unsubscribe, and other, leave draft_reply as an empty string.`;

export function classifierConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Returns { category, reasoning, draft_reply } or null when unconfigured.
// Throws on API errors — callers should treat classification as best-effort.
export async function classifyInboundEmail({ fromEmail, fromName, businessName, stage, subject, body }) {
  if (!classifierConfigured()) return null;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: `From: ${fromName || ""} <${fromEmail}>
Business: ${businessName || "unknown"}
Lead stage: ${stage || "unknown"}
Subject: ${subject || "(no subject)"}

${(body || "(no content)").slice(0, 4000)}`,
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text;
  if (!text) return null;
  return JSON.parse(text);
}

const FOLLOWUP_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string", description: "Short plain-text follow-up email body, 2-5 sentences, signed 'Tom'" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
};

// Drafts a scheduled follow-up email for a lead. Returns { subject, body },
// falling back to a plain template when the API key is missing or errors.
export async function draftFollowup(lead) {
  const fallback = {
    subject: `Following up — ${lead.business_name || "Corner Systems"}`,
    body: `Hi ${lead.owner_name || "there"},\n\nJust circling back on my earlier note. If front-desk coverage or lead follow-up is still on your radar, happy to show you what we'd set up for ${lead.business_name || "your business"} — takes about 15 minutes.\n\nEither way, all the best.\n\nTom`,
  };
  if (!classifierConfigured()) return fallback;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: FOLLOWUP_SCHEMA } },
      messages: [{
        role: "user",
        content: `Draft a scheduled follow-up email (not a reply) for this lead. Keep it short, specific, and low-pressure.

Business: ${lead.business_name || "unknown"}
Contact: ${lead.owner_name || "unknown"}
Stage: ${lead.stage}
Niche: ${lead.niche || "unknown"}
Pain signal: ${lead.pain_signal || "unknown"}
Notes: ${(lead.notes || "").slice(0, 1500)}`,
      }],
    });
    const text = response.content.find(b => b.type === "text")?.text;
    return text ? JSON.parse(text) : fallback;
  } catch (err) {
    console.error("Follow-up draft failed, using template:", err);
    return fallback;
  }
}
