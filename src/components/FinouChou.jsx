import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconX, IconSend2, IconSparkles, IconRefresh } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';
import { useUI } from '../hooks/useUI';

// Floating AI assistant overlay, wired to the finou-chat edge function.
export function FinouChou() {
  const { t } = useTranslation();
  const { finouOpen, closeFinou } = useUI();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    if (finouOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: t('finou.greeting') }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finouOpen]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setError(false);
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: content }]);
    setSending(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('finou-chat', {
        body: { message: content, context: { screen: location.pathname } },
      });
      if (fnErr || !data?.reply) throw fnErr || new Error('no reply');
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (!finouOpen) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[95] flex items-end justify-center sm:items-center"
      style={{ height: 'var(--app-height, 100dvh)' }}
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
                {m.text}
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
              <button onClick={() => send(messages.filter((m) => m.role === 'user').at(-1)?.text)} className="btn-ghost">
                <IconRefresh size={16} /> {t('common.retry')}
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t border-hairline p-3"
        >
          <input
            className="input flex-1"
            placeholder={t('finou.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t('finou.placeholder')}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
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
