// ─── Character Sprite Utility ────────────────────────────────────────────────
// Sprite sheet: public/characters/progression-x50.png
// Layout: 10 columns × 5 rows, each cell = 120×240px (total 1200×1200)
// No text labels — one unique character per game level (1-50).
//
// Row 4 exceptions (user-specified):
//   col 5  = one-wing helmet character → skipped; levels 45 & 46 both use col 4
//   col 8  = female character          → skipped; levels 48 & 49 both use col 7

export const SPRITE_SHEET = '/characters/progression-x50.png';

export const COLS = 10;
export const ROWS = 5;
export const CELL_W = 120; // 1200 / 10
export const CELL_H = 240; // 1200 / 5

// ─── Level → Cell Mapping ────────────────────────────────────────────────────

export interface CharacterCell {
  col: number;
  row: number;
}

/**
 * Explicit level-to-cell table (index 0 = level 1).
 * Levels 1-40: straight sequential mapping across rows 0-3.
 * Levels 41-50: manual mapping that skips col 5 (one-wing) and col 8 (female).
 */
const LEVEL_CELL_MAP: CharacterCell[] = [
  // Rows 0–3: sequential (levels 1–40)
  ...Array.from({ length: 40 }, (_, i): CharacterCell => ({
    col: i % COLS,
    row: Math.floor(i / COLS),
  })),
  // Row 4: levels 41–50 with skipped cells
  { col: 0, row: 4 }, // level 41
  { col: 1, row: 4 }, // level 42
  { col: 2, row: 4 }, // level 43
  { col: 3, row: 4 }, // level 44
  { col: 4, row: 4 }, // level 45
  { col: 4, row: 4 }, // level 46  ← col 5 (one-wing) skipped; use col 4
  { col: 6, row: 4 }, // level 47
  { col: 7, row: 4 }, // level 48
  { col: 7, row: 4 }, // level 49  ← col 8 (female) skipped; use col 7
  { col: 9, row: 4 }, // level 50
];

/** Returns the sprite cell for a given level (clamped 1-50). */
export function getCharacterForLevel(level: number): CharacterCell {
  const idx = Math.max(0, Math.min(49, level - 1));
  return LEVEL_CELL_MAP[idx];
}

// ─── Tier Names ──────────────────────────────────────────────────────────────
// Aligns with LEVEL_TITLES so the name shown in level-up toasts is consistent.

export function getCharacterTierName(level: number): string {
  if (level >= 50) return 'Mythic Titan';
  if (level >= 40) return 'Dragon Slayer';
  if (level >= 30) return 'Shadow Monarch';
  if (level >= 20) return 'Runecaster';
  if (level >= 10) return 'Blade Adept';
  if (level >= 5)  return 'Squire';
  return 'Wanderer';
}

/**
 * Returns true when levelling from oldLevel to newLevel actually changes the
 * displayed sprite cell (accounts for the two skipped cells in row 4).
 */
export function isNewCharacterTier(oldLevel: number, newLevel: number): boolean {
  const a = getCharacterForLevel(Math.max(1, oldLevel));
  const b = getCharacterForLevel(newLevel);
  return a.col !== b.col || a.row !== b.row;
}

// ─── CSS Sprite Positioning ──────────────────────────────────────────────────

export interface SpriteStyle {
  width: number;
  height: number;
  /** Full visible cell height — equals container height (no label to clip). */
  fullCellH: number;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
}

/**
 * Returns CSS values to window into the correct character cell.
 *
 * displayW  — desired output width in px
 * displayH  — desired output height in px (clipped to this; set ≤ 2×displayW)
 * level     — current player level
 */
export function getSpriteStyle(displayW: number, displayH: number, level: number): SpriteStyle {
  const { col, row } = getCharacterForLevel(level);

  // Scale so each cell fills exactly displayW × scaledCellH.
  // Cell aspect ratio 120:240 = 1:2, so scaledCellH = 2 × displayW.
  const scaledCellH = displayW * (CELL_H / CELL_W); // 2 × displayW

  const bgW = COLS * displayW;        // = 10 × displayW
  const bgH = ROWS * scaledCellH;     // = 10 × displayW (square sheet)

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
