import React, { useState, useEffect } from 'react';
import { t, tf } from '../i18n';
import { getCategories, getCities, createAd } from '../api';

const PostAd = ({ onSubmit }) => {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    const fetchCategoriesData = async () => {
      const data = await getCategories();
      setCategories(data);
    };
    fetchCategoriesData();
  }, []);

  useEffect(() => {
    const fetchCitiesData = async () => {
      const data = await getCities();
      setCities(data);
    };
    fetchCitiesData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const adData = {
        title,
        description,
        price: parseFloat(price),
        categoryId,
        cityId,
        sellerName,
        phone
      };
      await onSubmit(adData, image);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div>
      <h1>{t('إنشاء إعلان')}</h1>
      {errorMessage && <p data-testid="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          {t('العنوان:')}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="ad-title" />
        </label>
        <label>
          {t('الوصف:')}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="ad-description" />
        </label>
        <label>
          {t('السعر:')}
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="ad-price" />
        </label>
        <label>
          {t('الفئة:')}
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} data-testid="ad-category">
            <option value="">{t('اختر الفئة')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{tf(category, 'name')}</option>
            ))}
          </select>
        </label>
        <label>
          {t('المدينة:')}
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} data-testid="ad-city">
            <option value="">{t('اختر المدينة')}</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{tf(city, 'name')}</option>
            ))}
          </select>
        </label>
        <label>
          {t('البائع:')}
          <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} data-testid="ad-seller" />
        </label>
        <label>
          {t('الهاتف:')}
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="ad-phone" />
        </label>
        <label>
          {t('الصورة:')}
          <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="ad-image-input" onChange={e => setImage(e.target.files[0] || null)} />
        </label>
        <button type="submit" data-testid="submit-ad">{t('إنشاء')}</button>
      </form>
    </div>
  );
};

export default PostAd;
