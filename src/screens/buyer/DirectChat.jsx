import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconPhoto, IconChecks, IconFlag, IconChevronLeft, IconMicrophone, IconTrash, IconArrowBackUp, IconCopy } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl } from '../../lib/supabase';
import { uid } from '../../lib/uid';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { getPublicProfile, sendDirectMessage, markDirectConversationRead, hideDirectConversation, directErrorKey } from '../../lib/directMessages';
import { SmartImage } from '../../components/SmartImage';
import { ShopAvatar } from '../../components/ShopAvatar';
import { ReportModal } from '../../components/ReportModal';
import { ChatHeaderMenu } from '../../components/chat/ChatHeaderMenu';
import { ActionSheet } from '../../components/chat/ActionSheet';
import { MessageGesture } from '../../components/chat/MessageGesture';
import { QuotedMessage } from '../../components/chat/QuotedMessage';
import { VoiceMessage } from '../../components/chat/VoiceMessage';
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
  // Gestes façon WhatsApp: appui long = feuille d'actions, glissement =
  // répondre en citant.
  const [actionMsg, setActionMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const scroller = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordCancelledRef = useRef(false);
  const recordSecondsRef = useRef(0);
  const [otherTyping, setOtherTyping] = useState(false);
  const dmChannelRef = useRef(null);
  const typingHideTimer = useRef(null);
  const typingSentAt = useRef(0);

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
          if (payload.new.sender_id !== user?.id) {
            markDirectConversationRead(conversationId).catch(() => {});
            setOtherTyping(false);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => m.map((x) => (x.id === payload.new.id ? { ...x, ...payload.new } : x)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => m.filter((x) => x.id !== payload.old?.id));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === user?.id) return;
        setOtherTyping(true);
        clearTimeout(typingHideTimer.current);
        typingHideTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();
    dmChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      clearTimeout(typingHideTimer.current);
      setOtherTyping(false);
    };
  }, [conversationId, user?.id]);

  function notifyTyping() {
    const now = Date.now();
    if (now - typingSentAt.current < 2000) return;
    typingSentAt.current = now;
    dmChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user?.id } });
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const isInitiator = conv?.initiator_id === user?.id;
  const myPriorCount = messages.filter((m) => m.sender_id === user?.id).length;
  // Tant que ce n'est pas débloqué: l'initiatrice a droit à UN message et
  // attend; l'autre peut toujours répondre (sa réponse débloque tout).
  const requestLocked = conv && !conv.unlocked && isInitiator && myPriorCount >= 1;

  async function send(body, imageUrl = null, audioUrl = null, audioSeconds = null) {
    const text = body?.trim();
    if (!text && !imageUrl && !audioUrl) return;
    setSending(true);
    try {
      const msg = await sendDirectMessage(conversationId, text || null, imageUrl, audioUrl, replyTo?.id || null, audioSeconds);
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      setConv((c) => (c ? { ...c, unlocked: c.unlocked || !isInitiator } : c));
      setInput('');
      setReplyTo(null);
    } catch (e) {
      toast.error(t(directErrorKey(e)));
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(msg) {
    const avant = messages;
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    const { error: dErr } = await supabase.from('direct_messages').delete().eq('id', msg.id);
    if (dErr) {
      setMessages(avant);
      toast.error(dErr.message || t('errors.generic'));
    }
  }

  async function copyMessage(msg) {
    try {
      await navigator.clipboard.writeText(msg.body || '');
      toast.success(t('chat.copied'));
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  async function deleteConversation() {
    try {
      await hideDirectConversation(conversationId);
      navigate('/profile/messages', { replace: true });
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    }
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      recordCancelledRef.current = false;
      recorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        clearInterval(recordTimerRef.current);
        const duree = recordSecondsRef.current;
        const cancelled = recordCancelledRef.current || duree < 1;
        setRecording(false);
        setRecordSeconds(0);
        if (cancelled || audioChunksRef.current.length === 0) return;
        const ext = (recorder.mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setUploading(true);
        try {
          const path = `${user.id}/${uid()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('chat').upload(path, blob, { contentType: recorder.mimeType || 'audio/webm' });
          if (upErr) throw upErr;
          await send(null, null, path, duree);
        } catch (e) {
          toast.error(e.message || t('errors.generic'));
        } finally {
          setUploading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      recordTimerRef.current = setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(recordSecondsRef.current);
      }, 1000);
    } catch {
      toast.error(t('chat.micDenied'));
    }
  }

  function stopRecording(cancel = false) {
    recordCancelledRef.current = cancel;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
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
        {/* Signaler / Bloquer / Supprimer derrière un seul ⋮, comme WhatsApp. */}
        <ChatHeaderMenu
          userId={other?.id}
          onReport={() => setReportOpen(true)}
          onDelete={deleteConversation}
        />
      </header>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-caption text-muted">{t('chat.empty')}</p>
        )}
        {messages.map((m) => {
          const mine = !!user && m.sender_id === user.id;
          const cite = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <MessageGesture
                onLongPress={() => setActionMsg(m)}
                onReply={() => setReplyTo(m)}
              >
                <div
                  className={`max-w-[80%] select-none px-3.5 py-2.5 shadow-sm ${
                    mine ? 'rounded-2xl rounded-br-md bg-teal text-white' : 'rounded-2xl rounded-bl-md border border-hairline bg-white text-ink'
                  }`}
                >
                  {m.reply_to_id && (
                    <div className="mb-1.5">
                      <QuotedMessage
                        message={cite}
                        mine={mine}
                        t={t}
                        auteur={cite ? (!!user && cite.sender_id === user.id ? t('chat.you') : other?.name || '') : ''}
                        onClick={cite ? () => {
                          document.getElementById(`msg-${cite.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } : null}
                      />
                    </div>
                  )}
                  {m.image_url && (
                    <SmartImage src={storageUrl('chat', m.image_url)} alt="" className="mb-1 h-40 w-40 rounded-input" />
                  )}
                  {m.audio_url && (
                    <VoiceMessage src={storageUrl('chat', m.audio_url)} seconds={m.audio_seconds} mine={mine} />
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words text-body">{m.body}</p>}
                  <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-white/75' : 'text-muted'}`}>
                    <span>{clockTime(m.created_at, i18n.language)}</span>
                    {mine && (m.status === 'read' ? <span className="font-semibold text-brass">{t('chat.seen')}</span> : <IconChecks size={13} />)}
                  </div>
                </div>
              </MessageGesture>
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-start" aria-label={t('chat.typing')}>
            <div className="flex items-center gap-1 rounded-2xl border border-hairline bg-white px-3 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!conv.unlocked && (
        <div className="border-t border-hairline bg-base px-3 py-2 text-center text-caption text-muted">
          {isInitiator ? t('dm.requestPendingBanner') : t('dm.requestBanner', { name: other?.name })}
        </div>
      )}

      {replyTo && !requestLocked && (
        <div className="border-t border-hairline bg-white px-3 pt-2">
          <QuotedMessage
            message={replyTo}
            t={t}
            auteur={!!user && replyTo.sender_id === user.id ? t('chat.you') : other?.name || ''}
            onClose={() => setReplyTo(null)}
          />
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
          {recording ? (
            <div className="flex flex-1 items-center gap-2 rounded-input bg-base px-3 py-2.5">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-danger" />
              <span className="flex-1 text-body text-ink">
                {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')} — {t('chat.recordingHint')}
              </span>
              <button type="button" onClick={() => stopRecording(true)} className="shrink-0 text-danger" aria-label={t('common.cancel')}>
                <IconTrash size={20} />
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted" aria-label={t('chat.attachImage')}>
                <IconPhoto size={24} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <input
                className="input flex-1"
                placeholder={t('chat.placeholder')}
                value={input}
                onChange={(e) => { setInput(e.target.value); notifyTyping(); }}
                aria-label={t('chat.placeholder')}
              />
            </>
          )}
          {!input.trim() ? (
            // Le bouton reste le MÊME élément pendant tout l'appui (capture
            // de pointeur): le retirer du DOM au premier changement d'état
            // empêchait le relâchement d'être détecté, et l'enregistrement
            // restait bloqué indéfiniment.
            <button
              type="button"
              disabled={sending || uploading}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startRecording(); }}
              onPointerUp={() => stopRecording(false)}
              onPointerCancel={() => stopRecording(true)}
              onContextMenu={(e) => e.preventDefault()}
              className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-white disabled:bg-hairline disabled:text-[#A0A0A0] ${
                recording ? 'bg-danger' : 'bg-teal'
              }`}
              aria-label={t('chat.holdToRecord')}
            >
              <IconMicrophone size={20} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={sending || uploading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]"
              aria-label={t('common.send')}
            >
              <IconSend2 size={20} />
            </button>
          )}
        </form>
      )}

      <ActionSheet
        open={!!actionMsg}
        onClose={() => setActionMsg(null)}
        actions={[
          { key: 'reply', icon: IconArrowBackUp, label: t('chat.reply'), onClick: () => setReplyTo(actionMsg) },
          actionMsg?.body && { key: 'copy', icon: IconCopy, label: t('chat.copy'), onClick: () => copyMessage(actionMsg) },
          !!user && actionMsg?.sender_id === user.id && {
            key: 'delete',
            icon: IconTrash,
            label: t('chat.deleteMessage'),
            danger: true,
            onClick: () => deleteMessage(actionMsg),
          },
          !!user && actionMsg?.sender_id !== user.id && {
            key: 'report',
            icon: IconFlag,
            label: t('report.report'),
            onClick: () => setReportOpen(true),
          },
        ]}
      />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={other?.id} />
    </div>
  );
}
