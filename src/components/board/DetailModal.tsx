'use client';

import { useState } from 'react';
import type { Card, Category, Column, Epic, CardRelationship, RelationshipType } from '@/types/database';
import { PRIORITIES } from '@/types/database';
import { ActivityLog } from './ActivityLog';
import { CardComments } from './CardComments';
import { CardRelationships } from './CardRelationships';
import { CardAttachments } from './CardAttachments';

interface DetailModalProps {
  card: Card;
  categories: Category[];
  columns: Column[];
  epics: Epic[];
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onMove: (colId: string) => void;
  onViewEpic: (epicId: string) => void;
  onArchive?: () => void;
  allCards?: Card[];
  cardRelationships?: CardRelationship[];
  onAddRelationship?: (sourceCardId: string, targetCardId: string, type: RelationshipType) => Promise<CardRelationship | undefined>;
  onRemoveRelationship?: (id: string) => Promise<void>;
  onViewCard?: (cardId: string) => void;
}

export function DetailModal({
  card, categories, columns, epics, onEdit, onClose, onDelete, onMove, onViewEpic, onArchive,
  allCards = [], cardRelationships = [], onAddRelationship, onRemoveRelationship, onViewCard,
}: DetailModalProps) {
  const [showActivity, setShowActivity] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const cat = categories.find(c => c.id === card.category_id);
  const pri = PRIORITIES.find(p => p.id === card.priority);
  const col = columns.find(c => c.id === card.column_id);
  const epic = epics.find(e => e.id === card.epic_id);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cat?.color || '#555' }} />
            {card.title}
          </h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>
        <div className="p-5 space-y-3">
          {epic && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Epic</div>
              <button
                onClick={() => onViewEpic(epic.id)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border cursor-pointer hover:brightness-125 transition-all"
                style={{ borderColor: epic.color + '44', color: epic.color, background: epic.color + '11' }}
              >
                &#9670; {epic.name}
              </button>
            </div>
          )}
          {card.description && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Description</div>
              <div className="text-[13px] text-[#e8e8f0] leading-relaxed">{card.description}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Category</div>
              <div className="text-[13px]" style={{ color: cat?.color }}>{cat?.label || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Priority</div>
              <div className="text-[13px]" style={{ color: pri?.color }}>{pri?.label || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Effort</div>
              <div className="text-[13px] font-mono">{card.effort || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Status</div>
              <div className="text-[13px]">{col?.title || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Due Date</div>
              <div className="text-[13px]">
                {card.due_date ? (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const due = new Date(card.due_date + 'T00:00:00');
                  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = diffDays < 0;
                  const color = isOverdue ? '#f87171' : diffDays === 0 ? '#fbbf24' : '#e8e8f0';
                  return <span style={{ color }}>{new Date(card.due_date).toLocaleDateString()}{isOverdue ? ' (overdue)' : diffDays === 0 ? ' (today)' : ''}</span>;
                })() : '—'}
              </div>
            </div>
          </div>
          {card.notes && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Notes</div>
              <div className="text-[13px] text-[#e8e8f0] whitespace-pre-wrap leading-relaxed">{card.notes}</div>
            </div>
          )}
          {/* Relationships */}
          {onAddRelationship && onRemoveRelationship && (
            <div className="border-t border-[#1e1e2e] pt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Relationships</div>
              <CardRelationships
                cardId={card.id}
                cards={allCards}
                relationships={cardRelationships}
                onAdd={onAddRelationship}
                onRemove={onRemoveRelationship}
                onViewCard={onViewCard}
              />
            </div>
          )}

          {/* Attachments */}
          <div className="border-t border-[#1e1e2e] pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Attachments</div>
            <CardAttachments cardId={card.id} boardId={card.board_id} />
          </div>

          {/* Comments */}
          <div className="border-t border-[#1e1e2e] pt-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#555568] hover:text-[#8888a0] transition-colors cursor-pointer mb-1"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${showComments ? 'rotate-90' : ''}`}>
                <path d="M2 1l4 3-4 3V1z" />
              </svg>
              Comments
            </button>
            {showComments && (
              <CardComments cardId={card.id} boardId={card.board_id} />
            )}
          </div>

          {/* Activity Log */}
          <div className="border-t border-[#1e1e2e] pt-3">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#555568] hover:text-[#8888a0] transition-colors cursor-pointer mb-1"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${showActivity ? 'rotate-90' : ''}`}>
                <path d="M2 1l4 3-4 3V1z" />
              </svg>
              Activity
            </button>
            {showActivity && (
              <ActivityLog boardId={card.board_id} cardId={card.id} columns={columns} />
            )}
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1">Move to</div>
            <div className="flex gap-1.5 flex-wrap">
              {columns.filter(c => c.id !== card.column_id).map(c => (
                <button key={c.id} onClick={() => onMove(c.id)}
                  className="px-2.5 py-1 text-xs text-[#8888a0] border border-[#2a2a3a] rounded-md hover:bg-[#1a1a26] hover:text-white transition-all cursor-pointer">
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e2e]">
          <div className="flex gap-2">
            <button onClick={onDelete} className="text-xs text-[#f87171] hover:bg-[#f8717110] px-3 py-1.5 rounded-md transition-all cursor-pointer">Delete</button>
            {onArchive && (
              <button onClick={onArchive} className="text-xs text-[#a855f7] hover:bg-[#a855f710] px-3 py-1.5 rounded-md transition-all cursor-pointer">Archive</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-[#8888a0] border border-[#2a2a3a] px-3 py-1.5 rounded-md hover:bg-[#1a1a26] transition-all cursor-pointer">Close</button>
            <button onClick={onEdit} className="text-xs text-white bg-[#4a9eff] px-3 py-1.5 rounded-md hover:brightness-110 transition-all cursor-pointer">Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
