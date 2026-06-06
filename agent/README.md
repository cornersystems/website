# Corner Systems — Sales Pipeline Agent

Fully automated outbound sales system. Finds leads, emails them, calls them, books them, keeps them.

## Setup

Add these to your `.env` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...          # See elevenlabs-outbound-agent.md
ELEVENLABS_PHONE_NUMBER_ID=...   # Buy a number in ElevenLabs dashboard
```

## Daily Workflow

### Step 1 — Find leads (run as needed)
```bash
node agent/find-leads.js --niche "MMA gyms" --location "Austin, TX" --count 20
node agent/find-leads.js --niche "BJJ academies" --location "Miami, FL" --count 15
node agent/find-leads.js --niche "boxing gyms" --location "Houston, TX" --count 15
```
Leads are automatically saved to the CRM with stage = `found`.

### Step 2 — Run the pipeline (run every morning)
```bash
node agent/pipeline.js
```
This automatically:
- Emails all new `found` leads (personalised cold email via Claude + Resend)
- Sends day-3 follow-up to anyone who hasn't replied
- Sends day-7 last-touch breakup email
- Calls anyone who still hasn't replied after the email sequence (ElevenLabs)
- Sends 30-day check-ins to active clients

### Step 3 — Mark a lead as a client (when they buy)
```bash
node agent/mark-client.js --lead-id 42 --plan "Growth" --mrr 299
```

## Pipeline Stages

```
found → emailed_d0 → emailed_d3 → emailed_d7 → called → replied → discovery_booked → client → churned
```

## CRM

All data lives in `agent/pipeline.db` (SQLite). View it with any SQLite viewer or:
```bash
node -e "import('./db.js').then(m => console.table(m.getAllLeads()))"
```

## Setting Up ElevenLabs Outbound Calling

See `elevenlabs-outbound-agent.md` for the full agent prompt and setup instructions.

You need:
1. ElevenLabs account with Conversational AI access
2. A phone number purchased in the ElevenLabs dashboard (~$5/month)
3. The outbound agent created with the prompt from `elevenlabs-outbound-agent.md`
