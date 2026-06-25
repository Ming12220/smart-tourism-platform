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

// Run location data migration
const { migrateLocation } = require('./database/migrate_location');
migrateLocation();

// Run details migration
const { migrateDetails } = require('./database/migrate_details');
migrateDetails();

// Run new tours migration
const { migrateNewTours } = require('./database/migrate_newtours');
migrateNewTours();

// Run English translation for new tours
const { migrateEnNewTours } = require('./database/migrate_en_newtours');
migrateEnNewTours();

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

  // Personalized recommendations (using recommendation engine)
  const { getRecommendations, getRecommendReason } = require('./middlewares/recommend');
  const recommendTours = getRecommendations(req.session, 6);

  // Generate recommendation reasons
  const recommendReasons = {};
  recommendTours.forEach(t => {
    recommendReasons[t.id] = getRecommendReason(t.id, req.session);
  });

  // Get nearby tours (via session location if available) — sorted by distance + price
  let nearbyTours = [];
  if (req.session?.userLocation) {
    const { lat, lng } = req.session.userLocation;
    const allLocated = db.prepare(`
      SELECT t.*, c.name as category_name, c.name_en as category_name_en 
      FROM tours t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.latitude != 0 AND t.longitude != 0
    `).all();
    
    function haversine(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    
    const maxDist = 500;
    const maxPrice = Math.max(...allLocated.map(t => t.price));
    
    nearbyTours = allLocated
      .map(t => {
        const dist = Math.round(haversine(lat, lng, t.latitude, t.longitude) * 10) / 10;
        const distScore = dist <= maxDist ? 1 - (dist / maxDist) : 0;
        const priceScore = 1 - (t.price / maxPrice);
        // Score: 70% distance + 30% price — closer & cheaper wins
        const score = distScore * 0.7 + priceScore * 0.3;
        return { ...t, distance: dist, score: Math.round(score * 100) / 100 };
      })
      .filter(t => t.distance <= maxDist)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  res.render('index', {
    hotTours, promotions, categories, recommendTours, recommendReasons,
    nearbyTours,
    userLocation: req.session?.userLocation || null,
    userInterests: req.session.userInterests || [],
    bookingCount: db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status != 'cancelled'").get().count
  });
});

// Search page
app.get('/search', (req, res) => {
  const { q } = req.query;
  const { getDb } = require('./database/init');
  const db = getDb();

  // Track search behavior
  if (q && q.trim()) {
    const { trackBehavior } = require('./middlewares/recommend');
    trackBehavior(req.session, 'search', { query: q.trim() });
  }

  let tours = [];
  let questions = [];

  if (q && q.trim()) {
    const words = q.trim().split(/\s+/).filter(function(w){ return w.length > 0; });
    if (words.length === 1) {
      var query = '%' + q.trim() + '%';
      tours = db.prepare(`
        SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.title LIKE ? OR t.description LIKE ? OR t.title_en LIKE ?
           OR t.description_en LIKE ? OR t.highlights LIKE ? OR t.highlights_en LIKE ?
           OR t.city LIKE ? OR t.location_name LIKE ? OR t.type_label LIKE ?
           OR t.details LIKE ? OR t.details_en LIKE ?
        ORDER BY t.is_hot DESC, t.is_promotion DESC, t.satisfaction DESC
        LIMIT 30
      `).all(query, query, query, query, query, query, query, query, query, query, query);
    } else {
      var conditions = [];
      var params = [];
      words.forEach(function(w) {
        var like = '%' + w + '%';
        conditions.push('(t.title LIKE ? OR t.description LIKE ? OR t.title_en LIKE ?' +
           ' OR t.description_en LIKE ? OR t.highlights LIKE ? OR t.highlights_en LIKE ?' +
           ' OR t.city LIKE ? OR t.location_name LIKE ? OR t.type_label LIKE ?' +
           ' OR t.details LIKE ? OR t.details_en LIKE ?)');
        for (var i = 0; i < 11; i++) params.push(like);
      });
      tours = db.prepare(`
        SELECT DISTINCT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${conditions.join(' OR ')}
        ORDER BY t.is_hot DESC, t.is_promotion DESC, t.satisfaction DESC
        LIMIT 30
      `).all(params);
    }

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
  // Foreign cities to exclude from 最美中国
  const foreignCities = ['曼谷','马累','东京','巴黎','巴厘岛','迪拜','伊斯坦布尔','大阪','首尔','新加坡','普吉','开罗','悉尼','基督城','加德满都','莫斯科'];
  const placeholders = foreignCities.map(() => '?').join(',');
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.city NOT IN (${placeholders}) AND t.city != ''
    ORDER BY t.created_at DESC
  `).all(...foreignCities);
  res.render('zmzg', { tours });
});

// Overseas attractions
app.get('/gwjd', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();
  const foreignCities = ['曼谷','马累','东京','巴黎','巴厘岛','迪拜','伊斯坦布尔','大阪','首尔','新加坡','普吉','开罗','悉尼','基督城','加德满都','莫斯科'];
  const placeholders = foreignCities.map(() => '?').join(',');
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.city IN (${placeholders})
    ORDER BY t.created_at DESC
  `).all(...foreignCities);
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

  // Track viewing history for recommendations
  const { trackBehavior } = require('./middlewares/recommend');
  trackBehavior(req.session, 'view_tour', { tourId: tour.id });
  if (!req.session.viewedCategories) req.session.viewedCategories = {};
  const cat = tour.category_id;
  req.session.viewedCategories[cat] = (req.session.viewedCategories[cat] || 0) + 1;

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
    SELECT b.*, t.title as tour_title, t.title_en as tour_title_en, t.image, t.days, t.type_label
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

// === Nearby Tours page (定位周边游) ===
app.get('/nearby', (req, res) => {
  const { getDb } = require('./database/init');
  const db = getDb();

  // Get all located tours
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en 
    FROM tours t 
    LEFT JOIN categories c ON t.category_id = c.id 
    WHERE t.latitude != 0 AND t.longitude != 0
    ORDER BY t.is_hot DESC
  `).all();

  // If user has location, compute distance + price score and sort
  var userLocation = req.session?.userLocation || null;
  if (userLocation) {
    function haversine(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    var maxPrice = 0;
    tours.forEach(function(t) { if (t.price > maxPrice) maxPrice = t.price; });
    tours.forEach(function(t) {
      t.distance = Math.round(haversine(userLocation.latitude, userLocation.longitude, t.latitude, t.longitude) * 10) / 10;
      t.score = Math.round(((1 - Math.min(t.distance, 500) / 500) * 0.7 + (1 - t.price / maxPrice) * 0.3) * 100) / 100;
    });
    tours.sort(function(a, b) { return b.score - a.score; });
  }

  // Group by city
  const cityMap = {};
  tours.forEach(t => {
    const city = t.city || '其他';
    if (!cityMap[city]) cityMap[city] = [];
    cityMap[city].push(t);
  });

  res.render('nearby', {
    tours,
    cityGroups: Object.entries(cityMap),
    totalCities: Object.keys(cityMap).length,
    userLocation: userLocation
  });
});

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
