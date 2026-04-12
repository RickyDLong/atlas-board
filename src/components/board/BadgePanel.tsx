'use client';

import { useState } from 'react';
import type { UserBadge, UserLevel, UserStreak, BadgeTier } from '@/types/database';
import { BADGE_DEFINITIONS } from '@/types/database';
import { CharacterSprite } from '@/components/board/CharacterSprite';

interface BadgePanelProps {
  badges: UserBadge[];
  level: UserLevel | null;
  streak: UserStreak | null;
  levelProgress: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  levelColor: string;
  onClose: () => void;
}

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#fbbf24',
  legendary: '#a855f7',
};

const TIER_ORDER: BadgeTier[] = ['legendary', 'gold', 'silver', 'bronze'];

export function BadgePanel({ badges, level, streak, levelProgress, xpInCurrentLevel, xpNeededForNext, levelColor, onClose }: BadgePanelProps) {
  const [selectedTier, setSelectedTier] = useState<BadgeTier | 'all'>('all');
  const earnedKeys = new Set(badges.map(b => b.badge_key));

  const filteredDefs = BADGE_DEFINITIONS.filter(d => selectedTier === 'all' || d.tier === selectedTier);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white">Player Stats & Badges</h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>

        {/* Player card */}
        {level && (
          <div className="px-5 pt-4 pb-3">
            <div className="rounded-xl border border-[#2a2a3a] bg-[#1a1a26] overflow-hidden">
              {/* Character banner */}
              <div
                className="relative flex items-end gap-5 px-5 pt-4 pb-3"
                style={{
                  background: `linear-gradient(135deg, #0e0e1a 0%, ${levelColor}0a 100%)`,
                  borderBottom: '1px solid #1e1e2e',
                }}
              >
                {/* Glow base under character */}
                <div
                  className="absolute bottom-0 left-5"
                  style={{
                    width: 80,
                    height: 24,
                    background: `radial-gradient(ellipse, ${levelColor}25 0%, transparent 70%)`,
                    filter: 'blur(4px)',
                  }}
                />

                {/* Character portrait */}
                <div
                  className="relative flex-shrink-0 rounded overflow-hidden"
                  style={{ border: `1px solid ${levelColor}44` }}
                >
                  <CharacterSprite level={level.current_level} size="md" />
                </div>

                {/* Tier + stats column */}
                <div className="flex-1 pb-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold font-mono" style={{ color: levelColor }}>
                      {level.current_level}
                    </span>
                    <span className="font-semibold text-base" style={{ color: levelColor }}>
                      {level.title}
                    </span>
                  </div>
                  {/* XP bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#2a2a3a] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${levelProgress * 100}%`,
                          background: 'linear-gradient(90deg, #4a9eff, #a855f7)',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#555568]">
                      {xpInCurrentLevel}/{xpNeededForNext} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-[#4a9eff]">{level.current_xp.toLocaleString()}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#555568]">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-[#fb923c]">{streak?.current_streak || 0}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#555568]">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-[#fbbf24]">{badges.length}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#555568]">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-[#34d399]">{streak?.longest_streak || 0}</div>
                  <div className="text-[9px] uppercase tracking-wider text-[#555568]">Best Streak</div>
                </div>
              </div>

              {/* Freeze tokens */}
              {streak && streak.freeze_tokens > 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs">❄️</span>
                  <span className="text-[10px] text-[#22d3ee] font-semibold">
                    {streak.freeze_tokens} streak freeze{streak.freeze_tokens > 1 ? 's' : ''} available
                  </span>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Tier filter */}
        <div className="px-5 flex gap-1.5 mb-3">
          <button
            onClick={() => setSelectedTier('all')}
            className="px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer"
            style={{
              background: selectedTier === 'all' ? '#4a9eff20' : 'transparent',
              borderColor: selectedTier === 'all' ? '#4a9eff40' : '#2a2a3a',
              color: selectedTier === 'all' ? '#4a9eff' : '#555568',
            }}
          >
            All ({BADGE_DEFINITIONS.length})
          </button>
          {TIER_ORDER.map(tier => {
            const count = BADGE_DEFINITIONS.filter(b => b.tier === tier).length;
            const earned = badges.filter(b => BADGE_DEFINITIONS.find(d => d.key === b.badge_key)?.tier === tier).length;
            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className="px-3 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer capitalize"
                style={{
                  background: selectedTier === tier ? TIER_COLORS[tier] + '20' : 'transparent',
                  borderColor: selectedTier === tier ? TIER_COLORS[tier] + '40' : '#2a2a3a',
                  color: selectedTier === tier ? TIER_COLORS[tier] : '#555568',
                }}
              >
                {tier} ({earned}/{count})
              </button>
            );
          })}
        </div>

        {/* Badge grid */}
        <div className="px-5 pb-5 space-y-2">
          {filteredDefs.map(def => {
            const earned = earnedKeys.has(def.key);
            const badge = badges.find(b => b.badge_key === def.key);
            return (
              <div
                key={def.key}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-all"
                style={{
                  background: earned ? '#1a1a26' : '#0e0e16',
                  borderColor: earned ? TIER_COLORS[def.tier] + '40' : '#1e1e2e',
                  opacity: earned ? 1 : 0.5,
                }}
              >
                <span className="text-2xl" style={{ filter: earned ? 'none' : 'grayscale(1)' }}>
                  {def.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: earned ? TIER_COLORS[def.tier] : '#555568' }}>
                      {def.name}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: TIER_COLORS[def.tier] + '15',
                        color: TIER_COLORS[def.tier],
                      }}
                    >
                      {def.tier}
                    </span>
                  </div>
                  <div className="text-xs text-[#555568]">{def.description}</div>
                  {badge && (
                    <div className="text-[10px] text-[#8888a0] mt-0.5">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {earned && (
                  <span className="text-[#34d399] text-sm">{'\u2713'}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
