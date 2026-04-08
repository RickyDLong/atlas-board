'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CardComment } from '@/types/database';
import * as actions from '@/lib/board-actions';

interface CardCommentsProps {
  cardId: string;
  boardId: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CommentThread({
  comment,
  replies,
  onReply,
  onDelete,
  onEdit,
}: {
  comment: CardComment;
  replies: CardComment[];
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const handleSaveEdit = () => {
    if (!editBody.trim()) return;
    onEdit(comment.id, editBody.trim());
    setEditing(false);
  };

  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-[#4a9eff20] flex items-center justify-center text-[10px] text-[#4a9eff] font-bold flex-shrink-0 mt-0.5">
          R
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0a0a0f] border border-[#4a9eff] rounded text-[12px] text-[#e8e8f0] outline-none resize-y min-h-[40px]"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button onClick={handleSaveEdit} className="text-[10px] text-[#4a9eff] hover:text-[#3b8be0] cursor-pointer">Save</button>
                <button onClick={() => { setEditing(false); setEditBody(comment.body); }} className="text-[10px] text-[#555568] hover:text-[#8888a0] cursor-pointer">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[#e8e8f0] leading-relaxed whitespace-pre-wrap">{comment.body}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[#555568]">{timeAgo(comment.created_at)}</span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-[10px] text-[#555568] italic">(edited)</span>
                )}
                <button onClick={() => onReply(comment.id)} className="text-[10px] text-[#555568] hover:text-[#4a9eff] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Reply</button>
                <button onClick={() => setEditing(true)} className="text-[10px] text-[#555568] hover:text-[#4a9eff] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                <button onClick={() => onDelete(comment.id)} className="text-[10px] text-[#555568] hover:text-[#f87171] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l border-[#1e1e2e] pl-3">
          {replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              replies={[]}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CardComments({ cardId, boardId }: CardCommentsProps) {
  const [comments, setComments] = useState<CardComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await actions.getCardComments(cardId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const comment = await actions.createCardComment(cardId, boardId, newBody.trim(), replyingTo || undefined);
      setComments(prev => [...prev, comment]);
      setNewBody('');
      setReplyingTo(null);
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await actions.deleteCardComment(id);
    // Reload to reflect cascaded descendant deletions from DB
    load();
  };

  const handleEdit = async (id: string, body: string) => {
    await actions.updateCardComment(id, body);
    setComments(prev => prev.map(c => c.id === id ? { ...c, body, updated_at: new Date().toISOString() } : c));
  };

  // Build thread structure: top-level comments + their replies
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = comments.reduce<Record<string, CardComment[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  if (loading) {
    return <div className="text-[12px] text-[#555568] py-2 text-center">Loading comments...</div>;
  }

  if (loadError) {
    return (
      <div className="text-[12px] text-[#555568] py-2 text-center">
        Failed to load comments.{' '}
        <button onClick={load} className="text-[#4a9eff] hover:underline cursor-pointer">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {topLevel.length > 0 && (
        <div className="space-y-3 mb-3">
          {topLevel.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] || []}
              onReply={(parentId) => setReplyingTo(parentId)}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] text-[#4a9eff]">Replying to comment</span>
          <button onClick={() => setReplyingTo(null)} className="text-[10px] text-[#555568] hover:text-[#f87171] cursor-pointer">&times;</button>
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-2">
        <textarea
          value={newBody}
          onChange={e => setNewBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a comment... (Cmd+Enter to send)"
          className="flex-1 px-2.5 py-1.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded text-[12px] text-[#e8e8f0] outline-none focus:border-[#4a9eff] placeholder:text-[#555568] resize-y min-h-[36px]"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !newBody.trim()}
          className="px-2.5 py-1.5 rounded text-[11px] font-medium bg-[#4a9eff] text-white hover:bg-[#3b8be0] transition-all cursor-pointer disabled:opacity-50 self-end"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
