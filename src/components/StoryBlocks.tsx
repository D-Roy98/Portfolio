import { useMemo, useState } from "react";
import { ArrowUpRightIcon } from "./Icons";
import type { WorkBlock } from "../data/otherWork";
import Highlighted from "./Highlighted";
import Lightbox, { type LightboxState } from "./Lightbox";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Short, unpunctuated lines ("Discover", "Pain points") are sub-labels in the source.
const isLabel = (text: string) => {
  const plain = text.replace(/\*\*/g, "").trim();
  return plain.split(/\s+/).length <= 4 && !/[.:!?]$/.test(plain) && !plain.startsWith("-");
};

type Group =
  | { kind: "p"; text: string }
  | { kind: "label"; text: string }
  | { kind: "ol"; start: number; items: string[] }
  | { kind: "ul"; items: string[]; nested: boolean }
  | { kind: "img"; items: { src: string; index: number }[] }
  | { kind: "link"; label: string; href: string };

export type Section = { id: string; heading?: string; groups: Group[] };

export function toSections(blocks: WorkBlock[]) {
  const sections: Section[] = [{ id: "intro", groups: [] }];
  const used = new Set<string>();
  const images: { src: string; caption: string }[] = [];

  for (const b of blocks) {
    let cur = sections[sections.length - 1];
    if (b.t === "h") {
      let id = slugify(b.text) || "section";
      while (used.has(id)) id += "-2";
      used.add(id);
      cur = { id, heading: b.text, groups: [] };
      sections.push(cur);
      continue;
    }
    const last = cur.groups[cur.groups.length - 1];
    if (b.t === "sub") {
      cur.groups.push({ kind: "label", text: b.text });
    } else if (b.t === "p") {
      cur.groups.push(isLabel(b.text) ? { kind: "label", text: b.text } : { kind: "p", text: b.text });
    } else if (b.t === "ol") {
      if (last?.kind === "ol") last.items.push(b.text);
      else cur.groups.push({ kind: "ol", start: b.n, items: [b.text] });
    } else if (b.t === "ul") {
      if (last?.kind === "ul") last.items.push(b.text);
      else cur.groups.push({ kind: "ul", items: [b.text], nested: last?.kind === "ol" });
    } else if (b.t === "link") {
      cur.groups.push({ kind: "link", label: b.label, href: b.href });
    } else {
      const index = images.push({ src: b.src, caption: b.caption }) - 1;
      if (last?.kind === "img") last.items.push({ src: b.src, index });
      else cur.groups.push({ kind: "img", items: [{ src: b.src, index }] });
    }
  }
  return { sections: sections.filter((s) => s.heading || s.groups.length > 0), images };
}


// Renders a list of blocks as page sections (headings, text, lists, figures and
// links) plus a lightbox for the images. `onSections` lets the page build its
// index from the headings.
export default function StoryBlocks({ sections, images, showCaptions = false }: { sections: Section[]; images: { src: string; caption: string }[]; showCaptions?: boolean }) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  return (
    <>
      {sections.map((section) => (
        <section className="detail-section" id={section.id} key={section.id}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.groups.map((g, gi) => {
            if (g.kind === "p") return <p key={gi}><Highlighted text={g.text} /></p>;
            if (g.kind === "label") return <h3 key={gi} className="work-sub"><Highlighted text={g.text} /></h3>;
            if (g.kind === "ol")
              return (
                <ol key={gi} start={g.start} className="work-list">
                  {g.items.map((t, i) => <li key={i}><Highlighted text={t} /></li>)}
                </ol>
              );
            if (g.kind === "ul")
              return (
                <ul key={gi} className={`work-list${g.nested ? " is-nested" : ""}`}>
                  {g.items.map((t, i) => <li key={i}><Highlighted text={t} /></li>)}
                </ul>
              );
            if (g.kind === "link")
              return (
                <a key={gi} className="work-link" href={g.href} target="_blank" rel="noreferrer" data-cursor="open">
                  {g.label}
                  <ArrowUpRightIcon size={16} />
                </a>
              );
            return (
              <div key={gi} className={`work-figures work-figures--${Math.min(g.items.length, 3)}`}>
                {g.items.map((img) => (
                  <figure key={img.src} className="work-figure">
                    <img
                      src={img.src}
                      alt={images[img.index].caption}
                      loading="lazy"
                      data-cursor="explore"
                      onClick={() => setLightbox({ images: images.map((i) => i.src), captions: images.map((i) => i.caption), index: img.index })}
                    />
                    {showCaptions && images[img.index].caption && <figcaption>{images[img.index].caption}</figcaption>}
                  </figure>
                ))}
              </div>
            );
          })}
        </section>
      ))}
      <Lightbox
        state={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
      />
    </>
  );
}

export function useStory(blocks: WorkBlock[] | undefined) {
  return useMemo(() => (blocks && blocks.length ? toSections(blocks) : null), [blocks]);
}
