import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSend2, IconPhoto, IconCheck, IconChecks, IconAlertCircle, IconSparkles, IconChevronLeft, IconBrandWhatsapp, IconPhone, IconFlag, IconX as IconClose, IconArrowForward, IconArrowBackUp, IconCopy, IconMoodSmile, IconMicrophone, IconTrash } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { track } from '../../lib/track';
import { uid } from '../../lib/uid';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { SmartImage } from '../../components/SmartImage';
import { ReportModal } from '../../components/ReportModal';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { ChatHeaderMenu } from '../../components/chat/ChatHeaderMenu';
import { ActionSheet } from '../../components/chat/ActionSheet';
import { MessageGesture } from '../../components/chat/MessageGesture';
import { QuotedMessage } from '../../components/chat/QuotedMessage';
import { VoiceMessage } from '../../components/chat/VoiceMessage';
import { ChatImage } from '../../components/chat/ChatImage';
import { StoryViewer } from '../../components/StoryViewer';
import { useShopStories } from '../../hooks/useShopStories';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { MessagesShell } from './Inbox';
import { Skeleton, ErrorState } from '../../components/states';
import { clockTime } from '../../lib/format';
import { currencyForCountry, convertFromFcfa } from '../../lib/currency';
import { estPremium } from '../../lib/premium';
import { FinouAction } from '../../components/FinouAction';

// Mentioning @finouchou (or @finou) inside a buyer<->vendor chat pulls in the
// AI assistant. Its reply is shown inline, visually distinct, but is a LOCAL,
// ephemeral entry — NOT written to chat_messages. That table's sender_role
// check constraint only allows ('buyer','vendor') and RLS requires
// sender_id = auth.uid(), so a real "Finou" sender would need a schema/RLS
// change; showing it client-side only (same as the standalone Finou overlay,
// which is also session-only) gets the feature live with zero schema risk.
const FINOU_MENTION_RE = /@finou(chou)?\b/i;

// Stickers: pas d'illustrations à fabriquer (aucune image « article » de
// toute façon, voir CLAUDE.md §3), un emoji envoyé seul EST déjà le sticker
// que WhatsApp affiche en grand sans bulle — même effet, zéro asset.
const STICKERS = ['😀', '😂', '😍', '🥰', '😢', '😮', '👍', '🙏', '👏', '🔥', '❤️', '🎉', '💯', '😅', '🤝', '✅', '❌', '⏰'];

// Un message "sticker" = uniquement un ou deux emoji, rien d'autre — pour
// l'afficher en grand sans bulle, comme WhatsApp. Un texte normal qui
// contient un emoji au milieu d'une phrase reste un message normal.
function isStickerBody(body) {
  if (!body) return false;
  return /^(\p{Extended_Pictographic}️?‍?){1,2}$/u.test(body.trim());
}

export default function VendorChat({ vendor = false }) {
  const { conversationId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const role = vendor ? 'vendor' : 'buyer';

  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  // Conversation bloquee (dans un sens ou dans l'autre): la zone de saisie
  // laisse la place a un rappel. Sans ca, on taperait un message que la
  // base refuserait ensuite, sans que personne comprenne pourquoi.
  const [blocked, setBlocked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // Beau, en testant: taper une photo envoyée ne faisait rien — elle
  // restait coincée dans sa petite bulle. Plein écran au tap, comme
  // n'importe quelle appli de messagerie.
  const [viewerUrl, setViewerUrl] = useState(null);
  // Gestes façon WhatsApp sur une bulle: appui long = feuille d'actions,
  // glissement latéral = répondre en citant.
  const [actionMsg, setActionMsg] = useState(null);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  // Transférer un message vers une autre de mes conversations, comme WhatsApp.
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSending, setForwardSending] = useState(null);
  // Finia Premium: suggestions de réponse toutes faites pour le dernier
  // message client — elle choisit, édite ou tape la sienne, rien ne part
  // sans qu'elle appuie sur Envoyer (contrairement à l'agent auto-réponse).
  const [replySuggestions, setReplySuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  // Message vocal — Beau: « tu peux pas aussi mettre les vocaux ? ».
  // Appui maintenu façon WhatsApp: on enregistre tant que le doigt reste
  // posé, on envoie au relâchement, on annule si le doigt sort du bouton.
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordCancelledRef = useRef(false);
  const recordSecondsRef = useRef(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const { stories: shopStories } = useShopStories(!vendor ? meta?.shop_id : null);
  const [finouThinking, setFinouThinking] = useState(false);
  const [finouError, setFinouError] = useState(false);
  const [finouRetryQuery, setFinouRetryQuery] = useState('');
  const scroller = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  // « Il n'y a pas le truc typing quand quelqu'un écrit » — indicateur
  // éphémère (broadcast Realtime, jamais écrit en base): personne ne doit
  // pouvoir consulter après coup qui était en train de taper quoi.
  const [otherTyping, setOtherTyping] = useState(false);
  const chatChannelRef = useRef(null);
  const typingHideTimer = useRef(null);
  const typingSentAt = useRef(0);

  // Live "@" mention suggestion (Twitter/Slack-style): while the trailing
  // token being typed is a prefix of "finouchou", offer a one-tap completion
  // instead of requiring the full word — also doubles as discoverability.
  const mentionMatch = input.match(/(?:^|\s)@(\w*)$/i);
  const showMentionSuggestion = !!mentionMatch && 'finouchou'.startsWith(mentionMatch[1].toLowerCase());

  function applyMentionSuggestion() {
    setInput((v) => v.replace(/@(\w*)$/i, '@finouchou '));
    inputRef.current?.focus();
  }

  // Accusé de lecture: tout message de l'autre partie encore marqué
  // "delivered" passe à "read" — l'expéditeur voit son "Vu" apparaître via
  // l'écoute realtime. Appelé à l'ouverture ET à chaque message reçu.
  const markAsRead = useCallback(async () => {
    if (!user?.id || document.visibilityState === 'hidden') return;
    await supabase
      .from('chat_messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .neq('status', 'read');
  }, [conversationId, user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: conv, error: cErr } = await supabase
        .from('conversations')
        .select('id, buyer_id, shop_id, shops(name, slug, avatar_url, country, is_verified, whatsapp, phone, premium_until)')
        .eq('id', conversationId)
        .maybeSingle();
      if (cErr || !conv) throw cErr || new Error('not found');
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMeta(conv);
      // "Supprimé pour moi": masqué uniquement de mon côté, l'autre partie
      // le voit toujours normalement.
      setMessages((msgs || []).filter((m) => !(vendor ? m.vendor_deleted : m.buyer_deleted)));
      // Clear this viewer's unread counter.
      await supabase
        .from('conversations')
        .update(vendor ? { vendor_unread: 0 } : { buyer_unread: 0 })
        .eq('id', conversationId);
      await markAsRead();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [conversationId, vendor, user?.id, markAsRead]);

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
          if (payload.new.sender_id !== user?.id) {
            setOtherTyping(false);
            // LE bug du "Vu": le passage en "lu" ne se faisait qu'au montage
            // de l'écran. Quand les deux personnes discutent en direct, le
            // chat est DÉJÀ ouvert: les messages qui arrivaient ensuite ne
            // repassaient donc jamais en "lu", et l'expéditeur restait sur
            // les coches à vie. C'est exactement ce que Beau a constaté en
            // testant à deux (ses messages: tous "delivered" en base).
            markAsRead();
          }
        }
      )
      .on(
        // Un message supprimé chez l'autre doit disparaître ici aussi.
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((m) => m.filter((x) => x.id !== payload.old?.id));
        }
      )
      .on(
        // Accusé de lecture: quand l'autre partie lit, son statut passe à
        // 'read' côté base — on répercute ça dans les coches en direct.
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          // "Supprimé pour moi" par l'autre partie sur SES messages ne me
          // concerne pas; par moi, ailleurs (autre onglet), doit disparaître
          // ici aussi. Dans les deux cas: uniquement MON côté du drapeau.
          if (vendor ? payload.new.vendor_deleted : payload.new.buyer_deleted) {
            setMessages((m) => m.filter((x) => x.id !== payload.new.id));
            return;
          }
          setMessages((m) => m.map((x) => (x.id === payload.new.id ? { ...x, ...payload.new } : x)));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === user?.id) return;
        setOtherTyping(true);
        clearTimeout(typingHideTimer.current);
        typingHideTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();
    chatChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      clearTimeout(typingHideTimer.current);
      setOtherTyping(false);
    };
  }, [conversationId, user?.id, markAsRead]);

  // Diffuse "j'écris" au fil de la frappe — jamais plus d'une fois toutes
  // les 2s, et rien de tout ça n'est jamais écrit en base.
  function notifyTyping() {
    const now = Date.now();
    if (now - typingSentAt.current < 2000) return;
    typingSentAt.current = now;
    chatChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user?.id } });
  }

  useEffect(() => {
    // Anchor-based scroll is more reliable than scrollTop math when the
    // keyboard resizes the viewport (WhatsApp behaviour).
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, finouThinking]);

  // Des suggestions valables pour "le dernier message" deviennent fausses
  // dès qu'un nouveau message arrive (réponse envoyée, ou la cliente qui
  // relance) — on les efface plutôt que de laisser un choix périmé affiché.
  useEffect(() => {
    setReplySuggestions(null);
  }, [messages.length]);

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
      // La notification (push+e-mail) part desormais du SERVEUR, sur
      // l'insertion du message (trigger trg_chat_message) — fiable meme si
      // ce navigateur se ferme juste apres l'envoi.
    } catch {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, failed: true } : x)));
    }
  }

  async function send(body, imageUrl = null, audioUrl = null, audioSeconds = null) {
    const text = body?.trim();
    if (!text && !imageUrl && !audioUrl) return;
    const tempId = `temp-${Date.now()}`;
    const payload = {
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: role,
      body: text || null,
      image_url: imageUrl,
      audio_url: audioUrl,
      audio_seconds: audioSeconds,
      reply_to_id: replyTo?.id || null,
    };
    setMessages((m) => [...m, { ...payload, id: tempId, created_at: new Date().toISOString() }]);
    setInput('');
    setReplyTo(null);
    await deliver(payload, tempId);
  }

  function retryMessage(msg) {
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, failed: false } : x)));
    deliver({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: role,
      body: msg.body,
      image_url: msg.image_url,
      audio_url: msg.audio_url,
      audio_seconds: msg.audio_seconds ?? null,
      reply_to_id: msg.reply_to_id || null,
    }, msg.id);
  }

  // Beau: « quand tu supprimes, tu supprimes pour toi ou pour plusieurs ? Il
  // doit y avoir supprimer pour moi et supprimer pour tous ». Comme
  // WhatsApp: "pour moi" le masque juste de mon côté (tout le monde peut le
  // faire, sur n'importe quel message); "pour tout le monde" efface
  // vraiment le contenu, mais seulement sur SES PROPRES messages — l'autre
  // partie voit alors "message supprimé" à la place, jamais un trou muet.
  async function deleteMessageForMe(msg) {
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    const { error: dErr } = await supabase.rpc('delete_chat_message_for_me', { p_message_id: msg.id });
    if (dErr) toast.error(dErr.message || t('errors.generic'));
  }

  async function deleteMessageForEveryone(msg) {
    const avant = messages;
    const tombe = { ...msg, body: null, image_url: null, audio_url: null, audio_seconds: null, deleted_at: new Date().toISOString() };
    setMessages((m) => m.map((x) => (x.id === msg.id ? tombe : x)));
    const { error: dErr } = await supabase.rpc('delete_chat_message_for_everyone', { p_message_id: msg.id });
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

  async function fetchSuggestions() {
    setSuggestLoading(true);
    setReplySuggestions(null);
    try {
      const { data, error: sErr } = await supabase.functions.invoke('vendor-copilot', {
        body: { mode: 'suggest_replies', conversationId, lang: i18n.language },
      });
      if (sErr) throw sErr;
      setReplySuggestions(data?.suggestions || []);
    } catch {
      toast.error(t('errors.generic'));
      setReplySuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }

  async function openForward(msg) {
    setForwardMsg(msg);
    setForwardLoading(true);
    try {
      // Mes propres fils, hors celui-ci: on ne transfère que vers une
      // conversation où je suis déjà la même partie (acheteuse ou boutique) —
      // exactement ce que la policy RLS d'insertion autorise.
      let query = supabase
        .from('conversations')
        .select('id, shop_id, buyer_id, last_message, shops(name, avatar_url, is_verified)')
        .neq('id', conversationId)
        .order('last_message_at', { ascending: false })
        .limit(30);
      query = vendor ? query.eq('shop_id', meta?.shop_id) : query.eq('buyer_id', user.id);
      const { data } = await query;
      setForwardTargets(data || []);
    } finally {
      setForwardLoading(false);
    }
  }

  async function sendForward(targetConversationId) {
    if (!forwardMsg || forwardSending) return;
    setForwardSending(targetConversationId);
    try {
      const { error: fErr } = await supabase.from('chat_messages').insert({
        conversation_id: targetConversationId,
        sender_id: user.id,
        sender_role: role,
        body: forwardMsg.body || null,
        image_url: forwardMsg.image_url || null,
        audio_url: forwardMsg.audio_url || null,
      });
      if (fErr) throw fErr;
      toast.success(t('chat.forwarded'));
      setForwardMsg(null);
    } catch (e) {
      toast.error(e?.message || t('errors.generic'));
    } finally {
      setForwardSending(null);
    }
  }

  async function deleteConversation() {
    const { error: dErr } = await supabase
      .from('conversations')
      .update(vendor ? { vendor_hidden: true } : { buyer_hidden: true })
      .eq('id', conversationId);
    if (dErr) {
      toast.error(dErr.message || t('errors.generic'));
      return;
    }
    navigate(vendor ? '/vendor/messages' : '/inbox', { replace: true });
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
          // La durée mesurée ici est la SEULE fiable: le fichier WebM produit
          // par le navigateur n'en contient aucune (voir VoiceMessage).
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
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const shop = meta?.shops;
  // Numéros nettoyés une seule fois: un WhatsApp saisi « +237 6 12 34 56 78 »
  // doit devenir un lien wa.me valide, pas une URL avec des espaces.
  const waNumber = shop?.whatsapp?.replace(/[^\d]/g, '');
  const telNumber = shop?.phone?.replace(/[^+\d]/g, '');

  const thread = (
    <div className="flex h-full min-h-0 flex-col">
      {/* En-tête de conversation: identité + contacts rapides. Les boutons
          WhatsApp/Téléphone n'apparaissent QUE si la boutique a réellement
          renseigné le canal — jamais un bouton qui ne mène nulle part. */}
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-hairline bg-white px-3">
        {/* Sur ordinateur la liste est juste à gauche: pas besoin de retour. */}
        {!isDesktop && (
          <button onClick={() => navigate(-1)} aria-label={t('common.back')} className="-ml-1 shrink-0 p-1 text-ink">
            <IconChevronLeft size={22} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* Beau: « dans le chat tu peux voir direct le story d'une
              boutique, comme dans WhatsApp ». L'avatar seul ouvre le
              lecteur de stories s'il y en a une en cours; sinon (ou côté
              vendeuse, qui verrait toujours SA propre boutique ici) il mène
              à la fiche boutique comme avant. */}
          <button
            type="button"
            onClick={() => {
              if (!vendor && shopStories.length > 0) setStoryOpen(true);
              else navigate(shop?.slug ? `/boutique/${shop.slug}` : '#');
            }}
            className="shrink-0"
            aria-label={!vendor && shopStories.length > 0 ? t('shop.viewStory') : t('chat.viewShop')}
          >
            <ShopAvatar
              src={shop?.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null}
              fallbackSrc={shop?.avatar_url ? storageUrl('shops', shop.avatar_url) : null}
              name={shop?.name}
              seed={meta?.shop_id}
              className={`h-9 w-9 shrink-0 ${!vendor && shopStories.length > 0 ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : ''}`}
            />
          </button>
          <Link to={shop?.slug ? `/boutique/${shop.slug}` : '#'} className="min-w-0 flex-1">
            <span className="flex items-center gap-1">
              <span className="line-clamp-1 text-body font-semibold text-ink">{shop?.name || t('nav.messages')}</span>
              {shop?.is_verified && <VerifiedBadge size={14} />}
            </span>
            <span className="block text-[11px] text-muted">{t('chat.viewShop')}</span>
          </Link>
        </div>
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            onClick={() => meta?.shop_id && track('whatsapp_click', meta.shop_id, { source: 'chat_header', conversation_id: conversationId })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-bg text-success"
          >
            <IconBrandWhatsapp size={19} />
          </a>
        )}
        {telNumber && (
          <a
            href={`tel:${telNumber}`}
            aria-label={t('shop.call')}
            onClick={() => meta?.shop_id && track('phone_click', meta.shop_id, { source: 'chat_header', conversation_id: conversationId })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal"
          >
            <IconPhone size={18} />
          </a>
        )}
        {/* Signaler, Bloquer (règle 1.2 de l'App Store) et Supprimer la
            conversation vivent maintenant derrière un seul ⋮ — Beau: « en
            haut il y a delete, signaler, bloquer alors que ça devait être
            sur un truc ». */}
        <ChatHeaderMenu
          shopId={vendor ? null : meta?.shop_id}
          userId={vendor ? meta?.buyer_id : null}
          onBlockChange={setBlocked}
          onReport={() => setReportOpen(true)}
          onDelete={deleteConversation}
        />
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType={vendor ? 'user' : 'shop'}
          targetId={vendor ? meta?.buyer_id : meta?.shop_id}
        />
      </header>
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
              <ShopAvatar src={shop?.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null} fallbackSrc={shop?.avatar_url ? storageUrl('shops', shop.avatar_url) : null} name={shop?.name} seed={shop?.id} className="mx-auto h-12 w-12" />
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
                        <IconSparkles size={12} /> Finia
                      </p>
                      <p className="whitespace-pre-wrap break-words text-body text-ink">{m.body}</p>
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
              const canForward = !m.failed && (m.body || m.image_url || m.audio_url);
              const cite = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
              // Sticker: un emoji seul s'affiche en grand SANS bulle, comme
              // WhatsApp — un vrai texte garde sa bulle normale.
              const sticker = !m.image_url && isStickerBody(m.body);
              const bubble = (
                // Mes messages en terracotta plein (texte blanc), ceux d'en
                // face en carte blanche: la conversation se lit d'un coup
                // d'œil sans avoir à repérer de quel côté est la bulle.
                <div
                  className={
                    sticker
                      ? 'max-w-full px-1 select-none'
                      : `max-w-full select-none px-3.5 py-2.5 shadow-sm ${
                          mine
                            ? 'rounded-2xl rounded-br-md bg-teal text-white'
                            : 'rounded-2xl rounded-bl-md border border-hairline bg-white text-ink'
                        }`
                  }
                >
                  {m.auto_reply && (
                    <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${mine ? 'text-white/85' : 'text-teal'}`}>
                      <IconSparkles size={12} /> {t('chat.autoReplyBadge')}
                    </p>
                  )}
                  {m.reply_to_id && (
                    <div className="mb-1.5">
                      <QuotedMessage
                        message={cite}
                        mine={mine}
                        t={t}
                        auteur={
                          cite
                            ? (!!user && cite.sender_id === user.id ? t('chat.you') : (vendor ? meta?.buyer_name || t('chat.theBuyer') : shop?.name || ''))
                            : ''
                        }
                        onClick={cite ? () => {
                          document.getElementById(`msg-${cite.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } : null}
                      />
                    </div>
                  )}
                  {m.deleted_at ? (
                    <p className={`flex items-center gap-1.5 text-body italic ${mine ? 'text-white/70' : 'text-muted'}`}>
                      <IconTrash size={14} /> {t('chat.messageDeleted')}
                    </p>
                  ) : (
                    <>
                      {m.image_url && (
                        <ChatImage
                          src={storageUrl('chat', m.image_url)}
                          onClick={() => setViewerUrl(storageUrl('chat', m.image_url))}
                        />
                      )}
                      {m.audio_url && (
                        <VoiceMessage src={storageUrl('chat', m.audio_url)} seconds={m.audio_seconds} mine={mine} />
                      )}
                      {m.body && (
                        sticker
                          ? <p className="text-[52px] leading-none">{m.body}</p>
                          : <p className="whitespace-pre-wrap break-words text-body">{m.body}</p>
                      )}
                    </>
                  )}
                  <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${sticker ? 'text-muted' : mine ? 'text-white/75' : 'text-muted'}`}>
                    <span>{clockTime(m.created_at, i18n.language)}</span>
                    {/* Beau: la coche dorée passait inaperçue — "au pire on
                        met Vu". Le mot est sans ambiguïté, la coche seule. */}
                    {mine && !m.failed && (
                      m.id.toString().startsWith('temp') ? (
                        <IconCheck size={13} />
                      ) : m.status === 'read' ? (
                        <span className="font-semibold text-brass">{t('chat.seen')}</span>
                      ) : (
                        <IconChecks size={13} />
                      )
                    )}
                    {m.failed && (
                      <button onClick={() => retryMessage(m)} className={`flex items-center gap-0.5 ${mine ? 'text-white' : 'text-danger'}`} aria-label={t('chat.sendFailed')}>
                        <IconAlertCircle size={14} /> {t('common.retry')}
                      </button>
                    )}
                  </div>
                </div>
              );
              // Plus de flèche "transférer" collée en permanence à chaque
              // bulle: Beau (« c'est pas propre, fais comme WhatsApp »).
              // Tout passe par les deux gestes — appui long pour le menu,
              // glissement pour répondre.
              return (
                <div key={m.id} id={`msg-${m.id}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <MessageGesture
                    className="max-w-[80%]"
                    disabled={!canForward}
                    onLongPress={() => setActionMsg(m)}
                    onReply={() => {
                      setReplyTo(m);
                      inputRef.current?.focus();
                    }}
                  >
                    {bubble}
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
          {vendor && !blocked && estPremium(shop) && messages.length > 0 && messages[messages.length - 1].sender_role === 'buyer' && (
            <div className="border-t border-hairline bg-white px-3 pt-2">
              {suggestLoading ? (
                <p className="pb-2 flex items-center gap-1.5 text-caption text-muted">
                  <IconSparkles size={14} className="animate-pulse text-teal" /> {t('chat.suggestLoading')}
                </p>
              ) : replySuggestions?.length > 0 ? (
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-2">
                  {replySuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setInput(s); setReplySuggestions([]); inputRef.current?.focus(); }}
                      className="shrink-0 rounded-pill border border-teal/40 bg-teal/5 px-3 py-1.5 text-left text-caption text-teal"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  className="mb-2 inline-flex items-center gap-1.5 rounded-pill border border-teal/40 bg-teal/5 px-3 py-1.5 text-caption font-semibold text-teal"
                >
                  <IconSparkles size={14} /> {t('chat.suggestReplies')}
                </button>
              )}
            </div>
          )}
          {stickerOpen && !blocked && (
            <div className="border-t border-hairline bg-white p-3">
              <div className="grid grid-cols-9 gap-1.5">
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { send(s); setStickerOpen(false); }}
                    className="flex h-9 items-center justify-center rounded-input text-[22px] transition-colors hover:bg-base"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Réponse en cours: l'extrait cité reste sous les yeux tant qu'on
              rédige, exactement comme WhatsApp. */}
          {replyTo && !blocked && (
            <div className="border-t border-hairline bg-white px-3 pt-2">
              <QuotedMessage
                message={replyTo}
                t={t}
                auteur={
                  !!user && replyTo.sender_id === user.id
                    ? t('chat.you')
                    : vendor
                      ? meta?.buyer_name || t('chat.theBuyer')
                      : shop?.name || ''
                }
                onClose={() => setReplyTo(null)}
              />
            </div>
          )}
          {blocked ? (
            <div className="shrink-0 border-t border-hairline bg-white p-4 text-center text-caption text-muted">
              {t('report.blockedNotice')}
            </div>
          ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = input.trim();
              const mentioned = FINOU_MENTION_RE.test(text);
              send(text);
              if (mentioned) askFinou(text.replace(FINOU_MENTION_RE, '').trim() || text);
            }}
            className={`flex shrink-0 items-center gap-2 bg-white p-3 ${showMentionSuggestion || stickerOpen || replyTo ? '' : 'border-t border-hairline'}`}
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
                <button type="button" onClick={() => setStickerOpen((v) => !v)} className={stickerOpen ? 'text-teal' : 'text-muted'} aria-label={t('chat.stickers')}>
                  <IconMoodSmile size={24} />
                </button>
                <input
                  ref={inputRef}
                  className="input flex-1"
                  placeholder={t('chat.placeholder')}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); notifyTyping(); }}
                  onFocus={() => setStickerOpen(false)}
                  aria-label={t('chat.placeholder')}
                />
              </>
            )}
            {!input.trim() ? (
              // Appui maintenu = enregistrer, relâcher = envoyer, glisser
              // hors du bouton = annuler — même geste que WhatsApp. Le
              // bouton reste le MÊME élément du début à la fin de l'appui
              // (capture de pointeur): le retirer du DOM pendant l'appui
              // empêchait le relâchement d'être détecté, et l'enregistrement
              // restait bloqué indéfiniment.
              <button
                type="button"
                disabled={uploading}
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
                disabled={!input.trim() && !uploading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]"
                aria-label={t('common.send')}
              >
                <IconSend2 size={20} />
              </button>
            )}
          </form>
          )}
        </>
      )}
      {viewerUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewerUrl(null)}
        >
          <button
            type="button"
            onClick={() => setViewerUrl(null)}
            aria-label={t('common.close')}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <IconClose size={22} />
          </button>
          <img src={viewerUrl} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      {/* Appui long sur une bulle: les actions de WhatsApp, dans l'ordre où
          il les propose. "Supprimer" n'apparaît que sur ses propres
          messages — la base refuserait de toute façon les autres. */}
      <ActionSheet
        open={!!actionMsg}
        onClose={() => setActionMsg(null)}
        actions={[
          {
            key: 'reply',
            icon: IconArrowBackUp,
            label: t('chat.reply'),
            onClick: () => { setReplyTo(actionMsg); inputRef.current?.focus(); },
          },
          {
            key: 'forward',
            icon: IconArrowForward,
            label: t('chat.forward'),
            onClick: () => openForward(actionMsg),
          },
          actionMsg?.body && {
            key: 'copy',
            icon: IconCopy,
            label: t('chat.copy'),
            onClick: () => copyMessage(actionMsg),
          },
          // "Pour moi": disponible sur n'importe quel message, n'importe
          // qui — WhatsApp le propose même sur les messages reçus.
          !actionMsg?.deleted_at && {
            key: 'delete_me',
            icon: IconTrash,
            label: t('chat.deleteForMe'),
            onClick: () => deleteMessageForMe(actionMsg),
          },
          // "Pour tout le monde": SEULEMENT ses propres messages — la base
          // refuserait de toute façon les autres.
          !!user && actionMsg?.sender_id === user.id && !actionMsg?.deleted_at && {
            key: 'delete_everyone',
            icon: IconTrash,
            label: t('chat.deleteForEveryone'),
            danger: true,
            onClick: () => setConfirmDeleteMsg(actionMsg),
          },
          !!user && actionMsg?.sender_id !== user.id && {
            key: 'report',
            icon: IconFlag,
            label: t('report.report'),
            onClick: () => setReportOpen(true),
          },
        ]}
      />
      <Modal open={!!confirmDeleteMsg} onClose={() => setConfirmDeleteMsg(null)} title={t('chat.deleteForEveryone')}>
        <div className="space-y-4">
          <p className="text-body text-muted">{t('chat.deleteForEveryoneConfirm')}</p>
          <Button
            onClick={() => { deleteMessageForEveryone(confirmDeleteMsg); setConfirmDeleteMsg(null); }}
            className="!bg-danger"
          >
            {t('chat.deleteForEveryone')}
          </Button>
        </div>
      </Modal>
      <Modal open={!!forwardMsg} onClose={() => setForwardMsg(null)} title={t('chat.forwardTo')}>
        {forwardLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : forwardTargets.length === 0 ? (
          <p className="py-6 text-center text-body text-muted">{t('chat.forwardNoTargets')}</p>
        ) : (
          <ul className="-mx-4 max-h-[50vh] overflow-y-auto">
            {forwardTargets.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={forwardSending === c.id}
                  onClick={() => sendForward(c.id)}
                  className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-colors hover:bg-base disabled:opacity-60"
                >
                  {vendor ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-light text-body font-semibold text-teal">
                      {t('chat.forwardBuyer')[0]}
                    </div>
                  ) : (
                    <ShopAvatar
                      src={c.shops?.avatar_url ? storageThumbUrl('shops', c.shops.avatar_url) : null}
                      fallbackSrc={c.shops?.avatar_url ? storageUrl('shops', c.shops.avatar_url) : null}
                      name={c.shops?.name}
                      seed={c.shop_id}
                      className="h-11 w-11"
                    />
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-1 text-body font-semibold text-ink">
                      <span className="line-clamp-1">{vendor ? t('chat.forwardBuyer') : c.shops?.name}</span>
                      {!vendor && c.shops?.is_verified && <VerifiedBadge size={13} />}
                    </span>
                    {c.last_message && <span className="line-clamp-1 block text-caption text-muted">{c.last_message}</span>}
                  </span>
                  {forwardSending === c.id && <span className="text-caption text-muted">{t('common.sending')}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
      {storyOpen && shopStories.length > 0 && (
        <StoryViewer
          stories={shopStories}
          shopName={shop?.name}
          shopAvatarSrc={shop?.avatar_url ? storageThumbUrl('shops', shop.avatar_url) : null}
          shopSeed={meta?.shop_id}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  );

  // Sur ordinateur, le fil s'affiche à côté de la liste des conversations
  // (deux panneaux). Sur mobile, une page à la fois, comme avant.
  if (isDesktop) {
    return (
      <MessagesShell vendor={vendor} activeId={conversationId}>
        {thread}
      </MessagesShell>
    );
  }
  return thread;
}
