/**
 * Corner Systems — Front-Office Tool Detector
 *
 * Deterministically detects what front-office tooling a business ALREADY has by
 * fetching its real website pages and scanning the HTML for known platform
 * signatures — instead of asking an LLM to guess from memory (which was scoring
 * med spas with Jane + live chat as "no AI tools, score 9").
 *
 * Returns:
 *   {
 *     reachable:        bool,   // did any page load
 *     has_website:      bool,
 *     has_chatbot:      bool,   // live-chat / messaging widget present
 *     has_booking:      bool,   // real online booking / scheduling platform
 *     has_voice_agent:  bool,   // AI receptionist / "never miss a call" language
 *     tools_found:      [string] // human-readable names, e.g. ["Jane App", "Tidio"]
 *   }
 *
 * No API cost — plain HTTP. Usage: detectTools("https://example.com")
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Pages most likely to expose booking/chat widgets
const CANDIDATE_PATHS = ["", "/contact", "/contact-us", "/book", "/booking", "/book-now", "/appointments", "/schedule"];

// signature → list of substrings that, if present in page HTML, indicate the tool
const CHAT_SIGNATURES = {
  "Intercom":           ["widget.intercom.io", "intercom.io", "intercomcdn"],
  "Drift":              ["js.driftt.com", "drift.com", "drift-frame"],
  "tawk.to":            ["tawk.to", "embed.tawk.to"],
  "Tidio":              ["tidio", "code.tidio.co"],
  "Crisp":              ["crisp.chat", "client.crisp.chat"],
  "LiveChat":           ["livechatinc", "cdn.livechatinc.com"],
  "Zendesk Chat":       ["zopim", "zdassets", "static.zdassets"],
  "HubSpot Chat":       ["js.hs-scripts.com", "js.hscollectedforms", "hs-banner"],
  "Facebook Messenger": ["fb-customerchat", "facebook.com/customer_chat", "customerchat.js", "fb-messengermessageus"],
  "Podium":             ["widget.podium.com", "podium.com/widget"],
  "Birdeye":            ["birdeye.com", "bird.eye"],
  "ManyChat":           ["manychat"],
  "Gorgias":            ["gorgias.chat"],
  "Olark":              ["olark"],
};

const BOOKING_SIGNATURES = {
  "Jane App":            ["janeapp.com", "jane.app", "janeapp"],
  "Mindbody":            ["mindbodyonline", "mindbody"],
  "Acuity Scheduling":   ["acuityscheduling", "acuity scheduling"],
  "Calendly":            ["calendly.com", "assets.calendly"],
  "Vagaro":              ["vagaro.com", "vagaro"],
  "Square Appointments": ["squareup.com/appointments", "square.site/book"],
  "SimplyBook":          ["simplybook.me", "simplybook.it"],
  "Fresha":              ["fresha.com"],
  "Setmore":             ["setmore.com"],
  "Booksy":              ["booksy.com"],
  "Schedulicity":        ["schedulicity"],
  "Noterro":             ["noterro.com"],
  "Cliniko":             ["cliniko.com"],
  "Jituzu":              ["jituzu"],
};

const VOICE_SIGNATURES = {
  "AI voice / receptionist": ["ai receptionist", "virtual receptionist", "never miss a call", "ai voice agent", "ai answering"],
};

function matchSignatures(html, table) {
  const found = [];
  for (const [name, needles] of Object.entries(table)) {
    if (needles.some((n) => html.includes(n))) found.push(name);
  }
  return found;
}

async function fetchPage(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.toLowerCase();
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function normalizeBase(website) {
  let base = (website || "").trim();
  if (!base) return null;
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  return base.replace(/\/+$/, "");
}

export async function detectTools(website) {
  const empty = {
    reachable: false, has_website: false,
    has_chatbot: false, has_booking: false, has_voice_agent: false,
    tools_found: [],
  };

  const base = normalizeBase(website);
  if (!base) return empty;

  // Fetch all candidate pages in parallel — total time ≈ one timeout, not the sum
  const urls = CANDIDATE_PATHS.map((p) => base + p);
  const pages = await Promise.allSettled(urls.map((u) => fetchPage(u)));
  const htmls = pages
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  if (!htmls.length) {
    // Site unreachable — we know a website URL exists but couldn't load it
    return { ...empty, has_website: true };
  }

  const combined = htmls.join("\n");

  const chat    = matchSignatures(combined, CHAT_SIGNATURES);
  const booking = matchSignatures(combined, BOOKING_SIGNATURES);
  const voice   = matchSignatures(combined, VOICE_SIGNATURES);

  return {
    reachable:       true,
    has_website:     true,
    has_chatbot:     chat.length    > 0,
    has_booking:     booking.length > 0,
    has_voice_agent: voice.length   > 0,
    tools_found:     [...chat, ...booking, ...voice],
  };
}

// Run directly for spot-checking:  node agent/detect-tools.js https://vbeautyspa.com
const isDirect = process.argv[1]?.endsWith("detect-tools.js");
if (isDirect) {
  const url = process.argv[2];
  if (!url) { console.error("Usage: node agent/detect-tools.js <website>"); process.exit(1); }
  detectTools(url).then((r) => console.log(JSON.stringify(r, null, 2)));
}
