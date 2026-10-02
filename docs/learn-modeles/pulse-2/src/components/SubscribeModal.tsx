import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  Zap, 
  ArrowRight 
} from 'lucide-react';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState({
    dailyBrief: true,
    weeklyDeepDive: true,
    promptAlerts: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      onSuccess(email);
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
        onClose();
      }, 1800);
    }, 800);
  };

  const togglePref = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0C101C] border border-white/[0.12] rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">
                Bienvenue dans Finjaro Pulse !
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                Un email de confirmation vient d&apos;être envoyé à <span className="text-cyan-300 font-mono">{email}</span>. Vous recevrez la prochaine édition dès demain matin.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="space-y-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-white font-display">
                  Rejoignez 24 500+ bâtisseurs IA
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Chaque matin à 08h00, recevez le condensé ultra-précis : 3 repos décryptés, 1 prompt d&apos;ingénierie prêt à l&apos;emploi et les tournants technologiques à ne pas manquer.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="pulse-email" className="block text-xs font-mono text-slate-300">
                    Votre adresse email professionnelle :
                  </label>
                  <div className="relative">
                    <input
                      id="pulse-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@entreprise.com"
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.12] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                {/* Subscriptions Options */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Vos préférences de réception :
                  </p>
                  
                  <div className="space-y-2">
                    <label 
                      onClick={() => togglePref('dailyBrief')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer text-xs"
                    >
                      <span className="flex items-center gap-2 text-slate-200">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Le Brief Quotidien (5 min de lecture)</span>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={preferences.dailyBrief} 
                        readOnly 
                        className="rounded accent-cyan-400" 
                      />
                    </label>

                    <label 
                      onClick={() => togglePref('weeklyDeepDive')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer text-xs"
                    >
                      <span className="flex items-center gap-2 text-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span>Le Deep Dive Hebdomadaire (Architecture & Code)</span>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={preferences.weeklyDeepDive} 
                        readOnly 
                        className="rounded accent-cyan-400" 
                      />
                    </label>

                    <label 
                      onClick={() => togglePref('promptAlerts')}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer text-xs"
                    >
                      <span className="flex items-center gap-2 text-slate-200">
                        <Bell className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Alertes Prompts Nouveaux Modèles</span>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={preferences.promptAlerts} 
                        readOnly 
                        className="rounded accent-cyan-400" 
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 hover:opacity-95 shadow-xl shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Inscription en cours...</span>
                  ) : (
                    <>
                      <span>S&apos;abonner gratuitement</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% gratuit · Zéro spam · Désinscription en 1 clic</span>
                </p>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
