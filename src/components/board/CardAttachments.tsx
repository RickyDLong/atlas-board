'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CardAttachment } from '@/types/database';
import * as actions from '@/lib/board-actions';

interface CardAttachmentsProps {
  cardId: string;
  boardId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return '🖼';
  if (contentType === 'application/pdf') return '📄';
  if (contentType.startsWith('text/')) return '📝';
  if (contentType === 'application/zip') return '📦';
  return '📎';
}

export function CardAttachments({ cardId, boardId }: CardAttachmentsProps) {
  const [attachments, setAttachments] = useState<CardAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await actions.getCardAttachments(cardId);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await actions.uploadCardAttachment(cardId, boardId, file);
      setAttachments(prev => [...prev, attachment]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment: CardAttachment) => {
    try {
      await actions.deleteCardAttachment(attachment.id, attachment.storage_path);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleView = async (attachment: CardAttachment) => {
    try {
      const url = await actions.getAttachmentSignedUrl(attachment.storage_path);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to get URL:', err);
    }
  };

  if (loading) {
    return <div className="text-[12px] text-[#555568] py-2 text-center">Loading attachments...</div>;
  }

  if (loadError) {
    return (
      <div className="text-[12px] text-[#555568] py-2 text-center">
        Failed to load attachments.{' '}
        <button onClick={load} className="text-[#4a9eff] hover:underline cursor-pointer">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-[#1a1a26] transition-colors">
              <span className="text-sm flex-shrink-0">{getFileIcon(att.content_type)}</span>
              <button
                onClick={() => handleView(att)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <span className="text-[12px] text-[#c8c8d0] hover:text-[#4a9eff] truncate block transition-colors">
                  {att.file_name}
                </span>
                <span className="text-[10px] text-[#555568]">{formatFileSize(att.file_size)}</span>
              </button>
              <button
                onClick={() => handleDelete(att)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-[#555568] hover:text-[#f87171] cursor-pointer transition-opacity flex-shrink-0"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleUpload}
        className="hidden"
        accept="image/*,.pdf,.txt,.csv,.json,.zip"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-[11px] text-[#555568] hover:text-[#4a9eff] transition-colors cursor-pointer disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : '+ Attach file'}
      </button>
    </div>
  );
}
