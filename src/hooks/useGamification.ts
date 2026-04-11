'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLevel, UserStreak, UserBadge, XPAction, Card } from '@/types/database';
import { BADGE_DEFINITIONS } from '@/types/database';
import * as gamification from '@/lib/gamification-actions';
import { createClient } from '@/lib/supabase/client';

/** How long to mute realtime after a local XP mutation (ms) */
const REALTIME_MUTE_MS = 600;

export interface XPToast {
  id: string;
  xp: number;
  action: string;
  leveledUp: boolean;
  newLevel?: number;
  newTitle?: string;
  newBadges: string[];
}

export function useGamification(userId: string | null, boardId: string | null, showToasts: boolean = true) {
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [xpToasts, setXpToasts] = useState<XPToast[]>([]);
  const [loading, setLoading] = useState(true);
  const toastIdRef = useRef(0);

  // Mute realtime updates briefly after local mutations to avoid double-renders
  const muteRealtimeRef = useRef(false);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muteRealtime = useCallback(() => {
    muteRealtimeRef.current = true;
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    muteTimerRef.current = setTimeout(() => {
      muteRealtimeRef.current = false;
    }, REALTIME_MUTE_MS);
  }, []);

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

  // ─── Realtime subscriptions for cross-tab sync ────────────
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    // Note: postgres_changes always delivers to all subscribers including self.
    // muteRealtimeRef prevents double-processing after local mutations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: any = supabase.channel(`gamification-${userId}`);

    // user_levels — UPDATE (upsert always updates after initial insert)
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_levels', filter: `user_id=eq.${userId}` },
      (payload: { new: UserLevel }) => {
        if (muteRealtimeRef.current) return;
        setLevel(payload.new);
      }
    );

    // user_streaks — UPDATE
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_streaks', filter: `user_id=eq.${userId}` },
      (payload: { new: UserStreak }) => {
        if (muteRealtimeRef.current) return;
        setStreak(payload.new);
      }
    );

    // user_badges — INSERT (badges are only ever inserted, never updated)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'user_badges', filter: `user_id=eq.${userId}` },
      (payload: { new: UserBadge }) => {
        if (muteRealtimeRef.current) return;
        setBadges(prev => [payload.new, ...prev]);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    };
  }, [userId]);

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

  // Shared post-award state update: mute realtime, update level/streak/badges, show toast
  const handleAwardResult = useCallback((result: gamification.XPAwardResult) => {
    muteRealtime();
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
    if (result.newBadges.length > 0 && userId) {
      gamification.getUserBadges(userId).then(setBadges).catch(() => {});
    }
    if (showToasts) addToast(result);
  }, [userId, muteRealtime, addToast, showToasts]);

  // Award XP and update local state
  const awardXP = useCallback(async (action: XPAction, metadata: Record<string, unknown> = {}) => {
    if (!userId || !boardId) return null;
    try {
      const result = await gamification.awardXP(userId, boardId, action, metadata);
      handleAwardResult(result);
      return result;
    } catch {
      return null;
    }
  }, [userId, boardId, handleAwardResult]);

  // Convenience: award XP for completing a card
  const awardCardCompletion = useCallback(async (card: Card) => {
    if (!userId || !boardId) return;
    try {
      const result = await gamification.awardCardCompletionXP(userId, boardId, card);
      if (result) handleAwardResult(result);
    } catch {
      // Non-blocking
    }
  }, [userId, boardId, handleAwardResult]);

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
