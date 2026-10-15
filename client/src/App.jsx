import React, { useState, useEffect } from 'react';
import { getCategories, getCities, getAds, getAdById, createAd, deleteAd, register, login, getMe, logout, uploadAdImage, getMyAds } from './api';
import Home from './components/Home';
import AdDetail from './components/AdDetail';
import PostAd from './components/PostAd';
import AuthForm from './components/AuthForm';
import MyAds from './components/MyAds';

const App = () => {
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
    <div>
      <header>
        {user ? (
          <div>
            <span data-testid="user-name">{user.name}</span>
            <button onClick={handleLogout} data-testid="logout">تسجيل الخروج</button>
            <button onClick={() => setView('my-ads')} data-testid="nav-my-ads">إعلاناتي</button>
          </div>
        ) : (
          <button onClick={() => { setAuthFormVisible(true); setAuthFormType('login'); }} data-testid="nav-login">تسجيل الدخول</button>
        )}
      </header>
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
        <button data-testid="back" onClick={handleGoBack}>{"\u0631\u062c\u0648\u0639"}</button>
        <MyAds
          onOpen={id => { setView('detail'); setSelectedAdId(id); }}
          onDelete={handleDeleteAd}
          onPost={handleCreateAd}
        />
        </>
      )}
    </div>
  );
};

export default App;
