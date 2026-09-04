import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSend, IconUsers, IconBuildingStore, IconShoppingBag, IconAlertTriangle } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/Button';
import { Field, TextInput, TextArea } from '../../components/Field';

// Écrire à tout le monde d'un coup.
//
// Le bandeau d'annonce (AdminContent) ne touche que les personnes qui
// ouvrent l'app d'elles-mêmes — c'est-à-dire celles dont on n'a pas besoin
// de se rappeler. Ceci fait l'inverse: la notification part vers le
// téléphone et la boîte mail, y compris chez quelqu'un qui n'est pas revenu
// depuis trois semaines.
//
// Le message part par les quatre canaux d'un coup (push navigateur, push
// natif Android et iOS, e-mail). Les personnes ayant coupé les e-mails sont
// écartées automatiquement côté serveur — rien à cocher ici.
const CIBLES = [
  { key: 'all', Icon: IconUsers },
  { key: 'vendors', Icon: IconBuildingStore },
  { key: 'buyers', Icon: IconShoppingBag },
];

export default function AdminAnnonce() {
  const { t } = useTranslation();
  const toast = useToast();
  const [cible, setCible] = useState('all');
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');
  const [lien, setLien] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirme, setConfirme] = useState(false);

  // Le nombre de destinataires est affiché AVANT l'envoi. Un envoi collectif
  // ne se rattrape pas: savoir qu'on s'adresse à 3 personnes ou à 300 change
  // la façon d'écrire, et évite de découvrir l'ampleur après coup.
  const { data: compte } = useAsync(async () => {
    const [{ data: profils }, { data: boutiques }] = await Promise.all([
      supabase.from('profiles').select('id'),
      supabase.from('shops').select('owner_id').not('owner_id', 'is', null),
    ]);
    const proprietaires = new Set((boutiques || []).map((s) => s.owner_id));
    const tous = (profils || []).length;
    return { all: tous, vendors: proprietaires.size, buyers: tous - proprietaires.size };
  }, []);

  const destinataires = compte?.[cible] ?? null;

  async function envoyer() {
    if (!titre.trim() || !texte.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        audience: cible,
        title: titre.trim(),
        body: texte.trim(),
        url: lien.trim() || '/',
        tag: `annonce-${Date.now()}`,
      },
    });
    setBusy(false);
    setConfirme(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(data.error);
    toast.success(
      t('admin.annonceEnvoyee', {
        push: (data?.push ?? 0) + (data?.native ?? 0),
        email: data?.email ?? 0,
      }),
    );
    setTitre('');
    setTexte('');
    setLien('');
  }

  const pret = titre.trim().length > 0 && texte.trim().length > 0;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-card border border-hairline p-3">
        <p className="text-caption font-semibold text-muted">{t('admin.annonceCible')}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CIBLES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => { setCible(c.key); setConfirme(false); }}
              className={`flex flex-col items-center gap-1 rounded-card border p-2.5 transition ${
                cible === c.key ? 'border-brass bg-brass/10 text-brass' : 'border-hairline text-muted'
              }`}
            >
              <c.Icon size={19} />
              <span className="text-[11px] font-semibold">{t(`admin.annonceCibles.${c.key}`)}</span>
              {compte && <span className="text-[11px]">{compte[c.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      <Field label={t('admin.annonceTitre')}>
        <TextInput
          value={titre}
          onChange={(e) => { setTitre(e.target.value); setConfirme(false); }}
          maxLength={80}
          placeholder={t('admin.annonceTitrePlaceholder')}
        />
      </Field>

      <Field label={t('admin.annonceTexte')}>
        <TextArea
          rows={4}
          value={texte}
          onChange={(e) => { setTexte(e.target.value); setConfirme(false); }}
          maxLength={300}
          placeholder={t('admin.annonceTextePlaceholder')}
        />
      </Field>

      <Field label={t('admin.annonceLien')} hint={t('admin.annonceLienHint')}>
        <TextInput value={lien} onChange={(e) => setLien(e.target.value)} placeholder="/" />
      </Field>

      {/* Deux temps délibérés: un envoi collectif ne se rappelle pas, et le
          second écran redit à combien de personnes il part. */}
      {!confirme ? (
        <Button className="w-full" disabled={!pret} onClick={() => setConfirme(true)}>
          <IconSend size={17} /> {t('admin.annonceContinuer')}
        </Button>
      ) : (
        <div className="space-y-2 rounded-card border border-brass/40 bg-brass/10 p-3">
          <p className="flex items-start gap-2 text-caption font-semibold text-brass">
            <IconAlertTriangle size={17} className="mt-0.5 shrink-0" />
            {destinataires != null
              ? t('admin.annonceConfirme', { count: destinataires })
              : t('admin.annonceConfirmeSansNombre')}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => setConfirme(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="flex-1" disabled={busy} onClick={envoyer}>
              <IconSend size={17} /> {busy ? t('admin.annonceEnvoi') : t('admin.annonceEnvoyer')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
