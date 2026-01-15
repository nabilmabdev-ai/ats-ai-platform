'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

// --- Helper Icons & Components ---
const IconSend = () => <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
// --- End Helpers ---

interface User {
  id: string;
  fullName: string;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
}

export default function CommentSection({ applicationId }: { applicationId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/application/${applicationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []));
  }, [applicationId]);

  const { user } = useAuth();
  // Sync local state if needed or just use 'user' directly. 
  // For minimal refactor, we can set currentUser from user
  useEffect(() => {
    if (user) setCurrentUser(user);
    fetchComments();
  }, [user, applicationId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          applicationId,
          authorId: currentUser.id,
        }),
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="bg-[var(--color-soft-grey)]/30 p-4 rounded-lg h-full flex flex-col">
      <h3 className="font-bold text-gray-800 mb-4 px-2">
        💬 Team Discussion
      </h3>

      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-md bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                {c.author.fullName?.slice(0, 1) || 'U'}
              </div>
              <div className="relative bg-white p-3 rounded-lg shadow-[var(--shadow-xs)] w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-800">{c.author.fullName}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                <span className="absolute top-2 right-2 text-[10px] text-[var(--color-slate)]">{formatTimestamp(c.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={currentUser ? `Comment as ${currentUser.fullName}...` : 'Loading...'}
            className="input-base w-full pr-10"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="absolute bottom-2.5 right-2.5 text-gray-400 hover:text-primary disabled:hover:text-gray-400 disabled:opacity-50 p-1 rounded-full transition-colors"
          >
            <IconSend />
          </button>
        </div>
      </form>
    </div>
  );
}