import React, { useState, useEffect } from 'react';
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
        <h1>ابحث عن أي شيء قريب منك</h1>
        <p>آلاف الإعلانات في السيارات والعقارات والإلكترونيات</p>
      </section>
      <div>
        <label>
          فئة:
          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} data-testid="filter-category">
            <option value="">الكل</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          مدينة:
          <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)} data-testid="filter-city">
            <option value="">الكل</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </label>
        <label>
          البحث:
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="search-input" />
        </label>
        <label>
          ترتيب:
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} data-testid="sort-select">
            <option value="">الجديد أولاً</option>
            <option value="price_asc">السعر من الأقل للأعلى</option>
            <option value="price_desc">السعر من الأعلى للأقل</option>
          </select>
        </label>
        <button onClick={onCreateAd} data-testid="post-ad-button">إنشاء إعلان</button>
      </div>
      <p className="trust">نصيحة أمان: قابل البائع في مكان عام ولا تحوّل أي مبلغ قبل المعاينة.</p>
      <div data-testid="ad-list">
        {ads.map(ad => (
          <div key={ad.id} className="ad-card" data-testid="ad-card">
            <h2>{ad.title}</h2>
            {ad.imageUrl && <img data-testid="ad-thumb" src={ad.imageUrl} alt={ad.title} />}
            <p>السعر: {ad.price}</p>
            <p>المدينة: {ad.cityName}</p>
            <p>الفئة: {ad.categoryName}</p>
            <p>التاريخ: {new Date(ad.createdAt).toLocaleDateString()}</p>
            <button onClick={() => onAdSelect(ad.id)}>تفاصيل</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
