// ─── Character Sprite Utility ────────────────────────────────────────────────
// Sprite sheet: public/characters/progression.png
// Layout: 5 columns × 2 rows, each cell = 240×600px (total 1200×1200)
// Source: "Character progression 2" — dark stone background, max-level blue sword

export const SPRITE_SHEET = '/characters/progression.png';

// Each cell in the 1200×1200 sheet
export const CELL_W = 240;  // 1200 / 5
export const CELL_H = 600;  // 1200 / 2

// 9 character tiers mapped across 50 game levels
// Row 2 has 4 chars (levels 7–10 MAX) — the 5th slot is empty and never referenced
export const CHARACTER_TIERS = [
  { minLevel: 1,  col: 0, row: 0, tierName: 'Wanderer'  },
  { minLevel: 6,  col: 1, row: 0, tierName: 'Squire'    },
  { minLevel: 12, col: 2, row: 0, tierName: 'Soldier'   },
  { minLevel: 18, col: 3, row: 0, tierName: 'Knight'    },
  { minLevel: 24, col: 4, row: 0, tierName: 'Paladin'   },
  { minLevel: 30, col: 0, row: 1, tierName: 'Champion'  },
  { minLevel: 36, col: 1, row: 1, tierName: 'Crusader'  },
  { minLevel: 41, col: 2, row: 1, tierName: 'Warlord'   },
  { minLevel: 46, col: 3, row: 1, tierName: 'Legend'    },
] as const;

export interface CharacterTier {
  minLevel: number;
  col: number;
  row: number;
  tierName: string;
}

export function getCharacterTier(level: number): CharacterTier {
  // Walk backwards to find the highest tier the player has unlocked
  for (let i = CHARACTER_TIERS.length - 1; i >= 0; i--) {
    if (level >= CHARACTER_TIERS[i].minLevel) {
      return CHARACTER_TIERS[i];
    }
  }
  return CHARACTER_TIERS[0];
}

/** Returns true when crossing from oldLevel to newLevel unlocks a new character appearance */
export function isNewCharacterTier(oldLevel: number, newLevel: number): boolean {
  const a = getCharacterTier(oldLevel);
  const b = getCharacterTier(newLevel);
  return a.col !== b.col || a.row !== b.row;
}

// ─── CSS Sprite Positioning ──────────────────────────────────────────────────

export interface SpriteStyle {
  width: number;
  height: number;
  /** Full height including label — container uses overflow:hidden to crop */
  fullCellH: number;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
}

/**
 * Returns the CSS values needed to window into the correct character cell.
 *
 * displayW    — desired output width in px
 * displayH    — desired output height in px (controls how much of the cell is visible;
 *               set < (displayW * 2.5) to crop out the text label at the bottom)
 * level       — current player level
 */
export function getSpriteStyle(displayW: number, displayH: number, level: number): SpriteStyle {
  const { col, row } = getCharacterTier(level);

  // Scale the sheet so each cell exactly fills displayW × (displayW * 2.5)
  // Cell aspect ratio: CELL_W:CELL_H = 240:600 = 1:2.5
  const scaledCellH = displayW * (CELL_H / CELL_W); // displayW * 2.5

  const bgW = displayW * 5;           // full sheet scaled width  (5 cols)
  const bgH = scaledCellH * 2;        // full sheet scaled height (2 rows)

  return {
    width: displayW,
    height: displayH,
    fullCellH: scaledCellH,
    backgroundImage: `url('${SPRITE_SHEET}')`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${-(col * displayW)}px ${-(row * scaledCellH)}px`,
    backgroundRepeat: 'no-repeat',
  };
}
