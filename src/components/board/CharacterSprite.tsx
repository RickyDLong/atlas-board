'use client';

import { getSpriteStyle } from '@/lib/character-sprite';

// ─── Size presets ─────────────────────────────────────────────────────────────
// Height is intentionally less than displayW * 2.5 to crop the label text
// at the bottom of each sprite cell.
const SIZE_PRESETS = {
  /** XP bar portrait — head + torso crop */
  sm:  { w: 40,  h: 66  },
  /** Badge panel portrait — full body, no label */
  md:  { w: 80,  h: 172 },
  /** Level-up celebration — full body, cinematic */
  lg:  { w: 140, h: 300 },
  /** Inline tier icon — just the silhouette */
  xs:  { w: 28,  h: 46  },
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
          height: sprite.fullCellH,  // taller than container — label gets clipped
          backgroundImage: sprite.backgroundImage,
          backgroundSize: sprite.backgroundSize,
          backgroundPosition: sprite.backgroundPosition,
          backgroundRepeat: sprite.backgroundRepeat,
        }}
      />
    </div>
  );
}
