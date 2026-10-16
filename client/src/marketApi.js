// Client for the marketplace endpoints (favorites, messages, sellers, reports, gallery). Throws Error(message).
const call = async (method, path, body) => {
  const tok = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'خطأ في الخادم');
  return data;
};
export const market = {
  meta: () => call('GET', '/meta'),
  ads: (params) => call('GET', '/ads?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)))),
  ad: (id) => call('GET', `/ads/${id}`),
  favorites: () => call('GET', '/favorites'),
  setFavorite: (id, on) => call(on ? 'POST' : 'DELETE', `/favorites/${id}`),
  conversations: () => call('GET', '/conversations'),
  thread: (adId, buyerId) => call('GET', `/conversations/${adId}/${buyerId}`),
  send: (adId, body, buyerId) => call('POST', `/ads/${adId}/messages`, { body, buyerId }),
  seller: (id) => call('GET', `/sellers/${id}`),
  report: (adId, reason, note) => call('POST', `/ads/${adId}/report`, { reason, note }),
  deleteImage: (adId, i) => call('DELETE', `/ads/${adId}/images/${i}`),
  adminReports: () => call('GET', '/admin/reports'),
  resolveReport: (id, action) => call('PATCH', `/admin/reports/${id}`, { action }),
  setFeatured: (id, featured) => call('PATCH', `/admin/ads/${id}`, { featured }),
};
