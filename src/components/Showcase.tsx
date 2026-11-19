import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Presentation, Mail, LayoutGrid, Code, Wand, Heart, Layers, Sparkles, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "./Icons";
import { marqueeTerms, whatIDo, flightPlan, toolClusters } from "../data/content";
import "./Showcase.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

const SYMBOLS = ["○", "△", "▢"];

/** Full-bleed ticker band between sections; static when motion is reduced. */
export function Marquee() {
  const reduce = useReducedMotion();
  const row = marqueeTerms.map((t, i) => (
    <span key={t} className="marquee-item">
      {t}
      <i aria-hidden="true">{SYMBOLS[i % 3]}</i>
    </span>
  ));
  return (
    <div className={`marquee${reduce ? " marquee--static" : ""}`} role="presentation">
      <div className="marquee-track">
        <div className="marquee-set">{row}</div>
        {!reduce && (
          <div className="marquee-set" aria-hidden="true">
            {row}
          </div>
        )}
      </div>
    </div>
  );
}

/** Services as a compact accordion: one row open at a time. */
export function WhatIDo() {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();
  return (
    <ol className="wid">
      {whatIDo.map((s, i) => {
        const isOpen = open === i;
        return (
          <li key={s.title} className={`wid-row${isOpen ? " is-open" : ""}`}>
            <h3 className="wid-head">
              <button type="button" className="wid-toggle" aria-expanded={isOpen} aria-controls={`wid-panel-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className="wid-num">{pad(i + 1)}</span>
                <span className="wid-title">{s.title}</span>
                <span className="wid-icon" aria-hidden="true" />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`wid-panel-${i}`}
                  className="wid-panel"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <div className="wid-panel-inner">
                    <Link className="wid-media" to={s.to} tabIndex={-1} aria-hidden="true">
                      <img src={s.image} alt="" loading="lazy" />
                    </Link>
                    <div className="wid-copy">
                      <p className="wid-text">{s.text}</p>
                      <ul className="wid-tags">
                        {s.tags.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      <Link className="wid-more" to={s.to}>
                        See case study <ArrowUpRightIcon size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}

export function HowIWork() {
  return (
    <>
      <ol className="how-grid">
        {flightPlan.map((s, i) => (
          <motion.li
            key={s.name}
            className="how-card"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: EASE, delay: (i % 2) * 0.08 }}
          >
            <span className="how-num" aria-hidden="true">
              {s.step}
            </span>
            <h3 className="how-title">{s.name.charAt(0) + s.name.slice(1).toLowerCase()}</h3>
            <p className="how-text">{s.detail}</p>
            <ul className="how-methods">
              {s.methods.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>

    </>
  );
}

// Brand marks come from Simple Icons (tinted to the site's pale blue); tools
// without one get a neutral line icon instead of a missing image.
const TINT = "cfe9f5";
const STACK_ICONS: Record<string, { slug?: string; Icon?: LucideIcon }> = {
  Figma: { slug: "figma" },
  Framer: { slug: "framer" },
  Miro: { slug: "miro" },
  Notion: { slug: "notion" },
  Confluence: { slug: "confluence" },
  Jira: { slug: "jira" },
  "Google Suite": { slug: "google" },
  Claude: { slug: "claude" },
  GPT: { Icon: Sparkles }, // Simple Icons dropped the "openai" slug (404), so use a neutral line icon
  "Claude Code": { slug: "claude" },
  Replit: { slug: "replit" },
  GitHub: { slug: "github" },
  "Napkin AI": { Icon: Presentation },
  Workshop: { Icon: Mail },
  "MS Suite": { Icon: LayoutGrid },
  "VS Code": { Icon: Code },
  "Figma Make": { Icon: Wand },
  Lovable: { Icon: Heart },
};

function ToolIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const def = STACK_ICONS[name] ?? {};
  if (def.slug && !failed) {
    return (
      <img
        className="stack-icon"
        src={`https://cdn.simpleicons.org/${def.slug}/${TINT}`}
        alt=""
        width={18}
        height={18}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  const Icon = def.Icon ?? Layers;
  return <Icon className="stack-icon" size={18} strokeWidth={1.5} aria-hidden="true" />;
}

export function TechStack() {
  return (
    <ul className="stack">
      {toolClusters.map((c, i) => (
        <motion.li
          key={c.group}
          className={`stack-card${i === 0 ? " stack-card--lead" : ""}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE, delay: i === 0 ? 0 : ((i - 1) % 2) * 0.08 }}
        >
          {i === 0 && (
            <svg className="stack-arc" viewBox="0 0 240 160" aria-hidden="true">
              <path d="M10 150 C 60 40, 150 20, 235 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
            </svg>
          )}
          <span className="stack-label">
            <i className={`stack-dot${i % 2 ? " stack-dot--green" : ""}`} aria-hidden="true" />
            {c.group}
          </span>
          <h3 className="stack-headline">{c.headline}</h3>
          <p className="stack-summary">{c.summary}</p>
          <ul className="stack-chips">
            {c.items.map((t) => (
              <li key={t.name}>
                <ToolIcon name={t.name} />
                {t.name}
              </li>
            ))}
          </ul>
        </motion.li>
      ))}
    </ul>
  );
}
