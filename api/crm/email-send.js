import { requireClerkAuth } from "../_auth.js";
import { logTouch, findLeadByContact } from "../_db.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Thomas at Corner Systems <tmorris@cornersystems.co>";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await requireClerkAuth(req, res);
  if (!session) return;

  const { to_email, to_name, subject, body, lead_id } = req.body;
  if (!to_email || !subject || !body) {
    return res.status(400).json({ error: "to_email, subject, and body are required" });
  }

  const html = `<div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
<div style="font-size:15px;line-height:1.75">${body.replace(/\n/g, "<br>")}</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
  Corner Systems · <a href="https://cornersystems.vercel.app" style="color:#999">cornersystems.vercel.app</a>
</div>
</div>`;

  await resend.emails.send({
    from: FROM,
    replyTo: "tmorris@cornersystems.co",
    to: to_name ? `${to_name} <${to_email}>` : to_email,
    subject,
    html,
  });

  // Log the touch if we can find the lead
  const lead = lead_id
    ? { id: lead_id }
    : await findLeadByContact({ email: to_email });

  if (lead?.id) {
    await logTouch(lead.id, "email", "crm_outbound", "sent", { subject, body });
  }

  return res.json({ ok: true });
}
