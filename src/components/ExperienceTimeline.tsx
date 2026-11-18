import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, type Variants } from "framer-motion";
import { ChevronDownIcon } from "./Icons";
import { pilotLog } from "../data/content";
import CompanyLogo from "./CompanyLogo";
import "./ExperienceTimeline.css";

const EASE = [0.16, 1, 0.3, 1] as const;

type Company = (typeof pilotLog.experience)[number];
type Role = Company["roles"][number];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};

// A group counts as "reached" once it crosses a line 60% down the viewport,
// including after it has scrolled off the top, so groups the reader has passed
// stay lit.
function useReached(ref: React.RefObject<HTMLElement | null>) {
  const [reached, setReached] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setReached(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -40% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return reached;
}

function RoleRow({ company, role, step, steps, still }: { company: Company; role: Role; step: number; steps: number; still: boolean }) {
  const [open, setOpen] = useState(false);
  const isCurrent = role.period.toLowerCase().includes("present");
  const panelId = `xp-${company.company}-${role.title}`.replace(/\W+/g, "-").toLowerCase();
  const highlight = "highlight" in role ? role.highlight : undefined;

  return (
    <li className={`xp-role${isCurrent ? " is-current" : ""}${open ? " is-open" : ""}`}>
      {/* Nodes grow with each step up the ladder. */}
      <span className="xp-role-node" style={{ "--grow": (step + 1) / steps } as React.CSSProperties} aria-hidden="true" />
      <button type="button" className="xp-role-btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="xp-top">
          <span className="xp-period">{role.period}</span>
          {isCurrent && <span className="xp-now">Current</span>}
          <ChevronDownIcon size={16} className="xp-chevron" aria-hidden="true" />
        </span>
        <span className="xp-title">{role.title}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.dl
            id={panelId}
            className="xp-detail"
            initial={still ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: still ? 0 : 0.7, ease: EASE }}
          >
            <div className="xp-detail-inner">
              <div>
                <dt>Location</dt>
                <dd>{role.location}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{role.type}</dd>
              </div>
              {highlight && (
                <div>
                  <dt>Team</dt>
                  <dd>{highlight}</dd>
                </div>
              )}
            </div>
          </motion.dl>
        )}
      </AnimatePresence>
    </li>
  );
}

// One container per company. Roles sit inside it on a short ladder, newest on
// top, so a career with several steps reads as one story.
function CompanyGroup({ company, still }: { company: Company; still: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const reached = useReached(ref);
  const lit = still || reached;
  const isCurrent = company.roles.some((r) => r.period.toLowerCase().includes("present"));

  return (
    <motion.li ref={ref} className={`xp-item${lit ? " is-lit" : ""}${isCurrent ? " is-current" : ""}`} variants={still ? undefined : itemVariants}>
      <span className="xp-node" aria-hidden="true" />
      <div className="xp-group">
        <header className="xp-group-head">
          <span className="xp-group-brand">
            <CompanyLogo company={company.company} height={22} />
          </span>
          <span className="xp-tenure">{company.duration}</span>
        </header>

        <ol className="xp-roles">
          {company.roles.map((role, i) => (
            <RoleRow key={role.title + role.period} company={company} role={role} step={company.roles.length - 1 - i} steps={company.roles.length} still={still} />
          ))}
        </ol>
      </div>
    </motion.li>
  );
}

// Vertical timeline. Centerpiece: a rail that draws itself down the page as
// you scroll (spring-smoothed), lighting each company as the line reaches it.
export default function ExperienceTimeline() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 60%", "end 60%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.6 });

  return (
    <motion.ol
      ref={listRef}
      className="xp"
      variants={listVariants}
      initial={reduced ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      <span className="xp-rail" aria-hidden="true">
        <motion.span className="xp-fill" style={{ scaleY: reduced ? 1 : fill }} />
      </span>
      {pilotLog.experience.map((company) => (
        <CompanyGroup key={company.company} company={company} still={reduced} />
      ))}
    </motion.ol>
  );
}
