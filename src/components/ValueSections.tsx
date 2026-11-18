import Highlighted from "./Highlighted";

export interface CaseStudyValues {
  business: string;
  user: string;
  organization: string;
}

const blocks: { key: keyof CaseStudyValues; title: string; hint: string }[] = [
  { key: "business", title: "Business value", hint: "What this did (or could do) for the business: revenue, cost, adoption, risk." },
  { key: "user", title: "User value", hint: "What changed for the people using it: effort saved, clarity, confidence." },
  { key: "organization", title: "What it means to my organization", hint: "Why it matters to the team or company: capability built, process improved, reuse." },
];

// True when at least one of the three fields has real copy.
export const hasValues = (v?: Partial<CaseStudyValues>) => !!v && blocks.some((b) => v[b.key]?.trim());

// A shared section for every case study. Fill the three fields in the data file
// (src/data/projects.ts or content.ts). Empty fields show a placeholder while
// developing (npm run dev) and stay hidden on the live site, so nothing
// unfinished is ever published.
export default function ValueSections({ values }: { values?: Partial<CaseStudyValues> }) {
  const dev = import.meta.env.DEV;
  const shown = blocks.filter((b) => values?.[b.key]?.trim() || dev);
  if (shown.length === 0) return null;

  return (
    <section className="detail-section" id="value">
      <h2>Value</h2>
      <div className="value-grid">
        {shown.map((b) => {
          const text = values?.[b.key]?.trim();
          return (
            <div key={b.key} className={`value-block${text ? "" : " is-placeholder"}`}>
              <h3>{b.title}</h3>
              <p>{text ? <Highlighted text={text} /> : `Placeholder: ${b.hint}`}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
