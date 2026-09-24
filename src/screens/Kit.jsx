import { useTranslation } from 'react-i18next';
import {
  IconFileSpreadsheet,
  IconDownload,
  IconPrinter,
  IconExternalLink,
  IconLock,
  IconCheck,
} from '@tabler/icons-react';
import { AppHeader } from '../components/AppHeader';

// LE KIT GRATUIT « Tenir son stock et sa caisse » (Beau, 24/09 — idée tirée
// de docs/vestiaire/16-koban-kit-projet-crm.md).
//
// Trois règles tenues ici:
// - Le kit sert VRAIMENT, tout seul: un classeur qui calcule le stock, la
//   caisse et l'écart, et une page de méthode. Ce n'est pas une brochure.
// - UNE seule étape suivante: essayer Finjaro Accounting. Pas de deuxième
//   appel à l'action, pas de liste d'applications.
// - AUCUNE collecte: ni e-mail, ni compte, ni formulaire. On ne collecte rien
//   sans que Beau l'ait décidé.
//
// Les fichiers vivent dans public/kit/ (servis tels quels par Cloudflare).
// Le classeur est fabriqué par scripts/generer-kit-stock.mjs: le modifier
// là, jamais à la main.
//
// Ce qui est dit d'Accounting a été vérifié dans son dépôt le 24/09 (caisse
// + lecteur de codes-barres: src/lib/scanner.ts; reçu WhatsApp:
// components/Receipt.tsx; messages mobile money partagés: lib/momo.ts +
// pages/CatchUp.tsx; abonnements, dettes; « Gratuit pour démarrer »:
// pages/Auth.tsx; import des articles depuis ce classeur: lib/importers.ts).
// Avant d'ajouter une fonction à la liste, la vérifier au même endroit.
const ACCOUNTING_URL = 'https://accounting.finjaro.net';

const FICHIERS = {
  fr: { classeur: '/kit/stock-et-caisse.xlsx', guide: '/kit/guide.html' },
  en: { classeur: '/kit/stock-and-cash.xlsx', guide: '/kit/guide.en.html' },
};

const FEUILLES = ['articles', 'entrees', 'ventes', 'caisse', 'recap'];
const FONCTIONS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'];

export default function Kit() {
  const { t, i18n } = useTranslation();
  const langue = String(i18n.language || 'fr').startsWith('en') ? 'en' : 'fr';
  const autre = langue === 'en' ? 'fr' : 'en';
  const ici = FICHIERS[langue];
  const la = FICHIERS[autre];

  return (
    // Hors de BuyerLayout (comme À propos): la page porte sa propre zone
    // défilante, le document lui-même ne défile jamais (global.css).
    <div className="flex flex-col overflow-hidden" style={{ height: 'var(--app-height, 100dvh)', paddingTop: 'env(safe-area-inset-top)' }}>
      <AppHeader title={t('kit.title')} back />
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8">
          {/* L'en-tête: le cercle de laiton et le grand titre, la marque du
              style de Finjaro. */}
          <section className="text-center">
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-teal/10 text-teal ring-1 ring-brass/40">
              <IconFileSpreadsheet size={44} stroke={1.5} />
            </span>
            <span className="mt-6 inline-flex items-center gap-1 rounded-pill bg-brass/15 px-3 py-1 text-caption font-semibold text-ink">
              {t('kit.eyebrow')}
            </span>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-ink md:text-[36px]">
              {t('kit.heading')}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-body text-muted">{t('kit.lead')}</p>
            <p className="mx-auto mt-2 max-w-xl text-caption text-muted">{t('kit.forWho')}</p>
          </section>

          {/* Les deux téléchargements. */}
          <section className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div>
              <a href={ici.classeur} download className="btn-primary">
                <IconDownload size={18} /> {t('kit.downloadSheet')}
              </a>
              <p className="mt-1.5 text-center text-caption text-muted">{t('kit.sheetHint')}</p>
            </div>
            <div>
              <a href={ici.guide} target="_blank" rel="noopener" className="btn-secondary">
                <IconPrinter size={18} /> {t('kit.openGuide')}
              </a>
              <p className="mt-1.5 text-center text-caption text-muted">{t('kit.guideHint')}</p>
            </div>
          </section>
          <p className="mt-3 text-center text-caption text-muted">
            {t('kit.otherLang')}{' '}
            <a href={la.classeur} download className="font-semibold text-teal underline" hrefLang={autre}>{t('kit.otherSheet')}</a>
            {' · '}
            <a href={la.guide} target="_blank" rel="noopener" className="font-semibold text-teal underline" hrefLang={autre}>{t('kit.otherGuide')}</a>
          </p>

          <div className="mx-auto my-10 h-0 max-w-xl border-t-[3px] border-double border-brass" />

          {/* Ce qu'il y a dedans. */}
          <section>
            <h2 className="text-[22px] font-semibold leading-tight text-ink">{t('kit.insideTitle')}</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {FEUILLES.map((k, n) => (
                <li key={k} className="flex gap-3 rounded-card border border-hairline bg-white p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-caption font-semibold text-white">{n + 1}</span>
                  <span>
                    <span className="block text-body font-semibold text-ink">{t(`kit.sheets.${k}.name`)}</span>
                    <span className="block text-caption text-muted">{t(`kit.sheets.${k}.desc`)}</span>
                  </span>
                </li>
              ))}
              <li className="flex gap-3 rounded-card border border-brass/60 bg-teal-light p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass text-white"><IconPrinter size={16} /></span>
                <span>
                  <span className="block text-body font-semibold text-ink">{t('kit.sheets.guide.name')}</span>
                  <span className="block text-caption text-muted">{t('kit.sheets.guide.desc')}</span>
                </span>
              </li>
            </ol>
          </section>

          {/* Pour commencer, en trois gestes. */}
          <section className="mt-10">
            <h2 className="text-[22px] font-semibold leading-tight text-ink">{t('kit.howTitle')}</h2>
            <ol className="mt-4 space-y-3">
              {['how1', 'how2', 'how3'].map((k, n) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-brass text-caption font-semibold text-teal">{n + 1}</span>
                  <p className="text-body text-ink">{t(`kit.${k}`)}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 rounded-card bg-white p-3 text-caption text-muted">
              <IconLock size={16} className="mt-0.5 shrink-0 text-brass" /> {t('kit.privacy')}
            </p>
          </section>

          {/* UNE seule étape suivante. */}
          <section className="mt-10 rounded-card border-2 border-brass bg-white p-5 md:p-6">
            <p className="text-caption font-semibold uppercase tracking-wider text-teal">{t('kit.nextEyebrow')}</p>
            <h2 className="mt-1 text-[22px] font-semibold leading-tight text-ink">{t('kit.nextTitle')}</h2>
            <p className="mt-2 text-body text-muted">{t('kit.nextBody')}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {FONCTIONS.map((k) => (
                <li key={k} className="flex items-start gap-2 text-body text-ink">
                  <IconCheck size={18} className="mt-0.5 shrink-0 text-brass" /> {t(`kit.features.${k}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-caption text-muted">{t('kit.nextImport')}</p>
            <a href={ACCOUNTING_URL} target="_blank" rel="noopener" className="btn-primary mt-5 sm:max-w-xs">
              {t('kit.nextCta')} <IconExternalLink size={18} />
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
