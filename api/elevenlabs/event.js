import { requireApiKey } from "../_auth.js";
import { sql } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!requireApiKey(req, res)) return;

  const d = req.body;

  await sql`
    INSERT INTO events (event_name, entry_mode, route, recommended_specialist_agent,
      action_taken, human_escalation, follow_up_required, conversation_id, summary)
    VALUES (
      ${d.event_name}, ${d.entry_mode}, ${d.route || null},
      ${d.recommended_specialist_agent || null}, ${d.action_taken || null},
      ${d.human_escalation || false}, ${d.follow_up_required || false},
      ${d.conversation_id}, ${d.summary || null}
    )
  `;

  return res.json({ ok: true, configured: true });
}
