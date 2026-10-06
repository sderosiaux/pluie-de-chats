// Sons synthétisés (§19), sans fichier externe. Le contexte WebAudio naît au premier geste
// (politique d'autoplay des navigateurs) ; avant ça, chaque son est un no-op.

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;

/** Préférence son du joueur (§22). Coupé : chaque son est un no-op. */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function unlockAudio(): void {
  if (!ac) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ac = new Ctor();
    master = ac.createGain();
    master.gain.value = 0.45;
    master.connect(ac.destination);
    noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.4), ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') void ac.resume();
}

function ready(): { ctx: AudioContext; out: GainNode } | null {
  return enabled && ac && master && ac.state === 'running' ? { ctx: ac, out: master } : null;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number): void {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + start;
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Pentatonique majeure de do : la note monte d'un degré par maillon (§19).
const PENTA = [0, 2, 4, 7, 9];
const ROOT = 392; // sol 4

/** Note du n-ième maillon d'une chaîne (n ≥ 1). Plafonnée à trois octaves. */
export function chainNote(n: number): void {
  const k = Math.min(Math.max(n, 1) - 1, 14);
  const semis = PENTA[k % 5] + 12 * Math.floor(k / 5);
  const f = ROOT * Math.pow(2, semis / 12);
  tone(f, 0, 0.32, 'triangle', 0.32);
  tone(f * 2, 0, 0.18, 'sine', 0.08);
}

/** Aboiement : deux « waf » de bruit filtré avec un grondement court. */
export function bark(): void {
  const a = ready();
  if (!a || !noise) return;
  for (const start of [0, 0.16]) {
    const t = a.ctx.currentTime + start;
    const src = a.ctx.createBufferSource();
    src.buffer = noise;
    const bp = a.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(1100, t);
    bp.frequency.exponentialRampToValueAtTime(420, t + 0.12);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    src.connect(bp).connect(g).connect(a.out);
    src.start(t);
    src.stop(t + 0.15);
    const o = a.ctx.createOscillator();
    const og = a.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(130, t + 0.11);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(og).connect(a.out);
    o.start(t);
    o.stop(t + 0.14);
  }
}

/** Carillon : pelote rendue. */
export function chime(): void {
  [1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.5, 'sine', 0.18));
}

/** « Tink » métallique : bouclier cassé. */
export function tink(): void {
  tone(2960, 0, 0.14, 'sine', 0.22);
  tone(4430, 0, 0.09, 'sine', 0.1);
}
