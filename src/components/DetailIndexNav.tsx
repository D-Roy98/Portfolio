import { useEffect, useRef, useState } from "react";

// Left-side scroll-spy table of contents for case-study/archive detail
// pages — highlights whichever section is currently in view and jumps to a
// section on click, so a long case study reads as a set of reachable parts
// instead of one undifferentiated scroll.
export default function DetailIndexNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const els = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActive(topMost.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    els.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [items]);

  return (
    <nav className="detail-index" aria-label="Section index">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`detail-index-item ${active === item.id ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
