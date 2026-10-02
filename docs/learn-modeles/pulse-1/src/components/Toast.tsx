import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-orange-500/30 px-4 py-3 text-xs text-white shadow-[0_0_30px_rgba(249,115,22,0.25)] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-zinc-500 hover:text-white transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
