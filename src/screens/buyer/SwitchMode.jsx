import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconSparkles, IconShoppingCart } from '@tabler/icons-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/Button';

export default function SwitchMode() {
  const { direction } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { count } = useCart();
  const { switchScreenShown, markSwitchShown } = useUI();
  const toVendor = direction === 'to-vendor';
  const target = toVendor ? '/vendor' : '/';
  const [stats, setStats] = useState({ orders: 0, unread: 0, rating: 0 });

  // Instant switch if the transition already ran once this session.
  useEffect(() => {
    if (switchScreenShown) {
      navigate(target, { replace: true });
      return;
    }
    markSwitchShown();
    const timer = setTimeout(() => navigate(target, { replace: true }), 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toVendor || !user) return;
    (async () => {
      const { data: shop } = await supabase.from('shops').select('id, rating').eq('owner_id', user.id).maybeSingle();
      if (!shop) return;
      const [{ count: orders }, { data: convs }] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('status', 'new'),
        supabase.from('conversations').select('vendor_unread').eq('shop_id', shop.id),
      ]);
      const unread = (convs || []).reduce((n, c) => n + (c.vendor_unread || 0), 0);
      setStats({ orders: orders || 0, unread, rating: shop.rating || 0 });
    })();
  }, [toVendor, user]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 text-teal">
        {toVendor ? <IconSparkles size={40} /> : <IconShoppingCart size={40} />}
      </span>
      <h1 className="mt-6 text-title text-ink">
        {toVendor ? t('switchMode.welcomeVendor') : t('switchMode.backToBuyer')}
      </h1>

      {toVendor ? (
        <>
          <p className="mt-2 text-body text-muted">{t('switchMode.welcomeVendorSub')}</p>
          <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
            <Stat value={stats.orders} label={t('switchMode.newOrders')} />
            <Stat value={stats.unread} label={t('switchMode.unread')} />
            <Stat value={Number(stats.rating).toFixed(1)} label={t('switchMode.rating')} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-body text-muted">
          {count > 0 ? t('switchMode.backToBuyerCart', { count }) : t('switchMode.backToBuyerEmpty')}
        </p>
      )}

      <Button className="mt-8 max-w-xs" onClick={() => navigate(target, { replace: true })}>
        {t('switchMode.continue')}
      </Button>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-card border border-hairline p-3">
      <p className="text-title font-semibold text-teal">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
