const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./database/init');
const i18n = require('./middlewares/i18n');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3000;

// Initialize database
initDatabase();

// Run English data migration
const { migrateEn } = require('./database/migrate_en_auto');
migrateEn();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'database') }),
  secret: 'smart-tourism-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// View engine MUST be set before page routes
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user and i18n available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// i18n middleware (must be after session, before routes)
app.use(i18n);

// Static files — serve original project assets (after route handlers)
// Only serve /css, /js, /img, and root static files (not index.html)
app.use(['/css', '/js', '/img'], express.static(path.join(__dirname, '..')));
app.use('/favicon.ico', express.static(path.join(__dirname, '../img/y.ico')));

// Language switch route
app.get('/lang/:lang', (req, res) => {
  const lang = req.params.lang;
  if (['zh', 'en'].includes(lang)) {
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
    if (req.session) req.session.lang = lang;
  }
  const redirect = req.get('Referer') || '/';
  res.redirect(redirect);
});

// Routes
app.use('/', authRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// === Page routes ===

// Homepage
app.get('/', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const hotTours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.is_hot = 1 ORDER BY t.created_at DESC LIMIT 9
  `).all();
  const promotions = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.is_promotion = 1 ORDER BY t.created_at DESC LIMIT 6
  `).all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.render('index', { hotTours, promotions, categories });
});

// Search page
app.get('/search', (req, res) => {
  const { q } = req.query;
  const { getDb } = require('./database/init');
  const db = getDb();

  let tours = [];
  let questions = [];

  if (q && q.trim()) {
    const query = `%${q.trim()}%`;
    tours = db.prepare(`
      SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.title LIKE ? OR t.description LIKE ? OR t.title_en LIKE ? OR t.description_en LIKE ?
      LIMIT 20
    `).all(query, query, query, query);

    questions = db.prepare(`
      SELECT * FROM questions WHERE title LIKE ? OR content LIKE ?
      LIMIT 10
    `).all(query, query);
  }

  res.render('search', { query: q || '', tours, questions });
});

// Tourism Consulting
app.get('/lyzx', (req, res) => {
  res.render('lyzx');
});

// Q&A
app.get('/lywd', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const questions = db.prepare(`
    SELECT q.*, COUNT(a.id) as answer_count
    FROM questions q LEFT JOIN answers a ON a.question_id = q.id
    GROUP BY q.id ORDER BY q.views DESC LIMIT 20
  `).all();
  res.render('lywd', { questions });
});

// Beautiful China
app.get('/zmzg', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id >= 10 OR t.id = 3
    ORDER BY t.created_at DESC
  `).all();
  res.render('zmzg', { tours });
});

// Overseas attractions
app.get('/gwjd', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE (c.slug = 'abroad-long' OR c.slug = 'self-tour') AND t.id NOT IN (3, 12, 13, 17)
    ORDER BY t.created_at DESC
  `).all();
  res.render('gwjd', { tours });
});

// === Booking routes ===

// Tour detail page
app.get('/tour/:id', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const tour = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?
  `).get(req.params.id);
  if (!tour) return res.status(404).render('error', { message: '线路不存在' });
  const reviews = db.prepare('SELECT * FROM reviews WHERE tour_id = ? ORDER BY created_at DESC LIMIT 5').all(req.params.id);
  res.render('tour-detail', { tour, reviews });
});

// Booking page
app.get('/book/:tourId', (req, res) => {
  if (!req.session.user) return res.redirect('/login?redirect=/book/' + req.params.tourId);
  const { getDb } = require('./database/init');
  const db = getDb();
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.tourId);
  if (!tour) return res.status(404).render('error', { message: '线路不存在' });
  res.render('booking', { tour, error: null, success: null });
});

// Submit booking
app.post('/book/:tourId', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { getDb } = require('./database/init');
  const db = getDb();
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.tourId);
  if (!tour) return res.status(404).render('error', { message: '线路不存在' });

  const { travel_date, adults, children, phone, email, note } = req.body;
  const adultCount = parseInt(adults) || 1;
  const childCount = parseInt(children) || 0;
  const totalPrice = tour.price * adultCount + (tour.price * 0.6 * childCount);

  if (!travel_date || !phone) {
    return res.render('booking', { tour, error: '请填写出行日期和联系电话', success: null });
  }

  const result = db.prepare(`
    INSERT INTO bookings (tour_id, user_id, username, phone, email, travel_date, adults, children, total_price, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    tour.id, req.session.user.id, req.session.user.username,
    phone, email, travel_date, adultCount, childCount, totalPrice, note
  );

  res.redirect('/booking/success/' + result.lastInsertRowid);
});

// Booking success page
app.get('/booking/success/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { getDb } = require('./database/init');
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*, t.title as tour_title, t.image, t.days, t.type_label
    FROM bookings b JOIN tours t ON b.tour_id = t.id
    WHERE b.id = ?
  `).get(req.params.id);
  if (!booking) return res.status(404).render('error', { message: '订单不存在' });
  res.render('booking-success', { booking });
});

// My bookings
app.get('/my-bookings', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { getDb } = require('./database/init');
  const db = getDb();
  const bookings = db.prepare(`
    SELECT b.*, t.title as tour_title, t.image, t.days, t.type_label
    FROM bookings b JOIN tours t ON b.tour_id = t.id
    WHERE b.user_id = ? ORDER BY b.created_at DESC
  `).all(req.session.user.id);
  res.render('my-bookings', { bookings });
});

// Customer service page
app.get('/kefu', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const questions = db.prepare('SELECT * FROM questions ORDER BY views DESC LIMIT 6').all();
  res.render('kefu', { questions });
});

// Static fallback — serve remaining static files (html, png, jpg, etc.)
// This runs AFTER route handlers so page routes take priority
app.use(express.static(path.join(__dirname, '..')));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: '页面未找到' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 智慧旅游在线服务平台已启动`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`  👤 管理员账号: admin / admin123`);
  console.log(`  📋 后台管理: http://localhost:${PORT}/admin\n`);
});
