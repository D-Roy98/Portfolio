// Site-wide parallax. Elements opt in with data attributes:
//   data-parallax="0.1"       drift speed (fraction of distance from viewport centre)
//   data-parallax-max="60"    cap on the shift, in px (default 60)
//   data-parallax-fit         image inside an overflow:hidden frame; the cap comes
//                             from the CSS `scale` so the edges never show
// The shift is measured from the element's parent (which doesn't move), written
// to the --p custom property, and applied with the independent `translate`
// property, so it never fights Framer Motion or hover transforms.
export function startParallax(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const scales = new WeakMap<HTMLElement, number>();
  const fitScale = (el: HTMLElement) => {
    let v = scales.get(el);
    if (v === undefined) {
      v = parseFloat(getComputedStyle(el).scale) || 1;
      scales.set(el, v);
    }
    return v;
  };

  let items: HTMLElement[] = [];
  let frame = 0;

  const scan = () => {
    items = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    schedule();
  };

  const update = () => {
    frame = 0;
    const vh = window.innerHeight;
    for (const el of items) {
      const parent = el.parentElement;
      if (!parent) continue;
      const r = parent.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue; // off screen
      const speed = parseFloat(el.dataset.parallax ?? "0");
      const fit = el.hasAttribute("data-parallax-fit");
      // For images the cap is the margin the CSS `scale` leaves on each side.
      const max = fit ? r.height * (fitScale(el) - 1) / 2 : parseFloat(el.dataset.parallaxMax ?? "60");
      const centre = r.top + r.height / 2 - vh / 2;
      const shift = Math.max(-max, Math.min(max, -centre * speed));
      el.style.setProperty("--p", `${shift.toFixed(1)}px`);
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  scan();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  // Pages mount and unmount content as you navigate; re-scan when the DOM changes.
  let debounce = 0;
  const mo = new MutationObserver(() => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(scan, 120);
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(debounce);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    mo.disconnect();
  };
}
