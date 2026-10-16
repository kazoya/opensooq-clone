import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { market } from '../marketApi';
import AdCard from './AdCard';

export default function Favorites({ onOpen, user }) {
  const [ads, setAds] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { market.favorites().then(setAds).catch((e) => setError(e.message)); }, []);
  return (
    <section data-testid="favorites">
      <h1>♥ {t('المفضلة')}</h1>
      {error && <p role="alert">{t(error)}</p>}
      {ads && !ads.length && <p className="empty" data-testid="fav-empty">{t('لم تضف أي إعلان للمفضلة بعد')}</p>}
      <div data-testid="ad-list">{(ads || []).map((ad) => <AdCard key={ad.id} ad={ad} onOpen={onOpen} user={user} onFavChange={(id, on) => !on && setAds((a) => a.filter((x) => x.id !== id))} />)}</div>
    </section>
  );
}
