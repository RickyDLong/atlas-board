import type { RecurrenceRule } from '@/types/database';

/**
 * Computes the next due date (YYYY-MM-DD) for a recurring card, given its
 * current due date and recurrence rule. Month/quarter steps clamp overflow so
 * e.g. Jan 31 monthly lands on Feb 28, not Mar 3.
 */
export function computeNextDueDate(currentDue: string, rule: RecurrenceRule): string {
  const d = new Date(currentDue + 'T00:00:00');
  switch (rule) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': {
      const targetMonth = (d.getMonth() + 1) % 12;
      d.setMonth(d.getMonth() + 1);
      // Clamp overflow (e.g. Jan 31 → Mar 3 → Feb 28)
      if (d.getMonth() !== targetMonth) d.setDate(0);
      break;
    }
    case 'quarterly': {
      const targetMonth = (d.getMonth() + 3) % 12;
      d.setMonth(d.getMonth() + 3);
      if (d.getMonth() !== targetMonth) d.setDate(0);
      break;
    }
  }
  return d.toISOString().split('T')[0];
}
