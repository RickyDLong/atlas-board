'use client';

import type { XPToast as XPToastType } from '@/hooks/useGamification';

const ACTION_LABELS: Record<string, string> = {
  card_create: 'Card Created',
  card_complete: 'Card Completed',
  card_complete_high: 'High Priority Done',
  card_complete_critical: 'Critical Done!',
  card_on_time: 'On Time Bonus',
  card_early: 'Early Finish!',
  column_clear: 'Column Cleared!',
  streak_daily: 'Daily Streak',
  streak_7day: '7-Day Streak!',
  streak_30day: '30-Day Streak!',
  epic_complete: 'Epic Complete!',
  archive_batch: 'Cleanup Bonus',
};

interface XPToastProps {
  toasts: XPToastType[];
  onDismiss: (id: string) => void;
}

export function XPToastStack({ toasts, onDismiss }: XPToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-up"
          style={{
            animation: 'slideUp 0.3s ease-out',
            opacity: 1 - i * 0.15,
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm cursor-pointer"
            style={{
              background: toast.leveledUp
                ? 'linear-gradient(135deg, #1a1040, #12121a)'
                : '#12121a',
              borderColor: toast.leveledUp ? '#a855f7' : '#2a2a3a',
              boxShadow: toast.leveledUp
                ? '0 0 20px rgba(168, 85, 247, 0.3)'
                : '0 4px 12px rgba(0,0,0,0.5)',
            }}
            onClick={() => onDismiss(toast.id)}
          >
            {/* XP amount */}
            <span
              className="text-lg font-bold font-mono"
              style={{ color: '#34d399' }}
            >
              +{toast.xp}
            </span>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#e8e8f0]">
                {ACTION_LABELS[toast.action] || toast.action}
              </span>

              {toast.leveledUp && (
                <span className="text-[10px] font-bold" style={{ color: '#a855f7' }}>
                  Level Up! Lv.{toast.newLevel} {toast.newTitle}
                </span>
              )}

              {toast.newBadges.length > 0 && (
                <span className="text-[10px] font-semibold" style={{ color: '#fbbf24' }}>
                  {toast.newBadges.join(', ')}
                </span>
              )}
            </div>

            <span className="text-[10px] text-[#555568] ml-2">XP</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
