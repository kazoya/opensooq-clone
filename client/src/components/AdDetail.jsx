import React, { useState, useEffect } from 'react';
import { getAdById } from '../api';

const AdDetail = ({ adId, onGoBack, onDeleteAd, userId }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const adData = await getAdById(adId);
        setAd(adData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId]);

  if (loading) {
    return <div data-testid="ad-detail">Loading...</div>;
  }

  if (error) {
    return <div data-testid="ad-detail">Error: {error}</div>;
  }

  if (!ad) {
    return <div data-testid="ad-detail">Ad not found</div>;
  }

  const canDelete = (userId && ad.userId === userId) || !!localStorage.getItem(`editToken-${adId}`);

  return (
    <div data-testid="ad-detail">
      <h2>{ad.title}</h2>
      {ad.imageUrl && <img data-testid="ad-image" src={ad.imageUrl} alt={ad.title} style={{maxWidth:'100%'}} />}
      <p>الوصف: {ad.description}</p>
      <p>التصنيف: {ad.categoryName}</p>
      <p>المدينة: {ad.cityName}</p>
      <p>السعر: {ad.price}</p>
      <p>البائع: {ad.sellerName}</p>
      <p>الهاتف: {ad.phone}</p>
      <p>المشاهدات: {ad.views}</p>
      {canDelete && (
        <button onClick={() => onDeleteAd(adId)} data-testid="delete-ad">حذف الإعلان</button>
      )}
      <button onClick={onGoBack} data-testid="back">رجوع</button>
    </div>
  );
};

export default AdDetail;
