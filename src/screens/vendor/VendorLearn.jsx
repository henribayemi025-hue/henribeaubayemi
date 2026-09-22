import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconCheck, IconPhotoPlus, IconMessageCircle, IconTruckDelivery,
  IconBook2, IconChevronRight, IconExternalLink,
} from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { AppHeader } from '../../components/AppHeader';
import { Skeleton, ErrorState } from '../../components/states';

// Finjaro Learn — apprendre en faisant, pas en lisant.
//
// Beau, 22/09: « fais aussi le truc Finjaro Learn ».
//
// Le chiffre qui décide de ce que cet écran contient, et il est MESURÉ:
// 19 boutiques sur 67 sont vides. Ces personnes se sont inscrites et n'ont
// jamais rien publié. Ce n'est pas un manque d'envie — c'est qu'entre
// « je m'inscris » et « mon article est en ligne » il y a un trou que
// personne ne leur explique.
//
// Donc on ne fait pas un catalogue de cours. On fait quatre choses à FAIRE,
// dans l'ordre où on les rencontre, avec un bouton qui emmène à l'endroit
// exact où on les fait.
//
// ⚠️ UNE LEÇON NE SE COCHE PAS TOUTE SEULE, ET NE SE COCHE PAS À LA MAIN.
// Elle est validée par la base: tu as publié un article, tu as répondu à
// quelqu'un, une commande est arrivée jusqu'à la livraison. La preuve, c'est
// l'action. Un bouton « j'ai compris » ne prouve rien et se clique sans lire.
//
// Rien n'est stocké: aucune table de progression, donc aucune migration.
// L'état se recalcule à chaque ouverture à partir de ce qui existe déjà.

export default function VendorLearn() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { shop } = useOutletContext();

  const { data, loading, error, retry } = useAsync(async () => {
    if (!shop?.id) return null;

    const [articles, commandes, conversations] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('status', 'delivered'),
      supabase.from('conversations').select('id').eq('shop_id', shop.id),
    ]);

    // « A-t-elle répondu à une cliente ? » — il faut un message écrit PAR la
    // boutique, et qui ne soit pas la réponse automatique: celle-ci part
    // toute seule et ne prouve donc rien sur ce que la personne sait faire.
    const ids = (conversations.data || []).map((c) => c.id);
    let repondu = 0;
    if (ids.length) {
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .eq('sender_role', 'vendor')
        .or('auto_reply.is.null,auto_reply.eq.false');
      repondu = count || 0;
    }

    return {
      articles: articles.count || 0,
      livrees: commandes.count || 0,
      repondu,
    };
  }, [shop?.id, user?.id], { cacheKey: `apprendre:${shop?.id || 'aucune'}` });

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-40 w-full" /></div>;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return null;

  const lecons = [
    {
      cle: 'publier',
      Icone: IconPhotoPlus,
      fait: data.articles > 0,
      vers: '/vendor/products',
      // Ce qu'on affiche quand c'est fait: le nombre RÉEL, jamais un
      // encouragement inventé.
      compte: data.articles,
    },
    {
      cle: 'repondre',
      Icone: IconMessageCircle,
      fait: data.repondu > 0,
      vers: '/vendor/messages',
      compte: data.repondu,
    },
    {
      cle: 'livrer',
      Icone: IconTruckDelivery,
      fait: data.livrees > 0,
      vers: '/vendor/orders',
      compte: data.livrees,
    },
  ];

  const faites = lecons.filter((l) => l.fait).length;

  return (
    <div>
      <AppHeader title={t('learn.title')} back />

      <div className="px-4 pb-24 pt-3">
        <div className="rounded-card border border-hairline p-4">
          <p className="text-section text-ink">{t('learn.intro')}</p>
          <p className="mt-1 text-body text-muted">{t('learn.introHint')}</p>
          <p className="mt-3 text-caption font-semibold text-teal">
            {t('learn.progress', { faites, total: lecons.length })}
          </p>
        </div>

        <ul className="mt-4 space-y-3">
          {lecons.map(({ cle, Icone, fait, vers, compte }) => (
            <li key={cle}>
              <Link
                to={vers}
                className="flex items-start gap-3 rounded-card border border-hairline p-4 transition hover:bg-teal-light"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-card ${
                    fait ? 'bg-teal text-white' : 'bg-teal-light text-teal'
                  }`}
                >
                  {fait ? <IconCheck size={20} /> : <Icone size={20} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-ink">{t(`learn.${cle}.titre`)}</span>
                  <span className="mt-0.5 block text-caption text-muted">{t(`learn.${cle}.quoi`)}</span>
                  <span className="mt-1 block text-caption text-muted">{t(`learn.${cle}.comment`)}</span>
                  {fait && (
                    <span className="mt-2 inline-block rounded-pill bg-teal-light px-2 py-0.5 text-caption font-semibold text-teal">
                      {t(`learn.${cle}.fait`, { count: compte })}
                    </span>
                  )}
                </span>

                <IconChevronRight size={18} className="mt-2 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>

        {/* La quatrième — la comptabilité — n'a PAS de coche, et c'est voulu.
            Vérifier qu'elle est faite demanderait de lire les tables de
            Finjaro Accounting, qui appartiennent à l'autre application et ne
            se mélangent pas avec les nôtres (CLAUDE.md §8). On ouvre la
            porte, on ne surveille pas ce qui se passe derrière. */}
        <p className="mt-6 text-caption font-semibold uppercase tracking-wider text-muted">
          {t('learn.ensuite')}
        </p>
        <div className="mt-2 rounded-card border border-hairline p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-brass/15 text-brass">
              <IconBook2 size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{t('learn.comptes.titre')}</p>
              <p className="mt-0.5 text-caption text-muted">{t('learn.comptes.quoi')}</p>
              <a
                href="https://accounting.finjaro.net"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-pill bg-teal px-3 py-2 text-caption font-semibold text-white"
              >
                <IconExternalLink size={16} /> {t('learn.comptes.ouvrir')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
