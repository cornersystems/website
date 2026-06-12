import { getSetting, setSetting } from "./_db.js";

// Graduated auto-send policy: per action type, AI-drafted emails are either
// queued for human review or sent immediately. Pricing-related drafts and
// per-lead overrides always win over the per-type setting.
export const POLICY_KINDS = ["reply_interested", "reply_question", "followup_due"];

const DEFAULT_POLICY = {
  reply_interested: "review", // replies to hot leads stay human-reviewed by default
  reply_question: "review",
  followup_due: "review",
  always_review_pricing: true,
};

export async function getSendPolicy() {
  const raw = await getSetting("ai_send_policy", null);
  if (!raw) return { ...DEFAULT_POLICY };
  try {
    return { ...DEFAULT_POLICY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_POLICY };
  }
}

export async function setSendPolicy(updates) {
  const current = await getSendPolicy();
  const next = { ...current };
  for (const kind of POLICY_KINDS) {
    if (updates[kind] === "auto" || updates[kind] === "review") next[kind] = updates[kind];
  }
  if (typeof updates.always_review_pricing === "boolean") {
    next.always_review_pricing = updates.always_review_pricing;
  }
  await setSetting("ai_send_policy", JSON.stringify(next));
  return next;
}

// Decides 'auto' | 'review' for an AI-drafted email.
export async function resolveSendAction(kind, { lead, text }) {
  const policy = await getSendPolicy();
  if (policy.always_review_pricing && /\$\s?\d|price|pricing|cost|quote|discount/i.test(text || "")) {
    return "review";
  }
  if (lead?.auto_send_emails === false) return "review";
  if (lead?.auto_send_emails === true) return "auto";
  return policy[kind] === "auto" ? "auto" : "review";
}
