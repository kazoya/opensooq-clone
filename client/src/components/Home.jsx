import React, { useState, useEffect } from 'react';
import { t, tf } from '../i18n';
import { market } from '../marketApi';
import AdCard from './AdCard';

// Browse page: category tree (root chips + sub-category chips), per-category attribute filters, price/condition/location.
const Home = ({ categories, cities, onAdSelect, onCreateAd, user, onNeedLogin }) => {
  const [rootId, setRootId] = useState('');
  const [subId, setSubId] = useState('');
  const [cityId, setCityId] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [attrs, setAttrs] = useState({});
  const [ads, setAds] = useState([]);
  const [error, setError] = useState('');
  const roots = categories.filter((c) => !c.parentId);
  const root = roots.find((c) => c.id === rootId);
  const subs = categories.filter((c) => c.parentId === rootId);
  const schema = (root && root.attributes) || [];

  useEffect(() => { setSubId(''); setAttrs({}); }, [rootId]);
  useEffect(() => {
    const params = { categoryId: subId || rootId, cityId, q, sort, minPrice, maxPrice, condition, ...attrs };
    const h = setTimeout(() => market.ads(params).then((d) => { setAds(d); setError(''); }).catch((e) => setError(e.message)), 200);
    return () => clearTimeout(h);
  }, [rootId, subId, cityId, q, sort, minPrice, maxPrice, condition, attrs, user]);
  const setAttr = (k, v) => setAttrs((a) => ({ ...a, [k]: v }));
  const lbl = (f) => tf(f, 'label');

  return (
    <div>
      <section className="hero">
        <h1>{t('ابحث عن أي شيء قريب منك')}</h1>
        <p>{t('آلاف الإعلانات في السيارات والعقارات والإلكترونيات')}</p>
      </section>
      <div className="search-panel">
        <label>{t('البحث:')}<input type="search" value={q} onChange={(e) => setQ(e.target.value)} data-testid="search-input" /></label>
        <label>{t('مدينة:')}
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} data-testid="filter-city">
            <option value="">{t('الكل')}</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{tf(c, 'name')}</option>)}
          </select>
        </label>
        <label>{t('السعر من')}<input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} data-testid="min-price" /></label>
        <label>{t('السعر إلى')}<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} data-testid="max-price" /></label>
        <label>{t('حالة السلعة')}
          <select value={condition} onChange={(e) => setCondition(e.target.value)} data-testid="filter-condition">
            <option value="">{t('الكل')}</option><option value="جديد">{t('جديد')}</option><option value="مستعمل">{t('مستعمل')}</option>
          </select>
        </label>
        <label>{t('ترتيب:')}
          <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="sort-select">
            <option value="">{t('الجديد أولاً')}</option>
            <option value="price_asc">{t('السعر من الأقل للأعلى')}</option>
            <option value="price_desc">{t('السعر من الأعلى للأقل')}</option>
          </select>
        </label>
        {schema.map((f) => f.type === 'enum' ? (
          <label key={f.key}>{lbl(f)}
            <select value={attrs[f.key] || ''} onChange={(e) => setAttr(f.key, e.target.value)} data-testid={`attr-${f.key}`}>
              <option value="">{t('الكل')}</option>{f.values.map((v) => <option key={v} value={v}>{t(v)}</option>)}
            </select>
          </label>
        ) : f.filter === 'range' ? (
          <React.Fragment key={f.key}>
            <label>{lbl(f)} {t('من')}<input type="number" value={attrs[f.key + '_min'] || ''} onChange={(e) => setAttr(f.key + '_min', e.target.value)} data-testid={`attr-${f.key}-min`} /></label>
            <label>{lbl(f)} {t('إلى')}<input type="number" value={attrs[f.key + '_max'] || ''} onChange={(e) => setAttr(f.key + '_max', e.target.value)} data-testid={`attr-${f.key}-max`} /></label>
          </React.Fragment>
        ) : (
          <label key={f.key}>{lbl(f)} {f.filter === 'max' ? t('حتى') : t('على الأقل')}
            <input type="number" value={attrs[`${f.key}_${f.filter}`] || ''} onChange={(e) => setAttr(`${f.key}_${f.filter}`, e.target.value)} data-testid={`attr-${f.key}-${f.filter}`} />
          </label>
        ))}
        <button onClick={onCreateAd} data-testid="post-ad-button">{t('إنشاء إعلان')}</button>
      </div>
      <nav className="cat-tree" aria-label={t('التصنيفات')} data-testid="cat-tree">
        <button type="button" aria-pressed={!rootId} onClick={() => setRootId('')}>{t('الكل')}</button>
        {roots.map((c) => <button key={c.id} type="button" aria-pressed={rootId === c.id} data-testid="cat-root" onClick={() => setRootId(c.id)}>{tf(c, 'name')}</button>)}
      </nav>
      {subs.length > 0 && (
        <nav className="cat-tree sub" aria-label={t('التصنيفات الفرعية')} data-testid="cat-subs">
          <button type="button" aria-pressed={!subId} onClick={() => setSubId('')}>{t('كل')} {tf(root, 'name')}</button>
          {subs.map((c) => <button key={c.id} type="button" aria-pressed={subId === c.id} data-testid="cat-sub" onClick={() => setSubId(c.id)}>{tf(c, 'name')}</button>)}
        </nav>
      )}
      <p className="trust">{t('نصيحة أمان: قابل البائع في مكان عام ولا تحوّل أي مبلغ قبل المعاينة.')}</p>
      {error && <p role="alert" data-testid="error-message">{t(error)}</p>}
      <p className="muted" data-testid="result-count">{ads.length} {t('إعلان')}</p>
      <div data-testid="ad-list">
        {ads.map((ad) => <AdCard key={ad.id} ad={ad} onOpen={onAdSelect} user={user} onNeedLogin={onNeedLogin} />)}
      </div>
      {!ads.length && !error && <p className="empty" data-testid="no-results">{t('لا توجد إعلانات مطابقة')}</p>}
    </div>
  );
};
export default Home;
