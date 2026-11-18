// Mutable, non-reactive bridge between DOM-level pointer/scroll listeners
// (set up in Cockpit.tsx) and the hero's per-frame canvas draw loop
// (MatrixRain.tsx). The canvas needs these values at 60fps; routing them
// through React state would mean a re-render per mouse-move/scroll tick, so
// instead both sides just read/write plain object fields.
export const heroPointer = { x: 0, y: 0 }; // normalized -0.5..0.5, raw (unsmoothed) cursor position

// 0 = fully "in" the hero, 1 = fully "leaving" it (scrolled past the fold).
// Dims the rain's brightness floor as you scroll away.
export const heroLeaving = { value: 0 };
