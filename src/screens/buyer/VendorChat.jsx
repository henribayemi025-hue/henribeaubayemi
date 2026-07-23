import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconPhoto, IconCheck, IconChecks, IconAlertCircle } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../../components/AppHeader';
import { SmartImage } from '../../components/SmartImage';
import { Skeleton, ErrorState } from '../../components/states';
import { clockTime } from '../../lib/format';
import { pushNotify } from '../../lib/notify';

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
  const scroller = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: conv, error: cErr } = await supabase
        .from('conversations')
        .select('id, buyer_id, shop_id, shops(name, slug, avatar_url)')
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
  }, [messages]);

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
              <SmartImage src={shop?.avatar_url ? storageUrl('shops', shop.avatar_url) : null} alt={shop?.name} className="mx-auto h-12 w-12" rounded="rounded-full" />
              <p className="mt-2 text-caption text-muted">{t('chat.chattingWith', { name: shop?.name || '' })}</p>
            </div>
            {messages.length === 0 && <p className="py-4 text-center text-caption text-muted">{t('chat.empty')}</p>}
            {messages.map((m) => {
              // WhatsApp rule: my messages (by user id) on the right, everyone
              // else on the left — unambiguous on both buyer and vendor sides.
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-[#E6F0F0]' : 'border border-hairline bg-white'}`}>
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
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex shrink-0 items-center gap-2 border-t border-hairline bg-white p-3"
          >
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-muted" aria-label={t('chat.attachImage')}>
              <IconPhoto size={24} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <input className="input flex-1" placeholder={t('chat.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} aria-label={t('chat.placeholder')} />
            <button type="submit" disabled={!input.trim() && !uploading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]" aria-label={t('common.send')}>
              <IconSend2 size={20} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
