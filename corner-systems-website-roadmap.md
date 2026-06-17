# Corner Systems Website Roadmap & Conversion Checklist

Last updated: 2026-06-19

## Goal

Improve website clarity, trust, and conversion so more gym, clinic, and med spa owners call the live AI receptionist demo or book a strategy/demo call.

The strategy is to sell recovered bookings, reduced front-desk overload, faster lead response, and 24/7 call coverage. Avoid leading with vague AI automation language.

## Roadmap Maintenance

- Keep this file current when website work starts or finishes.
- Before making changes, check this roadmap for related open items.
- After making changes, mark completed items with `[x]`, add brief implementation notes where useful, and add newly discovered work under the right section.
- Do not mark an item complete unless the implementation has been verified.

## Primary Conversion Goals

- [ ] Call a live AI demo.
- [ ] Book a 15-minute strategy/demo call.

Secondary actions:

- [x] Use a missed revenue calculator. — `MissedRevenueCalculator` added to homepage (after the "how it works" journey) and `/pricing` (above the plan cards), 2026-06-14.
- [ ] View vertical-specific use cases.
- [ ] Read implementation process.
- [ ] Review FAQs.
- [ ] See proof, screenshots, sample call logs, or transcripts.

## Priority 1: Hero And Above-The-Fold Conversion

- [ ] Rewrite hero around missed bookings/revenue.
- [ ] Use or adapt headline: "Never miss another booking because your front desk was busy."
- [ ] Use or adapt subheadline: "Corner Systems answers calls, captures leads, books appointments, and follows up automatically for gyms, clinics, and med spas, even after hours."
- [ ] Add primary CTA: "Call the Live Demo."
- [ ] Add secondary CTA: "Calculate Missed Revenue."
- [ ] Add visible demo phone number in the hero section.
- [ ] Add short demo instruction text: "Ask about pricing, booking, rescheduling, hours, or services."
- [ ] Add demo disclaimer if needed: "Demo AI receptionist. No real appointment will be booked."
- [ ] Ensure mobile click-to-call works.
- [ ] Track clicks/taps on the demo phone number.
- [ ] Track demo calls as conversion events when call tracking exists.

## Priority 2: Missed Revenue Calculator

Build a mobile-friendly ROI calculator tied to missed calls, bookings, and admin workload.

Status: implemented as `MissedRevenueCalculator` in `src/App.jsx`, styled in `src/styles.css` (`.calculator-*`, `.calc-*`), rendered on `/` and `/pricing` (2026-06-14).

Inputs:

- [x] Average missed calls per week. — combined "missed calls, DMs & messages / week" input.
- [x] Average customer or booking value.
- [x] Estimated booking/conversion rate.
- [x] Average admin hours spent on calls per week.
- [x] Average hourly staff cost. — defaults to $24/hr, annotated against a $50k/yr full-time hire.

Outputs:

- [x] Estimated lost revenue per month and per year. (Weekly omitted — month/year covers the "how much am I losing" framing without crowding the layout; revisit if requested.)
- [x] Estimated admin hours saved per month.
- [x] Estimated staff cost savings per month.
- [x] Estimated bookings needed to break even (against the AI Receptionist plan price).
- [x] CTA below calculator: "See how we'd recover this" → `/contact`.
- [x] Full-time front-desk cost comparison ($50k/yr ≈ monthly cost vs. the AI Receptionist plan, 24/7 coverage).
- [x] Disclaimer line ("Estimates only... actual results depend on your business") to stay consistent with the Terms liability language.

Formula references (implemented in `MissedRevenueCalculator`):

```txt
monthly_lost_revenue = missed_per_week * 4.33 * average_value * (conversion_rate / 100)
monthly_admin_hours = admin_hours_per_week * 4.33
monthly_staff_cost = monthly_admin_hours * hourly_staff_cost
bookings_to_break_even = ceil(receptionist_plan_monthly / average_value)
```

Follow-up ideas (not yet built):

- [ ] Per-vertical default values (gym vs. clinic vs. med spa) once `/gyms`, `/clinics`, `/med-spas` exist.
- [ ] Analytics events `start_roi_calculator` / `complete_roi_calculator` once site analytics beyond Vercel's built-in page views are added.

## Priority 3: Homepage Structure

Recommended homepage order:

- [x] Hero: clear outcome-focused headline. — Rewrote to "Never miss another booking [because your front desk was busy / because it was after hours / …]" with missed-booking typing animation; subheadline updated to roadmap copy; secondary CTA now scrolls to the revenue calculator (2026-06-16).
- [ ] Live demo: call the AI now.
- [ ] Problem section: missed calls, slow replies, after-hours leads, overwhelmed staff.
- [ ] How it works: answer, qualify, book, follow up, escalate, log.
- [x] ROI calculator: estimate missed revenue and admin hours. — placed right after the "how it works" journey section; wrapped with `id="calculator"` so hero secondary CTA scrolls to it (2026-06-16).
- [x] Vertical cards: gyms, clinics, med spas. — replaced the old 12-tile "Social grid" with a 3-card "Three industries. One always-on front desk." section (`.environments-grid`/`.environment-card`), one large image per vertical (gym/clinic/med spa) with icon badge, blurb, and real business-type tags from `marketGroups`, 2026-06-14.
- [ ] Proof: screenshots, sample transcripts, call summaries, testimonials.
- [x] Follow-up: `/industries`' old 8-tile `.social-grid` wall and `/services`' old `.proof-section`/`.benefit-grid` (both predating the 2026-06-14 homepage redesign) have been replaced — `/industries` now has an interactive "What changes for your business." industry-tabs section (`.industry-tabs`/`.industry-panel`/`.industry-outcomes`, one before/after + 3-outcome panel per vertical, switchable), and `/services` now has a "Your front office, mapped." system-flow diagram (`.system-map`/`.system-hub`/`.system-chip`, channels in → AI hub → outcomes), 2026-06-14.
- [x] Implementation process: live in 7-14 days. — 7-step `.impl-section` added to homepage between Integrations and Early Results, with numbered cards (business intake → call script → FAQ training → booking integration → SMS follow-up → QA → launch), CTA + "7–14 days" note (2026-06-16).
- [x] Integrations: phone, calendar, CRM, booking tools. — see "Supported Integrations Section" below, 2026-06-14.
- [x] FAQ: objections and concerns. — 14-question FAQ section added to homepage (before pricing teaser) using `.faq-section-home` / `.faq-list-home` two-column grid layout; covers replacement concern, phone number, escalation, booking, SMS, after-hours, transcripts, integrations, setup time, pricing, customisation, clinic safety, medical advice, and manual override (2026-06-16).
- [ ] Final CTA: call demo or book consultation.

## Priority 4: Vertical-Specific Pages

Create target vertical landing pages:

- [ ] `/gyms`
- [ ] `/clinics`
- [ ] `/med-spas`

Each vertical page should include:

- [ ] Industry-specific headline.
- [ ] Common missed-call scenarios.
- [ ] Example AI receptionist script.
- [ ] ROI example.
- [ ] Relevant integrations.
- [ ] FAQ section.
- [ ] Live demo CTA.
- [ ] Book a call CTA.

### Gyms

- [ ] Use or adapt headline: "Turn missed calls into trial classes and membership bookings."
- [ ] Cover missed calls during classes, busy front desk, pricing/membership/trial questions, slow form follow-up, and after-hours inquiries.
- [ ] Include use cases: book trial class, answer membership questions, capture lead info, send SMS follow-up, escalate cancellation or billing issues.
- [ ] Add CTA: "See how many membership leads you are missing."

### Clinics

- [ ] Use or adapt headline: "Reduce front-desk interruptions while keeping patient calls answered."
- [ ] Cover high call volume, booking/rescheduling, repetitive questions, staff interruption, missed voicemails, and slow callbacks.
- [ ] Include use cases: appointment requests, rescheduling, basic FAQs, structured messages, urgent routing, appointment reminders.
- [ ] Include disclaimer: "Corner Systems does not provide medical advice. The AI receptionist handles scheduling, intake, FAQs, and routing."
- [ ] Avoid implying the AI gives medical advice.

### Med Spas

- [ ] Use or adapt headline: "Capture high-value consultations while your team is in treatment rooms."
- [ ] Cover missed Botox/filler/laser inquiries, treatment-room availability constraints, repetitive pricing/service questions, after-hours requests, and poor follow-up.
- [ ] Include use cases: consultation lead capture, service questions, consultation booking requests, SMS follow-up, staff routing, service/budget/availability collection.
- [ ] Add CTA: "Recover missed consultation revenue."

## Copy Blocks To Add Or Adapt

Problem section:

```md
Your front desk is not the problem. Your phone system is.

When your team is helping customers, running treatments, teaching classes, or managing the front desk, calls get missed. Those missed calls turn into lost bookings, lost consultations, and lost revenue.

Corner Systems gives your business an AI receptionist that answers instantly, captures the lead, books the appointment, follows up by SMS, and escalates to your team when needed.
```

How it works:

```md
How Corner Systems Works

1. A customer calls your business.
2. The AI receptionist answers instantly.
3. It asks the right questions based on your business.
4. It books the appointment or captures the lead.
5. It sends a follow-up by SMS or email.
6. It escalates to your team when human help is needed.
7. Every call is logged with a summary and next steps.
```

ROI section:

```md
Missed calls are not just missed calls. They are missed bookings.

If your business misses 10-20 calls per week, even a small percentage of those calls turning into bookings can represent thousands of dollars in lost monthly revenue.

Corner Systems helps recover that revenue by answering every call, even when your staff is busy or your business is closed.
```

Implementation section:

```md
Live in days, not months.

We set up your AI receptionist around your existing business, services, hours, FAQs, booking flow, and escalation rules.

Typical setup includes:

- Business intake
- Call script design
- FAQ and service training
- Booking/calendar integration
- SMS follow-up setup
- Test calls
- Launch and optimization
```

## Proof And Trust

- [x] Add sample call transcript — two versions (fight gym + med spa) drafted in `website/content/sample-call-transcript.md`. Needs to be wired into the website UI as a styled chat-log + dashboard-card component.
- [x] Add sample call summary — included in `website/content/sample-call-transcript.md` alongside each transcript.
- [ ] Add screenshot of dashboard or call log.
- [ ] Add screenshot of SMS follow-up.
- [ ] Add screenshot of booked appointment.
- [ ] Add short demo recording.
- [ ] Add founder/operator note.
- [x] Add customer testimonial when available. — partial: added an anonymized early-client case study (call-answer rate + hours saved) to the homepage "Early Results" section, 2026-06-14. Client asked to stay unnamed since their customers don't know AI handles their phones/messages. Revisit with a named/quoted testimonial once a client agrees.
- [x] Add before/after example. — replaced the old dark-theme "Proof section" with "The Shift" (`.shift-section`), a before/after comparison of 3 concrete front-desk moments (evening DM, lunch-rush calls, weekend inquiry) plus a restyled `proofPoints` badge row, 2026-06-14. `/services`' own `.proof-section` was later replaced too — see "Supported Integrations Section" below.
- [x] Add supported integrations. — see "Supported Integrations Section" below, 2026-06-14.
- [ ] Add security/privacy explanation.
- [ ] Add human handoff explanation.

Example call summary:

```md
Caller: Sarah M.
Intent: Botox consultation
Preferred time: Thursday afternoon
Budget: $400-$600
Status: Consultation requested
Next step: Staff follow-up recommended
SMS sent: Yes
```

## FAQ And Objections

- [x] Will this replace my receptionist? — answered in homepage FAQ (2026-06-16).
- [x] Can it use my existing phone number? — answered in homepage FAQ (2026-06-16).
- [x] What happens when the AI cannot answer? — answered in homepage FAQ (2026-06-16).
- [x] Can it book appointments? — answered in homepage FAQ (2026-06-16).
- [x] Can it send SMS follow-ups? — answered in homepage FAQ (2026-06-16).
- [x] Does it work after hours? — answered in homepage FAQ (2026-06-16).
- [x] Can I review call transcripts? — answered in homepage FAQ (2026-06-16).
- [x] Does it integrate with my calendar or booking software? — answered in homepage FAQ (2026-06-16).
- [x] How long does setup take? — answered in homepage FAQ (2026-06-16).
- [x] What does it cost? — answered in homepage FAQ (2026-06-16).
- [x] Can I customize what the AI says? — answered in homepage FAQ (2026-06-16).
- [x] Is this safe for clinics? — answered in homepage FAQ (2026-06-16).
- [x] Does the AI give medical advice? — answered in homepage FAQ (2026-06-16).
- [x] Can I turn it off or route calls back to staff? — answered in homepage FAQ (2026-06-16).

Suggested answer for replacement concern:

```md
No. Corner Systems is designed to support your team, not replace it. The AI handles repetitive calls, lead capture, appointment requests, and after-hours inquiries so your staff can focus on customers in front of them.
```

Suggested answer for escalation:

```md
The AI follows your escalation rules. It can take a message, send the caller to a human, notify your team, or mark the call for follow-up.
```

## Pricing And ROI Positioning

- [x] Use a staff-cost framing on the homepage and pricing page — calculator compares a $50k/yr full-time front-desk hire (~$4,167/mo) against the AI Receptionist plan, 2026-06-14.
- [x] Use starting price or ranges on the pricing page if approved. — already live ($179+/mo, $199 month-to-month).
- [x] Connect pricing to calculator output so ROI is obvious. — "bookings needed to break even" is computed against the AI Receptionist plan price.
- [ ] Include CTA: "Book a 15-minute call and we'll estimate how many missed bookings Corner Systems could recover for your business." (current calculator CTA is "See how we'd recover this" → `/contact`; consider this exact phrasing as an A/B option.)

## Product And Analytics Requirements

Live demo system:

- [ ] **Create public demo phone number** — Michael and Tom setting this up 2026-06-19 morning. Highest priority unlock for website conversion.
- [ ] Configure demo AI receptionist — ElevenLabs agent trained on gym + med spa demo scripts.
- [ ] Add demo scripts for gym, clinic, and med spa — see `website/content/sample-call-transcript.md` for draft gym and med spa scripts.
- [ ] Ensure demo cannot create real bookings.
- [ ] Log demo call events.
- [ ] Track CTA clicks.

Analytics events:

- [ ] `view_homepage`
- [ ] `click_call_demo`
- [ ] `started_demo_call`
- [ ] `click_book_demo`
- [ ] `submitted_contact_form`
- [ ] `start_roi_calculator`
- [ ] `complete_roi_calculator`
- [ ] `view_vertical_page`
- [ ] `view_pricing`
- [ ] `open_booking_calendar`
- [ ] `complete_booking`

## Repo And Data Hygiene

- [x] Migrate durable outbound sales pipeline responsibility out of `website/agent/` and into `/home/michael/cornersystems/agent-network` by copying reusable scripts to `agent-network/outbound/`.
- [x] Ensure all new lead lists, sales lists, prospect exports, CRM databases, and outbound pipeline data are created/stored in `agent-network`, not `website/`.
- [ ] Keep only website-specific lead capture and integration code in this repo.

## Custom CRM And Agent Endpoints

- [x] Document that Corner Systems should use a custom CRM for the agent network, not HubSpot.
- [x] Add `/crm` as the internal login entry point for the future custom CRM.
- [x] Add a client-side `/crm` login placeholder so there is a clear internal entry point while the real CRM/auth backend is planned.
- [x] Keep `/crm` out of the public navigation for now.
- [x] Document in this repo that the website should implement the `cs_*` CRM/tool contracts from `/home/michael/cornersystems/agent-network/config/tool-schemas.json`.
- [x] Wire `/crm` to real server-side authentication before showing private CRM records (Clerk v5 + `@clerk/backend`, `website/api/_auth.js`).
- [ ] Implement authenticated website API endpoints for the `cs_*` ElevenLabs tools defined in `/home/michael/cornersystems/agent-network/config/tool-schemas.json`.
- [x] Add or connect a custom CRM data store for leads, businesses, contacts, support tickets, callbacks, and follow-up activity (Neon Postgres, `website/api/_db.js` — single system of record shared with `agent-network/outbound/`).
- [x] Decide whether the existing SQLite outbound pipeline database is the first CRM backend or only a temporary pipeline store — resolved: SQLite removed entirely, Neon Postgres is the system of record for both the CRM and the outbound pipeline (2026-06-11).
- [ ] Return explicit `configured: false` responses for CRM/calendar endpoints that are not live yet, so the agent does not claim records or bookings were created.
- [ ] Keep website form handling here, but write reusable lead/contact/pipeline records through the custom CRM layer owned by `agent-network`.
- [x] Add a protected CRM dashboard after login: Dashboard (master metrics + pipeline funnel), Hot Leads, Follow-ups Due, Drafts (AI email review/approve/reject + auto-send toggle), Activity (email open/click/reply feed, per-lead filterable), Pipeline, Compose, Tickets, Callbacks (2026-06-11).
- [x] Add "Next Steps to Escape the Matrix" priority panel to CRM dashboard — shows top open items from both roadmaps with priority/category badges and a "Copy prompt" button per item. Notification icon in topbar opens a dropdown. Managed by Claude via `website/src/data/team-todos.json`. Empty state prompts the team to ask Claude for more items (2026-06-18).
- [x] Redesign Drafts, Inbox, and Outbox CRM tabs as Outlook-style master-detail layout — 280px scrollable list on left, full detail panel on right. Drafts detail has editable subject/body, collapsible "Show original AI draft" toggle, and Save/Approve/Reject actions. Inbox/Outbox show read-only email with "Open lead" button. Auto-send policy controls moved to compact topbar (2026-06-18/19).
- [x] Reorder CRM navigation: Drafts moved between Inbox and Outbox (logical email flow: receive → review → sent) (2026-06-19).
- [x] Pipeline run observability: `pipeline_runs` table, smart-polling dashboard status card (pulsing live indicator when agent is running), full run history with expandable event logs in Audit tab (2026-06-19).
- [ ] Add role-based access for internal users before any private records are exposed (currently any Clerk-authenticated user has full access).
- [x] Add audit logging for CRM record views, edits, exports, and agent-created events. — `logAudit('human:crm', ...)` now fires on every manual leads PATCH, opportunities PATCH, accounts PATCH, and bulk-leads PATCH (diffFields helper computes before/after only for changed keys). AI mutations were already logged. Audit Log tab renamed from "AI Log", shows actor filter (All / Human / AI), colour-coded actor badges, and a per-field before→after diff list instead of raw JSON (2026-06-16).
- [x] Add invite/password reset or chosen sign-in recovery flow — handled by Clerk's hosted `<SignIn>` component.
- [x] Add a clear logout/session-expiry flow — handled by Clerk's `<UserButton>` and session management.

Current implementation notes:

- `/crm` is a Clerk-authenticated route (`<SignedIn>`/`<SignedOut>` + `<SignIn routing="hash">`); unauthenticated users see the Clerk sign-in UI.
- A missing `VITE_CLERK_PUBLISHABLE_KEY` no longer blanks the whole site: `main.jsx` skips `ClerkProvider` and `/crm` shows a "not configured" notice instead (2026-06-11). Local dev needs `website/.env.local` with the key for CRM sign-in to work.
- The CRM dashboard reads/writes Neon Postgres directly via `/api/crm/*` endpoints (leads, touches, tickets, callbacks, settings, dashboard, hot-leads, followups, drafts, activity).
- AI-drafted outreach emails from the outbound pipeline land in the Drafts tab as `pending_review` and are sent via Resend on approval (or auto-sent if `auto_send_emails` is enabled globally or per-lead).
- Email opens/clicks/bounces are tracked via a Resend webhook (`/api/email/events`) — registering the webhook URL + secret in Resend/Vercel is still a manual step (see `agent-network/agent-network-roadmap.md` Phase 4).
- Inbound email is processed by shared logic in `api/_inbound.js` (lead match/create + body fetch via `GET /emails/receiving/{id}`), reached from both `/api/email/events` (the registered Resend webhook, which already listens for `email.received`) and the standalone `/api/email/inbound` endpoint. Svix signature verification lives in `api/_webhook.js` (2026-06-12). `RESEND_WEBHOOK_SECRET` and `RESEND_API_KEY` must be set in Vercel; DNS MX (`inbound-smtp.us-east-1.amazonaws.com`) is already correct for Resend receiving.
- The current approach keeps Corner Systems separate from Automate4U accounts, HubSpot setup, and ElevenLabs agents.

CRM autonomy build-out (2026-06-12):

- Booking: `appointments` table + Cal.com adapter (`api/_calcom.js`); `cs` tools `discovery-availability` and `book-discovery` are live when `CALCOM_API_KEY` + `CALCOM_EVENT_TYPE_ID` are set in Vercel (otherwise they still return `configured: false`). Booked calls land in the CRM Appointments tab; T-24h reminders go out via the hourly cron.
- Dedup: emails normalized + unique index on `lower(email)` (one-time merge migration in `initSchema`); `upsertLead` is race-safe (23505 retry-as-update); all lead-creation paths (contact form, inbound email, ElevenLabs) funnel through it. `merge-leads` tool handles residual dupes.
- Inbound AI triage (`api/_classify.js`, Claude via `ANTHROPIC_API_KEY`, model override `CLAUDE_CLASSIFY_MODEL`): every received email is classified (interested/question/not_now/unsubscribe/other); stage/tier adjusted; reply drafts flow into the existing Drafts pending_review queue or auto-send per policy.
- AI write-API: `advance-stage`, `schedule-followup`, `merge-leads` tools (API-key auth) with mandatory reasons; every AI mutation is recorded in `audit_log` and visible in the CRM "AI Log" tab.
- Graduated auto-send policy (`ai_send_policy` setting, editable in the Drafts tab): per action type (reply_interested / reply_question / followup_due) review-vs-auto, pricing mentions always reviewed, per-lead `auto_send_emails` override wins.
- Hourly Vercel cron `/api/cron/followups` (protect with `CRON_SECRET`): drafts/sends due follow-ups (`leads.next_followup_at`) and appointment reminders.
- The Google Sheets "Sent?" approval loop in `agent/` is superseded by the Drafts tab + policy flow; `sync-to-sheets` can remain as a read-only export, but approvals should happen in /crm. Outbound pipeline scripts in `agent-network` should write drafts as `pending_review` touches instead of waiting on Sheets marks.

Enterprise CRM foundation (2026-06-15):

- [x] Add opportunity fields to the CRM data model: deal value, forecast category, close probability, expected close date, assigned owner, cadence, next action, tags, firmographics, AI summary, recommended next step, and lost reason.
- [x] Add stage history tracking for CRM stage changes and require a loss reason before marking a deal lost from the CRM update endpoint.
- [x] Add CRM endpoints for Kanban pipeline (`/api/crm/kanban`), Salesforce-style forecast analytics (`/api/crm/forecast`), next-action tasks (`/api/crm/tasks`), and global search (`/api/crm/search`).
- [x] Add CRM UI tabs for Global Search, Forecast, Pipeline Board with drag-and-drop stage movement, and Tasks split into overdue/today/upcoming.
- [x] Expand contact profiles with editable sales fields, cadence/next-action fields, tags/firmographics, and AI sales assistant notes.
- [x] Add account architecture foundation: `accounts`, account-linked leads, account rollup API, and Accounts CRM tab showing contacts, pipeline value, health, owner, industry, and last activity.
- [x] Add native cadence architecture foundation: `cadences` table, default 30-day outbound sequence seed, cadence API, and Cadences CRM tab.
- [x] Add standalone CRM task architecture foundation: `crm_tasks` table and task API merged with lead next-actions.
- [x] Add pipeline health monitoring API and Pipeline Health tab for missing next actions, missing deal values, stale opportunities, and health score.
- [x] Add saved-view storage foundation (`saved_views` table and API) for future saved searches/views.
- [x] Add account profile view with contacts/opportunities rollup, master account timeline, and stage-change history.
- [x] Add reusable saved views UI for search filters.
- [x] Add Contacts-table bulk selection with bulk stage/owner updates.
- [x] Add CRM-scoped dark mode toggle with persisted preference.
- [x] Expand activity feed to merge email touches, stage changes, and CRM task history for richer contact/account timelines.
- [x] Add true multiple opportunities per account beyond lead-as-opportunity records: `opportunities` and `opportunity_stage_history` tables, `/api/crm/opportunities`, Opportunities CRM tab, opportunity-aware account rollups, account profile opportunities, and opportunity next-actions in Tasks.
- [x] Add editable account fields and account-level notes from the account profile.
- [x] Add custom cadence builder UI, cadence enrollment/step completion tracking, and step completion analytics.
- [x] Add record-level enrollment actions from contact/opportunity profiles so reps can enroll a specific lead or opportunity without using the API directly. Contact profile and drawer show active enrollments (pause/resume/complete step/remove) and a cadence picker to enroll. Opportunities tab has a per-row Cadence column with an inline picker for unenrolled rows and status+controls for active enrollments. API GET cadence-enrollments now accepts lead_id/opportunity_id query params (2026-06-16).
- Env vars now referenced: `CALCOM_API_KEY`, `CALCOM_EVENT_TYPE_ID`, `ANTHROPIC_API_KEY`, `CLAUDE_CLASSIFY_MODEL` (optional), `CRON_SECRET` (recommended), plus existing `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, Clerk keys.

Open questions before further CRM work:

- Should role-based access be added before giving the business partner direct CRM login access, or is shared full access acceptable for now?
- Which `cs_*` tool endpoints (from `agent-network/config/tool-schemas.json`) should be implemented next for the ElevenLabs agent network?

## Client Onboarding

- [x] Author enterprise-grade onboarding form specs (one per vertical: fitness & studios, clinics & recovery, aesthetics & dental) with package-based conditional logic and CRM mapping — see `marketing/onboarding-forms/` (2026-06-12).
- [ ] Build the forms in a form tool (or as a `/onboarding` route) from the specs, with section-level save and `PACKAGE` pre-filled from checkout.
- [ ] Add `/api/crm/onboarding` webhook endpoint to receive form submissions into Neon (mapping defined in `marketing/onboarding-forms/00-OVERVIEW.md`).
- [ ] Confirm actual package contents for Starter/Growth/AI Receptionist against the assumptions in `00-OVERVIEW.md` and adjust branching rules if they differ.

## Supported Integrations Section

Status: implemented as a shared `IntegrationsSection` component (`src/App.jsx`), rendered on `/` (between "Three industries" and "Early results") and on `/services` (between the new system-map section and the closing CTA), 2026-06-14.

- Four categories (`integrationGroups`), 6 tools each, rendered as icon tiles (`ToolTile`/`.tool-tile`):
  - **Booking & Scheduling**: Mindbody, GloFox, Zen Planner, Jane App, Cliniko, Google Calendar.
  - **CRM & Pipeline**: HubSpot, GoHighLevel, Salesforce, Airtable, Google Sheets, Notion.
  - **Inbox & Messaging**: Gmail, Outlook, Twilio, WhatsApp, Instagram, Facebook.
  - **Marketing & Payments**: Stripe, Square, QuickBooks, Mailchimp, Yelp, Google Business Profile.
- Tools with a real Simple Icons logo (`react-icons/si`, via `toolIcons` map) render that logo; the rest (Mindbody, GloFox, Zen Planner, Jane App, Cliniko, GoHighLevel, Outlook, Google Business Profile) render a monogram tile (`toolInitials`) so nothing looks broken or missing.
- Closing `.integration-callout` banner: "Don't see your tool? ... if it's used by gyms, clinics, or med spas ... and it has an API, webhook, or Zapier / Make / n8n connection, we can very likely build around it" — covers Calendly, Fresha, Square Appointments, Zapier, Slack, custom Corner Systems CRM, and any other tool not explicitly tiled, without claiming a specific unsupported integration is live.

Framing/wording reminder: do not claim a specific tool integration is "live" beyond what's actually wired up in `agent-network`'s tool schemas — the tiles + callout intentionally frame this as "what we connect with" rather than a list of completed client integrations.

## SEO Improvements

Primary keyword targets:

- [ ] AI receptionist for gyms.
- [ ] AI receptionist for med spas.
- [ ] AI receptionist for clinics.
- [ ] AI phone answering service for small business.
- [ ] AI appointment booking assistant.
- [ ] AI lead capture receptionist.
- [ ] Missed call automation.
- [ ] After-hours call answering AI.

Content ideas:

- [ ] "How much revenue do missed calls cost a med spa?"
- [ ] "AI receptionist for gyms: how to capture more trial class leads."
- [ ] "AI receptionist vs virtual receptionist."
- [ ] "How clinics can reduce front-desk call volume."
- [ ] "Best AI phone answering system for service businesses."

## Design And UX Checklist

- [ ] Primary CTA visible above fold.
- [ ] Demo phone number visible above fold.
- [ ] Mobile click-to-call works.
- [ ] Calculator works on mobile.
- [ ] FAQ is easy to scan.
- [ ] Page does not rely on vague AI buzzwords.
- [ ] Visitor can understand offer in under 5 seconds.
- [ ] Visitor can test product without booking a call.
- [ ] Visitor can see how the system works before contacting sales.
- [ ] Mobile layout has no horizontal scroll, clipped text, or overlapping UI.

## Definition Of Done

- [ ] A first-time visitor understands the offer within 5 seconds.
- [ ] The homepage clearly explains the business pain.
- [ ] The visitor can test a live AI demo immediately.
- [x] The site shows potential money/time savings. — `MissedRevenueCalculator` on `/` and `/pricing` (2026-06-14).
- [ ] Each target vertical feels specifically addressed.
- [ ] The site explains how implementation works.
- [ ] The site reduces trust concerns and objections.
- [ ] All primary CTAs are tracked.
- [ ] The website is optimized for mobile.
- [ ] The site drives more demo calls and booked consultations.
