'use client';

import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
  onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[360px] max-w-[95vw] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white">Keyboard Shortcuts</h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1.5">
              <span className="text-[13px] text-[#8888a0]">{s.description}</span>
              <kbd className="text-[11px] font-mono text-[#e8e8f0] bg-[#1a1a26] border border-[#2a2a3a] rounded px-2 py-0.5 min-w-[28px] text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#1e1e2e] text-center">
          <span className="text-[11px] text-[#555568]">Press <kbd className="font-mono text-[#8888a0] bg-[#1a1a26] border border-[#2a2a3a] rounded px-1.5 py-0.5 text-[10px]">?</kbd> anytime to show this</span>
        </div>
      </div>
    </div>
  );
}
