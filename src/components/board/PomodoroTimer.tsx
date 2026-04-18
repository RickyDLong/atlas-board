'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type TimerMode = 'work' | 'short_break' | 'long_break';

const MODES: Record<TimerMode, { label: string; minutes: number; color: string }> = {
  work: { label: 'Focus', minutes: 25, color: '#4a9eff' },
  short_break: { label: 'Short Break', minutes: 5, color: '#34d399' },
  long_break: { label: 'Long Break', minutes: 15, color: '#a855f7' },
};

interface PomodoroTimerProps {
  /** Called when a work session completes — passes minutes elapsed */
  onSessionComplete?: (minutes: number) => void;
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.minutes * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = MODES[mode].minutes * 60;
  const { color, label } = MODES[mode];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  // SVG ring math
  const R = 36;
  const circumference = 2 * Math.PI * R;
  const progress = secondsLeft / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  const playBell = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.6);
    } catch {
      // AudioContext not available in some environments — silently ignore
    }
  }, []);

  const handleComplete = useCallback(() => {
    setRunning(false);
    playBell();
    if (mode === 'work') {
      setCompleted(prev => prev + 1);
      onSessionComplete?.(MODES.work.minutes);
    }
  }, [mode, onSessionComplete, playBell]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, handleComplete]);

  const switchMode = (m: TimerMode) => {
    setMode(m);
    setRunning(false);
    setSecondsLeft(MODES[m].minutes * 60);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(MODES[mode].minutes * 60);
  };

  const isAtStart = secondsLeft === totalSeconds;

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      {/* Mode tabs */}
      <div className="flex gap-1">
        {(Object.keys(MODES) as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer"
            style={
              mode === m
                ? { background: MODES[m].color + '1a', border: `1px solid ${MODES[m].color}44`, color: MODES[m].color }
                : { border: '1px solid transparent', color: '#555568' }
            }
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      {/* Circular ring + countdown */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
          {/* Track */}
          <circle cx="48" cy="48" r={R} fill="none" stroke="#1e1e2e" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx="48" cy="48" r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>
        <div className="z-10 flex flex-col items-center select-none">
          <span className="font-mono text-xl font-bold text-white leading-none">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(r => !r)}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{ background: color + '1a', border: `1px solid ${color}44`, color }}
        >
          {running ? 'Pause' : isAtStart ? 'Start' : 'Resume'}
        </button>
        {!isAtStart && (
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#2a2a3a] text-[#555568] hover:text-[#8888a0] hover:border-[#555568] transition-all cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Completed sessions */}
      {completed > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-[#555568]">
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(completed, 8) }).map((_, i) => (
              <span key={i} className="text-[11px]">🍅</span>
            ))}
            {completed > 8 && <span className="text-[#4a9eff] ml-0.5">+{completed - 8}</span>}
          </div>
          <span className="ml-1">
            {completed} session{completed !== 1 ? 's' : ''} · {completed * 25} min logged
          </span>
        </div>
      )}
    </div>
  );
}
