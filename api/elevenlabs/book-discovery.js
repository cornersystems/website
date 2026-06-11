export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // Direct booking not yet configured — Calendly handles this.
  return res.json({
    configured: false,
    message: "Direct booking is not configured. Direct the caller to book via cornersystems.vercel.app/contact.",
  });
}
