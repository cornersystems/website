import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, business, email, bottleneck, preferredTime } = req.body;

  if (!name || !business || !email || !bottleneck) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await resend.emails.send({
      from: "Corner Systems <onboarding@resend.dev>",
      to: "cornersystemsai@gmail.com",
      replyTo: email,
      subject: `New discovery call request — ${business}`,
      html: `
        <h2>New discovery call request</h2>
        <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:560px">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Business</strong></td><td>${business}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td><strong>Biggest bottleneck</strong></td><td>${bottleneck}</td></tr>
          <tr><td><strong>Best follow-up time</strong></td><td>${preferredTime || "Not specified"}</td></tr>
        </table>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend error:", JSON.stringify(err, null, 2));
    return res.status(500).json({ error: "Failed to send email", detail: err?.message });
  }
}
