// Admin API client (OpenSooq). Throws Error(message) on failure.
const call = async (method, path, body) => {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
  return data;
};

export const adminApi = {
  stats: () => call('GET', '/stats'),
  users: () => call('GET', '/users'),
  setUserDisabled: (id, disabled) => call('PATCH', `/users/${id}`, { disabled }),
  ads: () => call('GET', '/ads'),
  deleteAd: (id) => call('DELETE', `/ads/${id}`),
  categories: () => call('GET', '/categories'),
  addCategory: (name) => call('POST', '/categories', { name }),
  deleteCategory: (id) => call('DELETE', `/categories/${id}`),
  cities: () => call('GET', '/cities'),
  addCity: (name) => call('POST', '/cities', { name }),
  deleteCity: (id) => call('DELETE', `/cities/${id}`),
};
