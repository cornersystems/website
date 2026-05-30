import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  Menu,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Target,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

const contactEmail = "hello@cornersystems.ai";

const navItems = [
  { label: "Coverage", href: "#coverage" },
  { label: "Services", href: "#services" },
  { label: "Proof", href: "#proof" },
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

const markets = [
  "MMA gyms",
  "Muay Thai gyms",
  "BJJ academies",
  "Boxing gyms",
  "Strength and conditioning gyms",
  "Personal trainers",
  "Fitness studios",
  "Recovery clinics",
  "Physio, chiro, and sports medicine",
  "Supplement brands",
  "Fightwear brands",
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
  "Every channel covered",
  "Every serious lead qualified",
  "Every next step tracked",
  "Every follow-up handled",
  "One clean pipeline",
  "No bad days at the front desk",
];

const proofPoints = [
  {
    title: "Built for busy operators",
    text: "Designed around real front-desk pressure, not ideal conditions.",
  },
  {
    title: "Discreet by default",
    text: "We can explain patterns and outcomes without exposing private client details.",
  },
  {
    title: "Founder-led implementation",
    text: "We map the workflow, build the system, test it, and keep tightening the handoff.",
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
  { value: "1", label: "pipeline" },
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
  phone: "",
  website: "",
  bottleneck: "",
  preferredTime: "",
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [formStatus, setFormStatus] = useState("idle");

  const closeMenu = () => setMenuOpen(false);
  const encodedLead = encodeURIComponent(
    [
      `Name: ${formData.name}`,
      `Business: ${formData.business}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone}`,
      `Website: ${formData.website}`,
      `Biggest bottleneck: ${formData.bottleneck}`,
      `Preferred follow-up time: ${formData.preferredTime}`,
    ].join("\n"),
  );
  const mailtoFallback = `mailto:${contactEmail}?subject=${encodeURIComponent(
    `New Corner Systems inquiry from ${formData.business || formData.name || "website"}`,
  )}&body=${encodedLead}`;

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function submitLead(event) {
    event.preventDefault();
    setFormStatus("sent");
    window.location.href = mailtoFallback;
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
          Get a Review
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
            src="/assets/combat-gym-systems-hero.png"
            alt="A modern combat sports gym with digital operations lighting"
          />
          <div className="hero-overlay" />

          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow">Professional front-office coverage</p>
              <h1 id="hero-title">
                <span>Corner</span>
                <span>Systems</span>
              </h1>
              <p className="hero-lede">
                We make sure every call, text, email, message, and DM is handled with the same professional standard every day.
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
                  Get a Lead System Review
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
              </div>
              <div className="console-row">
                <PhoneCall aria-hidden="true" size={19} />
                <span>Inbound call</span>
                <strong>Handled</strong>
              </div>
              <div className="console-row">
                <MessageSquareText aria-hidden="true" size={19} />
                <span>New DM</span>
                <strong>Qualified</strong>
              </div>
              <div className="console-row">
                <Calendar aria-hidden="true" size={19} />
                <span>Follow-up sequence</span>
                <strong>Armed</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="snapshot-band" aria-label="System snapshot">
          <div className="snapshot-inner">
            {snapshots.map((item) => (
              <div className="snapshot-item" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="coverage" className="section coverage-section">
          <div>
            <p className="eyebrow">Every channel, one standard</p>
            <h2>Every inquiry gets a professional response.</h2>
            <p className="section-copy">
              Your front office should not depend on who is free, stressed, or remembering to follow up. Every serious prospect gets a clean path from first contact to next step.
            </p>
          </div>
          <div className="channel-grid" aria-label="Channels covered">
            {channels.map(({ icon: Icon, title, text }) => (
              <article className="channel-card" key={title}>
                <Icon aria-hidden="true" size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section market-section">
          <div className="compact-heading">
            <p className="eyebrow">Built for lead-driven operators</p>
            <h2>Especially useful when every new inquiry matters.</h2>
          </div>
          <div className="market-grid" aria-label="Businesses served">
            {markets.map((market) => (
              <div className="market-pill" key={market}>
                <CheckCircle2 aria-hidden="true" size={18} />
                <span>{market}</span>
              </div>
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
            {services.map(({ icon: Icon, title, text }) => (
              <article className="service-card" key={title}>
                <span className="service-icon">
                  <Icon aria-hidden="true" size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="proof" className="section proof-section" aria-label="Operational value">
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
            <div className="proof-grid" aria-label="Trust points">
              {proofPoints.map((point) => (
                <article className="proof-card" key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </article>
              ))}
            </div>
            <div className="benefit-grid">
              {benefits.map((benefit) => (
                <span className="benefit-item" key={benefit}>
                  <Zap aria-hidden="true" size={16} />
                  {benefit}
                </span>
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

        <section id="process" className="section process-section">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>Clean, direct, and built around your actual workflow.</h2>
          </div>

          <div className="process-grid">
            {process.map((item) => (
              <article className="process-card" key={item.step}>
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
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
            <h2>Find the leaks in your current front office.</h2>
            <p className="section-copy">
              Tell us where inquiries come from and what feels inconsistent. We will use that context to recommend the cleanest next step.
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
              Phone
              <input name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={updateField} />
            </label>
            <label>
              Website
              <input name="website" type="url" autoComplete="url" value={formData.website} onChange={updateField} />
            </label>
            <label>
              Biggest bottleneck
              <textarea name="bottleneck" rows="4" value={formData.bottleneck} onChange={updateField} required />
            </label>
            <label>
              Best follow-up time
              <input name="preferredTime" value={formData.preferredTime} onChange={updateField} placeholder="Example: weekday mornings" />
            </label>
            <button className="button button-primary" type="submit">
              Request Review
              <Mail aria-hidden="true" size={19} />
            </button>
            {formStatus === "sent" && (
              <p className="form-note">
                Your email app should open with the details filled in. You can also talk to the assistant in the corner.
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
