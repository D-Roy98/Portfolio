import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Compass, Download, Guitar, Headphones, Layers, Mail, Palette, Target, Waves, type LucideIcon } from "lucide-react";
import { ArrowUpRightIcon } from "./Icons";
import { projects } from "../data/projects";
import { pilotLog, processCopy, archives, comms, certifications, heroWords } from "../data/content";
import MatrixRain from "./MatrixRain";
import LoadingScreen from "./LoadingScreen";
import CustomCursor from "./CustomCursor";
import ExperienceTimeline from "./ExperienceTimeline";
import Highlighted from "./Highlighted";
import { Marquee, WhatIDo, HowIWork, TechStack } from "./Showcase";
import { heroPointer, heroLeaving } from "../lib/heroInteraction";
import "./Cockpit.css";

type SectionId = "HERO" | "PROJECTS" | "ABOUT" | "ARCHIVES" | "CONTACT";

// Same order as the page itself, so the nav reads left-to-right the way the
// page scrolls top-to-bottom.
const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: "PROJECTS", label: "Work" },
  { id: "ABOUT", label: "About" },
  { id: "ARCHIVES", label: "Explorations" },
];

// Everything about the person lives in About; this is its in-section nav.
const ABOUT_BLOCKS = [
  { id: "about-overview", label: "Overview" },
  { id: "about-experience", label: "Experience" },
  { id: "about-skills", label: "Skills" },
  { id: "about-tools", label: "Tools" },
  { id: "about-certifications", label: "Certifications" },
  { id: "about-process", label: "How I work" },
  { id: "about-services", label: "What I do" },
] as const;

const FUN_FACT_ICONS = { guitar: Guitar, headphones: Headphones, waves: Waves };

// Decorative icon per skill group; any new group falls back to Layers.
const SKILL_ICONS: Record<string, LucideIcon> = {
  UX: Compass,
  "Visual Design": Palette,
  Product: Target,
  "UX artifacts": Layers,
};

const EASE = [0.16, 1, 0.3, 1] as const;

// Page entry: hero lines glide up one after another, starting just after the
// loading screen lifts.
const heroStagger: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 1.5, staggerChildren: 0.16 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};

// Scroll-in for everything below the hero. Lists stagger their rows.
const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const rowRise: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

// A typewriter for the one cycling word in the headline, driven by absolute
// elapsed time (not chained timeouts) so it doesn't drift when the main
// thread is busy.
function HeroWordCycle() {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(heroWords[0]);
      return;
    }

    const TYPE_SPEED = 60;
    const DELETE_SPEED = 34;
    const HOLD_MS = 1700;
    const GAP_MS = 350;
    const INITIAL_DELAY = 2300;

    let wordIndex = 0;
    let phase: "delay" | "typing" | "holding" | "deleting" | "gap" = "delay";
    let phaseStart = performance.now();
    let raf = 0;

    function tick() {
      const now = performance.now();
      const elapsed = now - phaseStart;
      const word = heroWords[wordIndex];

      if (phase === "delay") {
        if (elapsed >= INITIAL_DELAY) {
          phase = "typing";
          phaseStart = now;
        }
      } else if (phase === "typing") {
        const count = Math.min(word.length, Math.floor(elapsed / TYPE_SPEED));
        setDisplay(word.slice(0, count));
        if (count >= word.length) {
          phase = "holding";
          phaseStart = now;
        }
      } else if (phase === "holding") {
        if (elapsed >= HOLD_MS) {
          phase = "deleting";
          phaseStart = now;
        }
      } else if (phase === "deleting") {
        const count = Math.max(0, word.length - Math.floor(elapsed / DELETE_SPEED));
        setDisplay(word.slice(0, count));
        if (count <= 0) {
          wordIndex = (wordIndex + 1) % heroWords.length;
          phase = "gap";
          phaseStart = now;
        }
      } else if (phase === "gap") {
        if (elapsed >= GAP_MS) {
          phase = "typing";
          phaseStart = now;
        }
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="hero-word">
      <em>{display}</em>
      <span className="hero-caret" aria-hidden="true" />
    </span>
  );
}

// "Explorations" — the first tile spans the width, the rest sit two across. Every
// thumbnail is the Notion gallery cover at one shared ratio.
type Archive = (typeof archives)[number];
type TileSize = "feature" | "medium";
const TILE_SIZES: TileSize[] = ["feature"]; // the first tile spans both columns; the rest are equal

function BentoGrid({
  items,
  openingTitle,
  onOpen,
}: {
  items: Archive[];
  openingTitle: string | null;
  onOpen: (title: string) => void;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="bento-wrap">
      <div className="bento">
        {items.map((item, i) => {
          const size = TILE_SIZES[i] ?? "medium";
          const tags = item.tools ? item.tools.split(",").slice(0, size === "feature" ? 3 : 2) : [];
          return (
            <motion.article
              key={item.title}
              className={`bento-tile bento-tile--${size}${openingTitle === item.title ? " is-opening" : ""}`}
              initial={reduced ? false : { opacity: 0, y: 28, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease: EASE, delay: reduced ? 0 : (i % 3) * 0.08 }}
            >
              <button type="button" className="bento-hit" onClick={() => onOpen(item.title)} data-cursor="view">
                <span className="bento-media">
                  <img src={item.image} alt="" loading="lazy" />
                  <span className="bento-badge">{item.category}</span>
                </span>
                <span className="bento-body">
                  <span className="bento-meta">{item.year}</span>
                  <span className="bento-title">{item.title}</span>
                  {tags.length > 0 && (
                    <span className="bento-tags">
                      {tags.map((t) => (
                        <span key={t} className="tag">
                          {t.trim()}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="bento-open" aria-hidden="true">
                  {openingTitle === item.title ? "Opening" : <ArrowUpRightIcon size={16} />}
                </span>
              </button>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

// Shared frame for every section below the hero: a narrow index/title
// column on the left and the content offset to the right, which is what
// gives the page its asymmetry.
function Section({
  title,
  index,
  intro,
  wide,
  children,
}: {
  title: string;
  index: string;
  intro?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`section-inner${wide ? " section-inner--wide" : ""}`}>
      <header className="section-head">
        <span className="section-index" aria-hidden="true" data-parallax="0.12" data-parallax-max="40">
          {index}
        </span>
        <h2 className="section-title" data-parallax="0.07" data-parallax-max="36">
          {title}
        </h2>
        {intro && <div className="section-intro">{intro}</div>}
      </header>
      <motion.div
        className="section-body"
        variants={rowRise}
        initial="hidden"
        whileInView="show"
        // "some", not a ratio: a tall body (About) can never show 12% of itself on a phone.
        viewport={{ once: true, amount: "some" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Jump list under the About title. It highlights the block nearest the top of
// the viewport and scrolls to a block on click (instantly when motion is reduced).
function AboutNav() {
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState<string>(ABOUT_BLOCKS[0].id);

  useEffect(() => {
    const els = ABOUT_BLOCKS.map((b) => document.getElementById(b.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="about-nav" aria-label="About sections">
      <ul>
        {ABOUT_BLOCKS.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              className={`about-nav-link${active === b.id ? " is-active" : ""}`}
              aria-current={active === b.id ? "true" : undefined}
              onClick={() => document.getElementById(b.id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })}
            >
              {b.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AboutBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="about-block" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="about-block-title">
        {title}
      </h3>
      {children}
    </section>
  );
}

// The primary call to action. Compact in the header (label swaps to "Download"
// on hover); full-size with a plain label in the hero.
function ResumeButton({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`btn btn--cta btn--resume${compact ? " btn--sm" : ""}`}
      href={comms.resume}
      download="Diganta_Roy_Resume.pdf"
      data-cursor="open"
      aria-label="Download resume"
    >
      <Download size={16} aria-hidden="true" />
      {compact ? (
        <span className="resume-swap">
          <span>Résumé</span>
          <span aria-hidden="true">Download</span>
        </span>
      ) : (
        <span>Download résumé</span>
      )}
    </a>
  );
}

function Linkedin({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ContactCard() {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  // No backend: submitting opens the visitor's email app with everything filled in.
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = `${message}\n\nReply to: ${from}`;
    window.location.href = `mailto:${comms.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <Section title="Contact" index="04">
    <div className="contact">
      <ul className="contact-icons">
        <li>
          <a href={comms.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" data-cursor="open">
            <Linkedin size={22} />
          </a>
        </li>
        <li>
          <a href={`mailto:${comms.email}`} aria-label="Email">
            <Mail size={22} />
          </a>
        </li>
        <li>
          <a href={comms.resume} download="Diganta_Roy_Resume.pdf" aria-label="Download resume" data-cursor="open">
            <Download size={22} />
          </a>
        </li>
      </ul>
      <p className="contact-line">
        Find me on LinkedIn, use the form below, or hit me up via email at{" "}
        <a href={`mailto:${comms.email}`}>{comms.email}</a>.
      </p>
      <form className="contact-form" onSubmit={submit}>
        <label>
          <span>Email address <small>(required)</small></span>
          <input type="email" required value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="email" />
        </label>
        <label>
          <span>Subject <small>(required)</small></span>
          <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label>
          <span>Message <small>(required)</small></span>
          <textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--cta contact-submit">Submit</button>
        {sent && <p className="contact-note" role="status">Your email app should open with the message ready to send.</p>}
      </form>
    </div>
    </Section>
  );
}

export default function Cockpit() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>("HERO");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFunFacts, setShowFunFacts] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rainLayerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});

  function scrollToSection(id: SectionId) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  // The brief "transitioning" state: the row confirms the click before the
  // route changes, rather than jumping instantly.
  function openProject(id: string, path = `/work/${id}`) {
    if (opening) return;
    setOpening(id);
    window.setTimeout(() => navigate(path), 340);
  }

  // Highlights the section that crosses a line 40% down the viewport. A visible-
  // ratio threshold can't work here: About is several screens tall, so it never
  // shows 25% of itself at once.
  useEffect(() => {
    const entries = Object.entries(sectionRefs.current) as [SectionId, HTMLElement | null][];
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.find((e) => e.isIntersecting);
        if (visible) {
          const id = entries.find(([, el]) => el === visible.target)?.[0];
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: "-40% 0px -59% 0px" }
    );
    entries.forEach(([, el]) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The rain is a fixed backdrop for the whole page; scrolling quiets it to
  // a faint ambient layer behind the content.
  useEffect(() => {
    function onScroll() {
      const fade = Math.min(window.scrollY / 520, 1);
      rainLayerRef.current?.style.setProperty("opacity", String(1 - fade * 0.82));
      heroLeaving.value = fade;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pointer position feeds the rain and a slight parallax on the headline.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    if (reduceMotion || noHover) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    function onMove(e: MouseEvent) {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
      heroPointer.x = targetX;
      heroPointer.y = targetY;
    }
    window.addEventListener("mousemove", onMove);

    function tick() {
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;
      heroRef.current?.style.setProperty("--px", curX.toFixed(4));
      heroRef.current?.style.setProperty("--py", curY.toFixed(4));
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="site">
      <LoadingScreen />
      <div className="grain" aria-hidden="true" />
      <CustomCursor />

      <div className="rain-layer" ref={rainLayerRef}>
        <MatrixRain />
      </div>

      <header className={`header${menuOpen ? " is-open" : ""}`}>
        <div className="header-bar">
          <button type="button" className="brand" onClick={() => scrollToSection("HERO")}>
            Diganta Roy
          </button>
          <span className="status">
            <span className="status-dot" />
            Available for work
          </span>
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <nav className="nav" aria-label="Sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link${activeSection === item.id ? " is-active" : ""}`}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <ResumeButton compact />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => scrollToSection("CONTACT")}>
            Contact
          </button>
        </div>
      </header>

      <main>
        <section className="hero" ref={(el) => { sectionRefs.current.HERO = el; heroRef.current = el; }}>
          <motion.div className="hero-inner" variants={heroStagger} initial="hidden" animate="show" data-parallax="0.2" data-parallax-max="140">
            <motion.h1 className="hero-title" variants={rise}>
              A product designer who obsesses over <HeroWordCycle />
            </motion.h1>
            <motion.p className="hero-sub" variants={rise}>
              Product and UX designer at Valtech, Bengaluru, shaping connected mobility, in-vehicle HMI and enterprise dashboards.
            </motion.p>
            <motion.div className="hero-cta" variants={rise}>
              <ResumeButton />
              <button type="button" className="btn btn--ghost" onClick={() => scrollToSection("CONTACT")}>
                Contact
              </button>
            </motion.div>
          </motion.div>
        </section>

        <section className="section" ref={(el) => { sectionRefs.current.PROJECTS = el; }}>
          <Section title="Selected work" index="01">
            <motion.ol
              className="work-list"
              variants={listStagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
            >
              {projects.map((project) => (
                <motion.li key={project.id} variants={rowRise}>
                  <button
                    type="button"
                    className={`work-row${opening === project.id ? " is-opening" : ""}`}
                    onClick={() => openProject(project.id)}
                    data-cursor="view"
                  >
                    <span className="work-main">
                      <span className="work-title">{project.title}</span>
                      <span className="work-brief">{project.brief}</span>
                      <span className="tags">
                        <span className="tag">{project.year}</span>
                        <span className="tag">{project.category}</span>
                      </span>
                    </span>
                    <span className="work-thumb">
                      <img src={project.image} alt="" loading="lazy" data-parallax="0.1" data-parallax-fit />
                    </span>
                    <span className="work-state" aria-hidden="true">
                      {opening === project.id ? "Opening" : <ArrowUpRightIcon size={16} />}
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ol>
          </Section>
        </section>

        <section className="section" ref={(el) => { sectionRefs.current.ABOUT = el; }}>
          <Section title="About" index="02" intro={<AboutNav />}>
            <div id="about-overview" className="about-block about-block--overview">
            <div className="about-id">
              <div className="about-photo">
                <img src={pilotLog.photo} alt="Diganta Roy" data-parallax="0.1" data-parallax-fit />
              </div>
              <div className="about-id-text">
                <span className="label">Product / UX Designer</span>
                <h3 className="about-name">Diganta Roy</h3>
                <button
                  type="button"
                  className="link-quiet"
                  onClick={() => setShowFunFacts((v) => !v)}
                  aria-expanded={showFunFacts}
                >
                  <span className="wave-emoji" aria-hidden="true">
                    👋
                  </span>
                  {showFunFacts ? "Hide" : "Know me beyond work"}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showFunFacts && (
                <motion.ul
                  className="fun-facts"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  {pilotLog.funFacts.map((f) => {
                    const Icon = FUN_FACT_ICONS[f.icon as keyof typeof FUN_FACT_ICONS];
                    return (
                      <li key={f.text}>
                        {Icon && <Icon size={16} />}
                        {f.text}
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            <p className="about-bio">{pilotLog.bio}</p>

            <dl className="facts">
              <div className="facts-row">
                <dt className="label">Based in</dt>
                <dd>{pilotLog.base}</dd>
              </div>
            </dl>
            </div>

            <AboutBlock id="about-experience" title="Experience">
              <ExperienceTimeline />
            </AboutBlock>

            <AboutBlock id="about-skills" title="Skills">
              <ul className="skills-grid">
                {pilotLog.skills.map((s, i) => {
                  const Icon = SKILL_ICONS[s.group] ?? Layers;
                  return (
                    <motion.li
                      className="skills-card"
                      key={s.group}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: "some" }}
                      transition={{ duration: 0.7, ease: EASE, delay: (i % 2) * 0.08 }}
                    >
                      <header className="skills-card-head">
                        <span className="skills-mark" aria-hidden="true">
                          <Icon size={20} strokeWidth={1.5} />
                        </span>
                        <h4 className="skills-group-name">{s.group}</h4>
                        <span className="skills-count" aria-label={`${s.items.length} skills`}>
                          {String(s.items.length).padStart(2, "0")}
                        </span>
                      </header>
                      <ul className="skills-list">
                        {s.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </motion.li>
                  );
                })}
              </ul>
            </AboutBlock>

            <AboutBlock id="about-tools" title="Tools">
              <TechStack />
            </AboutBlock>

            <AboutBlock id="about-certifications" title="Certifications">
              <dl className="rows">
                {certifications.map((c) => (
                  <div className="rows-item" key={c.title}>
                    <dt>{c.year}</dt>
                    <dd>
                      {c.title}
                      {c.issuer && <span className="rows-issuer"> · {c.issuer}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </AboutBlock>

            <AboutBlock id="about-process" title="How I work">
              <p className="how-lede">
                <Highlighted text={processCopy.text} />
              </p>
              <HowIWork />
            </AboutBlock>

            <AboutBlock id="about-services" title="What I do">
              <WhatIDo />
            </AboutBlock>
          </Section>
        </section>

        <Marquee />

<section className="section" ref={(el) => { sectionRefs.current.ARCHIVES = el; }}>
          {/* Route stays /other-work/:slug so links that already exist keep working. */}
          <Section title="Explorations" index="03">
            <BentoGrid
              items={archives}
              openingTitle={opening?.startsWith("archive:") ? opening.slice(8) : null}
              onOpen={(title) => openProject(`archive:${title}`, `/other-work/${encodeURIComponent(title)}`)}
            />
          </Section>
        </section>

        <section className="section section--contact" ref={(el) => { sectionRefs.current.CONTACT = el; }}>
          <ContactCard />
        </section>

        <footer className="footer">Designed &amp; built by Diganta Roy. Still figuring things out.</footer>
      </main>
    </div>
  );
}
