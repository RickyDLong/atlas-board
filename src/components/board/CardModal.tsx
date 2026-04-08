'use client';

import { useState } from 'react';
import type { Card, Category, Column, Epic, Subtask, Label, CardTemplate, RecurrenceRule } from '@/types/database';
import { PRIORITIES, EFFORTS, RECURRENCE_OPTIONS } from '@/types/database';
import { LabelPicker } from './LabelPicker';
import { TemplatePicker } from './TemplatePicker';

interface CardModalProps {
  card: Card | null;
  boardId: string;
  defaultColumnId: string;
  categories: Category[];
  columns: Column[];
  epics: Epic[];
  nextPosition: number;
  defaultDueDate?: string | null;
  subtasks?: Subtask[];
  onAddSubtask?: (title: string) => Promise<Subtask | void>;
  onToggleSubtask?: (subtaskId: string) => Promise<void>;
  onDeleteSubtask?: (subtaskId: string) => Promise<void>;
  onEditSubtask?: (subtaskId: string, title: string) => Promise<void>;
  labels?: Label[];
  cardLabelIds?: string[];
  onToggleLabel?: (labelId: string) => void;
  onCreateLabel?: (name: string, color: string) => Promise<Label | undefined>;
  cardTemplates?: CardTemplate[];
  onSaveTemplate?: (name: string, templateData: CardTemplate['template_data']) => Promise<CardTemplate | undefined>;
  onDeleteTemplate?: (id: string) => Promise<void>;
  onSave: (data: Partial<Card>) => Promise<void>;
  onClose: () => void;
}

export function CardModal({
  card, boardId, defaultColumnId, categories, columns, epics, nextPosition, defaultDueDate,
  subtasks = [], onAddSubtask, onToggleSubtask, onDeleteSubtask, onEditSubtask,
  labels = [], cardLabelIds = [], onToggleLabel, onCreateLabel,
  cardTemplates = [], onSaveTemplate, onDeleteTemplate,
  onSave, onClose
}: CardModalProps) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [categoryId, setCategoryId] = useState(card?.category_id || categories[0]?.id || '');
  const [priority, setPriority] = useState<Card['priority']>(card?.priority || 'medium');
  const [effort, setEffort] = useState<NonNullable<Card['effort']>>(card?.effort || 'M');
  const [columnId, setColumnId] = useState(card?.column_id || defaultColumnId);
  const [epicId, setEpicId] = useState(card?.epic_id || '');
  const [notes, setNotes] = useState(card?.notes || '');
  const [dueDate, setDueDate] = useState(card?.due_date || defaultDueDate || '');
  const [estimatedHours, setEstimatedHours] = useState(card?.estimated_hours?.toString() || '');
  const [actualHours, setActualHours] = useState(card?.actual_hours?.toString() || '');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | ''>(card?.recurrence_rule || '');
  const [saving, setSaving] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      board_id: boardId,
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      priority: priority as Card['priority'],
      effort: effort as Card['effort'],
      column_id: columnId,
      epic_id: epicId || null,
      notes: notes.trim() || null,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      actual_hours: actualHours ? parseFloat(actualHours) : null,
      recurrence_rule: recurrenceRule || null,
      position: card ? card.position : nextPosition,
    });
    setSaving(false);
  };

  const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !newSubtaskTitle.trim() || !onAddSubtask) return;
    e.preventDefault();
    await onAddSubtask(newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleEditSubtask = async (subtaskId: string) => {
    if (!editingSubtaskTitle.trim() || !onEditSubtask) return;
    await onEditSubtask(subtaskId, editingSubtaskTitle.trim());
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <h2 className="text-[15px] font-semibold text-white">{card ? 'Edit Project' : 'New Project'}</h2>
          <button className="text-[#555568] hover:text-white text-lg px-2 py-1 rounded hover:bg-[#22222f] transition-all cursor-pointer" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-3.5">
            {/* Template picker — only for new cards */}
            {!card && onSaveTemplate && onDeleteTemplate && (
              <TemplatePicker
                templates={cardTemplates}
                onApply={(data) => {
                  if (data.title) setTitle(data.title);
                  if (data.description) setDescription(data.description);
                  if (data.category_id) setCategoryId(data.category_id);
                  if (data.priority) setPriority(data.priority as Card['priority']);
                  if (data.effort) setEffort(data.effort as NonNullable<Card['effort']>);
                  if (data.epic_id) setEpicId(data.epic_id);
                  if (data.notes) setNotes(data.notes);
                }}
                onSave={onSaveTemplate}
                onDelete={onDeleteTemplate}
                currentFormData={{
                  title: title || undefined,
                  description: description || undefined,
                  category_id: categoryId || undefined,
                  priority: priority || undefined,
                  effort: effort || undefined,
                  epic_id: epicId || undefined,
                  notes: notes || undefined,
                }}
              />
            )}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Name your quest..."
                className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors" autoFocus />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description or goal..."
                className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors resize-y min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Card['priority'])}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Effort</label>
                <select value={effort} onChange={e => setEffort(e.target.value as NonNullable<Card['effort']>)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                  {EFFORTS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Status</label>
                <select value={columnId} onChange={e => setColumnId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                  {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Epic</label>
              <select value={epicId} onChange={e => setEpicId(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                <option value="">No epic</option>
                {epics.filter(e => e.status !== 'archived').map(e => <option key={e.id} value={e.id}>&#9670; {e.name}</option>)}
              </select>
            </div>
            {onToggleLabel && onCreateLabel && (
              <LabelPicker
                labels={labels}
                selectedLabelIds={cardLabelIds}
                onToggle={onToggleLabel}
                onCreateLabel={onCreateLabel}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Repeat</label>
                <select value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value as RecurrenceRule | '')}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] cursor-pointer">
                  <option value="">None</option>
                  {RECURRENCE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Est. Hours</label>
                <input type="number" step="0.25" min="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] placeholder:text-[#555568]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Actual Hours</label>
                <input type="number" step="0.25" min="0" value={actualHours} onChange={e => setActualHours(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] placeholder:text-[#555568]" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568] mb-1.5">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Links, context, next steps..." rows={3}
                className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors resize-y min-h-[60px]" />
            </div>

            {/* Checklist section — only show when editing an existing card */}
            {card && onAddSubtask && (
              <div className="border-t border-[#1e1e2e] pt-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#555568]">
                    Checklist
                  </label>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] text-[#34d399] font-medium">
                      {subtasks.filter(s => s.completed).length}/{subtasks.length}
                    </span>
                  )}
                </div>

                {/* Subtask list */}
                {subtasks.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => onToggleSubtask?.(subtask.id)}
                          className="w-4 h-4 rounded border border-[#2a2a3a] bg-[#1a1a26] accent-[#4a9eff] cursor-pointer flex-shrink-0"
                        />
                        {editingSubtaskId === subtask.id ? (
                          <input
                            type="text"
                            value={editingSubtaskTitle}
                            onChange={e => setEditingSubtaskTitle(e.target.value)}
                            onBlur={() => handleEditSubtask(subtask.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSubtask(subtask.id);
                              if (e.key === 'Escape') setEditingSubtaskId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-0.5 bg-[#1a1a26] border border-[#4a9eff] rounded text-[13px] text-[#e8e8f0] outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingSubtaskId(subtask.id);
                              setEditingSubtaskTitle(subtask.title);
                            }}
                            className={`flex-1 text-[13px] cursor-pointer px-2 py-0.5 rounded transition-colors ${
                              subtask.completed
                                ? 'text-[#555568] line-through'
                                : 'text-[#e8e8f0] hover:bg-[#1a1a26]'
                            }`}
                          >
                            {subtask.title}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteSubtask?.(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#555568] hover:text-[#f87171] text-sm px-1 py-0.5 rounded hover:bg-[#1a1a26] transition-opacity cursor-pointer flex-shrink-0"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add subtask input */}
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleAddSubtask}
                  placeholder="Add item..."
                  className="w-full px-3 py-1.5 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-[#e8e8f0] text-sm outline-none focus:border-[#4a9eff] transition-colors placeholder-[#555568]"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#1e1e2e]">
            <button type="button" onClick={onClose} className="text-xs text-[#8888a0] border border-[#2a2a3a] px-4 py-2 rounded-md hover:bg-[#1a1a26] transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="text-xs text-white bg-[#4a9eff] px-4 py-2 rounded-md hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : card ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
