import React from 'react';
import { X, Check, Eye, Type, Contrast } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { accessibility, updateAccessibility, t, theme, language } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
          theme === 'noir'
            ? 'border-slate-800 bg-[#0E131F] text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold">{t.accessibility.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 py-4">
          {/* Dyslexic Font */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{t.accessibility.dyslexicFont}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.accessibility.dyslexicDesc}
              </p>
            </div>
            <button
              onClick={() => updateAccessibility({ dyslexicFont: !accessibility.dyslexicFont })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                accessibility.dyslexicFont ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  accessibility.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <Contrast className="h-4 w-4 mt-0.5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold">{t.accessibility.highContrast}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.accessibility.highContrastDesc}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateAccessibility({ highContrast: !accessibility.highContrast })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                accessibility.highContrast ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  accessibility.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Text Size */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Type className="h-4 w-4 text-orange-500" />
              <label className="text-sm font-semibold">{t.accessibility.textSize}</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateAccessibility({ textSize: size })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    accessibility.textSize === size
                      ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={size === 'normal' ? 'text-xs' : size === 'large' ? 'text-sm' : 'text-base font-bold'}>
                    Aa
                  </span>
                  <span className="mt-1 text-[10px]">
                    {size === 'normal'
                      ? t.accessibility.normal
                      : size === 'large'
                      ? t.accessibility.large
                      : t.accessibility.xlarge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview snippet */}
          <div
            className={`rounded-xl border p-3 text-xs ${
              theme === 'noir' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {language === 'fr' ? 'Aperçu du texte :' : 'Text preview:'}
            </p>
            <p>
              {language === 'fr'
                ? 'Finjaro Learn : Apprendre à coder et maîtriser l\'IA par la pratique dès la première minute.'
                : 'Finjaro Learn: Learn to code and master AI through real practice from minute one.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() =>
              updateAccessibility({
                dyslexicFont: false,
                highContrast: false,
                textSize: 'normal',
              })
            }
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {t.accessibility.reset}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500"
          >
            <Check className="h-4 w-4" />
            <span>{t.accessibility.close}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
