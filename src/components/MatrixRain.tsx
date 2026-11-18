import { useEffect, useRef } from "react";
import { heroPointer, heroLeaving } from "../lib/heroInteraction";
import { randomGlyph } from "../data/glyphs";
import "./MatrixRain.css";

const FONT_SIZE = 16;
const COLUMN_WIDTH = 26; // wide spacing keeps the rain sparse

// Customise the rain here (RGB triplets).
const COLORS = {
  trail: [84, 148, 132], // muted dark emerald
  head: [186, 212, 204], // soft pale leading glyph
  pointer: [92, 214, 240], // glyphs under the cursor turn cyan
};
const DENSITY = 0.42; // share of columns raining at any moment
const STEP_MS = 105; // time between steps; higher is slower
const rgba = ([r, g, b]: number[], a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Digital rain on a plain 2D canvas, drawn from English plus Hindi, Bengali,
// Telugu, Kannada, Tamil, Malayalam and Punjabi letters. Each column falls at
// its own speed and brightness; the rain wakes up around the cursor.
export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows: number[] = []; // fractional row of each column's head
    let speeds: number[] = []; // rows per step
    let levels: number[] = []; // base opacity per column
    let heads: string[] = []; // glyph currently at each column's head
    let active: boolean[] = []; // dormant columns stay empty for a while

    const newSpeed = () => 0.22 + Math.random() * 0.4;
    const newLevel = () => 0.3 + Math.random() * 0.7;
    const wake = () => Math.random() < DENSITY;

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / COLUMN_WIDTH);
      active = Array.from({ length: columns }, wake);
      rows = Array.from({ length: columns }, () => Math.random() * -60);
      speeds = Array.from({ length: columns }, newSpeed);
      levels = Array.from({ length: columns }, newLevel);
      heads = Array.from({ length: columns }, () => "");
    }
    resize();
    window.addEventListener("resize", resize);

    function step() {
      // A translucent fill (instead of clearing) leaves each glyph's fading trail.
      ctx!.fillStyle = "rgba(7, 12, 24, 0.16)";
      ctx!.fillRect(0, 0, width, height);
      ctx!.font = `${FONT_SIZE}px "JetBrains Mono", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Telugu", "Noto Sans Kannada", "Noto Sans Tamil", "Noto Sans Malayalam", "Noto Sans Gurmukhi", system-ui, sans-serif`;
      ctx!.textBaseline = "top";

      const mouseX = (heroPointer.x + 0.5) * width;
      const mouseY = (heroPointer.y + 0.5) * height;
      const ambient = 1 - heroLeaving.value * 0.4;

      for (let i = 0; i < columns; i++) {
        if (!active[i]) {
          // Dormant: wait off screen, then maybe start raining again.
          if (Math.random() > 0.985) {
            active[i] = wake();
            rows[i] = Math.random() * -12;
          }
          continue;
        }
        const prev = Math.floor(rows[i]);
        rows[i] += speeds[i];
        const row = Math.floor(rows[i]);

        if (row !== prev && row >= 0) {
          const x = i * COLUMN_WIDTH;
          const y = row * FONT_SIZE;
          const near = Math.max(0, 1 - Math.hypot(x - mouseX, y - mouseY) / 170);
          const alpha = Math.min(1, (0.06 + levels[i] * 0.18 + near * 0.4) * ambient);

          const tint = near > 0.35 ? COLORS.pointer : COLORS.trail;

          // The glyph the head just left settles into the green trail.
          if (heads[i]) {
            ctx!.fillStyle = rgba(tint, alpha * 0.8);
            ctx!.fillText(heads[i], x, y - FONT_SIZE);
          }

          // New leading glyph: bright with a soft glow (one per column, so cheap).
          heads[i] = randomGlyph();
          ctx!.shadowColor = rgba(tint, 0.35);
          ctx!.shadowBlur = 3;
          ctx!.fillStyle = rgba(near > 0.35 ? COLORS.pointer : COLORS.head, Math.min(0.6, alpha + 0.15));
          ctx!.fillText(heads[i], x, y);
          ctx!.shadowBlur = 0;
        }

        if (rows[i] * FONT_SIZE > height && Math.random() > 0.975) {
          heads[i] = "";
          rows[i] = Math.random() * -20;
          speeds[i] = newSpeed();
          levels[i] = newLevel();
          active[i] = wake();
        }
      }
    }

    let raf = 0;
    let last = 0;
    const stepInterval = STEP_MS;

    function draw(time: number) {
      raf = requestAnimationFrame(draw);
      if (time - last < stepInterval) return;
      last = time;
      step();
    }

    if (reduceMotion) {
      // One still frame: run the simulation ahead without animating it.
      for (let n = 0; n < 90; n++) step();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="matrix-rain" aria-hidden="true">
      <canvas ref={canvasRef} className="matrix-rain-canvas" />
    </div>
  );
}
