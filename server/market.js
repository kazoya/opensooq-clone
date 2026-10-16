// Marketplace features: category tree + per-category attributes/filters, image gallery, favorites, messages,
// seller profiles, featured ads and reports. Pure helpers exported for unit tests; routes mounted by mount().
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONDITIONS = ['جديد', 'مستعمل'];
// Attribute schema per top-level category (by Arabic name). type: number (range filter) | enum (exact filter)
const SCHEMAS = {
  'سيارات': [
    { key: 'year', label: 'سنة الصنع', labelEn: 'Year', type: 'number', min: 1980, max: 2027, filter: 'range' },
    { key: 'mileage', label: 'الممشى (كم)', labelEn: 'Mileage (km)', type: 'number', min: 0, max: 2000000, filter: 'max' },
    { key: 'transmission', label: 'ناقل الحركة', labelEn: 'Transmission', type: 'enum', values: ['أوتوماتيك', 'عادي'] },
  ],
  'عقارات': [
    { key: 'rooms', label: 'عدد الغرف', labelEn: 'Rooms', type: 'number', min: 0, max: 50, filter: 'min' },
    { key: 'area', label: 'المساحة (م²)', labelEn: 'Area (m²)', type: 'number', min: 1, max: 1000000, filter: 'min' },
  ],
  'وظائف': [{ key: 'jobType', label: 'نوع الدوام', labelEn: 'Job type', type: 'enum', values: ['دوام كامل', 'دوام جزئي', 'عن بعد'] }],
};
const SUBCATS = {
  'سيارات': [['سيارات للبيع', 'Cars for sale'], ['قطع غيار', 'Spare parts']],
  'عقارات': [['شقق للإيجار', 'Apartments for rent'], ['فلل للبيع', 'Villas for sale'], ['أراضي للبيع', 'Land for sale'], ['محلات ومكاتب', 'Shops & offices']],
  'الكترونيات': [['جوالات', 'Mobile phones'], ['لابتوبات', 'Laptops'], ['ألعاب فيديو', 'Video games'], ['كاميرات', 'Cameras']],
  'أثاث': [['أثاث منزلي', 'Home furniture']],
  'وظائف': [['وظائف شاغرة', 'Vacancies']],
};
// Demo ad -> [subcategory, attributes, condition]
const DEMO_ATTRS = {
  camry: ['سيارات للبيع', { year: 2021, mileage: 64000, transmission: 'أوتوماتيك' }, 'مستعمل'],
  patrol: ['سيارات للبيع', { year: 2019, mileage: 120000, transmission: 'أوتوماتيك' }, 'مستعمل'],
  accent: ['سيارات للبيع', { year: 2016, mileage: 190000, transmission: 'عادي' }, 'مستعمل'],
  tahoe: ['سيارات للبيع', { year: 2018, mileage: 150000, transmission: 'أوتوماتيك' }, 'مستعمل'],
  apartment: ['شقق للإيجار', { rooms: 3, area: 140 }], villa: ['فلل للبيع', { rooms: 6, area: 450 }],
  land: ['أراضي للبيع', { area: 600 }], office: ['محلات ومكاتب', { rooms: 2, area: 90 }],
  iphone: ['جوالات', {}, 'مستعمل'], laptop: ['لابتوبات', {}, 'مستعمل'], ps5: ['ألعاب فيديو', {}, 'جديد'], camera: ['كاميرات', {}, 'مستعمل'],
  sofa: ['أثاث منزلي', {}, 'مستعمل'], bed: ['أثاث منزلي', {}, 'جديد'],
  driver: ['وظائف شاغرة', { jobType: 'دوام كامل' }], designer: ['وظائف شاغرة', { jobType: 'عن بعد' }],
};
const FEATURED_DEMO = ['villa', 'camry', 'iphone'];
const REPORT_REASONS = ['احتيال', 'إعلان مكرر', 'محتوى غير لائق', 'تصنيف خاطئ', 'تم البيع', 'أخرى'];
const DEMO_SELLER_EMAIL = 'demo-seller@opensooq.local';

const rootOf = (categories, id) => { let c = categories.find((x) => x.id === id); while (c && c.parentId) c = categories.find((x) => x.id === c.parentId); return c; };
const descendants = (categories, id) => { const out = new Set([id]); let grew = true; while (grew) { grew = false; for (const c of categories) if (c.parentId && out.has(c.parentId) && !out.has(c.id)) { out.add(c.id); grew = true; } } return out; };
const schemaFor = (categories, id) => { const r = rootOf(categories, id); return (r && SCHEMAS[r.name]) || []; };

// Validate submitted attributes against the category schema; returns { ok, attributes } or { error }
function validateAttributes(schema, input) {
  const attributes = {};
  for (const f of schema) {
    const v = input && input[f.key];
    if (v === undefined || v === null || v === '') continue;
    if (f.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < f.min || n > f.max) return { error: `قيمة غير صالحة: ${f.label}` };
      attributes[f.key] = n;
    } else {
      if (!f.values.includes(v)) return { error: `قيمة غير صالحة: ${f.label}` };
      attributes[f.key] = v;
    }
  }
  return { ok: true, attributes };
}

// Filter + sort ads. q: query params. Featured ads first (within the chosen sort) unless sorting by price.
function filterAds(ads, categories, q) {
  let list = ads.slice();
  if (q.categoryId) { const ids = descendants(categories, q.categoryId); list = list.filter((a) => ids.has(a.categoryId)); }
  if (q.cityId) list = list.filter((a) => a.cityId === q.cityId);
  if (q.sellerId) list = list.filter((a) => a.userId === q.sellerId);
  if (q.q) { const s = String(q.q).toLowerCase(); list = list.filter((a) => [a.title, a.description, a.titleEn, a.descriptionEn].some((x) => x && String(x).toLowerCase().includes(s))); }
  const num = (k) => (q[k] !== undefined && q[k] !== '' ? Number(q[k]) : null);
  for (const [k, cmp] of [['minPrice', (a, n) => a.price >= n], ['maxPrice', (a, n) => a.price <= n]]) { const n = num(k); if (n !== null) { if (Number.isNaN(n)) return { error: `${k} must be a number` }; list = list.filter((a) => cmp(a, n)); } }
  if (q.condition) list = list.filter((a) => a.condition === q.condition);
  if (q.featured === '1') list = list.filter((a) => a.featured);
  if (q.categoryId) {
    for (const f of schemaFor(categories, q.categoryId)) {
      const at = (a) => (a.attributes || {})[f.key];
      if (f.type === 'enum' && q[f.key]) list = list.filter((a) => at(a) === q[f.key]);
      if (f.type === 'number') {
        const mn = num(`${f.key}_min`); const mx = num(`${f.key}_max`);
        if (mn !== null && !Number.isNaN(mn)) list = list.filter((a) => at(a) !== undefined && at(a) >= mn);
        if (mx !== null && !Number.isNaN(mx)) list = list.filter((a) => at(a) !== undefined && at(a) <= mx);
      }
    }
  }
  const byDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  if (q.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (q.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byDate(a, b));
  return { ads: list };
}

// Idempotent upgrade of the existing data: sub-categories, demo seller, demo attributes/gallery/featured
function upgrade(db) {
  let changed = false;
  for (const [parentName, subs] of Object.entries(SUBCATS)) {
    const parent = db.categories.find((c) => c.name === parentName && !c.parentId); if (!parent) continue;
    for (const [name, nameEn] of subs) if (!db.categories.some((c) => c.name === name && c.parentId === parent.id)) { db.categories.push({ id: crypto.randomUUID(), name, nameEn, parentId: parent.id }); changed = true; }
  }
  let seller = db.users.find((u) => u.email === DEMO_SELLER_EMAIL);
  if (!seller) { seller = { id: crypto.randomUUID(), name: 'معرض السوق التجريبي', email: DEMO_SELLER_EMAIL, passwordHash: '!', role: 'user', demo: true, createdAt: '2024-03-01T09:00:00.000Z' }; db.users.push(seller); changed = true; }
  for (const ad of db.ads) {
    if (!ad.demo) continue;
    const slug = (ad.imageUrl || '').replace(/^\/demo\/|\.svg$/g, '');
    const meta = DEMO_ATTRS[slug];
    if (!ad.userId) { ad.userId = seller.id; changed = true; }
    if (meta && !ad.attributes) {
      const sub = db.categories.find((c) => c.name === meta[0] && c.parentId === ad.categoryId);
      if (sub) ad.categoryId = sub.id;
      ad.attributes = meta[1]; if (meta[2]) ad.condition = meta[2];
      ad.images = [ad.imageUrl, `/demo/${slug}-2.svg`, `/demo/${slug}-3.svg`];
      if (FEATURED_DEMO.includes(slug)) ad.featured = true;
      changed = true;
    }
  }
  return changed;
}

function mount(app, { db, saveDb, requireAuth, optionalAuth, toPublic, uploadsDir, upload, requireAdmin }) {
  const pub = (ad, user) => ({ ...toPublic(ad), favorite: !!(user && (findUser(user.id).favorites || []).includes(ad.id)) });
  const findUser = (id) => db.users.find((u) => u.id === id) || {};
  const adOr404 = (req, res) => { const ad = db.ads.find((a) => a.id === req.params.id); if (!ad) res.status(404).json({ error: 'الإعلان غير موجود' }); return ad; };

  app.get('/api/categories', (req, res) => {
    res.json(db.categories.map((c) => ({ ...c, attributes: c.parentId ? undefined : (SCHEMAS[c.name] || []) })));
  });
  app.get('/api/meta', (req, res) => res.json({ conditions: CONDITIONS, reportReasons: REPORT_REASONS }));

  app.get('/api/ads', optionalAuth, (req, res) => {
    const r = filterAds(db.ads, db.categories, req.query);
    if (r.error) return res.status(400).json({ error: r.error });
    res.json(r.ads.map((a) => pub(a, req.user)));
  });

  app.get('/api/ads/:id', optionalAuth, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    ad.views = (ad.views || 0) + 1; saveDb();
    const out = pub(ad, req.user);
    const seller = db.users.find((u) => u.id === ad.userId);
    out.seller = seller ? { id: seller.id, name: seller.name, memberSince: seller.createdAt, adCount: db.ads.filter((a) => a.userId === seller.id).length } : null;
    const root = rootOf(db.categories, ad.categoryId);
    out.rootCategory = root ? { id: root.id, name: root.name, nameEn: root.nameEn } : null;
    out.schema = schemaFor(db.categories, ad.categoryId);
    res.json(out);
  });

  app.post('/api/ads', requireAuth, (req, res) => {
    const { title, description, price, categoryId, cityId, sellerName, phone, attributes, condition } = req.body || {};
    if (!title || !description || typeof price !== 'number' || price < 0 || !phone) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (String(title).length < 3 || String(title).length > 100) return res.status(400).json({ error: 'عنوان الإعلان يجب أن يكون بين 3 و100 حرفًا' });
    if (String(description).length > 3000) return res.status(400).json({ error: 'الوصف طويل جدًا' });
    if (!db.categories.some((c) => c.id === categoryId)) return res.status(400).json({ error: 'الفئة غير موجودة' });
    if (!db.cities.some((c) => c.id === cityId)) return res.status(400).json({ error: 'المدينة غير موجودة' });
    if (condition !== undefined && condition !== '' && !CONDITIONS.includes(condition)) return res.status(400).json({ error: 'قيمة غير صحيحة' });
    const v = validateAttributes(schemaFor(db.categories, categoryId), attributes);
    if (v.error) return res.status(400).json({ error: v.error });
    const ad = { id: crypto.randomUUID(), title: String(title), description: String(description), price, categoryId, cityId, sellerName: String(sellerName || req.user.name).slice(0, 60),
      phone: String(phone).slice(0, 20), userId: req.user.id, createdAt: new Date().toISOString(), views: 0, attributes: v.attributes, condition: condition || undefined, images: [] };
    db.ads.push(ad); saveDb();
    res.status(201).json(ad);
  });

  // Gallery: up to 5 images per ad (owner only); first image is the cover
  const detect = (buf) => { const h = buf.slice(0, 12).toString('hex'); if (h.startsWith('89504e470d0a1a0a')) return 'png'; if (h.startsWith('ffd8ff')) return 'jpg'; if (h.startsWith('52494646') && buf.slice(8, 12).toString() === 'WEBP') return 'webp'; return null; };
  app.post('/api/ads/:id/image', requireAuth, upload, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    if (ad.userId !== req.user.id) return res.status(403).json({ error: 'غير مصرح' });
    if (!req.file) return res.status(400).json({ error: 'لا يوجد ملف صورة' });
    const ext = detect(req.file.buffer); if (!ext) return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
    ad.images = ad.images || (ad.imageUrl ? [ad.imageUrl] : []);
    if (ad.images.length >= 5) return res.status(409).json({ error: 'الحد الأقصى 5 صور' });
    const file = `${crypto.randomUUID()}.${ext}`; fs.writeFileSync(path.join(uploadsDir, file), req.file.buffer);
    ad.images.push(`/uploads/${file}`); ad.imageUrl = ad.images[0]; saveDb();
    res.json({ imageUrl: ad.imageUrl, images: ad.images });
  });
  app.delete('/api/ads/:id/images/:index', requireAuth, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    if (ad.userId !== req.user.id) return res.status(403).json({ error: 'غير مصرح' });
    const i = Number(req.params.index); const imgs = ad.images || [];
    if (!Number.isInteger(i) || i < 0 || i >= imgs.length) return res.status(404).json({ error: 'الصورة غير موجودة' });
    const [gone] = imgs.splice(i, 1);
    if (gone.startsWith('/uploads/')) { try { fs.unlinkSync(path.join(uploadsDir, path.basename(gone))); } catch {} }
    ad.imageUrl = imgs[0]; saveDb(); res.json({ images: imgs });
  });

  // Favorites
  app.get('/api/favorites', requireAuth, (req, res) => {
    const ids = findUser(req.user.id).favorites || [];
    res.json(db.ads.filter((a) => ids.includes(a.id)).map((a) => pub(a, req.user)));
  });
  app.post('/api/favorites/:id', requireAuth, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    const u = db.users.find((x) => x.id === req.user.id); u.favorites = u.favorites || [];
    if (!u.favorites.includes(ad.id)) u.favorites.push(ad.id);
    saveDb(); res.json({ favorite: true });
  });
  app.delete('/api/favorites/:id', requireAuth, (req, res) => {
    const u = db.users.find((x) => x.id === req.user.id); u.favorites = (u.favorites || []).filter((x) => x !== req.params.id);
    saveDb(); res.json({ favorite: false });
  });

  // Messages: a thread is (ad, buyer). The seller and that buyer are the only participants.
  const threadKey = (adId, buyerId) => `${adId}:${buyerId}`;
  app.post('/api/ads/:id/messages', requireAuth, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    const body = String((req.body && req.body.body) || '').trim();
    if (!body || body.length > 1000) return res.status(400).json({ error: 'الرسالة يجب أن تكون بين 1 و1000 حرف' });
    // buyer writes to the seller; the seller replies inside an existing thread by passing buyerId
    let buyerId = req.user.id; let toId = ad.userId;
    if (req.user.id === ad.userId) {
      buyerId = req.body.buyerId;
      if (!buyerId || !db.messages.some((m) => m.thread === threadKey(ad.id, buyerId))) return res.status(400).json({ error: 'لا يمكنك مراسلة نفسك' });
      toId = buyerId;
    }
    if (!toId) return res.status(400).json({ error: 'لا يمكن مراسلة صاحب هذا الإعلان' });
    const m = { id: crypto.randomUUID(), thread: threadKey(ad.id, buyerId), adId: ad.id, buyerId, fromId: req.user.id, toId, body, createdAt: new Date().toISOString(), read: false };
    db.messages.push(m); saveDb(); res.status(201).json(m);
  });
  app.get('/api/conversations', requireAuth, (req, res) => {
    const me = req.user.id; const threads = new Map();
    for (const m of db.messages) {
      if (m.fromId !== me && m.toId !== me) continue;
      const t = threads.get(m.thread) || { thread: m.thread, adId: m.adId, buyerId: m.buyerId, last: null, unread: 0 };
      if (!t.last || m.createdAt > t.last.createdAt) t.last = m;
      if (m.toId === me && !m.read) t.unread++;
      threads.set(m.thread, t);
    }
    const out = [...threads.values()].map((t) => {
      const ad = db.ads.find((a) => a.id === t.adId);
      const otherId = t.last.fromId === me ? t.last.toId : t.last.fromId;
      return { ...t, ad: ad ? { id: ad.id, title: ad.title, titleEn: ad.titleEn, imageUrl: ad.imageUrl } : null, other: { id: otherId, name: findUser(otherId).name || '—' } };
    }).sort((a, b) => (a.last.createdAt < b.last.createdAt ? 1 : -1));
    res.json(out);
  });
  app.get('/api/conversations/:adId/:buyerId', requireAuth, (req, res) => {
    const me = req.user.id; const key = threadKey(req.params.adId, req.params.buyerId);
    const msgs = db.messages.filter((m) => m.thread === key);
    if (!msgs.length) return res.json([]);
    if (!msgs.some((m) => m.fromId === me || m.toId === me)) return res.status(403).json({ error: 'غير مصرح' });
    let changed = false; for (const m of msgs) if (m.toId === me && !m.read) { m.read = true; changed = true; }
    if (changed) saveDb();
    res.json(msgs.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map((m) => ({ ...m, mine: m.fromId === me })));
  });

  // Seller profile (public)
  app.get('/api/sellers/:id', optionalAuth, (req, res) => {
    const u = db.users.find((x) => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const ads = db.ads.filter((a) => a.userId === u.id).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    res.json({ id: u.id, name: u.name, memberSince: u.createdAt, adCount: ads.length, totalViews: ads.reduce((t, a) => t + (a.views || 0), 0), ads: ads.map((a) => pub(a, req.user)) });
  });

  // Reports
  app.post('/api/ads/:id/report', requireAuth, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    const { reason, note } = req.body || {};
    if (!REPORT_REASONS.includes(reason)) return res.status(400).json({ error: 'اختر سبب الإبلاغ' });
    if (db.reports.some((r) => r.adId === ad.id && r.reporterId === req.user.id && r.status === 'open')) return res.status(409).json({ error: 'أبلغت عن هذا الإعلان مسبقًا' });
    const r = { id: crypto.randomUUID(), adId: ad.id, reporterId: req.user.id, reason, note: String(note || '').slice(0, 500), status: 'open', createdAt: new Date().toISOString() };
    db.reports.push(r); saveDb(); res.status(201).json({ id: r.id, status: r.status });
  });
  app.get('/api/admin/reports', requireAuth, requireAdmin, (req, res) => {
    res.json(db.reports.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((r) => {
      const ad = db.ads.find((a) => a.id === r.adId);
      return { ...r, ad: ad ? { id: ad.id, title: ad.title, titleEn: ad.titleEn } : null, reporter: findUser(r.reporterId).email || null };
    }));
  });
  app.patch('/api/admin/reports/:id', requireAuth, requireAdmin, (req, res) => {
    const r = db.reports.find((x) => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: 'البلاغ غير موجود' });
    const { action } = req.body || {};
    if (action === 'dismiss') r.status = 'dismissed';
    else if (action === 'remove_ad') { db.ads = db.ads.filter((a) => a.id !== r.adId); for (const x of db.reports) if (x.adId === r.adId) x.status = 'ad_removed'; }
    else return res.status(400).json({ error: 'قيمة غير صحيحة' });
    saveDb(); res.json({ status: r.status });
  });
  app.patch('/api/admin/ads/:id', requireAuth, requireAdmin, (req, res) => {
    const ad = adOr404(req, res); if (!ad) return;
    if (typeof (req.body || {}).featured !== 'boolean') return res.status(400).json({ error: 'قيمة غير صحيحة' });
    ad.featured = req.body.featured; saveDb(); res.json({ id: ad.id, featured: ad.featured });
  });
}

module.exports = { mount, upgrade, filterAds, validateAttributes, descendants, rootOf, SCHEMAS, CONDITIONS, REPORT_REASONS };
