import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface NewsletterSubscribeProps {
  id?: string;
}

export const NewsletterSubscribe: React.FC<NewsletterSubscribeProps> = ({ id = 'newsletter' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setErrorMessage('Veuillez renseigner une adresse email valide.');
      return;
    }

    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 600);
  };

  return (
    <section id={id} className="relative my-16">
      {/* Background radial glow */}
      <div 
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full bg-orange-500/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 sm:p-12 overflow-hidden shadow-2xl">
          {/* Subtle neon gradient border line on top */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Édition Matinale Quotidienne</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Ne manquez plus aucun saut quantique en <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Intelligence Artificielle</span>
            </h2>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
              Chaque matin à 7h00 : 3 repos décryptés, 1 prompt prêt à l'emploi et une synthèse des papiers de recherche essentiels. Zéro spam, pure valeur technique.
            </p>

            {status === 'success' ? (
              <div className="mt-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <h4 className="text-base font-bold text-white">Vous êtes inscrit à Finjaro Pulse !</h4>
                <p className="text-xs text-zinc-300">
                  Votre première édition matinale sera distribuée demain à 7h00. Surveillez votre boîte de réception.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-xs text-emerald-400 underline hover:text-emerald-300"
                >
                  Inscrire une autre adresse
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="nom.prenom@entreprise.com"
                      className="w-full rounded-xl bg-black/60 border border-white/10 py-3 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/60 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-950 transition-all hover:bg-orange-400 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.35)] shrink-0 disabled:opacity-50"
                  >
                    <span>{status === 'loading' ? 'Validation...' : 'S\'abonner'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
                )}

                <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                    Données chiffrées & RGPD
                  </span>
                  <span>·</span>
                  <span>Désinscription en 1 clic</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
