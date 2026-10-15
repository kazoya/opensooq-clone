import React, { useEffect, useState } from 'react';
import { t, tf } from '../i18n';
import { getMyAds } from '../api';

const MyAds = ({ onOpen, onDelete, onPost }) => {
  const [ads, setAds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyAds = async () => {
      try {
        const data = await getMyAds();
        setAds(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMyAds();
  }, []);

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={onPost}>{t('إنشاء إعلان جديد')}</button>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div>
        <p>{t('لا توجد إعلانات بعد')}</p>
        <button onClick={onPost}>{t('إنشاء إعلان جديد')}</button>
      </div>
    );
  }

  return (
    <div>
      {ads.map(ad => (
        <div key={ad.id} data-testid="my-ad">
          {ad.imageUrl && <img src={ad.imageUrl} alt={tf(ad, 'title')} />}
          <h3>{tf(ad, 'title')}</h3>
          <p>{t('السعر:')} {ad.price}</p>
          <p>{t('المدينة:')} {tf(ad, 'cityName')}{t(', التصنيف:')} {tf(ad, 'categoryName')}</p>
          <p>{t('المشاهدات:')} {ad.views}</p>
          <button onClick={() => onOpen(ad.id)}>{t('عرض')}</button>
          <button data-testid="my-ad-delete" onClick={() => onDelete(ad.id)}>{t('حذف')}</button>
        </div>
      ))}
    </div>
  );
};

export default MyAds;
