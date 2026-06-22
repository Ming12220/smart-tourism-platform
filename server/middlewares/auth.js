function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      message: '权限不足，需要管理员账号',
      user: req.session.user
    });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
