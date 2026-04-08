'use client';

import { useEffect, useState } from 'react';

interface UndoToastProps {
  description: string;
  onUndo: () => Promise<void>;
  onDismiss: () => void;
  autoHideDelay?: number;
}

export function UndoToast({ description, onUndo, onDismiss, autoHideDelay = 5000 }: UndoToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHideDelay, onDismiss]);

  if (!isVisible) return null;

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
      setIsVisible(false);
      onDismiss();
    } catch (err) {
      console.error('Undo failed:', err);
      setIsUndoing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999]">
      <div className="bg-[#1a1a26] border border-[#2a2a3a] rounded-lg px-4 py-3 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="text-sm text-[#e8e8f0]">{description}</span>
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className="ml-2 px-3 py-1.5 bg-[#4a9eff] text-white text-xs font-medium rounded hover:bg-[#3a8eef] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isUndoing ? 'Undoing...' : 'Undo'}
        </button>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="text-[#555568] hover:text-[#8888a0] transition-colors cursor-pointer text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
