import { describe, it, expect } from 'vitest';
import {
  getCharacterForLevel,
  getCharacterTierName,
  isNewCharacterTier,
  getSpriteStyle,
  COLS,
  ROWS,
  CELL_W,
  CELL_H,
  SPRITE_SHEET,
} from './character-sprite';

describe('character-sprite', () => {
  describe('getCharacterForLevel', () => {
    it('maps early levels sequentially across the rows', () => {
      expect(getCharacterForLevel(1)).toEqual({ col: 0, row: 0 });
      expect(getCharacterForLevel(10)).toEqual({ col: 9, row: 0 });
      expect(getCharacterForLevel(11)).toEqual({ col: 0, row: 1 });
      expect(getCharacterForLevel(40)).toEqual({ col: 9, row: 3 });
    });

    it('skips the one-wing cell: levels 45 and 46 share col 4 of row 4', () => {
      expect(getCharacterForLevel(45)).toEqual({ col: 4, row: 4 });
      expect(getCharacterForLevel(46)).toEqual({ col: 4, row: 4 });
    });

    it('skips the female cell: levels 48 and 49 share col 7 of row 4', () => {
      expect(getCharacterForLevel(48)).toEqual({ col: 7, row: 4 });
      expect(getCharacterForLevel(49)).toEqual({ col: 7, row: 4 });
      expect(getCharacterForLevel(50)).toEqual({ col: 9, row: 4 });
    });

    it('clamps out-of-range levels into 1..50', () => {
      expect(getCharacterForLevel(0)).toEqual(getCharacterForLevel(1));
      expect(getCharacterForLevel(-5)).toEqual(getCharacterForLevel(1));
      expect(getCharacterForLevel(999)).toEqual(getCharacterForLevel(50));
    });
  });

  describe('getCharacterTierName', () => {
    it('returns the tier name at each threshold', () => {
      expect(getCharacterTierName(1)).toBe('Wanderer');
      expect(getCharacterTierName(4)).toBe('Wanderer');
      expect(getCharacterTierName(5)).toBe('Squire');
      expect(getCharacterTierName(10)).toBe('Blade Adept');
      expect(getCharacterTierName(20)).toBe('Runecaster');
      expect(getCharacterTierName(30)).toBe('Shadow Monarch');
      expect(getCharacterTierName(40)).toBe('Dragon Slayer');
      expect(getCharacterTierName(50)).toBe('Mythic Titan');
      expect(getCharacterTierName(75)).toBe('Mythic Titan');
    });
  });

  describe('isNewCharacterTier', () => {
    it('is false across the skipped cells (45->46, 48->49)', () => {
      expect(isNewCharacterTier(45, 46)).toBe(false);
      expect(isNewCharacterTier(48, 49)).toBe(false);
    });

    it('is true when the sprite cell actually changes', () => {
      expect(isNewCharacterTier(1, 2)).toBe(true);
      expect(isNewCharacterTier(46, 47)).toBe(true);
      expect(isNewCharacterTier(49, 50)).toBe(true);
    });

    it('is false when the level does not change', () => {
      expect(isNewCharacterTier(12, 12)).toBe(false);
    });
  });

  describe('getSpriteStyle', () => {
    it('windows into the first cell with square-sheet scaling', () => {
      const s = getSpriteStyle(100, 100, 1); // level 1 -> col 0, row 0
      expect(s.width).toBe(100);
      expect(s.height).toBe(100);
      expect(s.fullCellH).toBe(200); // 2 x displayW (cell aspect 1:2)
      expect(s.backgroundSize).toBe('1000px 1000px'); // 10 x 100 square sheet
      expect(s.backgroundPosition).toBe('0px 0px');
      expect(s.backgroundImage).toBe(`url('${SPRITE_SHEET}')`);
      expect(s.backgroundRepeat).toBe('no-repeat');
    });

    it('offsets by column and row for later levels', () => {
      const s = getSpriteStyle(100, 100, 12); // level 12 -> col 1, row 1
      expect(s.backgroundPosition).toBe('-100px -200px');
    });

    it('exposes the sheet geometry constants', () => {
      expect(COLS).toBe(10);
      expect(ROWS).toBe(5);
      expect(CELL_W).toBe(120);
      expect(CELL_H).toBe(240);
    });
  });
});
