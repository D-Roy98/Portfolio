// Standalone letters only (no combining vowel signs), so every glyph renders
// as a single clean character in the rain.
const letters = (s: string) => Array.from(s);

const LATIN = letters("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

export const scripts: Record<string, string[]> = {
  english: LATIN,
  hindi: letters("अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह"),
  bengali: letters("অআইঈউঊএঐওঔকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহ"),
  telugu: letters("అఆఇఈఉఊఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహ"),
  kannada: letters("ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಚಛಜಝಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ"),
  tamil: letters("அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன"),
  malayalam: letters("അആഇഈഉഊഎഏഐഒഓഔകഖഗഘചഛജഝടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹ"),
  punjabi: letters("ੳਅੲਸਹਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵੜ"),
};

const pool = Object.values(scripts);

// Every script is equally likely, so a long Latin alphabet doesn't drown out
// the shorter ones.
export function randomGlyph(): string {
  const script = pool[(Math.random() * pool.length) | 0];
  return script[(Math.random() * script.length) | 0];
}
