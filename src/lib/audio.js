/**
 * Minimal WebAudio sounds — synthesized so we ship zero audio files.
 * Lazy-init AudioContext on first use (browser autoplay rules).
 */

let ctx = null;
let enabled = true;

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSoundEnabled(v) {
  enabled = !!v;
}

function tone({ freq, duration, type = 'sine', gain = 0.18, freqEnd = null }) {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export function playCorrect() {
  tone({ freq: 660, freqEnd: 990, duration: 0.12, type: 'triangle', gain: 0.15 });
}

export function playWrong() {
  tone({ freq: 220, freqEnd: 120, duration: 0.22, type: 'sawtooth', gain: 0.12 });
}

export function playNewBest() {
  if (!enabled) return;
  const c = ensureCtx();
  if (!c) return;
  const seq = [523, 659, 784, 1047]; // C E G C
  seq.forEach((f, i) => {
    setTimeout(() => tone({ freq: f, duration: 0.18, type: 'triangle', gain: 0.18 }), i * 90);
  });
}

export function playTick() {
  tone({ freq: 880, duration: 0.05, type: 'square', gain: 0.06 });
}
