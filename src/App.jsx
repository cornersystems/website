import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  HeartPulse,
  Mail,
  Menu,
  MessageSquareText,
  PhoneCall,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

const contactEmail = "cornersystemsai@gmail.com";

// ── Navigation ────────────────────────────────────────────────────────────────
const navItems = [
  { label: "Services",    href: "/services" },
  { label: "Industries",  href: "/industries" },
  { label: "Pricing",     href: "/pricing" },
  { label: "Team",        href: "/team" },
  { label: "Contact",     href: "/contact" },
];

// ── Page SEO metadata ─────────────────────────────────────────────────────────
const PAGE_META = {
  "/": {
    title: "AI Receptionist & Lead Capture for Gyms, Clinics & Med Spas | Corner Systems",
    description:
      "Corner Systems builds AI receptionists, lead capture, missed-call recovery, booking, and follow-up systems for gyms, clinics, and med spas. Answer every call, text, email, and DM 24/7.",
    canonical: "https://cornersystems.vercel.app/",
  },
  "/services": {
    title: "AI Front Office Services for Gyms, Clinics & Med Spas | Corner Systems",
    description:
      "Full-stack AI front office: chatbot intake, voice reception, missed-call recovery, CRM handoff, and automated follow-up — built around your tools and workflow.",
    canonical: "https://cornersystems.vercel.app/services",
  },
  "/industries": {
    title: "Industries We Serve — Gyms, Clinics, Med Spas & Dental | Corner Systems",
    description:
      "Corner Systems serves boutique gyms, CrossFit boxes, chiropractic clinics, physiotherapy, med spas, cosmetic dentistry, and more across Toronto and Canada.",
    canonical: "https://cornersystems.vercel.app/industries",
  },
  "/team": {
    title: "Our Team — Founders Tom Morris & Michael Mastrella | Corner Systems",
    description:
      "Meet the founders behind Corner Systems — Tom Morris (Co-Founder & CEO) and Michael Mastrella (Co-Founder & CTO).",
    canonical: "https://cornersystems.vercel.app/team",
  },
  "/contact": {
    title: "Book a Discovery Call | Corner Systems",
    description:
      "Book a free 20-minute discovery call with Corner Systems. We'll map your current intake flow and show you exactly where the gaps are.",
    canonical: "https://cornersystems.vercel.app/contact",
  },
  "/pricing": {
    title: "AI Receptionist Pricing for Gyms, Clinics & Med Spas | Corner Systems",
    description:
      "Compare Corner Systems AI receptionist, lead capture, missed-call recovery, booking, and CRM automation packages for gyms, clinics, and med spas.",
    canonical: "https://cornersystems.vercel.app/pricing",
  },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const services = [
  {
    icon: Bot,
    title: "Front Office Coverage",
    text: "Professional intake across calls, texts, email, site forms, messages, and DMs.",
  },
  {
    icon: Calendar,
    title: "Booking + Pipeline",
    text: "Clear next steps from first interest to consultation, trial, appointment, or sales conversation.",
  },
  {
    icon: Mail,
    title: "Follow-Up Engine",
    text: "Structured follow-up so interested prospects keep moving instead of fading out.",
  },
  {
    icon: BarChart3,
    title: "Visibility",
    text: "Pipeline views, alerts, and reporting so owners can see what is working.",
  },
];

const marketGroups = [
  {
    icon: Dumbbell,
    title: "Fitness & Studios",
    text: "Gyms, studios, and membership businesses that live on trials, consultations, and fast response.",
    items: ["Membership gyms", "Boutique studios", "Martial arts academies", "Strength & conditioning", "Personal training studios", "Wellness studios"],
  },
  {
    icon: HeartPulse,
    title: "Clinics & Recovery",
    text: "Practices where a missed new-patient inquiry is real revenue walking away.",
    items: ["Chiropractic clinics", "Physiotherapy", "Sports medicine", "Recovery & rehab clinics", "Massage & wellness", "Osteopathy"],
  },
  {
    icon: Sparkles,
    title: "Aesthetics & Dental",
    text: "High-ticket bookings where every lead is worth protecting around the clock.",
    items: ["Med spas", "Cosmetic & laser clinics", "Cosmetic dentistry", "Dental practices", "Skin & injectables", "Aesthetic medicine"],
  },
];

const channels = [
  { icon: PhoneCall,          title: "Calls",        text: "Answered with the right questions and the right tone." },
  { icon: MessageSquareText,  title: "Texts + DMs",  text: "Fast, consistent replies where prospects already are." },
  { icon: Mail,               title: "Email",        text: "Clean intake and follow-up without inbox drift." },
  { icon: Calendar,           title: "Booking",      text: "Interest moves toward a real next step." },
];

const integrationGroups = [
  {
    title: "Booking",
    text: "Move qualified inquiries toward a real appointment, trial, class, or consult.",
    tools: ["Mindbody", "GloFox", "Zen Planner", "Jane App", "Cliniko", "Google Calendar"],
  },
  {
    title: "CRM + Pipeline",
    text: "Route clean lead data into the system your team already checks.",
    tools: ["HubSpot", "GoHighLevel", "Pipedrive", "Airtable", "Google Sheets", "Notion"],
  },
  {
    title: "Inbox + Messaging",
    text: "Keep calls, forms, emails, texts, and DMs from becoming loose ends.",
    tools: ["Gmail", "Outlook", "Twilio", "Instagram", "Facebook", "Website Forms"],
  },
];

const benefits = [
  "Channels covered",
  "Leads qualified",
  "Next steps tracked",
  "Follow-up handled",
];

const proofPoints = [
  { title: "Operator-ready", text: "Built for busy days, not perfect conditions." },
  { title: "Discreet",       text: "Private client details stay private." },
  { title: "Hands-on",       text: "Mapped, built, tested, and refined with you." },
];

const process = [
  { step: "01", title: "Review", text: "Where do leads come from, who handles them, and what slips?" },
  { step: "02", title: "Map",    text: "Define intake, routing, booking, follow-up, alerts, and ownership." },
  { step: "03", title: "Build",  text: "Set up the front office flow and test realistic customer scenarios." },
  { step: "04", title: "Improve",text: "Tighten weak points as the business learns what converts." },
];

const snapshots = [
  { value: "24/7",  label: "coverage" },
  { value: "All",   label: "channels" },
  { value: "Zero",  label: "leads dropped" },
];

const deliverables = [
  "Call, text, email, and DM intake",
  "Professional phone coverage",
  "Booking request flow",
  "CRM pipeline structure",
  "Staff alerts and task handoff",
  "Follow-up sequences",
  "Lead source tracking",
  "Reporting view",
];

const pricingAudiences = [
  { id: "fitness",  label: "Fitness & Studios" },
  { id: "clinical", label: "Clinics & Aesthetics" },
];

const pricingByAudience = {
  fitness: {
    plans: [
      {
        id: "starter", name: "Starter", monthly: "$149", setup: "$497",
        note: "For basic lead capture and fast website response.",
        badge: "Essentials", accent: "blue", cta: "Start with Starter",
        highlights: ["AI chatbot", "Lead capture", "FAQ answers", "100 chats included"],
      },
      {
        id: "growth", name: "Growth", monthly: "$299", setup: "$997",
        note: "For operators who want qualification, CRM handoff, and stronger follow-up.",
        badge: "Best value", accent: "teal", cta: "Choose Growth",
        highlights: ["Lead qualification", "CRM integration", "250 chats included", "Lower chat overages"],
      },
      {
        id: "receptionist", name: "AI Receptionist", monthly: "$499", setup: "$1,497",
        note: "Full voice coverage, missed-call recovery, and chat in one stack.",
        badge: "Most coverage", accent: "amber", cta: "Book AI Receptionist",
        highlights: ["AI voice agent", "Missed-call recovery", "200 voice minutes", "Full front-office stack"],
      },
    ],
    rows: [
      { label: "Monthly price",    values: ["$149", "$299", "$499"],           strong: true },
      { label: "Setup fee",        values: ["$497", "$997", "$1,497"],         strong: true },
      { label: "AI chatbot",       values: [true, true, true] },
      { label: "Lead capture",     values: [true, true, true] },
      { label: "FAQ answers",      values: [true, true, true] },
      { label: "Lead qualification",values: [false, true, true] },
      { label: "CRM integration",  values: [false, true, true] },
      { label: "AI voice agent",   values: [false, false, true] },
      { label: "Missed-call recovery", values: [false, false, true] },
      { label: "Included usage",   values: ["100 chats", "250 chats", "250 chats + 200 voice min"] },
      { label: "Overages",         values: ["$0.50/chat", "$0.40/chat", "$0.40/chat + $0.20/min"] },
    ],
  },
  clinical: {
    plans: [
      {
        id: "intake", name: "Intake", monthly: "$299", setup: "$997",
        note: "For practices that need every new-patient inquiry captured and qualified.",
        badge: "Foundation", accent: "blue", cta: "Start with Intake",
        highlights: ["AI chatbot + web intake", "New-patient lead capture", "FAQ & insurance answers", "250 chats included"],
      },
      {
        id: "practice", name: "Practice", monthly: "$549", setup: "$1,997",
        note: "For clinics that want booking, CRM/EMR handoff, and recall follow-up.",
        badge: "Best value", accent: "teal", cta: "Choose Practice",
        highlights: ["Patient qualification", "CRM / EMR integration", "Booking + reminders", "Recall & reactivation"],
      },
      {
        id: "concierge", name: "AI Concierge", monthly: "$899", setup: "$2,997",
        note: "For high-ticket clinics and med spas that can't afford a missed call.",
        badge: "Premium", accent: "amber", cta: "Book AI Concierge",
        highlights: ["AI voice agent", "Missed-call recovery", "500 voice minutes", "Full concierge front office"],
      },
    ],
    rows: [
      { label: "Monthly price",            values: ["$299", "$549", "$899"],    strong: true },
      { label: "Setup fee",                values: ["$997", "$1,997", "$2,997"],strong: true },
      { label: "AI chatbot + web intake",  values: [true, true, true] },
      { label: "New-patient lead capture", values: [true, true, true] },
      { label: "FAQ & insurance answers",  values: [true, true, true] },
      { label: "Patient qualification",    values: [false, true, true] },
      { label: "CRM / EMR integration",   values: [false, true, true] },
      { label: "Booking + reminders",      values: [false, true, true] },
      { label: "AI voice agent",           values: [false, false, true] },
      { label: "Missed-call recovery",     values: [false, false, true] },
      { label: "Included usage",           values: ["250 chats", "400 chats", "400 chats + 500 voice min"] },
      { label: "Overages",                 values: ["$0.40/chat", "$0.35/chat", "$0.35/chat + $0.20/min"] },
    ],
  },
};

// Replace with real quotes before launch
const testimonials = [
  {
    quote: "We were losing leads every week and didn't even know it. Within two weeks of going live the front office was running cleaner than it ever had with a full-time receptionist.",
    name: "Owner", business: "Service Business, Texas", stars: 5,
  },
  {
    quote: "Every DM, every missed call, every form submission — it all gets followed up now. My staff just shows up to the consultations.",
    name: "Practice Owner", business: "Health Clinic, Florida", stars: 5,
  },
  {
    quote: "The setup process was painless and they actually learned how we operate before building anything. It feels like our system, not a generic template.",
    name: "Director", business: "Med Spa, California", stars: 5,
  },
];

const faqs = [
  {
    question: "Do we need to replace our current CRM?",
    answer: "Not necessarily. If your current tools work, we can often build around them.",
  },
  {
    question: "Can you connect with the tools we already use?",
    answer: "Usually, yes. We design around your current booking, CRM, calendar, inbox, and messaging tools using the cleanest available connection or handoff.",
  },
  {
    question: "How does pricing work?",
    answer: "Pricing depends on workflow complexity, volume, tools, and scope. We keep it practical.",
  },
  {
    question: "What happens after we reach out?",
    answer: "We review the current lead path, identify friction, and recommend the cleanest next step.",
  },
];

const teamMembers = [
  {
    initials: "TM",
    name: "Tom Morris",
    title: "Co-Founder & CEO",
    accentColor: "teal",
    department: "Sales & Operations",
    bio: "Tom is a sales and operations professional turned AI entrepreneur. With nearly 10 years of experience generating revenue, building client relationships, and managing complex business workflows across technology, automotive, and regulated industries, he founded Corner Systems to help businesses leverage AI in practical, profitable ways.",
    bio2: "His background in outbound sales, business development, and operational problem-solving gives him a unique perspective on where AI can create real impact — from automating repetitive tasks to improving customer acquisition and decision-making. His mission: help businesses work smarter, grow faster, and stay competitive in an AI-driven world.",
    specialties: ["Outbound Sales & Business Development", "Revenue Operations", "Client Relationships & Partnerships", "AI Strategy for Service Businesses"],
    tags: ["Sales & BD", "AI Strategy", "Operations", "Entrepreneurship"],
  },
  {
    initials: "MM",
    name: "Michael Mastrella",
    title: "Co-Founder & CTO",
    accentColor: "blue",
    department: "Engineering & AI",
    bio: "Michael leads the technical architecture behind Corner Systems. His 20+ years of software and automation experience spans AI agents, RAG and document workflows, integrations, custom software, ecommerce and marketplace systems, observability, and production reliability.",
    bio2: "Michael has built production agent systems across enterprise, government, and SMB environments — with deep expertise in APIs, permissions, dashboards, and reliability. He designs and builds the infrastructure that powers every Corner Systems deployment.",
    specialties: ["Production agent systems at scale", "Enterprise, government & SMB environments", "APIs, permissions & production reliability"],
    tags: ["AI Engineering", "RAG & Agents", "System Architecture", "Custom Software"],
  },
];

const consoleFeed = [
  { icon: PhoneCall,          label: "Inbound call",        status: "Handled",   color: "teal" },
  { icon: MessageSquareText,  label: "Instagram DM",        status: "Qualified", color: "teal" },
  { icon: Calendar,           label: "Booking request",     status: "Confirmed", color: "amber" },
  { icon: Mail,               label: "Website inquiry",     status: "Replied",   color: "teal" },
  { icon: PhoneCall,          label: "Missed call",         status: "Recovered", color: "amber" },
  { icon: MessageSquareText,  label: "Facebook message",    status: "Qualified", color: "teal" },
  { icon: Calendar,           label: "Follow-up sequence",  status: "Armed",     color: "blue" },
  { icon: Mail,               label: "New lead",            status: "Captured",  color: "teal" },
];

const initialForm = { name: "", business: "", email: "", bottleneck: "", preferredTime: "" };

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useLiveConsole() {
  const [rows, setRows] = useState([consoleFeed[0], consoleFeed[1]]);
  const [flash, setFlash] = useState(null);
  const idx = useRef(2);
  useEffect(() => {
    const t = setInterval(() => {
      const next = consoleFeed[idx.current % consoleFeed.length];
      idx.current++;
      setFlash(next.label);
      setRows((prev) => [next, ...prev].slice(0, 4));
      setTimeout(() => setFlash(null), 600);
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return { rows, flash };
}

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

// ── Shared components ─────────────────────────────────────────────────────────
function SnapshotCounter({ value, suffix, label }) {
  const num = parseInt(value, 10);
  const { count, ref } = useCountUp(num);
  return (
    <div className="snapshot-item" ref={ref}>
      <strong>{count}{suffix}</strong>
      <span>{label}</span>
    </div>
  );
}

function RevealSection({ children, className = "", delay = 0 }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function PageHero({ eyebrow, title, subtitle, stats = [] }) {
  return (
    <section className="page-hero" aria-labelledby="page-hero-title">
      <div className="page-hero-inner">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {stats.length > 0 && (
          <div className="page-hero-stats" aria-label="Page highlights">
            {stats.map((s) => (
              <span key={s.label}><strong>{s.value}</strong> {s.label}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Pricing (shared between homepage teaser and /pricing page) ────────────────
function PricingSection({ pricingAudience, setPricingAudience, page = false }) {
  const pricingPlans = pricingByAudience[pricingAudience].plans;
  const pricingRows  = pricingByAudience[pricingAudience].rows;
  return (
    <section id="pricing" className={`section pricing-section ${page ? "pricing-page-section" : ""}`} aria-labelledby="pricing-title">
      <div className="pricing-heading">
        <div>
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-title">Clear packages. No mystery software bill.</h2>
          <p className="section-copy">
            Start with chat and lead capture, add qualification and CRM handoff, or move into full AI receptionist coverage with voice and missed-call recovery.
          </p>
        </div>
        <div className="pricing-kicker" aria-label="Pricing summary">
          <strong>Built around your workflow.</strong>
          <span>Choose the closest package, then we scope the exact build around your tools, volume, and front-office gaps.</span>
        </div>
      </div>

      <div className="pricing-toggle" role="tablist" aria-label="Choose your industry">
        {pricingAudiences.map((aud) => (
          <button
            key={aud.id} type="button" role="tab"
            aria-selected={pricingAudience === aud.id}
            className={`pricing-toggle-btn ${pricingAudience === aud.id ? "active" : ""}`}
            onClick={() => setPricingAudience(aud.id)}
          >
            {aud.label}
          </button>
        ))}
      </div>

      <div className="pricing-card-grid" aria-label="Pricing plans">
        {pricingPlans.map((plan) => (
          <article className={`pricing-card pricing-card-${plan.accent}`} key={plan.id}>
            <div className="pricing-card-top">
              <span className="plan-badge">{plan.badge}</span>
              <h3>{plan.name}</h3>
              <p>{plan.note}</p>
            </div>
            <div className="plan-price">
              <strong>{plan.monthly}</strong>
              <span>/ month</span>
            </div>
            <div className="setup-price">
              <span>Setup</span>
              <strong>{plan.setup}</strong>
            </div>
            <ul className="plan-highlights" aria-label={`${plan.name} highlights`}>
              {plan.highlights.map((highlight) => (
                <li key={highlight}>
                  <CheckCircle2 aria-hidden="true" size={17} />
                  {highlight}
                </li>
              ))}
            </ul>
            <a className="button button-secondary pricing-button" href="/contact">
              {plan.cta}
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </article>
        ))}
      </div>

      <div className="pricing-table-wrap">
        <table className="pricing-table">
          <caption>Plan comparison</caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              {pricingPlans.map((plan) => (
                <th className={`plan-head plan-head-${plan.accent}`} scope="col" key={plan.id}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, index) => (
                  <td data-label={pricingPlans[index].name} key={`${row.label}-${pricingPlans[index].id}`}>
                    {value === true  && <span className="pricing-check" aria-label="Included"><CheckCircle2 aria-hidden="true" size={18} /></span>}
                    {value === false && <span className="pricing-dash">-</span>}
                    {typeof value === "string" && (
                      <span className={row.strong ? "pricing-value pricing-value-strong" : "pricing-value"}>{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PricingPage({ pricingAudience, setPricingAudience }) {
  return (
    <>
      <section className="pricing-hero" aria-labelledby="pricing-page-title">
        <div className="pricing-hero-inner">
          <p className="eyebrow">Dedicated pricing</p>
          <h1 id="pricing-page-title">Pick the coverage level that stops the leak.</h1>
          <p>
            Transparent monthly packages for AI reception, lead capture, missed-call recovery, and follow-up automation. Every plan is tuned to the tools and workflow already inside your business.
          </p>
          <div className="pricing-hero-stats" aria-label="Pricing highlights">
            <span><strong>24/7</strong> coverage</span>
            <span><strong>$149+</strong> monthly</span>
            <span><strong>CRM</strong> ready</span>
          </div>
        </div>
      </section>
      <PricingSection pricingAudience={pricingAudience} setPricingAudience={setPricingAudience} page />
      <section className="cta-band pricing-final-cta" aria-label="Pricing call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Want the cleanest fit?</h2>
            <p>Send the current intake flow and we will recommend the simplest package before you commit.</p>
          </div>
          <a className="button button-primary" href="/contact">
            Book Discovery
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>
    </>
  );
}

// ── /services page ────────────────────────────────────────────────────────────
function ServicesPage() {
  useEffect(() => {
    const m = PAGE_META["/services"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="What we build"
        title="AI systems that handle the front office."
        subtitle="From first inquiry to confirmed booking — we design, build, and maintain every piece of the intake and follow-up stack for your business."
        stats={[
          { value: "24/7", label: "coverage" },
          { value: "All channels", label: "covered" },
          { value: "Zero", label: "leads dropped" },
        ]}
      />

      {/* Core services */}
      <section className="section services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <p className="eyebrow">Core services</p>
          <h2 id="services-title">Simple pieces that make the whole business sharper.</h2>
          <p className="section-copy">
            The goal is not more software. The goal is a business that answers well, books cleanly, follows up consistently, and knows where every lead stands.
          </p>
        </div>
        <div className="service-grid">
          {services.map(({ icon: Icon, title, text }, i) => (
            <RevealSection delay={i * 100} key={title}>
              <article className="service-card">
                <span className="service-icon"><Icon aria-hidden="true" size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section className="section deliverables-section" aria-label="What you get">
        <div className="section-heading">
          <p className="eyebrow">What you get</p>
          <h2>Everything needed to stop leakage at the front door.</h2>
          <p className="section-copy">
            We focus on the moment someone reaches out, how they are handled, where the lead goes, who owns it, and what happens next.
          </p>
        </div>
        <div className="deliverable-grid">
          {deliverables.map((item) => (
            <span className="deliverable-item" key={item}>
              <CheckCircle2 aria-hidden="true" size={18} />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="section process-section" aria-labelledby="process-title">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2 id="process-title">Clean, direct, and built around your actual workflow.</h2>
        </div>
        <div className="process-grid">
          {process.map((item, i) => (
            <RevealSection delay={i * 100} key={item.step}>
              <article className="process-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="section integrations-section" aria-labelledby="integrations-title">
        <div className="section-heading integrations-heading">
          <p className="eyebrow">Works with your tools</p>
          <h2 id="integrations-title">Built around the systems your team already uses.</h2>
          <p className="section-copy">
            Corner Systems connects the front-office workflow to your booking, CRM, calendar, inbox, and messaging stack.
          </p>
        </div>
        <div className="integration-grid">
          {integrationGroups.map((group, i) => (
            <RevealSection delay={i * 100} key={group.title}>
              <article className="integration-card">
                <div className="integration-card-top">
                  <span className="integration-icon"><Zap aria-hidden="true" size={20} /></span>
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.text}</p>
                  </div>
                </div>
                <div className="tool-chip-list" aria-label={`${group.title} tools`}>
                  {group.tools.map((tool) => (
                    <span className="tool-chip" key={tool}>{tool}</span>
                  ))}
                </div>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="section proof-section" aria-label="Operational value">
        <div className="proof-media proof-media-img">
          <img src="/assets/cs-dashboard.png" alt="Corner Systems live lead pipeline dashboard" loading="lazy" className="proof-dashboard-img" />
          <div className="proof-media-chips">
            <span className="proof-chip proof-chip-teal">✓ Lead captured</span>
            <span className="proof-chip proof-chip-blue">✓ Consultation booked 8:15 PM</span>
            <span className="proof-chip proof-chip-teal">✓ Staff handoff assigned</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">The result</p>
          <h2>A front office that protects every opportunity.</h2>
          <p className="section-copy">
            Prospects get a sharp first impression. Staff get clean handoffs. Owners get visibility.
          </p>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <span className="benefit-item" key={benefit}>
                <CheckCircle2 aria-hidden="true" size={16} />
                {benefit}
              </span>
            ))}
          </div>
          <div className="proof-grid" aria-label="Trust points">
            {proofPoints.map((point) => (
              <article className="proof-card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band" aria-label="Services call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Ready to build it?</h2>
            <p>Book a 20-minute discovery call. We'll map the flow and recommend the cleanest package.</p>
          </div>
          <a className="button button-primary" href="/contact">
            Book Discovery
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>
    </>
  );
}

// ── /industries page ──────────────────────────────────────────────────────────
function IndustriesPage() {
  useEffect(() => {
    const m = PAGE_META["/industries"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Industries we serve"
        title="Built for businesses where every inquiry counts."
        subtitle="If your business depends on people reaching out — and a missed one costs you real money — Corner Systems keeps the front door covered."
        stats={[
          { value: "3+", label: "industries" },
          { value: "10+", label: "business types" },
          { value: "All channels", label: "covered" },
        ]}
      />

      {/* Channels */}
      <section className="coverage-band" aria-label="Channels covered">
        <RevealSection className="coverage-inner">
          <div>
            <p className="eyebrow">Every channel, one standard</p>
            <h2>Every inquiry gets a professional response.</h2>
            <p className="section-copy">
              Your front office should not depend on who is free, stressed, or remembering to follow up.
            </p>
          </div>
          <div className="channel-grid" aria-label="Channels covered">
            {channels.map(({ icon: Icon, title, text }, i) => (
              <RevealSection delay={i * 80} key={title}>
                <article className="channel-card">
                  <Icon aria-hidden="true" size={22} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              </RevealSection>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* Market groups */}
      <section className="section verticals-section" aria-labelledby="verticals-title">
        <div className="section-heading">
          <p className="eyebrow">Built for high-value service businesses</p>
          <h2 id="verticals-title">One standard of coverage. Every industry that lives on inquiries.</h2>
          <p className="section-copy">
            Gyms, clinics, and aesthetics practices all share the same front-office challenge: people reaching out at unpredictable hours expecting a fast, professional response.
          </p>
        </div>
        <div className="vertical-grid">
          {marketGroups.map(({ icon: Icon, title, text, items }, i) => (
            <RevealSection delay={i * 110} key={title}>
              <article className="vertical-card">
                <span className="vertical-icon"><Icon aria-hidden="true" size={24} /></span>
                <h3>{title}</h3>
                <p className="vertical-blurb">{text}</p>
                <ul className="vertical-list">
                  {items.map((item) => (
                    <li key={item}>
                      <CheckCircle2 aria-hidden="true" size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Social grid */}
      <section className="social-section" aria-label="Industry environments">
        <RevealSection>
          <div className="social-heading">
            <p className="eyebrow">Across every environment</p>
            <h2>From the gym floor to the clinic corridor — we cover it all.</h2>
          </div>
        </RevealSection>
        <div className="social-grid">
          {[
            { src: "/assets/cs-gym-night-v2.png",    label: "Combat Sports & Fitness",        tag: "Your Niche"   },
            { src: "/assets/cs-medspa-v2.png",        label: "Med Spa & Aesthetic Clinics",    tag: "Premium"      },
            { src: "/assets/cs-clinic-story-v2.png",  label: "Clinics & Patient Intake",       tag: "Your Niche"   },
            { src: "/assets/cs-reception-hero.png",   label: "Front Office Infrastructure",    tag: "Built For You"},
            { src: "/assets/cs-gym-aerial.png",       label: "Gym Operations — Automated",     tag: "Systemised"   },
            { src: "/assets/cs-clinic-square.png",    label: "Patient Intake — Seamless",      tag: "Clinics"      },
            { src: "/assets/cs-lobby-hero.png",       label: "Premium Reception Coverage",     tag: "24/7"         },
            { src: "/assets/cs-gym-night-sq.png",     label: "Corner Systems Network",         tag: "Connected"    },
          ].map((item, i) => (
            <RevealSection delay={i * 55} key={item.src}>
              <div className="social-card">
                <img src={item.src} alt={item.label} loading="lazy" />
                <div className="social-card-label">
                  <span>{item.label}</span>
                  <span className="social-tag">{item.tag}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <section className="cta-band" aria-label="Industries call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Recognize your business?</h2>
            <p>Book a call and we'll show exactly how Corner Systems fits your front office.</p>
          </div>
          <a className="button button-primary" href="/contact">
            Book Discovery
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>
    </>
  );
}

// ── /team page ────────────────────────────────────────────────────────────────
function TeamPage() {
  useEffect(() => {
    const m = PAGE_META["/team"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="The founders"
        title="Built by people who've worked the front line."
        subtitle="Corner Systems was built by operators and engineers who understand both the chaos of running a service business and the precision required to automate it well."
      />

      <section id="team" className="team-section" aria-labelledby="team-title">
        <div className="team-inner">
          <div className="team-grid">
            {teamMembers.map((member, i) => (
              <RevealSection delay={i * 140} key={member.name}>
                <article className={`team-card team-card-${member.accentColor}`}>
                  <div className="team-card-top">
                    <div className={`team-avatar team-avatar-${member.accentColor}`}>
                      <span>{member.initials}</span>
                    </div>
                    <div className="team-meta">
                      <span className="team-dept">{member.department}</span>
                      <h3 className="team-name">{member.name}</h3>
                      <span className={`team-title-badge team-badge-${member.accentColor}`}>{member.title}</span>
                    </div>
                  </div>
                  <div className="team-bio">
                    <p>{member.bio}</p>
                    <p>{member.bio2}</p>
                  </div>
                  <div className="team-specialties">
                    {member.specialties.map((spec) => (
                      <span className="team-specialty" key={spec}>{spec}</span>
                    ))}
                  </div>
                  <div className="team-tags">
                    {member.tags.map((tag) => (
                      <span className="team-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band" aria-label="Team call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Ready to work with us?</h2>
            <p>Book a discovery call and let's talk about your front office.</p>
          </div>
          <a className="button button-primary" href="/contact">
            Book Discovery
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>
    </>
  );
}

// ── /contact page ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [formData, setFormData] = useState(initialForm);
  const [formStatus, setFormStatus] = useState("idle");

  useEffect(() => {
    const m = PAGE_META["/contact"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  function updateField(e) {
    const { name, value } = e.target;
    setFormData((cur) => ({ ...cur, [name]: value }));
  }

  async function submitLead(e) {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Request failed");
      setFormStatus("sent");
      setFormData(initialForm);
    } catch {
      setFormStatus("error");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Start clean"
        title="Book your discovery call."
        subtitle="Tell us where inquiries come from and what feels inconsistent. We'll use that context to map the cleanest next step on the call."
      />

      <section className="section contact-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">Get in touch</p>
          <h2>Let's map your front office.</h2>
          <p className="section-copy">
            A 20-minute call. No pitch deck. We look at where leads come from, who handles them, and what slips — then recommend the cleanest fix.
          </p>
          <div className="trust-row" aria-label="Trust points">
            <span><ShieldCheck aria-hidden="true" size={18} /> Owner-first workflows</span>
            <span><Clock3     aria-hidden="true" size={18} /> Practical scope</span>
            <span><Target     aria-hidden="true" size={18} /> Conversion focused</span>
          </div>
        </div>

        <form className="contact-form" onSubmit={submitLead}>
          <label>
            Name
            <input name="name" autoComplete="name" value={formData.name} onChange={updateField} required />
          </label>
          <label>
            Business
            <input name="business" autoComplete="organization" value={formData.business} onChange={updateField} required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" value={formData.email} onChange={updateField} required />
          </label>
          <label>
            Biggest bottleneck
            <textarea name="bottleneck" rows="4" value={formData.bottleneck} onChange={updateField} required />
          </label>
          <label>
            Best follow-up time
            <input name="preferredTime" value={formData.preferredTime} onChange={updateField} placeholder="Example: weekday mornings" />
          </label>
          <button className="button button-primary" type="submit" disabled={formStatus === "sending" || formStatus === "sent"}>
            {formStatus === "sending" ? "Sending…" : formStatus === "sent" ? "Sent — we'll be in touch" : "Book Discovery"}
            {formStatus !== "sending" && formStatus !== "sent" && <Mail aria-hidden="true" size={19} />}
          </button>
          {formStatus === "error" && (
            <p className="form-note form-note-error">
              Something went wrong. Email us directly at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          )}
        </form>
      </section>

      {/* FAQ */}
      <section className="section faq-section" aria-label="Frequently asked questions">
        <div className="section-heading">
          <p className="eyebrow">Questions</p>
          <h2>Quick answers before we talk.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((item) => (
            <article className="faq-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

// ── / homepage ────────────────────────────────────────────────────────────────
function HomePage() {
  const { rows: consoleRows, flash: consoleFlash } = useLiveConsole();

  useEffect(() => {
    const m = PAGE_META["/"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero-section" aria-labelledby="hero-title">
        <img
          className="hero-image"
          src="/assets/cs-hero-lobby-v2.png"
          alt="Corner Systems AI front office — premium lobby with autonomous AI reception system"
          fetchPriority="high"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Premium front-office infrastructure</p>
            <h1 id="hero-title">
              <span>Corner</span>
              <span>Systems</span>
            </h1>
            <p className="hero-lede">
              For service businesses where every inquiry is worth real money. We make sure every call, text, email, message, and DM is captured, qualified, and booked — with the same professional standard, every day.
            </p>
            <div className="hero-proofline" aria-label="Coverage channels">
              <span>Calls</span>
              <span>Texts</span>
              <span>Email</span>
              <span>Messages</span>
              <span>DMs</span>
            </div>
            <div className="hero-actions" aria-label="Primary actions">
              <a className="button button-primary" href="/contact">
                Book a Discovery Call
                <ArrowRight aria-hidden="true" size={20} />
              </a>
              <a className="button button-secondary" href="/services">
                See Services
                <ChevronRight aria-hidden="true" size={20} />
              </a>
            </div>
          </div>

          <div className="lead-console" aria-label="Lead system preview">
            <div className="console-header">
              <span className="status-dot" />
              <span>Front office live</span>
              <span className="console-live-badge">LIVE</span>
            </div>
            <div className="console-feed">
              {consoleRows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label + i}
                    className={`console-row ${consoleFlash === row.label ? "console-row-flash" : ""} ${i === 0 ? "console-row-new" : ""}`}
                  >
                    <Icon aria-hidden="true" size={17} />
                    <span>{row.label}</span>
                    <strong className={`status-${row.color}`}>{row.status}</strong>
                  </div>
                );
              })}
            </div>
            <div className="console-footer">
              <span className="console-pulse" />
              <span>All channels covered | Zero dropped</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-band" aria-hidden="true">
        <div className="ticker-inner">
          {[
            { label: "Calls answered",            value: "24/7" },
            { label: "Leads captured",            value: "100%" },
            { label: "DMs replied",               value: "Instantly" },
            { label: "Missed calls recovered",    value: "Automated" },
            { label: "Booking requests handled",  value: "Zero dropped" },
            { label: "CRM handoff",               value: "Clean" },
            { label: "Follow-up sequences",       value: "Always running" },
            { label: "Staff time saved",          value: "Every day" },
            { label: "Calls answered",            value: "24/7" },
            { label: "Leads captured",            value: "100%" },
            { label: "DMs replied",               value: "Instantly" },
            { label: "Missed calls recovered",    value: "Automated" },
            { label: "Booking requests handled",  value: "Zero dropped" },
            { label: "CRM handoff",               value: "Clean" },
            { label: "Follow-up sequences",       value: "Always running" },
            { label: "Staff time saved",          value: "Every day" },
          ].map((item, i) => (
            <span className="ticker-item" key={i}>
              <span className="ticker-dot" />
              {item.label} — <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Snapshot */}
      <section className="snapshot-band" aria-label="System snapshot">
        <div className="snapshot-inner">
          <SnapshotCounter value="24" suffix="/7" label="coverage" />
          <SnapshotCounter value="100" suffix="%" label="channels covered" />
          <SnapshotCounter value="0" suffix="" label="leads dropped" />
        </div>
      </section>

      {/* Coverage brief */}
      <section className="coverage-band" aria-label="Channels covered">
        <RevealSection className="coverage-inner">
          <div>
            <p className="eyebrow">Every channel, one standard</p>
            <h2>Every inquiry gets a professional response.</h2>
            <p className="section-copy">
              Your front office should not depend on who is free, stressed, or remembering to follow up.
            </p>
            <a className="button button-secondary" href="/services" style={{ marginTop: "22px", display: "inline-flex" }}>
              Full service breakdown
              <ChevronRight aria-hidden="true" size={18} />
            </a>
          </div>
          <div className="channel-grid" aria-label="Channels covered">
            {channels.map(({ icon: Icon, title, text }, i) => (
              <RevealSection delay={i * 80} key={title}>
                <article className="channel-card">
                  <Icon aria-hidden="true" size={22} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              </RevealSection>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* Proof section */}
      <section className="section proof-section" aria-label="Operational value">
        <div className="proof-media proof-media-img">
          <img src="/assets/cs-dashboard.png" alt="Corner Systems live lead pipeline dashboard" loading="lazy" className="proof-dashboard-img" />
          <div className="proof-media-chips">
            <span className="proof-chip proof-chip-teal">✓ Lead captured</span>
            <span className="proof-chip proof-chip-blue">✓ Consultation booked 8:15 PM</span>
            <span className="proof-chip proof-chip-teal">✓ Staff handoff assigned</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">The result</p>
          <h2>A front office that protects every opportunity.</h2>
          <p className="section-copy">
            Prospects get a sharp first impression. Staff get clean handoffs. Owners get visibility.
          </p>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <span className="benefit-item" key={benefit}>
                <CheckCircle2 aria-hidden="true" size={16} />
                {benefit}
              </span>
            ))}
          </div>
          <div className="proof-grid" aria-label="Trust points">
            {proofPoints.map((point) => (
              <article className="proof-card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Social grid */}
      <section className="social-section" aria-label="What we build for your business">
        <RevealSection>
          <div className="social-heading">
            <p className="eyebrow">Across every environment</p>
            <h2>From the gym floor to the clinic corridor — we cover it all.</h2>
            <p className="social-subhead">
              Calls answered at 11pm. DMs replied in seconds. Bookings confirmed while your staff is focused on the client in front of them.
            </p>
          </div>
        </RevealSection>
        <div className="social-grid">
          {[
            { src: "/assets/cs-hero-lobby-v2.png",    label: "24/7 AI Reception — Active",        tag: "Always On"    },
            { src: "/assets/cs-gym-night-v2.png",     label: "Combat Sports & Fitness",           tag: "Your Niche"   },
            { src: "/assets/cs-phone-story.png",      label: "Every Lead. Captured.",             tag: "Zero Dropped" },
            { src: "/assets/cs-medspa-v2.png",        label: "Med Spa & Aesthetic Clinics",       tag: "Premium"      },
            { src: "/assets/cs-dashboard.png",        label: "Lead Pipeline — Live View",         tag: "Real-Time"    },
            { src: "/assets/cs-clinic-story-v2.png",  label: "Clinics & Patient Intake",          tag: "Your Niche"   },
            { src: "/assets/cs-reception-hero.png",   label: "Front Office Infrastructure",       tag: "Built For You"},
            { src: "/assets/cs-gym-aerial.png",       label: "Gym Operations — Automated",        tag: "Systemised"   },
            { src: "/assets/cs-before-after-v2.png",  label: "Before Corner Systems → After",    tag: "The Result"   },
            { src: "/assets/cs-clinic-square.png",    label: "Patient Intake — Seamless",         tag: "Clinics"      },
            { src: "/assets/cs-lobby-hero.png",       label: "Premium Reception Coverage",        tag: "24/7"         },
            { src: "/assets/cs-gym-night-sq.png",     label: "Corner Systems Network",            tag: "Connected"    },
          ].map((item, i) => (
            <RevealSection delay={i * 55} key={item.src}>
              <div className="social-card">
                <img src={item.src} alt={item.label} loading="lazy" />
                <div className="social-card-label">
                  <span>{item.label}</span>
                  <span className="social-tag">{item.tag}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="proof" className="section testimonials-section" aria-label="Client results">
        <div className="section-heading">
          <p className="eyebrow">What clients say</p>
          <h2>Real operators. Real results.</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((t, i) => (
            <RevealSection delay={i * 120} key={t.business}>
              <article className="testimonial-card">
                <Quote className="testimonial-icon" aria-hidden="true" size={22} />
                <div className="testimonial-stars" aria-label={`${t.stars} out of 5 stars`}>
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} aria-hidden="true" size={14} />
                  ))}
                </div>
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <footer className="testimonial-attribution">
                  <strong>{t.name}</strong>
                  <span>{t.business}</span>
                </footer>
              </article>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="section pricing-teaser-section" aria-label="Pricing overview">
        <div className="pricing-teaser">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2>Packages from $149/month, scoped around your real front office.</h2>
            <p className="section-copy">
              Compare the full chat, CRM, voice, and missed-call recovery packages on the dedicated pricing page.
            </p>
          </div>
          <a className="button button-primary" href="/pricing">
            View Pricing
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>

      {/* CTA band */}
      <section className="cta-band" aria-label="Mid-page call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Ready to stop losing leads?</h2>
            <p>Book a free 20-minute discovery call. We'll map your current intake flow and show you where the gaps are.</p>
          </div>
          <a className="button button-primary" href="/contact">
            Book a Discovery Call
            <ArrowRight aria-hidden="true" size={20} />
          </a>
        </div>
      </section>

      {/* Team teaser */}
      <section className="section team-teaser-section" aria-label="About the team">
        <RevealSection className="team-teaser">
          <div>
            <p className="eyebrow">The founders</p>
            <h2>Built by operators and engineers.</h2>
            <p className="section-copy">
              Tom Morris (CEO) brings nearly 10 years in sales and revenue operations. Michael Mastrella (CTO) brings 20+ years building production AI systems. Together they build AI front offices that actually work in the real world.
            </p>
            <a className="button button-secondary" href="/team" style={{ marginTop: "24px", display: "inline-flex" }}>
              Meet the team
              <ChevronRight aria-hidden="true" size={18} />
            </a>
          </div>
          <div className="team-teaser-avatars">
            <div className="team-avatar-pair">
              <div className="teaser-avatar teaser-avatar-teal"><span>TM</span></div>
              <div className="teaser-avatar teaser-avatar-blue"><span>MM</span></div>
            </div>
            <div className="team-teaser-names">
              <span><strong>Tom Morris</strong> — Co-Founder & CEO</span>
              <span><strong>Michael Mastrella</strong> — Co-Founder & CTO</span>
            </div>
          </div>
        </RevealSection>
      </section>
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pricingAudience, setPricingAudience] = useState("fitness");
  const pathname = window.location.pathname;

  const closeMenu = () => setMenuOpen(false);

  const currentPage =
    pathname === "/pricing"    ? "pricing"    :
    pathname === "/services"   ? "services"   :
    pathname === "/industries" ? "industries" :
    pathname === "/team"       ? "team"       :
    pathname === "/contact"    ? "contact"    :
    "home";

  return (
    <div className="site-shell">
      {/* Header */}
      <header className="site-header">
        <a className="brand" href="/" aria-label="Corner Systems home">
          <img
            className="cs-logo-img"
            src="/assets/cs-logo-dark.png"
            alt="Corner Systems AI"
            width="120"
            height="58"
          />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="/contact">
          Book Discovery
          <ArrowRight aria-hidden="true" size={18} />
        </a>

        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
              <ChevronRight aria-hidden="true" size={18} />
            </a>
          ))}
        </nav>
      )}

      <main id="top">
        {currentPage === "pricing"    && <PricingPage pricingAudience={pricingAudience} setPricingAudience={setPricingAudience} />}
        {currentPage === "services"   && <ServicesPage />}
        {currentPage === "industries" && <IndustriesPage />}
        {currentPage === "team"       && <TeamPage />}
        {currentPage === "contact"    && <ContactPage />}
        {currentPage === "home"       && <HomePage />}
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="/" aria-label="Corner Systems home">
          <img
            className="cs-logo-img"
            src="/assets/cs-logo-dark.png"
            alt="Corner Systems AI"
            width="120"
            height="58"
          />
        </a>
        <nav className="footer-nav" aria-label="Footer navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </footer>
    </div>
  );
}

export default App;
