// Tiny Web Audio synth for sound effects. No audio files needed.
let ctx = null, master = null, enabled = true, lastClick = 0;

function ensure() {
  if (!enabled) return false;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.32;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  } catch (e) {
    return false;
  }
}

function tone(freq, dur, { type = "sine", gain = 0.3, attack = 0.005, slide = 0, delay = 0 } = {}) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur, { gain = 0.15, delay = 0, freq = 1800 } = {}) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + delay;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass"; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0);
}

const notes = (list, step, opts) => list.forEach((f, i) => tone(f, opts.dur || 0.18, { ...opts, delay: i * step }));

export const sfx = {
  click() {
    const now = performance.now();
    if (now - lastClick < 35) return;
    lastClick = now;
    tone(420 + Math.random() * 90, 0.08, { type: "triangle", gain: 0.22, slide: 260 });
    noise(0.04, { gain: 0.05, freq: 3000 });
  },
  buy() { tone(660, 0.09, { type: "square", gain: 0.08 }); tone(990, 0.12, { type: "square", gain: 0.08, delay: 0.07 }); },
  sell() { tone(700, 0.09, { type: "square", gain: 0.07 }); tone(470, 0.12, { type: "square", gain: 0.07, delay: 0.07 }); },
  upgrade() { notes([523, 659, 784, 1047], 0.06, { type: "triangle", gain: 0.18, dur: 0.22 }); },
  achievement() { notes([784, 988, 1175, 1568], 0.08, { type: "sine", gain: 0.2, dur: 0.35 }); },
  news() { tone(988, 0.25, { gain: 0.2 }); tone(784, 0.35, { gain: 0.2, delay: 0.18 }); },
  rally() {
    tone(220, 0.6, { type: "sawtooth", gain: 0.08, slide: 660 });
    notes([523, 659, 784, 1047, 1319], 0.07, { type: "square", gain: 0.06, dur: 0.3 });
  },
  decision() { tone(392, 0.2, { type: "triangle", gain: 0.2 }); tone(523, 0.3, { type: "triangle", gain: 0.2, delay: 0.15 }); },
  election() {
    notes([392, 523, 659, 784], 0.12, { type: "triangle", gain: 0.2, dur: 0.4 });
    notes([523, 659, 784, 1047], 0.12, { type: "sine", gain: 0.12, dur: 0.6, delay: 0.5 });
    for (let i = 0; i < 6; i++) noise(0.3, { gain: 0.08, delay: 0.6 + i * 0.12, freq: 1200 + i * 300 });
  },
  denied() { tone(160, 0.15, { type: "square", gain: 0.06 }); },
};

export function setSoundEnabled(on) { enabled = on; if (!on && ctx) ctx.suspend(); }
export function unlockAudio() { ensure(); }
