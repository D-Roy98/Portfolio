import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon } from "./Icons";
import { petQA, type PetQA } from "../data/pet";
import PetMorph from "./PetMorph";
import "./SitePet.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 320, damping: 26, mass: 0.9 } as const;
const POP = { type: "spring", stiffness: 420, damping: 24, mass: 0.7 } as const;

type Msg =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "pet"; text?: string; qa?: PetQA; pending?: boolean };

const GREETING: Msg = { id: 0, from: "pet", text: "Hi! Tap a question to learn about Diganta." };

// A small, springy pull toward the pointer. Disabled for touch and
// reduced-motion users.
function useMagnet(strength: number, enabled: boolean) {
  return {
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      if (!enabled || e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.setProperty("--mx", `${dx.toFixed(1)}px`);
      el.style.setProperty("--my", `${dy.toFixed(1)}px`);
    },
    onPointerLeave(e: React.PointerEvent<HTMLElement>) {
      e.currentTarget.style.setProperty("--mx", "0px");
      e.currentTarget.style.setProperty("--my", "0px");
    },
  };
}

// A companion that answers quick questions about Diganta. It never
// improvises: every answer comes from src/data/pet.ts, which is built from
// the site's own content. Its eyes follow the pointer.
export default function SitePet() {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Msg[]>([GREETING]);
  const [face, setFace] = useState(false);
  const autoMorphed = useRef(false);
  const faceRef = useRef<SVGSVGElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);
  const busy = thread.some((m) => m.from === "pet" && m.pending);
  const magnetBtn = useMagnet(0.28, !reduced);
  const magnetChip = useMagnet(0.18, !reduced);

  function ask(text: string, qa: PetQA) {
    if (busy) return;
    const petId = nextId.current + 1;
    const userMsg: Msg = { id: nextId.current, from: "user", text };
    nextId.current += 2;
    const reply: Msg = { id: petId, from: "pet", qa };

    if (reduced) {
      setThread((t) => [...t, userMsg, reply]);
      return;
    }
    setThread((t) => [...t, userMsg, { id: petId, from: "pet", pending: true }]);
    timers.current.push(
      window.setTimeout(() => setThread((t) => t.map((m) => (m.id === petId ? reply : m))), 900)
    );
  }

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [thread, reduced]);

  // The first time the panel opens, the pet quietly turns into Diganta.
  useEffect(() => {
    if (!open || autoMorphed.current) return;
    autoMorphed.current = true;
    const id = window.setTimeout(() => setFace(true), 2200);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Eyes track the pointer.
  useEffect(() => {
    const noHover = window.matchMedia("(hover: none)").matches;
    if (reduced || noHover) return;
    let raf = 0;
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const svg = faceRef.current;
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 240) * 2.4;
        const ux = dx / d;
        const uy = dy / d;
        const lean = Math.min(1, d / 240);
        svg.style.setProperty("--ex", String(ux * k));
        svg.style.setProperty("--ey", String(uy * k));
        // The whole head turns toward the pointer (CSS 3D), eyes lead the turn.
        svg.style.setProperty("--ry", `${(ux * lean * 18).toFixed(1)}deg`);
        svg.style.setProperty("--rx", `${(-uy * lean * 14).toFixed(1)}deg`);
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <aside className="pet" aria-label="Ask about Diganta">
      <AnimatePresence>
        {open && (
          <motion.div
            id="pet-panel"
            className="pet-panel"
            role="dialog"
            aria-label="Ask about Diganta"
            initial={reduced ? false : { opacity: 0, scale: 0.86, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: reduced ? { duration: 0 } : SPRING }}
            exit={{ opacity: 0, scale: 0.94, y: 12, transition: { duration: reduced ? 0 : 0.22, ease: EASE } }}
          >
            <header className="pet-head">
              <button
                type="button"
                className="pet-avatar"
                aria-pressed={face}
                aria-label={face ? "Show the pet" : "Show Diganta's photo"}
                onClick={() => {
                  autoMorphed.current = true;
                  setFace((v) => !v);
                }}
              >
                <PetMorph morphed={face} reduced={reduced} />
              </button>
              <div className="pet-id">
                <p className="pet-name">Ask about Diganta</p>
                <p className="pet-online">
                  <span aria-hidden="true" /> Online
                </p>
              </div>
              <button type="button" className="pet-close" aria-label="Close" onClick={() => setOpen(false)}>
                <CloseIcon size={14} />
              </button>
            </header>

            <div className="pet-thread" ref={threadRef} aria-live="polite">
              {thread.map((m) => (
                <motion.div
                  key={m.id}
                  className={`pet-msg pet-msg--${m.from}`}
                  style={{ transformOrigin: m.from === "user" ? "bottom right" : "bottom left" }}
                  initial={reduced ? false : { opacity: 0, scale: 0.7, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={reduced ? { duration: 0 } : POP}
                >
                  {m.from === "user" && m.text}
                  {m.from === "pet" && m.pending && (
                    <span className="pet-wave" role="status" aria-label="Thinking">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {m.from === "pet" && !m.pending && m.text && m.text}
                  {m.from === "pet" && !m.pending && m.qa && (
                    <motion.ul
                      className="pet-lines"
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: 0.05 } } }}
                    >
                      {m.qa.lines.map((line) => (
                        <motion.li
                          key={line}
                          variants={{
                            hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 8 },
                            show: { opacity: 1, y: 0, transition: reduced ? { duration: 0 } : SPRING },
                          }}
                        >
                          {line}
                        </motion.li>
                      ))}
                      {m.qa.cta && (
                        <li>
                          <a className="pet-cta" href={m.qa.cta.href}>
                            {m.qa.cta.label}
                          </a>
                        </li>
                      )}
                    </motion.ul>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="pet-chips" role="group" aria-label="Quick questions">
              {petQA.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="pet-chip"
                  disabled={busy}
                  onClick={() => ask(q.question, q)}
                  {...magnetChip}
                >
                  {q.question}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            className="pet-cta-bubble"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.7, ease: EASE, delay: reduced ? 0 : 1.2 } }}
            exit={{ opacity: 0, y: 6, transition: { duration: reduced ? 0 : 0.18, ease: EASE } }}
            onClick={() => {
              setOpen(true);
            }}
          >
            <span className="live-emoji" aria-hidden="true">
              ✨
            </span>
            Want the 30-second pitch?
          </motion.button>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`pet-btn${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="pet-panel"
        aria-label={open ? "Close the pet" : "Ask the pet about Diganta"}
        onClick={() => {
          setOpen((v) => !v);
        }}
        {...magnetBtn}
      >
        <span className="pet-shock" aria-hidden="true" />
        <span className="pet-shock pet-shock--2" aria-hidden="true" />
        <span className="pet-shock pet-shock--3" aria-hidden="true" />
        <PetFace ref={faceRef} />
        <span className="pet-status" aria-hidden="true" />
      </button>
    </aside>
  );
}

// "Biscuit": a soft, shaded cartoon dog. Gradients fake the 3D volume; the head
// tilts toward the pointer (CSS 3D), the eyes follow it, and the muzzle and ears
// shift a little against the head for parallax.
const PetFace = forwardRef<SVGSVGElement>(function PetFace(_, ref) {
  return (
    <svg ref={ref} className="pet-svg" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="dog-fur" cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#f6f9fd" />
          <stop offset="0.55" stopColor="#c9d3e4" />
          <stop offset="1" stopColor="#8d9bb4" />
        </radialGradient>
        <radialGradient id="dog-ear" cx="40%" cy="25%" r="85%">
          <stop offset="0" stopColor="#8693ab" />
          <stop offset="1" stopColor="#3b4559" />
        </radialGradient>
        <radialGradient id="dog-snout" cx="45%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d3dcea" />
        </radialGradient>
        <linearGradient id="dog-collar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe3f6" />
          <stop offset="1" stopColor="#2bbedd" />
        </linearGradient>
      </defs>
      <ellipse className="dog-shadow" cx="32" cy="60.5" rx="17" ry="3" />
      <ellipse cx="32" cy="50" rx="13" ry="10" fill="url(#dog-fur)" />
      <path d="M20.5 44.5 Q32 52 43.5 44.5" fill="none" stroke="url(#dog-collar)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="51" r="2.6" fill="#3ddc97" />
      <g className="pet-ear pet-ear--l">
        <path d="M16 17 C6.5 18.5 4.5 37 12 42 C18 42 21.5 31 21 19 Z" fill="url(#dog-ear)" />
      </g>
      <g className="pet-ear pet-ear--r">
        <path d="M48 17 C57.5 18.5 59.5 37 52 42 C46 42 42.5 31 43 19 Z" fill="url(#dog-ear)" />
      </g>
      <ellipse cx="32" cy="29" rx="18.5" ry="16" fill="url(#dog-fur)" />
      <ellipse cx="25" cy="19.5" rx="7" ry="3.6" fill="#ffffff" opacity="0.35" transform="rotate(-18 25 19.5)" />
      <ellipse cx="18.5" cy="35.5" rx="3" ry="2" fill="#5cd6f0" opacity="0.2" />
      <ellipse cx="45.5" cy="35.5" rx="3" ry="2" fill="#5cd6f0" opacity="0.2" />
      <g className="pet-muzzle">
        <ellipse cx="32" cy="37" rx="9.5" ry="7" fill="url(#dog-snout)" />
        <ellipse cx="32" cy="34.2" rx="3.4" ry="2.5" fill="#141c2b" />
        <ellipse cx="31" cy="33.4" rx="1.2" ry="0.7" fill="#ffffff" opacity="0.6" />
        <path d="M32 36.7 V39.3 M32 39.3 Q29.5 41.8 26.8 40.2 M32 39.3 Q34.5 41.8 37.2 40.2" fill="none" stroke="#4b566a" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <g className="pet-eyes">
        <g className="pet-eye">
          <ellipse cx="24.5" cy="29" rx="3.4" ry="3.9" fill="#141c2b" />
          <circle cx="25.6" cy="27.6" r="1.15" fill="#ffffff" />
          <circle cx="23.5" cy="30.6" r="0.55" fill="#ffffff" opacity="0.8" />
        </g>
        <g className="pet-eye">
          <ellipse cx="39.5" cy="29" rx="3.4" ry="3.9" fill="#141c2b" />
          <circle cx="40.6" cy="27.6" r="1.15" fill="#ffffff" />
          <circle cx="38.5" cy="30.6" r="0.55" fill="#ffffff" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
});
