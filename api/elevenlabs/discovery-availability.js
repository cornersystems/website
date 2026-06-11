export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // Direct calendar scheduling not yet configured — Calendly handles booking.
  return res.json({
    configured: false,
    message: "Direct scheduling is not configured. Direct the caller to book via the Calendly link at cornersystems.vercel.app/contact.",
  });
}
