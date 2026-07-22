import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconMessageCircle } from '@tabler/icons-react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { timeAgo } from '../lib/format';

// Comments on a reel, shown in a bottom-sheet (not a DM). Public read; posting
// requires login. Optimistically appends and bumps the local count via onAdded.
export function ReelCommentsSheet({ open, onClose, reelId, onAdded }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { requireLogin } = useUI();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reel_comments')
      .select('id, body, created_at, user_id, profiles!reel_comments_profile_fk(name)')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  }, [reelId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!user) {
      onClose();
      requireLogin();
      return;
    }
    setSending(true);
    const { data, error } = await supabase
      .from('reel_comments')
      .insert({ reel_id: reelId, user_id: user.id, body })
      .select('id, body, created_at, user_id, profiles!reel_comments_profile_fk(name)')
      .single();
    setSending(false);
    if (error) return;
    setComments((c) => [data, ...c]);
    setText('');
    onAdded?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={t('reel.commentsTitle')}>
      <div className="flex max-h-[60vh] min-h-[40vh] flex-col">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
              <IconMessageCircle size={36} stroke={1.5} />
              <p className="text-caption">{t('reel.noComments')}</p>
            </div>
          ) : (
            <ul className="space-y-3 py-2">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-caption font-semibold text-teal">
                    {(c.profiles?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted">
                      <span className="font-semibold text-ink">{c.profiles?.name || t('profile.guest')}</span>
                      {' · '}
                      {timeAgo(c.created_at, i18n.language)}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-body text-ink">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-2 flex items-center gap-2 border-t border-hairline pt-3">
          <input
            className="input flex-1"
            placeholder={t('reel.commentPlaceholder')}
            aria-label={t('reel.commentPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label={t('reel.postComment')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]"
          >
            <IconSend2 size={20} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
