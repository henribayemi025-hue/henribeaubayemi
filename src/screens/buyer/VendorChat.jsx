import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconPhoto, IconCheck, IconChecks, IconAlertCircle, IconSparkles } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { Skeleton, ErrorState } from '../../components/states';
import { clockTime } from '../../lib/format';
import { pushNotify } from '../../lib/notify';
import { currencyForCountry, convertFromFcfa } from '../../lib/currency';
import { FinouAction } from '../../components/FinouAction';

// Mentioning @finouchou (or @finou) inside a buyer<->vendor chat pulls in the
// AI assistant. Its reply is shown inline, visually distinct, but is a LOCAL,
// ephemeral entry — NOT written to chat_messages. That table's sender_role
// check constraint only allows ('buyer','vendor') and RLS requires
// sender_id = auth.uid(), so a real "Finou" sender would need a schema/RLS
// change; showing it client-side only (same as the standalone Finou overlay,
// which is also session-only) gets the feature live with zero schema risk.
const FINOU_MENTION_RE = /@finou(chou)?\b/i;

export default function VendorChat({ vendor = false }) {
  const { conversationId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const role = vendor ? 'vendor' : 'buyer';

  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [finouThinking, setFinouThinking] = useState(false);
  const [finouError, setFinouError] = useState(false);
  const [finouRetryQuery, setFinouRetryQuery] = useState('');
  const scroller = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  // Live "@" mention suggestion (Twitter/Slack-style): while the trailing
  // token being typed is a prefix of "finouchou", offer a one-tap completion
  // instead of requiring the full word — also doubles as discoverability.
  const mentionMatch = input.match(/(?:^|\s)@(\w*)$/i);
  const showMentionSuggestion = !!mentionMatch && 'finouchou'.startsWith(mentionMatch[1].toLowerCase());

  function applyMentionSuggestion() {
    setInput((v) => v.replace(/@(\w*)$/i, '@finouchou '));
    inputRef.current?.focus();
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: conv, error: cErr } = await supabase
        .from('conversations')
        .select('id, buyer_id, shop_id, shops(name, slug, avatar_url, country)')
        .eq('id', conversationId)
        .maybeSingle();
      if (cErr || !conv) throw cErr || new Error('not found');
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMeta(conv);
      setMessages(msgs || []);
      // Clear this viewer's unread counter.
      await supabase
        .from('conversations')
        .update(vendor ? { vendor_unread: 0 } : { buyer_unread: 0 })
        .eq('id', conversationId);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId, vendor]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: append incoming messages.
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    // Anchor-based scroll is more reliable than scrollTop math when the
    // keyboard resizes the viewport (WhatsApp behaviour).
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, finouThinking]);

  async function askFinou(query) {
    setFinouError(false);
    setFinouThinking(true);
    try {
      // If the current user is viewing this thread as the vendor, give
      // Finou real sales numbers so it can answer business questions here
      // too (e.g. "@finouchou combien j'ai vendu cette semaine ?").
      let vendorStats;
      if (vendor && meta?.shop_id) {
        try {
          const currency = currencyForCountry(meta.shops?.country);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
          const { data: weekOrders } = await supabase.from('orders').select('total_fcfa').eq('shop_id', meta.shop_id).gte('created_at', weekAgo);
          const revenueFcfa = (weekOrders || []).reduce((s, o) => s + (o.total_fcfa || 0), 0);
          vendorStats = {
            currency,
            ordersThisWeek: weekOrders?.length || 0,
            revenueThisWeek: Math.round(convertFromFcfa(revenueFcfa, currency) * 100) / 100,
          };
        } catch {
          /* best-effort */
        }
      }
      const { data, error: fnErr } = await supabase.functions.invoke('finou-chat', {
        body: { message: query, context: { screen: 'chat', shop: meta?.shops?.name, ...(vendorStats ? { vendorStats } : {}) } },
      });
      if (fnErr || !data?.reply) throw fnErr || new Error('no reply');
      setMessages((m) => [
        ...m,
        { id: `finou-${Date.now()}`, isFinou: true, body: data.reply, category: data.category, action: data.action, created_at: new Date().toISOString() },
      ]);
    } catch {
      setFinouError(true);
      setFinouRetryQuery(query);
    } finally {
      setFinouThinking(false);
    }
  }

  async function deliver(payload, tempId) {
    try {
      const { data, error: sErr } = await supabase
        .from('chat_messages')
        .insert(payload)
        .select()
        .single();
      if (sErr) throw sErr;
      setMessages((m) => m.map((x) => (x.id === tempId ? data : x)));
      // Notify the other participant.
      const otherId = vendor ? meta.buyer_id : null;
      if (vendor && otherId) pushNotify({ user_id: otherId, title: t('notifications.newMessage'), body: payload.body || '📷', url: `/chat/${conversationId}` });
      if (!vendor) {
        const { data: ownerRow } = await supabase.from('shops').select('owner_id').eq('id', meta.shop_id).maybeSingle();
        if (ownerRow?.owner_id) pushNotify({ user_id: ownerRow.owner_id, title: t('notifications.newMessage'), body: payload.body || '📷', url: `/vendor/messages/${conversationId}` });
      }
    } catch {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, failed: true } : x)));
    }
  }

  async function send(body, imageUrl = null) {
    const text = body?.trim();
    if (!text && !imageUrl) return;
    const tempId = `temp-${Date.now()}`;
    const payload = { conversation_id: conversationId, sender_id: user.id, sender_role: role, body: text || null, image_url: imageUrl };
    setMessages((m) => [...m, { ...payload, id: tempId, created_at: new Date().toISOString() }]);
    setInput('');
    await deliver(payload, tempId);
  }

  function retryMessage(msg) {
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, failed: false } : x)));
    deliver({ conversation_id: conversationId, sender_id: user.id, sender_role: role, body: msg.body, image_url: msg.image_url }, msg.id);
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('chat').upload(path, file);
      if (upErr) throw upErr;
      await send(null, path);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const shop = meta?.shops;

  return (
    <div className="flex h-full flex-col">
      <AppHeader title={shop?.name || t('nav.messages')} back />
      {loading ? (
        <div className="flex-1 space-y-3 p-4">
          <Skeleton className="ml-auto h-10 w-1/2" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="ml-auto h-10 w-1/3" />
        </div>
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <>
          <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4 pb-2">
            <div className="mx-auto mb-3 max-w-xs rounded-card border border-hairline p-3 text-center">
              <SmartImage src={shop?.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null} fallbackSrc={shop?.avatar_url ? storageUrl('shops', shop.avatar_url) : null} alt={shop?.name} className="mx-auto h-12 w-12" rounded="rounded-full" />
              <p className="mt-2 text-caption text-muted">{t('chat.chattingWith', { name: shop?.name || '' })}</p>
              <p className="mt-1 text-[11px] text-muted">{t('chat.finouHint')}</p>
            </div>
            {messages.length === 0 && <p className="py-4 text-center text-caption text-muted">{t('chat.empty')}</p>}
            {messages.map((m) => {
              if (m.isFinou) {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl border border-teal/30 bg-teal/5 px-3 py-2">
                      <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-teal">
                        <IconSparkles size={12} /> Finou Chou
                      </p>
                      <p className="whitespace-pre-wrap text-body text-ink">{m.body}</p>
                      {m.category && (
                        <Link
                          to={`/category/${m.category}`}
                          className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
                        >
                          {t('finou.seeCategory', { cat: t(`categories.${m.category}`) })}
                        </Link>
                      )}
                      {m.action && <FinouAction action={m.action} />}
                    </div>
                  </div>
                );
              }
              // WhatsApp rule: my messages (by user id) on the right, everyone
              // else on the left — unambiguous on both buyer and vendor sides.
              // Guard against `user` being momentarily null (auth state can
              // flip mid-render on token refresh) so a render never throws.
              const mine = !!user && m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-[#F4EFE6]' : 'border border-hairline bg-white'}`}>
                    {m.image_url && <SmartImage src={storageUrl('chat', m.image_url)} alt="" className="mb-1 h-40 w-40 rounded-input" />}
                    {m.body && <p className="whitespace-pre-wrap text-body text-ink">{m.body}</p>}
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted">
                      <span>{clockTime(m.created_at, i18n.language)}</span>
                      {mine && !m.failed && (m.id.toString().startsWith('temp') ? <IconCheck size={13} /> : <IconChecks size={13} className="text-teal" />)}
                      {m.failed && (
                        <button onClick={() => retryMessage(m)} className="flex items-center gap-0.5 text-danger" aria-label={t('chat.sendFailed')}>
                          <IconAlertCircle size={14} /> {t('common.retry')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {finouThinking && (
              <div className="flex justify-start" aria-label={t('finou.typing')}>
                <div className="flex items-center gap-1 rounded-2xl border border-teal/30 bg-teal/5 px-3 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {finouError && (
              <div className="flex flex-col items-center gap-1 py-1 text-center">
                <p className="text-caption text-danger">{t('finou.unavailable')}</p>
                <button onClick={() => askFinou(finouRetryQuery)} className="btn-ghost text-caption">
                  {t('common.retry')}
                </button>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {showMentionSuggestion && (
            <div className="border-t border-hairline bg-white px-3 pt-2">
              <button
                type="button"
                onClick={applyMentionSuggestion}
                className="inline-flex items-center gap-1.5 rounded-pill border border-teal/40 bg-teal/5 px-3 py-1.5 text-caption font-semibold text-teal"
              >
                <IconSparkles size={14} /> @finouchou — {t('chat.finouSuggestionHint')}
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = input.trim();
              const mentioned = FINOU_MENTION_RE.test(text);
              send(text);
              if (mentioned) askFinou(text.replace(FINOU_MENTION_RE, '').trim() || text);
            }}
            className={`flex shrink-0 items-center gap-2 bg-white p-3 ${showMentionSuggestion ? '' : 'border-t border-hairline'}`}
          >
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted" aria-label={t('chat.attachImage')}>
              <IconPhoto size={24} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <input
              ref={inputRef}
              className="input flex-1"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={t('chat.placeholder')}
            />
            <button type="submit" disabled={!input.trim() && !uploading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]" aria-label={t('common.send')}>
              <IconSend2 size={20} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
