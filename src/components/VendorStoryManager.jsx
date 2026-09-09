import { useTranslation } from 'react-i18next';
import { IconTrash } from '@tabler/icons-react';
import { supabase, storageUrl } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useShopStories } from '../hooks/useShopStories';
import { ImageUpload } from './ImageUpload';
import { timeAgo } from '../lib/format';

// Poster/retirer les stories de SA boutique — 24h, visibles côté acheteuse
// dans le chat et sur la fiche boutique (anneau autour de l'avatar, comme
// WhatsApp).
export function VendorStoryManager({ shopId }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { stories, loading, reload } = useShopStories(shopId);

  async function postStory(path) {
    if (!path) return;
    const { error } = await supabase.from('shop_stories').insert({ shop_id: shopId, media_url: path });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('vendor.storyPosted'));
    reload();
  }

  async function removeStory(story) {
    const { error } = await supabase.from('shop_stories').delete().eq('id', story.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    reload();
  }

  return (
    <div>
      <span className="label">{t('vendor.storiesLabel')}</span>
      <p className="mb-2 text-caption text-muted">{t('vendor.storiesHint')}</p>
      <ImageUpload bucket="shops" value={null} onChange={postStory} shape="square" label={t('vendor.storyAdd')} />
      {!loading && stories.length > 0 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {stories.map((s) => (
            <li key={s.id} className="relative shrink-0">
              <img src={storageUrl('shops', s.media_url)} alt="" className="h-20 w-20 rounded-input object-cover" />
              <button
                type="button"
                onClick={() => removeStory(s)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                aria-label={t('common.delete')}
              >
                <IconTrash size={13} />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                {timeAgo(s.created_at, i18n.language)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
