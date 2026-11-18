import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { quotes } from "../data/quotes";
import "./LoadingScreen.css";

// Blocks the viewport until fonts and the page have loaded, but never for
// less than MIN_MS (so at least two quotes are readable) or more than
// MAX_MS (so a slow asset can't trap anyone). Skippable at any time.
const QUOTE_MS = 1500;
const MIN_MS = 3000;
const MAX_MS = 7000;
const FADE_MS = 500;

const pageLoaded = () =>
  document.readyState === "complete" ? Promise.resolve() : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setVisible(false);
      }
    };
    const minTimer = new Promise<void>((r) => window.setTimeout(r, MIN_MS));
    const ready = Promise.all([pageLoaded(), document.fonts?.ready ?? Promise.resolve()]);
    Promise.all([minTimer, ready]).then(finish);
    const maxTimer = window.setTimeout(finish, MAX_MS);
    const cycle = window.setInterval(() => setIndex((i) => (i + 1) % quotes.length), QUOTE_MS);
    return () => {
      done = true;
      window.clearTimeout(maxTimer);
      window.clearInterval(cycle);
    };
  }, []);

  const quote = quotes[index];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loading-screen"
          role="status"
          aria-label="Loading"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeOut" }}
        >
          <div className="loading-pulse" aria-hidden="true">
            <span className="loading-pulse-ring loading-pulse-ring--a" />
            <span className="loading-pulse-ring loading-pulse-ring--b" />
            <span className="loading-pulse-dot" />
          </div>

          <div className="loading-quote-wrap" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.figure
                key={quote.lang}
                className="loading-quote"
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <blockquote lang={quote.lang}>{quote.text}</blockquote>
                {quote.caption && <p className="loading-caption">{quote.caption}</p>}
              </motion.figure>
            </AnimatePresence>
          </div>

          <button type="button" className="loading-skip" onClick={() => setVisible(false)}>
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
