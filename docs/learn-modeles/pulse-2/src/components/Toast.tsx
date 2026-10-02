import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string;
  subMessage?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, subMessage, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0 opacity-100">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111625]/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 text-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
            {message}
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </p>
          {subMessage && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{subMessage}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
