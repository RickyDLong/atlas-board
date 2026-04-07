'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLevel, UserStreak, UserBadge, XPAction, Card } from '@/types/database';
import { BADGE_DEFINITIONS } from '@/types/database';
import * as gamification from '@/lib/gamification-actions';

export interface XPToast {
  id: string;
  xp: number;
  action: string;
  leveledUp: boolean;
  newLevel?: number;
  newTitle?: string;
  newBadges: string[];
}

export function useGamification(userId: string | null, boardId: string | null) {
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [xpToasts, setXpToasts] = useState<XPToast[]>([]);
  const [loading, setLoading] = useState(true);
  const toastIdRef = useRef(0);

  // Load initial gamification state
  const loadGamification = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [lvl, strk, bdgs] = await Promise.all([
        gamification.getUserLevel(userId),
        gamification.getUserStreak(userId),
        gamification.getUserBadges(userId),
      ]);
      setLevel(lvl);
      setStreak(strk);
      setBadges(bdgs);
    } catch {
      // Silently fail — gamification is non-blocking
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadGamification(); }, [loadGamification]);

  // Auto-dismiss toasts after 4 seconds
  useEffect(() => {
    if (xpToasts.length === 0) return;
    const timer = setTimeout(() => {
      setXpToasts(prev => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [xpToasts]);

  const addToast = useCallback((result: gamification.XPAwardResult) => {
    const id = String(++toastIdRef.current);
    const toast: XPToast = {
      id,
      xp: result.xpAwarded,
      action: result.action,
      leveledUp: result.leveledUp,
      newLevel: result.leveledUp ? result.newLevel : undefined,
      newTitle: result.leveledUp ? result.newTitle : undefined,
      newBadges: result.newBadges.map(key => {
        const def = BADGE_DEFINITIONS.find(b => b.key === key);
        return def ? `${def.icon} ${def.name}` : key;
      }),
    };
    setXpToasts(prev => [...prev, toast]);
  }, []);

  // Award XP and update local state
  const awardXP = useCallback(async (action: XPAction, metadata: Record<string, unknown> = {}) => {
    if (!userId || !boardId) return null;
    try {
      const result = await gamification.awardXP(userId, boardId, action, metadata);
      // Update local state
      setLevel(prev => prev ? {
        ...prev,
        current_xp: result.newTotalXP,
        current_level: result.newLevel,
        title: result.newTitle,
      } : prev);
      if (result.streakUpdated) {
        setStreak(prev => prev ? {
          ...prev,
          current_streak: result.currentStreak,
          longest_streak: Math.max(prev.longest_streak, result.currentStreak),
          last_active_date: new Date().toISOString().slice(0, 10),
        } : prev);
      }
      if (result.newBadges.length > 0) {
        // Reload badges to get fresh data
        const fresh = await gamification.getUserBadges(userId);
        setBadges(fresh);
      }
      addToast(result);
      return result;
    } catch {
      return null;
    }
  }, [userId, boardId, addToast]);

  // Convenience: award XP for completing a card
  const awardCardCompletion = useCallback(async (card: Card) => {
    if (!userId || !boardId) return;
    try {
      const result = await gamification.awardCardCompletionXP(userId, boardId, card);
      if (result) {
        setLevel(prev => prev ? {
          ...prev,
          current_xp: result.newTotalXP,
          current_level: result.newLevel,
          title: result.newTitle,
        } : prev);
        if (result.streakUpdated) {
          setStreak(prev => prev ? {
            ...prev,
            current_streak: result.currentStreak,
            longest_streak: Math.max(prev.longest_streak, result.currentStreak),
            last_active_date: new Date().toISOString().slice(0, 10),
          } : prev);
        }
        if (result.newBadges.length > 0) {
          const fresh = await gamification.getUserBadges(userId);
          setBadges(fresh);
        }
        addToast(result);
      }
    } catch {
      // Non-blocking
    }
  }, [userId, boardId, addToast]);

  const dismissToast = useCallback((id: string) => {
    setXpToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Computed values
  const currentLevelXP = level ? gamification.totalXPForLevel(level.current_level) : 0;
  const nextLevelXP = level ? gamification.totalXPForLevel(level.current_level + 1) : 100;
  const xpInCurrentLevel = level ? level.current_xp - currentLevelXP : 0;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const levelProgress = xpNeededForNext > 0 ? Math.min(xpInCurrentLevel / xpNeededForNext, 1) : 0;
  const levelColor = level ? gamification.colorForLevel(level.current_level) : '#8888a0';

  return {
    level,
    streak,
    badges,
    xpToasts,
    loading,
    levelProgress,
    xpInCurrentLevel,
    xpNeededForNext,
    levelColor,
    awardXP,
    awardCardCompletion,
    dismissToast,
    refresh: loadGamification,
  };
}
