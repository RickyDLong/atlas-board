'use client';

import { useState, useEffect } from 'react';
import type { Card, Category } from '@/types/database';
import { PRIORITIES } from '@/types/database';
import { getArchivedCards } from '@/lib/board-actions';

interface ArchivePanelProps {
  boardId: string;
  categories: Category[];
  onRestore: (card: Card) => Promise<void>;
  onClose: () => void;
}

export function ArchivePanel({ boardId, categories, onRestore, onClose }: ArchivePanelProps) {
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const cards = await getArchivedCards(boardId);
      setArchivedCards(cards);
      setLoading(false);
    }
    load();
  }, [boardId]);

  const filtered = search
    ? archivedCards.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : archivedCards;

  const handleRestore = async (card: Card) => {
    setRestoring(card.id);
    await onRestore(card);
    setArchivedCards(prev => prev.filter(c => c.id !== card.id));
    setRestoring(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[520px] max-w-[95vw] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white">
            Archive <span className="text-[#555568] font-normal ml-1 text-sm">{archivedCards.length} cards</span>
          </h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>

        <div className="px-5 py-3 border-b border-[#1e1e2e]">
          <input
            type="text"
            placeholder="Search archived cards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="text-center py-8 text-[#555568] text-sm">Loading archive...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-[#3a3a4a] text-sm">
              {search ? 'No matches found' : 'Archive is empty'}
            </div>
          ) : (
            filtered.map(card => {
              const cat = categories.find(c => c.id === card.category_id);
              const pri = PRIORITIES.find(p => p.id === card.priority);
              const archivedDate = card.archived_at ? new Date(card.archived_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

              return (
                <div
                  key={card.id}
                  className="bg-[#0e0e16] border border-[#1e1e2e] rounded-lg p-3 flex items-start justify-between gap-3 hover:border-[#2a2a3a] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#e8e8f0] font-medium truncate">{card.title}</div>
                    {card.description && (
                      <div className="text-[11px] text-[#555568] mt-0.5 truncate">{card.description}</div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {cat && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded uppercase" style={{ background: cat.color + '22', color: cat.color }}>
                          {cat.label}
                        </span>
                      )}
                      {pri && (
                        <span className="text-[9px] font-medium" style={{ color: pri.color }}>
                          {pri.label}
                        </span>
                      )}
                      <span className="text-[9px] text-[#3a3a4a] ml-auto">Archived {archivedDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(card)}
                    disabled={restoring === card.id}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-md border border-[#2a2a3a] text-[#8888a0] hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    {restoring === card.id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
