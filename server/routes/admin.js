const express = require('express');
const { getDb } = require('../database/init');
const { requireAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../img'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// All admin routes require login as admin
router.use(requireAdmin);

// Dashboard
router.get('/', (req, res) => {
  const db = getDb();
  const tourCount = db.prepare('SELECT COUNT(*) as count FROM tours').get().count;
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role='user'").get().count;
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
  const pendingBookingCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='pending'").get().count;

  // Revenue stats
  const revenueStats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN b.status!='cancelled' THEN b.total_price ELSE 0 END), 0) as total_revenue,
      COUNT(*) as total_bookings,
      SUM(CASE WHEN b.status='pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN b.status='confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN b.status='completed' THEN 1 ELSE 0 END) as completed
    FROM bookings b
  `).get();

  // Recent bookings
  const recentBookings = db.prepare(`
    SELECT b.*, t.title as tour_title
    FROM bookings b JOIN tours t ON b.tour_id = t.id
    ORDER BY b.created_at DESC LIMIT 5
  `).all();

  res.render('admin/dashboard', {
    user: req.session.user,
    stats: { tourCount, userCount, questionCount, contactCount, bookingCount, pendingBookingCount },
    revenueStats,
    recentBookings
  });
});

// Tour list
router.get('/tours', (req, res) => {
  const db = getDb();
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en
    FROM tours t LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC
  `).all();
  res.render('admin/tours', { user: req.session.user, tours });
});

// Add tour form
router.get('/tours/add', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.render('admin/tour-form', { user: req.session.user, tour: null, categories, error: null });
});

// Edit tour form
router.get('/tours/edit/:id', (req, res) => {
  const db = getDb();
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(req.params.id);
  if (!tour) return res.redirect('/admin/tours');
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.render('admin/tour-form', { user: req.session.user, tour, categories, error: null });
});

// Save tour (create or update)
router.post('/tours/save', upload.single('image'), (req, res) => {
  const db = getDb();
  const { id, title, category_id, type_label, description, price, original_price, satisfaction, transport, days, highlights, route, details, details_en, is_hot, is_promotion, promotion_end } = req.body;

  if (!title || !price) {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
    const tour = id ? db.prepare('SELECT * FROM tours WHERE id = ?').get(id) : null;
    return res.render('admin/tour-form', {
      user: req.session.user, tour, categories,
      error: '标题和价格不能为空'
    });
  }

  let image = req.file ? req.file.filename : null;

  if (id) {
    // Update (with details)
    if (image) {
      db.prepare(`
        UPDATE tours SET title=?, category_id=?, type_label=?, description=?, price=?, original_price=?,
        satisfaction=?, image=?, transport=?, days=?, highlights=?, route=?, details=?, details_en=?,
        is_hot=?, is_promotion=?, promotion_end=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(title, category_id, type_label, description, price, original_price, satisfaction, image, transport, days, highlights, route, details, details_en, is_hot || 0, is_promotion || 0, promotion_end, id);
    } else {
      db.prepare(`
        UPDATE tours SET title=?, category_id=?, type_label=?, description=?, price=?, original_price=?,
        satisfaction=?, transport=?, days=?, highlights=?, route=?, details=?, details_en=?,
        is_hot=?, is_promotion=?, promotion_end=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(title, category_id, type_label, description, price, original_price, satisfaction, transport, days, highlights, route, details, details_en, is_hot || 0, is_promotion || 0, promotion_end, id);
    }
  } else {
    // Insert (with details)
    db.prepare(`
      INSERT INTO tours (title, category_id, type_label, description, price, original_price, satisfaction, image, transport, days, highlights, route, details, details_en, is_hot, is_promotion, promotion_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, category_id, type_label, description, price, original_price, satisfaction, image || 'tour1.jpg', transport, days, highlights, route, details, details_en, is_hot || 0, is_promotion || 0, promotion_end);
  }

  res.redirect('/admin/tours');
});

// Delete tour
router.get('/tours/delete/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM tours WHERE id = ?').run(req.params.id);
  res.redirect('/admin/tours');
});

// Users list
router.get('/users', (req, res) => {
  const db = getDb();
  const users = db.prepare("SELECT id, username, email, phone, role, created_at FROM users ORDER BY created_at DESC").all();
  res.render('admin/users', { user: req.session.user, users });
});

// Questions list
router.get('/questions', (req, res) => {
  const db = getDb();
  const questions = db.prepare(`
    SELECT q.*, COUNT(a.id) as answer_count
    FROM questions q LEFT JOIN answers a ON a.question_id = q.id
    GROUP BY q.id ORDER BY q.created_at DESC
  `).all();
  res.render('admin/questions', { user: req.session.user, questions });
});

// Submit answer for a question
router.post('/questions/answer', (req, res) => {
  const { question_id, content } = req.body;
  const db = getDb();
  db.prepare('INSERT INTO answers (question_id, author, content) VALUES (?, ?, ?)').run(
    question_id, req.session.user.username, content
  );
  db.prepare('UPDATE questions SET answers = answers + 1 WHERE id = ?').run(question_id);
  res.redirect('/admin/questions');
});

// Contacts list
router.get('/contacts', (req, res) => {
  const db = getDb();
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  res.render('admin/contacts', { user: req.session.user, contacts });
});

// Bookings list
router.get('/bookings', (req, res) => {
  const db = getDb();
  const status = req.query.status;
  let sql = `
    SELECT b.*, t.title as tour_title, t.image, t.days, t.type_label
    FROM bookings b JOIN tours t ON b.tour_id = t.id
  `;
  const params = [];
  if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    sql += ` WHERE b.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY b.created_at DESC`;
  const bookings = db.prepare(sql).all(...params);

  // Stats
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN b.status='pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN b.status='confirmed' THEN 1 ELSE 0 END) as confirmed_count,
      SUM(CASE WHEN b.status='completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN b.status='cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      COALESCE(SUM(CASE WHEN b.status!='cancelled' THEN b.total_price ELSE 0 END), 0) as total_revenue
    FROM bookings b
  `).get();

  res.render('admin/bookings', { user: req.session.user, bookings, currentStatus: status || 'all', stats });
});

// Booking detail page
router.get('/bookings/detail/:id', (req, res) => {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*, t.title as tour_title, t.image, t.days, t.type_label, t.price as unit_price
    FROM bookings b JOIN tours t ON b.tour_id = t.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!booking) {
    return res.redirect('/admin/bookings');
  }

  res.render('admin/booking-detail', { user: req.session.user, booking });
});

// Update booking status (with redirect support)
router.post('/bookings/status', (req, res) => {
  const { id, status, redirect } = req.body;
  const db = getDb();
  db.prepare('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  if (redirect) {
    res.redirect(redirect);
  } else {
    res.redirect('/admin/bookings');
  }
});

// Knowledge base management
router.get('/faq', (req, res) => {
  const db = getDb();
  const faqs = db.prepare('SELECT * FROM knowledge_base ORDER BY category, sort_order').all();
  res.render('admin/faq', { user: req.session.user, faqs });
});

// Add FAQ
router.post('/faq/add', (req, res) => {
  const { keywords, question, answer, category, sort_order } = req.body;
  const db = getDb();
  db.prepare('INSERT INTO knowledge_base (keywords, question, answer, category, sort_order) VALUES (?, ?, ?, ?, ?)').run(
    keywords, question, answer, category || 'general', parseInt(sort_order) || 0
  );
  res.redirect('/admin/faq');
});

// Delete FAQ
router.get('/faq/delete/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(req.params.id);
  res.redirect('/admin/faq');
});

module.exports = router;
