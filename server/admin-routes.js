// Admin API (OpenSooq). Every route: requireAuth + requireAdmin -> 401 without login, 403 for normal users.
const crypto = require('crypto');
const requireAdmin = require('./require-admin');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'user', disabled: !!u.disabled, createdAt: u.createdAt || null });

module.exports = function mountAdmin(app, { db, saveDb, requireAuth, toPublic }) {
  const guard = [requireAuth, requireAdmin];
  const validName = (n) => typeof n === 'string' && n.trim().length >= 2 && n.trim().length <= 40;

  app.get('/api/admin/stats', guard, (req, res) => res.json({
    users: db.users.length, ads: db.ads.length, categories: db.categories.length, cities: db.cities.length,
    views: db.ads.reduce((s, a) => s + (a.views || 0), 0),
  }));

  app.get('/api/admin/users', guard, (req, res) => res.json(db.users.map(publicUser)));

  app.patch('/api/admin/users/:id', guard, (req, res) => {
    const u = db.users.find((x) => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'المستخدم غير موجود' });
    if (u.role === 'admin') return res.status(400).json({ error: 'لا يمكن تعطيل حساب مدير' });
    if (typeof req.body.disabled !== 'boolean') return res.status(400).json({ error: 'قيمة غير صحيحة' });
    u.disabled = req.body.disabled;
    saveDb();
    res.json(publicUser(u));
  });

  app.get('/api/admin/ads', guard, (req, res) => res.json(db.ads.map(toPublic)));

  app.delete('/api/admin/ads/:id', guard, (req, res) => {
    const before = db.ads.length;
    db.ads = db.ads.filter((a) => a.id !== req.params.id);
    if (db.ads.length === before) return res.status(404).json({ error: 'الإعلان غير موجود' });
    saveDb();
    res.status(204).send();
  });

  for (const [kind, label] of [['categories', 'التصنيف'], ['cities', 'المدينة']]) {
    app.get(`/api/admin/${kind}`, guard, (req, res) => res.json(db[kind]));
    app.post(`/api/admin/${kind}`, guard, (req, res) => {
      const { name, nameEn } = req.body;
      if (!validName(name)) return res.status(400).json({ error: 'الاسم يجب أن يكون بين 2 و40 حرفًا' });
      if (db[kind].some((x) => x.name === name.trim())) return res.status(409).json({ error: `${label} موجود مسبقاً` });
      const item = { id: crypto.randomUUID(), name: name.trim(), nameEn: typeof nameEn === 'string' ? nameEn.trim() : null };
      db[kind].push(item);
      saveDb();
      res.status(201).json(item);
    });
    app.delete(`/api/admin/${kind}/:id`, guard, (req, res) => {
      const field = kind === 'categories' ? 'categoryId' : 'cityId';
      if (!db[kind].some((x) => x.id === req.params.id)) return res.status(404).json({ error: `${label} غير موجود` });
      if (db.ads.some((a) => a[field] === req.params.id)) return res.status(409).json({ error: `لا يمكن حذف ${label} لوجود إعلانات مرتبطة به` });
      if (kind === 'categories' && db.categories.some((c) => c.parentId === req.params.id)) return res.status(409).json({ error: 'لا يمكن حذف تصنيف له تصنيفات فرعية' });
      db[kind] = db[kind].filter((x) => x.id !== req.params.id);
      saveDb();
      res.status(204).send();
    });
  }
};
