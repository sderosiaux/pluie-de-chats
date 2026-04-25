import { canvas } from './canvas';

// ── Music Engine — chiptune Web Audio API ─────────────────────────────────────
export const Music = (() => {
  let actx: AudioContext;
  let master: GainNode;
  let playing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let until = 0;
  const BPM = 160;
  const S  = 60 / BPM / 4; // 16th note = 0.09375s

  // G major note table (Hz)
  const __ = 0;
  const G2=98,
    G3=196, A3=220, B3=247, D4=294, Fs4=370,
    G4=392, A4=440, B4=494, C5=523, D5=587, E5=659, Fs5=740, G5=784, A5=880, B5=988;

  // 4-bar melody (64 × 16th notes = 6s loop)
  const MEL = [
    // Bar 1 — motif joueur
    D5,__,E5,D5,  C5,B4,C5,D5,  E5,__,Fs5,E5,  D5,C5,B4,A4,
    // Bar 2 — montée excitante
    G5,__,A5,G5,  Fs5,E5,Fs5,G5, A5,__,B5,A5,  G5,Fs5,E5,D5,
    // Bar 3 — run descendant puis montée
    G5,Fs5,E5,D5,  E5,Fs5,G5,A5,  B5,A5,G5,Fs5,  E5,D5,C5,B4,
    // Bar 4 — résolution victorieuse
    G4,B4,D5,G5,  Fs5,E5,D5,C5,  D5,__,G5,__,  D5,B4,G4,__,
  ];

  // Basse (triangle, 16-step cycle)
  const BAS = [G3,__,__,__, D4,__,__,__, G3,__,__,__, D4,__,__,__];

  // Contre-mélodie (triangle, 64 steps, une octave en dessous)
  const CTR = [
    G4,__,__,__,  G4,__,A4,__,  B4,__,__,__,  A4,__,G4,__,
    B4,__,__,__,  D5,__,__,__,  E5,__,D5,__,  B4,__,G4,__,
    D5,__,__,__,  D5,__,E5,__,  G5,__,E5,__,  D5,__,B4,__,
    G4,__,B4,__,  D5,__,B4,__,  G4,__,__,__,  G4,__,__,__,
  ];

  // Drums (16-step, repeat)
  //  K=kick  S=snare  H=hihat
  const DRM = ['K','_','H','_','S','_','H','H','K','H','_','H','S','_','H','_'];

  function init() {
    if (actx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    actx = new Ctx();
    master = actx.createGain();
    master.gain.value = 0.28;
    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 6; comp.ratio.value = 5;
    master.connect(comp); comp.connect(actx.destination);
  }

  function note(freq: number, t: number, dur: number, type: OscillatorType, vol: number, detune = 0) {
    if (!freq) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    const att = 0.006, rel = Math.min(0.05, dur * 0.25);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, t + dur - rel);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.01);
  }

  function kick(t: number) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(1, t + 0.3);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.31);
  }

  function snare(t: number) {
    const len = 0.14;
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * len), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = actx.createBufferSource(); n.buffer = buf;
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.7;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.42, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t); n.stop(t + len + 0.01);
    // tone body
    const o = actx.createOscillator(), g2 = actx.createGain();
    o.type = 'triangle'; o.frequency.value = 195;
    g2.gain.setValueAtTime(0.22, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.07);
  }

  function hihat(t: number) {
    const len = 0.036;
    const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * len), actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = actx.createBufferSource(); n.buffer = buf;
    const f = actx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8500;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t); n.stop(t + len + 0.01);
  }

  function scheduleLoop(start: number): number {
    const steps = MEL.length; // 64
    for (let i = 0; i < steps; i++) {
      const t = start + i * S;
      // Melody — square wave (authentic chiptune)
      if (MEL[i]) note(MEL[i], t, S * 0.82, 'square', 0.14);
      // Counter-melody — triangle (warmth)
      if (CTR[i]) note(CTR[i], t, S * 1.6, 'triangle', 0.07);
      // Bass — triangle
      if (BAS[i % 16]) note(BAS[i % 16], t, S * 3.4, 'triangle', 0.22);
      // Drums
      const d = DRM[i % 16];
      if (d === 'K') kick(t);
      else if (d === 'S') snare(t);
      else if (d === 'H') hihat(t);
    }
    return steps * S; // loop duration
  }

  function pump() {
    if (!playing) return;
    const LA = 0.25;
    while (until < actx.currentTime + LA) until += scheduleLoop(until);
    timer = setTimeout(pump, 30);
  }

  // Public SFX (play detached, doesn't need music running)
  function sfx(freqs: number[], dur = 0.1, vol = 0.22, type: OscillatorType = 'sine') {
    if (!actx) return;
    freqs.forEach((f, i) => {
      if (f) setTimeout(() => note(f, actx.currentTime, dur, type, vol), i * 55);
    });
  }

  return {
    start() {
      init();
      if (actx.state === 'suspended') actx.resume();
      if (playing) return;
      playing = true; until = actx.currentTime + 0.05; pump();
    },
    stop() { playing = false; if (timer) clearTimeout(timer); },
    toggle() { playing ? this.stop() : this.start(); return playing; },
    get on() { return playing; },
    sfxCatch(pts: number) {
      if (!actx) init();
      if (pts >= 5)  sfx([G5, B5, D5*2], 0.1, 0.22, 'square');
      else if (pts >= 3) sfx([E5, G5], 0.09, 0.18, 'square');
      else if (pts > 0)  sfx([C5], 0.07, 0.14, 'square');
      else               sfx([A3, G3], 0.15, 0.2, 'square'); // faux
    },
    sfxLevelUp() {
      if (!actx) init();
      sfx([G4, B4, D5, G5], 0.12, 0.25, 'square');
    },
  };
})();


// ── Music button wiring ───────────────────────────────────────────────────────
document.getElementById('music-btn')?.addEventListener('click', () => {
  const on = Music.toggle();
  const btn = document.getElementById('music-btn');
  if (btn) btn.textContent = on ? '🎵' : '🔇';
});

// Auto-start on first canvas interaction (browsers require user gesture)
canvas.addEventListener('pointerdown', () => {
  if (!Music.on) {
    Music.start();
    const btn = document.getElementById('music-btn');
    if (btn) btn.textContent = '🎵';
  }
}, { once: true });

