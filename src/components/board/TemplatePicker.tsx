'use client';

import { useState } from 'react';
import type { CardTemplate } from '@/types/database';

interface TemplatePickerProps {
  templates: CardTemplate[];
  onApply: (templateData: CardTemplate['template_data']) => void;
  onSave: (name: string, templateData: CardTemplate['template_data']) => Promise<CardTemplate | undefined>;
  onDelete: (id: string) => Promise<void>;
  /** Current form state to save as a template */
  currentFormData: CardTemplate['template_data'];
}

export function TemplatePicker({ templates, onApply, onSave, onDelete, currentFormData }: TemplatePickerProps) {
  const [showSave, setShowSave] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    await onSave(templateName.trim(), currentFormData);
    setTemplateName('');
    setShowSave(false);
    setSaving(false);
  };

  if (templates.length === 0 && !showSave) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="text-[11px] text-[#555568] hover:text-[#4a9eff] transition-colors cursor-pointer"
        >
          Save as template
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#555568] hover:text-[#8888a0] transition-colors cursor-pointer"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
            <path d="M2 1l4 3-4 3V1z" />
          </svg>
          Templates ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="text-[11px] text-[#555568] hover:text-[#4a9eff] transition-colors cursor-pointer ml-auto"
        >
          + Save current
        </button>
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => onApply(tmpl.template_data)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[#2a2a3a] text-[#8888a0] hover:text-[#4a9eff] hover:border-[#4a9eff] bg-transparent transition-all cursor-pointer"
              >
                {tmpl.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(tmpl.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-[#555568] hover:text-[#f87171] transition-all cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {showSave && (
        <div className="flex items-center gap-1.5 mt-1">
          <input
            autoFocus
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') setShowSave(false);
            }}
            placeholder="Template name..."
            className="flex-1 px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3a] text-[#e8e8f0] text-[11px] rounded outline-none focus:border-[#4a9eff] placeholder:text-[#555568]"
          />
          <button type="button" onClick={handleSave} disabled={saving || !templateName.trim()}
            className="px-2 py-1 rounded text-[11px] font-medium bg-[#4a9eff] text-white hover:bg-[#3b8be0] transition-all cursor-pointer disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setShowSave(false)}
            className="px-1 py-1 text-[11px] text-[#555568] hover:text-[#8888a0] cursor-pointer">
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
