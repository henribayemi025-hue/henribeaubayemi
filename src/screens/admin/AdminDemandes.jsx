import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconCheck, IconArchive, IconBrandWhatsapp, IconMail } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';

const ONGLETS = ['ouverte', 'traitee', 'close'];

// Ce que quelqu'un a cherché sans le trouver, avec de quoi le rappeler.
//
// La table existait depuis le 04/09 (migration 0069) et se remplissait
// correctement — mais AUCUN écran ne la lisait. Le formulaire promet
// « réponse sous 24 h » à une acheteuse qui laisse son numéro, et la demande
// tombait dans un tiroir que personne n'ouvrait: promesse intenable, et
// perdue précisément sur la personne qui voulait acheter.
//
// L'écran est donc bâti autour d'une seule action: JOINDRE la personne. Le
// contact est le plus gros élément de la carte, cliquable directement en
// WhatsApp ou en e-mail selon ce qu'elle a laissé — pas un texte à
// recopier à la main dans une autre application.
function lienContact(contact) {
  const c = String(contact || '').trim();
  if (c.includes('@')) return { href: `mailto:${c}`, Icon: IconMail };
  // Un contact qui n'est pas un e-mail est un numéro: on ne garde que les
  // chiffres pour wa.me, qui refuse espaces, tirets et « + ».
  const chiffres = c.replace(/\D/g, '');
  if (chiffres.length >= 8) return { href: `https://wa.me/${chiffres}`, Icon: IconBrandWhatsapp };
  return null;
}

export default function AdminDemandes() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [onglet, setOnglet] = useState('ouverte');
  const [busy, setBusy] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const { data: rows, error: err } = await supabase
      .from('demandes_acheteurs')
      .select('*, profils:profiles(name, phone)')
      .order('created_at', { ascending: false });
    if (err) throw err;
    return rows || [];
  }, []);

  async function marquer(demande, statut) {
    setBusy(demande.id);
    const { error: err } = await supabase
      .from('demandes_acheteurs')
      .update({ statut, traite_at: new Date().toISOString() })
      .eq('id', demande.id);
    setBusy(null);
    if (err) return toast.error(err.message);
    retry();
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  if (error) return <ErrorState onRetry={retry} />;

  const comptes = Object.fromEntries(ONGLETS.map((s) => [s, (data || []).filter((r) => r.statut === s).length]));
  const liste = (data || []).filter((r) => r.statut === onglet);

  return (
    <div className="space-y-3 p-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {ONGLETS.map((s) => (
          <button key={s} onClick={() => setOnglet(s)} className={`chip shrink-0 ${onglet === s ? 'chip-active' : 'text-ink'}`}>
            {t(`admin.demandeStatus.${s}`)}
            {comptes[s] > 0 && <span className="ml-1 font-semibold">({comptes[s]})</span>}
          </button>
        ))}
      </div>

      {liste.length === 0 ? (
        <EmptyState icon={IconSearch} title={t('admin.demandesEmpty')} />
      ) : (
        <ul className="space-y-3">
          {liste.map((d) => {
            const lien = lienContact(d.contact);
            return (
              <li key={d.id} className="rounded-card border border-hairline p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
                    <IconSearch size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold text-ink">« {d.recherche} »</p>
                    <p className="text-caption text-muted">
                      {d.profils?.name || t('admin.supportAnonymous')}
                      {' · '}
                      {t(`admin.demandeSource.${d.source}`)}
                      {' · '}
                      {timeAgo(d.created_at, i18n.language)}
                    </p>
                  </div>
                </div>

                {d.details && (
                  <p className="mt-2 whitespace-pre-wrap rounded-input bg-base p-2.5 text-caption text-ink">{d.details}</p>
                )}

                {/* Le contact, en gros et cliquable: c'est la seule chose à
                    faire de cette fiche. */}
                <div className="mt-2.5">
                  {lien ? (
                    <a
                      href={lien.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-input border border-teal/40 bg-teal-light/40 p-2.5 text-body font-semibold text-ink"
                    >
                      <lien.Icon size={19} className="shrink-0 text-teal" />
                      {d.contact}
                    </a>
                  ) : (
                    <p className="rounded-input bg-base p-2.5 text-body font-semibold text-ink">{d.contact}</p>
                  )}
                </div>

                {onglet === 'ouverte' && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="flex-1" disabled={busy === d.id} onClick={() => marquer(d, 'traitee')}>
                      <IconCheck size={17} /> {t('admin.demandeTraitee')}
                    </Button>
                    <Button variant="secondary" className="flex-1" disabled={busy === d.id} onClick={() => marquer(d, 'close')}>
                      <IconArchive size={17} /> {t('admin.demandeClose')}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
