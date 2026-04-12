'use client';

import { getSpriteStyle } from '@/lib/character-sprite';

// ─── Size presets ─────────────────────────────────────────────────────────────
// Cell aspect ratio is 1:2 (120×240px). Heights = 2×width for a full-body view.
// No label text in this sheet, so no clipping tricks needed.
const SIZE_PRESETS = {
  /** Inline portrait — XP bar, streaks */
  xs: { w: 28,  h: 56  },
  /** Small portrait — compact panels */
  sm: { w: 44,  h: 88  },
  /** Badge panel — full body */
  md: { w: 80,  h: 160 },
  /** Level-up celebration — cinematic full body */
  lg: { w: 140, h: 280 },
} as const;

export type CharacterSpriteSize = keyof typeof SIZE_PRESETS;

interface CharacterSpriteProps {
  level: number;
  size: CharacterSpriteSize;
  className?: string;
  style?: React.CSSProperties;
}

export function CharacterSprite({ level, size, className, style }: CharacterSpriteProps) {
  const { w, h } = SIZE_PRESETS[size];
  const sprite = getSpriteStyle(w, h, level);

  return (
    <div
      className={className}
      style={{
        width: sprite.width,
        height: sprite.height,
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: sprite.width,
          height: sprite.fullCellH,
          backgroundImage: sprite.backgroundImage,
          backgroundSize: sprite.backgroundSize,
          backgroundPosition: sprite.backgroundPosition,
          backgroundRepeat: sprite.backgroundRepeat,
        }}
      />
    </div>
  );
}
