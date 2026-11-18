// Synthesized "heavy machinery" HUD sound effects — no external audio files
// (so no Epidemic Sound licensing issue). Each sound layers four synthesis
// primitives: a deep sub-bass thump (raw mass), a mid-range pitch-dropping
// thud (impact body), an inharmonic "metallic ring" (multiple detuned sine
// partials, like struck metal), and filtered noise (an impact snap, or a
// slow hydraulic hiss) — aiming for the weight of a hydraulic hatch/heavy
// relay instead of a synth beep.
//
// Everything runs through one shared bus: a compressor (glues the layered
// transients together, keeps peaks in check) and a short synthetic-impulse
// convolver reverb (a little "cockpit/hangar" space so it doesn't sound dry
// and boxed-in). Pitch/timing get a small random jitter per play so repeated
// hovers on the same button don't sound like a stuck robot.
//
// Browsers block audio until a real user gesture, so the AudioContext is
// created lazily on first hover/click, not at module load.

import { getSharedAudioContext as getContext, getSharedOutputBus } from "./audioContext";

let noiseBuffer: AudioBuffer | null = null;
let masterBus: GainNode | null = null;

function createImpulseResponse(audio: AudioContext): AudioBuffer {
  const duration = 1.1;
  const length = Math.floor(audio.sampleRate * duration);
  const impulse = audio.createBuffer(2, length, audio.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5);
    }
  }
  return impulse;
}

/** Every sound connects here instead of straight to destination. */
function getMasterBus(audio: AudioContext): GainNode {
  if (masterBus) return masterBus;

  const input = audio.createGain();

  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 22;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  const dry = audio.createGain();
  dry.gain.value = 0.9;
  const wet = audio.createGain();
  wet.gain.value = 0.16;

  const convolver = audio.createConvolver();
  convolver.buffer = createImpulseResponse(audio);

  input.connect(dry);
  input.connect(convolver);
  convolver.connect(wet);
  dry.connect(compressor);
  wet.connect(compressor);
  compressor.connect(getSharedOutputBus(audio));

  masterBus = input;
  return input;
}

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== audio.sampleRate) {
    const length = Math.max(1, Math.floor(audio.sampleRate * 0.5));
    noiseBuffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** +/- amount as a fraction, e.g. jitter(1, 0.04) => somewhere in [0.96, 1.04]. */
function jitter(value: number, amount: number): number {
  return value * (1 + (Math.random() * 2 - 1) * amount);
}

/** Short filtered noise transient — an impact snap, or (with loop) a hiss. */
function noiseBurst(
  audio: AudioContext,
  {
    duration,
    peakGain,
    filterFreq,
    endFilterFreq,
    filterQ = 0.7,
    type = "lowpass",
    loop = false,
  }: {
    duration: number;
    peakGain: number;
    filterFreq: number;
    endFilterFreq?: number;
    filterQ?: number;
    type?: BiquadFilterType;
    loop?: boolean;
  }
) {
  const buffer = getNoiseBuffer(audio);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.loop = loop;
  const filter = audio.createBiquadFilter();
  filter.type = type;
  filter.Q.value = filterQ;
  const gain = audio.createGain();

  const now = audio.currentTime;
  filter.frequency.setValueAtTime(filterFreq, now);
  if (endFilterFreq) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(endFilterFreq, 1), now + duration);
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterBus(audio));

  const maxOffset = loop ? 0 : Math.max(0, buffer.duration - duration - 0.02);
  src.start(now, maxOffset > 0 ? Math.random() * maxOffset : 0);
  src.stop(now + duration + 0.02);
}

/** A pitch-dropping tone — used for both the mid "impact body" and the deep sub-bass thump. */
function thud(
  audio: AudioContext,
  {
    startFreq,
    endFreq,
    duration,
    peakGain,
    type = "triangle",
    filterFreq,
  }: {
    startFreq: number;
    endFreq: number;
    duration: number;
    peakGain: number;
    type?: OscillatorType;
    filterFreq?: number;
  }
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;

  const pitchJitter = jitter(1, 0.04);
  const now = audio.currentTime;
  osc.frequency.setValueAtTime(startFreq * pitchJitter, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq * pitchJitter, 1), now + duration);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + duration * 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  let out: AudioNode = osc;
  if (filterFreq) {
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    osc.connect(filter);
    out = filter;
  }
  out.connect(gain);
  gain.connect(getMasterBus(audio));
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/** Inharmonic sine partials that decay together — the "clank" of struck metal. */
function metallicRing(
  audio: AudioContext,
  {
    baseFreq,
    duration,
    peakGain,
    partials = [1, 1.7, 2.4, 3.3, 4.6],
  }: { baseFreq: number; duration: number; peakGain: number; partials?: number[] }
) {
  const now = audio.currentTime;
  const jitteredBase = jitter(baseFreq, 0.05);
  const master = audio.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(peakGain, now + duration * 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(getMasterBus(audio));

  for (const mult of partials) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(jitteredBase * mult, now);
    const g = audio.createGain();
    g.gain.value = 1 / partials.length;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

export function playHoverSound() {
  const audio = getContext();
  if (!audio) return;
  // Same recipe as click/close (snap + thud + metal clank), just lighter and
  // shorter — a light relay tick instead of a full switch engaging — so all
  // three read as one consistent sound family rather than hover being a
  // different-sounding blip.
  noiseBurst(audio, { duration: 0.014, peakGain: 0.022, filterFreq: 4000, type: "highpass" });
  thud(audio, { startFreq: 190, endFreq: 250, duration: 0.032, peakGain: 0.05, type: "triangle", filterFreq: 900 });
  metallicRing(audio, { baseFreq: 640, duration: 0.045, peakGain: 0.02 });
}

export function playClickSound() {
  const audio = getContext();
  if (!audio) return;
  // Heavy lever/switch engaging: snap, sub-bass mass, mid thud body, metal clank.
  noiseBurst(audio, { duration: 0.03, peakGain: 0.075, filterFreq: 3600, type: "highpass" });
  thud(audio, { startFreq: 70, endFreq: 24, duration: 0.16, peakGain: 0.16, type: "sine", filterFreq: 220 });
  thud(audio, { startFreq: 130, endFreq: 32, duration: 0.15, peakGain: 0.17, type: "triangle", filterFreq: 460 });
  metallicRing(audio, { baseFreq: 380, duration: 0.13, peakGain: 0.06 });
}

export function playCloseSound() {
  const audio = getContext();
  if (!audio) return;
  // Deep sub thump + low thud + duller clank + a long receding hydraulic
  // hiss tail — a heavy hatch sealing shut under its own weight.
  thud(audio, { startFreq: 55, endFreq: 18, duration: 0.3, peakGain: 0.17, type: "sine", filterFreq: 160 });
  thud(audio, { startFreq: 105, endFreq: 22, duration: 0.26, peakGain: 0.16, type: "triangle", filterFreq: 360 });
  metallicRing(audio, { baseFreq: 230, duration: 0.18, peakGain: 0.04 });
  noiseBurst(audio, {
    duration: 0.42,
    peakGain: 0.05,
    filterFreq: 1800,
    endFilterFreq: 300,
    type: "bandpass",
    filterQ: 0.8,
    loop: true,
  });
}
