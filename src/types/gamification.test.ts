import { describe, it, expect } from 'vitest';
import {
  XP_VALUES,
  PRIORITY_XP_MULTIPLIER,
  STREAK_XP_MULTIPLIER,
  LEVEL_TITLES,
  BADGE_DEFINITIONS,
} from './database';

describe('Gamification Constants', () => {
  describe('XP_VALUES', () => {
    it('has all expected actions', () => {
      const actions = [
        'card_create', 'card_complete', 'card_complete_high', 'card_complete_critical',
        'card_on_time', 'card_early', 'column_clear', 'streak_daily',
        'streak_7day', 'streak_30day', 'epic_complete', 'archive_batch',
      ];
      actions.forEach(action => {
        expect(XP_VALUES).toHaveProperty(action);
        expect(typeof XP_VALUES[action as keyof typeof XP_VALUES]).toBe('number');
      });
    });

    it('has positive XP for all actions', () => {
      Object.values(XP_VALUES).forEach(val => {
        expect(val).toBeGreaterThan(0);
      });
    });

    it('card_complete_critical > card_complete_high > card_complete', () => {
      expect(XP_VALUES.card_complete_critical).toBeGreaterThan(XP_VALUES.card_complete_high);
      expect(XP_VALUES.card_complete_high).toBeGreaterThan(XP_VALUES.card_complete);
    });

    it('streak_30day > streak_7day > streak_daily', () => {
      expect(XP_VALUES.streak_30day).toBeGreaterThan(XP_VALUES.streak_7day);
      expect(XP_VALUES.streak_7day).toBeGreaterThan(XP_VALUES.streak_daily);
    });
  });

  describe('PRIORITY_XP_MULTIPLIER', () => {
    it('has all priority levels', () => {
      expect(PRIORITY_XP_MULTIPLIER).toHaveProperty('low');
      expect(PRIORITY_XP_MULTIPLIER).toHaveProperty('medium');
      expect(PRIORITY_XP_MULTIPLIER).toHaveProperty('high');
      expect(PRIORITY_XP_MULTIPLIER).toHaveProperty('critical');
    });

    it('critical > high > medium > low', () => {
      expect(PRIORITY_XP_MULTIPLIER.critical).toBeGreaterThan(PRIORITY_XP_MULTIPLIER.high);
      expect(PRIORITY_XP_MULTIPLIER.high).toBeGreaterThan(PRIORITY_XP_MULTIPLIER.medium);
      expect(PRIORITY_XP_MULTIPLIER.medium).toBeGreaterThan(PRIORITY_XP_MULTIPLIER.low);
    });

    it('low multiplier is 1.0 (no bonus)', () => {
      expect(PRIORITY_XP_MULTIPLIER.low).toBe(1.0);
    });
  });

  describe('STREAK_XP_MULTIPLIER', () => {
    it('is sorted by minDays descending', () => {
      for (let i = 0; i < STREAK_XP_MULTIPLIER.length - 1; i++) {
        expect(STREAK_XP_MULTIPLIER[i].minDays).toBeGreaterThan(STREAK_XP_MULTIPLIER[i + 1].minDays);
      }
    });

    it('multipliers decrease with lower streak requirements', () => {
      for (let i = 0; i < STREAK_XP_MULTIPLIER.length - 1; i++) {
        expect(STREAK_XP_MULTIPLIER[i].multiplier).toBeGreaterThanOrEqual(STREAK_XP_MULTIPLIER[i + 1].multiplier);
      }
    });

    it('base multiplier is 1.0', () => {
      const base = STREAK_XP_MULTIPLIER.find(s => s.minDays === 0);
      expect(base).toBeDefined();
      expect(base!.multiplier).toBe(1.0);
    });
  });

  describe('LEVEL_TITLES', () => {
    it('is sorted by minLevel descending', () => {
      for (let i = 0; i < LEVEL_TITLES.length - 1; i++) {
        expect(LEVEL_TITLES[i].minLevel).toBeGreaterThan(LEVEL_TITLES[i + 1].minLevel);
      }
    });

    it('has 7 rank tiers', () => {
      expect(LEVEL_TITLES).toHaveLength(7);
    });

    it('starts at level 1 (Recruit)', () => {
      const last = LEVEL_TITLES[LEVEL_TITLES.length - 1];
      expect(last.minLevel).toBe(1);
      expect(last.title).toBe('Recruit');
    });

    it('ends at level 50 (Atlas Prime)', () => {
      expect(LEVEL_TITLES[0].minLevel).toBe(50);
      expect(LEVEL_TITLES[0].title).toBe('Atlas Prime');
    });

    it('all titles have colors', () => {
      LEVEL_TITLES.forEach(t => {
        expect(t.color).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });

  describe('BADGE_DEFINITIONS', () => {
    it('has 12 badges', () => {
      expect(BADGE_DEFINITIONS).toHaveLength(12);
    });

    it('all badges have unique keys', () => {
      const keys = BADGE_DEFINITIONS.map(b => b.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('all badges have required fields', () => {
      BADGE_DEFINITIONS.forEach(badge => {
        expect(badge.key).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.icon).toBeTruthy();
        expect(['bronze', 'silver', 'gold', 'legendary']).toContain(badge.tier);
      });
    });

    it('has badges in all tiers', () => {
      const tiers = new Set(BADGE_DEFINITIONS.map(b => b.tier));
      expect(tiers.has('bronze')).toBe(true);
      expect(tiers.has('silver')).toBe(true);
      expect(tiers.has('gold')).toBe(true);
      expect(tiers.has('legendary')).toBe(true);
    });

    it('has at least 1 legendary badge', () => {
      const legendary = BADGE_DEFINITIONS.filter(b => b.tier === 'legendary');
      expect(legendary.length).toBeGreaterThanOrEqual(1);
    });
  });
});
