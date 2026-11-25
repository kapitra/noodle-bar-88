// Tiny synthesized sound effects. Everything is made with the Web Audio
// API at run time — no audio files, no network, nothing to load.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.1, when = 0, lowpass = 3000) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  unlock() { audio(); },
  setMuted(value) { muted = value; },
  isMuted() { return muted; },
  pickup() { tone(520, 0.08, 'triangle', 0.08); },
  chop() { noise(0.09, 0.16, 0, 1800); tone(180, 0.06, 'square', 0.05); },
  chopped() { tone(660, 0.09, 'triangle', 0.1); tone(880, 0.12, 'triangle', 0.1, 0.08); },
  sizzle() { noise(0.35, 0.07, 0, 5200); },
  cooked() { tone(740, 0.1, 'sine', 0.11); tone(988, 0.16, 'sine', 0.11, 0.09); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.07, 0, 110); },
  plated() { tone(440, 0.07, 'triangle', 0.09); tone(587, 0.09, 'triangle', 0.09, 0.06); },
  coin() { tone(988, 0.09, 'sine', 0.12); tone(1319, 0.18, 'sine', 0.12, 0.08); },
  serve() { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.1, 0.09); tone(784, 0.2, 'triangle', 0.11, 0.18); },
  error() { tone(160, 0.18, 'square', 0.07, 0, 110); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  rush() { tone(392, 0.12, 'triangle', 0.1); tone(523, 0.12, 'triangle', 0.1, 0.1); tone(659, 0.2, 'triangle', 0.1, 0.2); },
};
