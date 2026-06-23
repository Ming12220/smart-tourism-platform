const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

// GET /api/tours — list tours with optional filters
router.get('/tours', (req, res) => {
  const db = getDb();
  const { category, hot, promotion, search, limit } = req.query;

  let sql = `SELECT t.*, c.name as category_name, c.name_en as category_name_en FROM tours t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1`;
  const params = [];

  if (category) {
    sql += ` AND c.slug = ?`;
    params.push(category);
  }
  if (hot) {
    sql += ` AND t.is_hot = 1`;
  }
  if (promotion) {
    sql += ` AND t.is_promotion = 1`;
  }
  if (search) {
    sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY t.is_hot DESC, t.created_at DESC`;

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(parseInt(limit));
  }

  const tours = db.prepare(sql).all(...params);
  res.json({ success: true, data: tours });
});

// GET /api/tours/:id — single tour detail
router.get('/tours/:id', (req, res) => {
  const db = getDb();
  const tour = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en
    FROM tours t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!tour) {
    return res.status(404).json({ success: false, message: '未找到该线路' });
  }

  const reviews = db.prepare('SELECT * FROM reviews WHERE tour_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ success: true, data: { ...tour, reviews } });
});

// GET /api/categories
router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.json({ success: true, data: categories });
});

// GET /api/questions
router.get('/questions', (req, res) => {
  const db = getDb();
  const questions = db.prepare(`
    SELECT q.*, COUNT(a.id) as answer_count
    FROM questions q
    LEFT JOIN answers a ON a.question_id = q.id
    GROUP BY q.id
    ORDER BY q.views DESC
    LIMIT 20
  `).all();
  res.json({ success: true, data: questions });
});

// GET /api/questions/:id
router.get('/questions/:id', (req, res) => {
  const db = getDb();
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id);
  if (!question) {
    return res.status(404).json({ success: false, message: '问题不存在' });
  }

  // Increment views
  db.prepare('UPDATE questions SET views = views + 1 WHERE id = ?').run(req.params.id);

  const answers = db.prepare('SELECT * FROM answers WHERE question_id = ? ORDER BY likes DESC').all(req.params.id);
  res.json({ success: true, data: { ...question, answers } });
});

// POST /api/reviews — submit a review
router.post('/reviews', (req, res) => {
  const { tour_id, rating, content } = req.body;
  const db = getDb();
  const username = req.session.user ? req.session.user.username : '匿名用户';
  const user_id = req.session.user ? req.session.user.id : null;

  db.prepare('INSERT INTO reviews (tour_id, user_id, username, rating, content) VALUES (?, ?, ?, ?, ?)').run(
    tour_id, user_id, username, rating || 5, content
  );

  res.json({ success: true, message: '评价提交成功' });
});

// POST /api/booking — submit booking (alternative JSON API)
router.post('/booking', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  const db = getDb();
  const { tour_id, travel_date, adults, children, phone, email, note } = req.body;
  const tour = db.prepare('SELECT * FROM tours WHERE id = ?').get(tour_id);
  if (!tour) return res.status(404).json({ success: false, message: '线路不存在' });

  const adultCount = parseInt(adults) || 1;
  const childCount = parseInt(children) || 0;
  const totalPrice = tour.price * adultCount + (tour.price * 0.6 * childCount);

  const result = db.prepare(`
    INSERT INTO bookings (tour_id, user_id, username, phone, email, travel_date, adults, children, total_price, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(tour_id, req.session.user.id, req.session.user.username, phone, email, travel_date, adultCount, childCount, totalPrice, note);

  res.json({ success: true, message: '预订成功！', bookingId: result.lastInsertRowid });
});

// GET /api/bookings/my — get user's bookings
router.get('/bookings/my', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: '请先登录' });
  const db = getDb();
  const bookings = db.prepare(`
    SELECT b.*, t.title as tour_title, t.image
    FROM bookings b JOIN tours t ON b.tour_id = t.id
    WHERE b.user_id = ? ORDER BY b.created_at DESC
  `).all(req.session.user.id);
  res.json({ success: true, data: bookings });
});

// POST /api/contact — submit contact form
router.post('/contact', (req, res) => {
  const { name, phone, email, message } = req.body;
  const db = getDb();
  db.prepare('INSERT INTO contacts (name, phone, email, message) VALUES (?, ?, ?, ?)').run(
    name, phone, email, message
  );
  res.json({ success: true, message: '留言成功，我们会尽快联系您！' });
});

// GET /api/search — unified search
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: true, data: { tours: [], questions: [] } });

  const db = getDb();
  const tours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en
    FROM tours t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.title LIKE ? OR t.description LIKE ? OR t.title_en LIKE ?
    LIMIT 10
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);

  const questions = db.prepare(`
    SELECT * FROM questions WHERE title LIKE ? OR content LIKE ?
    LIMIT 10
  `).all(`%${q}%`, `%${q}%`);

  res.json({ success: true, data: { tours, questions } });
});

// POST /api/faq — chatbot FAQ query
router.post('/faq', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.json({ success: true, answer: null });
  }

  const db = getDb();
  const msg = message.trim().toLowerCase();

  // Try to match user message against knowledge_base keywords
  const allFaqs = db.prepare('SELECT * FROM knowledge_base ORDER BY sort_order').all();

  // Score each FAQ by how many keywords match
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of allFaqs) {
    const keywords = faq.keywords.split(/[\s,，]+/);
    let score = 0;
    for (const kw of keywords) {
      if (msg.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch && bestScore > 0) {
    return res.json({
      success: true,
      answer: bestMatch.answer,
      question: bestMatch.question
    });
  }

  // No match — return null so frontend can use fallback reply
  res.json({ success: true, answer: null });
});

module.exports = router;
