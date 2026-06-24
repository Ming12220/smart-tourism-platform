const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'smart_tourism.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER,
      type_label TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      satisfaction TEXT DEFAULT '0%',
      image TEXT DEFAULT 't1.jpg',
      transport TEXT,
      days TEXT,
      highlights TEXT,
      route TEXT,
      is_hot INTEGER DEFAULT 0,
      is_promotion INTEGER DEFAULT 0,
      promotion_end TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      avatar TEXT,
      tags TEXT,
      answers INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      author TEXT,
      content TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tour_id INTEGER,
      user_id INTEGER,
      username TEXT,
      rating INTEGER DEFAULT 5,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tour_id INTEGER NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      travel_date TEXT NOT NULL,
      adults INTEGER DEFAULT 1,
      children INTEGER DEFAULT 0,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tour_id) REFERENCES tours(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keywords TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedData(db);
  }

  return db;
}

function seedData(db) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  // Admin user
  db.prepare(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`).run(
    'admin', hashedPassword, 'admin@smart-tourism.com', 'admin'
  );
  db.prepare(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`).run(
    'testuser', bcrypt.hashSync('123456', 10), 'user@test.com', 'user'
  );

  // Categories
  const categories = [
    ['国内长线', 'domestic-long', 1],
    ['出境长线', 'abroad-long', 2],
    ['自助旅游', 'self-tour', 3],
    ['国内短线', 'domestic-short', 4],
    ['游轮观光', 'cruise', 5],
  ];
  const insertCat = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
  for (const c of categories) insertCat.run(...c);

  // Tours
  const tours = [
    ['<曼谷-芭提雅6日游>', 1, '国内长线', '包团特惠，超丰富景点，升级1晚国五，无自费，更赠送600元/成人自费卷', 2864, 3980, '77%', 'tour1.jpg', '春秋航班，杭州出发，无需转机', '6天5晚', '大皇宫|玉佛寺|芭提雅海滩|人妖秀', '杭州-曼谷-芭提雅-曼谷-杭州', 1, 1, '2026-12-31'],
    ['<马尔代夫双鱼岛Olhuveli4晚6日自助游>', 2, '出境长线', '上海出发，机+酒包含：早晚餐+快艇', 8039, 9980, '97%', 't2.jpg', '上海直飞', '6天4晚', '双鱼岛|海上日落|浮潜|SPA', '上海-马累-双鱼岛-马累-上海', 1, 1, '2026-12-31'],
    ['<海南双飞5日游>', 3, '自助旅游', '含盐城接送，全程挂牌四星酒店，一价全含，零自费"自费项目"免费送', 1780, 3280, '90%', 't3.jpg', '春秋航班，盐城出发', '5天4晚', '三亚|亚龙湾|天涯海角|蜈支洲岛', '盐城-三亚-亚龙湾-天涯海角-盐城', 1, 1, '2026-12-31'],
    ['<富士-大阪-东京8日游>', 3, '自助旅游', '暑期亲子，2天自由，无导游安排自费项目，全程不强迫购物', 9499, 9999, '97%', 't4.jpg', '国际航班', '8天6晚', '富士山|大阪城|东京迪士尼|银座', '上海-大阪-富士山-东京-上海', 1, 0, null],
    ['<法瑞意德12日游>', 4, '国内短线', '4至5星，金色列车，少女峰，部分THE MALL', 9199, 9999, '97%', 't5a.jpg', '国际航班', '12天10晚', '少女峰|金色列车|卢浮宫|威尼斯', '上海-巴黎-米兰-因特拉肯-罗马-上海', 1, 0, null],
    ['<巴厘岛6日半自助游>', 2, '出境长线', '蓝梦出海，独栋别墅，悦榕庄下午茶，纯玩', 6488, 8460, '95%', 't6.jpg', '上海直飞', '6天4晚', '蓝梦岛|乌布皇宫|金巴兰海滩|海神庙', '上海-巴厘岛-蓝梦岛-巴厘岛-上海', 1, 1, '2026-12-31'],
    ['<塞舌尔迪拜9日自助游>', 5, '游轮观光', '一游两国，4晚塞舌尔，2晚迪拜，香港EK往返', 9669, 9999, '100%', 't7.jpg', '阿联酋航空', '9天7晚', '塞舌尔海滩|迪拜塔|棕榈岛|沙漠冲沙', '香港-迪拜-塞舌尔-迪拜-香港', 1, 0, null],
    ['<花样姐姐土耳其9日或10日游>', 2, '出境长线', '最高立减3000！中餐六菜一汤+土耳其当地美食满足您挑剔味蕾', 9999, 9999, '93%', 't8.jpg', '国际航班', '10天8晚', '热气球|棉花堡|以弗所|蓝色清真寺', '上海-伊斯坦布尔-卡帕多奇亚-棉花堡-上海', 1, 0, null],
    ['<大阪-京都-箱根双飞6日游>', 4, '国内短线', '盐城直飞，不走回头路，境外无自费，超值之旅', 5284, 8437, '100%', 't9.jpg', '春秋航班，盐城出发', '6天5晚', '大阪城|京都清水寺|箱根温泉|奈良鹿', '盐城-大阪-京都-箱根-奈良-盐城', 1, 1, '2026-12-31'],
  ];

  const insertTour = db.prepare(`
    INSERT INTO tours (title, category_id, type_label, description, price, original_price, satisfaction, image, transport, days, highlights, route, is_hot, is_promotion, promotion_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of tours) insertTour.run(...t);

  // 追加国内热门景点专属线路（调低价格版）
  const hotSpots = [
    ['🚩 黄山·天下第一奇山 3日游', 4, '国内短线', '五岳归来不看山，黄山归来不看岳。深度游览黄山风景区，观奇松怪石云海温泉，住山顶看日出云海。', 1299, 2580, '99%', 't10.jpg', '高铁往返，舒适出行', '3天2晚', '迎客松|光明顶|西海大峡谷|云海日出|温泉', '出发地-黄山北-黄山风景区-光明顶-西海大峡谷-返程', 1, 1, '2026-12-31'],
    ['🚩 九寨沟·人间仙境 4日游', 1, '国内长线', '童话世界九寨沟，翠海叠瀑彩林雪峰。畅游九寨沟主景区，感受"九寨归来不看水"的绝美意境。', 2280, 4280, '98%', 't11.jpg', '成都集合，空调旅游大巴', '4天3晚', '五花海|诺日朗瀑布|五彩池|长海|树正群海', '成都-九寨沟-五花海-诺日朗瀑布-五彩池-成都', 1, 1, '2026-10-31'],
    ['🚩 三亚·天涯海角 5日游', 3, '自助旅游', '热带天堂三亚，阳光沙滩椰林。蜈支洲岛潜水、亚龙湾游泳、天涯海角打卡，尽享海岛度假时光。', 1680, 3280, '96%', 't12.jpg', '三亚凤凰机场接送', '5天4晚', '蜈支洲岛|亚龙湾|天涯海角|三亚湾|南山寺', '三亚-蜈支洲岛-亚龙湾-天涯海角-南山-三亚', 1, 1, '2026-12-31'],
    ['🚩 丽江古城·玉龙雪山 5日游', 3, '自助旅游', '漫步世界文化遗产丽江古城，仰望玉龙雪山。束河古镇品茶，拉市海骑马，感受纳西族风情。', 1880, 3680, '97%', 't13.jpg', '丽江三义机场接送', '5天4晚', '丽江古城|玉龙雪山|束河古镇|拉市海|印象丽江', '丽江-丽江古城-玉龙雪山-蓝月谷-束河古镇-拉市海', 1, 1, '2026-12-31'],
    ['🚩 张家界·阿凡达仙境 4日游', 4, '国内短线', '阿凡达取景地张家界，三千奇峰拔地起。袁家界看哈利路亚山，天门山走玻璃栈道，金鞭溪戏水。', 1480, 2980, '97%', 't14.jpg', '高铁直达，专车接送', '4天3晚', '袁家界|天子山|天门山|玻璃栈道|金鞭溪', '张家界-袁家界-天子山-天门山-玻璃栈道-金鞭溪-返程', 1, 1, '2026-12-31'],
    ['🚩 桂林·山水甲天下 4日游', 4, '国内短线', '"桂林山水甲天下"，漓江竹筏漂流，阳朔西街漫步，银子岩探秘。乘竹筏赏漓江风光，骑行十里画廊，感受山水画卷。', 1380, 2980, '98%', 't15.jpg', '高铁至桂林，专车接送', '4天3晚', '漓江|阳朔西街|银子岩|十里画廊|象鼻山', '桂林-漓江竹筏-阳朔-银子岩-十里画廊-象鼻山-返程', 1, 1, '2026-12-31'],
    ['🚩 西安·千年古都 4日游', 1, '国内长线', '十三朝古都西安，世界第八大奇迹兵马俑，夜游大唐不夜城。登古城墙，逛回民街，品陕西美食，梦回长安。', 1680, 3380, '97%', 't16.jpg', '高铁至西安，专车接送', '4天3晚', '兵马俑|古城墙|大雁塔|大唐不夜城|回民街', '西安-兵马俑-华清宫-古城墙-大雁塔-大唐不夜城-回民街', 1, 1, '2026-12-31'],
    ['🚩 西双版纳·热带雨林 5日游', 3, '自助旅游', '热带雨林西双版纳，野象谷看亚洲象，傣族园体验泼水节。漫步热带植物园，感受不一样的东南亚风情。', 2080, 3980, '96%', 't17.jpg', '飞抵景洪，全程专车', '5天4晚', '野象谷|热带植物园|傣族园|告庄夜市|望天树', '景洪-野象谷-热带植物园-傣族园-告庄夜市-望天树-返程', 1, 1, '2026-11-30'],
    ['🚩 乌镇·梦里水乡 3日游', 4, '国内短线', '中国最后的枕水人家，乌镇西栅景区。乘摇橹船穿行水巷，赏皮影戏，品三白酒，住临水民宿。', 980, 2180, '99%', 't18.jpg', '高铁至桐乡，专车接送', '3天2晚', '西栅|东栅|木心美术馆|茅盾故居|水上集市', '桐乡-乌镇西栅-木心美术馆-东栅-茅盾故居-水上集市-返程', 1, 1, '2026-12-31'],
    ['🚩 故宫·紫禁城深度游 3日游', 4, '国内短线', '穿越600年紫禁城，深度游览故宫博物院。看三大殿、逛御花园、登景山俯瞰故宫全景，探访国家博物馆。', 1580, 3280, '97%', 't19.jpg', '高铁至北京，地铁直达', '3天2晚', '太和殿|乾清宫|御花园|景山公园|国家博物馆', '北京-故宫博物院-景山公园-国家博物馆-天安门广场-返程', 1, 1, '2026-12-31'],
  ];

  for (const t of hotSpots) insertTour.run(...t);

  // Questions
  const questions = [
    ['旅游合同签订方式有哪些？', '请问旅游合同一般是通过什么方式签订的？可以线上签订吗？需要注意哪些事项？', '旅行爱好者', '合同签订|旅游法规', 3, 245],
    ['儿童价是基于什么制定的？', '带5岁孩子去海南，儿童价是怎么计算的？和成人价有什么区别？', '幸福一家人', '儿童价|亲子游', 5, 189],
    ['旅游的线路品质怎么界定的？', '看到有些线路标"品质游"有些标"经济游"，具体有什么区别？', '背包客小明', '线路品质|旅游分类', 4, 167],
    ['单房差是什么？', '一个人出游不想和别人拼房，单房差是怎么计算的？', '独行侠', '单房差|住宿', 6, 312],
    ['旅游保险有哪些种类？', '出游一般需要买什么保险？旅行社责任险和个人意外险有什么区别？', '保险小白', '旅游保险|安全', 2, 98],
    ['签证办理需要多长时间？', '想去欧洲旅游，签证一般提前多久办理比较合适？需要准备哪些材料？', '出境新手', '签证|出境游', 4, 156],
    ['最佳旅游季节是什么时候？', '想带家人去云南旅游，哪个季节去最合适？', '家庭出游', '旅游季节|云南', 3, 203],
    ['如何选择靠谱的旅行社？', '市面上旅行社很多，怎么判断一个旅行社是否靠谱？', '谨慎游客', '旅行社|选择指南', 5, 278],
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (title, content, author, tags, answers, views)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const q of questions) insertQ.run(...q);

  // Answers
  const answers = [
    [1, '旅游顾问', '目前旅游合同支持线上签订和线下签订两种方式。线上签订通过电子签名平台完成，具有同等法律效力。签订前请仔细阅读合同条款，特别是退改政策、行程安排、费用包含和不包含项目等。建议选择正规旅行社并保留好合同副本。', 12],
    [2, '客服小王', '儿童价通常指2-12岁儿童的价格，一般包含往返机票、当地车费、半价餐费和导游服务费，但不包含床位费和门票费。部分景区对儿童有优惠政策，具体以实际为准。建议您下单前咨询客服确认具体包含项目。', 8],
    [3, '资深导游老张', '线路品质主要从以下几个方面界定：1）住宿标准：品质游通常安排四星以上酒店；2）用餐标准：品质游餐标更高；3）交通工具：品质游可能安排更舒适的车型或航班时段；4）购物安排：品质游购物点更少或无购物；5）导游服务：品质游配备更资深导游。', 15],
    [4, '客服小李', '单房差是指住宿安排中，如果一个人单独使用一间房间，需要补足的差价。因为旅行社按两人一间核算成本，单人入住需要承担另一张床位的费用。具体金额根据酒店等级和季节不同，一般在几百到上千元不等。', 10],
  ];

  const insertA = db.prepare(`
    INSERT INTO answers (question_id, author, content, likes)
    VALUES (?, ?, ?, ?)
  `);
  for (const a of answers) insertA.run(...a);

  console.log('✅ 数据库初始化完成，种子数据已写入');
}

module.exports = { getDb, initDatabase };
