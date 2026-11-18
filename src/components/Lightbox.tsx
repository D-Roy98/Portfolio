import { useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import "./Lightbox.css";

export interface LightboxState {
  images: string[];
  captions?: string[];
  index: number;
}

export default function Lightbox({
  state,
  onClose,
  onNavigate,
}: {
  state: LightboxState | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((state!.index + 1) % state!.images.length);
      if (e.key === "ArrowLeft") onNavigate((state!.index - 1 + state!.images.length) % state!.images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          className="lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button className="lightbox-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>

          <span className="lightbox-counter">
            {state.index + 1} / {state.images.length}
          </span>

          {state.images.length > 1 && (
            <button
              className="lightbox-nav lightbox-nav--prev" aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((state.index - 1 + state.images.length) % state.images.length);
              }}
            >
              <ChevronLeftIcon size={22} />
            </button>
          )}

          <motion.img
            key={state.images[state.index]}
            className="lightbox-image"
            src={state.images[state.index]}
            alt=""
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          />

          {state.captions?.[state.index] && (
            <p className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
              {state.captions[state.index]}
            </p>
          )}

          {state.images.length > 1 && (
            <button
              className="lightbox-nav lightbox-nav--next" aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((state.index + 1) % state.images.length);
              }}
            >
              <ChevronRightIcon size={22} />
            </button>
          )}

          {state.images.length > 1 && (
            <div className="lightbox-strip" onClick={(e) => e.stopPropagation()}>
              {state.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`lightbox-thumb ${i === state.index ? "active" : ""}`}
                  onClick={() => onNavigate(i)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
