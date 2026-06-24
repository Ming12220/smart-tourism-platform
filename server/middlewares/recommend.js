/**
 * 智能推荐引擎
 * 
 * 多策略推荐：兴趣标签 → 浏览历史相似度 → 热门补全
 */
const { getDb } = require('../database/init');

// 兴趣标签 → 线路 ID 映射
const INTEREST_TOUR_MAP = {
  '自然风光':  [10, 11, 14, 15],
  'Nature':    [10, 11, 14, 15],
  '历史文化':  [16, 19],
  'History':   [16, 19],
  '海岛度假':  [12, 3, 2, 6],
  'Beach':     [12, 3, 2, 6],
  '美食之旅':  [1, 9, 4],
  'Food':      [1, 9, 4],
  '亲子游':    [4, 9, 17],
  'Family':    [4, 9, 17],
  '蜜月旅行':  [6, 2, 7],
  'Honeymoon': [6, 2, 7],
  '徒步探险':  [14, 10, 5],
  'Adventure': [14, 10, 5],
  '温泉养生':  [4, 11, 9],
  'Wellness':  [4, 11, 9],
};

// 同类目的地推荐映射 (相似风格)
const SIMILAR_DESTINATIONS = {
  10: [14, 11, 15],  // 黄山 → 张家界、九寨沟、桂林
  11: [10, 14, 15],  // 九寨沟 → 黄山、张家界、桂林
  12: [3, 6, 2],     // 三亚 → 海南、巴厘岛、马尔代夫
  13: [17, 10, 11],  // 丽江 → 西双版纳、黄山、九寨沟
  14: [10, 11, 15],  // 张家界 → 黄山、九寨沟、桂林
  15: [10, 14, 11],  // 桂林 → 黄山、张家界、九寨沟
  16: [19, 18, 13],  // 西安 → 故宫、乌镇、丽江
  17: [13, 12, 6],   // 西双版纳 → 丽江、三亚、巴厘岛
  18: [19, 16, 13],  // 乌镇 → 故宫、西安、丽江
  19: [16, 18, 10],  // 故宫 → 西安、乌镇、黄山
  1:  [6, 4, 8],     // 曼谷 → 巴厘岛、日本、土耳其
  2:  [6, 7, 3],     // 马尔代夫 → 巴厘岛、塞舌尔、海南
  3:  [12, 6, 2],    // 海南 → 三亚、巴厘岛、马尔代夫
  4:  [9, 6, 8],     // 日本 → 大阪、巴厘岛、土耳其
  5:  [8, 7, 4],     // 欧洲 → 土耳其、迪拜、日本
  6:  [2, 7, 12],    // 巴厘岛 → 马尔代夫、塞舌尔、三亚
  7:  [2, 6, 5],     // 塞舌尔 → 马尔代夫、巴厘岛、欧洲
  8:  [5, 7, 1],     // 土耳其 → 欧洲、迪拜、曼谷
  9:  [4, 1, 8],     // 大阪 → 日本、曼谷、土耳其
};

/**
 * 获取推荐线路
 * @param {Object} session - req.session
 * @param {number} limit - 推荐数量
 * @returns {Array} 推荐线路数组
 */
function getRecommendations(session, limit = 8) {
  const db = getDb();
  const viewedIds = session?.viewedTours || [];
  const interests = session?.userInterests || [];
  const viewedSet = new Set(viewedIds);
  const MAX_IDS = 50; // Safety cap for SQL IN clause

  // Strategy 1: 兴趣标签匹配
  let candidateIds = new Set();
  for (const interest of interests) {
    const ids = INTEREST_TOUR_MAP[interest];
    if (ids) ids.forEach(id => candidateIds.add(id));
  }

  // Strategy 2: 浏览历史 -> 相似目的地
  for (const vid of viewedIds) {
    const similar = SIMILAR_DESTINATIONS[vid];
    if (similar) similar.forEach(id => candidateIds.add(id));
  }

  // 去重：排除用户已经看过的
  let recommendIds = [...candidateIds].filter(id => !viewedSet.has(id));

  // 截断防止 SQL 错误
  if (recommendIds.length > MAX_IDS) recommendIds = recommendIds.slice(0, MAX_IDS);

  let tours = [];
  if (recommendIds.length > 0) {
    tours = db.prepare(`
      SELECT t.*, c.name as category_name, c.name_en as category_name_en 
      FROM tours t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.id IN (${recommendIds.map(() => '?').join(',')})
      ORDER BY t.is_hot DESC, t.satisfaction DESC
    `).all(...recommendIds);
  }

  // 如果还不够，补热门线路
  if (tours.length < limit) {
    const excludeIds = [...viewedIds, ...tours.map(t => t.id)];
    const need = limit - tours.length;
    const extra = db.prepare(`
      SELECT t.*, c.name as category_name, c.name_en as category_name_en 
      FROM tours t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.is_hot = 1 
      ${excludeIds.length > 0 ? 'AND t.id NOT IN (' + excludeIds.map(() => '?').join(',') + ')' : ''}
      ORDER BY t.created_at DESC 
      LIMIT ${need}
    `).all(...excludeIds);
    tours = tours.concat(extra);
  }

  // 最后截断到 limit
  return tours.slice(0, limit);
}

/**
 * 获取推荐理由
 */
function getRecommendReason(tourId, session) {
  const interests = session?.userInterests || [];
  const viewedIds = session?.viewedTours || [];

  // 从兴趣标签找理由
  for (const interest of interests) {
    const ids = INTEREST_TOUR_MAP[interest];
    if (ids && ids.includes(tourId)) {
      const reasons = {
        '自然风光': '🌄 你喜欢自然风光，特地推荐',
        'Nature': '🌄 Nature lover, just for you',
        '历史文化': '🏛️ 你对历史文化感兴趣',
        'History': '🏛️ History enthusiast',
        '海岛度假': '🏝️ 喜欢海岛度假? 看看这个',
        'Beach': '🏝️ Beach vacation recommended',
        '美食之旅': '🍜 美食之旅推荐',
        'Food': '🍜 Food tour recommendation',
        '亲子游': '👨‍👩‍👧 适合亲子出游',
        'Family': '👨‍👩‍👧 Great for family trip',
        '蜜月旅行': '💑 蜜月旅行精选',
        'Honeymoon': '💑 Honeymoon special',
        '徒步探险': '🥾 探险爱好者推荐',
        'Adventure': '🥾 Adventure pick',
        '温泉养生': '♨️ 温泉养生好去处',
        'Wellness': '♨️ Wellness & relaxation',
      };
      return reasons[interest] || '🎯 猜你会喜欢';
    }
  }

  // 从浏览历史找理由
  for (const vid of viewedIds) {
    const similar = SIMILAR_DESTINATIONS[vid];
    if (similar && similar.includes(tourId)) {
      return '🔗 和你浏览过的线路风格相似';
    }
  }

  return '🔥 热门推荐';
}

/**
 * 记录用户行为
 */
function trackBehavior(session, action, data) {
  if (!session) return;

  switch (action) {
    case 'view_tour': {
      const tourId = data.tourId;
      if (!session.viewedTours) session.viewedTours = [];
      if (!session.viewedTours.includes(tourId)) {
        session.viewedTours.unshift(tourId);
        if (session.viewedTours.length > 30) session.viewedTours.pop();
      }
      if (!session.viewedCategories) session.viewedCategories = {};
      break;
    }
    case 'search': {
      if (!session.searchHistory) session.searchHistory = [];
      const q = data.query;
      if (q && !session.searchHistory.includes(q)) {
        session.searchHistory.unshift(q);
        if (session.searchHistory.length > 20) session.searchHistory.pop();
      }
      break;
    }
    case 'book': {
      if (!session.bookedTours) session.bookedTours = [];
      const tourId = data.tourId;
      if (!session.bookedTours.includes(tourId)) {
        session.bookedTours.push(tourId);
      }
      break;
    }
  }
}

module.exports = { getRecommendations, getRecommendReason, trackBehavior };
