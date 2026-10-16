import React, { useState, useEffect } from 'react';
import { t } from '../i18n';
import { adminApi } from '../adminApi';
import { market } from '../marketApi';

const TAB_LABELS = { stats: 'الإحصائيات', users: 'المستخدمون', ads: 'الإعلانات', reports: 'البلاغات', 'categories-cities': 'التصنيفات والمدن' };
const STAT_LABELS = { users: 'المستخدمون', ads: 'الإعلانات', categories: 'التصنيفات', cities: 'المدن', views: 'المشاهدات' };
const REPORT_STATUS = { open: 'مفتوح', dismissed: 'تم التجاهل', ad_removed: 'تم حذف الإعلان' };
const ROLE_LABELS = { admin: 'مدير', user: 'مستخدم' };

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      try {
        switch (activeTab) {
          case 'stats':
            setStats(await adminApi.stats());
            break;
          case 'users':
            setUsers(await adminApi.users());
            break;
          case 'ads':
            setAds(await adminApi.ads());
            break;
          case 'reports':
            setReports(await market.adminReports());
            break;
          case 'categories-cities':
            setCategories(await adminApi.categories());
            setCities(await adminApi.cities());
            break;
          default:
            break;
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleToggleUser = async (userId, disabled) => {
    try {
      await adminApi.setUserDisabled(userId, !disabled);
      setUsers(await adminApi.users());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm(t('هل أنت متأكد من الحذف؟'))) {
      try {
        await adminApi.deleteAd(adId);
        setAds(await adminApi.ads());
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const [categoryName, setCategoryName] = useState('');
  const [cityName, setCityName] = useState('');

  const handleDeletePlace = async (kind, id) => {
    if (!window.confirm(t('هل أنت متأكد من الحذف؟'))) return;
    try {
      if (kind === 'category') {
        await adminApi.deleteCategory(id);
        setCategories(await adminApi.categories());
      } else {
        await adminApi.deleteCity(id);
        setCities(await adminApi.cities());
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (categoryName.trim()) {
      try {
        await adminApi.addCategory(categoryName);
        setCategoryName('');
        setCategories(await adminApi.categories());
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddCity = async () => {
    if (cityName.trim()) {
      try {
        await adminApi.addCity(cityName);
        setCityName('');
        setCities(await adminApi.cities());
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <section data-testid="admin-panel" className="admin">
      <nav className="admin-tabs">
        {['stats', 'users', 'ads', 'reports', 'categories-cities'].map(tab => (
          <button
            key={tab}
            type="button"
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {t(TAB_LABELS[tab])}
          </button>
        ))}
      </nav>

      {error ? <p data-testid="error-message" role="alert">{t(error)}</p> : null}

      {activeTab === 'stats' && (
        stats ? (
          <div className="kpi-grid">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="kpi" data-testid={`admin-stat-${key}`}>
                <div className="kpi-label">{t(STAT_LABELS[key] || key)}</div>
                <div className="kpi-value">{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('جار التحميل...')}</p>
        )
      )}

      {activeTab === 'users' && (
        users.length > 0 ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('الاسم')}</th>
                  <th>{t('البريد الإلكتروني')}</th>
                  <th>{t('الدور')}</th>
                  <th>{t('الحالة')}</th>
                  <th><span className="sr-only">{t('إجراءات')}</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} data-testid="admin-user-row">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{t(ROLE_LABELS[user.role] || 'مستخدم')}</td>
                    <td>{t(user.disabled ? 'معطل' : 'نشط')}</td>
                    {user.role === 'admin' ? <td /> : (
                      <td>
                        <button
                          type="button"
                          data-testid="admin-toggle-user"
                          onClick={() => handleToggleUser(user.id, user.disabled)}
                        >
                          {t(user.disabled ? 'تفعيل' : 'تعطيل')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('لا توجد بيانات')}</p>
        )
      )}

      {activeTab === 'ads' && (
        ads.length > 0 ? (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('العنوان')}</th>
                  <th>{t('السعر')}</th>
                  <th>{t('المدينة')}</th>
                  <th>{t('التصنيف')}</th>
                  <th>{t('البائع')}</th>
                  <th>{t('المشاهدات')}</th>
                  <th>{t('مميز')}</th>
                  <th><span className="sr-only">{t('إجراءات')}</span></th>
                </tr>
              </thead>
              <tbody>
                {ads.map(ad => (
                  <tr key={ad.id} data-testid="admin-ad-row">
                    <td>{ad.title}</td>
                    <td>{ad.price}</td>
                    <td>{ad.cityName}</td>
                    <td>{ad.categoryName}</td>
                    <td>{ad.sellerName}</td>
                    <td>{ad.views}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!ad.featured} data-testid="admin-featured" aria-label={`${t('مميز')}: ${ad.title}`}
                          onChange={async (e) => { const on = e.target.checked; try { await market.setFeatured(ad.id, on); setAds(ads.map((a) => (a.id === ad.id ? { ...a, featured: on } : a))); } catch (err) { setError(err.message); } }} />
                        <span>{ad.featured ? '★' : '☆'}</span>
                      </label>
                    </td>
                    <td>
                      <button
                        type="button"
                        data-testid="admin-delete-ad"
                        onClick={() => handleDeleteAd(ad.id)}
                      >
                        {t('حذف')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('لا توجد بيانات')}</p>
        )
      )}

      {activeTab === 'reports' && (
        reports.length ? (
          <div className="table-wrap">
            <table className="admin-table" data-testid="admin-reports">
              <thead><tr><th>{t('الإعلان')}</th><th>{t('سبب البلاغ')}</th><th>{t('ملاحظات')}</th><th>{t('المبلّغ')}</th><th>{t('الحالة')}</th><th><span className="sr-only">{t('إجراءات')}</span></th></tr></thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} data-testid="admin-report-row">
                    <td>{r.ad ? r.ad.title : <em>{t('إعلان محذوف')}</em>}</td>
                    <td>{t(r.reason)}</td>
                    <td>{r.note || '—'}</td>
                    <td>{r.reporter || '—'}</td>
                    <td><span className={'status-pill ' + r.status}>{t(REPORT_STATUS[r.status] || r.status)}</span></td>
                    <td><div className="row-actions">
                      {r.status === 'open' && <>
                        <button type="button" className="btn-ghost" data-testid="report-dismiss" onClick={async () => { try { await market.resolveReport(r.id, 'dismiss'); setReports(await market.adminReports()); } catch (e) { setError(e.message); } }}>{t('تجاهل')}</button>
                        <button type="button" data-testid="admin-delete-reported" onClick={async () => { if (!window.confirm(t('حذف الإعلان المبلّغ عنه؟'))) return; try { await market.resolveReport(r.id, 'remove_ad'); setReports(await market.adminReports()); } catch (e) { setError(e.message); } }}>{t('حذف الإعلان')}</button>
                      </>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p data-testid="no-reports">{t('لا توجد بلاغات')}</p>
      )}

      {activeTab === 'categories-cities' && (
        <div className="categories-cities">
          <div className="category-list">
            <h3>{t('التصنيفات')}</h3>
            <label className="sr-only" htmlFor="admin-category-name">{t('اسم التصنيف')}</label>
            <input type="text" id="admin-category-name" data-testid="admin-category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder={t('اسم التصنيف')} />
            <button type="button" onClick={handleAddCategory} data-testid="admin-add-category">
              {t('إضافة تصنيف')}
            </button>
            <ul>
              {categories.map(category => (
                <li key={category.id}>
                  {category.name}
                  <button
                    type="button"
                    onClick={() => handleDeletePlace('category', category.id)}
                    data-testid="admin-delete-category"
                  >
                    {t('حذف')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="city-list">
            <h3>{t('المدن')}</h3>
            <label className="sr-only" htmlFor="admin-city-name">{t('اسم المدينة')}</label>
            <input type="text" id="admin-city-name" data-testid="admin-city-name" value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder={t('اسم المدينة')} />
            <button type="button" onClick={handleAddCity} data-testid="admin-add-city">
              {t('إضافة مدينة')}
            </button>
            <ul>
              {cities.map(city => (
                <li key={city.id}>
                  {city.name}
                  <button
                    type="button"
                    onClick={() => handleDeletePlace('city', city.id)}
                    data-testid="admin-delete-city"
                  >
                    {t('حذف')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
