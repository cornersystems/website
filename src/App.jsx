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

const navItems = [
  { label: "Coverage", href: "#coverage" },
  { label: "Services", href: "#services" },
  { label: "Results", href: "#proof" },
  { label: "Pricing", href: "#pricing" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

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
    title: "Fitness & Combat",
    text: "Gyms and studios that live on trials, memberships, and fast response.",
    items: ["MMA & Muay Thai gyms", "BJJ academies", "Boxing gyms", "Strength & conditioning", "Personal training studios", "Fitness studios"],
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
  {
    icon: PhoneCall,
    title: "Calls",
    text: "Answered with the right questions and the right tone.",
  },
  {
    icon: MessageSquareText,
    title: "Texts + DMs",
    text: "Fast, consistent replies where prospects already are.",
  },
  {
    icon: Mail,
    title: "Email",
    text: "Clean intake and follow-up without inbox drift.",
  },
  {
    icon: Calendar,
    title: "Booking",
    text: "Interest moves toward a real next step.",
  },
];

const benefits = [
  "Channels covered",
  "Leads qualified",
  "Next steps tracked",
  "Follow-up handled",
];

const proofPoints = [
  {
    title: "Operator-ready",
    text: "Built for busy days, not perfect conditions.",
  },
  {
    title: "Discreet",
    text: "Private client details stay private.",
  },
  {
    title: "Hands-on",
    text: "Mapped, built, tested, and refined with you.",
  },
];

const process = [
  {
    step: "01",
    title: "Review",
    text: "Where do leads come from, who handles them, and what slips?",
  },
  {
    step: "02",
    title: "Map",
    text: "Define intake, routing, booking, follow-up, alerts, and ownership.",
  },
  {
    step: "03",
    title: "Build",
    text: "Set up the front office flow and test realistic customer scenarios.",
  },
  {
    step: "04",
    title: "Improve",
    text: "Tighten weak points as the business learns what converts.",
  },
];

const snapshots = [
  { value: "24/7", label: "coverage" },
  { value: "All", label: "channels" },
  { value: "Zero", label: "leads dropped" },
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
  { id: "fitness", label: "Fitness & Studios" },
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
      { label: "Monthly price", values: ["$149", "$299", "$499"], strong: true },
      { label: "Setup fee", values: ["$497", "$997", "$1,497"], strong: true },
      { label: "AI chatbot", values: [true, true, true] },
      { label: "Lead capture", values: [true, true, true] },
      { label: "FAQ answers", values: [true, true, true] },
      { label: "Lead qualification", values: [false, true, true] },
      { label: "CRM integration", values: [false, true, true] },
      { label: "AI voice agent", values: [false, false, true] },
      { label: "Missed-call recovery", values: [false, false, true] },
      { label: "Included usage", values: ["100 chats", "250 chats", "250 chats + 200 voice min"] },
      { label: "Overages", values: ["$0.50/chat", "$0.40/chat", "$0.40/chat + $0.20/min"] },
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
      { label: "Monthly price", values: ["$299", "$549", "$899"], strong: true },
      { label: "Setup fee", values: ["$997", "$1,997", "$2,997"], strong: true },
      { label: "AI chatbot + web intake", values: [true, true, true] },
      { label: "New-patient lead capture", values: [true, true, true] },
      { label: "FAQ & insurance answers", values: [true, true, true] },
      { label: "Patient qualification", values: [false, true, true] },
      { label: "CRM / EMR integration", values: [false, true, true] },
      { label: "Booking + reminders", values: [false, true, true] },
      { label: "AI voice agent", values: [false, false, true] },
      { label: "Missed-call recovery", values: [false, false, true] },
      { label: "Included usage", values: ["250 chats", "400 chats", "400 chats + 500 voice min"] },
      { label: "Overages", values: ["$0.40/chat", "$0.35/chat", "$0.35/chat + $0.20/min"] },
    ],
  },
};

// Replace these with real client quotes before launch
const testimonials = [
  {
    quote: "We were losing leads every week and didn't even know it. Within two weeks of going live the front office was running cleaner than it ever had with a full-time receptionist.",
    name: "Owner",
    business: "MMA Gym, Texas",
    stars: 5,
  },
  {
    quote: "Every DM, every missed call, every form submission — it all gets followed up now. My staff just shows up to the consultations.",
    name: "Head Coach & Owner",
    business: "BJJ Academy, Florida",
    stars: 5,
  },
  {
    quote: "The setup process was painless and they actually learned how we operate before building anything. It feels like our system, not a generic template.",
    name: "Director",
    business: "Fitness Studio, California",
    stars: 5,
  },
];

const faqs = [
  {
    question: "Do we need to replace our current CRM?",
    answer:
      "Not necessarily. If your current tools work, we can often build around them.",
  },
  {
    question: "Do you only work with gyms?",
    answer:
      "No. Gyms are a strong fit, but the system works for any business that depends on inbound inquiries and follow-up.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Pricing depends on workflow complexity, volume, tools, and scope. We keep it practical.",
  },
  {
    question: "What happens after we reach out?",
    answer:
      "We review the current lead path, identify friction, and recommend the cleanest next step.",
  },
];

const initialForm = {
  name: "",
  business: "",
  email: "",
  bottleneck: "",
  preferredTime: "",
};

const consoleFeed = [
  { icon: PhoneCall, label: "Inbound call — MMA gym", status: "Handled", color: "teal" },
  { icon: MessageSquareText, label: "Instagram DM", status: "Qualified", color: "teal" },
  { icon: Calendar, label: "Trial booking request", status: "Confirmed", color: "amber" },
  { icon: Mail, label: "Website contact form", status: "Replied", color: "teal" },
  { icon: PhoneCall, label: "Missed call recovery", status: "Recovered", color: "amber" },
  { icon: MessageSquareText, label: "Facebook DM", status: "Qualified", color: "teal" },
  { icon: Calendar, label: "Follow-up sequence", status: "Armed", color: "blue" },
  { icon: Mail, label: "Email inquiry", status: "Handled", color: "teal" },
];

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

function App() {
  const { rows: consoleRows, flash: consoleFlash } = useLiveConsole();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pricingAudience, setPricingAudience] = useState("fitness");
  const [formData, setFormData] = useState(initialForm);
  const [formStatus, setFormStatus] = useState("idle"); // idle | sending | sent | error

  const pricingPlans = pricingByAudience[pricingAudience].plans;
  const pricingRows = pricingByAudience[pricingAudience].rows;

  const closeMenu = () => setMenuOpen(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function submitLead(event) {
    event.preventDefault();
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
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Corner Systems home">
          <span className="brand-mark">CS</span>
          <span>
            <strong>Corner Systems</strong>
            <small>Lead infrastructure for service businesses</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="#contact">
          Book Discovery
          <ArrowRight aria-hidden="true" size={18} />
        </a>

        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
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
        <section className="hero-section" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src="/assets/cs-hero-wide.png"
            alt="Corner Systems — professional front office coverage for combat sports and fitness businesses"
            fetchpriority="high"
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
                <a className="button button-primary" href="#contact">
                  Book a Discovery Call
                  <ArrowRight aria-hidden="true" size={20} />
                </a>
                <a className="button button-secondary" href="#coverage">
                  See Coverage
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
                <span>All channels covered · Zero dropped</span>
              </div>
            </div>
          </div>
        </section>

        <section className="snapshot-band" aria-label="System snapshot">
          <div className="snapshot-inner">
            <SnapshotCounter value="24" suffix="/7" label="coverage" />
            <SnapshotCounter value="100" suffix="%" label="channels covered" />
            <SnapshotCounter value="0" suffix="" label="leads dropped" />
          </div>
        </section>

        <section id="coverage" className="coverage-band">
          <RevealSection className="coverage-inner">
            <div>
              <p className="eyebrow">Every channel, one standard</p>
              <h2>Every inquiry gets a professional response.</h2>
              <p className="section-copy">
                Your front office should not depend on who is free, stressed, or remembering to follow up. Every serious prospect gets a clean path from first contact to next step.
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

        <section className="section verticals-section" aria-label="Industries served">
          <div className="section-heading">
            <p className="eyebrow">Built for high-value service businesses</p>
            <h2>One standard of coverage. Every industry that lives on inquiries.</h2>
            <p className="section-copy">
              If your business depends on people reaching out — and a missed one costs you real money — Corner Systems keeps the front door covered.
            </p>
          </div>
          <div className="vertical-grid">
            {marketGroups.map(({ icon: Icon, title, text, items }, i) => (
              <RevealSection delay={i * 110} key={title}>
                <article className="vertical-card">
                  <span className="vertical-icon">
                    <Icon aria-hidden="true" size={24} />
                  </span>
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

        <section id="services" className="section services-section">
          <div className="section-heading">
            <p className="eyebrow">What we build</p>
            <h2>Simple pieces that make the whole business sharper.</h2>
            <p className="section-copy">
              The goal is not more software. The goal is a business that answers well, books cleanly, follows up consistently, and knows where every lead stands.
            </p>
          </div>

          <div className="service-grid">
            {services.map(({ icon: Icon, title, text }, i) => (
              <RevealSection delay={i * 100} key={title}>
                <article className="service-card">
                  <span className="service-icon">
                    <Icon aria-hidden="true" size={24} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              </RevealSection>
            ))}
          </div>
        </section>

        <section className="section proof-section" aria-label="Operational value">
          <div className="proof-media">
            <div className="metric-strip">
              <span>Lead Source</span>
              <strong>Website Chat</strong>
            </div>
            <div className="metric-line">
              <span>Consultation booked</span>
              <strong>8:15 PM</strong>
            </div>
            <div className="metric-line">
              <span>Reminder sent</span>
              <strong>Next morning</strong>
            </div>
            <div className="metric-line">
              <span>Staff handoff</span>
              <strong>Assigned</strong>
            </div>
          </div>

          <div>
            <p className="eyebrow">The result</p>
            <h2>A front office that protects every opportunity.</h2>
            <p className="section-copy">
              Prospects get a sharp first impression. Staff get clean handoffs. Owners get visibility. Follow-up happens even when the day gets busy.
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

        <section className="section reel-section" aria-label="See it in action">
          <RevealSection>
            <div className="reel-heading">
              <p className="eyebrow">See it in action</p>
              <h2>What a covered front office looks like.</h2>
              <p className="section-copy">
                Every inquiry — call, DM, form, or message — captured, qualified, and booked the moment it lands.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={120}>
            <div className="reel-frame">
              <video
                className="reel-video"
                src="/assets/cs-reel.mp4"
                poster="/assets/cs-hero-wide.png"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="reel-glow" aria-hidden="true" />
              <div className="reel-overlay" aria-hidden="true">
                <div className="reel-chip">
                  <PhoneCall size={15} /> Inbound call <strong>Handled</strong>
                </div>
                <div className="reel-chip">
                  <MessageSquareText size={15} /> New DM <strong>Qualified</strong>
                </div>
                <div className="reel-chip">
                  <Calendar size={15} /> Booking <strong>Confirmed</strong>
                </div>
              </div>
            </div>
          </RevealSection>
        </section>

        <section id="pricing" className="section pricing-section" aria-labelledby="pricing-title">
          <div className="pricing-heading">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2 id="pricing-title">Simple packages for clearer front-office coverage.</h2>
              <p className="section-copy">
                Start with chat and lead capture, add qualification and CRM handoff, or move into full AI receptionist coverage with voice and missed-call recovery.
              </p>
            </div>
            <div className="pricing-kicker" aria-label="Pricing summary">
              <strong>We&apos;re in your corner.</strong>
              <span>AI receptionists, AI chatbots, and lead capture systems built around your workflow.</span>
            </div>
          </div>

          <div className="pricing-toggle" role="tablist" aria-label="Choose your industry">
            {pricingAudiences.map((aud) => (
              <button
                key={aud.id}
                type="button"
                role="tab"
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
                <a className="button button-secondary pricing-button" href="#contact">
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
                    <th className={`plan-head plan-head-${plan.accent}`} scope="col" key={plan.id}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td data-label={pricingPlans[index].name} key={`${row.label}-${pricingPlans[index].id}`}>
                        {value === true && (
                          <span className="pricing-check" aria-label="Included">
                            <CheckCircle2 aria-hidden="true" size={18} />
                          </span>
                        )}
                        {value === false && <span className="pricing-dash">-</span>}
                        {typeof value === "string" && (
                          <span className={row.strong ? "pricing-value pricing-value-strong" : "pricing-value"}>
                            {value}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cta-band" aria-label="Mid-page call to action">
          <div className="cta-band-inner">
            <div>
              <h2>Ready to stop losing leads?</h2>
              <p>Book a free 20-minute discovery call. We'll map your current intake flow and show you where the gaps are.</p>
            </div>
            <a className="button button-primary" href="#contact">
              Book a Discovery Call
              <ArrowRight aria-hidden="true" size={20} />
            </a>
          </div>
        </section>

        <section id="process" className="section process-section">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Clean, direct, and built around your actual workflow.</h2>
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

        <section className="social-section" aria-label="As seen on social">
          <RevealSection>
            <div className="social-heading">
              <p className="eyebrow">As seen on social</p>
              <h2>Built for the feed, not just the website.</h2>
            </div>
          </RevealSection>
          <div className="social-grid">
            {[
              { src: "/assets/cs-story-916.png",   label: "Instagram Story",  ratio: "9:16" },
              { src: "/assets/cs-hero-wide.png",    label: "Facebook Banner",  ratio: "16:9" },
              { src: "/assets/cs-square-11.png",    label: "Instagram Feed",   ratio: "1:1"  },
              { src: "/assets/cs-story-pain.png",   label: "Story — Pain Point", ratio: "9:16" },
              { src: "/assets/cs-octagon-ad.png",   label: "Facebook Ad",      ratio: "16:9" },
              { src: "/assets/cs-before-after.png", label: "Before / After",   ratio: "1:1"  },
            ].map((item, i) => (
              <RevealSection delay={i * 70} key={item.src}>
                <div className="social-card">
                  <img src={item.src} alt={item.label} loading="lazy" />
                  <div className="social-card-label">
                    <span>{item.label}</span>
                    <span className="social-ratio">{item.ratio}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </section>

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
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} aria-hidden="true" size={14} />
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

        <section id="contact" className="section contact-section">
          <div className="contact-copy">
            <p className="eyebrow">Start clean</p>
            <h2>Book a discovery call.</h2>
            <p className="section-copy">
              Tell us where inquiries come from and what feels inconsistent. We will use that context to map the cleanest next step on the call.
            </p>
            <div className="trust-row" aria-label="Trust points">
              <span>
                <ShieldCheck aria-hidden="true" size={18} />
                Owner-first workflows
              </span>
              <span>
                <Clock3 aria-hidden="true" size={18} />
                Practical scope
              </span>
              <span>
                <Target aria-hidden="true" size={18} />
                Conversion focused
              </span>
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
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top" aria-label="Corner Systems home">
          <span className="brand-mark">CS</span>
          <span>
            <strong>Corner Systems</strong>
            <small>Digital systems for lead-driven businesses</small>
          </span>
        </a>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </footer>
    </div>
  );
}

export default App;
