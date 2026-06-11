import { requireApiKey } from "../_auth.js";
import { notifyTeam, notifyHtml, leadRow } from "../_notify.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;

  await notifyTeam({
    subject: `⚠️ Internal notification [${d.priority || "normal"}] — ${d.notification_type || "general"}`,
    html: notifyHtml(
      "Internal notification",
      [
        leadRow("Type", d.notification_type),
        leadRow("Priority", d.priority),
        leadRow("Name", d.name),
        leadRow("Business", d.business_name),
        leadRow("Email", d.email),
        leadRow("Phone", d.phone),
        leadRow("Summary", d.summary),
        leadRow("Requested action", d.requested_action),
      ].join("")
    ),
  });

  return res.json({ ok: true, configured: true });
}
