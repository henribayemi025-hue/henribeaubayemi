import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconPhoto, IconChecks, IconFlag, IconChevronLeft } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../../lib/supabase';
import { uid } from '../../lib/uid';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { getPublicProfile, sendDirectMessage, markDirectConversationRead, directErrorKey } from '../../lib/directMessages';
import { SmartImage } from '../../components/SmartImage';
import { ShopAvatar } from '../../components/ShopAvatar';
import { BlockButton } from '../../components/BlockButton';
import { ReportModal } from '../../components/ReportModal';
import { Skeleton, ErrorState } from '../../components/states';
import { clockTime } from '../../lib/format';

// Fil personne-à-personne — même look que le chat boutique (VendorChat),
// mais avec l'état "demande" en plus: tant que unlocked=false, seule
// l'initiatrice peut écrire, et une seule fois (voir send_direct_message,
// migration 0099). Pas de stickers/transfert/suggestions IA ici: ce sont
// des raffinements du chat commercial, pas le cœur de cette fonctionnalité.
export default function DirectChat() {
  const { conversationId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [conv, setConv] = useState(null);
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const scroller = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: c, error: cErr } = await supabase
        .from('direct_conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();
      if (cErr || !c) throw cErr || new Error('not found');
      const otherId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
      const [{ data: msgs }, profile] = await Promise.all([
        supabase.from('direct_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
        getPublicProfile(otherId),
      ]);
      setConv(c);
      setOther(profile);
      setMessages(msgs || []);
      await markDirectConversationRead(conversationId);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new]));
          if (payload.new.sender_id !== user?.id) markDirectConversationRead(conversationId).catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => m.map((x) => (x.id === payload.new.id ? { ...x, ...payload.new } : x)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const isInitiator = conv?.initiator_id === user?.id;
  const myPriorCount = messages.filter((m) => m.sender_id === user?.id).length;
  // Tant que ce n'est pas débloqué: l'initiatrice a droit à UN message et
  // attend; l'autre peut toujours répondre (sa réponse débloque tout).
  const requestLocked = conv && !conv.unlocked && isInitiator && myPriorCount >= 1;

  async function send(body, imageUrl = null) {
    const text = body?.trim();
    if (!text && !imageUrl) return;
    setSending(true);
    try {
      const msg = await sendDirectMessage(conversationId, text || null, imageUrl);
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      setConv((c) => (c ? { ...c, unlocked: c.unlocked || !isInitiator } : c));
      setInput('');
    } catch (e) {
      toast.error(t(directErrorKey(e)));
    } finally {
      setSending(false);
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${user.id}/${uid()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('chat').upload(path, file);
      if (upErr) throw upErr;
      await send(null, path);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col p-4">
        <Skeleton className="h-14 w-full" />
        <div className="mt-4 flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-2/3" />)}
        </div>
      </div>
    );
  }
  if (error || !conv) return <ErrorState onRetry={load} />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline bg-white px-3">
        {!isDesktop && (
          <button onClick={() => navigate(-1)} aria-label={t('common.back')} className="-ml-1 shrink-0 p-1 text-ink">
            <IconChevronLeft size={22} />
          </button>
        )}
        <Link to={`/profile/u/${other?.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
          <ShopAvatar
            src={other?.avatar_url ? storageThumbUrl('shops', other.avatar_url) : null}
            fallbackSrc={other?.avatar_url ? storageUrl('shops', other.avatar_url) : null}
            name={other?.name}
            seed={other?.id}
            className="h-9 w-9 shrink-0"
          />
          <span className="line-clamp-1 text-body font-semibold text-ink">{other?.name || '—'}</span>
        </Link>
        <BlockButton userId={other?.id} />
        <button onClick={() => setReportOpen(true)} aria-label={t('report.report')} className="p-1.5 text-muted">
          <IconFlag size={18} />
        </button>
      </header>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-caption text-muted">{t('chat.empty')}</p>
        )}
        {messages.map((m) => {
          const mine = !!user && m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 shadow-sm ${
                  mine ? 'rounded-2xl rounded-br-md bg-teal text-white' : 'rounded-2xl rounded-bl-md border border-hairline bg-white text-ink'
                }`}
              >
                {m.image_url && (
                  <SmartImage src={storageUrl('chat', m.image_url)} alt="" className="mb-1 h-40 w-40 rounded-input" />
                )}
                {m.body && <p className="whitespace-pre-wrap break-words text-body">{m.body}</p>}
                <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-white/75' : 'text-muted'}`}>
                  <span>{clockTime(m.created_at, i18n.language)}</span>
                  {mine && (m.status === 'read' ? <IconChecks size={13} className="text-brass" /> : <IconChecks size={13} />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {!conv.unlocked && (
        <div className="border-t border-hairline bg-base px-3 py-2 text-center text-caption text-muted">
          {isInitiator ? t('dm.requestPendingBanner') : t('dm.requestBanner', { name: other?.name })}
        </div>
      )}

      {requestLocked ? (
        <div className="shrink-0 border-t border-hairline bg-white p-4 text-center text-caption text-muted">
          {t('dm.requestSentBadge')}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex shrink-0 items-center gap-2 border-t border-hairline bg-white p-3"
        >
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted" aria-label={t('chat.attachImage')}>
            <IconPhoto size={24} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <input
            className="input flex-1"
            placeholder={t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t('chat.placeholder')}
          />
          <button
            type="submit"
            disabled={sending || uploading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]"
            aria-label={t('common.send')}
          >
            <IconSend2 size={20} />
          </button>
        </form>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={other?.id} />
    </div>
  );
}
