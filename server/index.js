const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const BASE_DIR = process.env.VERCEL ? '/tmp' : __dirname; // Vercel: only /tmp is writable (demo data resets)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 5000;
const dbPath = path.join(BASE_DIR, 'data', 'db.json');
const secretPath = path.join(BASE_DIR, 'secret.txt');

// Load or initialize the secret
let secret = process.env.JWT_SECRET;
if (secret) {
  // from environment
} else if (fs.existsSync(secretPath)) {
  secret = fs.readFileSync(secretPath, 'utf8').trim();
} else {
  secret = crypto.randomBytes(64).toString('hex');
  fs.writeFileSync(secretPath, secret);
}

// Load or initialize the database
const store = require('./sqlite-store');
let db = store.load();
const saveDb = () => store.save(db);

// Ensure all required keys exist in the database
for (const k of ['categories', 'cities', 'ads', 'users']) {
  if (!Array.isArray(db[k])) {
    db[k] = [];
  }
}

// Seed data on first run
if (db.categories.length === 0 && db.cities.length === 0) {
  db.categories = [
    { id: crypto.randomUUID(), name: 'سيارات' },
    { id: crypto.randomUUID(), name: 'عقارات' },
    { id: crypto.randomUUID(), name: 'الكترونيات' },
    { id: crypto.randomUUID(), name: 'وظائف' },
    { id: crypto.randomUUID(), name: 'أثاث' }
  ];
  db.cities = [
    { id: crypto.randomUUID(), name: 'الرياض' },
    { id: crypto.randomUUID(), name: 'جدة' },
    { id: crypto.randomUUID(), name: 'الدمام' },
    { id: crypto.randomUUID(), name: 'مكة' },
    { id: crypto.randomUUID(), name: 'المدينة' }
  ];
  saveDb();
}

// Demo seed ads (cold start on Vercel, or empty local DB)
if (db.ads.length === 0 && db.categories.length && db.cities.length) {
  const samples = [['تويوتا كامري 2021 نظيفة', 78000], ['آيفون 15 برو مستعمل', 3200], ['شقة للإيجار حي النرجس', 45000], ['كنب مجلس 7 مقاعد', 1500]];
  samples.forEach(([title, price], i) => db.ads.push({
    id: crypto.randomUUID(), title, description: 'إعلان تجريبي للعرض فقط', price,
    categoryId: db.categories[i % db.categories.length].id, cityId: db.cities[i % db.cities.length].id,
    sellerName: 'حساب تجريبي', phone: '0500000000', views: 0, createdAt: new Date().toISOString(), demo: true,
  }));
  saveDb();
}

// Helper to convert ad to public format
const toPublic = (ad) => {
  const publicAd = { ...ad };
  delete publicAd.editToken;
  const category = db.categories.find(c => c.id === ad.categoryId);
  const city = db.cities.find(c => c.id === ad.cityId);
  if (category) {
    publicAd.categoryName = category.name;
  }
  if (city) {
    publicAd.cityName = city.name;
  }
  return publicAd;
};

// Middleware to parse "Bearer " token
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'غير مصرح' });
  }
  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'غير مصرح' });
    }
    req.user = user;
    next();
  });
};

// Optional auth middleware for legacy ads
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.status(401).json({ error: 'غير مصرح' });
      }
      req.user = user;
    });
  }
  next();
};

// Wrapper for async handlers
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Middleware to parse JSON bodies
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(BASE_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }).single('image');

// API routes
app.get('/api/health', wrap(async (req, res) => {
  res.json({ status: 'ok' });
}));

app.get('/api/categories', wrap(async (req, res) => {
  res.json(db.categories);
}));

app.get('/api/cities', wrap(async (req, res) => {
  res.json(db.cities);
}));

app.get('/api/ads', wrap(async (req, res) => {
  const { categoryId, cityId, q, minPrice, maxPrice, sort } = req.query;
  let ads = db.ads.slice();

  if (categoryId) {
    ads = ads.filter(ad => ad.categoryId === categoryId);
  }

  if (cityId) {
    ads = ads.filter(ad => ad.cityId === cityId);
  }

  if (q) {
    const query = q.toLowerCase();
    ads = ads.filter(ad => 
      ad.title.toLowerCase().includes(query) || 
      ad.description.toLowerCase().includes(query)
    );
  }

  if (minPrice !== undefined && minPrice !== '') {
    const min = parseFloat(minPrice);
    if (isNaN(min)) {
      return res.status(400).json({ error: 'minPrice must be a number' });
    }
    ads = ads.filter(ad => ad.price >= min);
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    const max = parseFloat(maxPrice);
    if (isNaN(max)) {
      return res.status(400).json({ error: 'maxPrice must be a number' });
    }
    ads = ads.filter(ad => ad.price <= max);
  }

  if (sort === 'price_asc') {
    ads.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    ads.sort((a, b) => b.price - a.price);
  } else {
    ads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const publicAds = ads.map(ad => toPublic(ad));
  res.json(publicAds);
}));

app.get('/api/my/ads', requireAuth, wrap(async (req, res) => {
  const mine = db.ads.filter(ad => ad.userId === req.user.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(mine.map(ad => toPublic(ad)));
}));

app.get('/api/ads/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const ad = db.ads.find(a => a.id === id);
  if (!ad) {
    return res.status(404).json({ error: 'الإعلان غير موجود' });
  }
  ad.views = (ad.views || 0) + 1;
  saveDb();
  res.json(toPublic(ad));
}));

app.post('/api/ads', requireAuth, wrap(async (req, res) => {
  const { title, description, price, categoryId, cityId, sellerName, phone } = req.body;
  if (!title || !description || typeof price !== 'number' || price < 0 || !phone) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  if (title.length < 3 || title.length > 100) {
    return res.status(400).json({ error: 'عنوان الإعلان يجب أن يكون بين 3 و100 حرفًا' });
  }
  if (!db.categories.some(c => c.id === categoryId)) {
    return res.status(400).json({ error: 'الفئة غير موجودة' });
  }
  if (!db.cities.some(c => c.id === cityId)) {
    return res.status(400).json({ error: 'المدينة غير موجودة' });
  }
  const ad = {
    id: crypto.randomUUID(),
    title,
    description,
    price,
    categoryId,
    cityId,
    sellerName: sellerName || req.user.name,
    phone,
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    views: 0
  };
  db.ads.push(ad);
  saveDb();
  res.status(201).json(ad);
}));

app.delete('/api/ads/:id', optionalAuth, wrap(async (req, res) => {
  const { id } = req.params;
  const ad = db.ads.find(a => a.id === id);
  if (!ad) {
    return res.status(404).json({ error: 'الإعلان غير موجود' });
  }
  if (ad.userId) {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح' });
    }
    if (ad.userId !== req.user.id) {
      return res.status(403).json({ error: 'لا يمكنك حذف هذا الإعلان' });
    }
  } else {
    const editToken = req.headers['x-edit-token'];
    if (editToken !== ad.editToken) {
      return res.status(403).json({ error: 'لا يمكنك حذف هذا الإعلان' });
    }
  }
  if (ad.imageUrl) {
    const imagePath = path.join(uploadsDir, path.basename(ad.imageUrl));
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting image file:', err);
    }
  }
  db.ads = db.ads.filter(a => a.id !== id);
  saveDb();
  res.status(204).send();
}));

app.post('/api/ads/:id/image', requireAuth, upload, wrap(async (req, res) => {
  const { id } = req.params;
  const ad = db.ads.find(a => a.id === id);
  if (!ad) {
    return res.status(404).json({ error: 'الإعلان غير موجود' });
  }
  if (ad.userId !== req.user.id) {
    return res.status(403).json({ error: 'غير مصرح' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'لا يوجد ملف صورة' });
  }

  const detectFileType = (buffer) => {
    const magicNumber = buffer.slice(0, 8).toString('hex');
    if (magicNumber.startsWith('89504e470d0a1a0a')) { // PNG
      return 'png';
    } else if (magicNumber.startsWith('ffd8ff')) { // JPEG
      return 'jpg';
    } else if (magicNumber.startsWith('825649574150')) { // WEBP
      return 'webp';
    }
    return null;
  };

  const ext = detectFileType(req.file.buffer);
  if (!ext) {
    return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
  }

  if (ad.imageUrl) {
    const oldImagePath = path.join(uploadsDir, path.basename(ad.imageUrl));
    try {
      fs.unlinkSync(oldImagePath);
    } catch (err) {
      console.error('Error deleting old image file:', err);
    }
  }

  const newImagePath = path.join(uploadsDir, `${crypto.randomUUID()}.${ext}`);
  fs.writeFileSync(newImagePath, req.file.buffer);

  ad.imageUrl = `/uploads/${path.basename(newImagePath)}`;
  saveDb();

  res.status(200).json({ imageUrl: ad.imageUrl });
}));

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json({ id: user.id, name: user.name, email: user.email });
}));

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'البريد الإلكتروني مُستخدم بالفعل' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashedPassword
  };
  db.users.push(user);
  saveDb();
  const token = jwt.sign({ id: user.id, name: user.name }, secret, { expiresIn: '7d' });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }
  const token = jwt.sign({ id: user.id, name: user.name }, secret, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
}));

// Final error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'حجم الملف كبير جداً' });
    }
  }
  if (err.message === 'Unsupported file type') {
    return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
  }
  res.status(500).json({ error: 'خطأ في الخادم' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
