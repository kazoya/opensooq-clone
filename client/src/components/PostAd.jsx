import React, { useState, useEffect } from 'react';
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
      <h1>إنشاء إعلان</h1>
      {errorMessage && <p data-testid="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          العنوان:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="ad-title" />
        </label>
        <label>
          الوصف:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="ad-description" />
        </label>
        <label>
          السعر:
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="ad-price" />
        </label>
        <label>
          الفئة:
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} data-testid="ad-category">
            <option value="">اختر الفئة</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          المدينة:
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} data-testid="ad-city">
            <option value="">اختر المدينة</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </label>
        <label>
          البائع:
          <input type="text" value={sellerName} onChange={(e) => setSellerName(e.target.value)} data-testid="ad-seller" />
        </label>
        <label>
          الهاتف:
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="ad-phone" />
        </label>
        <label>
          الصورة:
          <input type="file" accept="image/png,image/jpeg,image/webp" data-testid="ad-image-input" onChange={e => setImage(e.target.files[0] || null)} />
        </label>
        <button type="submit" data-testid="submit-ad">إنشاء</button>
      </form>
    </div>
  );
};

export default PostAd;
