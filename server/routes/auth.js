const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database/init');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { user: null, error: null });
});

// Login action
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.render('login', { user: null, error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.render('login', { user: null, error: '用户名或密码错误' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar
  };

  res.redirect('/');
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { user: null, error: null });
});

// Register action
router.post('/register', (req, res) => {
  const { username, password, confirmPassword, email, phone } = req.body;
  const db = getDb();

  if (!username || !password) {
    return res.render('register', { user: null, error: '用户名和密码不能为空' });
  }
  if (password !== confirmPassword) {
    return res.render('register', { user: null, error: '两次密码输入不一致' });
  }
  if (password.length < 6) {
    return res.render('register', { user: null, error: '密码长度至少6位' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.render('register', { user: null, error: '用户名已存在' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)').run(
    username, hashed, email || null, phone || null
  );

  res.redirect('/login?registered=1');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
