// Push the CURRENT DB → all sheet tabs. No research, no lead discovery.
// Safe to run from anywhere; the safety guard in syncToSheets still applies.
import "dotenv/config";
import {
  syncToSheets, archiveYesterdayTop10, syncTop10Daily,
  syncFollowUpQueue, syncHotLeads, syncDashboard,
} from "./sync-to-sheets.js";

console.log("Syncing current DB → Google Sheet (no research)…\n");
await syncToSheets();          // Leads tab (guard-protected)
await archiveYesterdayTop10(); // copy old Top 10 → "Top 10 — Yesterday"
await syncTop10Daily();        // regenerate Top 10 Today
await syncFollowUpQueue();
await syncHotLeads();
await syncDashboard();
console.log("\nDone.");
