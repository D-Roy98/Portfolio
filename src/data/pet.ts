import { pilotLog, flightPlan, processCopy, testimonials, comms } from "./content";
import { projects } from "./projects";

export interface PetQA {
  id: string;
  question: string;
  lines: string[];
  cta?: { label: string; href: string };
}

// Every answer is assembled from content that is already on the site (bio,
// skills, process, case studies, and real recommendations) — nothing here is
// written from scratch, so the pet can't say anything the portfolio doesn't
// already stand behind.
const plain = (s: string) => s.replace(/\*\*/g, "");
const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

// "Name, designation". Where a designation isn't in the data, fall back to
// how they worked with Diganta rather than guessing a title.
const who = (name: string) => {
  const t = testimonials.find((x) => x.name === name);
  if (!t) return name;
  const role = "designation" in t ? t.designation : t.relationship[0].toLowerCase() + t.relationship.slice(1);
  return `${name} (${role})`;
};

export const petQA: PetQA[] = [
  {
    id: "expertise",
    question: "What's his expertise?",
    lines: [
      "Diganta is a Product / UX designer, with a focus on automotive and connected-mobility experiences.",
      ...pilotLog.skills.map((s) => `${s.group}: ${s.items.join(", ")}`),
    ],
  },
  {
    id: "bring",
    question: "What would he bring to the table?",
    lines: [
      "He puts users before ego and function before noise.",
      "He turns complex OEM requirements into meaningful experience concepts, quickly.",
      "He grounds his thinking in real research, including direct conversations with automotive stakeholders and dealerships.",
      "He follows through, and meets his deadlines.",
      `From recommendations by ${who("Yogesh Umbarkar")} and ${who("Heeren Darji")}.`,
    ],
  },
  {
    id: "hire",
    question: "Why would someone hire him?",
    lines: [
      "Three people who've worked with him recommend him: two managers and a teammate.",
      `“He is truly an asset to any team.” — ${who("Madhumanti Ghosh")}`,
      `“Outstanding curiosity, excellent visual design skills, and reliable follow-through.” — ${who("Heeren Darji")}`,
      "He has designed for a global French automotive OEM, and is currently a UX/UI Designer at Valtech.",
    ],
  },
  {
    id: "working",
    question: "How does he work?",
    lines: [
      ...processCopy.text.replace(/\*\*/g, "").split(". ").map((s) => (s.endsWith(".") ? s : s + ".")),
      `The ${flightPlan.length} steps:`,
      ...flightPlan.map((step) => `${cap(step.name)}: ${step.detail}`),
    ],
  },
  {
    id: "contributions",
    question: "What are his contributions?",
    lines: [
      "Across his case studies, he has contributed to:",
      ...projects.map((p) => `${p.title}: ${p.contributions.slice(0, 2).map(plain).join("; ")}`),
    ],
  },
  {
    id: "work",
    question: "What has he worked on?",
    lines: projects.map((p) => `${p.title}: ${p.brief}`),
  },
  {
    id: "contact",
    question: "How can I reach him?",
    lines: [`Email: ${comms.email}`, `He's based in ${pilotLog.base}, and currently open to new work.`],
    cta: { label: "Send an email", href: `mailto:${comms.email}` },
  },
];

