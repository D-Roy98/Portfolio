import { useEffect, useRef, useState } from "react";

const LABELS: Record<string, string> = { view: "View", explore: "Explore", open: "Open" };
const INTERACTIVE = "a, button, [data-cursor]";
const DEFAULT_SIZE = 26;

// A soft ring that trails the pointer. Over small interactive elements
// (nav links, buttons) it docks onto the element's own bounds with a light
// magnetic pull toward the pointer; over large ones (project rows, images)
// it stays round and carries a label instead. The system cursor stays
// visible throughout — this only adds to it.
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    if (reduceMotion || noHover) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    let cx = 0;
    let cy = 0;
    let cw = DEFAULT_SIZE;
    let ch = DEFAULT_SIZE;
    let tx = 0;
    let ty = 0;
    let tw = DEFAULT_SIZE;
    let th = DEFAULT_SIZE;
    let tr = DEFAULT_SIZE;
    let started = false;
    let lastLabel: string | null = null;

    function reset() {
      tw = DEFAULT_SIZE;
      th = DEFAULT_SIZE;
      tr = DEFAULT_SIZE;
      tx = px;
      ty = py;
      if (lastLabel !== null) {
        lastLabel = null;
        setLabel(null);
      }
    }

    function onMove(e: MouseEvent) {
      px = e.clientX;
      py = e.clientY;
      if (!started) {
        cx = tx = px;
        cy = ty = py;
        started = true;
      }
      const el = (e.target as HTMLElement | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
      if (!el) {
        reset();
        return;
      }
      const rect = el.getBoundingClientRect();
      const key = el.getAttribute("data-cursor");
      const next = key ? (LABELS[key] ?? key) : null;
      if (next !== lastLabel) {
        lastLabel = next;
        setLabel(next);
      }
      if (rect.width > 360 || rect.height > 140) {
        tw = th = 72;
        tr = 72;
        tx = px;
        ty = py;
      } else {
        const mx = rect.left + rect.width / 2;
        const my = rect.top + rect.height / 2;
        tx = mx + (px - mx) * 0.2;
        ty = my + (py - my) * 0.3;
        tw = rect.width + 14;
        th = rect.height + 10;
        tr = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 4, th / 2) + 4;
      }
    }

    function onDown() {
      setDown(true);
    }
    function onUp() {
      setDown(false);
    }

    // Scrolling moves content under a still pointer without firing mousemove.
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    function tick() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cw += (tw - cw) * 0.2;
      ch += (th - ch) * 0.2;
      const ring = ringRef.current;
      if (ring && started) {
        ring.style.width = `${cw}px`;
        ring.style.height = `${ch}px`;
        ring.style.borderRadius = `${tr}px`;
        ring.style.transform = `translate3d(${cx - cw / 2}px, ${cy - ch / 2}px, 0)`;
        ring.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className={`cursor-ring${label ? " has-label" : ""}${down ? " is-down" : ""}`}
      aria-hidden="true"
    >
      {label && <span className="cursor-ring-label">{label}</span>}
    </div>
  );
}
