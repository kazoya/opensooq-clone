import React, { useState, useEffect } from 'react';
import { t, useLang } from './i18n';
import { useTheme } from './theme';
import Toggles from './components/Toggles';
import AdminPanel from './components/AdminPanel';
import { getCategories, getCities, getAds, getAdById, createAd, deleteAd, register, login, getMe, logout, uploadAdImage, getMyAds } from './api';
import Home from './components/Home';
import AdDetail from './components/AdDetail';
import PostAd from './components/PostAd';
import AuthForm from './components/AuthForm';
import MyAds from './components/MyAds';

const App = () => {
  useLang();
  useTheme();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [editTokenMap, setEditTokenMap] = useState({});
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [authFormVisible, setAuthFormVisible] = useState(false);
  const [authFormType, setAuthFormType] = useState('login'); // 'login' or 'register'
  const [authFormError, setAuthFormError] = useState('');
  const [pendingView, setPendingView] = useState(null);

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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    };
    checkAuth();
  }, []);

  const handleSelectAd = (id) => {
    setSelectedAdId(id);
    setView('detail');
  };

  const handleGoBack = () => {
    setSelectedAdId(null);
    setView('home');
  };

  const handleCreateAd = () => {
    if (!user) {
      setAuthFormVisible(true);
      setAuthFormType('login');
      setPendingView('post');
    } else {
      setView('post');
    }
  };

  const handlePostAd = async (adData, imageFile) => {
    try {
      const newAd = await createAd({ ...adData, sellerName: user ? user.name : adData.sellerName });
      setSelectedAdId(newAd.id);
      setEditTokenMap(prevMap => ({ ...prevMap, [newAd.id]: newAd.editToken }));
      localStorage.setItem(`editToken-${newAd.id}`, newAd.editToken);
      if (imageFile) await uploadAdImage(newAd.id, imageFile);
      setView('detail');
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteAd = async (id) => {
    try {
      await deleteAd(id);
      setSelectedAdId(null);
      setEditTokenMap(prevMap => {
        const newMap = { ...prevMap };
        delete newMap[id];
        return newMap;
      });
      localStorage.removeItem(`editToken-${id}`);
      setView('home');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuthSubmit = async (userData) => {
    try {
      let response;
      if (authFormType === 'register') {
        response = await register(userData);
      } else {
        response = await login(userData);
      }
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setAuthFormVisible(false);
      if (pendingView) {
        setView(pendingView);
        setPendingView(null);
      }
    } catch (error) {
      setAuthFormError(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleAuthToggle = () => {
    setAuthFormError('');
    setAuthFormType(authFormType === 'login' ? 'register' : 'login');
  };

  return (
    <div className="app">
      <header className="site-header">
        <button type="button" className="brand" onClick={handleGoBack} data-testid="brand">
          <span className="brand-mark" aria-hidden="true">◆</span>
          <span>{t('السوق المفتوح')}</span>
        </button>
        <nav className="nav">
        {user ? (
          <>
            <span className="user-chip" data-testid="user-name">{user.name}</span>
            {user.role === 'admin' && (
              <button className="btn-ghost" onClick={() => setView('admin')} data-testid="nav-admin">{t('لوحة المدير')}</button>
            )}
            <button className="btn-ghost" onClick={() => setView('my-ads')} data-testid="nav-my-ads">{t('إعلاناتي')}</button>
            <button className="btn-ghost" onClick={() => { handleLogout(); setView('home'); }} data-testid="logout">{t('تسجيل الخروج')}</button>
          </>
        ) : (
          <button className="btn-ghost" onClick={() => { setAuthFormVisible(true); setAuthFormType('login'); }} data-testid="nav-login">{t('تسجيل الدخول')}</button>
        )}
          <Toggles />
        </nav>
      </header>
      <main>
      {authFormVisible && (
        <AuthForm
          type={authFormType}
          onSubmit={handleAuthSubmit}
          onToggle={handleAuthToggle}
          error={authFormError}
        />
      )}
      {view === 'home' && (
        <Home
          categories={categories}
          cities={cities}
          onAdSelect={handleSelectAd}
          onCreateAd={handleCreateAd}
        />
      )}
      {view === 'detail' && (
        <AdDetail
          adId={selectedAdId}
          onGoBack={handleGoBack}
          onDeleteAd={handleDeleteAd}
          userId={user ? user.id : null}
        />
      )}
      {view === 'post' && (
        <PostAd
          onSubmit={handlePostAd}
          userId={user ? user.id : null}
        />
      )}
      {view === 'my-ads' && (
        <>
        <button className="btn-ghost back" data-testid="back" onClick={handleGoBack}>{t('رجوع')}</button>
        <MyAds
          onOpen={id => { setView('detail'); setSelectedAdId(id); }}
          onDelete={handleDeleteAd}
          onPost={handleCreateAd}
        />
        </>
      )}
      {view === 'admin' && user && user.role === 'admin' && (
        <>
          <button className="btn-ghost back" data-testid="back" onClick={handleGoBack}>{t('رجوع')}</button>
          <AdminPanel />
        </>
      )}
      </main>
    </div>
  );
};

export default App;
