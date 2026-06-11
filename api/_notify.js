import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Corner Systems CRM <tmorris@cornersystems.co>";
const TO     = "tmorris@cornersystems.co";

export async function notifyTeam({ subject, html }) {
  try {
    await resend.emails.send({ from: FROM, to: TO, subject, html });
  } catch (err) {
    console.error("Notify failed:", err?.message);
  }
}

export function leadRow(label, value) {
  if (!value) return "";
  return `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">${label}</td><td style="padding:6px 12px">${value}</td></tr>`;
}

export function notifyHtml(title, rows, extra = "") {
  return `
<div style="font-family:sans-serif;max-width:600px;color:#1a1a1a">
  <h2 style="margin-bottom:16px">${title}</h2>
  <table style="border-collapse:collapse;width:100%;background:#f9f9f9;border-radius:8px">
    ${rows}
  </table>
  ${extra ? `<div style="margin-top:20px;padding:12px;background:#f0f4ff;border-radius:6px;font-size:14px">${extra}</div>` : ""}
  <p style="margin-top:24px;font-size:12px;color:#999">Corner Systems CRM · ${new Date().toUTCString()}</p>
</div>`;
}
