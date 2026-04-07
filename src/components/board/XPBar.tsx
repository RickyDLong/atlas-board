'use client';

import type { UserLevel, UserStreak } from '@/types/database';

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
      className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-[#2a2a3a] bg-[#1a1a26] hover:bg-[#22222f] transition-all cursor-pointer group"
    >
      {/* Level badge */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-bold font-mono"
          style={{ color: levelColor }}
        >
          Lv.{level.current_level}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: levelColor }}>
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
          <span className="text-xs">{streak.current_streak >= 7 ? '\u{1F525}' : '\u{1F4A5}'}</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: '#fb923c' }}>
            {streak.current_streak}
          </span>
        </div>
      )}

      {/* Badge count */}
      {badgeCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs">{'\u{1F3C6}'}</span>
          <span className="text-[10px] font-bold font-mono text-[#fbbf24]">
            {badgeCount}
          </span>
        </div>
      )}
    </button>
  );
}
