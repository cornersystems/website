import { ensureSchema, sql, logTouch, logAudit } from "../_db.js";
import { draftFollowup } from "../_classify.js";
import { resolveSendAction } from "../_policy.js";
import { sendCrmEmail } from "../_email.js";

// Hourly Vercel cron (vercel.json): generates due follow-up emails through
// the drafts/policy flow, and sends T-24h appointment reminders.
export default async function handler(req, res) {
  // Vercel cron invocations carry the CRON_SECRET as a bearer token when set.
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await ensureSchema();
    const followups = await processDueFollowups();
    const reminders = await sendAppointmentReminders();
    return res.json({ ok: true, followups, reminders });
  } catch (err) {
    console.error("Cron followups error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function processDueFollowups() {
  const due = await sql`
    SELECT * FROM leads
    WHERE next_followup_at IS NOT NULL AND next_followup_at <= NOW()
      AND email IS NOT NULL
      AND stage NOT IN ('client', 'churned', 'dead')
    ORDER BY next_followup_at ASC
    LIMIT 20`;

  let drafted = 0, sent = 0;
  for (const lead of due) {
    const draft = await draftFollowup(lead);
    const action = await resolveSendAction("followup_due", { lead, text: draft.body });

    if (action === "auto") {
      try {
        const externalId = await sendCrmEmail({
          to_email: lead.email, to_name: lead.owner_name, subject: draft.subject, body: draft.body,
        });
        await logTouch(lead.id, "email", "scheduled_followup", "sent", {
          subject: draft.subject, body: draft.body, external_id: externalId,
          notes: "Scheduled follow-up (auto-sent per policy)",
        });
        await logAudit("ai:followup-cron", "auto_send_followup", {
          lead_id: lead.id, reason: "next_followup_at due",
          after: { subject: draft.subject, external_id: externalId },
        });
        sent++;
      } catch (err) {
        console.error(`Follow-up send failed for lead ${lead.id}; queueing draft:`, err);
        await logTouch(lead.id, "email", "scheduled_followup", "pending_review", {
          subject: draft.subject, body: draft.body, notes: "Scheduled follow-up (auto-send failed)",
        });
        drafted++;
      }
    } else {
      await logTouch(lead.id, "email", "scheduled_followup", "pending_review", {
        subject: draft.subject, body: draft.body, notes: "Scheduled follow-up — awaiting review",
      });
      await logAudit("ai:followup-cron", "draft_followup", {
        lead_id: lead.id, reason: "next_followup_at due", after: { subject: draft.subject },
      });
      drafted++;
    }

    await sql`UPDATE leads SET next_followup_at = NULL, last_touched = NOW(), updated_at = NOW() WHERE id = ${lead.id}`;
  }
  return { due: due.length, drafted, sent };
}

async function sendAppointmentReminders() {
  const upcoming = await sql`
    SELECT a.*, l.business_name
    FROM appointments a LEFT JOIN leads l ON l.id = a.lead_id
    WHERE a.status = 'booked'
      AND a.reminder_sent_at IS NULL
      AND a.attendee_email IS NOT NULL
      AND a.start_at > NOW()
      AND a.start_at <= NOW() + INTERVAL '24 hours'
    LIMIT 50`;

  let sent = 0;
  for (const appt of upcoming) {
    const when = new Date(appt.start_at).toLocaleString("en-US", {
      timeZone: appt.timezone || "America/Toronto",
      weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    try {
      const externalId = await sendCrmEmail({
        to_email: appt.attendee_email,
        to_name: appt.attendee_name,
        subject: `Reminder: your Corner Systems call — ${when}`,
        body: `Hi ${appt.attendee_name || "there"},\n\nQuick reminder that your discovery call with Corner Systems is coming up: ${when} (${appt.timezone || "America/Toronto"}).\n\nIf you need to reschedule, just reply to this email.\n\nTalk soon,\nTom`,
      });
      await sql`UPDATE appointments SET reminder_sent_at = NOW(), updated_at = NOW() WHERE id = ${appt.id}`;
      if (appt.lead_id) {
        await logTouch(appt.lead_id, "email", "appointment_reminder", "sent", {
          subject: `Reminder: call ${when}`, external_id: externalId,
        });
      }
      await logAudit("ai:followup-cron", "appointment_reminder", {
        lead_id: appt.lead_id, reason: "T-24h reminder", after: { appointment_id: appt.id, start_at: appt.start_at },
      });
      sent++;
    } catch (err) {
      console.error(`Reminder failed for appointment ${appt.id}:`, err);
    }
  }
  return { upcoming: upcoming.length, sent };
}
