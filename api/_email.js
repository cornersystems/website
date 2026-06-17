import { Resend } from "resend";

export const FROM = "Thomas at Corner Systems <tmorris@cornersystems.co>";
export const REPLY_TO = "tmorris@cornersystems.co";

let _resend = null;
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export function emailHtml(body) {
  return `<div style="font-family:sans-serif;max-width:560px;color:#1a1a1a">
<div style="font-size:15px;line-height:1.75">${body.replace(/\n/g, "<br>")}</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
  Corner Systems · <a href="https://cornersystems.co" style="color:#999">cornersystems.co</a>
</div></div>`;
}

// Sends a CRM email; returns the Resend message id (external_id for touches).
export async function sendCrmEmail({ to_email, to_name, subject, body }) {
  const result = await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: to_name ? `${to_name} <${to_email}>` : to_email,
    subject,
    html: emailHtml(body),
  });
  if (result.error) throw new Error(`Resend send failed: ${result.error.message || JSON.stringify(result.error)}`);
  return result.data?.id || null;
}
