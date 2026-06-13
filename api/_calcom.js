// Cal.com v2 API adapter for discovery-call availability and booking.
// Requires CALCOM_API_KEY (cal_...) and CALCOM_EVENT_TYPE_ID (numeric event
// type for the discovery call). Without them, callers must degrade to a
// configured:false response per AGENTS.md.

const CALCOM_API = "https://api.cal.com/v2";

export function calcomConfigured() {
  return !!(process.env.CALCOM_API_KEY && process.env.CALCOM_EVENT_TYPE_ID);
}

function authHeaders(apiVersion) {
  return {
    Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
    "cal-api-version": apiVersion,
    "Content-Type": "application/json",
  };
}

// Returns a flat, chronological list of ISO start times within [start, end].
export async function getAvailableSlots({ start, end, timeZone = "America/Toronto" }) {
  const params = new URLSearchParams({
    eventTypeId: process.env.CALCOM_EVENT_TYPE_ID,
    start,
    end,
    timeZone,
  });
  const r = await fetch(`${CALCOM_API}/slots?${params}`, {
    headers: authHeaders("2024-09-04"),
  });
  if (!r.ok) throw new Error(`Cal.com slots request failed (${r.status}): ${await r.text()}`);
  const json = await r.json();
  // Response shape: { status, data: { "YYYY-MM-DD": ["ISO", ...], ... } }
  return Object.values(json.data || {}).flat().map(s => (typeof s === "string" ? s : s.start)).sort();
}

// Books the discovery event type; returns { uid, start, end }.
export async function createBooking({ start, name, email, timeZone = "America/Toronto", phone, metadata = {} }) {
  const r = await fetch(`${CALCOM_API}/bookings`, {
    method: "POST",
    headers: authHeaders("2026-02-25"),
    body: JSON.stringify({
      start,
      eventTypeId: Number(process.env.CALCOM_EVENT_TYPE_ID),
      attendee: {
        name: name || email,
        email,
        timeZone,
        ...(phone ? { phoneNumber: phone } : {}),
      },
      metadata,
    }),
  });
  if (!r.ok) throw new Error(`Cal.com booking failed (${r.status}): ${await r.text()}`);
  const json = await r.json();
  const data = json.data || {};
  return { uid: data.uid || null, start: data.start || start, end: data.end || null };
}
