import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconX, IconSend2, IconSparkles, IconRefresh, IconPhoto, IconChevronRight } from '@tabler/icons-react';
import { supabase, storageUrl } from '../lib/supabase';
import { fileToDataUrl } from '../lib/image';
import { useUI } from '../hooks/useUI';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { SmartImage } from './SmartImage';
import { Price } from './Price';
import { FinouAction } from './FinouAction';
import { MirrorModal } from './MirrorModal';
import { FinouProductWizard } from './FinouProductWizard';
import { MIRROR_CATEGORIES } from '../lib/categories';
import { loadHome } from '../lib/homeCache';

// Real numbers for the vendor's sales, so Finou can answer "combien j'ai
// vendu cette semaine ?" instead of saying it has no access. Best-effort —
// a failure here should never block the chat.
async function fetchVendorSnapshot(shopId) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: weekOrders }, { data: monthOrders }] = await Promise.all([
    supabase.from('orders').select('total_fcfa').eq('shop_id', shopId).gte('created_at', weekAgo),
    supabase.from('orders').select('total_fcfa').eq('shop_id', shopId).gte('created_at', monthAgo),
  ]);
  const sum = (rows) => (rows || []).reduce((s, o) => s + (o.total_fcfa || 0), 0);
  return {
    ordersThisWeek: weekOrders?.length || 0,
    revenueThisWeekFcfa: sum(weekOrders),
    ordersThisMonth: monthOrders?.length || 0,
    revenueThisMonthFcfa: sum(monthOrders),
  };
}

// Floating AI assistant overlay (text + vision), wired to the finou-chat function.
export function FinouChou() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { finouOpen, closeFinou } = useUI();
  const { shop, status: vendorStatus } = useVendorStatus();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [mirrorProduct, setMirrorProduct] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const scroller = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (finouOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: t('finou.greeting') }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finouOpen]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, wizardOpen]);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPendingImage(await fileToDataUrl(file));
    } catch {
      /* ignore unreadable image */
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function send(text, image) {
    const content = (text ?? input).trim();
    const img = image !== undefined ? image : pendingImage;
    if ((!content && !img) || sending) return;
    setError(false);
    setInput('');
    setPendingImage(null);
    // History BEFORE appending this turn — gives Gemini real conversational
    // memory (previously only the current message was ever sent).
    const history = messages
      .filter((m) => m.text)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: content, image: img }]);
    setSending(true);
    try {
      // Real sales numbers for an approved vendor, so Finou can answer
      // business questions instead of claiming it has no access.
      let vendorStats;
      if (vendorStatus === 'approved' && shop) {
        try {
          vendorStats = await fetchVendorSnapshot(shop.id);
        } catch {
          /* best-effort */
        }
      }
      const { data, error: fnErr } = await supabase.functions.invoke('finou-chat', {
        body: {
          message: content,
          image: img || undefined,
          history,
          context: { screen: location.pathname, ...(vendorStats ? { vendorStats } : {}) },
        },
      });
      if (fnErr || !data?.reply) throw fnErr || new Error('no reply');
      const mid = Date.now();
      setMessages((m) => [...m, { id: mid, role: 'assistant', text: data.reply, category: data.category, action: data.action }]);
      // Visual search: if Finou identified a category, surface real, buyable
      // products from the marketplace as a carousel under the reply.
      if (data.category) {
        try {
          const { data: prods } = await supabase
            .from('products')
            .select('id, name, price_fcfa, images, category, stock, shop_id, shops(name)')
            .eq('is_active', true)
            .eq('category', data.category)
            .order('views', { ascending: false })
            .limit(10);
          const products = (prods || []).map((p) => ({ ...p, shop_name: p.shops?.name }));
          if (products.length) setMessages((m) => m.map((x) => (x.id === mid ? { ...x, products } : x)));
        } catch {
          /* best-effort: the reply already stands on its own */
        }
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  function retryLast() {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    send(last?.text || '', last?.image || null);
  }

  function goCategory(cat) {
    closeFinou();
    navigate(`/category/${cat}`);
  }

  function openProduct(id) {
    closeFinou();
    navigate(`/product/${id}`);
  }

  if (!finouOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
      style={{ paddingBottom: 'var(--kb, 0px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('finou.title')}
    >
      <button className="absolute inset-0 bg-black/40" aria-label={t('common.close')} onClick={closeFinou} />
      <div
        className="relative z-10 flex h-[85vh] w-full max-w-app flex-col rounded-t-2xl bg-white sm:h-[70vh] sm:rounded-2xl"
        style={{ maxHeight: 'var(--app-height, 100dvh)' }}
      >
        <div className="flex items-center gap-2 border-b border-hairline p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white">
            <IconSparkles size={20} />
          </span>
          <div className="flex-1">
            <p className="text-body font-semibold text-ink">{t('finou.title')}</p>
            <p className="text-caption text-muted">{t('finou.subtitle')}</p>
          </div>
          <button onClick={closeFinou} aria-label={t('common.close')} className="rounded-full p-1 text-muted hover:bg-hairline">
            <IconX size={22} />
          </button>
        </div>

        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={m.id || i}>
              <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-body ${
                    m.role === 'user' ? 'bg-[#E6F0F0] text-ink' : 'border border-hairline bg-white text-ink'
                  }`}
                >
                  {m.image && <img src={m.image} alt="" className="mb-1 max-h-40 rounded-input object-cover" />}
                  {m.text}
                  {/* No products found → keep the category shortcut as a fallback. */}
                  {m.category && !m.products?.length && (
                    <button
                      onClick={() => goCategory(m.category)}
                      className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
                    >
                      {t('finou.seeCategory', { cat: t(`categories.${m.category}`) })}
                    </button>
                  )}
                  {m.action && (
                    <FinouAction
                      action={m.action}
                      onNavigate={closeFinou}
                      onStartWizard={m.action === 'sell' ? () => setWizardOpen(true) : undefined}
                    />
                  )}
                </div>
              </div>

              {/* Visual-search results: a tappable product carousel. */}
              {m.products?.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {m.products.map((p) => (
                    <div key={p.id} className="w-28 shrink-0">
                      <button onClick={() => openProduct(p.id)} className="block w-full text-left transition active:scale-95">
                        <SmartImage
                          src={p.images?.[0] ? storageUrl('products', p.images[0]) : null}
                          alt={p.name}
                          className="aspect-square w-full"
                          rounded="rounded-input"
                        />
                        <p className="mt-1 line-clamp-1 text-caption text-ink">{p.name}</p>
                        <Price fcfa={p.price_fcfa} className="text-caption font-semibold text-teal" />
                      </button>
                      {MIRROR_CATEGORIES.includes(p.category) && (
                        <button
                          onClick={() => setMirrorProduct(p)}
                          className="mt-1 flex w-full items-center justify-center gap-1 rounded-pill border border-brass/50 bg-brass/5 py-1 text-[11px] font-semibold text-brass"
                        >
                          <IconSparkles size={11} /> {t('mirror.tryOnButton')}
                        </button>
                      )}
                    </div>
                  ))}
                  {m.category && (
                    <button
                      onClick={() => goCategory(m.category)}
                      className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-input border border-dashed border-hairline text-caption font-semibold text-teal"
                    >
                      <IconChevronRight size={20} />
                      {t('finou.seeMore')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {wizardOpen && (
            <FinouProductWizard
              onClose={() => setWizardOpen(false)}
              onPublished={() => {
                setWizardOpen(false);
                setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text: t('finouWizard.publishedMessage') }]);
                // Refresh Home's cache right away so if the vendor checks
                // Home next, the new product is already there instead of
                // waiting for the natural stale-while-revalidate cycle.
                loadHome().catch(() => {});
              }}
            />
          )}
          {sending && (
            <div className="flex justify-start" aria-label={t('finou.typing')}>
              <div className="flex gap-1 rounded-2xl border border-hairline px-3 py-3">
                <Dot /><Dot delay="150ms" /><Dot delay="300ms" />
              </div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <p className="text-caption text-danger">{t('finou.unavailable')}</p>
              <button onClick={retryLast} className="btn-ghost">
                <IconRefresh size={16} /> {t('common.retry')}
              </button>
            </div>
          )}
        </div>

        {pendingImage && (
          <div className="flex items-center gap-2 border-t border-hairline px-3 pt-2">
            <div className="relative">
              <img src={pendingImage} alt="" className="h-14 w-14 rounded-input object-cover" />
              <button
                onClick={() => setPendingImage(null)}
                aria-label={t('common.delete')}
                className="absolute -right-1 -top-1 rounded-full bg-black/60 p-0.5 text-white"
              >
                <IconX size={13} />
              </button>
            </div>
            <span className="text-caption text-muted">{t('finou.imageReady')}</span>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-hairline p-3"
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={t('finou.attach')}
            className="shrink-0 text-muted hover:text-teal"
          >
            <IconPhoto size={24} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <input
            className="input flex-1"
            placeholder={t('finou.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t('finou.placeholder')}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !pendingImage) || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-white disabled:bg-hairline disabled:text-[#A0A0A0]"
            aria-label={t('common.send')}
          >
            <IconSend2 size={20} />
          </button>
        </form>
      </div>

      {mirrorProduct && (
        <MirrorModal open={!!mirrorProduct} onClose={() => setMirrorProduct(null)} product={mirrorProduct} />
      )}
    </div>
  );
}

function Dot({ delay = '0ms' }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: delay }} />;
}
