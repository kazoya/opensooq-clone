import React, { useState, useEffect } from 'react';
import { t, tf, getLang } from '../i18n';
import { getCategories, getCities, getAds } from '../api';

const Home = ({ categories, cities, onAdSelect, onCreateAd }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const fetchAdsData = async () => {
      const params = {
        categoryId: selectedCategoryId,
        cityId: selectedCityId,
        q: searchQuery,
        minPrice: '',
        maxPrice: '',
        sort: sortOption
      };
      const data = await getAds(params);
      setAds(data);
    };
    fetchAdsData();
  }, [selectedCategoryId, selectedCityId, searchQuery, sortOption]);

  return (
    <div>
      <section className="hero">
        <h1>{t('ابحث عن أي شيء قريب منك')}</h1>
        <p>{t('آلاف الإعلانات في السيارات والعقارات والإلكترونيات')}</p>
      </section>
      <div className="search-panel">
        <label>
          {t('فئة:')}
          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} data-testid="filter-category">
            <option value="">{t('الكل')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{tf(category, 'name')}</option>
            ))}
          </select>
        </label>
        <label>
          {t('مدينة:')}
          <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} data-testid="filter-city">
            <option value="">{t('الكل')}</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{tf(city, 'name')}</option>
            ))}
          </select>
        </label>
        <label>
          {t('البحث:')}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="search-input" />
        </label>
        <label>
          {t('ترتيب:')}
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} data-testid="sort-select">
            <option value="">{t('الجديد أولاً')}</option>
            <option value="price_asc">{t('السعر من الأقل للأعلى')}</option>
            <option value="price_desc">{t('السعر من الأعلى للأقل')}</option>
          </select>
        </label>
        <button onClick={onCreateAd} data-testid="post-ad-button">{t('إنشاء إعلان')}</button>
      </div>
      <p className="trust">{t('نصيحة أمان: قابل البائع في مكان عام ولا تحوّل أي مبلغ قبل المعاينة.')}</p>
      <div data-testid="ad-list">
        {ads.map(ad => (
          <div key={ad.id} className="ad-card" data-testid="ad-card">
            {ad.imageUrl && <img data-testid="ad-thumb" src={ad.imageUrl} alt={tf(ad, 'title')} loading="lazy" />}
            <h2>{tf(ad, 'title')}</h2>
            <p className="ad-price" data-testid="ad-card-price"><bdi>{Number(ad.price).toLocaleString(getLang() === 'ar' ? 'ar-SA' : 'en-US')}</bdi> {t('ريال')}</p>
            <p className="ad-meta"><span>{tf(ad, 'cityName')}</span><span>{tf(ad, 'categoryName')}</span></p>
            <p>{new Date(ad.createdAt).toLocaleDateString(getLang() === 'ar' ? 'ar-SA' : 'en-US')}</p>
            <button onClick={() => onAdSelect(ad.id)}>{t('تفاصيل')}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
