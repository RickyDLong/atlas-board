'use client';

import { useState, useCallback } from 'react';

interface WelcomeModalProps {
  onComplete: () => void;
}

type SlideIndex = 0 | 1 | 2 | 3 | 4;

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState<SlideIndex>(0);

  const handleNext = useCallback(() => {
    if (currentSlide === 4) {
      onComplete();
    } else {
      setCurrentSlide((prev) => (prev + 1) as SlideIndex);
    }
  }, [currentSlide, onComplete]);

  const handleBack = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => (prev - 1) as SlideIndex);
    }
  }, [currentSlide]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const slides = [
    {
      title: 'Your Quest Board',
      body: 'Atlas turns your tasks into quests. Drag cards across columns as you make progress — from idea to done. No experience needed.',
      illustration: (
        <svg viewBox="0 0 200 180" className="w-full h-full">
          {/* Shield background */}
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#4a9eff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Outer shield outline */}
          <path
            d="M 100 20 L 160 50 L 160 100 Q 100 160 100 160 Q 100 160 40 100 L 40 50 Z"
            fill="url(#shieldGrad)"
            stroke="#4a9eff"
            strokeWidth="2"
          />

          {/* Inner accent */}
          <path
            d="M 100 35 L 150 60 L 150 95 Q 100 140 100 140 Q 100 140 50 95 L 50 60 Z"
            fill="none"
            stroke="#4a9eff"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Central checkmark */}
          <g transform="translate(100, 85)">
            <circle cx="0" cy="0" r="20" fill="#4a9eff" opacity="0.15" />
            <path
              d="M -8 2 L -2 8 L 10 -4"
              stroke="#4a9eff"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Glow effect */}
          <circle cx="100" cy="80" r="45" fill="none" stroke="#4a9eff" strokeWidth="1" opacity="0.2" />
          <circle cx="100" cy="80" r="55" fill="none" stroke="#4a9eff" strokeWidth="0.5" opacity="0.1" />
        </svg>
      ),
    },
    {
      title: 'Quest Log → Conquered',
      body: 'Every task starts in your Quest Log. Move it right as you work on it. When it hits Conquered, it\'s done. That\'s it.',
      illustration: (
        <svg viewBox="0 0 240 160" className="w-full h-full">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#555568" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#4a9eff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Flow columns */}
          {[0, 45, 90, 135, 180].map((x) => (
            <g key={x}>
              <rect
                x={x + 5}
                y="30"
                width="35"
                height="100"
                fill="url(#flowGrad)"
                stroke={['#555568', '#fbbf24', '#4a9eff', '#a855f7', '#34d399'][
                  Math.floor(x / 45)
                ]}
                strokeWidth="1.5"
                rx="4"
                opacity="0.6"
              />
            </g>
          ))}

          {/* Connecting arrows */}
          {[0, 45, 90, 135].map((x) => (
            <g key={`arrow-${x}`}>
              <path
                d={`M ${x + 42} 80 L ${x + 50} 80`}
                stroke="#8888a0"
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            </g>
          ))}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 6 3, 0 6" fill="#8888a0" />
            </marker>
          </defs>

          {/* Labels */}
          <text x="22" y="155" fontSize="10" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
            Quest
          </text>
          <text x="67" y="155" fontSize="10" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
            Prep
          </text>
          <text x="112" y="155" fontSize="10" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
            Battle
          </text>
          <text x="157" y="155" fontSize="10" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
            Loot
          </text>
          <text x="202" y="155" fontSize="10" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
            Done
          </text>
        </svg>
      ),
    },
    {
      title: 'Everything Earns XP',
      body: 'Complete cards, hit deadlines, keep your streak alive. Watch your rank climb from Recruit to Atlas Prime. Higher priority cards earn more.',
      illustration: (
        <svg viewBox="0 0 200 180" className="w-full h-full">
          <defs>
            <linearGradient id="xpGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4a9eff" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* XP bar background */}
          <rect x="30" y="60" width="140" height="20" rx="10" fill="#1a1a26" stroke="#2a2a3a" strokeWidth="1.5" />

          {/* XP bar fill */}
          <rect x="32" y="62" width="104" height="16" rx="8" fill="url(#xpGrad)" />

          {/* XP percentage text */}
          <text x="100" y="77" fontSize="11" fill="#e8e8f0" textAnchor="middle" fontWeight="600">
            65% → LEVEL 12
          </text>

          {/* Level badge */}
          <g transform="translate(100, 110)">
            <circle cx="0" cy="0" r="24" fill="#a855f7" opacity="0.15" stroke="#a855f7" strokeWidth="2" />
            <text x="0" y="8" fontSize="20" fill="#a855f7" textAnchor="middle" fontWeight="bold">
              12
            </text>
            <text x="0" y="26" fontSize="9" fill="#a855f7" textAnchor="middle" fontFamily="JetBrains Mono">
              Specialist
            </text>
          </g>

          {/* Sparkles */}
          {[
            { cx: 50, cy: 30 },
            { cx: 150, cy: 35 },
            { cx: 45, cy: 145 },
            { cx: 155, cy: 140 },
          ].map((pos, idx) => (
            <g key={idx} transform={`translate(${pos.cx}, ${pos.cy})`}>
              <polygon
                points="0,-6 2,-2 6,0 2,2 0,6 -2,2 -6,0 -2,-2"
                fill="#fbbf24"
                opacity="0.7"
              />
            </g>
          ))}
        </svg>
      ),
    },
    {
      title: 'Stay Sharp',
      body: 'Shields show how long a card\'s been sitting. Green is fresh, red means it\'s been too long. Keep your daily streak going for XP multipliers.',
      illustration: (
        <svg viewBox="0 0 200 180" className="w-full h-full">
          {/* Shields in progression */}
          {[
            { x: 20, label: '0-2d', color: '#34d399' },
            { x: 70, label: '3-4d', color: '#fbbf24' },
            { x: 120, label: '5-7d', color: '#fb923c' },
            { x: 170, label: '8+d', color: '#f87171' },
          ].map((shield) => (
            <g key={shield.x}>
              <path
                d={`M ${shield.x} 25 L ${shield.x + 22} 40 L ${shield.x + 22} 60 Q ${shield.x + 11} 75 ${shield.x + 11} 75 Q ${shield.x + 11} 75 ${shield.x} 60 L ${shield.x} 40 Z`}
                fill={shield.color}
                opacity="0.15"
                stroke={shield.color}
                strokeWidth="1.5"
              />
              <text x={shield.x + 11} y="110" fontSize="9" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
                {shield.label}
              </text>
            </g>
          ))}

          {/* Fire icon for streak */}
          <g transform="translate(100, 145)">
            <text x="0" y="0" fontSize="36" textAnchor="middle">
              🔥
            </text>
            <text x="0" y="26" fontSize="11" fill="#8888a0" textAnchor="middle" fontFamily="JetBrains Mono">
              7-Day Streak
            </text>
          </g>
        </svg>
      ),
    },
    {
      title: 'Forge Your Path',
      body: 'Create your first card and start earning XP. You can revisit this guide anytime from Settings.',
      illustration: (
        <svg viewBox="0 0 200 180" className="w-full h-full">
          <defs>
            <radialGradient id="swordGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4a9eff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sword */}
          <g transform="translate(100, 90)">
            {/* Glow */}
            <circle cx="0" cy="0" r="50" fill="url(#swordGlow)" />

            {/* Blade */}
            <path
              d="M -3 -40 L -5 10 Q -5 15 0 18 Q 5 15 5 10 L 3 -40 Z"
              fill="#4a9eff"
              opacity="0.8"
            />

            {/* Blade shine */}
            <path d="M -1 -30 L -2 5 Q 0 10 0.5 10 L 1 -30" fill="#a9d8ff" opacity="0.6" />

            {/* Cross-guard */}
            <rect x="-15" y="12" width="30" height="6" fill="#a855f7" rx="2" />

            {/* Handle */}
            <rect x="-4" y="18" width="8" height="12" fill="#8b5cf6" rx="2" />

            {/* Pommel */}
            <circle cx="0" cy="32" r="4" fill="#a855f7" />
          </g>

          {/* Radiating lines */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 45;
            const y1 = 90 + Math.sin(rad) * 45;
            const x2 = 100 + Math.cos(rad) * 65;
            const y2 = 90 + Math.sin(rad) * 65;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#4a9eff"
                strokeWidth="1.5"
                opacity="0.4"
              />
            );
          })}
        </svg>
      ),
    },
  ];

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] backdrop-blur-sm">
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[520px] max-w-[95vw] shadow-2xl overflow-hidden">
        {/* Illustration area */}
        <div className="h-48 bg-gradient-to-b from-[#1a1a26] to-[#12121a] flex items-center justify-center px-6 py-8">
          {slide.illustration}
        </div>

        {/* Content area */}
        <div className="px-8 py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight font-[Space Grotesk]">
            {slide.title}
          </h2>
          <p className="text-[#a8a8b8] text-sm leading-relaxed max-w-[90%]">
            {slide.body}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 px-8 py-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx as SlideIndex)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'bg-[#4a9eff] w-6' : 'bg-[#2a2a3a] hover:bg-[#3a3a4a]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Button area */}
        <div className="flex items-center justify-between gap-3 px-8 py-5 border-t border-[#1e1e2e]">
          {currentSlide > 0 ? (
            <button
              onClick={handleBack}
              className="text-[#555568] hover:text-[#8888a0] text-sm font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleSkip}
            className="text-[#555568] hover:text-[#8888a0] text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all cursor-pointer"
          >
            {currentSlide === 4 ? "Let's Go" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
