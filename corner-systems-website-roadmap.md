# Corner Systems Website Roadmap & Conversion Checklist

Last updated: 2026-06-10

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

- [ ] Use a missed revenue calculator.
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

Inputs:

- [ ] Average missed calls per week.
- [ ] Average customer or booking value.
- [ ] Estimated booking/conversion rate.
- [ ] Average admin hours spent on calls per week.
- [ ] Average hourly staff cost.

Outputs:

- [ ] Estimated lost revenue per week.
- [ ] Estimated lost revenue per month.
- [ ] Estimated lost revenue per year.
- [ ] Estimated admin hours saved per month.
- [ ] Estimated staff cost savings per month.
- [ ] Estimated bookings needed to break even.
- [ ] CTA below calculator: "See how Corner Systems would recover these bookings."

Formula references:

```txt
monthly_lost_revenue = missed_calls_per_week * 4.33 * average_booking_value * conversion_rate
monthly_admin_cost = admin_hours_per_week * 4.33 * hourly_staff_cost
bookings_needed_to_break_even = monthly_price / average_booking_value
```

## Priority 3: Homepage Structure

Recommended homepage order:

- [ ] Hero: clear outcome-focused headline.
- [ ] Live demo: call the AI now.
- [ ] Problem section: missed calls, slow replies, after-hours leads, overwhelmed staff.
- [ ] How it works: answer, qualify, book, follow up, escalate, log.
- [ ] ROI calculator: estimate missed revenue and admin hours.
- [ ] Vertical cards: gyms, clinics, med spas.
- [ ] Proof: screenshots, sample transcripts, call summaries, testimonials.
- [ ] Implementation process: live in 7-14 days.
- [ ] Integrations: phone, calendar, CRM, booking tools.
- [ ] FAQ: objections and concerns.
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

- [ ] Add sample call transcript.
- [ ] Add sample call summary.
- [ ] Add screenshot of dashboard or call log.
- [ ] Add screenshot of SMS follow-up.
- [ ] Add screenshot of booked appointment.
- [ ] Add short demo recording.
- [ ] Add founder/operator note.
- [ ] Add customer testimonial when available.
- [ ] Add before/after example.
- [ ] Add supported integrations.
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

- [ ] Will this replace my receptionist?
- [ ] Can it use my existing phone number?
- [ ] What happens when the AI cannot answer?
- [ ] Can it book appointments?
- [ ] Can it send SMS follow-ups?
- [ ] Does it work after hours?
- [ ] Can I review call transcripts?
- [ ] Does it integrate with my calendar or booking software?
- [ ] How long does setup take?
- [ ] What does it cost?
- [ ] Can I customize what the AI says?
- [ ] Is this safe for clinics?
- [ ] Does the AI give medical advice?
- [ ] Can I turn it off or route calls back to staff?

Suggested answer for replacement concern:

```md
No. Corner Systems is designed to support your team, not replace it. The AI handles repetitive calls, lead capture, appointment requests, and after-hours inquiries so your staff can focus on customers in front of them.
```

Suggested answer for escalation:

```md
The AI follows your escalation rules. It can take a message, send the caller to a human, notify your team, or mark the call for follow-up.
```

## Pricing And ROI Positioning

- [ ] Use "Less than the cost of a part-time receptionist" on the homepage.
- [ ] Use starting price or ranges on the pricing page if approved.
- [ ] Connect pricing to calculator output so ROI is obvious.
- [ ] Include CTA: "Book a 15-minute call and we'll estimate how many missed bookings Corner Systems could recover for your business."

## Product And Analytics Requirements

Live demo system:

- [ ] Create public demo phone number.
- [ ] Configure demo AI receptionist.
- [ ] Add demo scripts for gym, clinic, and med spa.
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
- [ ] Add role-based access for internal users before any private records are exposed (currently any Clerk-authenticated user has full access).
- [ ] Add audit logging for CRM record views, edits, exports, and agent-created events.
- [x] Add invite/password reset or chosen sign-in recovery flow — handled by Clerk's hosted `<SignIn>` component.
- [x] Add a clear logout/session-expiry flow — handled by Clerk's `<UserButton>` and session management.

Current implementation notes:

- `/crm` is a Clerk-authenticated route (`<SignedIn>`/`<SignedOut>` + `<SignIn routing="hash">`); unauthenticated users see the Clerk sign-in UI.
- A missing `VITE_CLERK_PUBLISHABLE_KEY` no longer blanks the whole site: `main.jsx` skips `ClerkProvider` and `/crm` shows a "not configured" notice instead (2026-06-11). Local dev needs `website/.env.local` with the key for CRM sign-in to work.
- The CRM dashboard reads/writes Neon Postgres directly via `/api/crm/*` endpoints (leads, touches, tickets, callbacks, settings, dashboard, hot-leads, followups, drafts, activity).
- AI-drafted outreach emails from the outbound pipeline land in the Drafts tab as `pending_review` and are sent via Resend on approval (or auto-sent if `auto_send_emails` is enabled globally or per-lead).
- Email opens/clicks/bounces are tracked via a Resend webhook (`/api/email/events`) — registering the webhook URL + secret in Resend/Vercel is still a manual step (see `agent-network/agent-network-roadmap.md` Phase 4).
- The current approach keeps Corner Systems separate from Automate4U accounts, HubSpot setup, and ElevenLabs agents.

Open questions before further CRM work:

- Should role-based access be added before giving the business partner direct CRM login access, or is shared full access acceptable for now?
- Which `cs_*` tool endpoints (from `agent-network/config/tool-schemas.json`) should be implemented next for the ElevenLabs agent network?

## Integrations To Show Only If Supported Or Planned

- [ ] Google Calendar
- [ ] Calendly
- [ ] Custom Corner Systems CRM
- [ ] Twilio
- [ ] Mindbody
- [ ] Jane App
- [ ] Fresha
- [ ] Square Appointments
- [ ] Zapier
- [ ] GoHighLevel
- [ ] Slack
- [ ] Email notifications
- [ ] SMS notifications

Do not show integration logos as live capabilities unless they are actually supported. If planned but not live, label carefully.

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
- [ ] The site shows potential money/time savings.
- [ ] Each target vertical feels specifically addressed.
- [ ] The site explains how implementation works.
- [ ] The site reduces trust concerns and objections.
- [ ] All primary CTAs are tracked.
- [ ] The website is optimized for mobile.
- [ ] The site drives more demo calls and booked consultations.
