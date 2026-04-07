'use client';

import { useEffect, useState } from 'react';

interface LevelUpCelebrationProps {
  level: number;
  title: string;
  color: string;
  onComplete: () => void;
}

export function LevelUpCelebration({ level, title, color, onComplete }: LevelUpCelebrationProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [particles] = useState(() => {
    const colors = ['#4a9eff', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#fb923c'];
    return Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
  });

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 2500);
    const t3 = setTimeout(onComplete, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, transparent 70%)',
          opacity: phase === 'exit' ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: phase === 'exit' ? 0 : 0.8,
            animation: `particle ${1.5 + p.delay}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            transition: 'opacity 0.5s',
          }}
        />
      ))}

      {/* Level badge */}
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: phase === 'enter' ? 'scale(0.5)' : phase === 'exit' ? 'scale(1.2)' : 'scale(1)',
          opacity: phase === 'exit' ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Glow ring */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
          style={{
            background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
            boxShadow: `0 0 60px ${color}44, 0 0 120px ${color}22`,
          }}
        >
          <div
            className="w-24 h-24 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: color, background: '#0a0a0f' }}
          >
            <span className="text-3xl font-bold font-mono" style={{ color }}>
              {level}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] font-semibold text-[#8888a0] mb-1">
            Level Up
          </div>
          <div className="text-xl font-bold" style={{ color }}>
            {title}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateY(-60px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
