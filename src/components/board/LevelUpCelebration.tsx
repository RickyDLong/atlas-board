'use client';

import { useEffect, useState } from 'react';
import { CharacterSprite } from '@/components/board/CharacterSprite';
import { isNewCharacterTier, getCharacterTierName } from '@/lib/character-sprite';

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
    return Array.from({ length: 36 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 7 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.6,
      speed: 1.2 + Math.random() * 1.2,
    }));
  });

  // Did this level-up unlock a new character appearance?
  const newTier = level > 1 && isNewCharacterTier(level - 1, level);
  const tierName = getCharacterTierName(level);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 350);
    const t2 = setTimeout(() => setPhase('exit'), newTier ? 3400 : 2600);
    const t3 = setTimeout(onComplete, newTier ? 4200 : 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete, newTier]);

  const isVisible = phase !== 'exit';
  const isEntering = phase === 'enter';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
      {/* Dark radial overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
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
            opacity: isVisible ? 0.85 : 0,
            animation: `lvlParticle ${p.speed}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            transition: 'opacity 0.5s',
          }}
        />
      ))}

      {/* Main card */}
      <div
        style={{
          transform: isEntering ? 'scale(0.4) translateY(40px)' : isVisible ? 'scale(1) translateY(0)' : 'scale(1.15) translateY(-20px)',
          opacity: isVisible ? 1 : 0,
          transition: isEntering
            ? 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'all 0.6s ease-in',
        }}
      >
        <div
          className="relative flex items-end gap-6 px-8 py-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #0e0e1a 0%, #12121a 50%, #0a0a14 100%)',
            border: `1px solid ${color}44`,
            boxShadow: `0 0 60px ${color}33, 0 0 120px ${color}18, inset 0 1px 0 ${color}22`,
            minWidth: 320,
          }}
        >
          {/* Glow pulse ring behind character */}
          <div
            className="absolute bottom-0 left-8"
            style={{
              width: 140,
              height: 60,
              background: `radial-gradient(ellipse, ${color}30 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(8px)',
            }}
          />

          {/* Character sprite */}
          <div className="relative z-10 flex-shrink-0">
            <CharacterSprite level={level} size="lg" />
          </div>

          {/* Text column */}
          <div className="relative z-10 flex flex-col gap-1 pb-2">
            {/* "LEVEL UP" eyebrow */}
            <div className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#8888a0]">
              Level Up
            </div>

            {/* Level number */}
            <div
              className="text-5xl font-bold font-mono leading-none"
              style={{ color }}
            >
              {level}
            </div>

            {/* Title */}
            <div
              className="text-lg font-semibold leading-tight"
              style={{ color }}
            >
              {title}
            </div>

            {/* New appearance banner — only on tier unlock */}
            {newTier && (
              <div
                className="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${color}22`,
                  border: `1px solid ${color}55`,
                  color,
                  animation: 'tierPulse 0.8s ease-in-out infinite alternate',
                }}
              >
                ✦ New appearance unlocked — {tierName}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lvlParticle {
          0%   { transform: translateY(0) scale(1);   opacity: 0.85; }
          60%  { opacity: 1; }
          100% { transform: translateY(-70px) scale(0); opacity: 0; }
        }
        @keyframes tierPulse {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
