// Run: npm test. Unit tests for filters/attributes + an API flow against a throwaway SQLite server.
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path'); const os = require('node:os'); const fs = require('node:fs');
const { filterAds, validateAttributes, descendants, SCHEMAS } = require('../market');

const cats = [{ id: 'cars', name: 'سيارات' }, { id: 'sale', name: 'سيارات للبيع', parentId: 'cars' }, { id: 're', name: 'عقارات' }];
const ads = [
  { id: 'a', categoryId: 'sale', price: 50000, createdAt: '2026-10-01', attributes: { year: 2021, mileage: 60000, transmission: 'أوتوماتيك' }, condition: 'مستعمل' },
  { id: 'b', categoryId: 'sale', price: 20000, createdAt: '2026-10-03', attributes: { year: 2012, mileage: 250000, transmission: 'عادي' } },
  { id: 'c', categoryId: 're', price: 900000, createdAt: '2026-10-02', featured: true, attributes: { rooms: 5 } },
];
test('category filter includes sub-categories', () => {
  assert.deepStrictEqual([...descendants(cats, 'cars')].sort(), ['cars', 'sale']);
  assert.deepStrictEqual(filterAds(ads, cats, { categoryId: 'cars' }).ads.map((a) => a.id), ['b', 'a']);
});
test('per-category attribute filters: year range, mileage max, transmission', () => {
  assert.deepStrictEqual(filterAds(ads, cats, { categoryId: 'cars', year_min: '2015' }).ads.map((a) => a.id), ['a']);
  assert.deepStrictEqual(filterAds(ads, cats, { categoryId: 'cars', mileage_max: '100000' }).ads.map((a) => a.id), ['a']);
  assert.deepStrictEqual(filterAds(ads, cats, { categoryId: 'cars', transmission: 'عادي' }).ads.map((a) => a.id), ['b']);
});
test('featured first by default; price sort ignores featured; condition + price range', () => {
  assert.strictEqual(filterAds(ads, cats, {}).ads[0].id, 'c');
  assert.strictEqual(filterAds(ads, cats, { sort: 'price_asc' }).ads[0].id, 'b');
  assert.deepStrictEqual(filterAds(ads, cats, { condition: 'مستعمل' }).ads.map((a) => a.id), ['a']);
  assert.deepStrictEqual(filterAds(ads, cats, { minPrice: '30000', maxPrice: '60000' }).ads.map((a) => a.id), ['a']);
  assert.ok(filterAds(ads, cats, { minPrice: 'abc' }).error);
});
test('attribute validation against the schema', () => {
  assert.deepStrictEqual(validateAttributes(SCHEMAS['سيارات'], { year: '2020', transmission: 'عادي', junk: 1 }), { ok: true, attributes: { year: 2020, transmission: 'عادي' } });
  assert.ok(validateAttributes(SCHEMAS['سيارات'], { year: 1800 }).error);
  assert.ok(validateAttributes(SCHEMAS['سيارات'], { transmission: 'طائرة' }).error);
});

test('API flow: tree, filters, favorites, messages, seller profile, reports, featured, gallery', async (t) => {
  const port = 5700 + Math.floor(Math.random() * 300);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sooq-test-'));
  const env = { ...process.env, PORT: String(port), BASE_DIR: dir, ADMIN_EMAIL: 'admin@test.local', ADMIN_PASSWORD: 'test-admin-pass-1' }; delete env.DATABASE_URL;
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'index.js')], { env, stdio: 'ignore' }); t.after(() => srv.kill());
  const B = `http://127.0.0.1:${port}/api`;
  const j = async (m, u, b, tok) => { const r = await fetch(B + u, { method: m, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: b && JSON.stringify(b) }); let d = null; try { d = await r.json(); } catch {} return [r.status, d]; };
  for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 200)); }

  const [, categories] = await j('GET', '/categories');
  const cars = categories.find((c) => c.name === 'سيارات' && !c.parentId);
  assert.ok(categories.some((c) => c.parentId === cars.id), 'sub-categories exist');
  assert.ok(cars.attributes.some((f) => f.key === 'year'), 'cars schema exposed');
  const [, carAds] = await j('GET', `/ads?categoryId=${cars.id}`);
  assert.ok(carAds.length >= 2 && carAds.some((a) => a.categoryId !== cars.id), 'parent category includes sub-category ads');
  const [, newer] = await j('GET', `/ads?categoryId=${cars.id}&year_min=2019`);
  assert.ok(newer.length > 0 && newer.length < carAds.length && newer.every((a) => a.attributes.year >= 2019));
  const [, all] = await j('GET', '/ads');
  assert.ok(all[0].featured, 'featured first'); assert.strictEqual(all[0].images.length, 3, 'demo gallery has 3 images');
  assert.strictEqual((await j('GET', '/ads', null, 'garbage.token.here'))[0], 200, 'stale token does not block browsing');

  const [, buyer] = await j('POST', '/auth/register', { name: 'مشتري', email: `b${port}@t.com`, password: 'password123' });
  const [, seller] = await j('POST', '/auth/register', { name: 'بائع', email: `s${port}@t.com`, password: 'password123' });
  const [, stranger] = await j('POST', '/auth/register', { name: 'غريب', email: `x${port}@t.com`, password: 'password123' });
  const [, cities] = await j('GET', '/cities');
  const sub = categories.find((c) => c.parentId === cars.id);
  assert.strictEqual((await j('POST', '/ads', { title: 'سيارة', description: 'وصف', price: 1000, categoryId: sub.id, cityId: cities[0].id, phone: '0500000001', attributes: { year: 1700 } }, seller.token))[0], 400, 'bad attribute rejected');
  const [cs, ad] = await j('POST', '/ads', { title: 'كورولا 2020', description: 'نظيفة', price: 55000, categoryId: sub.id, cityId: cities[0].id, phone: '0500000001', condition: 'مستعمل', attributes: { year: 2020, mileage: 80000, transmission: 'أوتوماتيك' } }, seller.token);
  assert.strictEqual(cs, 201); assert.strictEqual(ad.attributes.year, 2020);

  // favorites
  assert.strictEqual((await j('POST', `/favorites/${ad.id}`))[0], 401);
  await j('POST', `/favorites/${ad.id}`, null, buyer.token);
  assert.strictEqual((await j('GET', `/ads/${ad.id}`, null, buyer.token))[1].favorite, true);
  assert.strictEqual((await j('GET', '/favorites', null, buyer.token))[1].length, 1);
  await j('DELETE', `/favorites/${ad.id}`, null, buyer.token);
  assert.strictEqual((await j('GET', '/favorites', null, buyer.token))[1].length, 0);

  // messages
  assert.strictEqual((await j('POST', `/ads/${ad.id}/messages`, { body: 'مرحبا' }, seller.token))[0], 400, 'seller cannot open a thread with himself');
  assert.strictEqual((await j('POST', `/ads/${ad.id}/messages`, { body: '' }, buyer.token))[0], 400);
  assert.strictEqual((await j('POST', `/ads/${ad.id}/messages`, { body: 'هل السعر قابل للتفاوض؟' }, buyer.token))[0], 201);
  const [, sconv] = await j('GET', '/conversations', null, seller.token);
  assert.strictEqual(sconv.length, 1); assert.strictEqual(sconv[0].unread, 1); assert.strictEqual(sconv[0].other.name, 'مشتري');
  assert.strictEqual((await j('POST', `/ads/${ad.id}/messages`, { body: 'نعم بسيط', buyerId: buyer.user.id }, seller.token))[0], 201);
  assert.strictEqual((await j('GET', `/conversations/${ad.id}/${buyer.user.id}`, null, stranger.token))[0], 403, 'stranger cannot read a thread');
  const [, thread] = await j('GET', `/conversations/${ad.id}/${buyer.user.id}`, null, buyer.token);
  assert.deepStrictEqual(thread.map((m) => m.mine), [true, false]);
  assert.strictEqual((await j('GET', '/conversations', null, seller.token))[1][0].unread, 1, 'buyer reading does not clear seller unread');
  await j('GET', `/conversations/${ad.id}/${buyer.user.id}`, null, seller.token);
  assert.strictEqual((await j('GET', '/conversations', null, seller.token))[1][0].unread, 0, 'reading a thread clears unread for that reader');

  // seller profile
  const [, prof] = await j('GET', `/sellers/${seller.user.id}`);
  assert.strictEqual(prof.adCount, 1); assert.ok(!('email' in prof) && !('passwordHash' in prof), 'profile hides private fields');
  const [, adDetail] = await j('GET', `/ads/${ad.id}`);
  assert.strictEqual(adDetail.seller.id, seller.user.id); assert.ok(adDetail.schema.length >= 3);

  // reports + admin moderation + featured
  assert.strictEqual((await j('POST', `/ads/${ad.id}/report`, { reason: 'سبب مخترع' }, buyer.token))[0], 400);
  assert.strictEqual((await j('POST', `/ads/${ad.id}/report`, { reason: 'احتيال', note: 'يطلب تحويل' }, buyer.token))[0], 201);
  assert.strictEqual((await j('POST', `/ads/${ad.id}/report`, { reason: 'احتيال' }, buyer.token))[0], 409, 'duplicate open report');
  const [, admin] = await j('POST', '/auth/login', { email: 'admin@test.local', password: 'test-admin-pass-1' });
  assert.strictEqual((await j('GET', '/admin/reports', null, buyer.token))[0], 403);
  const [, reps] = await j('GET', '/admin/reports', null, admin.token);
  assert.strictEqual(reps[0].reason, 'احتيال');
  assert.strictEqual((await j('PATCH', `/admin/ads/${ad.id}`, { featured: true }, buyer.token))[0], 403);
  assert.strictEqual((await j('PATCH', `/admin/ads/${ad.id}`, { featured: true }, admin.token))[1].featured, true);
  assert.strictEqual((await j('PATCH', `/admin/reports/${reps[0].id}`, { action: 'remove_ad' }, admin.token))[0], 200);
  assert.strictEqual((await j('GET', `/ads/${ad.id}`))[0], 404, 'reported ad removed by admin');

  // gallery: upload a real PNG (owner only), max 5
  const [, ad2] = await j('POST', '/ads', { title: 'آيباد', description: 'جديد', price: 2000, categoryId: categories.find((c) => c.name === 'الكترونيات').id, cityId: cities[0].id, phone: '0500000001' }, seller.token);
  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
  const up = async (tok, buf = png) => { const fd = new FormData(); fd.append('image', new Blob([buf]), 'x.png'); const r = await fetch(`${B}/ads/${ad2.id}/image`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok }, body: fd }); return [r.status, await r.json()]; };
  assert.strictEqual((await up(stranger.token))[0], 403);
  assert.strictEqual((await up(seller.token, Buffer.from('not an image')))[0], 400, 'non-image rejected by magic bytes');
  for (let i = 0; i < 5; i++) assert.strictEqual((await up(seller.token))[0], 200);
  assert.strictEqual((await up(seller.token))[0], 409, '6th image rejected');
  const [, after] = await j('DELETE', `/ads/${ad2.id}/images/0`, null, seller.token);
  assert.strictEqual(after.images.length, 4);
});
