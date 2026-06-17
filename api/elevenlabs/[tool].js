import { requireApiKey } from "../_auth.js";
import { sql, findLeadByContact, upsertLead, logTouch, logAudit, ensureSchema } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";
import { calcomConfigured, getAvailableSlots, createBooking } from "../_calcom.js";

const NOT_CONFIGURED = {
  configured: false,
  message: "Direct scheduling is not configured. Direct the caller to book via cornersystems.co/contact.",
};

export default async function handler(req, res) {
  try {
    return await route(req, res);
  } catch (err) {
    console.error("ElevenLabs API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function route(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const tool = req.query.tool;
  const d    = req.body;

  await ensureSchema();

  // ── discovery-availability (read-only, no auth) ───────────────────────────
  if (tool === "discovery-availability") {
    if (!calcomConfigured()) return res.json(NOT_CONFIGURED);
    const timeZone = d.timezone || "America/Toronto";
    const days = Math.min(Number(d.days) || 7, 14);
    const slots = (await getAvailableSlots({
      start: new Date().toISOString(),
      end: new Date(Date.now() + days * 86400000).toISOString(),
      timeZone,
    })).slice(0, 8);
    return res.json({
      configured: true,
      timezone: timeZone,
      slots,
      spoken: slots.map(s => new Date(s).toLocaleString("en-US", {
        timeZone, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
      })),
    });
  }

  if (!requireApiKey(req, res)) return;

  // ── book-discovery ──────────────────────────────────────────────────────────
  if (tool === "book-discovery") {
    if (!calcomConfigured()) return res.json(NOT_CONFIGURED);
    if (!d.start || !d.email) return res.status(400).json({ error: "start (ISO) and email required" });

    const timeZone = d.timezone || "America/Toronto";
    const booking = await createBooking({
      start: d.start, name: d.name, email: d.email, timeZone, phone: d.phone,
      metadata: { source: "elevenlabs", conversation_id: d.conversation_id || "" },
    });

    const leadId = await upsertLead({
      name: d.name, email: d.email, phone: d.phone, business_name: d.business_name,
      lead_tier: d.lead_tier || "hot", contact_type: "prospect",
      source: d.source_page || "elevenlabs", conversation_id: d.conversation_id,
      pain_signal: d.main_bottleneck,
    });
    await sql`UPDATE leads SET stage='discovery_booked', last_touched=NOW(), updated_at=NOW()
      WHERE id=${leadId} AND stage NOT IN ('client','churned')`;

    await sql`
      INSERT INTO appointments (lead_id, start_at, end_at, status, kind, source,
        attendee_name, attendee_email, attendee_phone, timezone, external_uid, notes, conversation_id)
      VALUES (${leadId}, ${booking.start}, ${booking.end}, 'booked', 'discovery', 'elevenlabs',
        ${d.name || null}, ${d.email}, ${d.phone || null}, ${timeZone}, ${booking.uid},
        ${d.conversation_summary || d.main_bottleneck || null}, ${d.conversation_id || null})
    `;
    await logTouch(leadId, "call", "discovery_booked", "booked", {
      notes: `Discovery call booked for ${booking.start}`, external_id: booking.uid,
    });
    await logAudit("ai:elevenlabs", "book_discovery", {
      lead_id: leadId, reason: d.conversation_summary || null,
      after: { start: booking.start, booking_uid: booking.uid, stage: "discovery_booked" },
    });
    await notifyTeam({
      subject: `📅 Discovery call booked — ${d.business_name || d.name || d.email}`,
      html: notifyHtml("Discovery call booked", [
        leadRow("Name", d.name), leadRow("Business", d.business_name), leadRow("Email", d.email),
        leadRow("Phone", d.phone), leadRow("When", new Date(booking.start).toLocaleString("en-US", { timeZone })),
        leadRow("Timezone", timeZone),
      ].join(""), d.conversation_summary || ""),
    });
    return res.json({
      ok: true, configured: true, lead_id: leadId, booking_uid: booking.uid,
      start: booking.start,
      message: `Booked for ${new Date(booking.start).toLocaleString("en-US", { timeZone, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} (${timeZone}). Confirmation email sent by the calendar.`,
    });
  }

  // ── routing-context ────────────────────────────────────────────────────────
  if (tool === "routing-context") {
    const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    if (!lead) return res.json({ found: false, entry_mode: d.entry_mode, configured: true });
    const touches = await sql`SELECT type, channel, status, created_at FROM touches WHERE lead_id = ${lead.id} ORDER BY created_at DESC LIMIT 3`;
    return res.json({ found: true, configured: true, lead_id: lead.id, contact_type: lead.contact_type,
      stage: lead.stage, lead_tier: lead.lead_tier, business_name: lead.business_name,
      owner_name: lead.owner_name, email: lead.email, phone: lead.phone,
      pain_signal: lead.pain_signal, notes: lead.notes, recent_touches: touches });
  }

  // ── leads ──────────────────────────────────────────────────────────────────
  if (tool === "leads") {
    const leadId = await upsertLead(d);
    await logTouch(leadId, "crm", "cs_create_or_update_lead", "created", { notes: d.conversation_summary || null });
    return res.json({ ok: true, configured: true, lead_id: leadId });
  }

  // ── discovery-lead ─────────────────────────────────────────────────────────
  if (tool === "discovery-lead") {
    const leadId = await upsertLead({
      name: d.name, email: d.email, phone: d.phone, business_name: d.business_name,
      website: d.website, city: d.location, market: d.market, lead_score: d.lead_score || 8,
      lead_tier: d.lead_tier || "warm", contact_type: "prospect",
      source: d.source_page || "elevenlabs", conversation_id: d.conversation_id,
      pain_signal: d.main_bottleneck,
    });
    await sql`UPDATE leads SET stage='replied', last_touched=NOW(), updated_at=NOW() WHERE id=${leadId} AND stage IN ('found','emailed_d0','emailed_d3','emailed_d7')`;
    await logTouch(leadId, "call", "discovery_lead", "received", { notes: d.conversation_summary || d.main_bottleneck });
    await notifyTeam({
      subject: `🔥 New discovery lead — ${d.business_name || d.name || "Unknown"}`,
      html: notifyHtml("New discovery call request", [
        leadRow("Name", d.name), leadRow("Business", d.business_name), leadRow("Email", d.email),
        leadRow("Phone", d.phone), leadRow("Location", d.location), leadRow("Bottleneck", d.main_bottleneck),
        leadRow("Urgency", d.urgency), leadRow("Preferred time", d.preferred_time), leadRow("Tier", d.lead_tier),
      ].join(""), d.conversation_summary || ""),
    });
    return res.json({ ok: true, configured: true, lead_id: leadId, message: "Discovery details captured." });
  }

  // ── support ────────────────────────────────────────────────────────────────
  if (tool === "support") {
    const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    const rows = await sql`
      INSERT INTO tickets (lead_id,business_name,name,email,phone,issue_category,affected_system,
        issue_summary,urgency,customer_impact,conversation_id,conversation_summary)
      VALUES (${lead?.id||null},${d.business_name},${d.name||null},${d.email||null},${d.phone||null},
        ${d.issue_category||null},${d.affected_system||null},${d.issue_summary},${d.urgency||"normal"},
        ${d.customer_impact||null},${d.conversation_id},${d.conversation_summary||null}) RETURNING id`;
    if (lead) await logTouch(lead.id, "support", "ticket_created", "open", { notes: d.issue_summary });
    await notifyTeam({ subject: `🎫 Support ticket — ${d.business_name} [${d.urgency||"normal"}]`,
      html: notifyHtml("New support ticket", [
        leadRow("Business", d.business_name), leadRow("Issue", d.issue_summary),
        leadRow("Category", d.issue_category), leadRow("Urgency", d.urgency),
      ].join(""), d.conversation_summary || "") });
    return res.json({ ok: true, configured: true, ticket_id: rows[0].id });
  }

  // ── client-success ─────────────────────────────────────────────────────────
  if (tool === "client-success") {
    const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    const rows = await sql`
      INSERT INTO client_success_requests (lead_id,business_name,name,email,phone,current_workflow,
        requested_change,business_reason,urgency,scope_or_pricing_risk,conversation_id,conversation_summary)
      VALUES (${lead?.id||null},${d.business_name},${d.name||null},${d.email||null},${d.phone||null},
        ${d.current_workflow||null},${d.requested_change},${d.business_reason||null},${d.urgency||null},
        ${d.scope_or_pricing_risk||false},${d.conversation_id},${d.conversation_summary||null}) RETURNING id`;
    if (lead) await logTouch(lead.id, "client_success", "csr_created", "open", { notes: d.requested_change });
    await notifyTeam({ subject: `🔧 Client success request — ${d.business_name}`,
      html: notifyHtml("Client success request", [
        leadRow("Business", d.business_name), leadRow("Change", d.requested_change),
        leadRow("Reason", d.business_reason), leadRow("Urgency", d.urgency),
      ].join(""), d.conversation_summary || "") });
    return res.json({ ok: true, configured: true, request_id: rows[0].id });
  }

  // ── partner ────────────────────────────────────────────────────────────────
  if (tool === "partner") {
    const rows = await sql`
      INSERT INTO partners (name,email,phone,organization,website,partner_type,audience_or_network,
        referral_fit,services_of_interest,requested_next_step,preferred_callback_window,conversation_id,conversation_summary)
      VALUES (${d.name||null},${d.email||null},${d.phone||null},${d.organization||null},${d.website||null},
        ${d.partner_type||null},${d.audience_or_network||null},${d.referral_fit},${d.services_of_interest||null},
        ${d.requested_next_step},${d.preferred_callback_window||null},${d.conversation_id},${d.conversation_summary||null})
      RETURNING id`;
    await notifyTeam({ subject: `🤝 Partner inquiry — ${d.organization||d.name}`,
      html: notifyHtml("New partner intake", [
        leadRow("Name", d.name), leadRow("Organization", d.organization),
        leadRow("Type", d.partner_type), leadRow("Fit", d.referral_fit),
      ].join(""), d.conversation_summary || "") });
    return res.json({ ok: true, configured: true, partner_id: rows[0].id });
  }

  // ── notify ─────────────────────────────────────────────────────────────────
  if (tool === "notify") {
    await notifyTeam({ subject: `⚠️ Internal [${d.priority||"normal"}] — ${d.notification_type||"general"}`,
      html: notifyHtml("Internal notification", [
        leadRow("Type", d.notification_type), leadRow("Priority", d.priority),
        leadRow("Summary", d.summary), leadRow("Action", d.requested_action),
      ].join("")) });
    return res.json({ ok: true, configured: true });
  }

  // ── callback ───────────────────────────────────────────────────────────────
  if (tool === "callback") {
    const lead = await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    const rows = await sql`
      INSERT INTO callbacks (lead_id,name,email,phone,business_name,preferred_callback_window,
        urgency,summary,requested_action,conversation_id)
      VALUES (${lead?.id||null},${d.name||null},${d.email||null},${d.phone||null},${d.business_name||null},
        ${d.preferred_callback_window},${d.urgency||null},${d.summary},${d.requested_action||null},
        ${d.conversation_id}) RETURNING id`;
    if (lead) await logTouch(lead.id, "callback", "callback_requested", "pending", { notes: d.summary });
    await notifyTeam({ subject: `📞 Callback — ${d.business_name||d.name||"Unknown"}`,
      html: notifyHtml("Callback request", [
        leadRow("Name", d.name), leadRow("Business", d.business_name),
        leadRow("Phone", d.phone), leadRow("Window", d.preferred_callback_window),
        leadRow("Summary", d.summary),
      ].join("")) });
    return res.json({ ok: true, configured: true, callback_id: rows[0].id });
  }

  // ── event ──────────────────────────────────────────────────────────────────
  if (tool === "event") {
    await sql`
      INSERT INTO events (event_name,entry_mode,route,recommended_specialist_agent,action_taken,
        human_escalation,follow_up_required,conversation_id,summary)
      VALUES (${d.event_name},${d.entry_mode},${d.route||null},${d.recommended_specialist_agent||null},
        ${d.action_taken||null},${d.human_escalation||false},${d.follow_up_required||false},
        ${d.conversation_id},${d.summary||null})`;
    return res.json({ ok: true, configured: true });
  }

  // ── advance-stage (AI write-API) ────────────────────────────────────────────
  if (tool === "advance-stage") {
    const STAGES = ["found", "researched", "emailed_d0", "emailed_d3", "emailed_d7", "called", "replied", "discovery_booked", "client", "churned", "dead"];
    if (!d.stage || !STAGES.includes(d.stage)) {
      return res.status(400).json({ error: `stage must be one of: ${STAGES.join(", ")}` });
    }
    if (!d.reason) return res.status(400).json({ error: "reason required" });
    const lead = d.lead_id
      ? (await sql`SELECT * FROM leads WHERE id = ${d.lead_id}`)[0]
      : await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    await sql`UPDATE leads SET stage = ${d.stage}, last_touched = NOW(), updated_at = NOW() WHERE id = ${lead.id}`;
    await logAudit(d.actor || "ai:elevenlabs", "advance_stage", {
      lead_id: lead.id, reason: d.reason,
      before: { stage: lead.stage }, after: { stage: d.stage },
    });
    return res.json({ ok: true, configured: true, lead_id: lead.id, previous_stage: lead.stage, stage: d.stage });
  }

  // ── schedule-followup (AI write-API) ────────────────────────────────────────
  if (tool === "schedule-followup") {
    const lead = d.lead_id
      ? (await sql`SELECT * FROM leads WHERE id = ${d.lead_id}`)[0]
      : await findLeadByContact({ email: d.email, phone: d.phone, business_name: d.business_name });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const days = Math.max(1, Math.min(Number(d.days) || 3, 365));
    const dueAt = d.due_at ? new Date(d.due_at) : new Date(Date.now() + days * 86400000);
    if (isNaN(dueAt.getTime())) return res.status(400).json({ error: "due_at must be an ISO timestamp" });

    await sql`UPDATE leads SET next_followup_at = ${dueAt.toISOString()}, updated_at = NOW() WHERE id = ${lead.id}`;
    await logTouch(lead.id, "crm", "followup_scheduled", "scheduled", {
      notes: d.note || `Follow-up scheduled for ${dueAt.toISOString()}`,
    });
    await logAudit(d.actor || "ai:elevenlabs", "schedule_followup", {
      lead_id: lead.id, reason: d.note || d.reason || null,
      after: { next_followup_at: dueAt.toISOString() },
    });
    return res.json({ ok: true, configured: true, lead_id: lead.id, next_followup_at: dueAt.toISOString() });
  }

  // ── merge-leads (AI write-API) ──────────────────────────────────────────────
  if (tool === "merge-leads") {
    const primaryId = Number(d.primary_lead_id), dupId = Number(d.duplicate_lead_id);
    if (!primaryId || !dupId || primaryId === dupId) {
      return res.status(400).json({ error: "primary_lead_id and duplicate_lead_id (distinct) required" });
    }
    if (!d.reason) return res.status(400).json({ error: "reason required" });
    const primary = (await sql`SELECT * FROM leads WHERE id = ${primaryId}`)[0];
    const dup     = (await sql`SELECT * FROM leads WHERE id = ${dupId}`)[0];
    if (!primary || !dup) return res.status(404).json({ error: "Lead not found" });

    await sql`UPDATE touches SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`UPDATE tickets SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`UPDATE callbacks SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`UPDATE client_success_requests SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`UPDATE clients SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`UPDATE appointments SET lead_id = ${primaryId} WHERE lead_id = ${dupId}`;
    await sql`
      UPDATE leads SET
        owner_name = COALESCE(owner_name, ${dup.owner_name}),
        email      = COALESCE(email, ${dup.email}),
        phone      = COALESCE(phone, ${dup.phone}),
        website    = COALESCE(website, ${dup.website}),
        city       = COALESCE(city, ${dup.city}),
        notes      = CONCAT_WS(E'\n---\n', notes, ${dup.notes}),
        lead_score = GREATEST(lead_score, ${dup.lead_score || 0}),
        updated_at = NOW()
      WHERE id = ${primaryId}
    `;
    await sql`DELETE FROM leads WHERE id = ${dupId}`;
    await logAudit(d.actor || "ai:elevenlabs", "merge_leads", {
      lead_id: primaryId, reason: d.reason,
      before: { duplicate: { id: dup.id, business_name: dup.business_name, email: dup.email } },
      after: { merged_into: primaryId },
    });
    return res.json({ ok: true, configured: true, lead_id: primaryId, merged_lead_id: dupId });
  }

  return res.status(404).json({ error: `Unknown tool: ${tool}` });
}
