import { upsertLead, logTouch, ensureSchema } from "./_db.js";
import { notifyTeam, notifyHtml, leadRow } from "./_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, business, email, bottleneck, preferredTime } = req.body;

  if (!name || !business || !email || !bottleneck) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await ensureSchema();

    const leadId = await upsertLead({
      name,
      business_name: business,
      email,
      pain_signal: bottleneck,
      source: "website_contact_form",
      contact_type: "inbound",
      lead_tier: "warm",
      lead_score: 60,
    });

    await logTouch(leadId, "form", "website_contact", "received", {
      subject: "Discovery call request",
      body: `Bottleneck: ${bottleneck}\nPreferred time: ${preferredTime || "Not specified"}`,
    });

    await notifyTeam({
      subject: `New discovery call request — ${business}`,
      html: notifyHtml(
        "New discovery call request",
        [
          leadRow("Name", name),
          leadRow("Business", business),
          leadRow("Email", `<a href="mailto:${email}">${email}</a>`),
          leadRow("Biggest bottleneck", bottleneck),
          leadRow("Best follow-up time", preferredTime || "Not specified"),
        ].join(""),
      ),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Failed to process request", detail: err?.message });
  }
}
