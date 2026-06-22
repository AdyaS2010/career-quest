import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type SfxType = 'click' | 'success' | 'error' | 'complete' | 'hover' | 'notification' | 'tick' | 'warning'
  | 'enter' | 'score' | 'star' | 'levelup' | 'coin' | 'chime' | 'footstep';

// Each place in the world gets its own cozy ambient bed — a soft evolving pad
// plus gentle random "twinkles", all synthesised live (no audio files, fully
// royalty-free). Scenes map 1:1 to the career slugs, plus the hub + arcade.
export type AmbienceScene =
  | 'city' | 'city-night' | 'health-sciences' | 'culinary-arts' | 'education'
  | 'information-technology' | 'arts-entertainment' | 'media-communication'
  | 'law-government' | 'financial-services' | 'arcade';

interface ScenePreset {
  pad: number[];           // chord voice base frequencies (Hz)
  wave: OscillatorType;    // pad timbre
  cutoff: number;          // low-pass cutoff for warmth
  level: number;           // overall ambient loudness
  scale: number[];         // notes the random twinkles pick from
  twWave: OscillatorType;  // twinkle timbre
  twGap: [number, number]; // ms range between twinkles
  twLevel: number;         // twinkle peak gain
  air: number;             // filtered-noise "air"/room tone level (0 = none)
}

// Tuned chords + pentatonic-ish twinkle scales so every layer stays consonant.
const SCENES: Record<AmbienceScene, ScenePreset> = {
  'city':                   { pad: [130.81, 196.00, 261.63, 329.63], wave: 'sine',     cutoff: 760,  level: 0.040, scale: [523.25, 587.33, 659.25, 783.99, 880.00], twWave: 'sine',     twGap: [3600, 7200], twLevel: 0.026, air: 0.030 },
  'city-night':             { pad: [98.00, 146.83, 196.00, 293.66],  wave: 'sine',     cutoff: 560,  level: 0.034, scale: [659.25, 783.99, 987.77, 1174.66],         twWave: 'sine',     twGap: [4800, 9500], twLevel: 0.022, air: 0.052 },
  'health-sciences':        { pad: [146.83, 220.00, 293.66, 369.99], wave: 'sine',     cutoff: 1100, level: 0.052, scale: [587.33, 659.25, 880.00, 987.77],          twWave: 'sine',     twGap: [2200, 5000], twLevel: 0.040, air: 0.052 },
  'culinary-arts':          { pad: [174.61, 261.63, 349.23, 440.00], wave: 'triangle', cutoff: 800,  level: 0.055, scale: [523.25, 698.46, 783.99, 880.00],          twWave: 'triangle', twGap: [1800, 4200], twLevel: 0.050, air: 0.030 },
  'education':              { pad: [196.00, 293.66, 392.00, 493.88], wave: 'sine',     cutoff: 1000, level: 0.050, scale: [587.33, 783.99, 987.77, 1174.66],         twWave: 'sine',     twGap: [1500, 3600], twLevel: 0.050, air: 0.020 },
  'information-technology': { pad: [110.00, 164.81, 220.00, 261.63], wave: 'sawtooth', cutoff: 600,  level: 0.044, scale: [440.00, 523.25, 659.25, 880.00],          twWave: 'square',   twGap: [900, 2400],  twLevel: 0.034, air: 0.050 },
  'arts-entertainment':     { pad: [164.81, 246.94, 329.63, 415.30], wave: 'triangle', cutoff: 1200, level: 0.050, scale: [659.25, 830.61, 987.77, 1318.51],         twWave: 'sine',     twGap: [1200, 3000], twLevel: 0.055, air: 0.030 },
  'media-communication':    { pad: [220.00, 277.18, 329.63, 440.00], wave: 'sine',     cutoff: 1000, level: 0.050, scale: [554.37, 659.25, 880.00, 1108.73],         twWave: 'sine',     twGap: [1400, 3400], twLevel: 0.050, air: 0.030 },
  'law-government':         { pad: [130.81, 155.56, 196.00, 261.63], wave: 'sine',     cutoff: 700,  level: 0.050, scale: [311.13, 392.00, 466.16, 622.25],          twWave: 'sine',     twGap: [2600, 6000], twLevel: 0.034, air: 0.040 },
  'financial-services':     { pad: [116.54, 174.61, 233.08, 293.66], wave: 'triangle', cutoff: 850,  level: 0.050, scale: [466.16, 587.33, 698.46, 932.33],          twWave: 'sine',     twGap: [1700, 4000], twLevel: 0.050, air: 0.020 },
  'arcade':                 { pad: [261.63, 329.63, 392.00, 523.25], wave: 'triangle', cutoff: 1400, level: 0.050, scale: [523.25, 659.25, 783.99, 1046.50],         twWave: 'square',   twGap: [800, 2000],  twLevel: 0.040, air: 0.020 },
};

interface AudioContextType {
  muted: boolean;
  toggleMute: () => void;
  playSfx: (type: SfxType) => void;
  bgmPlaying: boolean;
  startBgm: (variant?: 'serene' | 'chip') => void;
  stopBgm: () => void;
  ambienceScene: AmbienceScene | null;
  setAmbience: (scene: AmbienceScene | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('audio_muted');
    return saved ? JSON.parse(saved) : false;
  });
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [ambienceScene, setAmbienceScene] = useState<AmbienceScene | null>(null);

  const audioContextRef = useRef<globalThis.AudioContext | null>(null);
  const masterOutRef = useRef<GainNode | null>(null);
  const mutedRef = useRef(muted);
  const bgmNodesRef = useRef<{ gainNode: GainNode; oscillators: OscillatorNode[] } | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const bgmVariantRef = useRef<'serene' | 'chip' | null>(null);
  const ambienceRef = useRef<{ scene: AmbienceScene; master: GainNode; level: number; stop: () => void } | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    localStorage.setItem('audio_muted', JSON.stringify(muted));
    mutedRef.current = muted;
    // Everything routes through one master gain, so muting is a single, instant,
    // bulletproof fade to silence. We then fully SUSPEND the audio hardware so
    // absolutely nothing can leak through — no stray oscillator, ambient bed, or
    // scheduled note keeps whispering. Unmute resumes and fades back up.
    const ctx = audioContextRef.current;
    if (!ctx || !masterOutRef.current) return;
    const t = ctx.currentTime;
    const g = masterOutRef.current.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    if (muted) {
      g.linearRampToValueAtTime(0, t + 0.14);
      window.setTimeout(() => {
        if (mutedRef.current && ctx.state === 'running') ctx.suspend().catch(() => { /* ignore */ });
      }, 180);
    } else {
      if (ctx.state === 'suspended') ctx.resume().catch(() => { /* ignore */ });
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(1, t + 0.14);
    }
  }, [muted]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    // One shared output bus that everything connects to; its gain is the master
    // mute control.
    if (!masterOutRef.current) {
      const out = ctx.createGain();
      out.gain.value = mutedRef.current ? 0 : 1;
      out.connect(ctx.destination);
      masterOutRef.current = out;
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
    if (mutedRef.current || !audioContextRef.current || !masterOutRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(masterOutRef.current);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }, []);

  const playSfx = useCallback((type: SfxType) => {
    initAudio();
    if (mutedRef.current) return;

    switch (type) {
      case 'click':
        playTone(400, 'sine', 0.1);
        break;
      case 'hover':
        playTone(200, 'sine', 0.05);
        break;
      case 'success':
        playTone(523, 'sine', 0.12, 0, 0.12);
        playTone(659, 'sine', 0.12, 0.1, 0.12);
        playTone(784, 'sine', 0.2, 0.2, 0.12);
        break;
      case 'error':
        playTone(300, 'sawtooth', 0.2, 0, 0.08);
        playTone(200, 'sawtooth', 0.3, 0.15, 0.08);
        break;
      case 'complete':
        playTone(523, 'sine', 0.12, 0, 0.12);
        playTone(659, 'sine', 0.12, 0.1, 0.12);
        playTone(784, 'sine', 0.12, 0.2, 0.12);
        playTone(1047, 'sine', 0.4, 0.3, 0.15);
        break;
      case 'notification':
        playTone(880, 'sine', 0.08, 0, 0.08);
        playTone(1100, 'sine', 0.12, 0.08, 0.08);
        break;
      case 'tick':
        playTone(1000, 'sine', 0.03, 0, 0.05);
        break;
      case 'warning':
        playTone(440, 'square', 0.15, 0, 0.06);
        playTone(440, 'square', 0.15, 0.25, 0.06);
        playTone(440, 'square', 0.15, 0.5, 0.06);
        break;
      case 'enter':
        // warm doorway chime — a soft thud and a bell that rings open
        playTone(110, 'sine', 0.18, 0, 0.07);
        playTone(659.25, 'sine', 0.28, 0.02, 0.11);
        playTone(987.77, 'sine', 0.7, 0.10, 0.09);
        break;
      case 'score':
        // crisp points "ding"
        playTone(1318.51, 'sine', 0.18, 0, 0.12);
        playTone(1975.53, 'sine', 0.14, 0, 0.045);
        break;
      case 'star':
        // shimmering sparkle as a star is earned
        [1567.98, 2093.00, 2637.02, 3135.96].forEach((f, i) => playTone(f, 'sine', 0.22, i * 0.05, 0.07));
        break;
      case 'levelup':
        // triumphant ascending fanfare with a sparkle tail
        playTone(523.25, 'triangle', 0.16, 0, 0.12);
        playTone(659.25, 'triangle', 0.16, 0.12, 0.12);
        playTone(783.99, 'triangle', 0.16, 0.24, 0.12);
        playTone(1046.50, 'triangle', 0.55, 0.36, 0.16);
        [1318.51, 1567.98, 2093.00].forEach((f, i) => playTone(f, 'sine', 0.45, 0.52 + i * 0.06, 0.055));
        break;
      case 'coin':
        // classic two-step coin pickup
        playTone(987.77, 'square', 0.06, 0, 0.08);
        playTone(1318.51, 'square', 0.14, 0.06, 0.08);
        break;
      case 'chime':
        // light, friendly doormat "ting" — a soft bell that rings as you arrive
        playTone(1046.50, 'sine', 0.16, 0, 0.06);
        playTone(1567.98, 'sine', 0.5, 0.06, 0.045);
        break;
      case 'footstep': {
        // soft muffled step — a low cushioned thud with a faint tap on top, with
        // a touch of random pitch so a walking run never sounds mechanical.
        const base = 150 + Math.random() * 26;
        playTone(base, 'sine', 0.04, 0, 0.010);
        playTone(base * 3.1, 'triangle', 0.018, 0, 0.002);
        break;
      }
    }
  }, [initAudio, playTone]);

  const startBgm = useCallback((variant: 'serene' | 'chip' = 'serene') => {
    initAudio();
    if (!audioContextRef.current || !masterOutRef.current) return;
    // Already playing this exact theme? Let it keep rolling.
    if (bgmNodesRef.current && bgmVariantRef.current === variant) return;
    // Switching themes (city ⇄ career) — tear the old loop down first.
    if (bgmIntervalRef.current) { clearTimeout(bgmIntervalRef.current); bgmIntervalRef.current = null; }
    if (bgmNodesRef.current) { try { bgmNodesRef.current.gainNode.disconnect(); } catch { /* ignore */ } bgmNodesRef.current = null; }

    const ctx = audioContextRef.current;
    const masterGain = ctx.createGain();
    masterGain.connect(masterOutRef.current);
    const oscillators: OscillatorNode[] = [];

    // Two moods share one tiny sequencer:
    //  • 'serene' — the warm "Questford Stroll" that floats over the city + menus.
    //  • 'chip'   — the bouncy 8-bit "Adventure Theme" that plays inside a career.
    type Track = {
      level: number; tempo: number;
      melodyWave: OscillatorType; bassWave: OscillatorType;
      melodyPeak: number; bassPeak: number;
      melodyAttack: number; bassAttack: number;
      melodyDecay: number; bassDecay: number;
      melody: number[]; bass: number[];
    };

    // Questford Stroll — gentle I–vi–IV–V (C–Am–F–G), soft sine lead + bass.
    const serene: Track = {
      level: 0.026, tempo: 175,
      melodyWave: 'sine', bassWave: 'sine',
      melodyPeak: 0.12, bassPeak: 0.34,
      melodyAttack: 0.05, bassAttack: 0.05,
      melodyDecay: 0.5, bassDecay: 0.6,
      melody: [
        523.25, 0, 587.33, 659.25, 0, 587.33, 523.25, 0,       // C
        440.00, 0, 523.25, 587.33, 0, 523.25, 440.00, 0,       // Am
        349.23, 0, 440.00, 523.25, 0, 440.00, 349.23, 0,       // F
        392.00, 0, 493.88, 587.33, 0, 493.88, 392.00, 0,       // G
        659.25, 0, 587.33, 523.25, 0, 587.33, 659.25, 783.99,  // C (lifts)
        880.00, 0, 783.99, 659.25, 0, 587.33, 523.25, 0,       // Am
        698.46, 0, 659.25, 587.33, 0, 523.25, 440.00, 0,       // F
        587.33, 493.88, 392.00, 0, 392.00, 493.88, 587.33, 0,  // G (turnaround)
      ],
      bass: [
        130.81, 0, 0, 0, 130.81, 0, 0, 0,   // C
        110.00, 0, 0, 0, 110.00, 0, 0, 0,   // Am
        87.31,  0, 0, 0, 87.31,  0, 0, 0,   // F
        98.00,  0, 0, 0, 98.00,  0, 0, 0,   // G
        130.81, 0, 0, 0, 130.81, 0, 0, 0,   // C
        110.00, 0, 0, 0, 110.00, 0, 0, 0,   // Am
        87.31,  0, 0, 0, 87.31,  0, 0, 0,   // F
        98.00,  0, 0, 0, 98.00,  0, 0, 0,   // G
      ],
    };

    // 8-bit Adventure Theme — upbeat retro romp with a funky triangle lead.
    const chip: Track = {
      level: 0.030, tempo: 144,
      melodyWave: 'triangle', bassWave: 'sine',
      melodyPeak: 0.2, bassPeak: 0.5,
      melodyAttack: 0.03, bassAttack: 0.05,
      melodyDecay: 0.25, bassDecay: 0.3,
      melody: [
        523.25, 392.00, 466.16, 523.25, 0, 392.00, 466.16, 523.25,
        622.25, 523.25, 466.16, 392.00, 349.23, 392.00, 0, 0,
        523.25, 392.00, 466.16, 523.25, 0, 392.00, 466.16, 523.25,
        698.46, 622.25, 523.25, 466.16, 523.25, 0, 0, 0,
      ],
      bass: [
        130.81, 0, 130.81, 130.81, 0, 196.00, 0, 130.81,
        116.54, 0, 116.54, 116.54, 0, 174.61, 0, 116.54,
        98.00,  0, 98.00,  98.00,  0, 146.83, 0, 98.00,
        130.81, 0, 130.81, 130.81, 0, 196.00, 0, 130.81,
      ],
    };

    const s = variant === 'chip' ? chip : serene;
    masterGain.gain.setValueAtTime(s.level, ctx.currentTime);

    let step = 0;
    const playNextStep = () => {
      if (!audioContextRef.current) return;
      const c = audioContextRef.current;
      // While muted the context is suspended; keep the clock ticking but emit
      // nothing, so notes never pile up and burst out the moment we unmute.
      if (mutedRef.current) { step++; bgmIntervalRef.current = window.setTimeout(playNextStep, s.tempo); return; }
      const t = c.currentTime;

      // Play bass
      const bFreq = s.bass[step % s.bass.length];
      if (bFreq > 0) {
        const bOsc = c.createOscillator();
        const bGain = c.createGain();
        bOsc.type = s.bassWave;
        bOsc.frequency.setValueAtTime(bFreq, t);

        bGain.gain.setValueAtTime(0, t);
        bGain.gain.linearRampToValueAtTime(s.bassPeak, t + s.bassAttack);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + s.bassDecay);

        bOsc.connect(bGain);
        bGain.connect(masterGain);
        bOsc.start(t);
        bOsc.stop(t + s.bassDecay + 0.02);
      }

      // Play melody
      const mFreq = s.melody[step % s.melody.length];
      if (mFreq > 0) {
        const mOsc = c.createOscillator();
        const mGain = c.createGain();
        mOsc.type = s.melodyWave;
        mOsc.frequency.setValueAtTime(mFreq, t);

        mGain.gain.setValueAtTime(0, t);
        mGain.gain.linearRampToValueAtTime(s.melodyPeak, t + s.melodyAttack);
        mGain.gain.exponentialRampToValueAtTime(0.001, t + s.melodyDecay);

        mOsc.connect(mGain);
        mGain.connect(masterGain);
        mOsc.start(t);
        mOsc.stop(t + s.melodyDecay + 0.02);
      }

      step++;
      bgmIntervalRef.current = window.setTimeout(playNextStep, s.tempo);
    };

    playNextStep();

    bgmVariantRef.current = variant;
    bgmNodesRef.current = { gainNode: masterGain, oscillators };
    setBgmPlaying(true);
  }, [initAudio]);

  const stopBgm = useCallback(() => {
    if (bgmIntervalRef.current) {
      clearTimeout(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
    if (bgmNodesRef.current) {
      bgmNodesRef.current.oscillators.forEach(osc => {
        try { osc.stop(); } catch (_) { }
      });
      bgmNodesRef.current.gainNode.disconnect();
      bgmNodesRef.current = null;
    }
    bgmVariantRef.current = null;
    setBgmPlaying(false);
  }, []);

  // A reusable brown-noise buffer for soft "room air" / room-tone beds.
  const getNoise = useCallback((c: globalThis.AudioContext) => {
    if (!noiseBufferRef.current) {
      const len = Math.floor(c.sampleRate * 2);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
      noiseBufferRef.current = buf;
    }
    return noiseBufferRef.current;
  }, []);

  // Build one self-contained ambient bed (pad voices + air + twinkle scheduler).
  const buildAmbience = useCallback((preset: ScenePreset) => {
    const c = audioContextRef.current!;
    const master = c.createGain();
    master.gain.value = 0;
    master.connect(masterOutRef.current || c.destination);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = preset.cutoff;
    filter.Q.value = 0.6;
    filter.connect(master);

    const stops: Array<() => void> = [];

    // Sustained chord — each voice is a gently detuned pair that "breathes" via a slow LFO.
    preset.pad.forEach((freq, i) => {
      const voice = c.createGain();
      voice.gain.value = 0.16;
      voice.connect(filter);
      [-6, 6].forEach((detune) => {
        const o = c.createOscillator();
        o.type = preset.wave;
        o.frequency.value = freq;
        o.detune.value = detune;
        o.connect(voice);
        o.start();
        stops.push(() => { try { o.stop(); } catch { /* ignore */ } });
      });
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.05 + i * 0.017;
      lfoGain.gain.value = 0.07;
      lfo.connect(lfoGain);
      lfoGain.connect(voice.gain);
      lfo.start();
      stops.push(() => { try { lfo.stop(); } catch { /* ignore */ } });
    });

    // Soft filtered "air" bed.
    if (preset.air > 0) {
      const src = c.createBufferSource();
      src.buffer = getNoise(c);
      src.loop = true;
      const nf = c.createBiquadFilter();
      nf.type = 'lowpass';
      nf.frequency.value = 500;
      const ng = c.createGain();
      ng.gain.value = preset.air;
      src.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      src.start();
      stops.push(() => { try { src.stop(); } catch { /* ignore */ } });
    }

    // Random gentle twinkles drawn from the scene's consonant scale.
    let twTimer = 0;
    const scheduleTwinkle = () => {
      const [lo, hi] = preset.twGap;
      twTimer = window.setTimeout(() => {
        // Skip emitting while muted (context suspended) so twinkles never queue up.
        if (mutedRef.current) { scheduleTwinkle(); return; }
        const f = preset.scale[Math.floor(Math.random() * preset.scale.length)];
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = preset.twWave;
        o.frequency.value = f;
        const t = c.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(preset.twLevel, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 1.7);
        scheduleTwinkle();
      }, lo + Math.random() * (hi - lo));
    };
    scheduleTwinkle();
    stops.push(() => clearTimeout(twTimer));

    return { master, stop: () => stops.forEach((s) => s()) };
  }, [getNoise]);

  const setAmbience = useCallback((scene: AmbienceScene | null) => {
    initAudio();
    const c = audioContextRef.current;
    if (!c) return;
    if (ambienceRef.current && ambienceRef.current.scene === scene) return;

    // Crossfade: fade & tear down the current bed.
    if (ambienceRef.current) {
      const old = ambienceRef.current;
      const t = c.currentTime;
      try {
        old.master.gain.cancelScheduledValues(t);
        old.master.gain.setValueAtTime(old.master.gain.value, t);
        old.master.gain.linearRampToValueAtTime(0, t + 1.4);
      } catch { /* ignore */ }
      window.setTimeout(() => { try { old.stop(); old.master.disconnect(); } catch { /* ignore */ } }, 1600);
      ambienceRef.current = null;
    }

    if (!scene) { setAmbienceScene(null); return; }

    const preset = SCENES[scene];
    const nodes = buildAmbience(preset);
    const t = c.currentTime;
    nodes.master.gain.setValueAtTime(0, t);
    nodes.master.gain.linearRampToValueAtTime(preset.level, t + 1.8);
    ambienceRef.current = { scene, master: nodes.master, level: preset.level, stop: nodes.stop };
    setAmbienceScene(scene);
  }, [initAudio, buildAmbience]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBgm();
      if (ambienceRef.current) {
        try { ambienceRef.current.stop(); ambienceRef.current.master.disconnect(); } catch { /* ignore */ }
        ambienceRef.current = null;
      }
    };
  }, [stopBgm]);

  return (
    <AudioContext.Provider value={{ muted, toggleMute: () => setMuted((m: boolean) => !m), playSfx, bgmPlaying, startBgm, stopBgm, ambienceScene, setAmbience }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
