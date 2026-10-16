import React, { useEffect, useState } from 'react';
import { t, getLang } from '../i18n';
import { market } from '../marketApi';
import AdCard from './AdCard';

export default function SellerProfile({ sellerId, onOpen, user, onNeedLogin, onBack }) {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { market.seller(sellerId).then(setS).catch((e) => setError(e.message)); }, [sellerId]);
  if (error) return <p role="alert">{t(error)}</p>;
  if (!s) return <p>{t('جار التحميل...')}</p>;
  return (
    <section data-testid="seller-profile">
      <button className="btn-ghost back" onClick={onBack} data-testid="back">{t('رجوع')}</button>
      <div className="seller-hero">
        <span className="avatar big" aria-hidden="true">{s.name.slice(0, 1)}</span>
        <div>
          <h1 data-testid="seller-name">{s.name}</h1>
          <p className="muted">{t('عضو منذ')} {new Date(s.memberSince).toLocaleDateString(getLang() === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' })}</p>
        </div>
        <div className="kpi"><div className="kpi-label">{t('الإعلانات')}</div><div className="kpi-value" data-testid="seller-ad-count">{s.adCount}</div></div>
        <div className="kpi"><div className="kpi-label">{t('المشاهدات')}</div><div className="kpi-value">{s.totalViews}</div></div>
      </div>
      <div data-testid="ad-list">{s.ads.map((ad) => <AdCard key={ad.id} ad={ad} onOpen={onOpen} user={user} onNeedLogin={onNeedLogin} />)}</div>
    </section>
  );
}
