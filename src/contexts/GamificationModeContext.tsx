'use client';

import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { updateUserPreferences, getUserPreferences } from '@/lib/board-actions';

const CLEAN_COLUMN_NAMES: Record<string, string> = {
  'Quest Log': 'Backlog',
  'Preparing': 'Up Next',
  'In Battle': 'In Progress',
  'Loot Check': 'Review',
  'Conquered': 'Done',
};

interface GamificationModeContextType {
  isGamified: boolean;
  toggleGamification: () => Promise<void>;
  columnDisplayName: (dbName: string) => string;
  loading: boolean;
}

const GamificationModeContext = createContext<GamificationModeContextType | undefined>(undefined);

interface GamificationModeProviderProps {
  userId: string | null;
  children: ReactNode;
}

export function GamificationModeProvider({ userId, children }: GamificationModeProviderProps) {
  const [isGamified, setIsGamified] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences(userId);
        setIsGamified(prefs.gamification_enabled ?? true);
      } catch (err) {
        console.error('Failed to load gamification preference:', err);
        setIsGamified(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const toggleGamification = useCallback(async () => {
    if (!userId) return;

    const newState = !isGamified;
    setIsGamified(newState);

    try {
      await updateUserPreferences(userId, { gamification_enabled: newState });
    } catch (err) {
      console.error('Failed to update gamification preference:', err);
      // Revert on error
      setIsGamified(!newState);
    }
  }, [userId, isGamified]);

  const columnDisplayName = useCallback((dbName: string): string => {
    if (!isGamified) {
      return CLEAN_COLUMN_NAMES[dbName] ?? dbName;
    }
    return dbName;
  }, [isGamified]);

  const value: GamificationModeContextType = {
    isGamified,
    toggleGamification,
    columnDisplayName,
    loading,
  };

  return (
    <GamificationModeContext.Provider value={value}>
      {children}
    </GamificationModeContext.Provider>
  );
}

export function useGamificationMode(): GamificationModeContextType {
  const context = useContext(GamificationModeContext);
  if (context === undefined) {
    throw new Error('useGamificationMode must be used within GamificationModeProvider');
  }
  return context;
}
