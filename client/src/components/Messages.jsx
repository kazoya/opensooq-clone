import React, { useEffect, useState } from 'react';
import { t, tf, getLang } from '../i18n';
import { market } from '../marketApi';

const time = (d) => new Date(d).toLocaleString(getLang() === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });

// Inbox (conversation list) + thread view with reply box. Works for both buyer and seller.
export default function Messages({ onOpenAd, onUnread }) {
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const refresh = () => market.conversations().then((c) => { setConvs(c); onUnread && onUnread(c.reduce((s, x) => s + x.unread, 0)); }).catch((e) => setError(e.message));
  useEffect(() => { refresh(); }, []);
  const open = async (c) => { setActive(c); setMsgs(await market.thread(c.adId, c.buyerId)); refresh(); };
  const reply = async (e) => {
    e.preventDefault();
    try { await market.send(active.adId, body, active.buyerId); setBody(''); setMsgs(await market.thread(active.adId, active.buyerId)); refresh(); } catch (err) { setError(err.message); }
  };
  return (
    <section data-testid="messages" className="inbox">
      <h1>✉ {t('الرسائل')}</h1>
      {error && <p role="alert">{t(error)}</p>}
      <div className="inbox-grid">
        <ul className="conv-list" data-testid="conv-list">
          {convs && !convs.length && <li className="empty">{t('لا توجد محادثات بعد')}</li>}
          {(convs || []).map((c) => (
            <li key={c.thread}>
              <button type="button" aria-pressed={active && active.thread === c.thread} onClick={() => open(c)} data-testid="conv-item">
                {c.ad && c.ad.imageUrl && <img src={c.ad.imageUrl} alt="" />}
                <span className="conv-text"><strong>{c.other.name}</strong><span className="muted">{c.ad ? tf(c.ad, 'title') : t('إعلان محذوف')}</span><span className="muted clip">{c.last.body}</span></span>
                {c.unread > 0 && <span className="unread" data-testid="conv-unread">{c.unread}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="thread-pane">
          {!active ? <p className="muted">{t('اختر محادثة لعرضها')}</p> : (
            <>
              <div className="thread-head">
                <strong>{active.other.name}</strong>
                {active.ad && <button type="button" className="link" onClick={() => onOpenAd(active.adId)}>{tf(active.ad, 'title')}</button>}
              </div>
              <ul className="thread" data-testid="thread">
                {msgs.map((m) => <li key={m.id} className={m.mine ? 'mine' : ''}><span>{m.body}</span><time>{time(m.createdAt)}</time></li>)}
              </ul>
              <form onSubmit={reply} className="reply" data-testid="reply-form">
                <label className="sr-only" htmlFor="reply">{t('ردك')}</label>
                <input id="reply" value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('اكتب رسالة...')} data-testid="reply-input" maxLength={1000} />
                <button type="submit" disabled={!body.trim()} data-testid="reply-send">{t('إرسال')}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
