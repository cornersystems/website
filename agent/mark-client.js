#!/usr/bin/env node
/**
 * Mark a lead as a paying client and send their onboarding email.
 *
 * Usage:
 *   node agent/mark-client.js --lead-id 42 --plan "Growth" --mrr 299
 */
import "dotenv/config";
import { getLead, updateStage, addClient, logTouch } from "./db.js";
import { sendSequenceEmail } from "./email-outreach.js";

const args   = process.argv.slice(2);
const get    = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };

const leadId = parseInt(get("--lead-id"), 10);
const plan   = get("--plan") || "Starter";
const mrr    = parseFloat(get("--mrr") || "199");

if (!leadId) { console.error("Usage: node agent/mark-client.js --lead-id 42 --plan Growth --mrr 299"); process.exit(1); }

const lead = getLead(leadId);
if (!lead) { console.error(`Lead ${leadId} not found`); process.exit(1); }

console.log(`\n🎉 Converting ${lead.business_name} to client`);
console.log(`   Plan: ${plan} | MRR: $${mrr}\n`);

addClient({ lead_id: leadId, ...lead, plan, mrr });
updateStage(leadId, "client");
logTouch(leadId, "note", "converted", "completed", { notes: `Converted to client. Plan: ${plan}. MRR: $${mrr}` });

await sendSequenceEmail(lead, "onboard_w1");

console.log(`✅ ${lead.business_name} is now a client. Onboarding email sent.\n`);
