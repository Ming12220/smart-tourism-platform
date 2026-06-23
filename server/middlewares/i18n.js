const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const SUPPORTED_LANGS = ['zh', 'en'];
const DEFAULT_LANG = 'zh';

// Cache loaded locales
const cache = {};

function loadLocale(lang) {
  if (cache[lang]) return cache[lang];
  try {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    cache[lang] = JSON.parse(content);
    return cache[lang];
  } catch (e) {
    console.error(`Failed to load locale: ${lang}`, e.message);
    return {};
  }
}

/**
 * i18n middleware
 * Priority: query param > cookie > session > Accept-Language > default (zh)
 * Makes `__()` and `lang` available in all EJS views.
 */
function i18nMiddleware(req, res, next) {
  let lang = DEFAULT_LANG;

  // 1. Query param (e.g. ?lang=en)
  if (req.query.lang && SUPPORTED_LANGS.includes(req.query.lang)) {
    lang = req.query.lang;
  }
  // 2. Cookie
  else if (req.cookies && req.cookies.lang && SUPPORTED_LANGS.includes(req.cookies.lang)) {
    lang = req.cookies.lang;
  }
  // 3. Session
  else if (req.session && req.session.lang && SUPPORTED_LANGS.includes(req.session.lang)) {
    lang = req.session.lang;
  }
  // 4. Browser Accept-Language
  else if (req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language'].split(',')[0].substring(0, 2);
    if (SUPPORTED_LANGS.includes(acceptLang)) {
      lang = acceptLang;
    }
  }

  // Save to session for persistence
  if (req.session) {
    req.session.lang = lang;
  }

  const locale = loadLocale(lang);

  // Translation function available in all views
  res.locals.__ = function (key, ...args) {
    let text = locale[key];
    if (text === undefined) {
      // Fallback to Chinese
      const zh = loadLocale('zh');
      text = zh[key];
    }
    if (text === undefined) {
      text = key;
    }
    // Simple interpolation: ___('key', 'replacement')
    if (args.length > 0) {
      let i = 0;
      text = text.replace(/%s/g, () => args[i++] || '');
    }
    return text;
  };

  res.locals.lang = lang;
  res.locals.isEn = lang === 'en';
  res.locals.isZh = lang === 'zh';
  res.locals.alternateLang = lang === 'zh' ? 'en' : 'zh';

  // Tour data translation helper: tt(tourObj, 'fieldName')
  // Returns the English version if available and lang=en, otherwise returns Chinese
  res.locals.tt = function (obj, field) {
    if (!obj) return '';
    const enField = field + '_en';
    if (res.locals.isEn && obj[enField] !== null && obj[enField] !== undefined && obj[enField] !== '') {
      return obj[enField];
    }
    return obj[field] !== null && obj[field] !== undefined ? obj[field] : '';
  };

  // Category name helper
  res.locals.tc = function (cat) {
    if (!cat) return '';
    if (res.locals.isEn && cat.name_en) return cat.name_en;
    return cat.name || '';
  };

  next();
}

module.exports = i18nMiddleware;
