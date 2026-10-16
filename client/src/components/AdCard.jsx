import React from 'react';
import { t, tf, getLang } from '../i18n';
import { market } from '../marketApi';

export const price = (n) => Number(n).toLocaleString(getLang() === 'ar' ? 'ar-SA' : 'en-US');

// Listing card with featured badge and favorite heart. onNeedLogin is called when a guest taps the heart.
export default function AdCard({ ad, onOpen, user, onNeedLogin, onFavChange }) {
  const [fav, setFav] = React.useState(!!ad.favorite);
  React.useEffect(() => setFav(!!ad.favorite), [ad.favorite]);
  const toggle = async (e) => {
    e.stopPropagation();
    if (!user) return onNeedLogin && onNeedLogin();
    const next = !fav; setFav(next);
    try { await market.setFavorite(ad.id, next); onFavChange && onFavChange(ad.id, next); } catch { setFav(!next); }
  };
  return (
    <article className={'ad-card' + (ad.featured ? ' featured' : '')} data-testid="ad-card">
      <div className="thumb-wrap">
        {ad.imageUrl && <img data-testid="ad-thumb" src={ad.imageUrl} alt={tf(ad, 'title')} loading="lazy" />}
        {ad.featured && <span className="badge-featured" data-testid="featured-badge">★ {t('مميز')}</span>}
        <button type="button" className={'fav-btn' + (fav ? ' on' : '')} aria-pressed={fav} aria-label={fav ? t('إزالة من المفضلة') : t('أضف للمفضلة')} data-testid="fav-toggle" onClick={toggle}>{fav ? '♥' : '♡'}</button>
      </div>
      <h2>{tf(ad, 'title')}</h2>
      <p className="ad-price" data-testid="ad-card-price"><bdi>{price(ad.price)}</bdi> {t('ريال')}</p>
      <p className="ad-meta"><span>📍 {tf(ad, 'cityName')}</span><span>{tf(ad, 'categoryName')}</span>{ad.condition && <span>{t(ad.condition)}</span>}</p>
      <p>{new Date(ad.createdAt).toLocaleDateString(getLang() === 'ar' ? 'ar-SA' : 'en-US')}</p>
      <button onClick={() => onOpen(ad.id)}>{t('تفاصيل')}</button>
    </article>
  );
}
