import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Mail,
  Menu,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Target,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

const contactEmail = "hello@cornersystems.ai";

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Market", href: "#market" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

const services = [
  {
    icon: Bot,
    title: "Website Chat + Lead Capture",
    text: "A 24/7 assistant that answers first questions, qualifies prospects, routes program interest, and turns intent into booked trials.",
  },
  {
    icon: Calendar,
    title: "Trial Booking Flows",
    text: "Clean booking paths for intro classes, consultations, kids programs, private lessons, and follow-up reminders.",
  },
  {
    icon: PhoneCall,
    title: "Missed-Call Text Back",
    text: "Instant SMS replies when your desk is busy, so warm leads hear from the gym before they shop somewhere else.",
  },
  {
    icon: Workflow,
    title: "CRM Workflows",
    text: "Pipelines, staff alerts, task creation, and handoff rules that make every new inquiry visible and actionable.",
  },
  {
    icon: Mail,
    title: "Follow-Up Sequences",
    text: "Email and SMS sequences for new inquiries, no-shows, old leads, inactive members, and reactivation campaigns.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    text: "Simple reporting for lead sources, booking rates, show rates, close rates, and retention opportunities.",
  },
];

const markets = [
  "MMA gyms",
  "Muay Thai gyms",
  "Brazilian jiu-jitsu academies",
  "Boxing gyms",
  "Kids martial arts programs",
  "Combat sports franchises",
];

const benefits = [
  "Capture leads after hours",
  "Book more trial classes",
  "Reduce manual follow-up",
  "Respond to missed calls instantly",
  "Give staff a cleaner pipeline",
  "Track what is actually converting",
  "Recover cold leads",
  "Build a business that scales",
];

const process = [
  {
    step: "01",
    title: "Map the gym",
    text: "We learn your programs, schedule, pricing structure, lead sources, sales process, staff responsibilities, and recurring admin friction.",
  },
  {
    step: "02",
    title: "Build the system",
    text: "We create the website paths, chat logic, automations, staff alerts, booking flows, and follow-up sequences that match the gym.",
  },
  {
    step: "03",
    title: "Improve the numbers",
    text: "We review results, refine scripts, tighten weak points, and keep the system aligned with how the business is growing.",
  },
];

const snapshots = [
  { value: "24/7", label: "lead response" },
  { value: "3x", label: "faster follow-up" },
  { value: "1", label: "clean pipeline" },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Corner Systems AI home">
          <span className="brand-mark">CS</span>
          <span>
            <strong>Corner Systems</strong>
            <small>AI infrastructure for fight gyms</small>
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
          Book Demo
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
              <p className="eyebrow">Automation for combat sports businesses</p>
              <h1 id="hero-title">
                <span>Corner</span>
                <span>Systems</span>
                <span>AI</span>
              </h1>
              <p className="hero-lede">
                Modern websites, lead capture, booking flows, and follow-up systems for gym owners who want fewer dropped leads and cleaner operations.
              </p>
              <div className="hero-actions" aria-label="Primary actions">
                <a className="button button-primary" href="#contact">
                  Build My System
                  <ArrowRight aria-hidden="true" size={20} />
                </a>
                <a className="button button-secondary" href="#services">
                  View Services
                  <ChevronRight aria-hidden="true" size={20} />
                </a>
              </div>
            </div>

            <div className="lead-console" aria-label="Lead system preview">
              <div className="console-header">
                <span className="status-dot" />
                <span>Lead capture live</span>
              </div>
              <div className="console-row">
                <MessageSquareText aria-hidden="true" size={19} />
                <span>Beginner MMA inquiry</span>
                <strong>Booked</strong>
              </div>
              <div className="console-row">
                <PhoneCall aria-hidden="true" size={19} />
                <span>Missed call text-back</span>
                <strong>0:12</strong>
              </div>
              <div className="console-row">
                <Calendar aria-hidden="true" size={19} />
                <span>Trial reminder sequence</span>
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

        <section id="market" className="section section-split">
          <div>
            <p className="eyebrow">Built for the mat business</p>
            <h2>Most gyms are elite in person and leaky online.</h2>
            <p className="section-copy">
              Corner Systems AI helps combat sports operators replace scattered DMs, missed calls, manual spreadsheets, and inconsistent follow-up with one connected system that works before and after class hours.
            </p>
          </div>
          <div className="market-grid" aria-label="Markets served">
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
            <h2>Systems that keep prospects moving.</h2>
            <p className="section-copy">
              Each piece is designed around the way combat sports gyms actually sell: curiosity, trust, trial attendance, and consistent follow-up.
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

        <section className="section proof-section" aria-label="Operational value">
          <div className="proof-media">
            <div className="metric-strip">
              <span>Lead Source</span>
              <strong>Website Chat</strong>
            </div>
            <div className="metric-line">
              <span>Trial booked</span>
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
            <h2>Less chasing. More training. Better ownership.</h2>
            <p className="section-copy">
              The right system catches leads while your team is coaching, keeps prospects warm before their first class, and gives staff a clear view of what needs attention.
            </p>
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

        <section id="process" className="section process-section">
          <div className="section-heading">
            <p className="eyebrow">How it works</p>
            <h2>A tight build process for busy gym owners.</h2>
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

        <section id="contact" className="section contact-section">
          <div className="contact-copy">
            <p className="eyebrow">Start clean</p>
            <h2>Build the system your next lead should meet.</h2>
            <p className="section-copy">
              Bring your current website, booking process, lead sources, and follow-up problems. We will map the fastest path to a cleaner gym operating system.
            </p>
            <div className="trust-row" aria-label="Trust points">
              <span>
                <ShieldCheck aria-hidden="true" size={18} />
                Owner-first workflows
              </span>
              <span>
                <Clock3 aria-hidden="true" size={18} />
                Fast implementation
              </span>
              <span>
                <Target aria-hidden="true" size={18} />
                Conversion focused
              </span>
            </div>
          </div>

          <form className="contact-form" action={`mailto:${contactEmail}`} method="post" encType="text/plain">
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Gym
              <input name="gym" autoComplete="organization" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Biggest bottleneck
              <textarea name="bottleneck" rows="4" required />
            </label>
            <button className="button button-primary" type="submit">
              Send Request
              <Mail aria-hidden="true" size={19} />
            </button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top" aria-label="Corner Systems AI home">
          <span className="brand-mark">CS</span>
          <span>
            <strong>Corner Systems</strong>
            <small>Digital systems for combat sports businesses</small>
          </span>
        </a>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </footer>
    </div>
  );
}

export default App;
