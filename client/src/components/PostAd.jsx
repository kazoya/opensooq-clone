import React, { useState, useEffect } from 'react';
import { t, tf } from '../i18n';

// Post an ad: category -> sub-category, the category's own fields, condition, and up to 5 photos.
const PostAd = ({ onSubmit, categories = [], cities = [], user }) => {
  const [f, setF] = useState({ title: '', description: '', price: '', cityId: '', phone: '', condition: '' });
  const [rootId, setRootId] = useState('');
  const [subId, setSubId] = useState('');
  const [attrs, setAttrs] = useState({});
  const [images, setImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const roots = categories.filter((c) => !c.parentId);
  const subs = categories.filter((c) => c.parentId === rootId);
  const schema = (roots.find((c) => c.id === rootId) || {}).attributes || [];
  useEffect(() => { setSubId(''); setAttrs({}); }, [rootId]);
  const previews = React.useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pick = (e) => {
    const chosen = [...images, ...Array.from(e.target.files || [])];
    if (chosen.length > 5) setErrorMessage(t('الحد الأقصى 5 صور'));
    setImages(chosen.slice(0, 5)); e.target.value = '';
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    if (subs.length && !subId) return setErrorMessage(t('اختر التصنيف الفرعي'));
    const attributes = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== ''));
    setBusy(true);
    try {
      await onSubmit({ ...f, price: parseFloat(f.price), categoryId: subId || rootId, attributes, condition: f.condition || undefined, sellerName: user && user.name }, images);
    } catch (error) { setErrorMessage(t(error.message)); } finally { setBusy(false); }
  };

  return (
    <div className="post-ad">
      <h1>{t('إنشاء إعلان')}</h1>
      {errorMessage && <p role="alert" data-testid="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <label>{t('العنوان:')}<input type="text" value={f.title} onChange={set('title')} data-testid="ad-title" required minLength={3} maxLength={100} /></label>
        <div className="form-row">
          <label>{t('الفئة:')}
            <select value={rootId} onChange={(e) => setRootId(e.target.value)} data-testid="ad-category" required>
              <option value="">{t('اختر الفئة')}</option>
              {roots.map((c) => <option key={c.id} value={c.id}>{tf(c, 'name')}</option>)}
            </select>
          </label>
          {subs.length > 0 && <label>{t('التصنيف الفرعي')}
            <select value={subId} onChange={(e) => setSubId(e.target.value)} data-testid="ad-subcategory" required>
              <option value="">{t('اختر')}</option>
              {subs.map((c) => <option key={c.id} value={c.id}>{tf(c, 'name')}</option>)}
            </select>
          </label>}
        </div>
        {schema.length > 0 && <fieldset className="form-row" data-testid="ad-attr-fields"><legend>{t('تفاصيل إضافية')}</legend>
          {schema.map((s) => <label key={s.key}>{tf(s, 'label')}
            {s.type === 'enum'
              ? <select value={attrs[s.key] || ''} onChange={(e) => setAttrs({ ...attrs, [s.key]: e.target.value })} data-testid={`ad-attr-${s.key}`}><option value="">{t('اختر')}</option>{s.values.map((v) => <option key={v} value={v}>{t(v)}</option>)}</select>
              : <input type="number" min={s.min} max={s.max} value={attrs[s.key] || ''} onChange={(e) => setAttrs({ ...attrs, [s.key]: e.target.value })} data-testid={`ad-attr-${s.key}`} />}
          </label>)}
        </fieldset>}
        <label>{t('الوصف:')}<textarea value={f.description} onChange={set('description')} data-testid="ad-description" required maxLength={3000} /></label>
        <div className="form-row">
          <label>{t('السعر:')}<input type="number" min="0" value={f.price} onChange={set('price')} data-testid="ad-price" required /></label>
          <label>{t('حالة السلعة')}
            <select value={f.condition} onChange={set('condition')} data-testid="ad-condition">
              <option value="">{t('غير محدد')}</option><option value="جديد">{t('جديد')}</option><option value="مستعمل">{t('مستعمل')}</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>{t('المدينة:')}
            <select value={f.cityId} onChange={set('cityId')} data-testid="ad-city" required>
              <option value="">{t('اختر المدينة')}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{tf(c, 'name')}</option>)}
            </select>
          </label>
          <label>{t('الهاتف:')}<input type="tel" value={f.phone} onChange={set('phone')} data-testid="ad-phone" required /></label>
        </div>
        <label>{t('الصور (حتى 5، الأولى هي الغلاف)')}
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" data-testid="ad-image-input" onChange={pick} disabled={images.length >= 5} />
        </label>
        {previews.length > 0 && <div className="thumbs" data-testid="image-previews">
          {previews.map((src, i) => <span key={src} className="thumb-item"><img src={src} alt={`${i + 1}`} /><button type="button" className="thumb-del" aria-label={t('حذف الصورة')} onClick={() => setImages(images.filter((_, j) => j !== i))}>×</button></span>)}
        </div>}
        <button type="submit" data-testid="submit-ad" disabled={busy}>{busy ? t('جار النشر...') : t('إنشاء')}</button>
      </form>
    </div>
  );
};
export default PostAd;
