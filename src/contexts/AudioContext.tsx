import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type SfxType = 'click' | 'success' | 'error' | 'complete' | 'hover' | 'notification' | 'tick' | 'warning';

interface AudioContextType {
  muted: boolean;
  toggleMute: () => void;
  playSfx: (type: SfxType) => void;
  bgmPlaying: boolean;
  startBgm: () => void;
  stopBgm: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(() => {
    const saved = localStorage.getItem('audio_muted');
    return saved ? JSON.parse(saved) : false;
  });
  const [bgmPlaying, setBgmPlaying] = useState(false);

  const audioContextRef = useRef<globalThis.AudioContext | null>(null);
  const bgmNodesRef = useRef<{ gainNode: GainNode; oscillators: OscillatorNode[] } | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('audio_muted', JSON.stringify(muted));
    if (muted && bgmNodesRef.current) {
      bgmNodesRef.current.gainNode.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
    } else if (!muted && bgmNodesRef.current && bgmPlaying) {
      bgmNodesRef.current.gainNode.gain.setValueAtTime(0.04, audioContextRef.current!.currentTime);
    }
  }, [muted, bgmPlaying]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
    if (muted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  }, [muted]);

  const playSfx = useCallback((type: SfxType) => {
    initAudio();
    if (muted) return;

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
    }
  }, [initAudio, muted, playTone]);

  const startBgm = useCallback(() => {
    initAudio();
    if (!audioContextRef.current || bgmNodesRef.current) return;

    const ctx = audioContextRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(muted ? 0 : 0.035, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const oscillators: OscillatorNode[] = [];

    // --- 8-bit Adventure Theme ---
    // Upbeat, retro game style with a funky bassline and square-wave melody

    // C Dorian melody array (0 = rest)
    const melody = [
      523.25, 392.00, 466.16, 523.25, 0, 392.00, 466.16, 523.25,
      622.25, 523.25, 466.16, 392.00, 349.23, 392.00, 0, 0,

      523.25, 392.00, 466.16, 523.25, 0, 392.00, 466.16, 523.25,
      698.46, 622.25, 523.25, 466.16, 523.25, 0, 0, 0
    ];

    // Bouncy triangle bassline
    const bass = [
      130.81, 0, 130.81, 130.81, 0, 196.00, 0, 130.81,
      116.54, 0, 116.54, 116.54, 0, 174.61, 0, 116.54,

      98.00, 0, 98.00, 98.00, 0, 146.83, 0, 98.00,
      130.81, 0, 130.81, 130.81, 0, 196.00, 0, 130.81
    ];

    let step = 0;
    const playNextStep = () => {
      if (!audioContextRef.current) return;
      const c = audioContextRef.current;
      const t = c.currentTime;

      // Play bass
      const bFreq = bass[step % bass.length];
      if (bFreq > 0) {
        const bOsc = c.createOscillator();
        const bGain = c.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(bFreq, t);

        bGain.gain.setValueAtTime(0, t);
        bGain.gain.linearRampToValueAtTime(0.8, t + 0.05);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        bOsc.connect(bGain);
        bGain.connect(masterGain);
        bOsc.start(t);
        bOsc.stop(t + 0.3);
      }

      // Play melody
      const mFreq = melody[step % melody.length];
      if (mFreq > 0) {
        const mOsc = c.createOscillator();
        const mGain = c.createGain();
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(mFreq, t);

        mGain.gain.setValueAtTime(0, t);
        mGain.gain.linearRampToValueAtTime(0.2, t + 0.03);
        mGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        mOsc.connect(mGain);
        mGain.connect(masterGain);
        mOsc.start(t);
        mOsc.stop(t + 0.25);
      }

      step++;
      // 0.87x speed: ~104 BPM (120 * 0.87) = 143.68ms per 16th note step
      bgmIntervalRef.current = window.setTimeout(playNextStep, 144);
    };

    playNextStep();


    bgmNodesRef.current = { gainNode: masterGain, oscillators };
    setBgmPlaying(true);
  }, [initAudio, muted]);

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
    setBgmPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBgm();
    };
  }, [stopBgm]);

  return (
    <AudioContext.Provider value={{ muted, toggleMute: () => setMuted((m: boolean) => !m), playSfx, bgmPlaying, startBgm, stopBgm }}>
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
