import { describe, it, expect } from 'vitest';
import {
  xpForLevel,
  totalXPForLevel,
  levelFromXP,
  titleForLevel,
  colorForLevel,
  getStreakMultiplier,
} from './gamification-actions';

describe('gamification-actions', () => {
  describe('xpForLevel', () => {
    it('returns XP for level 1', () => {
      const xp = xpForLevel(1);
      // 80 * 1^1.5 + 20 * 1 = 80 + 20 = 100
      expect(xp).toBe(100);
    });

    it('returns XP for level 5', () => {
      const xp = xpForLevel(5);
      // 80 * 5^1.5 + 20 * 5 = 80 * 11.18 + 100 ≈ 994 + 100 ≈ 994
      expect(xp).toBe(Math.floor(80 * Math.pow(5, 1.5) + 20 * 5));
    });

    it('returns XP for level 10', () => {
      const xp = xpForLevel(10);
      expect(xp).toBe(Math.floor(80 * Math.pow(10, 1.5) + 20 * 10));
    });

    it('increases monotonically', () => {
      for (let i = 1; i < 50; i++) {
        expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i));
      }
    });
  });

  describe('totalXPForLevel', () => {
    it('returns 0 for level 1 (no XP needed to be level 1)', () => {
      expect(totalXPForLevel(1)).toBe(0);
    });

    it('returns XP for level 2 equals xpForLevel(1)', () => {
      expect(totalXPForLevel(2)).toBe(xpForLevel(1));
    });

    it('accumulates correctly for level 3', () => {
      expect(totalXPForLevel(3)).toBe(xpForLevel(1) + xpForLevel(2));
    });

    it('increases monotonically', () => {
      for (let i = 1; i < 50; i++) {
        expect(totalXPForLevel(i + 1)).toBeGreaterThan(totalXPForLevel(i));
      }
    });
  });

  describe('levelFromXP', () => {
    it('returns level 1 for 0 XP', () => {
      expect(levelFromXP(0)).toBe(1);
    });

    it('returns level 1 for XP just under level 2', () => {
      expect(levelFromXP(xpForLevel(1) - 1)).toBe(1);
    });

    it('returns level 2 at exact threshold', () => {
      expect(levelFromXP(xpForLevel(1))).toBe(2);
    });

    it('returns level 3 at cumulative threshold', () => {
      const needed = xpForLevel(1) + xpForLevel(2);
      expect(levelFromXP(needed)).toBe(3);
    });

    it('caps at level 50', () => {
      expect(levelFromXP(999999999)).toBe(50);
    });

    it('is consistent with totalXPForLevel', () => {
      for (let lvl = 1; lvl <= 50; lvl++) {
        const xp = totalXPForLevel(lvl);
        expect(levelFromXP(xp)).toBe(lvl);
      }
    });
  });

  describe('titleForLevel', () => {
    it('returns Wanderer for level 1', () => {
      expect(titleForLevel(1)).toBe('Wanderer');
    });

    it('returns Squire for level 5', () => {
      expect(titleForLevel(5)).toBe('Squire');
    });

    it('returns Blade Adept for level 10', () => {
      expect(titleForLevel(10)).toBe('Blade Adept');
    });

    it('returns Runecaster for level 20', () => {
      expect(titleForLevel(20)).toBe('Runecaster');
    });

    it('returns Shadow Monarch for level 30', () => {
      expect(titleForLevel(30)).toBe('Shadow Monarch');
    });

    it('returns Dragon Slayer for level 40', () => {
      expect(titleForLevel(40)).toBe('Dragon Slayer');
    });

    it('returns Mythic Titan for level 50', () => {
      expect(titleForLevel(50)).toBe('Mythic Titan');
    });

    it('returns correct title for mid-range levels', () => {
      expect(titleForLevel(15)).toBe('Blade Adept');
      expect(titleForLevel(25)).toBe('Runecaster');
    });
  });

  describe('colorForLevel', () => {
    it('returns muted color for level 1', () => {
      expect(colorForLevel(1)).toBe('#8888a0');
    });

    it('returns blue for level 10+', () => {
      expect(colorForLevel(10)).toBe('#4a9eff');
    });

    it('returns yellow for level 50', () => {
      expect(colorForLevel(50)).toBe('#fbbf24');
    });
  });

  describe('getStreakMultiplier', () => {
    it('returns 1.0 for 0 streak', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
    });

    it('returns 1.0 for 2 day streak', () => {
      expect(getStreakMultiplier(2)).toBe(1.0);
    });

    it('returns 1.1 for 3 day streak', () => {
      expect(getStreakMultiplier(3)).toBe(1.1);
    });

    it('returns 1.25 for 7 day streak', () => {
      expect(getStreakMultiplier(7)).toBe(1.25);
    });

    it('returns 1.5 for 14 day streak', () => {
      expect(getStreakMultiplier(14)).toBe(1.5);
    });

    it('returns 1.75 for 30 day streak', () => {
      expect(getStreakMultiplier(30)).toBe(1.75);
    });

    it('returns 1.75 for 100 day streak (maxes at 30)', () => {
      expect(getStreakMultiplier(100)).toBe(1.75);
    });
  });
});
