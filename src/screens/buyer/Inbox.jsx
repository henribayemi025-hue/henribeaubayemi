import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconMessageOff, IconMessages, IconSearch, IconX } from '@tabler/icons-react';
import { supabase, storageUrl, storageThumbUrl} from '../../lib/supabase';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/AppHeader';
import { ShopAvatar } from '../../components/ShopAvatar';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SwipeRow } from '../../components/chat/SwipeRow';
import { EmptyState, ErrorState, Skeleton } from '../../components/states';
import { timeAgo } from '../../lib/format';
import { nameMatches } from '../../lib/searchNorm';
import { getOrCreateConversation } from '../../lib/chat';
import { searchPeople, getPublicProfiles, hideDirectConversation } from '../../lib/directMessages';

// Shared conversation list. `vendor` flag switches perspective + link base.
// `activeId` surligne la conversation ouverte — indispensable en deux
// panneaux sur ordinateur, où la liste reste visible à côté du fil.
export function ConversationList({ vendor = false, activeId = null }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  // Beau: « il doit y avoir un truc pour rechercher directement une boutique,
  // taper un nom directement en haut, pour écrire à une boutique même sans
  // avoir déjà de conversation avec elle ». Recherche locale sur les fils
  // déjà ouverts + recherche en base sur TOUTES les boutiques actives dès
  // qu'on tape — deux listes, jamais confondues (voir plus bas).
  const [searchQuery, setSearchQuery] = useState('');
  const [shopResults, setShopResults] = useState([]);
  // Beau, en testant: « je tape Astrid Louce, ça ne me présente personne,
  // pourtant il y a bien une personne avec ce compte ». La barre promettait
  // « écrire à quelqu'un » mais n'interrogeait que les BOUTIQUES — une
  // personne n'y apparaissait jamais. Elle cherche désormais les deux.
  const [peopleResults, setPeopleResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Beau (11/09): « quand quelqu'un m'écrit, ça n'apparaît pas dans le chat,
  // je reçois même pas la notification ». Les messages d'une PERSONNE
  // vivaient dans une seconde boîte, sur un autre écran, que personne
  // n'ouvre jamais. La notification partait bien (trigger on_direct_message)
  // mais menait à une liste invisible depuis l'onglet Messages.
  //
  // Une seule liste désormais: boutiques et personnes, triées ensemble par
  // date. Chaque ligne est normalisée ici — elle sait où elle mène, qui
  // l'illustre et combien de messages attendent — pour que l'affichage plus
  // bas n'ait plus à connaître les deux formes.
  const { data, loading, error, retry } = useAsync(async () => {
    let query = supabase
      .from('conversations')
      .select('id, last_message, last_message_at, buyer_unread, vendor_unread, buyer_hidden, vendor_hidden, shop_id, shops(name, avatar_url, is_verified)')
      .order('last_message_at', { ascending: false });
    if (vendor) {
      const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
      query = query.eq('shop_id', shop?.id || '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.eq('buyer_id', user.id);
    }
    const { data: convs, error: err } = await query;
    if (err) throw err;
    const boutiques = (convs || [])
      .filter((c) => !(vendor ? c.vendor_hidden : c.buyer_hidden))
      .map((c) => ({
        cle: `s:${c.id}`,
        lien: `${vendor ? '/vendor/messages' : '/chat'}/${c.id}`,
        id: c.id,
        genre: 'boutique',
        nom: c.shops?.name,
        avatar: c.shops?.avatar_url,
        graine: c.shop_id,
        verifie: !!c.shops?.is_verified,
        apercu: c.last_message,
        date: c.last_message_at,
        nonLus: vendor ? c.vendor_unread : c.buyer_unread,
        shop_id: c.shop_id,
      }));

    // L'espace vendeuse a sa propre boîte, liée à la boutique: on n'y mêle
    // pas les messages personnels du compte.
    if (vendor) return boutiques;

    // Une boîte personnelle vide ou en erreur ne doit pas faire disparaître
    // les conversations avec les boutiques.
    let gens = [];
    try {
      const { data: dConvs } = await supabase
        .from('direct_conversations')
        .select('id, user_a_id, user_b_id, last_message, last_message_at, a_unread, b_unread, a_hidden, b_hidden')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      const visibles = (dConvs || []).filter((c) => (c.user_a_id === user.id ? !c.a_hidden : !c.b_hidden));
      const autresIds = [...new Set(visibles.map((c) => (c.user_a_id === user.id ? c.user_b_id : c.user_a_id)))];
      const profils = autresIds.length ? await getPublicProfiles(autresIds) : [];
      const parId = Object.fromEntries(profils.map((p) => [p.id, p]));
      gens = visibles.map((c) => {
        const autreId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
        const autre = parId[autreId] || { id: autreId, name: '—', avatar_url: null };
        return {
          cle: `d:${c.id}`,
          lien: `/profile/messages/${c.id}`,
          id: c.id,
          genre: 'personne',
          nom: autre.name,
          avatar: autre.avatar_url,
          graine: autreId,
          verifie: false,
          apercu: c.last_message,
          date: c.last_message_at,
          nonLus: c.user_a_id === user.id ? c.a_unread : c.b_unread,
          shop_id: null,
        };
      });
    } catch {
      /* boîte personnelle indisponible: on affiche au moins les boutiques */
    }

    return [...boutiques, ...gens].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  }, [user, vendor], {
    // Beau (11/09): « chaque fois que je change de page ça se recharge ».
    // Sans clé, ce chargeur repartait de zéro à chaque retour sur l'onglet:
    // écran vide, puis la liste. On réaffiche la dernière liste connue tout
    // de suite et on rafraîchit derrière (le temps réel corrige le reste).
    // v2: les lignes ont changé de forme (boutiques + personnes réunies).
    cacheKey: `inbox2:${vendor ? 'v' : 'b'}:${user?.id || 'anon'}`,
    ttlMs: 60 * 1000,
  });

  // Beau (deux fois): « il ya pas eu delete UNE conversation ». Masque
  // seulement de mon côté; un nouveau message de l'autre partie la refait
  // réapparaître (voir migration 0106 / on_chat_message).
  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      // Une conversation personnelle se masque par sa propre fonction: les
      // deux tables n'ont ni les mêmes colonnes ni les mêmes règles d'accès.
      if (toDelete.genre === 'personne') {
        await hideDirectConversation(toDelete.id);
      } else {
        const { error: dErr } = await supabase
          .from('conversations')
          .update(vendor ? { vendor_hidden: true } : { buyer_hidden: true })
          .eq('id', toDelete.id);
        if (dErr) throw dErr;
      }
      setToDelete(null);
      retry();
    } catch (e) {
      toast.error(e.message || t('errors.generic'));
    } finally {
      setDeleting(false);
    }
  }

  // Live-refresh the list when a conversation changes (new/updated message).
  useEffect(() => {
    if (!user) return undefined;
    const channel = supabase
      .channel(`inbox-${vendor ? 'v' : 'b'}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => retry())
      .subscribe();
    // Sans ceci, un message d'une personne n'apparaissait qu'au rechargement
    // de l'écran — c'est une des raisons pour lesquelles Beau ne voyait rien
    // arriver.
    const canalPerso = vendor
      ? null
      : supabase
          .channel(`inbox-dm-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_conversations' }, () => retry())
          .subscribe();
    return () => {
      supabase.removeChannel(channel);
      if (canalPerso) supabase.removeChannel(canalPerso);
    };
  }, [user, vendor, retry]);

  // Une seule frappe, deux recherches: les BOUTIQUES à qui écrire pour la
  // première fois, et les PERSONNES (search_people n'expose que nom + avatar,
  // jamais téléphone ni e-mail — voir migration 0099). Les deux listes
  // restent séparées à l'affichage: écrire à une boutique et écrire à
  // quelqu'un ne sont pas la même chose.
  useEffect(() => {
    const q = searchQuery.trim();
    if (vendor || !q) {
      setShopResults([]);
      setPeopleResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      const [shopsRes, gens] = await Promise.all([
        supabase
          .from('shops')
          .select('id, slug, name, avatar_url, is_verified, city')
          .eq('status', 'active')
          .ilike('name', `%${q}%`)
          .limit(20),
        // Une recherche de personnes qui échoue ne doit pas emporter avec
        // elle la recherche de boutiques: on renvoie une liste vide.
        q.length >= 2 ? searchPeople(q).catch(() => []) : Promise.resolve([]),
      ]);
      if (!cancelled) {
        setShopResults(shopsRes.data || []);
        setPeopleResults((gens || []).filter((p) => p.id !== user?.id));
        setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [searchQuery, vendor, user]);

  async function startConversation(shop) {
    if (!user || starting) return;
    setStarting(shop.id);
    try {
      const convId = await getOrCreateConversation(user.id, shop.id);
      setSearchQuery('');
      navigate(`/chat/${convId}`);
    } catch (e) {
      if (e.code === 'own_shop') toast.info(t('chat.ownShop'));
      else toast.error(e.message || t('errors.generic'));
    } finally {
      setStarting(null);
    }
  }

  // Les boutiques déjà en conversation ne se répètent pas dans « Nouvelle
  // conversation » — elles apparaissent en filtrant simplement le fil ouvert.
  const openShopIds = new Set((data || []).map((c) => c.shop_id).filter(Boolean));
  const newShopResults = shopResults.filter((s) => !openShopIds.has(s.id));
  const filteredConvs = searchQuery.trim()
    ? (data || []).filter((c) => nameMatches(c.nom, searchQuery))
    : data || [];
  // Une personne déjà en conversation non plus: on ouvre le fil existant
  // plutôt que de la reproposer comme une inconnue.
  const openPeopleIds = new Set((data || []).filter((c) => c.genre === 'personne').map((c) => c.graine));

  // La recherche reste visible même sans conversation: c'est justement ce
  // qui manquait pour écrire à une boutique la toute première fois.
  const searchBar = !vendor && (
    <div className="border-b border-hairline p-3">
      <div className="relative">
        <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('inbox.searchPlaceholder')}
          className="input h-10 w-full bg-base pl-9 pr-9 text-[16px]"
          aria-label={t('inbox.searchPlaceholder')}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label={t('common.close')}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted"
          >
            <IconX size={15} />
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        {searchBar}
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState onRetry={retry} />;

  const nothingAtAll =
    filteredConvs.length === 0 && newShopResults.length === 0 && peopleResults.length === 0 && !searching;

  return (
    <div>
      {searchBar}
      {nothingAtAll && !searchQuery.trim() && (
        <EmptyState icon={IconMessageOff} title={t('inbox.empty')} hint={t('inbox.emptyHint')} />
      )}
      {nothingAtAll && searchQuery.trim() && (
        <p className="p-4 text-center text-caption text-muted">{t('inbox.searchNoMatch', { query: searchQuery })}</p>
      )}
      {newShopResults.length > 0 && (
        <div>
          <p className="px-4 pb-1 pt-3 text-caption font-semibold text-muted">{t('inbox.newConversation')}</p>
          <ul>
            {newShopResults.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={starting === s.id}
                  onClick={() => startConversation(s)}
                  className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-colors hover:bg-base disabled:opacity-60"
                >
                  <ShopAvatar src={s.avatar_url ? storageThumbUrl('shops', s.avatar_url) : null} fallbackSrc={s.avatar_url ? storageUrl('shops', s.avatar_url) : null} name={s.name} seed={s.id} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-body font-semibold text-ink">
                      <span className="line-clamp-1">{s.name}</span>
                      {s.is_verified && <VerifiedBadge size={13} />}
                    </p>
                    {s.city && <p className="text-caption text-muted">{s.city}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Les PERSONNES, dans leur propre section: on ouvre leur profil, d'où
          l'on suit et écrit — même chemin que « Trouver quelqu'un », plutôt
          qu'un raccourci qui échouerait sur « il faut d'abord la suivre ». */}
      {peopleResults.length > 0 && (
        <div>
          <p className="px-4 pb-1 pt-3 text-caption font-semibold text-muted">{t('inbox.peopleFound')}</p>
          <ul>
            {peopleResults.filter((p) => !openPeopleIds.has(p.id)).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/profile/u/${p.id}`)}
                  className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left transition-colors hover:bg-base"
                >
                  <ShopAvatar
                    src={p.avatar_url ? storageThumbUrl('shops', p.avatar_url) : null}
                    fallbackSrc={p.avatar_url ? storageUrl('shops', p.avatar_url) : null}
                    name={p.name}
                    seed={p.id}
                    className="h-12 w-12"
                  />
                  <span className="line-clamp-1 text-body font-semibold text-ink">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {filteredConvs.length > 0 && searchQuery.trim() && (newShopResults.length > 0 || peopleResults.length > 0) && (
        <p className="px-4 pb-1 pt-3 text-caption font-semibold text-muted">{t('inbox.title')}</p>
      )}
    <ul>
      {filteredConvs.map((c) => {
        const unread = c.nonLus || 0;
        const active = c.id === activeId;
        return (
          <li key={c.cle}>
            <SwipeRow onDelete={() => setToDelete(c)} label={t('common.delete')}>
            <Link
              to={c.lien}
              className={`flex items-center gap-3 border-b border-hairline px-4 py-3 transition-colors ${
                active ? 'border-l-[3px] border-l-teal bg-teal-light pl-[13px]' : 'hover:bg-base'
              }`}
            >
              <ShopAvatar src={c.avatar ? storageThumbUrl('shops', c.avatar) : null} fallbackSrc={c.avatar ? storageUrl('shops', c.avatar) : null} name={c.nom} seed={c.graine} className="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1 text-body font-semibold text-ink">
                    <span className="line-clamp-1">{c.nom}</span>
                    {c.verifie && <VerifiedBadge size={13} />}
                  </p>
                  <span className="shrink-0 text-caption text-muted">{timeAgo(c.date, i18n.language)}</span>
                </div>
                {/* Un message non lu se lit en gras: on repère d'un coup d'œil
                    ce qui attend une réponse, sans compter les pastilles. */}
                <p className={`line-clamp-1 text-caption ${unread > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {c.apercu || '—'}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal px-1 text-[11px] font-semibold text-white">{unread}</span>
              )}
            </Link>
            </SwipeRow>
          </li>
        );
      })}
    </ul>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={t('chat.deleteConversation')}>
        <div className="space-y-4">
          <p className="text-body text-muted">{t('chat.deleteConversationConfirm')}</p>
          <Button onClick={confirmDelete} loading={deleting} className="!bg-danger">
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Deux panneaux sur ordinateur (liste à gauche, fil à droite) — sur un écran
// large, ouvrir une conversation faisait disparaître toutes les autres, alors
// que la place ne manque pas. Sur mobile, rien ne change: une page à la fois.
export function MessagesShell({ vendor = false, activeId = null, children }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-[340px] shrink-0 flex-col border-r border-hairline lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-hairline px-4">
          <h1 className="text-section text-ink">{t('inbox.title')}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList vendor={vendor} activeId={activeId} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export default function Inbox() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <MessagesShell>
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <IconMessages size={44} stroke={1.5} className="text-hairline" />
          <p className="text-body text-muted">{t('inbox.pickConversation')}</p>
        </div>
      </MessagesShell>
    );
  }

  return (
    <div>
      <AppHeader title={t('inbox.title')} back />
      <ConversationList />
    </div>
  );
}
