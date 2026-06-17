# Sample Call Transcript & Summary

Ready to add to the website proof section. Two versions below — a fight gym call (primary vertical) and a med spa call (secondary). Use whichever fits best in context, or both.

---

## Version 1: Fight Gym (Primary Vertical)

**Scenario:** 8:47pm on a Tuesday. Owner is running an evening MMA class. Phone rings.

---

**AI Receptionist:** Thanks for calling Apex MMA. I'm the front desk assistant here — happy to help. What can I do for you?

**Caller:** Hey yeah, I wanted to ask about your trial classes. I've been looking to try BJJ, not sure where to start.

**AI Receptionist:** Perfect timing — a lot of people start exactly where you are. We offer a free trial class for new members, no experience needed. Can I ask, are you looking more at mornings, evenings, or weekends?

**Caller:** Evenings work best, like after 6.

**AI Receptionist:** We've got beginner BJJ on Tuesdays and Thursdays at 6:30, and a no-gi class on Fridays at 7. Any of those sound good?

**Caller:** Thursday works.

**AI Receptionist:** Great. Let me grab your name and a number to confirm the booking — what's your name?

**Caller:** Marcus.

**AI Receptionist:** Marcus, perfect. And a good number to reach you?

**Caller:** 647-555-0182.

**AI Receptionist:** Got it. I'll put you down for Thursday at 6:30 and send a confirmation text. The address is 280 King Street East — just show up in comfortable clothes, we've got everything else. Any questions before then?

**Caller:** No, that's great. Thanks.

**AI Receptionist:** You're all set. See you Thursday, Marcus.

---

### Call Summary (what appears in the CRM dashboard)

```
Caller:         Marcus [last name not provided]
Phone:          647-555-0182
Intent:         Trial class booking — BJJ beginner
Booked:         Thursday 6:30pm beginner BJJ class
Source:         Inbound call (after hours — 8:47pm)
Status:         Trial booked
Next step:      Confirmation SMS sent. Follow up Friday to convert to membership.
SMS sent:       Yes
```

---

## Version 2: Med Spa (Secondary Vertical)

**Scenario:** 6:12pm on a Friday. Staff have left for the weekend. Phone rings.

---

**AI Receptionist:** Thank you for calling Lumière Med Spa. I'm the front desk assistant — how can I help you today?

**Caller:** Hi, I wanted to ask about Botox. Like, how much does it usually cost and how does it work if I've never done it before?

**AI Receptionist:** Great question. For first-time clients, we always start with a complimentary consultation — that's where one of our nurses walks you through everything, looks at what you're hoping to achieve, and gives you an accurate quote based on the units you'd actually need. Most first appointments for the forehead and crow's feet area run between $400 and $650.

**Caller:** Okay, that's what I was thinking. Can I book that consultation?

**AI Receptionist:** Absolutely. Are you more flexible on weekday mornings, afternoons, or do you prefer weekends?

**Caller:** Weekday afternoons if possible.

**AI Receptionist:** We have Tuesday and Wednesday afternoons available next week. Does either work?

**Caller:** Wednesday works.

**AI Receptionist:** Perfect. What's your name and best contact number so we can confirm?

**Caller:** Sarah Mehta. 416-555-0294.

**AI Receptionist:** Sarah, I'll get that noted for Wednesday afternoon and have someone from our team reach out Monday morning to confirm the exact time. Is there anything else you'd like to know before your visit?

**Caller:** No, I think that covers it.

**AI Receptionist:** Wonderful. We'll be in touch Monday, Sarah. Have a great weekend.

---

### Call Summary (what appears in the CRM dashboard)

```
Caller:         Sarah Mehta
Phone:          416-555-0294
Intent:         Botox consultation request — first-time client
Budget signal:  $400-650 range mentioned, no objection
Preferred time: Wednesday afternoon
Source:         Inbound call (after hours — 6:12pm Friday)
Status:         Consultation requested — follow-up required
Next step:      Staff to call Monday AM to confirm appointment time.
SMS sent:       No (caller did not provide preference)
```

---

## Implementation Notes (for when this goes on the website)

- Place in the **Proof & Trust** section, after "The Shift" before-and-after block
- Show the transcript in a styled "chat log" or phone-screen UI component
- Show the call summary in a styled "dashboard card" component to demonstrate the CRM logging
- Consider a tab switcher: "Gym" / "Med Spa" / "Clinic" so each vertical sees themselves
- Both summaries demonstrate the key value: captured at hours when no staff member would have answered
- The timestamps (8:47pm Tuesday, 6:12pm Friday) are intentional — that's the money shot
