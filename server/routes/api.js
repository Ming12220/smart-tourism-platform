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

// GET /api/tours/nearby — 获取附近旅游线路 (MUST be before /tours/:id)
router.get('/tours/nearby', (req, res) => {
  const db = getDb();

  // 优先使用 session 中保存的位置
  let lat, lng;
  if (req.session?.userLocation) {
    lat = req.session.userLocation.latitude;
    lng = req.session.userLocation.longitude;
  }
  // URL 参数可以覆盖
  if (req.query.lat && req.query.lng) {
    lat = parseFloat(req.query.lat);
    lng = parseFloat(req.query.lng);
  }

  const radius = parseInt(req.query.radius) || 500; // 默认500km范围

  if (!lat || !lng) {
    // 没有定位信息，返回按城市分组的热门线路
    const tours = db.prepare(`
      SELECT t.*, c.name as category_name, c.name_en as category_name_en
      FROM tours t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.latitude != 0 AND t.longitude != 0
      ORDER BY t.is_hot DESC, t.satisfaction DESC
      LIMIT 12
    `).all();
    return res.json({
      success: true,
      data: tours,
      hasLocation: false,
      message: '请开启定位以查看附近线路'
    });
  }

  // 从数据库取出所有有坐标的线路
  const allTours = db.prepare(`
    SELECT t.*, c.name as category_name, c.name_en as category_name_en
    FROM tours t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.latitude != 0 AND t.longitude != 0
  `).all();

  // 计算距离并评分 (综合距离+价格: 越近越便宜越靠前)
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  var maxPrice = 0;
  allTours.forEach(function(t) { if (t.price > maxPrice) maxPrice = t.price; });

  const nearby = allTours
    .map(t => ({
      ...t,
      distance: Math.round(haversineDistance(lat, lng, t.latitude, t.longitude) * 10) / 10
    }))
    .filter(t => t.distance <= radius)
    .map(t => ({
      ...t,
      score: Math.round(((1 - t.distance / radius) * 0.7 + (1 - t.price / maxPrice) * 0.3) * 100) / 100
    }))
    .sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: nearby.slice(0, 20),
    hasLocation: true,
    userLocation: { latitude: lat, longitude: lng },
    radius: radius
  });
});

// GET /api/tours/nearby/cities — 获取所有有定位的城市列表
router.get('/tours/nearby/cities', (req, res) => {
  const db = getDb();
  const cities = db.prepare(`
    SELECT DISTINCT city, location_name, latitude, longitude
    FROM tours
    WHERE city != '' AND latitude != 0
    ORDER BY city
  `).all();
  res.json({ success: true, data: cities });
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
       OR t.description_en LIKE ? OR t.highlights LIKE ? OR t.highlights_en LIKE ?
       OR t.city LIKE ? OR t.location_name LIKE ? OR t.type_label LIKE ?
       OR t.details LIKE ? OR t.details_en LIKE ?
    ORDER BY t.is_hot DESC, t.is_promotion DESC, t.satisfaction DESC
    LIMIT 30
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  const questions = db.prepare(`
    SELECT * FROM questions WHERE title LIKE ? OR content LIKE ?
    LIMIT 10
  `).all(`%${q}%`, `%${q}%`);

  res.json({ success: true, data: { tours, questions } });
});

// GET /api/recommend — 获取个性化推荐（使用推荐引擎）
router.get('/recommend', (req, res) => {
  const { getRecommendations } = require('../middlewares/recommend');
  const tours = getRecommendations(req.session, 8);
  res.json({ success: true, data: tours });
});

// POST /api/user/location — 保存用户地理位置
router.post('/user/location', (req, res) => {
  const { latitude, longitude, city } = req.body;
  if (!latitude || !longitude) {
    return res.json({ success: false, message: '缺少位置信息' });
  }
  if (req.session) {
    req.session.userLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      city: city || '',
      updatedAt: new Date().toISOString()
    };
  }
  res.json({ success: true, message: '位置已保存' });
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

// POST /api/ai-chat — AI 智能客服
const aiChatHistory = {}; // 简单会话记忆
router.post('/ai-chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !message.trim()) {
    return res.json({ success: false, answer: '请输入您的问题' });
  }

  const db = getDb();
  const aiModule = require('../middlewares/ai');
  const apiKey = aiModule.getApiKey();

  if (!apiKey) {
    // No API key configured — fall back to FAQ matching
    const msg = message.trim().toLowerCase();
    const allFaqs = db.prepare('SELECT * FROM knowledge_base ORDER BY sort_order').all();
    let bestMatch = null, bestScore = 0;
    for (const faq of allFaqs) {
      const keywords = faq.keywords.split(/[\s,，]+/);
      let score = 0;
      for (const kw of keywords) {
        if (msg.includes(kw.toLowerCase())) score++;
      }
      if (score > bestScore) { bestScore = score; bestMatch = faq; }
    }
    if (bestMatch && bestScore > 0) {
      return res.json({ success: true, answer: bestMatch.answer, from: 'faq' });
    }
    return res.json({ success: true, answer: '🤔 请先配置 DeepSeek API Key 开启AI模式，或拨打客服热线 <b>400-888-9999</b>。', from: 'nokey' });
  }

  try {
    // Build FAQ context
    const faqContext = aiModule.buildFaqContext(db);
    const systemPrompt = aiModule.buildSystemPrompt(faqContext);

    // Build message history
    const sid = sessionId || req.session?.id || 'default';
    if (!aiChatHistory[sid]) {
      aiChatHistory[sid] = [{ role: 'system', content: systemPrompt }];
    }

    // Limit history to last 10 messages (keep system prompt)
    if (aiChatHistory[sid].length > 10) {
      aiChatHistory[sid] = [
        aiChatHistory[sid][0],
        ...aiChatHistory[sid].slice(-8)
      ];
    }

    aiChatHistory[sid].push({ role: 'user', content: message });

    const reply = await aiModule.callDeepSeek(apiKey, aiChatHistory[sid]);

    aiChatHistory[sid].push({ role: 'assistant', content: reply });

    res.json({ success: true, answer: reply });
  } catch (err) {
    console.error('AI Chat error:', err.message);
    // Fallback to FAQ matching
    const msg = message.trim().toLowerCase();
    const allFaqs = db.prepare('SELECT * FROM knowledge_base ORDER BY sort_order').all();
    let bestMatch = null, bestScore = 0;
    for (const faq of allFaqs) {
      const keywords = faq.keywords.split(/[\s,，]+/);
      let score = 0;
      for (const kw of keywords) {
        if (msg.includes(kw.toLowerCase())) score++;
      }
      if (score > bestScore) { bestScore = score; bestMatch = faq; }
    }
    if (bestMatch && bestScore > 0) {
      return res.json({ success: true, answer: bestMatch.answer, from: 'faq' });
    }
    res.json({ success: true, answer: '🤔 抱歉，小智暂时无法回答这个问题。请拨打客服热线 <b>400-888-9999</b> 或留言给我们。', from: 'fallback' });
  }
});

// POST /api/preferences — 设置用户偏好
router.post('/preferences', (req, res) => {
  const { interests } = req.body;
  if (!Array.isArray(interests)) {
    return res.json({ success: false, message: '请选择兴趣标签' });
  }
  if (req.session) {
    req.session.userInterests = interests;
  }
  res.json({ success: true, message: '兴趣标签已保存' });
});

module.exports = router;
