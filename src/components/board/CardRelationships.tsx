'use client';

import { useState, useMemo } from 'react';
import type { Card, CardRelationship, RelationshipType } from '@/types/database';

interface CardRelationshipsProps {
  cardId: string;
  cards: Card[];
  relationships: CardRelationship[];
  onAdd: (sourceCardId: string, targetCardId: string, type: RelationshipType) => Promise<CardRelationship | undefined>;
  onRemove: (id: string) => Promise<void>;
  onViewCard?: (cardId: string) => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, { forward: string; reverse: string; color: string }> = {
  blocks: { forward: 'Blocks', reverse: 'Blocked by', color: '#f87171' },
  related_to: { forward: 'Related to', reverse: 'Related to', color: '#4a9eff' },
  duplicates: { forward: 'Duplicates', reverse: 'Duplicated by', color: '#fbbf24' },
};

export function CardRelationships({ cardId, cards, relationships, onAdd, onRemove, onViewCard }: CardRelationshipsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedType, setSelectedType] = useState<RelationshipType>('blocks');
  const [searchText, setSearchText] = useState('');
  const [adding, setAdding] = useState(false);

  // Find relationships involving this card
  const outgoing = useMemo(() => relationships.filter(r => r.source_card_id === cardId), [relationships, cardId]);
  const incoming = useMemo(() => relationships.filter(r => r.target_card_id === cardId), [relationships, cardId]);

  const handleAdd = async (targetId: string) => {
    setAdding(true);
    await onAdd(cardId, targetId, selectedType);
    setSearchText('');
    setShowAdd(false);
    setAdding(false);
  };

  // Filter available cards for linking — memoized to avoid recalc on every keystroke for the base set
  const linkedIds = useMemo(() => new Set([
    ...outgoing.map(r => r.target_card_id),
    ...incoming.map(r => r.source_card_id),
    cardId,
  ]), [outgoing, incoming, cardId]);

  const availableCards = useMemo(() => cards.filter(c =>
    !linkedIds.has(c.id) &&
    c.title.toLowerCase().includes(searchText.toLowerCase())
  ), [cards, linkedIds, searchText]);

  const hasRelationships = outgoing.length > 0 || incoming.length > 0;

  return (
    <div>
      {hasRelationships && (
        <div className="space-y-1.5 mb-2">
          {outgoing.map(rel => {
            const target = cards.find(c => c.id === rel.target_card_id);
            const label = RELATIONSHIP_LABELS[rel.relationship_type as RelationshipType];
            return (
              <div key={rel.id} className="flex items-center gap-2 group">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: label?.color, background: `${label?.color}15` }}>
                  {label?.forward}
                </span>
                <button
                  onClick={() => target && onViewCard?.(target.id)}
                  className="text-[12px] text-[#8888a0] hover:text-[#4a9eff] truncate cursor-pointer transition-colors"
                >
                  {target?.title || 'Unknown card'}
                </button>
                <button
                  onClick={() => onRemove(rel.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-[#555568] hover:text-[#f87171] cursor-pointer transition-opacity ml-auto flex-shrink-0"
                >
                  &times;
                </button>
              </div>
            );
          })}
          {incoming.map(rel => {
            const source = cards.find(c => c.id === rel.source_card_id);
            const label = RELATIONSHIP_LABELS[rel.relationship_type as RelationshipType];
            return (
              <div key={rel.id} className="flex items-center gap-2 group">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: label?.color, background: `${label?.color}15` }}>
                  {label?.reverse}
                </span>
                <button
                  onClick={() => source && onViewCard?.(source.id)}
                  className="text-[12px] text-[#8888a0] hover:text-[#4a9eff] truncate cursor-pointer transition-colors"
                >
                  {source?.title || 'Unknown card'}
                </button>
                <button
                  onClick={() => onRemove(rel.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-[#555568] hover:text-[#f87171] cursor-pointer transition-opacity ml-auto flex-shrink-0"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="text-[11px] text-[#555568] hover:text-[#4a9eff] transition-colors cursor-pointer"
        >
          + Add relationship
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                  selectedType === type
                    ? 'border-current bg-opacity-20'
                    : 'border-[#2a2a3a] text-[#555568] hover:text-[#8888a0]'
                }`}
                style={selectedType === type ? {
                  color: RELATIONSHIP_LABELS[type].color,
                  borderColor: RELATIONSHIP_LABELS[type].color,
                  background: `${RELATIONSHIP_LABELS[type].color}15`,
                } : undefined}
              >
                {RELATIONSHIP_LABELS[type].forward}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setShowAdd(false); }}
            placeholder="Search cards..."
            className="w-full px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3a] text-[#e8e8f0] text-[11px] rounded outline-none focus:border-[#4a9eff] placeholder:text-[#555568]"
          />
          {searchText && (
            <div className="max-h-[120px] overflow-y-auto space-y-0.5">
              {availableCards.slice(0, 8).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAdd(c.id)}
                  disabled={adding}
                  className="w-full text-left px-2 py-1 text-[11px] text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#1a1a26] rounded transition-all cursor-pointer truncate disabled:opacity-50"
                >
                  {c.title}
                </button>
              ))}
              {availableCards.length === 0 && (
                <div className="text-[10px] text-[#555568] py-1 px-2">No matching cards</div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="text-[10px] text-[#555568] hover:text-[#8888a0] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
