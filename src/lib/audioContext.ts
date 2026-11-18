// One shared AudioContext for both UI sound effects and background music —
// browsers only allow a handful of live contexts per page, and reusing one
// keeps the "unlocked by user gesture" state shared between the two.
let ctx: AudioContext | null = null;
let outputLimiter: DynamicsCompressorNode | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** Final safety limiter both the UI sounds and the music bus feed into, so
 * the two playing together can never clip the output. */
export function getSharedOutputBus(audio: AudioContext): AudioNode {
  if (!outputLimiter) {
    outputLimiter = audio.createDynamicsCompressor();
    outputLimiter.threshold.value = -14;
    outputLimiter.knee.value = 18;
    outputLimiter.ratio.value = 8;
    outputLimiter.attack.value = 0.003;
    outputLimiter.release.value = 0.25;
    outputLimiter.connect(audio.destination);
  }
  return outputLimiter;
}
