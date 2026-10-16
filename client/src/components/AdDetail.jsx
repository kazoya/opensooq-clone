import React, { useState, useEffect } from 'react';
import { t, tf, getLang } from '../i18n';
import { market } from '../marketApi';
import { price } from './AdCard';

const dateFmt = (d) => new Date(d).toLocaleDateString(getLang() === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long' });

// Ad page: gallery, attributes, seller card, message box, report dialog, favorite. Owner can remove images / delete.
const AdDetail = ({ adId, onGoBack, onDeleteAd, user, onNeedLogin, onOpenSeller, onOpenMessages }) => {
  const [ad, setAd] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [fav, setFav] = useState(false);
  const [msg, setMsg] = useState('');
  const [thread, setThread] = useState([]);
  const [note, setNote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [reason, setReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const userId = user && user.id;

  const load = async () => {
    try { const a = await market.ad(adId); setAd(a); setFav(!!a.favorite); setIdx(0); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); market.meta().then((m) => setReasons(m.reportReasons)).catch(() => {}); }, [adId, userId]);
  useEffect(() => {
    if (ad && userId && ad.userId !== userId) market.thread(ad.id, userId).then(setThread).catch(() => setThread([]));
  }, [ad && ad.id, userId]);

  if (error) return <div data-testid="ad-detail" role="alert">{t(error)} <button onClick={onGoBack} data-testid="back">{t('رجوع')}</button></div>;
  if (!ad) return <div data-testid="ad-detail">{t('جار التحميل...')}</div>;
  const images = ad.images && ad.images.length ? ad.images : ad.imageUrl ? [ad.imageUrl] : [];
  const isOwner = userId && ad.userId === userId;
  const canDelete = isOwner || (user && user.role === 'admin');

  const toggleFav = async () => {
    if (!user) return onNeedLogin();
    const next = !fav; setFav(next);
    try { await market.setFavorite(ad.id, next); } catch { setFav(!next); }
  };
  const send = async (e) => {
    e.preventDefault(); if (!user) return onNeedLogin();
    try { await market.send(ad.id, msg); setMsg(''); setNote(t('تم إرسال رسالتك للبائع')); setThread(await market.thread(ad.id, userId)); } catch (err) { setNote(t(err.message)); }
  };
  const report = async (e) => {
    e.preventDefault();
    try { await market.report(ad.id, reason, reportNote); setReportOpen(false); setNote(t('شكراً، تم استلام البلاغ وسيراجعه فريق الإدارة')); } catch (err) { setNote(t(err.message)); }
  };
  const removeImage = async (i) => {
    try { const r = await market.deleteImage(ad.id, i); setAd({ ...ad, images: r.images, imageUrl: r.images[0] }); setIdx(0); } catch (err) { setNote(t(err.message)); }
  };

  return (
    <div data-testid="ad-detail" className="ad-page">
      <button className="btn-ghost back" onClick={onGoBack} data-testid="back">{t('رجوع')}</button>
      <div className="ad-layout">
        <section className="gallery" aria-label={t('الصور')}>
          {images.length > 0 ? (
            <>
              <div className="gallery-main">
                <img data-testid="ad-image" src={images[idx]} alt={`${tf(ad, 'title')} (${idx + 1}/${images.length})`} />
                {images.length > 1 && <>
                  <button type="button" className="gal-nav prev" aria-label={t('الصورة السابقة')} data-testid="gal-prev" onClick={() => setIdx((idx - 1 + images.length) % images.length)}>‹</button>
                  <button type="button" className="gal-nav next" aria-label={t('الصورة التالية')} data-testid="gal-next" onClick={() => setIdx((idx + 1) % images.length)}>›</button>
                  <span className="gal-count" data-testid="gal-count">{idx + 1} / {images.length}</span>
                </>}
                {ad.featured && <span className="badge-featured">★ {t('مميز')}</span>}
              </div>
              {images.length > 1 && <div className="thumbs">
                {images.map((src, i) => (
                  <span key={src + i} className="thumb-item">
                    <button type="button" aria-pressed={i === idx} data-testid="gal-thumb" onClick={() => setIdx(i)}><img src={src} alt="" /></button>
                    {isOwner && <button type="button" className="thumb-del" aria-label={t('حذف الصورة')} data-testid="img-delete" onClick={() => removeImage(i)}>×</button>}
                  </span>
                ))}
              </div>}
            </>
          ) : <div className="no-image">{t('لا توجد صور')}</div>}
        </section>

        <section className="ad-info">
          <p className="crumbs">{ad.rootCategory && tf(ad.rootCategory, 'name')}{ad.rootCategory && ad.rootCategory.id !== ad.categoryId && <> › {tf(ad, 'categoryName')}</>}</p>
          <h1 data-testid="ad-detail-title">{tf(ad, 'title')}</h1>
          <p className="ad-price big" data-testid="ad-detail-price"><bdi>{price(ad.price)}</bdi> {t('ريال')}</p>
          <p className="ad-meta"><span>📍 {tf(ad, 'cityName')}</span>{ad.condition && <span>{t(ad.condition)}</span>}<span>👁 {ad.views} {t('مشاهدة')}</span></p>
          <div className="row-actions">
            <button type="button" className={'fav-btn inline' + (fav ? ' on' : '')} aria-pressed={fav} data-testid="detail-fav" onClick={toggleFav}>{fav ? '♥ ' + t('في المفضلة') : '♡ ' + t('أضف للمفضلة')}</button>
            {!isOwner && <button type="button" className="btn-ghost" data-testid="report-open" onClick={() => (user ? setReportOpen(true) : onNeedLogin())}>⚑ {t('إبلاغ عن الإعلان')}</button>}
            {canDelete && <button onClick={() => onDeleteAd(adId)} data-testid="delete-ad">{t('حذف الإعلان')}</button>}
          </div>
          {note && <p className="notice" role="status" data-testid="ad-notice">{note}</p>}
          {ad.schema && ad.schema.length > 0 && ad.attributes && (
            <dl className="attrs" data-testid="ad-attrs">
              {ad.schema.filter((f) => ad.attributes[f.key] != null).map((f) => (
                <div key={f.key}><dt>{tf(f, 'label')}</dt><dd>{typeof ad.attributes[f.key] === 'number' ? (f.key === 'year' ? ad.attributes[f.key] : price(ad.attributes[f.key])) : t(ad.attributes[f.key])}</dd></div>
              ))}
            </dl>
          )}
          <h2>{t('الوصف')}</h2>
          <p className="desc">{tf(ad, 'description')}</p>

          {ad.seller && (
            <div className="seller-card" data-testid="seller-card">
              <span className="avatar" aria-hidden="true">{(ad.seller.name || '?').slice(0, 1)}</span>
              <div>
                <strong>{ad.seller.name}</strong>
                <p className="muted">{t('عضو منذ')} {dateFmt(ad.seller.memberSince)} · {ad.seller.adCount} {t('إعلان')}</p>
                <p className="muted">{t('الهاتف:')} <bdi>{ad.phone}</bdi></p>
              </div>
              <button type="button" className="btn-ghost" data-testid="open-seller" onClick={() => onOpenSeller(ad.seller.id)}>{t('كل إعلانات البائع')}</button>
            </div>
          )}

          {isOwner ? (
            <p className="muted">{t('هذا إعلانك.')} <button type="button" className="link" onClick={onOpenMessages} data-testid="owner-inbox">{t('افتح الرسائل')}</button></p>
          ) : (
            <form className="msg-box" onSubmit={send} data-testid="msg-form">
              <h2>{t('راسل البائع')}</h2>
              {thread.length > 0 && <ul className="thread" data-testid="ad-thread">{thread.map((m) => <li key={m.id} className={m.mine ? 'mine' : ''}>{m.body}</li>)}</ul>}
              <label className="sr-only" htmlFor="msg">{t('رسالتك')}</label>
              <textarea id="msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('مرحباً، هل الإعلان ما زال متاحاً؟')} data-testid="msg-input" maxLength={1000} />
              <button type="submit" data-testid="msg-send" disabled={!msg.trim()}>{t('إرسال')}</button>
            </form>
          )}
        </section>
      </div>

      {reportOpen && (
        <div className="modal-backdrop" onClick={() => setReportOpen(false)}>
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="rep-title" onClick={(e) => e.stopPropagation()} onSubmit={report} data-testid="report-dialog">
            <h2 id="rep-title">{t('إبلاغ عن الإعلان')}</h2>
            <fieldset>
              <legend>{t('سبب البلاغ')}</legend>
              {reasons.map((r) => <label key={r} className="radio"><input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} data-testid="report-reason" /> {t(r)}</label>)}
            </fieldset>
            <label>{t('ملاحظات (اختياري)')}<textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} maxLength={500} data-testid="report-note" /></label>
            <div className="row-actions">
              <button type="submit" disabled={!reason} data-testid="report-submit">{t('إرسال البلاغ')}</button>
              <button type="button" className="btn-ghost" onClick={() => setReportOpen(false)}>{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default AdDetail;
