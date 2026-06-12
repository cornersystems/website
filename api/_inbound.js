import { ensureSchema, findLeadByContact, upsertLead, sql, logTouch, logAudit } from "./_db.js";
import { classifyInboundEmail } from "./_classify.js";
import { resolveSendAction } from "./_policy.js";
import { sendCrmEmail } from "./_email.js";

// Process a Resend `email.received` event's data payload: match or create the
// lead, fetch the message body, and log a 'received' touch so it appears in
// the CRM inbox. Returns { matched, lead_id }.
export async function processInboundEmail(data) {
  const from = data?.from;
  if (!from) return { matched: false, lead_id: null, error: "No from address" };

  await ensureSchema();

  const emailMatch = from.match(/<(.+?)>/) || [null, from];
  const fromEmail  = emailMatch[1]?.toLowerCase().trim();
  const fromName   = from.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || null;

  // The email.received payload is metadata-only; the message body must be
  // retrieved separately from the Resend API.
  let body = "";
  if (data.email_id && process.env.RESEND_API_KEY) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${data.email_id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (r.ok) {
        const full = await r.json();
        body = full.text || full.html || "";
      } else {
        console.error("Failed to fetch received email body:", r.status, await r.text());
      }
    } catch (err) {
      console.error("Failed to fetch received email body:", err);
    }
  }

  let lead = await findLeadByContact({ email: fromEmail });
  const matched = !!lead;

  if (!lead) {
    // New contact — create a lead (race-safe upsert) so it shows in the inbox
    const leadId = await upsertLead({
      name: fromName,
      email: fromEmail,
      business_name: fromName || fromEmail,
      source: "inbound_email",
      contact_type: "inbound",
      lead_tier: "warm",
      lead_score: 50,
    });
    await sql`UPDATE leads SET stage = 'replied', last_touched = NOW(), updated_at = NOW() WHERE id = ${leadId} AND stage = 'found'`;
    lead = { id: leadId };
  } else {
    // Known lead — advance stage if applicable
    const advanceable = ["found", "emailed_d0", "emailed_d3", "emailed_d7"];
    if (advanceable.includes(lead.stage)) {
      await sql`
        UPDATE leads SET stage = 'replied', last_touched = NOW(), updated_at = NOW()
        WHERE id = ${lead.id}
      `;
    }
  }

  await logTouch(lead.id, "email", "reply_received", "received", {
    subject: data.subject || "(no subject)",
    body: body.slice(0, 10000),
    external_id: data.email_id || null,
    recipient: (Array.isArray(data.to) ? data.to[0] : data.to)?.toLowerCase() || null,
  });

  // Best-effort AI triage: classify the reply, adjust the lead, and queue a
  // response draft into the existing pending_review flow. Never fatal.
  let classification = null;
  try {
    classification = await classifyInboundEmail({
      fromEmail, fromName,
      businessName: lead.business_name || fromName,
      stage: lead.stage,
      subject: data.subject,
      body,
    });
  } catch (err) {
    console.error("Inbound classification failed:", err);
  }

  if (classification) {
    const { category, reasoning, draft_reply } = classification;
    if (category === "unsubscribe") {
      await sql`UPDATE leads SET stage = 'dead', updated_at = NOW() WHERE id = ${lead.id}`;
      await logAudit("ai:classifier", "advance_stage", {
        lead_id: lead.id, reason: reasoning,
        before: { stage: lead.stage || "replied" }, after: { stage: "dead" },
      });
    } else if (category === "interested") {
      await sql`UPDATE leads SET lead_tier = 'hot', updated_at = NOW() WHERE id = ${lead.id}`;
      await logAudit("ai:classifier", "set_tier", {
        lead_id: lead.id, reason: reasoning,
        before: { lead_tier: lead.lead_tier || "unknown" }, after: { lead_tier: "hot" },
      });
    }
    if (draft_reply && (category === "interested" || category === "question")) {
      const subject = data.subject
        ? (/^re:/i.test(data.subject) ? data.subject : `Re: ${data.subject}`)
        : "Re: your message";
      const kind = category === "interested" ? "reply_interested" : "reply_question";
      const action = await resolveSendAction(kind, { lead, text: draft_reply });

      if (action === "auto") {
        try {
          const externalId = await sendCrmEmail({
            to_email: fromEmail, to_name: fromName, subject, body: draft_reply,
          });
          await logTouch(lead.id, "email", "ai_reply_draft", "sent", {
            subject, body: draft_reply, external_id: externalId,
            notes: `AI triage: ${category} — ${reasoning} (auto-sent per policy)`,
          });
          await logAudit("ai:classifier", "auto_send_reply", {
            lead_id: lead.id, reason: reasoning, after: { subject, category, external_id: externalId },
          });
        } catch (err) {
          console.error("Auto-send failed; queueing draft for review:", err);
          await logTouch(lead.id, "email", "ai_reply_draft", "pending_review", {
            subject, body: draft_reply, notes: `AI triage: ${category} — ${reasoning} (auto-send failed)`,
          });
        }
      } else {
        await logTouch(lead.id, "email", "ai_reply_draft", "pending_review", {
          subject, body: draft_reply, notes: `AI triage: ${category} — ${reasoning}`,
        });
        await logAudit("ai:classifier", "draft_reply", {
          lead_id: lead.id, reason: reasoning, after: { subject, category },
        });
      }
    }
  }

  return { matched, lead_id: lead.id, classification: classification?.category || null };
}
