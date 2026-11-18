import { useEffect, useRef } from "react";
import { pilotLog } from "../data/content";

const SIZE = 112; // internal canvas resolution; CSS scales it to fit its box
const CELL = 8; // dissolve block size in canvas px
const COLS = SIZE / CELL;

// The face sits at roughly (250, 235) in profile.jpg. This square crop frames
// head and shoulders and stays well above the car's number plate.
const CROP = { sx: 130, sy: 115, sw: 240, sh: 240 };

// Standalone copy of the pet drawn with literal colours, because canvas can't
// read the CSS variables the on-page pet uses.
const BOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs>
<radialGradient id="f" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#f6f9fd"/><stop offset=".55" stop-color="#c9d3e4"/><stop offset="1" stop-color="#8d9bb4"/></radialGradient>
<radialGradient id="e" cx="40%" cy="25%" r="85%"><stop offset="0" stop-color="#8693ab"/><stop offset="1" stop-color="#3b4559"/></radialGradient>
<radialGradient id="s" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d3dcea"/></radialGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe3f6"/><stop offset="1" stop-color="#2bbedd"/></linearGradient>
</defs>
<ellipse cx="32" cy="50" rx="13" ry="10" fill="url(#f)"/>
<path d="M20.5 44.5 Q32 52 43.5 44.5" fill="none" stroke="url(#c)" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="32" cy="51" r="2.6" fill="#3ddc97"/>
<path d="M16 17 C6.5 18.5 4.5 37 12 42 C18 42 21.5 31 21 19 Z" fill="url(#e)"/>
<path d="M48 17 C57.5 18.5 59.5 37 52 42 C46 42 42.5 31 43 19 Z" fill="url(#e)"/>
<ellipse cx="32" cy="29" rx="18.5" ry="16" fill="url(#f)"/>
<ellipse cx="25" cy="19.5" rx="7" ry="3.6" fill="#fff" opacity=".35" transform="rotate(-18 25 19.5)"/>
<ellipse cx="18.5" cy="35.5" rx="3" ry="2" fill="#5cd6f0" opacity=".2"/><ellipse cx="45.5" cy="35.5" rx="3" ry="2" fill="#5cd6f0" opacity=".2"/>
<ellipse cx="32" cy="37" rx="9.5" ry="7" fill="url(#s)"/>
<ellipse cx="32" cy="34.2" rx="3.4" ry="2.5" fill="#141c2b"/><ellipse cx="31" cy="33.4" rx="1.2" ry=".7" fill="#fff" opacity=".6"/>
<path d="M32 36.7 V39.3 M32 39.3 Q29.5 41.8 26.8 40.2 M32 39.3 Q34.5 41.8 37.2 40.2" fill="none" stroke="#4b566a" stroke-width="1.3" stroke-linecap="round"/>
<ellipse cx="24.5" cy="29" rx="3.4" ry="3.9" fill="#141c2b"/><circle cx="25.6" cy="27.6" r="1.15" fill="#fff"/><circle cx="23.5" cy="30.6" r=".55" fill="#fff" opacity=".8"/>
<ellipse cx="39.5" cy="29" rx="3.4" ry="3.9" fill="#141c2b"/><circle cx="40.6" cy="27.6" r="1.15" fill="#fff"/><circle cx="38.5" cy="30.6" r=".55" fill="#fff" opacity=".8"/>
</svg>`;

const BG = "#101827";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function layer() {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  return c;
}

// Per-cell dissolve order: a radial wave out from the centre with some noise,
// so the face "develops" from the middle instead of flickering at random.
const order = Array.from({ length: COLS * COLS }, (_, i) => {
  const cx = (i % COLS) - (COLS - 1) / 2;
  const cy = Math.floor(i / COLS) - (COLS - 1) / 2;
  const radial = Math.hypot(cx, cy) / Math.hypot(COLS / 2, COLS / 2);
  return radial * 0.6 + Math.random() * 0.4;
});

// Pixel-dissolve between the pet and the portrait. `morphed` is the target;
// the canvas animates toward it. Reduced-motion users get the end state with
// no animation.
export default function PetMorph({ morphed, reduced }: { morphed: boolean; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layers = useRef<{ bot: HTMLCanvasElement; face: HTMLCanvasElement } | null>(null);
  const progress = useRef(morphed ? 1 : 0); // reopening while already morphed shows the face immediately
  const raf = useRef(0);
  const target = useRef(morphed);
  target.current = morphed;

  function paint() {
    const ctx = canvasRef.current?.getContext("2d");
    const l = layers.current;
    if (!ctx || !l) return;
    const t = progress.current;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(l.bot, 0, 0);
    if (t <= 0) return;
    const soft = 0.12;
    for (let i = 0; i < order.length; i++) {
      const a = Math.min(1, Math.max(0, (t * (1 + soft) - order[i]) / soft));
      if (a <= 0) continue;
      const x = (i % COLS) * CELL;
      const y = Math.floor(i / COLS) * CELL;
      ctx.globalAlpha = a;
      ctx.drawImage(l.face, x, y, CELL, CELL, x, y, CELL, CELL);
    }
    ctx.globalAlpha = 1;
  }

  function run() {
    cancelAnimationFrame(raf.current);
    let last = performance.now();
    const step = (now: number) => {
      const dir = target.current ? 1 : -1;
      progress.current = Math.min(1, Math.max(0, progress.current + (dir * (now - last)) / 1300));
      last = now;
      paint();
      const done = target.current ? progress.current >= 1 : progress.current <= 0;
      if (!done) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  // Build both layers once; the photo only loads when the pet is first opened.
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(BOT_SVG)}`),
      loadImage(pilotLog.photo),
    ]).then(([bot, photo]) => {
      if (!alive) return;
      const botLayer = layer();
      const c = botLayer.getContext("2d")!;
      c.fillStyle = BG;
      c.fillRect(0, 0, SIZE, SIZE);
      c.drawImage(bot, 8, 8, SIZE - 16, SIZE - 16);

      const faceLayer = layer();
      faceLayer
        .getContext("2d")!
        .drawImage(photo, CROP.sx, CROP.sy, CROP.sw, CROP.sh, 0, 0, SIZE, SIZE);

      layers.current = { bot: botLayer, face: faceLayer };
      paint();
      if (reduced) progress.current = target.current ? 1 : 0;
      paint();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!layers.current) return;
    if (reduced) {
      progress.current = morphed ? 1 : 0;
      paint();
    } else {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [morphed, reduced]);

  return <canvas ref={canvasRef} className="pet-morph" width={SIZE} height={SIZE} aria-hidden="true" />;
}
