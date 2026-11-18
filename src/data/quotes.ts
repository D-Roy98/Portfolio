export interface Quote {
  lang: "en" | "hi" | "de" | "es";
  text: string;
  /** English translation, shown beneath every non-English quote. */
  caption?: string;
}

export const quotes: Quote[] = [
  { lang: "en", text: "Simplicity is the soul of efficiency." },
  { lang: "hi", text: "ज्ञान ही शक्ति है।", caption: "Knowledge is power." },
  {
    lang: "de",
    text: "Man muss das Unmögliche versuchen, um das Mögliche zu erreichen.",
    caption: "One must try the impossible to achieve the possible.",
  },
  {
    lang: "es",
    text: "El único modo de hacer un buen trabajo es amar lo que haces.",
    caption: "The only way to do great work is to love what you do.",
  },
];
