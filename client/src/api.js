const apiUrl = '/api';

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getCategories = async () => {
  const response = await fetch(`${apiUrl}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export const getCities = async () => {
  const response = await fetch(`${apiUrl}/cities`);
  if (!response.ok) {
    throw new Error('Failed to fetch cities');
  }
  return response.json();
};

export const getAds = async (params) => {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([key, value]) => value !== undefined && value !== '')
  );
  const queryString = new URLSearchParams(filteredParams).toString();
  const response = await fetch(`${apiUrl}/ads?${queryString}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const getAdById = async (id) => {
  const response = await fetch(`${apiUrl}/ads/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const createAd = async (adData) => {
  const response = await fetch(`${apiUrl}/ads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(adData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const deleteAd = async (id) => {
  const response = await fetch(`${apiUrl}/ads/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
};

export const register = async (userData) => {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const login = async (userData) => {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const getMe = async () => {
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const uploadAdImage = async (adId, file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${apiUrl}/ads/${adId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error((await response.json()).error);
  }

  return response.json();
};

export const getMyAds = async () => {
  const response = await fetch(`${apiUrl}/my/ads`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'خطأ');
  return json;
};
