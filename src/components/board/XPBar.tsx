'use client';

import type { UserLevel, UserStreak } from '@/types/database';
import { CharacterSprite } from '@/components/board/CharacterSprite';

interface XPBarProps {
  level: UserLevel | null;
  streak: UserStreak | null;
  levelProgress: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  levelColor: string;
  badgeCount: number;
  onClickStats?: () => void;
}

export function XPBar({
  level,
  streak,
  levelProgress,
  xpInCurrentLevel,
  xpNeededForNext,
  levelColor,
  badgeCount,
  onClickStats,
}: XPBarProps) {
  if (!level) return null;

  return (
    <button
      onClick={onClickStats}
      className="flex items-center gap-2.5 px-2 py-1 rounded-lg border border-[#2a2a3a] bg-[#1a1a26] hover:bg-[#22222f] transition-all cursor-pointer group overflow-hidden"
      style={{ height: 40 }}
    >
      {/* Character portrait — crops to head + torso */}
      <div
        className="rounded overflow-hidden flex-shrink-0"
        style={{
          width: 28,
          height: 36,
          border: `1px solid ${levelColor}44`,
          background: '#0a0a0f',
        }}
      >
        <CharacterSprite level={level.current_level} size="xs" />
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-bold font-mono"
          style={{ color: levelColor }}
        >
          Lv.{level.current_level}
        </span>
        <span className="text-[10px] font-semibold hidden sm:inline" style={{ color: levelColor }}>
          {level.title}
        </span>
      </div>

      {/* XP progress bar */}
      <div className="flex items-center gap-1.5">
        <div className="w-20 h-1.5 rounded-full bg-[#2a2a3a] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${levelProgress * 100}%`,
              background: `linear-gradient(90deg, #4a9eff, #a855f7)`,
            }}
          />
        </div>
        <span className="text-[9px] font-mono text-[#555568] group-hover:text-[#8888a0] transition-colors">
          {xpInCurrentLevel}/{xpNeededForNext}
        </span>
      </div>

      {/* Streak */}
      {streak && streak.current_streak > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs">{streak.current_streak >= 7 ? '🔥' : '💥'}</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: '#fb923c' }}>
            {streak.current_streak}
          </span>
          {streak.freeze_tokens > 0 && (
            <span
              className="text-[10px] font-mono text-[#22d3ee]"
              title={`${streak.freeze_tokens} streak freeze${streak.freeze_tokens > 1 ? 's' : ''} available`}
            >
              {'\u2744\uFE0F'}{streak.freeze_tokens > 1 ? `\u00D7${streak.freeze_tokens}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Badge count */}
      {badgeCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs">🏆</span>
          <span className="text-[10px] font-bold font-mono text-[#fbbf24]">
            {badgeCount}
          </span>
        </div>
      )}
    </button>
  );
}
