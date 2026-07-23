import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconX, IconSend2, IconSparkles, IconRefresh, IconPhoto } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useUI } from '../hooks/useUI';

// Downscale + JPEG-encode an image to a small data URL (keeps the payload light
// on 3G and within Gemini's inline-image limits).
function fileToDataUrl(file, maxDim = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Floating AI assistant overlay (text + vision), wired to the finou-chat function.
export function FinouChou() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { finouOpen, closeFinou } = useUI();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
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
  }, [messages, sending]);

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
    setMessages((m) => [...m, { role: 'user', text: content, image: img }]);
    setSending(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('finou-chat', {
        body: { message: content, image: img || undefined, context: { screen: location.pathname } },
      });
      if (fnErr || !data?.reply) throw fnErr || new Error('no reply');
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, category: data.category }]);
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
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-body ${
                  m.role === 'user' ? 'bg-[#E6F0F0] text-ink' : 'border border-hairline bg-white text-ink'
                }`}
              >
                {m.image && <img src={m.image} alt="" className="mb-1 max-h-40 rounded-input object-cover" />}
                {m.text}
                {m.category && (
                  <button
                    onClick={() => goCategory(m.category)}
                    className="mt-2 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-1 text-caption font-semibold text-white"
                  >
                    {t('finou.seeCategory', { cat: t(`categories.${m.category}`) })}
                  </button>
                )}
              </div>
            </div>
          ))}
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
    </div>
  );
}

function Dot({ delay = '0ms' }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: delay }} />;
}
