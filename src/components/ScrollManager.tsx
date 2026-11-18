import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

let homeY = 0;

// Every case study opens at the very top; going back to the home page returns
// to where the reader left off.
export default function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const onScroll = () => {
      homeY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useLayoutEffect(() => {
    if (pathname !== "/") {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    // The home page may not have its full height on the first frame, so keep
    // trying briefly until the saved position is reachable.
    const target = homeY;
    const until = performance.now() + 1500;
    let raf = 0;
    const restore = () => {
      window.scrollTo({ top: target, behavior: "instant" });
      if (Math.abs(window.scrollY - target) > 2 && performance.now() < until) raf = requestAnimationFrame(restore);
    };
    restore();
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
