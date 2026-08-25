import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPhotoPlus, IconSparkles, IconLoader2, IconTrash } from '@tabler/icons-react';
import { supabase, storageUrl } from '../../lib/supabase';
import { uid } from '../../lib/uid';
import { compressForUploadWithThumb } from '../../lib/image';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Field, TextInput, Select } from '../../components/Field';
import { CATEGORIES, categoryHeadFor } from '../../lib/categories';
import { currencyForCountry, toFcfa } from '../../lib/currency';

// Ajout en masse. Beau (04/08): il avait 72 photos d'articles DIFFÉRENTS et
// voulait tout verser d'un coup — la fiche article, elle, plafonne à 10 photos
// parce que ce sont 10 vues DU MÊME produit.
//
// Une photo = un article, et l'article part EN LIGNE.
//
// Ce chemin créait des brouillons, et lui seul: l'ajout à l'unité comme
// l'assistant de Finia publiaient déjà directement. Le résultat s'est vu en
// base: 40 articles finis — titre, prix, photo, rayon, stock, rien ne
// manquait — dormaient invisibles. Deux boutiques entières n'avaient AUCUN
// article en ligne alors que leurs vendeuses avaient tout rempli et se
// croyaient ouvertes; l'une d'elles depuis douze jours.
//
// Beau: « quand elle tape sa publie, ça part direct; le brouillon devient une
// option si elle veut ». C'est le bon sens: personne ne remplit vingt fiches
// pour les garder cachées. Celle qui veut relire coche la case.

// Envoyer 72 fichiers simultanément fait tomber les connexions mobiles et
// sature le navigateur. Quatre à la fois, c'est le compromis: assez pour que
// ce soit rapide, assez peu pour que ça n'échoue pas.
const UPLOAD_POOL = 4;
// Google plafonne son IA à une quinzaine d'appels PAR MINUTE sur l'offre
// gratuite. En envoyant deux à la fois sans pause on tournait à ~30/min:
// Google refusait la majorité et l'écran ne remplissait rien (constaté le
// 04/08). Une seule photo à la fois, espacée de ~4 s, tient la cadence.
// C'est plus lent — environ 5 minutes pour 77 photos — mais ça aboutit,
// et la progression est affichée pendant ce temps.
const AI_POOL = 1;
// Ramené de 4 s à 1,5 s: la réflexion du modèle étant désormais coupée, les
// réponses reviennent en 2-3 s au lieu de 10-15, donc la cadence reste sous le
// plafond de Google tout en divisant l'attente par deux (Beau, 04/08: une
// minute pour 3 photos).
const AI_SPACING_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPool(items, size, worker) {
  const queue = [...items.entries()];
  const runners = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) {
      const [index, item] = queue.shift();
      await worker(item, index);
    }
  });
  await Promise.all(runners);
}

export default function VendorProductsBulk() {
  const { shop } = useOutletContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const shopCurrency = currencyForCountry(shop?.country);

  // Le travail en cours SURVIT à la fermeture de l'application.
  //
  // Les lignes ne vivaient qu'à l'écran. Quitter l'onglet, recevoir un appel,
  // laisser le téléphone se verrouiller — et tout disparaissait: les photos
  // restaient sur le serveur, mais les noms et les prix déjà tapés étaient
  // perdus, et on revenait devant un écran vide.
  //
  // Constaté en direct le 25/08: un vendeur envoie 36 photos à 17h59, puis
  // écrit « je n'arrive pas à publier les produits ». Ses photos étaient bien
  // arrivées. Remplir 36 lignes prend du temps, et rien ne le protégeait
  // pendant ce temps-là.
  //
  // Une ligne par photo: { path, name, price, category, description }
  const CLE_BROUILLON = `finjaro:ajout-en-masse:${shop.id}`;
  const [rows, setRows] = useState(() => {
    try {
      const brut = localStorage.getItem(CLE_BROUILLON);
      const lu = brut ? JSON.parse(brut) : null;
      return Array.isArray(lu) ? lu : [];
    } catch {
      return []; // navigation privée, stockage plein: on repart de zéro
    }
  });

  // Sauvegarde à chaque frappe. Les lignes ne contiennent que du texte et un
  // chemin de fichier — quelques kilo-octets, même à 500 articles.
  useEffect(() => {
    try {
      if (rows.length) localStorage.setItem(CLE_BROUILLON, JSON.stringify(rows));
      else localStorage.removeItem(CLE_BROUILLON);
    } catch { /* on n'interrompt jamais la saisie pour un problème de stockage */ }
  }, [rows, CLE_BROUILLON]);
  // Vrai seulement si des lignes venaient du stockage local au premier rendu.
  const [repris] = useState(() => rows.length > 0);
  const [uploading, setUploading] = useState(0);
  // Photos deja envoyees sur le serveur mais rattachees a aucun article.
  const [orphelines, setOrphelines] = useState([]);
  const [aiDone, setAiDone] = useState(null); // {done, total} pendant l'analyse
  const [saving, setSaving] = useState(false);
  // VIDE au départ, et c'est le coeur du sujet.
  //
  // Ce champ valait 'mode_femme'. Une vendeuse d'equipement de chantier a
  // verse 49 articles sans toucher au menu: casques, gants anti-coupure,
  // masques 3M, cones de balisage, bottes de securite. Tout est parti dans
  // « Mode Femme », et une cliente qui ouvrait le rayon femme tombait sur du
  // materiel de chantier. Beau, en le decouvrant: « tout ce qui n'est pas
  // vetement ou truc pour femme doit sortir de ces categories ».
  //
  // Elle n'a pas mal range: un menu deja rempli ne se lit pas, il se
  // valide. Meme piege que les reels, corrige la pour la meme raison — un
  // rayon pre-rempli est accepte sans y penser.
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  // Nom commun: à 500 articles, personne ne tape 500 noms, et Finia peut
  // échouer ou se tromper. « Pyjama fille » donne « Pyjama fille 1, 2, 3… »
  // — numéroté, parce que 500 articles au nom identique sont illisibles
  // autant pour la cliente que pour la vendeuse qui cherche le sien.
  const [bulkName, setBulkName] = useState('');
  // Verser un lot sans connaître les prix est le cas normal quand on publie
  // pour quelqu'un d'autre: on le dit à l'acheteuse au lieu d'afficher 0.
  const [bulkOnRequest, setBulkOnRequest] = useState(false);
  // Décoché par défaut: on publie. Voir l'en-tête du fichier.
  const [enBrouillon, setEnBrouillon] = useState(false);
  // Ce qu'elle cherchait quand elle a choisi « Autre ». Sans cette phrase on
  // saurait qu'un rayon manque, jamais lequel — et c'est justement comme ça
  // que 49 casques de chantier ont fini dans « Mode Femme ».
  const [cherchait, setCherchait] = useState('');

  async function onPick(e) {
    const files = Array.from(e.target.files || []).filter((f) => (f.type || '').startsWith('image/'));
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setUploading(files.length);
    const uploaded = [];
    let raison = '';
    await runPool(files, UPLOAD_POOL, async (file) => {
      try {
        const { full, thumb } = await compressForUploadWithThumb(file);
        const uuid = uid();
        const path = `${user.id}/${uuid}.${full.ext}`;
        const { error } = await supabase.storage.from('products').upload(path, full.blob, { upsert: false, contentType: full.contentType });
        if (error) throw error;
        if (thumb) {
          supabase.storage.from('products')
            .upload(`${user.id}/${uuid}_thumb.${full.ext}`, thumb.blob, { upsert: false, contentType: thumb.contentType })
            .catch(() => {});
        }
        uploaded.push({ path, name: '', price: '', category: bulkCategory });
      } catch (e) {
        // On RETIENT la raison. Avant, ce `catch` vide était le seul indice
        // qu'il restait: la personne lisait « les photos n'ont pas pu être
        // envoyées » et nous n'avions rien pour chercher — une vendeuse a
        // ainsi passé dix-sept jours sans réussir un seul envoi, sans que ni
        // elle ni nous ne sachions pourquoi.
        if (!raison) raison = e?.message || String(e);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    });
    setRows((r) => [...r, ...uploaded]);
    const failed = files.length - uploaded.length;
    if (failed > 0) {
      toast.error(
        raison
          ? `${t('vendor.bulkSomeFailed', { count: failed })} ${raison}`
          : t('vendor.bulkSomeFailed', { count: failed })
      );
    }
  }

  // RÉCUPÉRER LES PHOTOS ABANDONNÉES.
  //
  // La sauvegarde locale (plus haut) protège le travail À PARTIR DE
  // MAINTENANT. Elle ne rend pas ce qui a déjà été perdu — et il y en a: un
  // vendeur a envoyé 36 photos le 25/08 à 17h59, puis a rouvert l'écran et
  // l'a trouvé vide. Ses photos étaient bien sur le serveur, invisibles pour
  // lui, et il aurait dû les renvoyer une par une.
  //
  // On liste donc ce qui dort dans son dossier et qui n'est rattaché à aucun
  // article, et on le lui propose. Ça répare son cas, et ça récupère au
  // passage du quota de stockage payé pour rien.
  useEffect(() => {
    let vivant = true;
    (async () => {
      if (!user?.id || !shop?.id) return;
      const [{ data: fichiers }, { data: articles }] = await Promise.all([
        supabase.storage.from('products').list(user.id, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } }),
        supabase.from('products').select('images').eq('shop_id', shop.id),
      ]);
      if (!vivant || !fichiers) return;
      // Les vignettes (`_thumb`) accompagnent une photo, elles n'en sont pas une.
      const utilisees = new Set((articles || []).flatMap((a) => a.images || []));
      const libres = fichiers
        .filter((f) => f.name && !f.name.includes('_thumb'))
        .map((f) => `${user.id}/${f.name}`)
        .filter((chemin) => !utilisees.has(chemin));
      setOrphelines(libres);
    })();
    return () => { vivant = false; };
  }, [user?.id, shop?.id]);

  function recupererOrphelines() {
    const dejaLa = new Set(rows.map((r) => r.path));
    const ajout = orphelines
      .filter((chemin) => !dejaLa.has(chemin))
      .map((chemin) => ({ path: chemin, name: '', price: '', category: bulkCategory }));
    if (!ajout.length) return;
    setRows((r) => [...r, ...ajout]);
    setOrphelines([]);
    toast.success(t('vendor.bulkRecovered', { count: ajout.length }));
  }

  // Finia regarde chaque photo et propose titre + description + catégorie.
  // On ne remplace jamais ce qui a déjà été tapé à la main.
  async function fillAllWithAi() {
    const todo = rows.map((r, i) => ({ ...r, i })).filter((r) => !r.name.trim());
    if (!todo.length) {
      toast.info(t('vendor.bulkNothingToFill'));
      return;
    }
    setAiDone({ done: 0, total: todo.length });
    let ok = 0;
    await runPool(todo, AI_POOL, async (row) => {
      try {
        const { data, error } = await supabase.functions.invoke('vendor-copilot', {
          body: { mode: 'listing', image_path: row.path, lang: i18n.language },
        });
        if (error || !data?.title) throw error || new Error('empty');
        setRows((rs) =>
          rs.map((r, idx) =>
            idx !== row.i
              ? r
              : {
                  ...r,
                  name: r.name.trim() ? r.name : data.title,
                  description: data.description || null,
                  category: data.category || r.category,
                  // Prix suggéré seulement s'il n'y a rien: c'est une aide,
                  // pas une décision — Beau reste maître de ses prix.
                  price: r.price !== '' ? r.price : data.price_hint_fcfa ? String(data.price_hint_fcfa) : '',
                }
          )
        );
        ok += 1;
      } catch {
        /* meilleur effort: cette ligne restera à remplir à la main */
      } finally {
        setAiDone((p) => (p ? { ...p, done: p.done + 1 } : p));
        // Espacer les appels, sinon Google refuse tout le reste du lot.
        await sleep(AI_SPACING_MS);
      }
    });
    setAiDone(null);
    // Annoncer « c'est rempli » alors que RIEN ne l'est envoie chercher le
    // problème au mauvais endroit (on relit ses fiches, on ne comprend pas).
    // On dit ce qui s'est réellement passé.
    if (ok === 0) toast.error(t('vendor.bulkFillFailed'));
    else if (ok < todo.length) toast.info(t('vendor.bulkFilledPartial', { ok, total: todo.length }));
    else toast.success(t('vendor.bulkFilled'));
  }

  function applyToAll() {
    const base = bulkName.trim();
    let n = 0;
    setRows((rs) =>
      rs.map((r) => {
        // Le nom commun ne remplace JAMAIS un nom déjà là (tapé à la main ou
        // écrit par Finia) — sinon un seul tap effacerait tout le travail.
        const named = r.name.trim() ? r.name : base ? `${base} ${(n += 1)}` : r.name;
        return {
          ...r,
          name: named,
          // Sans choix commun, on ne remplace pas: appliquer le vide
          // effacerait le rayon deja mis sur chaque ligne.
          category: bulkCategory || r.category,
          price: bulkPrice === '' ? r.price : bulkPrice,
        };
      })
    );
    // Dire CE QUI a été appliqué: le rayon seul ne se voyait nulle part sur
    // les lignes, alors le bouton passait pour cassé.
    toast.success(
      bulkPrice === ''
        ? t('vendor.bulkAppliedCategory', { count: rows.length })
        : t('vendor.bulkAppliedBoth', { count: rows.length })
    );
  }

  // Le rayon fait partie de ce qui rend une ligne publiable, au meme titre
  // que le nom et le prix: un article sans rayon n'apparait dans aucun
  // rayon, il est publie pour personne.
  const ready = rows.filter(
    (r) => r.name.trim() && r.category && (bulkOnRequest || (r.price !== '' && Number(r.price) > 0)),
  );
  const sansRayon = rows.filter((r) => !r.category).length;

  async function createAll() {
    if (!ready.length) {
      // Dire LEQUEL des trois manque: « nom et prix » sur un ecran ou tout
      // est nomme et chiffre passe pour un bouton casse.
      toast.info(sansRayon === rows.length && rows.length ? t('vendor.bulkNeedCategory') : t('vendor.bulkNeedNamePrice'));
      return;
    }
    setSaving(true);
    try {
      const payload = ready.map((r) => ({
        shop_id: shop.id,
        name: r.name.trim(),
        description: r.description || null,
        price_on_request: bulkOnRequest,
        price_fcfa: bulkOnRequest ? 0 : toFcfa(Number(r.price), shopCurrency),
        category: r.category,
        images: [r.path],
        stock: 1,
        is_active: !enBrouillon,
      }));
      const { data: crees, error } = await supabase.from('products').insert(payload).select('id, category');
      if (error) throw error;
      // Le mot de la vendeuse, une fois par article rangé dans « Autre ».
      // Meilleur effort: si cette écriture échoue, ses articles sont déjà en
      // ligne et c'est ce qui compte — on ne lui montre pas une erreur pour
      // une note interne.
      const orphelins = (crees || []).filter((p) => p.category === 'autre_produit');
      if (orphelins.length && cherchait.trim()) {
        await supabase.from('rayons_manquants').insert(
          orphelins.map((p) => ({
            product_id: p.id,
            shop_id: shop.id,
            cherchait: cherchait.trim().slice(0, 200),
          })),
        );
      }
      // Le travail est en base: le brouillon local n'a plus de raison d'être.
      setRows([]);
      try { localStorage.removeItem(CLE_BROUILLON); } catch { /* ignore */ }
      toast.success(t(enBrouillon ? 'vendor.bulkCreatedDraft' : 'vendor.bulkCreated', { count: payload.length }));
      // On atterrit sur la pile où sont VRAIMENT les articles: en ligne si on
      // vient de publier, dans les brouillons si la vendeuse a coché la case.
      // Renvoyer sur un onglet qui ne contient pas ce qu'on vient d'ajouter
      // fait croire que rien n'a marché.
      navigate(enBrouillon ? '/vendor/products?tab=drafts' : '/vendor/products');
    } catch (err) {
      toast.error(err.message || t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-28">
      <AppHeader title={t('vendor.bulkTitle')} back />
      <div className="space-y-4 p-4">
        <p className="text-caption text-muted">{t('vendor.bulkIntro')}</p>

        {/* Les photos deja envoyees mais jamais publiees. Proposees AVANT le
            bouton « Choisir mes photos »: sans ca, la personne renvoie les
            memes fichiers une deuxieme fois sans savoir qu'ils sont deja la. */}
        {orphelines.length > 0 && (
          <div className="rounded-card border border-brass/50 bg-brass/10 p-3">
            <p className="text-body font-semibold text-ink">
              {t('vendor.bulkOrphansTitle', { count: orphelines.length })}
            </p>
            <p className="mt-1 text-caption text-muted">{t('vendor.bulkOrphansHelp')}</p>
            <Button variant="secondary" className="mt-3" onClick={recupererOrphelines}>
              <IconPhotoPlus size={18} /> {t('vendor.bulkOrphansCta', { count: orphelines.length })}
            </Button>
          </div>
        )}

        {/* Sans ce mot, la reprise passe pour un bug: on rouvre l'écran et
            des photos qu'on n'a pas re-choisies sont déjà là. */}
        {repris && rows.length > 0 && (
          <p className="rounded-card border border-teal/30 bg-teal-light/60 p-3 text-caption font-semibold text-teal">
            {t('vendor.bulkResumed', { count: rows.length })}
          </p>
        )}

        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <IconLoader2 size={18} className="animate-spin" /> : <IconPhotoPlus size={18} />}
          {uploading > 0 ? t('vendor.bulkUploading', { count: uploading }) : t('vendor.bulkPickPhotos')}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />

        {rows.length > 0 && (
          <>
            {/* Réglages communs: sur 72 articles, taper 72 fois la même
                catégorie serait absurde. */}
            <section className="card space-y-3">
              <p className="text-caption font-semibold text-ink">{t('vendor.bulkCommon')}</p>
              <Field label={`${t('vendor.productName')} ${t('common.optional')}`} hint={t('vendor.bulkNameHint')}>
                {(id) => (
                  <TextInput id={id} value={bulkName} placeholder={t('vendor.bulkNamePlaceholder')} onChange={(e) => setBulkName(e.target.value)} />
                )}
              </Field>
              <Field label={t('vendor.productCategory')}>
                {(id) => (
                  <Select id={id} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                    <option value="">{t('vendor.bulkCategoryPlaceholder')}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>
                    ))}
                  </Select>
                )}
              </Field>
              {bulkCategory === 'autre_produit' && (
                <Field label={t('vendor.missingCategoryLabel')} hint={t('vendor.missingCategoryHint')}>
                  {(id) => (
                    <TextInput
                      id={id}
                      value={cherchait}
                      placeholder={t('vendor.missingCategoryPlaceholder')}
                      onChange={(e) => setCherchait(e.target.value)}
                    />
                  )}
                </Field>
              )}
              <label className="flex items-start gap-3 rounded-card border border-hairline p-3">
                <input
                  type="checkbox"
                  checked={bulkOnRequest}
                  onChange={(e) => setBulkOnRequest(e.target.checked)}
                  className="mt-0.5 h-5 w-5 accent-[#C25E38]"
                />
                <span className="flex-1">
                  <span className="block text-body text-ink">{t('vendor.priceOnRequest')}</span>
                  <span className="mt-0.5 block text-caption text-muted">{t('vendor.priceOnRequestHelp')}</span>
                </span>
              </label>
              {!bulkOnRequest && (
              <Field label={`${t('vendor.productPrice')} (${shopCurrency}) ${t('common.optional')}`}>
                {(id) => (
                  <TextInput id={id} type="number" inputMode="numeric" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)} />
                )}
              </Field>
              )}
              <Button variant="secondary" onClick={applyToAll}>{t('vendor.bulkApplyToAll')}</Button>
              <Button variant="secondary" onClick={fillAllWithAi} disabled={!!aiDone}>
                {aiDone ? <IconLoader2 size={18} className="animate-spin" /> : <IconSparkles size={18} />}
                {aiDone ? t('vendor.bulkFilling', { done: aiDone.done, total: aiDone.total }) : t('vendor.bulkFillWithAi')}
              </Button>
            </section>

                {/* Ce qui manque, dit clairement et au bon endroit.
                « 0 prêt sur 36 » en gris ne dit pas QUOI faire; on nomme donc
                l'action manquante, et on la rend visible tant qu'aucune ligne
                n'est complète. C'est exactement là que des vendeurs se sont
                arrêtés en croyant que l'application ne marchait pas. */}
            {ready.length === 0 ? (
              <p className="rounded-card border border-brass/40 bg-brass/8 p-3 text-caption text-ink">
                <span className="font-semibold">{t('vendor.bulkReadyCount', { ready: ready.length, total: rows.length })}</span>{' '}
                {t('vendor.bulkWhatsMissing')}
              </p>
            ) : (
              <p className="text-caption text-muted">{t('vendor.bulkReadyCount', { ready: ready.length, total: rows.length })}</p>
            )}

            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={r.path} className="flex gap-3 rounded-card border border-hairline bg-white p-2">
                  <img src={storageUrl('products', r.path)} alt="" className="h-20 w-20 shrink-0 rounded-input object-cover" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <TextInput
                      value={r.name}
                      placeholder={t('vendor.productName')}
                      onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                    />
                    {/* Inutile de demander un prix ligne par ligne quand tout
                        le lot part « sur demande ». */}
                    {bulkOnRequest ? (
                      <p className="text-caption font-semibold text-brass">{t('product.requestQuote')}</p>
                    ) : (
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        value={r.price}
                        placeholder={`${t('vendor.productPrice')} (${shopCurrency})`}
                        onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))}
                      />
                    )}
                    {/* Le rayon DOIT être visible ici: sans lui, « Appliquer à
                        tous » ne produit aucun changement à l'écran et passe
                        pour cassé. Et Finia se trompe parfois de rayon — il
                        faut pouvoir corriger une ligne sans tout reprendre. */}
                    <Select
                      // Finia renvoie une sous-catégorie précise (« Robes »),
                      // la liste ne propose que les rayons: on affiche le
                      // rayon PARENT, et changer ce choix retombe dessus.
                      value={categoryHeadFor(r.category) || r.category}
                      onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, category: e.target.value } : x)))}
                      className={`text-caption ${r.category ? '' : 'border-terracotta text-terracotta'}`}
                    >
                      <option value="">{t('vendor.bulkCategoryPlaceholder')}</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>
                      ))}
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                    aria-label={t('common.delete')}
                    className="self-start p-1 text-muted"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* La barre d'action doit passer AU-DESSUS de la barre d'onglets
          flottante (z-40, voir TabBar) — sinon le bouton est bien visible
          mais les taps atterrissent sur la navigation. */}
      {rows.length > 0 && (
        /* `fixed` et non `sticky`: en sticky, la barre dépend du conteneur de
           défilement, et sur une page de 24 lignes elle finissait tout en bas,
           hors de vue — le bouton « Créer » semblait absent. Ancrée à l'écran,
           elle est visible en permanence, quel que soit le nombre de photos. */
        <div className="fixed inset-x-0 bottom-[96px] z-50 mx-4 rounded-card border border-hairline bg-white p-3 shadow-[0_10px_30px_rgba(23,27,38,0.18)] lg:sticky lg:bottom-0 lg:mx-0">
          {/* Le choix est ici, juste au-dessus du bouton: c'est le dernier
              endroit que la vendeuse regarde avant de valider, et le seul où
              « en ligne ou pas » se décide encore. */}
          <label className="mb-2 flex items-start gap-3">
            <input
              type="checkbox"
              checked={enBrouillon}
              onChange={(e) => setEnBrouillon(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#C25E38]"
            />
            <span className="flex-1">
              <span className="block text-body text-ink">{t('vendor.bulkKeepDraft')}</span>
              <span className="mt-0.5 block text-caption text-muted">{t('vendor.bulkKeepDraftHelp')}</span>
            </span>
          </label>
          <Button onClick={createAll} loading={saving} disabled={!ready.length}>
            {enBrouillon
              ? t('vendor.bulkCreateDraft', { count: ready.length })
              : t('vendor.bulkCreate', { count: ready.length })}
          </Button>
          {/* Un bouton grisé sans explication laisse croire à une panne. */}
          {!ready.length && (
            <p className="mt-2 text-center text-caption text-muted">{t('vendor.bulkNeedNamePrice')}</p>
          )}
        </div>
      )}
    </div>
  );
}
