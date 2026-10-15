import React, { useEffect, useState } from 'react';
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
        <button onClick={onPost}>إنشاء إعلان جديد</button>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div>
        <p>لا توجد إعلانات بعد</p>
        <button onClick={onPost}>إنشاء إعلان جديد</button>
      </div>
    );
  }

  return (
    <div>
      {ads.map(ad => (
        <div key={ad.id} data-testid="my-ad">
          {ad.imageUrl && <img src={ad.imageUrl} alt="thumbnail" />}
          <h3>{ad.title}</h3>
          <p>السعر: {ad.price}</p>
          <p>المدينة: {ad.cityName}, التصنيف: {ad.categoryName}</p>
          <p>المشاهدات: {ad.views}</p>
          <button onClick={() => onOpen(ad.id)}>عرض</button>
          <button data-testid="my-ad-delete" onClick={() => onDelete(ad.id)}>حذف</button>
        </div>
      ))}
    </div>
  );
};

export default MyAds;
