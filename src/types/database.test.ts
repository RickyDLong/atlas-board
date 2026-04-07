import { describe, it, expect } from 'vitest';
import {
  PRIORITIES,
  EPIC_STATUSES,
  EFFORTS,
  DEFAULT_COLUMNS,
  DEFAULT_CATEGORIES,
  PRESET_COLORS,
} from '@/types/database';

describe('database constants', () => {
  describe('PRIORITIES', () => {
    it('has exactly 4 priority levels', () => {
      expect(PRIORITIES).toHaveLength(4);
    });

    it('includes critical, high, medium, low in order', () => {
      expect(PRIORITIES.map(p => p.id)).toEqual(['critical', 'high', 'medium', 'low']);
    });

    it('each priority has id, label, and color', () => {
      for (const p of PRIORITIES) {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('label');
        expect(p).toHaveProperty('color');
        expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('uses the correct project colors', () => {
      expect(PRIORITIES.find(p => p.id === 'critical')?.color).toBe('#f87171');
      expect(PRIORITIES.find(p => p.id === 'high')?.color).toBe('#fb923c');
      expect(PRIORITIES.find(p => p.id === 'medium')?.color).toBe('#fbbf24');
      expect(PRIORITIES.find(p => p.id === 'low')?.color).toBe('#34d399');
    });
  });

  describe('EPIC_STATUSES', () => {
    it('has exactly 4 statuses', () => {
      expect(EPIC_STATUSES).toHaveLength(4);
    });

    it('includes planning, active, completed, archived', () => {
      expect(EPIC_STATUSES.map(s => s.id)).toEqual(['planning', 'active', 'completed', 'archived']);
    });

    it('each status has id, label, and color', () => {
      for (const s of EPIC_STATUSES) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('label');
        expect(s).toHaveProperty('color');
      }
    });
  });

  describe('EFFORTS', () => {
    it('has 5 t-shirt sizes in ascending order', () => {
      expect(EFFORTS).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    });
  });

  describe('DEFAULT_COLUMNS', () => {
    it('has 5 kanban columns', () => {
      expect(DEFAULT_COLUMNS).toHaveLength(5);
    });

    it('follows quest-themed kanban flow', () => {
      expect(DEFAULT_COLUMNS.map(c => c.title)).toEqual([
        'Quest Log', 'Preparing', 'In Battle', 'Loot Check', 'Conquered',
      ]);
    });

    it('each column has title and color', () => {
      for (const col of DEFAULT_COLUMNS) {
        expect(col).toHaveProperty('title');
        expect(col).toHaveProperty('color');
      }
    });
  });

  describe('DEFAULT_CATEGORIES', () => {
    it('has 4 default categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(4);
    });

    it('each category has label and color', () => {
      for (const cat of DEFAULT_CATEGORIES) {
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('color');
      }
    });
  });

  describe('PRESET_COLORS', () => {
    it('has 18 preset colors', () => {
      expect(PRESET_COLORS).toHaveLength(18);
    });

    it('all colors are valid hex', () => {
      for (const color of PRESET_COLORS) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('contains no duplicates', () => {
      const unique = new Set(PRESET_COLORS);
      expect(unique.size).toBe(PRESET_COLORS.length);
    });
  });
});
