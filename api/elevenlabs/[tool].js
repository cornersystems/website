import { requireApiKey } from "../_auth.js";
import { sql, findLeadByContact, upsertLead, logTouch, ensureSchema } from "../_db.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const tool = req.query.tool;
  const d    = req.body;

  // Discovery availability and book-discovery are open — no auth needed, just return configured:false
  await ensureSchema();

  if (tool === "discovery-availability" || tool === "book-discovery") {
    return res.json({
      configured: false,
      message: "Direct scheduling is not configured. Direct the caller to book via cornersystems.vercel.app/contact.",
    });
  }

  if (!requireApiKey(req, res)) return;

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

  return res.status(404).json({ error: `Unknown tool: ${tool}` });
}
