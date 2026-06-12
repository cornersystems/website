import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  DollarSign,
  Dumbbell,
  ExternalLink,
  Flame,
  Globe,
  HeartPulse,
  Inbox,
  Instagram,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MailOpen,
  Maximize2,
  MapPin,
  Menu,
  MessageSquareText,
  PhoneCall,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  StickyNote,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SignedIn, SignedOut, SignIn, useAuth, UserButton } from "@clerk/clerk-react";

const contactEmail = "hello@cornersystems.co";

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
  "/privacy": {
    title: "Privacy Policy | Corner Systems",
    description: "How Corner Systems collects, uses, and protects your personal information in accordance with PIPEDA.",
    canonical: "https://cornersystems.vercel.app/privacy",
  },
  "/terms": {
    title: "Terms of Service | Corner Systems",
    description: "Terms governing the use of Corner Systems services, software, and website.",
    canonical: "https://cornersystems.vercel.app/terms",
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
  "/crm": {
    title: "CRM Login | Corner Systems",
    description:
      "Internal Corner Systems CRM login for team access to leads, conversations, support tickets, callbacks, and follow-up tasks.",
    canonical: "https://cornersystems.vercel.app/crm",
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
  { step: "01", title: "Review", text: "Where do leads come from, who handles them, and what gets missed?" },
  { step: "02", title: "Map",    text: "Define intake, routing, booking, follow-up, alerts, and ownership." },
  { step: "03", title: "Build",  text: "Set up the front office flow and test realistic customer scenarios." },
  { step: "04", title: "Improve",text: "Tighten weak points as the business learns what converts." },
];

const snapshots = [
  { value: "24/7",  label: "coverage" },
  { value: "All",   label: "channels" },
  { value: "Zero",  label: "missed leads" },
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

const billingOptions = [
  { id: "annual",  label: "Annual" },
  { id: "monthly", label: "Monthly" },
];

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    prices: {
      monthly: { amount: "$199", period: "/ month" },
      annual: { amount: "$179", period: "/ month" },
    },
    setup: "$497",
    note: "For basic lead capture and fast website response.",
    badge: "Essentials",
    accent: "blue",
    cta: "Start with Starter",
    highlights: ["AI chatbot", "Lead capture", "FAQ answers", "100 chats included"],
  },
  {
    id: "growth",
    name: "Growth",
    prices: {
      monthly: { amount: "$299", period: "/ month" },
      annual: { amount: "$249", period: "/ month" },
    },
    setup: "$997",
    note: "For operators who want qualification, CRM handoff, and stronger follow-up.",
    badge: "Best value",
    accent: "teal",
    cta: "Choose Growth",
    highlights: ["Lead qualification", "CRM integration", "250 chats included", "Lower chat overages"],
  },
  {
    id: "receptionist",
    name: "AI Receptionist",
    prices: {
      monthly: { amount: "$499", period: "/ month" },
      annual: { amount: "$449", period: "/ month" },
    },
    setup: "$1,497",
    note: "Full voice coverage, missed-call recovery, and chat in one stack.",
    badge: "Most coverage",
    accent: "amber",
    cta: "Book AI Receptionist",
    highlights: ["AI voice agent", "Missed-call recovery", "200 voice minutes", "Full front-office stack"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    prices: {
      monthly: { amount: "Custom" },
      annual: { amount: "Custom" },
    },
    setup: "Scoped",
    note: "For multi-location teams, custom workflows, higher usage, and deeper operational control.",
    badge: "Custom build",
    accent: "violet",
    cta: "Talk Enterprise",
    highlights: ["Custom channels", "Advanced integrations", "Higher usage limits", "Priority optimization"],
  },
];

const pricingRows = [
  { label: "Monthly price", values: ["$199", "$299", "$499", "Custom"], strong: true, billing: "monthly" },
  { label: "Annual monthly price", values: ["$179", "$249", "$449", "Custom"], strong: true, billing: "annual" },
  { label: "Setup fee",     values: ["$497", "$997", "$1,497", "Scoped"], strong: true },
  { label: "AI chatbot",    values: [true, true, true, true] },
  { label: "Lead capture",  values: [true, true, true, true] },
  { label: "FAQ answers",   values: [true, true, true, true] },
  { label: "Lead qualification", values: [false, true, true, true] },
  { label: "CRM integration",    values: [false, true, true, true] },
  { label: "AI voice agent",     values: [false, false, true, true] },
  { label: "Missed-call recovery", values: [false, false, true, true] },
  { label: "Custom workflows",   values: [false, false, false, true] },
  { label: "Included usage",     values: ["100 chats", "250 chats", "250 chats + 200 voice min", "Custom limits"] },
  { label: "Overages",           values: ["$0.50/chat", "$0.40/chat", "$0.40/chat + $0.20/min", "Custom rates"] },
];

const earlyResults = [
  { metric: "< 2 min",  label: "average response time across all channels" },
  { metric: "0",        label: "missed calls once the system is live" },
  { metric: "100%",     label: "of inquiries captured and logged to CRM" },
  { metric: "24/7",     label: "coverage with no extra staff cost" },
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
    answer: "Fixed packages start at $179/mo when billed annually, or $199 month-to-month, with Enterprise custom pricing for more complex builds. Pick the plan closest to your coverage needs — we scope the exact build around your tools and volume from there. No hourly rates, no surprise add-ons.",
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

// Typing / cycling headline hook
const HERO_LINES = [
  "never misses a call.",
  "books leads 24/7.",
  "captures every lead.",
  "works while you sleep.",
];

function useTypingCycle(lines, typeSpeed = 55, pause = 2500, deleteSpeed = 28) {
  const [text, setText]   = useState("");
  const [phase, setPhase] = useState("typing");
  const [idx, setIdx]     = useState(0);

  useEffect(() => {
    const target = lines[idx];
    if (phase === "typing") {
      if (text.length < target.length) {
        const t = setTimeout(() => setText(target.slice(0, text.length + 1)), typeSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), pause);
      return () => clearTimeout(t);
    }
    if (phase === "deleting") {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), deleteSpeed);
        return () => clearTimeout(t);
      }
      setIdx((i) => (i + 1) % lines.length);
      setPhase("typing");
    }
  }, [text, phase, idx, lines, typeSpeed, pause, deleteSpeed]);

  return text;
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
      <img className="page-hero-bg" src="/assets/cs-navy-hero-bg.png" alt="" aria-hidden="true" />
      <div className="page-hero-inner">
        <div className="page-hero-copy">
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
        <div className="page-hero-logo" aria-hidden="true">
          <img src="/assets/cs-logo-3d.png" alt="" />
        </div>
      </div>
    </section>
  );
}

// ── Pricing (shared between homepage teaser and /pricing page) ────────────────
function PricingSection({ page = false }) {
  const [billingCycle, setBillingCycle] = useState("annual");
  const visiblePricingRows = pricingRows.filter((row) => !row.billing || row.billing === billingCycle);

  return (
    <section id="pricing" className={`section pricing-section ${page ? "pricing-page-section" : ""}`} aria-labelledby="pricing-title">
      <div className="pricing-heading">
        <div>
          <p className="eyebrow">Pricing</p>
          <h2 id="pricing-title">Clear plans for front-office coverage.</h2>
          <p className="section-copy">
            Start with chat and lead capture, add qualification and CRM handoff, or move into full AI receptionist coverage with voice and missed-call recovery.
          </p>
        </div>
        <div className="pricing-kicker" aria-label="Pricing summary">
          <strong>Built around your workflow.</strong>
          <span>Choose the closest package, then we scope the exact build around your tools, volume, and front-office gaps.</span>
        </div>
      </div>

      <div className="pricing-toggle" role="tablist" aria-label="Choose billing cycle">
        {billingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={billingCycle === option.id}
            className={`pricing-toggle-btn ${billingCycle === option.id ? "active" : ""}`}
            onClick={() => setBillingCycle(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="pricing-card-grid" aria-label="Pricing plans">
        {pricingPlans.map((plan) => (
          <article className={`pricing-card pricing-card-${plan.accent}`} key={plan.id}>
            <div className="pricing-card-top">
              <span className="plan-badge">{plan.badge}</span>
              <h3>{plan.name}</h3>
              <div className="plan-description">
                <p>{plan.note}</p>
              </div>
            </div>
            <div className="plan-price">
              <strong>{plan.prices[billingCycle].amount}</strong>
              <span>{plan.prices[billingCycle].period}</span>
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
            {visiblePricingRows.map((row) => (
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

function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="AI front-office pricing."
        subtitle="Annual plans start at $179/month. Choose the package that fits your lead volume and coverage needs."
        stats={[
          { value: "$179+", label: "billed annually" },
          { value: "$199", label: "month-to-month" },
          { value: "Setup", label: "quoted upfront" },
        ]}
      />
      <PricingSection page />
      <section className="cta-band pricing-final-cta" aria-label="Pricing call to action">
        <div className="cta-band-inner">
          <div>
            <h2>Not sure which plan fits?</h2>
            <p>Book a discovery call and we will recommend the simplest package for your current lead flow.</p>
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
        eyebrow="Services"
        title="AI front-office services."
        subtitle="Capture, qualify, and book leads across calls, texts, email, forms, and DMs."
        stats={[
          { value: "24/7", label: "coverage" },
          { value: "All", label: "channels handled" },
          { value: "CRM", label: "handoff ready" },
        ]}
      />

      {/* Core services */}
      <section className="section services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <p className="eyebrow">Core services</p>
          <h2 id="services-title">Keep leads moving.</h2>
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
          <h2>Everything needed to stop missed leads at the front door.</h2>
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
        eyebrow="Industries"
        title="Industries we serve."
        subtitle="For gyms, clinics, med spas, and appointment-based teams that need every inquiry answered fast."
        stats={[
          { value: "Gyms", label: "and studios" },
          { value: "Clinics", label: "and med spas" },
          { value: "All", label: "channels handled" },
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
  useEffect(() => {
    const m = PAGE_META["/contact"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Book a discovery call."
        subtitle="In 20 minutes, we will review your lead flow and recommend the clearest next step."
        stats={[
          { value: "20", label: "minutes" },
          { value: "Clear", label: "next step" },
          { value: "No", label: "pressure" },
        ]}
      />

      <section className="section contact-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">Get in touch</p>
          <h2>Let's map your front office.</h2>
          <p className="section-copy">
            A focused call to review where leads come from, who handles them, and what is being missed. You leave with a clear recommendation.
          </p>
          <div className="trust-row" aria-label="Trust points">
            <span><ShieldCheck aria-hidden="true" size={18} /> Owner-first workflows</span>
            <span><Clock3     aria-hidden="true" size={18} /> Practical scope</span>
            <span><Target     aria-hidden="true" size={18} /> Conversion focused</span>
          </div>
        </div>

        <div className="calendly-card">
          <iframe
            src="https://calendly.com/cornersystemsai/30min?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=0ea5e9"
            title="Book a discovery call"
            className="calendly-frame"
            frameBorder="0"
            loading="lazy"
            allow="fullscreen"
          />
        </div>
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

// ── Hero challenge selector ───────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: "missed-calls",
    icon: PhoneCall,
    label: "Missed calls after hours",
    fix: "AI voice agent catches every call — 24/7, response in under 8 seconds.",
  },
  {
    id: "cold-leads",
    icon: Zap,
    label: "Leads going cold before follow-up",
    fix: "Every inquiry replied to within 2 minutes — day, night, and weekends.",
  },
  {
    id: "booking-drop",
    icon: Calendar,
    label: "Booking requests not converting",
    fix: "Qualified leads get booked automatically. No phone tag, no back-and-forth.",
  },
  {
    id: "no-system",
    icon: MessageSquareText,
    label: "No consistent follow-up system",
    fix: "Automated sequences reactivate cold leads without lifting a finger.",
  },
];

function HeroSelector() {
  const [open, setOpen]       = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="hero-selector">
      <button
        className={`selector-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{selected ? selected.label : "What's your biggest gap?"}</span>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className={`selector-chevron${open ? " rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="selector-dropdown" role="listbox">
          {CHALLENGES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                role="option"
                aria-selected={selected?.id === c.id}
                className={`selector-option${selected?.id === c.id ? " selected" : ""}`}
                onClick={() => { setSelected(c); setOpen(false); }}
              >
                <Icon size={16} aria-hidden="true" />
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {selected && !open && (
        <div className="selector-answer">
          {React.createElement(selected.icon, { size: 18, "aria-hidden": true })}
          <span>{selected.fix}</span>
        </div>
      )}
    </div>
  );
}

// ── / homepage ────────────────────────────────────────────────────────────────
function HomePage() {
  const { rows: consoleRows, flash: consoleFlash } = useLiveConsole();
  const typedText = useTypingCycle(HERO_LINES);

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
          src="/assets/cs-hero-light-v2.png"
          alt="Corner Systems AI — premium modern service business front office"
          fetchPriority="high"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-copy">

            {/* Typing headline */}
            <h1 id="hero-title" aria-label="Your front office, never misses a call.">
              <span className="h1-static">Your front office,</span>
              <span className="h1-typed" aria-hidden="true">
                {typedText}
                <span className="type-cursor" />
              </span>
            </h1>

            <div className="hero-channels" aria-label="Every communication channel captured">
              <span className="hero-channel"><PhoneCall size={15} aria-hidden="true" /> Calls</span>
              <span className="hero-channel"><MessageSquareText size={15} aria-hidden="true" /> SMS</span>
              <span className="hero-channel"><Mail size={15} aria-hidden="true" /> Email</span>
              <span className="hero-channel"><Instagram size={15} aria-hidden="true" /> DMs</span>
              <span className="hero-channel"><Bot size={15} aria-hidden="true" /> AI Chat</span>
            </div>

            <p className="hero-lede">
              For gyms, clinics, and med spas where every inquiry is real money. Every call, DM, text, and form — captured, qualified, and booked 24/7.
            </p>

            {/* Interactive challenge dropdown */}
            <HeroSelector />

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

        {/* Scroll cue */}
        <button
          className="hero-scroll-cue"
          aria-label="Scroll to content"
          onClick={() => document.querySelector(".ticker-band")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronDown size={20} aria-hidden="true" />
        </button>
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
          <SnapshotCounter value="0" suffix="" label="missed leads" />
        </div>
      </section>

      {/* Lead Journey — replaces broken reel section */}
      <section className="journey-section" aria-label="Lead journey walkthrough">
        <RevealSection>
          <div className="journey-header">
            <p className="eyebrow">How it works in real time</p>
            <h2>From first contact to booked — in under 3 minutes.</h2>
            <p className="journey-sub">This is a real sequence. A prospect reaches out after hours. Here's exactly what happens inside the system.</p>
          </div>
        </RevealSection>
        <div className="journey-timeline">
          {[
            {
              time: "11:42 PM",
              channel: "Instagram DM",
              color: "teal",
              title: "Prospect reaches out",
              detail: "\"Hey, do you guys have any morning spots open? Looking to start next week.\"",
              outcome: "Captured instantly — no missed message",
            },
            {
              time: "11:42:08 PM",
              channel: "AI Response",
              color: "blue",
              title: "AI replies in 8 seconds",
              detail: "Personalised response with available slots, pricing, and a booking link — no human needed.",
              outcome: "Prospect stays warm, not left on read",
            },
            {
              time: "11:47 PM",
              channel: "Booking System",
              color: "teal",
              title: "Consultation booked",
              detail: "Prospect selects a Tuesday 7am slot. Confirmation email fires immediately. Reminder set for 24h before.",
              outcome: "Booking confirmed while you sleep",
            },
            {
              time: "11:47 PM",
              channel: "CRM",
              color: "blue",
              title: "Lead logged with full context",
              detail: "Name, source (Instagram), intent, booking time, and conversation transcript — all written to your CRM automatically.",
              outcome: "Zero manual data entry",
            },
            {
              time: "11:47 PM",
              channel: "Staff Notification",
              color: "teal",
              title: "Staff alerted",
              detail: "Your team gets a brief: new lead, booked for Tuesday 7am, context summary. No chasing the inbox.",
              outcome: "Clean handoff — staff show up prepared",
            },
            {
              time: "7:00 AM (next day)",
              channel: "Follow-up",
              color: "amber",
              title: "Pre-consultation follow-up sent",
              detail: "Automated message goes out: what to expect, what to bring, and a link to any intake forms.",
              outcome: "Show rate goes up. No-show risk goes down.",
            },
          ].map((step, i) => (
            <RevealSection delay={i * 100} key={step.time + step.title}>
              <div className={`journey-step journey-step-${step.color}`}>
                <div className="journey-step-meta">
                  <span className="journey-time">{step.time}</span>
                  <span className={`journey-channel journey-channel-${step.color}`}>{step.channel}</span>
                </div>
                <div className="journey-step-body">
                  <h3>{step.title}</h3>
                  {step.detail.startsWith('"') ? (
                    <blockquote className="journey-quote">{step.detail}</blockquote>
                  ) : (
                    <p>{step.detail}</p>
                  )}
                  <span className="journey-outcome">
                    <CheckCircle2 aria-hidden="true" size={15} />
                    {step.outcome}
                  </span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
        <RevealSection delay={300}>
          <div className="journey-cta">
            <p>Want to see this running inside your business?</p>
            <a className="button button-primary" href="/contact">
              Book a Demo
              <ArrowRight aria-hidden="true" size={19} />
            </a>
          </div>
        </RevealSection>
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

      {/* Early results — honest, no fake quotes */}
      <section id="proof" className="early-results-section" aria-label="Early results">
        <div className="early-results-inner">
          <RevealSection>
            <div className="early-results-header">
              <p className="eyebrow">Early access</p>
              <h2>Currently in active partnerships. Case studies in progress.</h2>
              <p className="early-results-sub">
                We're selective about early clients because the build quality matters more than the volume. Here's what we're delivering and tracking across every deployment.
              </p>
            </div>
          </RevealSection>
          <div className="early-results-grid">
            {earlyResults.map((r, i) => (
              <RevealSection delay={i * 90} key={r.label}>
                <div className="early-result-card">
                  <strong>{r.metric}</strong>
                  <span>{r.label}</span>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={200}>
            <p className="early-results-note">
              If you're the right fit, you'll be part of a small cohort of founding clients who help shape the product — with direct access to Tom and Mike throughout.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="section pricing-teaser-section" aria-label="Pricing overview">
        <div className="pricing-teaser">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2>Plans starting from $179/month when billed annually.</h2>
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

// ── /privacy page ─────────────────────────────────────────────────────────────
function PrivacyPage() {
  useEffect(() => {
    const m = PAGE_META["/privacy"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Privacy Policy"
        title="How we handle your information."
        subtitle="Last updated: June 2026. We keep this short and plain-English."
      />
      <section className="legal-section" aria-labelledby="privacy-content">
        <div className="legal-inner">
          <h2 id="privacy-content">1. Who we are</h2>
          <p>Corner Systems AI ("Corner Systems", "we", "us") operates cornersystems.vercel.app and provides AI front-office automation services to service businesses across Canada. You can reach us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>

          <h2>2. What we collect</h2>
          <p>When you submit the discovery call form we collect your name, business name, email address, the bottleneck you describe, and your preferred meeting time. We do not collect payment information on this website.</p>
          <p>We may also collect basic analytics (page views, referring URLs) through Vercel's built-in infrastructure. No third-party tracking pixels or advertising cookies are used.</p>

          <h2>3. How we use it</h2>
          <p>We use your contact information solely to respond to your enquiry and, if you become a client, to deliver and support your Corner Systems setup. We do not sell, rent, or share your information with third parties for marketing purposes.</p>

          <h2>4. Storage and security</h2>
          <p>Form submissions are delivered to our team via Resend (a transactional email provider) and stored in a private Google Sheet accessible only to Corner Systems staff. Data is retained for as long as the business relationship is active or as required by law.</p>

          <h2>5. Your rights (PIPEDA)</h2>
          <p>Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) you have the right to access the personal information we hold about you, request corrections, and withdraw consent at any time. To exercise any of these rights, email us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we will respond within 30 days.</p>

          <h2>6. Cookies</h2>
          <p>This site does not use cookies for tracking or advertising. Session state is managed entirely in-browser (React component state) and is not persisted beyond your visit.</p>

          <h2>7. Changes to this policy</h2>
          <p>If we make material changes we will update the "Last updated" date above. Continued use of the site after changes constitutes acceptance of the revised policy.</p>

          <h2>8. Contact</h2>
          <p>Questions about this policy? Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we'll get back to you promptly.</p>
        </div>
      </section>
    </>
  );
}

// ── /terms page ───────────────────────────────────────────────────────────────
function TermsPage() {
  useEffect(() => {
    const m = PAGE_META["/terms"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Terms of Service"
        title="What you agree to when working with us."
        subtitle="Last updated: June 2026. Plain language, no traps."
      />
      <section className="legal-section" aria-labelledby="terms-content">
        <div className="legal-inner">
          <h2 id="terms-content">1. Services</h2>
          <p>Corner Systems provides AI front-office automation services including (but not limited to) AI chatbot configuration, voice agent deployment, missed-call recovery, CRM integration, and follow-up automation for service businesses. The specific scope of each engagement is agreed in writing before any setup begins.</p>

          <h2>2. Payment</h2>
          <p>Services are billed as a one-time setup fee plus a recurring monthly retainer. Setup fees are due before work begins. Monthly fees are billed in advance on a recurring basis. All prices are in CAD unless otherwise stated. Setup fees are non-refundable once work has commenced.</p>

          <h2>3. Client responsibilities</h2>
          <p>You agree to provide accurate business information, timely access to relevant tools and accounts required for setup, and prompt feedback during the onboarding phase. Delays caused by missing access or approvals may extend delivery timelines at no fault of Corner Systems.</p>

          <h2>4. Intellectual property</h2>
          <p>Custom prompt libraries, workflows, and configurations built for your business during the engagement are owned by you upon full payment. Corner Systems retains the right to use general methodologies and non-proprietary techniques in other engagements.</p>

          <h2>5. Limitation of liability</h2>
          <p>Corner Systems is not liable for lost revenue, missed appointments, or business outcomes resulting from third-party platform outages, API changes, or events outside our reasonable control. Our total liability for any claim is limited to the fees paid in the 30 days preceding the claim.</p>

          <h2>6. Termination</h2>
          <p>Either party may terminate the monthly retainer with 30 days written notice. Setup fees already paid are non-refundable. Upon termination, Corner Systems will provide a handoff document covering all active configurations.</p>

          <h2>7. Governing law</h2>
          <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes will be resolved in the courts of Ontario.</p>

          <h2>8. Changes</h2>
          <p>We may update these terms from time to time. Active clients will be notified by email of material changes. Continued use of our services after notice constitutes acceptance.</p>

          <h2>9. Contact</h2>
          <p>Questions about these terms? Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
        </div>
      </section>
    </>
  );
}

// ── /crm page ────────────────────────────────────────────────────────────────
const STAGE_COLORS = {
  found: "#6b7280", researched: "#8b5cf6", emailed_d0: "#3b82f6",
  emailed_d3: "#0ea5e9", emailed_d7: "#06b6d4", called: "#f59e0b",
  replied: "#10b981", discovery_booked: "#22c55e", client: "#16a34a",
  churned: "#ef4444", dead: "#374151",
};

const URGENCY_COLORS = { urgent: "#ef4444", high: "#f59e0b", normal: "#6b7280", low: "#9ca3af", unknown: "#9ca3af" };

function StageBadge({ stage }) {
  return (
    <span style={{
      background: STAGE_COLORS[stage] || "#6b7280",
      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
      padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>{stage?.replace(/_/g, " ")}</span>
  );
}

function TierBadge({ tier }) {
  const t = tier || "unknown";
  return <span className={`crm-tier-badge crm-tier-${t}`}>{t}</span>;
}

function UrgencyBadge({ urgency }) {
  return (
    <span style={{
      background: URGENCY_COLORS[urgency] || "#6b7280",
      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
      padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
    }}>{urgency}</span>
  );
}

const TOUCH_STATUS_COLORS = {
  sent: "#16a34a", pending_review: "#f59e0b", rejected: "#6b7280",
  failed: "#ef4444", received: "#0ea5e9", completed: "#16a34a",
};

function TouchStatusBadge({ status }) {
  return (
    <span style={{
      background: TOUCH_STATUS_COLORS[status] || "#6b7280",
      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
      padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>{status?.replace(/_/g, " ")}</span>
  );
}

function SortHeader({ label, col, sortBy, sortDir, onSort }) {
  const active = sortBy === col;
  return (
    <th className="crm-th-sortable" onClick={() => onSort(col)}>
      {label}{active && <span className="crm-sort-arrow">{sortDir === "asc" ? " ▲" : " ▼"}</span>}
    </th>
  );
}

const CRM_TAB_STORAGE_KEY = "crm:lastTab";

function CrmDashboard() {
  const { getToken } = useAuth();
  const [tab, setTab]             = useState(() => {
    const saved = localStorage.getItem(CRM_TAB_STORAGE_KEY);
    return saved && saved !== "profile" ? saved : "dashboard";
  });
  const [leads, setLeads]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [hotLeads, setHotLeads]   = useState([]);
  const [followups, setFollowups] = useState([]);
  const [drafts, setDrafts]       = useState([]);
  const [activity, setActivity]   = useState([]);
  const [tickets, setTickets]     = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [inbox, setInbox]         = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [inboxRecipient, setInboxRecipient] = useState("");
  const [openMsgId, setOpenMsgId] = useState(null);
  const [search, setSearch]       = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sortBy, setSortBy]       = useState(null);
  const [sortDir, setSortDir]     = useState("asc");
  const [loading, setLoading]     = useState(false);
  const [compose, setCompose]     = useState({ open: false, to_email: "", to_name: "", subject: "", body: "", lead_id: null });
  const [sendStatus, setSendStatus] = useState("");
  const [dbInit, setDbInit]         = useState("");
  const [autoSendDefault, setAutoSendDefault] = useState(false);
  const [sendPolicy, setSendPolicy] = useState(null);
  const [draftEdits, setDraftEdits] = useState({});
  const [draftStatus, setDraftStatus] = useState({});
  const [detailLead, setDetailLead] = useState(null);
  const [detailActivity, setDetailActivity] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  const authFetch = useCallback(async (url, opts = {}) => {
    const token = await getToken();
    return fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
  }, [getToken]);

  useEffect(() => {
    const m = PAGE_META["/crm"];
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", m.canonical);
  }, []);

  // Remember the active section so a page refresh stays put. The "profile"
  // tab depends on transient detailLead state, so it isn't persisted.
  useEffect(() => {
    if (tab !== "profile") localStorage.setItem(CRM_TAB_STORAGE_KEY, tab);
  }, [tab]);

  useEffect(() => {
    authFetch("/api/crm/stats").then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setStatsLoaded(true); })
      .catch(() => setStatsLoaded(true));
  }, [authFetch]);

  useEffect(() => {
    if (tab !== "pipeline") return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter) params.set("stage", stageFilter);
    authFetch(`/api/crm/leads?${params}`).then(r => r.ok ? r.json() : [])
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, [tab, search, stageFilter, authFetch]);

  useEffect(() => {
    if (tab === "tickets")   authFetch("/api/crm/tickets").then(r => r.ok ? r.json() : [])
      .then(d => setTickets(Array.isArray(d) ? d : [])).catch(() => {});
    if (tab === "callbacks") authFetch("/api/crm/callbacks").then(r => r.ok ? r.json() : [])
      .then(d => setCallbacks(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "dashboard") return;
    authFetch("/api/crm/dashboard").then(r => r.ok ? r.json() : null).then(setDashboard).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "hot") return;
    authFetch("/api/crm/hot-leads").then(r => r.ok ? r.json() : [])
      .then(d => setHotLeads(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "followups") return;
    authFetch("/api/crm/followups").then(r => r.ok ? r.json() : [])
      .then(d => setFollowups(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  const refreshDrafts = useCallback(() => {
    authFetch("/api/crm/drafts").then(r => r.ok ? r.json() : [])
      .then(d => setDrafts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [authFetch]);

  useEffect(() => {
    if (tab !== "drafts") return;
    refreshDrafts();
    authFetch("/api/crm/settings").then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setAutoSendDefault(!!d.auto_send_emails_default);
        if (d.ai_send_policy) setSendPolicy(d.ai_send_policy);
      }).catch(() => {});
  }, [tab, authFetch, refreshDrafts]);

  useEffect(() => {
    if (tab !== "activity") return;
    authFetch("/api/crm/activity").then(r => r.ok ? r.json() : [])
      .then(d => setActivity(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "audit") return;
    authFetch("/api/crm/audit").then(r => r.ok ? r.json() : [])
      .then(d => setAuditLog(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "appointments") return;
    authFetch("/api/crm/appointments").then(r => r.ok ? r.json() : [])
      .then(d => setAppointments(Array.isArray(d) ? d : [])).catch(() => {});
  }, [tab, authFetch]);

  useEffect(() => {
    if (tab !== "inbox") return;
    const load = () =>
      authFetch("/api/crm/inbox").then(r => r.ok ? r.json() : [])
        .then(d => setInbox(Array.isArray(d) ? d : [])).catch(() => {});
    load();
    const poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [tab, authFetch]);

  function openLeadDetail(lead) {
    setDetailLead(lead);
    setDetailNotes(lead.notes || "");
    setDetailActivity([]);
    setDetailLoading(true);
    authFetch(`/api/crm/activity?lead_id=${lead.id}`).then(r => r.ok ? r.json() : [])
      .then(d => setDetailActivity(Array.isArray(d) ? d : []))
      .finally(() => setDetailLoading(false));
  }

  function closeLeadDetail() {
    setDetailLead(null);
    setDetailActivity([]);
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const sortedLeads = useMemo(() => {
    if (!sortBy) return leads;
    const arr = [...leads];
    arr.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === "lead_score") {
        av = av ?? -1; bv = bv ?? -1;
      } else if (sortBy === "last_touched") {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = (av ?? "").toString().toLowerCase();
        bv = (bv ?? "").toString().toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [leads, sortBy, sortDir]);

  function applyLeadPatch(id, patch) {
    setLeads(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
    setHotLeads(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
    setFollowups(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
    setDetailLead(d => d && d.id === id ? { ...d, ...patch } : d);
  }

  async function patchLead(id, patch) {
    applyLeadPatch(id, patch);
    const res = await authFetch("/api/crm/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (updated?.id) applyLeadPatch(id, updated);
    }
  }

  async function saveDetailNotes() {
    if (!detailLead) return;
    setDetailSaving(true);
    await patchLead(detailLead.id, { notes: detailNotes });
    setDetailSaving(false);
  }

  function emailLead(l) {
    setCompose({ open: true, to_email: l.email, to_name: l.owner_name || "", subject: "", body: "", lead_id: l.id });
    setTab("compose");
    closeLeadDetail();
  }

  async function toggleAutoSendDefault() {
    const next = !autoSendDefault;
    setAutoSendDefault(next);
    await authFetch("/api/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_send_emails_default: next }),
    });
  }

  async function updateSendPolicy(key, value) {
    const next = { ...(sendPolicy || {}), [key]: value };
    setSendPolicy(next);
    await authFetch("/api/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai_send_policy: { [key]: value } }),
    });
  }

  async function updateLeadAutoSend(id, value) {
    const auto_send_emails = value === "on" ? true : value === "off" ? false : null;
    await patchLead(id, { auto_send_emails });
  }

  async function updateLeadStage(id, stage) {
    await patchLead(id, { stage });
  }

  async function updateLeadTier(id, lead_tier) {
    await patchLead(id, { lead_tier });
  }

  async function draftAction(id, action) {
    setDraftStatus(s => ({ ...s, [id]: action }));
    const edit = draftEdits[id] || {};
    const res = await authFetch("/api/crm/drafts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, subject: edit.subject, body: edit.body }),
    });
    if (res.ok) {
      if (action === "approve" || action === "reject") {
        setDrafts(d => d.filter(x => x.id !== id));
      } else {
        setDraftStatus(s => ({ ...s, [id]: "saved" }));
      }
    } else {
      setDraftStatus(s => ({ ...s, [id]: "error" }));
    }
  }

  async function sendEmail(e) {
    e.preventDefault();
    setSendStatus("sending");
    const token = await getToken();
    const res = await fetch("/api/crm/email-send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(compose),
    });
    if (res.ok) {
      setSendStatus("sent");
      setCompose(c => ({ ...c, subject: "", body: "" }));
    } else {
      const detail = await res.json().catch(() => ({}));
      setSendStatus(`error: ${detail.error || res.statusText}`);
    }
  }

  async function resolveTicket(id) {
    await authFetch("/api/crm/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "resolved" }) });
    setTickets(t => t.map(x => x.id === id ? { ...x, status: "resolved" } : x));
  }

  async function resolveCallback(id) {
    await authFetch("/api/crm/callbacks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "done" }) });
    setCallbacks(c => c.map(x => x.id === id ? { ...x, status: "done" } : x));
  }

  const STAGES = ["found","researched","emailed_d0","emailed_d3","emailed_d7","called","replied","discovery_booked","client","churned","dead"];

  const NAV_GROUPS = [
    {
      label: "Overview",
      items: [
        ["dashboard", "Dashboard", LayoutDashboard],
        ["inbox", "Inbox", MailOpen],
      ],
    },
    {
      label: "Leads & Outreach",
      items: [
        ["hot", "Hot Leads", Flame],
        ["appointments", "Appointments", Calendar],
        ["followups", "Follow-ups", Clock3],
        ["drafts", "Drafts", Inbox],
        ["activity", "Activity", Activity],
        ["audit", "AI Log", BarChart3],
      ],
    },
    {
      label: "Directory",
      items: [
        ["pipeline", "Contacts", Users],
      ],
    },
    {
      label: "Support",
      items: [
        ["tickets", "Tickets", MessageSquareText],
        ["callbacks", "Callbacks", PhoneCall],
      ],
    },
    {
      label: "Tools",
      items: [
        ["compose", "Compose", Send],
      ],
    },
  ];

  const NAV_TABS = NAV_GROUPS.flatMap(g => g.items);

  function navBadge(t) {
    if (t === "inbox")     { const n = stats?.inboxCount ?? 0; return n > 0 ? n : null; }
    if (t === "tickets")   return stats?.openTickets     > 0 ? stats.openTickets : null;
    if (t === "callbacks") return stats?.pendingCallbacks > 0 ? stats.pendingCallbacks : null;
    if (t === "drafts")    { const n = stats?.pendingDrafts  ?? drafts.length;    return n > 0 ? n : null; }
    if (t === "hot")       { const n = stats?.hotLeadsCount  ?? hotLeads.length;  return n > 0 ? n : null; }
    if (t === "followups") { const n = stats?.followupsCount ?? followups.length; return n > 0 ? n : null; }
    return null;
  }

  return (
    <div className="crm-shell">
      {/* Sidebar */}
      <aside className="crm-sidebar">
        <a className="crm-sidebar-brand" href="/" aria-label="Corner Systems home">
          <img className="crm-sidebar-logo" src="/assets/cs-logo-3d.png" alt="" width="32" height="32" />
          <span>Corner Systems</span>
        </a>
        <nav className="crm-nav" aria-label="CRM sections">
          {NAV_GROUPS.map(group => (
            <div className="crm-nav-group" key={group.label}>
              <div className="crm-nav-group-label">{group.label}</div>
              {group.items.map(([t, label, Icon]) => {
                const badge = navBadge(t);
                return (
                  <button key={t} className={`crm-nav-item${tab === t ? " crm-nav-item-active" : ""}`} onClick={() => setTab(t)}>
                    <Icon size={18} aria-hidden="true" />
                    <span className="crm-nav-label">{label}</span>
                    {badge != null && <span className="crm-tab-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="crm-main">
        <header className="crm-topbar">
          <h1 className="crm-page-title">
            {tab === "profile" && detailLead ? detailLead.business_name : NAV_TABS.find(([t]) => t === tab)?.[1]}
          </h1>
          <UserButton afterSignOutUrl="/crm" />
        </header>

        {/* Init DB banner */}
        {statsLoaded && !stats?.total && (
          <div className="crm-init-banner">
            <span>Database tables not set up yet.</span>
            <button className="crm-btn-compose" disabled={dbInit === "loading"} onClick={async () => {
              setDbInit("loading");
              const res = await authFetch("/api/crm/init-db", { method: "POST" });
              setDbInit(res.ok ? "done" : "error");
              if (res.ok) authFetch("/api/crm/stats").then(r => r.json()).then(setStats).catch(() => {});
            }}>
              {dbInit === "loading" ? "Setting up…" : dbInit === "done" ? "✓ Done" : "Set up database"}
            </button>
            {dbInit === "error" && <span style={{color:"#ef4444"}}>Failed — check DATABASE_URL in Vercel.</span>}
          </div>
        )}

      {/* Dashboard */}
      {tab === "dashboard" && (
        <div className="crm-content">
          {!dashboard ? <p className="crm-loading">Loading…</p> : (
            <>
              <div className="crm-dash-grid">
                <div className="crm-dash-card crm-dash-accent-blue">
                  <h3><Mail size={15} /> Emails sent</h3>
                  <div className="crm-dash-row"><span>Today</span><strong>{dashboard.emails.today}</strong></div>
                  <div className="crm-dash-row"><span>Yesterday</span><strong>{dashboard.emails.yesterday}</strong></div>
                  <div className="crm-dash-row"><span>This week</span><strong>{dashboard.emails.week}</strong></div>
                  <div className="crm-dash-row"><span>This month</span><strong>{dashboard.emails.month}</strong></div>
                </div>
                <div className="crm-dash-card crm-dash-accent-teal">
                  <h3><MessageSquareText size={15} /> Replies received</h3>
                  <div className="crm-dash-row"><span>Today</span><strong>{dashboard.replies.today}</strong></div>
                  <div className="crm-dash-row"><span>Yesterday</span><strong>{dashboard.replies.yesterday}</strong></div>
                  <div className="crm-dash-row"><span>This week</span><strong>{dashboard.replies.week}</strong></div>
                  <div className="crm-dash-row"><span>This month</span><strong>{dashboard.replies.month}</strong></div>
                </div>
                <div className="crm-dash-card crm-dash-accent-amber">
                  <h3><UserPlus size={15} /> New leads</h3>
                  <div className="crm-dash-row"><span>Today</span><strong>{dashboard.newLeads.today}</strong></div>
                  <div className="crm-dash-row"><span>Yesterday</span><strong>{dashboard.newLeads.yesterday}</strong></div>
                  <div className="crm-dash-row"><span>This week</span><strong>{dashboard.newLeads.week}</strong></div>
                  <div className="crm-dash-row"><span>This month</span><strong>{dashboard.newLeads.month}</strong></div>
                </div>
                <div className="crm-dash-card crm-dash-accent-green">
                  <h3><DollarSign size={15} /> Business</h3>
                  <div className="crm-dash-row"><span>Total leads</span><strong>{dashboard.stages.reduce((sum, s) => sum + Number(s.count), 0)}</strong></div>
                  <div className="crm-dash-row"><span>Active clients</span><strong>{dashboard.activeClients}</strong></div>
                  <div className="crm-dash-row"><span>MRR</span><strong>${dashboard.mrr.toLocaleString()}</strong></div>
                  <div className="crm-dash-row"><span>Drafts awaiting review</span><strong>{dashboard.pendingDrafts}</strong></div>
                </div>
              </div>

              <h3 className="crm-section-title"><TrendingUp size={16} /> Pipeline funnel</h3>
              <div className="crm-funnel">
                {dashboard.stages.map(s => {
                  const max = Math.max(...dashboard.stages.map(x => x.count), 1);
                  return (
                    <div className="crm-funnel-row" key={s.stage}>
                      <span className="crm-funnel-label"><StageBadge stage={s.stage} /></span>
                      <div className="crm-funnel-bar-wrap">
                        <div className="crm-funnel-bar" style={{ width: `${(s.count / max) * 100}%`, background: STAGE_COLORS[s.stage] || "#6b7280" }} />
                      </div>
                      <span className="crm-funnel-count">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Hot Leads */}
      {tab === "hot" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr>
                <th>Business</th><th>Owner</th><th>Email</th><th>Stage</th>
                <th>Score</th><th>Pain signal</th><th>Last touched</th><th></th>
              </tr></thead>
              <tbody>
                {hotLeads.map(l => (
                  <tr key={l.id}>
                    <td className="crm-td-business"><button className="crm-link-business" onClick={() => openLeadDetail(l)}>{l.business_name}</button></td>
                    <td>{l.owner_name || "—"}</td>
                    <td>{l.email ? <a href={`mailto:${l.email}`}>{l.email}</a> : "—"}</td>
                    <td><StageBadge stage={l.stage} /></td>
                    <td>{l.lead_score ?? "—"}</td>
                    <td>{l.pain_signal || "—"}</td>
                    <td>{l.last_touched ? new Date(l.last_touched).toLocaleDateString() : "—"}</td>
                    <td>
                      {l.email && <button className="crm-btn-mini" onClick={() => emailLead(l)}>Email</button>}
                    </td>
                  </tr>
                ))}
                {hotLeads.length === 0 && <tr><td colSpan={8} className="crm-empty">No hot leads right now.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-ups Due */}
      {tab === "followups" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr>
                <th>Follow-up</th><th>Business</th><th>Owner</th><th>Email</th><th>Stage</th>
                <th>Score</th><th>Last touched</th><th></th>
              </tr></thead>
              <tbody>
                {followups.map(l => (
                  <tr key={l.id}>
                    <td>{l.followup_type === "d3" ? "Day 3" : "Day 7"}</td>
                    <td className="crm-td-business"><button className="crm-link-business" onClick={() => openLeadDetail(l)}>{l.business_name}</button></td>
                    <td>{l.owner_name || "—"}</td>
                    <td>{l.email ? <a href={`mailto:${l.email}`}>{l.email}</a> : "—"}</td>
                    <td><StageBadge stage={l.stage} /></td>
                    <td>{l.lead_score ?? "—"}</td>
                    <td>{l.last_touched ? new Date(l.last_touched).toLocaleDateString() : "—"}</td>
                    <td>
                      {l.email && <button className="crm-btn-mini" onClick={() => emailLead(l)}>Email</button>}
                    </td>
                  </tr>
                ))}
                {followups.length === 0 && <tr><td colSpan={8} className="crm-empty">No follow-ups due.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drafts */}
      {tab === "drafts" && (
        <div className="crm-content">
          <div className="crm-toolbar crm-toolbar-spread">
            <div>{drafts.length} draft{drafts.length === 1 ? "" : "s"} awaiting review</div>
            <label className="crm-toggle-label">
              <input type="checkbox" checked={autoSendDefault} onChange={toggleAutoSendDefault} />
              Auto-send all future emails (skip review)
            </label>
          </div>
          {sendPolicy && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", padding: "10px 14px", marginBottom: 16, background: "#fafbfc", border: "1px solid #eee", borderRadius: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: "#444" }}>AI reply policy:</span>
              {[
                ["reply_interested", "Replies to interested leads"],
                ["reply_question", "Replies to questions"],
                ["followup_due", "Scheduled follow-ups"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, color: "#555" }}>
                  {label}
                  <select
                    value={sendPolicy[key] || "review"}
                    onChange={e => updateSendPolicy(key, e.target.value)}
                    style={{ padding: "3px 6px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12 }}
                  >
                    <option value="review">Require review</option>
                    <option value="auto">Auto-send</option>
                  </select>
                </label>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#555" }}>
                <input
                  type="checkbox"
                  checked={sendPolicy.always_review_pricing !== false}
                  onChange={e => updateSendPolicy("always_review_pricing", e.target.checked)}
                />
                Always review pricing mentions
              </label>
            </div>
          )}
          {drafts.length === 0 && <p className="crm-empty">No drafts awaiting review.</p>}
          {drafts.map(d => {
            const edit = draftEdits[d.id] || {};
            const subject = edit.subject ?? d.subject ?? "";
            const body    = edit.body ?? d.body ?? "";
            const status  = draftStatus[d.id];
            return (
              <div className="crm-draft-card" key={d.id}>
                <div className="crm-draft-header">
                  <div>
                    <strong>{d.business_name}</strong>{d.owner_name ? ` — ${d.owner_name}` : ""}
                    {d.lead_email && <> · <a href={`mailto:${d.lead_email}`}>{d.lead_email}</a></>}
                  </div>
                  <span className="crm-draft-channel">{d.channel?.replace(/_/g, " ")}</span>
                </div>
                <input className="crm-draft-subject" value={subject}
                  onChange={e => setDraftEdits(s => ({ ...s, [d.id]: { ...s[d.id], subject: e.target.value, body } }))} />
                <textarea className="crm-draft-body" rows={8} value={body}
                  onChange={e => setDraftEdits(s => ({ ...s, [d.id]: { ...s[d.id], subject, body: e.target.value } }))} />
                <div className="crm-draft-footer">
                  <button className="crm-btn-mini" disabled={status === "edit"} onClick={() => draftAction(d.id, "edit")}>
                    {status === "edit" ? "Saving…" : "Save edits"}
                  </button>
                  <button className="button button-primary" disabled={status === "approve"} onClick={() => draftAction(d.id, "approve")}>
                    {status === "approve" ? "Sending…" : "Approve & send"}
                  </button>
                  <button className="crm-btn-mini crm-btn-danger" disabled={status === "reject"} onClick={() => draftAction(d.id, "reject")}>
                    {status === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                  {status === "saved" && <span className="crm-status-ok">Saved</span>}
                  {status === "error" && <span className="crm-status-err">Something went wrong — try again.</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr>
                <th>When</th><th>Business</th><th>Type</th><th>Channel</th><th>Status</th><th>Subject</th><th>Tracking</th>
              </tr></thead>
              <tbody>
                {activity.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td className="crm-td-business">{a.business_name}</td>
                    <td>{a.type}</td>
                    <td>{a.channel?.replace(/_/g, " ") || "—"}</td>
                    <td><TouchStatusBadge status={a.status} /></td>
                    <td>{a.subject || a.notes || "—"}</td>
                    <td>
                      {a.opened_at  && <span title={new Date(a.opened_at).toLocaleString()}>👁 Opened</span>}
                      {a.clicked_at && <span title={new Date(a.clicked_at).toLocaleString()}> · 🔗 Clicked</span>}
                      {a.bounced_at && <span title={new Date(a.bounced_at).toLocaleString()} style={{ color: "#ef4444" }}> · ⚠ Bounced</span>}
                      {!a.opened_at && !a.clicked_at && !a.bounced_at && "—"}
                    </td>
                  </tr>
                ))}
                {activity.length === 0 && <tr><td colSpan={7} className="crm-empty">No activity yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline */}
      {tab === "pipeline" && (
        <div className="crm-content">
          <div className="crm-toolbar">
            <input className="crm-search" placeholder="Search business, name, email…" value={search}
              onChange={e => setSearch(e.target.value)} />
            <select className="crm-filter" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <button className="crm-btn-compose" onClick={() => setTab("compose")}>
              <Mail size={15} /> Compose
            </button>
          </div>
          {loading ? <p className="crm-loading">Loading…</p> : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead><tr>
                  <SortHeader label="Business" col="business_name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Owner" col="owner_name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>Email</th>
                  <SortHeader label="Stage" col="stage" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Tier" col="lead_tier" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Score" col="lead_score" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Last touched" col="last_touched" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th>Auto-send</th><th></th>
                </tr></thead>
                <tbody>
                  {sortedLeads.map(l => (
                    <tr key={l.id}>
                      <td className="crm-td-business"><button className="crm-link-business" onClick={() => openLeadDetail(l)}>{l.business_name}</button></td>
                      <td>{l.owner_name || "—"}</td>
                      <td>{l.email ? <a href={`mailto:${l.email}`}>{l.email}</a> : "—"}</td>
                      <td><StageBadge stage={l.stage} /></td>
                      <td><TierBadge tier={l.lead_tier} /></td>
                      <td>{l.lead_score ?? "—"}</td>
                      <td>{l.last_touched ? new Date(l.last_touched).toLocaleDateString() : "—"}</td>
                      <td>
                        <select className="crm-filter" value={l.auto_send_emails === true ? "on" : l.auto_send_emails === false ? "off" : "default"}
                          onChange={e => updateLeadAutoSend(l.id, e.target.value)}>
                          <option value="default">Default</option>
                          <option value="on">Auto-send</option>
                          <option value="off">Review</option>
                        </select>
                      </td>
                      <td>
                        {l.email && <button className="crm-btn-mini" onClick={() => emailLead(l)}>Email</button>}
                      </td>
                    </tr>
                  ))}
                  {sortedLeads.length === 0 && <tr><td colSpan={9} className="crm-empty">No leads found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tickets */}
      {tab === "tickets" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr><th>Business</th><th>Issue</th><th>Category</th><th>Urgency</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ opacity: t.status === "resolved" ? 0.5 : 1 }}>
                    <td className="crm-td-business">{t.business_name}</td>
                    <td>{t.issue_summary}</td>
                    <td>{t.issue_category || "—"}</td>
                    <td><UrgencyBadge urgency={t.urgency} /></td>
                    <td>{t.status}</td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td>{t.status === "open" && <button className="crm-btn-mini" onClick={() => resolveTicket(t.id)}>Resolve</button>}</td>
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan={7} className="crm-empty">No tickets.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Callbacks */}
      {tab === "callbacks" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr><th>Name</th><th>Business</th><th>Phone</th><th>Window</th><th>Summary</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {callbacks.map(c => (
                  <tr key={c.id} style={{ opacity: c.status === "done" ? 0.5 : 1 }}>
                    <td>{c.name || "—"}</td>
                    <td className="crm-td-business">{c.business_name || "—"}</td>
                    <td>{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</td>
                    <td>{c.preferred_callback_window || "—"}</td>
                    <td>{c.summary}</td>
                    <td>{c.status}</td>
                    <td>{c.status === "pending" && <button className="crm-btn-mini" onClick={() => resolveCallback(c.id)}>Done</button>}</td>
                  </tr>
                ))}
                {callbacks.length === 0 && <tr><td colSpan={7} className="crm-empty">No callbacks.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact / company profile (full page) */}
      {tab === "profile" && detailLead && (
        <div className="crm-content">
          <button className="crm-btn-mini crm-back-btn" onClick={() => { setTab("pipeline"); closeLeadDetail(); }}>
            <ArrowLeft size={14} /> Back to Contacts
          </button>
          <div className="crm-profile-page">
            <div className="crm-drawer-badges">
              <StageBadge stage={detailLead.stage} />
              <TierBadge tier={detailLead.lead_tier} />
              {detailLead.lead_score != null && <span className="crm-score-badge">Score {detailLead.lead_score}</span>}
            </div>
            <LeadDetailContent
              lead={detailLead}
              activity={detailActivity}
              loading={detailLoading}
              notes={detailNotes}
              onNotesChange={setDetailNotes}
              onSaveNotes={saveDetailNotes}
              savingNotes={detailSaving}
              onChangeStage={updateLeadStage}
              onChangeTier={updateLeadTier}
              onChangeAutoSend={updateLeadAutoSend}
              onEmail={emailLead}
              STAGES={STAGES}
            />
          </div>
        </div>
      )}

      {/* AI Log */}
      {tab === "audit" && (
        <div className="crm-content">
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
            Every AI-initiated change to the CRM, with the reason it was made.
          </p>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Lead</th>
                  <th>Change</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                      No AI actions logged yet.
                    </td>
                  </tr>
                ) : auditLog.map(a => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 13, color: "#666" }}>
                      {new Date(a.created_at).toLocaleDateString()}{" "}
                      {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: a.actor.startsWith("ai:") ? "#fdf0e8" : "#e8f4fd",
                        color: a.actor.startsWith("ai:") ? "#b45309" : "#1565c0",
                      }}>
                        {a.actor}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.action.replace(/_/g, " ")}</td>
                    <td style={{ fontSize: 13 }}>{a.business_name || (a.lead_id ? `#${a.lead_id}` : "—")}</td>
                    <td style={{ fontSize: 12, color: "#666", maxWidth: 280 }}>
                      {a.before && <div>from: {JSON.stringify(a.before)}</div>}
                      {a.after && <div>to: {JSON.stringify(a.after)}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: "#444", maxWidth: 320 }}>{a.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointments */}
      {tab === "appointments" && (
        <div className="crm-content">
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Attendee</th>
                  <th>Business</th>
                  <th>Kind</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                      No appointments yet. Booked discovery calls land here automatically.
                    </td>
                  </tr>
                ) : appointments.map(a => (
                  <tr key={a.id} style={{ opacity: ["cancelled", "no_show"].includes(a.status) ? 0.55 : 1 }}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {new Date(a.start_at).toLocaleDateString()}{" "}
                        {new Date(a.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {a.timezone && <div style={{ fontSize: 12, color: "#888" }}>{a.timezone}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{a.attendee_name || "—"}</div>
                      {a.attendee_email && <div style={{ fontSize: 12, color: "#666" }}>{a.attendee_email}</div>}
                    </td>
                    <td>{a.lead_business_name || "—"}</td>
                    <td style={{ fontSize: 13, color: "#666" }}>{a.kind}</td>
                    <td style={{ fontSize: 13, color: "#666" }}>{a.source || "—"}</td>
                    <td>
                      <select
                        value={a.status}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
                        onChange={e => {
                          const status = e.target.value;
                          authFetch("/api/crm/appointments", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: a.id, status }),
                          }).then(() => setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status } : x)));
                        }}
                      >
                        {["booked", "completed", "no_show", "cancelled"].map(s => (
                          <option key={s} value={s}>{s.replace("_", "-")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inbox */}
      {tab === "inbox" && (() => {
        const recipients = [...new Set(inbox.map(m => (m.recipient || "").toLowerCase()).filter(Boolean))].sort();
        const visible = inboxRecipient ? inbox.filter(m => (m.recipient || "").toLowerCase() === inboxRecipient) : inbox;
        return (
        <div className="crm-content">
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
            <select
              value={inboxRecipient}
              onChange={e => setInboxRecipient(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, color: "#444" }}
            >
              <option value="">All recipients</option>
              {recipients.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ fontSize: 13, color: "#888" }}>
              {visible.length} message{visible.length === 1 ? "" : "s"} · refreshes automatically
            </span>
          </div>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Subject / Preview</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                      No inbound messages yet.
                    </td>
                  </tr>
                ) : visible.map(m => (
                  <React.Fragment key={m.id}>
                  <tr
                    style={{ cursor: "pointer" }}
                    onClick={() => setOpenMsgId(openMsgId === m.id ? null : m.id)}
                  >
                    <td>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: m.channel === "website_contact" ? "#e8f4fd" : "#edf7ed",
                        color: m.channel === "website_contact" ? "#1565c0" : "#2e7d32",
                      }}>
                        {m.channel === "website_contact" ? "Contact Form" : "Reply"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.business_name || "—"}</div>
                      {m.lead_email && <div style={{ fontSize: 12, color: "#666" }}>{m.lead_email}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: "#666" }}>{m.recipient || "—"}</td>
                    <td>
                      <div style={{ fontSize: 14 }}>{m.subject || "(no subject)"}</div>
                      {m.body && (
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2, maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.body}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "#666", fontSize: 13 }}>
                      {new Date(m.created_at).toLocaleDateString()}{" "}
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                  {openMsgId === m.id && (
                    <tr>
                      <td colSpan={5} style={{ background: "#fafbfc", padding: "16px 20px" }}>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                          From: {m.lead_email || m.business_name || "—"} · To: {m.recipient || "—"} ·{" "}
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{m.subject || "(no subject)"}</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.55, color: "#333", maxWidth: 720 }}>
                          {m.body || "(no content)"}
                        </div>
                        {m.lead_id && (
                          <button
                            style={{ marginTop: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", fontSize: 13, cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLeadDetail({ id: m.lead_id, business_name: m.business_name, owner_name: m.owner_name, email: m.lead_email, stage: m.stage, lead_tier: m.lead_tier, notes: "" });
                            }}
                          >
                            Open lead
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* Compose */}
      {tab === "compose" && (
        <div className="crm-content">
          <div className="crm-compose-panel">
            <h2 className="crm-compose-title">Compose email</h2>
            <form className="crm-compose-form" onSubmit={sendEmail}>
              <label>To email<input required value={compose.to_email} onChange={e => setCompose(c => ({ ...c, to_email: e.target.value }))} placeholder="owner@business.com" /></label>
              <label>To name<input value={compose.to_name} onChange={e => setCompose(c => ({ ...c, to_name: e.target.value }))} placeholder="Jane Smith" /></label>
              <label>Subject<input required value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Quick question for…" /></label>
              <label>Body<textarea required rows={10} value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} placeholder="Write your email here…" /></label>
              <div className="crm-compose-footer">
                <span className="crm-compose-from">From: tmorris@cornersystems.co</span>
                <button className="button button-primary" type="submit" disabled={sendStatus === "sending"}>
                  {sendStatus === "sending" ? "Sending…" : <><Mail size={16} /> Send</>}
                </button>
              </div>
              {sendStatus === "sent" && <p className="crm-compose-status crm-status-ok">Sent.</p>}
              {sendStatus.startsWith("error") && <p className="crm-compose-status crm-status-err">Failed to send — {sendStatus.replace("error: ", "")}</p>}
            </form>
          </div>
        </div>
      )}
      </div>

      {detailLead && tab !== "profile" && (
        <LeadDetailDrawer
          lead={detailLead}
          activity={detailActivity}
          loading={detailLoading}
          notes={detailNotes}
          onNotesChange={setDetailNotes}
          onSaveNotes={saveDetailNotes}
          savingNotes={detailSaving}
          onClose={closeLeadDetail}
          onViewFull={() => setTab("profile")}
          onChangeStage={updateLeadStage}
          onChangeTier={updateLeadTier}
          onChangeAutoSend={updateLeadAutoSend}
          onEmail={emailLead}
          STAGES={STAGES}
        />
      )}
    </div>
  );
}

function LeadDetailContent({ lead, activity, loading, notes, onNotesChange, onSaveNotes, savingNotes, onChangeStage, onChangeTier, onChangeAutoSend, onEmail, STAGES }) {
  const tools = (lead.detected_tools || "").split(",").map(s => s.trim()).filter(Boolean);
  const website = lead.website_url || lead.website;
  const igHandle = lead.instagram?.replace(/^@/, "");

  return (
    <>
      {lead.email && (
        <button className="crm-btn-compose" onClick={() => onEmail(lead)}>
          <Mail size={15} /> Email {lead.owner_name || lead.business_name}
        </button>
      )}

      <section className="crm-drawer-section">
        <h3>Contact</h3>
        <div className="crm-drawer-grid">
          <div><span className="crm-drawer-label">Owner</span><span>{lead.owner_name || "—"}</span></div>
          <div><span className="crm-drawer-label">Email</span><span>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</span></div>
          <div><span className="crm-drawer-label">Phone</span><span>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : "—"}</span></div>
          <div><span className="crm-drawer-label">Location</span><span>{[lead.city, lead.state].filter(Boolean).join(", ") || "—"}</span></div>
          <div><span className="crm-drawer-label">Niche</span><span>{lead.niche || "—"}</span></div>
          <div><span className="crm-drawer-label">Source</span><span>{lead.source || "—"}</span></div>
        </div>
        {(website || igHandle || lead.google_maps) && (
          <div className="crm-drawer-links">
            {website && <a href={website} target="_blank" rel="noreferrer"><Globe size={14} /> Website <ExternalLink size={12} /></a>}
            {igHandle && <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer"><Instagram size={14} /> Instagram <ExternalLink size={12} /></a>}
            {lead.google_maps && <a href={lead.google_maps} target="_blank" rel="noreferrer"><MapPin size={14} /> Maps <ExternalLink size={12} /></a>}
          </div>
        )}
      </section>

      {lead.pain_signal && (
        <section className="crm-drawer-section">
          <h3>Pain signal</h3>
          <p className="crm-drawer-note">{lead.pain_signal}</p>
        </section>
      )}

      {(lead.has_website || lead.has_chatbot || lead.has_voice_agent || lead.has_booking || tools.length > 0 || lead.score_reason) && (
        <section className="crm-drawer-section">
          <h3>Capabilities detected</h3>
          <div className="crm-drawer-chips">
            {lead.has_website && <span className="crm-chip">Website</span>}
            {lead.has_chatbot && <span className="crm-chip">Chatbot</span>}
            {lead.has_voice_agent && <span className="crm-chip">Voice agent</span>}
            {lead.has_booking && <span className="crm-chip">Online booking</span>}
            {tools.map(t => <span className="crm-chip" key={t}>{t}</span>)}
          </div>
          {lead.score_reason && <p className="crm-drawer-note">{lead.score_reason}</p>}
        </section>
      )}

      <section className="crm-drawer-section">
        <h3>Status</h3>
        <div className="crm-drawer-grid crm-drawer-grid-controls">
          <label>
            <span className="crm-drawer-label">Stage</span>
            <select className="crm-filter" value={lead.stage} onChange={e => onChangeStage(lead.id, e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label>
            <span className="crm-drawer-label">Tier</span>
            <select className="crm-filter" value={lead.lead_tier || "unknown"} onChange={e => onChangeTier(lead.id, e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="hot">Hot</option>
            </select>
          </label>
          <label>
            <span className="crm-drawer-label">Auto-send</span>
            <select className="crm-filter" value={lead.auto_send_emails === true ? "on" : lead.auto_send_emails === false ? "off" : "default"}
              onChange={e => onChangeAutoSend(lead.id, e.target.value)}>
              <option value="default">Default</option>
              <option value="on">Auto-send</option>
              <option value="off">Review</option>
            </select>
          </label>
        </div>
      </section>

      <section className="crm-drawer-section">
        <h3><StickyNote size={15} /> Notes</h3>
        <textarea className="crm-drawer-notes" rows={4} value={notes}
          onChange={e => onNotesChange(e.target.value)} placeholder="Internal notes about this contact…" />
        <button className="crm-btn-mini" disabled={savingNotes} onClick={onSaveNotes}>
          {savingNotes ? "Saving…" : "Save notes"}
        </button>
      </section>

      <section className="crm-drawer-section">
        <h3><Activity size={15} /> Activity history</h3>
        {loading ? <p className="crm-loading">Loading…</p> : activity.length === 0 ? (
          <p className="crm-empty">No activity yet.</p>
        ) : (
          <ul className="crm-drawer-timeline">
            {activity.map(a => (
              <li key={a.id}>
                <div className="crm-timeline-head">
                  <TouchStatusBadge status={a.status} />
                  <span className="crm-timeline-date">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div className="crm-timeline-body">
                  <strong>{a.type}</strong>{a.channel ? ` · ${a.channel.replace(/_/g, " ")}` : ""}
                  {a.subject && <div>{a.subject}</div>}
                  {a.notes && <div className="crm-timeline-notes">{a.notes}</div>}
                  {(a.opened_at || a.clicked_at || a.bounced_at) && (
                    <div className="crm-timeline-tracking">
                      {a.opened_at && <span title={new Date(a.opened_at).toLocaleString()}>👁 Opened</span>}
                      {a.clicked_at && <span title={new Date(a.clicked_at).toLocaleString()}>🔗 Clicked</span>}
                      {a.bounced_at && <span style={{ color: "#ef4444" }} title={new Date(a.bounced_at).toLocaleString()}>⚠ Bounced</span>}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function LeadDetailDrawer({ lead, activity, loading, notes, onNotesChange, onSaveNotes, savingNotes, onClose, onViewFull, onChangeStage, onChangeTier, onChangeAutoSend, onEmail, STAGES }) {
  if (!lead) return null;

  return (
    <div className="crm-drawer-overlay" onClick={onClose}>
      <aside className="crm-drawer" onClick={e => e.stopPropagation()}>
        <div className="crm-drawer-header">
          <div>
            <h2 className="crm-drawer-title">{lead.business_name}</h2>
            <div className="crm-drawer-badges">
              <StageBadge stage={lead.stage} />
              {lead.lead_tier && lead.lead_tier !== "unknown" && (
                <span className={`crm-tier-badge crm-tier-${lead.lead_tier}`}>{lead.lead_tier}</span>
              )}
              {lead.lead_score != null && <span className="crm-score-badge">Score {lead.lead_score}</span>}
            </div>
          </div>
          <div className="crm-drawer-header-actions">
            <button className="crm-drawer-close" onClick={onViewFull} aria-label="Open full profile" title="Open full profile"><Maximize2 size={18} /></button>
            <button className="crm-drawer-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
          </div>
        </div>

        <div className="crm-drawer-body">
          <LeadDetailContent
            lead={lead} activity={activity} loading={loading} notes={notes}
            onNotesChange={onNotesChange} onSaveNotes={onSaveNotes} savingNotes={savingNotes}
            onChangeStage={onChangeStage} onChangeTier={onChangeTier} onChangeAutoSend={onChangeAutoSend}
            onEmail={onEmail} STAGES={STAGES}
          />
        </div>
      </aside>
    </div>
  );
}

function CrmPage() {
  // The 11Labs voice widget is mounted globally in index.html for the public
  // site; hide it while inside the CRM so it doesn't float over the UI.
  useEffect(() => {
    const widget = document.querySelector("elevenlabs-convai");
    if (!widget) return;
    const prevDisplay = widget.style.display;
    widget.style.display = "none";
    return () => { widget.style.display = prevDisplay; };
  }, []);

  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="crm-signin-wrap">
        <p>CRM sign-in is not configured. Set VITE_CLERK_PUBLISHABLE_KEY in website/.env.local and restart the dev server.</p>
      </div>
    );
  }

  return (
    <>
      <SignedIn><CrmDashboard /></SignedIn>
      <SignedOut>
        <div className="crm-signin-wrap">
          <SignIn routing="hash" forceRedirectUrl="/crm" />
        </div>
      </SignedOut>
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = window.location.pathname;

  const closeMenu = () => setMenuOpen(false);

  const currentPage =
    pathname === "/pricing"    ? "pricing"    :
    pathname === "/services"   ? "services"   :
    pathname === "/industries" ? "industries" :
    pathname === "/team"       ? "team"       :
    pathname === "/contact"    ? "contact"    :
    pathname === "/privacy"    ? "privacy"    :
    pathname === "/terms"      ? "terms"      :
    pathname === "/crm"        ? "crm"        :
    "home";

  if (currentPage === "crm") {
    return <CrmPage />;
  }

  return (
    <div className="site-shell">
      {/* Header */}
      <header className="site-header">
        <div className="nav-inner">
          <div className="nav-left-group">
            <a className="brand" href="/" aria-label="Corner Systems home">
              <img
                className="cs-logo-img"
                src="/assets/cs-logo-3d.png"
                alt=""
                width="42"
                height="42"
              />
              <span className="brand-wordmark">
                <span className="brand-name">Corner&nbsp;Systems</span>
              </span>
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
          </div>

          <div className="nav-right-group">
            <a className="header-cta" href="/contact">
              Book Discovery
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>

          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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
        {currentPage === "pricing"    && <PricingPage />}
        {currentPage === "services"   && <ServicesPage />}
        {currentPage === "industries" && <IndustriesPage />}
        {currentPage === "team"       && <TeamPage />}
        {currentPage === "contact"    && <ContactPage />}
        {currentPage === "privacy"    && <PrivacyPage />}
        {currentPage === "terms"      && <TermsPage />}
        {currentPage === "home"       && <HomePage />}
      </main>

      <footer className="site-footer">
        <div className="footer-brand-block">
          <a className="brand footer-brand" href="/" aria-label="Corner Systems home">
            <img
              className="cs-logo-img"
              src="/assets/cs-logo-3d.png"
              alt="Corner Systems AI"
              width="52"
              height="52"
            />
          </a>
          <p className="footer-tagline">Corner Systems<span>We're in your corner.</span></p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        <div className="footer-legal" aria-label="Legal links">
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms">Terms of Service</a>
          <span aria-hidden="true">·</span>
          <span>© {new Date().getFullYear()} Corner Systems AI</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
