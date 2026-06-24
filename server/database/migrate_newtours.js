/**
 * Migration: Add 21 new tours to reach 40 total
 */
const { getDb } = require('./init');
const bcrypt = require('bcryptjs');

function migrateNewTours() {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as c FROM tours').get().c;
  if (count >= 40) {
    console.log(`✅ 已有 ${count} 条线路，跳过新增`);
    return;
  }

  console.log(`📦 正在新增线路（当前 ${count} → 目标 40）...`);

  const newTours = [
    // ===== 国内线路 (20-32) =====
    {
      title: '🚩 宁夏·沙坡头·西夏探秘 5日游',
      category_id: 1, type_label: '国内长线',
      description: '踏足塞上江南，探秘西夏王朝。沙坡头滑沙、黄河漂流，西北风光壮丽辽阔。',
      price: 2580, original_price: 4280, satisfaction: '96%', image: 'tour20.jpg',
      transport: '银川河东机场接送', days: '5天4晚',
      highlights: '沙坡头|西夏王陵|西部影城|贺兰山岩画|黄河漂流',
      route: '银川-沙坡头-西部影城-西夏王陵-贺兰山-银川',
      lat: 38.4857, lng: 106.2842, city: '中卫', loc: '宁夏·中卫'
    },
    {
      title: '🚩 昆明·石林·滇池风光 5日游',
      category_id: 1, type_label: '国内长线',
      description: '春城昆明，石林奇观天下第一。滇池喂海鸥，翠湖赏樱花，体验云南民族风情。',
      price: 1980, original_price: 3580, satisfaction: '97%', image: 'tour21.jpg',
      transport: '昆明长水机场接送', days: '5天4晚',
      highlights: '石林|滇池|翠湖公园|云南民族村|金马碧鸡坊',
      route: '昆明-石林-滇池-民族村-翠湖公园-昆明',
      lat: 25.0389, lng: 102.7183, city: '昆明', loc: '云南·昆明'
    },
    {
      title: '🚩 抚仙湖·澄江静谧 3日游',
      category_id: 4, type_label: '国内短线',
      description: '云南高原明珠抚仙湖，中国最深淡水湖之一。湖水清澈见底，环湖骑行，享宁静时光。',
      price: 880, original_price: 1680, satisfaction: '98%', image: 'tour22.jpg',
      transport: '昆明出发，专车接送', days: '3天2晚',
      highlights: '抚仙湖|禄充风景区|笔架山|太阳山|铜锅鱼美食',
      route: '昆明-抚仙湖-禄充-笔架山-太阳山-昆明',
      lat: 24.5167, lng: 102.8833, city: '澄江', loc: '云南·抚仙湖'
    },
    {
      title: '🚩 成都·熊猫·都江堰 4日游',
      category_id: 4, type_label: '国内短线',
      description: '天府之国成都，看萌翻全球的大熊猫，拜千年水利工程都江堰，吃地道四川火锅。',
      price: 1680, original_price: 3280, satisfaction: '97%', image: 'tour23.jpg',
      transport: '成都双流机场接送', days: '4天3晚',
      highlights: '大熊猫基地|都江堰|宽窄巷子|锦里|火锅美食',
      route: '成都-熊猫基地-宽窄巷子-都江堰-锦里-成都',
      lat: 30.5728, lng: 104.0668, city: '成都', loc: '四川·成都'
    },
    {
      title: '🚩 重庆·洪崖洞·火锅之旅 4日游',
      category_id: 4, type_label: '国内短线',
      description: '8D魔幻山城重庆，洪崖洞千与千寻同款夜景，长江索道飞渡两岸，老火锅麻辣鲜香。',
      price: 1580, original_price: 2980, satisfaction: '96%', image: 'tour24.jpg',
      transport: '重庆江北机场接送', days: '4天3晚',
      highlights: '洪崖洞|长江索道|磁器口|李子坝轻轨|重庆火锅',
      route: '重庆-洪崖洞-长江索道-磁器口-李子坝-南山-重庆',
      lat: 29.5630, lng: 106.5516, city: '重庆', loc: '重庆'
    },
    {
      title: '🚩 厦门·鼓浪屿·文艺之旅 4日游',
      category_id: 4, type_label: '国内短线',
      description: '海上花园厦门，鼓浪屿万国建筑群，环岛路海风拂面。逛中山路，品沙茶面，惬意慢生活。',
      price: 1780, original_price: 3380, satisfaction: '97%', image: 'tour25.jpg',
      transport: '厦门高崎机场接送', days: '4天3晚',
      highlights: '鼓浪屿|南普陀寺|厦门大学|环岛路|曾厝垵',
      route: '厦门-鼓浪屿-南普陀-厦大-环岛路-曾厝垵-厦门',
      lat: 24.4798, lng: 118.0894, city: '厦门', loc: '福建·厦门'
    },
    {
      title: '🚩 杭州·西湖·灵隐禅韵 3日游',
      category_id: 4, type_label: '国内短线',
      description: '上有天堂下有苏杭。西湖泛舟，灵隐寺祈福，龙井问茶，品味江南诗意。',
      price: 1280, original_price: 2580, satisfaction: '98%', image: 'tour26.jpg',
      transport: '杭州东站接送', days: '3天2晚',
      highlights: '西湖|灵隐寺|龙井村|雷峰塔|河坊街',
      route: '杭州-西湖游船-灵隐寺-龙井村-雷峰塔-河坊街',
      lat: 30.2741, lng: 120.1551, city: '杭州', loc: '浙江·杭州'
    },
    {
      title: '🚩 苏州·园林·周庄水乡 3日游',
      category_id: 4, type_label: '国内短线',
      description: '苏州古典园林甲天下，拙政园一步一景。周庄水乡小桥流水，听苏州评弹软语。',
      price: 1080, original_price: 2280, satisfaction: '97%', image: 'tour27.jpg',
      transport: '苏州站接送', days: '3天2晚',
      highlights: '拙政园|周庄|虎丘|苏州博物馆|平江路',
      route: '苏州-拙政园-苏州博物馆-虎丘-周庄-平江路',
      lat: 31.2990, lng: 120.5853, city: '苏州', loc: '江苏·苏州'
    },
    {
      title: '🚩 青岛·崂山·啤酒文化 4日游',
      category_id: 4, type_label: '国内短线',
      description: '红瓦绿树碧海蓝天青岛。登崂山观海，漫步八大关，畅饮青岛啤酒，吃海鲜大餐。',
      price: 1480, original_price: 2880, satisfaction: '96%', image: 'tour28.jpg',
      transport: '青岛胶东机场接送', days: '4天3晚',
      highlights: '崂山|八大关|栈桥|青岛啤酒博物馆|金沙滩',
      route: '青岛-栈桥-八大关-崂山-啤酒博物馆-金沙滩-青岛',
      lat: 36.0671, lng: 120.3826, city: '青岛', loc: '山东·青岛'
    },
    {
      title: '🚩 拉萨·布达拉宫·朝圣之旅 6日游',
      category_id: 1, type_label: '国内长线',
      description: '世界屋脊西藏拉萨，布达拉宫雄伟神圣，大昭寺感受虔诚信仰。纳木错圣湖洗涤心灵。',
      price: 3980, original_price: 6580, satisfaction: '95%', image: 'tour29.jpg',
      transport: '拉萨贡嘎机场接送', days: '6天5晚',
      highlights: '布达拉宫|大昭寺|八廓街|纳木错|羊卓雍措',
      route: '拉萨-布达拉宫-大昭寺-八廓街-纳木错-羊湖-拉萨',
      lat: 29.6500, lng: 91.1000, city: '拉萨', loc: '西藏·拉萨'
    },
    {
      title: '🚩 敦煌·莫高窟·丝路传奇 5日游',
      category_id: 1, type_label: '国内长线',
      description: '丝绸之路璀璨明珠敦煌，莫高窟壁画举世无双。鸣沙山月牙泉大漠奇观，嘉峪关长城雄关漫道。',
      price: 2980, original_price: 5280, satisfaction: '97%', image: 'tour30.jpg',
      transport: '敦煌莫高机场接送', days: '5天4晚',
      highlights: '莫高窟|鸣沙山月牙泉|嘉峪关|玉门关|敦煌夜市',
      route: '敦煌-莫高窟-鸣沙山月牙泉-玉门关-嘉峪关-敦煌',
      lat: 40.1419, lng: 94.6639, city: '敦煌', loc: '甘肃·敦煌'
    },
    {
      title: '🚩 哈尔滨·冰雪大世界 4日游',
      category_id: 4, type_label: '国内短线',
      description: '冰雪之都哈尔滨，冰雪大世界童话王国，中央大街欧式风情，太阳岛雪博会。',
      price: 1880, original_price: 3580, satisfaction: '95%', image: 'tour31.jpg',
      transport: '哈尔滨太平机场接送', days: '4天3晚',
      highlights: '冰雪大世界|中央大街|圣索菲亚教堂|太阳岛|东北铁锅炖',
      route: '哈尔滨-冰雪大世界-中央大街-索菲亚教堂-太阳岛-哈尔滨',
      lat: 45.8038, lng: 126.5350, city: '哈尔滨', loc: '黑龙江·哈尔滨'
    },
    {
      title: '🚩 大理·洱海·苍山风月 5日游',
      category_id: 3, type_label: '自助旅游',
      description: '风花雪月大理古城，洱海环湖骑行看日落，苍山缆车登顶俯瞰。双廊古镇面朝洱海。',
      price: 1680, original_price: 3280, satisfaction: '98%', image: 'tour32.jpg',
      transport: '大理机场接送', days: '5天4晚',
      highlights: '洱海|苍山|大理古城|双廊古镇|崇圣寺三塔',
      route: '大理-大理古城-苍山-洱海骑行-双廊-三塔-大理',
      lat: 25.5916, lng: 100.2299, city: '大理', loc: '云南·大理'
    },
    // ===== 国际线路 (33-40) =====
    {
      title: '🇰🇷 首尔·景福宫·韩流之旅 5日游',
      category_id: 2, type_label: '出境长线',
      description: '韩国首尔，景福宫穿越朝鲜王朝，明洞东大门购物天堂。品尝韩式烤肉炸鸡啤酒。',
      price: 3580, original_price: 5280, satisfaction: '95%', image: 'tour33.jpg',
      transport: '国际航班，首尔仁川机场接送', days: '5天4晚',
      highlights: '景福宫|明洞|南山塔|北村韩屋村|乐天世界',
      route: '首尔-景福宫-北村韩屋-南山塔-明洞-乐天世界-首尔',
      lat: 37.5665, lng: 126.9780, city: '首尔', loc: '韩国·首尔'
    },
    {
      title: '🇸🇬 新加坡·鱼尾狮·花园城市 5日游',
      category_id: 2, type_label: '出境长线',
      description: '花园城市新加坡，鱼尾狮公园地标打卡，滨海湾花园超级树灯光秀，环球影城嗨翻天。',
      price: 4880, original_price: 6980, satisfaction: '97%', image: 'tour34.jpg',
      transport: '国际航班，樟宜机场接送', days: '5天4晚',
      highlights: '鱼尾狮|滨海湾花园|环球影城|圣淘沙岛|牛车水',
      route: '新加坡-鱼尾狮-滨海湾-圣淘沙-环球影城-牛车水-新加坡',
      lat: 1.3521, lng: 103.8198, city: '新加坡', loc: '新加坡'
    },
    {
      title: '🇹🇭 普吉岛·皇帝岛·潜水天堂 6日游',
      category_id: 2, type_label: '出境长线',
      description: '安达曼海上明珠普吉岛，皇帝岛浮潜看珊瑚，皮皮岛碧海蓝天，芭东海滩夜生活。',
      price: 3280, original_price: 5280, satisfaction: '96%', image: 'tour35.jpg',
      transport: '国际航班，普吉机场接送', days: '6天4晚',
      highlights: '皇帝岛|皮皮岛|芭东海滩|攀牙湾|西蒙人妖秀',
      route: '普吉-芭东海滩-皇帝岛-皮皮岛-攀牙湾-普吉',
      lat: 7.8804, lng: 98.3923, city: '普吉', loc: '泰国·普吉岛'
    },
    {
      title: '🇪🇬 埃及·金字塔·尼罗河传奇 10日游',
      category_id: 2, type_label: '出境长线',
      description: '古埃及文明探秘，吉萨金字塔世界奇迹，尼罗河邮轮赏两岸神庙，红海浮潜。',
      price: 8999, original_price: 12999, satisfaction: '94%', image: 'tour36.jpg',
      transport: '国际航班，开罗机场接送', days: '10天8晚',
      highlights: '金字塔|狮身人面像|尼罗河邮轮|卢克索神庙|红海',
      route: '开罗-金字塔-埃及博物馆-阿斯旺-尼罗河邮轮-卢克索-红海-开罗',
      lat: 30.0444, lng: 31.2357, city: '开罗', loc: '埃及·开罗'
    },
    {
      title: '🇦🇺 澳大利亚·悉尼·黄金海岸 9日游',
      category_id: 2, type_label: '出境长线',
      description: '澳洲东海岸经典游，悉尼歌剧院海港大桥，黄金海岸冲浪天堂，大堡礁海底奇观。',
      price: 12999, original_price: 16999, satisfaction: '96%', image: 'tour37.jpg',
      transport: '国际航班，悉尼机场接送', days: '9天7晚',
      highlights: '悉尼歌剧院|黄金海岸|大堡礁|邦迪海滩|蓝山',
      route: '悉尼-歌剧院-蓝山-黄金海岸-大堡礁-悉尼',
      lat: -33.8688, lng: 151.2093, city: '悉尼', loc: '澳大利亚·悉尼'
    },
    {
      title: '🇳🇿 新西兰·南岛·星空之旅 10日游',
      category_id: 2, type_label: '出境长线',
      description: '新西兰南岛纯净自然，蒂卡波湖观星，皇后镇蹦极，福克斯冰川徒步，霍比屯电影之旅。',
      price: 15999, original_price: 19999, satisfaction: '98%', image: 'tour38.jpg',
      transport: '国际航班，基督城接送', days: '10天8晚',
      highlights: '蒂卡波湖|皇后镇|福克斯冰川|霍比屯|米尔福德峡湾',
      route: '基督城-蒂卡波湖-皇后镇-米尔福德峡湾-福克斯冰川-霍比屯-基督城',
      lat: -43.5320, lng: 172.6306, city: '基督城', loc: '新西兰·基督城'
    },
    {
      title: '🇳🇵 尼泊尔·加德满都·雪山佛国 8日游',
      category_id: 3, type_label: '自助旅游',
      description: '喜马拉雅山国尼泊尔，加德满都杜巴广场，博卡拉鱼尾峰日出，奇特旺丛林探险。',
      price: 4680, original_price: 7280, satisfaction: '95%', image: 'tour39.jpg',
      transport: '国际航班，加德满都机场接送', days: '8天6晚',
      highlights: '杜巴广场|博卡拉|鱼尾峰|奇特旺森林公园|纳加阔特',
      route: '加德满都-杜巴广场-纳加阔特-博卡拉-奇特旺-加德满都',
      lat: 27.7172, lng: 85.3240, city: '加德满都', loc: '尼泊尔·加德满都'
    },
    {
      title: '🇷🇺 俄罗斯·莫斯科·红场情怀 8日游',
      category_id: 2, type_label: '出境长线',
      description: '莫斯科红场克里姆林宫，圣瓦西里大教堂童话般艳丽。圣彼得堡冬宫世界名画，涅瓦河游船。',
      price: 7999, original_price: 10999, satisfaction: '94%', image: 'tour40.jpg',
      transport: '国际航班，莫斯科机场接送', days: '8天6晚',
      highlights: '红场|克里姆林宫|圣瓦西里教堂|冬宫|涅瓦大街',
      route: '莫斯科-红场-克里姆林宫-圣彼得堡-冬宫-涅瓦大街-莫斯科',
      lat: 55.7558, lng: 37.6173, city: '莫斯科', loc: '俄罗斯·莫斯科'
    },
  ];

  const insert = db.prepare(`
    INSERT INTO tours (title, category_id, type_label, description, price, original_price, satisfaction, image, transport, days, highlights, route, is_hot, is_promotion, promotion_end, latitude, longitude, city, location_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  for (const t of newTours) {
    // Assign is_hot / is_promotion rationally — some hot, some not
    const id = db.prepare('SELECT id FROM tours WHERE title = ?').get(t.title);
    if (!id) {
      const isHot = (t.title.includes('🚩') || added < 5) ? 1 : 0;
      const isPromo = added < 5 ? 1 : 0;
      insert.run(
        t.title, t.category_id, t.type_label, t.description,
        t.price, t.original_price, t.satisfaction, t.image,
        t.transport, t.days, t.highlights, t.route,
        isHot, isPromo, isPromo ? '2026-12-31' : null,
        t.lat, t.lng, t.city, t.loc
      );
      added++;
    }
  }

  const finalCount = db.prepare('SELECT COUNT(*) as c FROM tours').get().c;
  console.log(`✅ 新增 ${added} 条线路，当前共 ${finalCount} 条`);

  // Add details for new tours
  if (added > 0) {
    console.log('📝 正在写入详细介绍...');
    const detailData = {
      '🚩 宁夏·沙坡头·西夏探秘 5日游': {
        zh: `## 🏜️ 宁夏·塞上江南

**沙坡头** — 中国四大沙漠之一腾格里沙漠的东南缘。滑沙、骑骆驼、黄河漂流体验丰富。"大漠孤烟直，长河落日圆"的壮丽景象。

**西夏王陵** — 被称为"东方金字塔"的西夏历代帝王陵墓群。陵台、碑亭、角阙遗址见证了西夏王朝的辉煌历史。

**西部影城** — 中国三大影视城之一，《大话西游》《红高粱》等经典影片取景地。可以穿上戏服过一把演员瘾。

**贺兰山岩画** — 记录了远古先民狩猎、放牧、祭祀的生活场景。"太阳神"岩画是最具代表性的作品。

## 🍜 宁夏美食

- **手抓羊肉** — 宁夏滩羊，肉质鲜嫩无膻味
- **烩小吃** — 羊肉粉汤、油香、馓子的组合
- **枸杞炖鸡汤** — 宁夏中宁枸杞名扬天下

## 💡 旅行贴士
- 最佳季节：5-10月（夏秋凉爽）
- 沙漠地区早晚温差大，注意保暖
- 沙坡头滑沙建议下午去，沙子温暖`,
        en: `## 🏜️ Ningxia

**Shapotou** — Desert tourism at the edge of the Tengger Desert. Camel rides, sand sliding, Yellow River rafting.

**Western Xia Imperial Tombs** — "Oriental Pyramids", burial grounds of the Western Xia dynasty.`
      },
      '🚩 昆明·石林·滇池风光 5日游': {
        zh: `## 🌸 昆明·春城

**石林** — 世界自然遗产，喀斯特地貌的精华。2.7亿年前的海底世界演化为奇峰怪石。大小石林景区各具特色。

**滇池** — 云南最大的淡水湖，高原明珠。海埂大坝是观赏西山睡美人的最佳位置。每年冬季红嘴鸥从西伯利亚飞来过冬。

**翠湖公园** — 昆明市中心的绿色明珠。每年11月至次年3月，成群红嘴鸥在湖面盘旋，是昆明最温暖的风景。

## 🍜 云南美食
- **过桥米线** — 云南名片的代表
- **汽锅鸡** — 原汁原味，滋补养生
- **野生菌火锅** — 雨季的云南最鲜美

## 💡 旅行贴士
- 昆明海拔1890米，紫外线强需防晒
- 红嘴鸥观赏季节：11月-次年3月
- 石林距离昆明市区约80公里`,
        en: `## 🌸 Kunming

**Stone Forest** — UNESCO World Heritage, spectacular karst landscape formed 270 million years ago.

**Dianchi Lake** — Yunnan's largest lake, "Pearl of the Plateau". Winter home to thousands of seagulls.`
      },
      '🚩 抚仙湖·澄江静谧 3日游': {
        zh: `## 🌊 抚仙湖·高原明珠

**抚仙湖** — 中国第二深淡水湖（最深处158米），湖水清澈度极高，能见度达8-12米。湖水呈蓝绿色，被誉为"琉璃万顷"。

**禄充风景区** — 抚仙湖西岸最成熟的景区。笔架山登高望远，湖光山色尽收眼底。古渔村保留着传统捕鱼方式。

**铜锅鱼** — 抚仙湖最著名的美食。用当地铜锅煮湖中鲜鱼，汤白如奶，配上糊辣椒蘸水，鲜美无比。

## 💡 旅行贴士
- 抚仙湖适合环湖自驾/骑行（全程约100公里）
- 湖水深，游泳需注意安全
- 最佳季节：4-10月`,
        en: `## 🌊 Fuxian Lake

China's second deepest freshwater lake (158m). Crystal clear waters with visibility up to 12 meters. Perfect for a peaceful getaway.`
      },
      '🚩 成都·熊猫·都江堰 4日游': {
        zh: `## 🐼 成都·天府之国

**大熊猫繁育研究基地** — 全球最大的大熊猫保护研究机构。看萌翻全网的熊猫宝宝爬树打滚，了解熊猫保护故事。建议早上去，熊猫最活跃。

**都江堰** — 两千多年历史的无坝引水工程，至今仍在灌溉成都平原。鱼嘴分水堤、飞沙堰、宝瓶口三大工程巧夺天工。

**宽窄巷子** — 成都最具代表性的历史文化街区。宽巷子老成都生活，窄巷子精致文艺。掏耳朵、看变脸、喝盖碗茶。

## 🍜 成都美食
- **火锅** — 成都灵魂美食
- **担担面** — 川味面食代表
- **串串香** — 竹签上的美食盛宴
- **夫妻肺片** — 经典川味凉菜

## 💡 旅行贴士
- 看熊猫一定要早上去（9:00-11:00最活跃）
- 都江堰建议请导游讲解，才能明白它的精妙`,
        en: `## 🐼 Chengdu

**Panda Base** — World's largest giant panda breeding center. Visit in the morning when pandas are most active.

**Dujiangyan** — 2000-year-old irrigation system still in use today.

**Kuanzhai Alley** — Historic cultural quarter of old Chengdu.`
      },
      '🚩 重庆·洪崖洞·火锅之旅 4日游': {
        zh: `## 🌃 重庆·8D魔幻山城

**洪崖洞** — 重庆最火爆的网红打卡地。依山而建的吊脚楼群，夜晚亮灯后宛如千与千寻的汤屋。共11层，每层出去都是马路。

**长江索道** — 飞渡长江的空中巴士，重庆独有的交通方式。排队建议选南站上车（人少）。

**磁器口古镇** — 千年古镇，陈麻花、毛血旺、古镇鸡杂是必吃三件套。

**李子坝轻轨穿楼** — 轻轨2号线从居民楼中穿过的奇观。在李子坝站下到观景台最出片。

## 🍜 重庆美食
- **重庆火锅** — 九宫格最地道
- **小面** — 重庆人早餐的灵魂
- **酸辣粉** — 又酸又辣超过瘾
- **江湖菜** — 辣子鸡、水煮鱼

## 💡 旅行贴士
- 山城走路多，穿舒适的鞋子
- 火锅越隐蔽的店越好吃`,
        en: `## 🌃 Chongqing

**Hongyadong** — Iconic stilted buildings that look like Spirited Away at night.

**Yangtze River Cableway** — Fly across the Yangtze in a sky tram.

**Hotpot** — The city's soul food. The more hidden the restaurant, the better!`
      },
      '🚩 厦门·鼓浪屿·文艺之旅 4日游': {
        zh: `## 🏝️ 厦门·海上花园

**鼓浪屿** — 世界文化遗产，万国建筑博览。岛上禁止机动车，漫步其间听钢琴声流淌。日光岩登顶俯瞰全岛，菽庄花园面朝大海。

**厦门大学** — 中国最美大学之一。芙蓉湖、情人谷、芙蓉隧道涂鸦墙。校门口就是白城沙滩。

**环岛路** — 厦门最美的沿海公路。骑行从厦大到会展中心，海风拂面，沙滩椰林，惬意至极。

## 🍜 厦门美食
- **沙茶面** — 厦门灵魂面食
- **土笋冻** — 闽南特色小吃
- **海蛎煎** — 蚵仔煎的闽南版
- **姜母鸭** — 秋冬滋补圣品

## 💡 旅行贴士
- 鼓浪屿船票需提前预订（尤其节假日）
- 建议住一晚鼓浪屿，早晚人少景美`,
        en: `## 🏝️ Xiamen

**Gulangyu Island** — UNESCO World Heritage, car-free island with colonial architecture and piano music.

**Xiamen University** — One of China's most beautiful campuses.`

      },
      '🚩 杭州·西湖·灵隐禅韵 3日游': {
        zh: `## 🏯 杭州·人间天堂

**西湖** — 世界文化遗产，中国最美的湖泊之一。断桥残雪、苏堤春晓、雷峰夕照、三潭印月——每一处都是一首诗。建议乘船游湖。

**灵隐寺** — 中国最古老的佛教寺庙之一，已有1700多年历史。大雄宝殿、飞来峰石刻、永福禅寺，清幽宁静。

**龙井村** — 西湖龙井的原产地。清明前后采茶季，满山茶香。在农家喝一杯明前龙井，配上桂花糕。

## 🍜 杭州美食
- **西湖醋鱼** — 酸甜嫩滑，杭帮菜代表作
- **东坡肉** — 苏东坡发明的红烧肉
- **龙井虾仁** — 茶香与虾鲜的完美结合
- **片儿川** — 杭州市井面条

## 💡 旅行贴士
- 西湖免费开放，游船约55元/人
- 灵隐寺门票45元，建议早上去人少`,
        en: `## 🏯 Hangzhou

**West Lake** — UNESCO World Heritage, China's most poetic lake. Take a boat ride for the best views.

**Lingyin Temple** — One of China's oldest Buddhist temples, over 1700 years old.`
      },
      '🚩 苏州·园林·周庄水乡 3日游': {
        zh: `## 🏡 苏州·东方威尼斯

**拙政园** — 中国四大名园之首，世界文化遗产。全园以水为中心，亭台楼阁、曲径通幽。一步一景，四季不同。

**周庄** — "中国第一水乡"。沈厅张厅见证明清富商生活，坐上摇橹船穿行水道，听船娘唱吴歌。

**苏州博物馆** — 贝聿铭的封山之作。白墙黛瓦的现代演绎，馆藏吴门画派珍品和出土文物。

## 🍜 苏州美食
- **松鼠桂鱼** — 苏帮菜头牌，酸甜酥脆
- **蟹粉小笼** — 汤汁浓郁
- **鸡头米** — 苏州独有的养生甜品

## 💡 旅行贴士
- 园林选2-3个即可（拙政园、留园、狮子林）
- 周庄建议住一晚，夜景最美`,
        en: `## 🏡 Suzhou

**Humble Administrator's Garden** — China's greatest classical garden, a UNESCO World Heritage site.

**Zhouzhuang** — "China's #1 Water Town", take a gondola ride through ancient canals.`
      },
      '🚩 青岛·崂山·啤酒文化 4日游': {
        zh: `## 🏖️ 青岛·帆船之都

**崂山** — 海上第一名山，道教发源地之一。巨峰顶看日出云海，太清宫古朴幽静，仰口湾碧海沙滩。

**八大关** — 青岛最美街区。十条以关隘命名的路，200多栋各国风格别墅。春秋两季最美，梧桐银杏金黄。

**青岛啤酒博物馆** — 由百年德国啤酒厂改建。了解啤酒酿造过程，品尝最新鲜的原浆啤酒。

## 🍜 青岛美食
- **辣炒蛤蜊** — 青岛人的最爱
- **鲅鱼水饺** — 胶东特色
- **海鲜烧烤** — 啤酒的最佳伴侣
- **排骨米饭** — 青岛快餐之王

## 💡 旅行贴士
- 啤酒节（8月）期间住宿价格翻倍
- 崂山建议一整天时间`,
        en: `## 🏖️ Qingdao

**Laoshan Mountain** — "No.1 Mountain by the Sea", a Taoist sacred site with stunning coastal views.

**Eight Great Passes** — Most beautiful neighborhood in Qingdao with 200+ villas in various architectural styles.`
      },
      '🚩 拉萨·布达拉宫·朝圣之旅 6日游': {
        zh: `## 🙏 拉萨·日光之城

**布达拉宫** — 世界海拔最高的宫殿（3700米），西藏最宏伟的建筑。红宫白宫依山而建，1300多年历史。内部珍藏无数佛像、壁画、唐卡。

**大昭寺** — 藏传佛教最神圣的寺庙。供奉着释迦牟尼12岁等身像。门前磕长头的朝圣者让人震撼。

**纳木错** — 西藏三大圣湖之一，海拔4718米。湖水湛蓝如宝石，念青唐古拉山倒映湖中。星空之美无法言喻。

## 🍜 藏区美食
- **甜茶** — 拉萨人日常饮品
- **藏面** — 高原特色主食
- **牦牛酸奶** — 浓郁酸甜
- **糌粑** — 藏族传统主食

## 💡 旅行贴士
- 提前一周服用红景天预防高反
- 布达拉宫门票需提前一天预约
- 寺庙内不可戴帽、不可拍照
- 纳木错单程4小时车程`,
        en: `## 🙏 Lhasa

**Potala Palace** — World's highest palace at 3700m. The iconic symbol of Tibet.

**Jokhang Temple** — Tibet's most sacred temple, housing a life-sized statue of Buddha at age 12.`
      },
      '🚩 敦煌·莫高窟·丝路传奇 5日游': {
        zh: `## 🎨 敦煌·丝路明珠

**莫高窟** — 世界文化遗产，东方艺术宝库。492个洞窟，45000平方米壁画，2000多尊彩塑。飞天壁画举世闻名。参观需提前预约。

**鸣沙山月牙泉** — 沙漠奇观，流沙与泉水共存千年。骑骆驼穿越沙漠，滑沙而下，月牙泉如翡翠镶嵌。

**嘉峪关** — 明代万里长城的西端起点。"天下第一雄关"，城楼巍峨。站在城楼西望戈壁，苍凉壮阔。

## 🍜 敦煌美食
- **驴肉黄面** — 敦煌招牌
- **杏皮水** — 李广杏熬制，消暑解渴
- **羊肉粉汤** — 西北人的早餐

## 💡 旅行贴士
- 莫高窟门票需提前15天预订
- 鸣沙山建议下午去（避开暴晒）
- 沙漠昼夜温差大`,
        en: `## 🎨 Dunhuang

**Mogao Caves** — UNESCO World Heritage, 492 caves with 45,000 sq meters of exquisite Buddhist murals.

**Crescent Moon Spring** — A magical desert oasis surrounded by singing sand dunes.`
      },
      '🚩 哈尔滨·冰雪大世界 4日游': {
        zh: `## ❄️ 哈尔滨·冰雪之都

**冰雪大世界** — 世界最大的冰雪主题公园。松花江取冰，雕刻成宫殿、城堡、滑梯。夜晚彩灯亮起，宛如冰雪童话王国。

**中央大街** — 亚洲最长的步行街之一，欧式建筑林立。马迭尔冰棍、华梅西餐厅、秋林红肠是老哈尔滨的味道。

**圣索菲亚教堂** — 远东最大的东正教教堂，拜占庭式建筑。绿色的洋葱头穹顶在雪中格外醒目。

## 🍜 东北美食
- **锅包肉** — 哈尔滨名菜，酸甜酥脆
- **铁锅炖** — 东北人的待客硬菜
- **红肠** — 秋林里道斯最正宗
- **冻梨冻柿子** — 冬天独特的美味

## 💡 旅行贴士
- 冬季温度可达-30°C，极寒保暖
- 冰雪大世界12月底开放至次年2月
- 滑雪推荐亚布力（3小时车程）`,
        en: `## ❄️ Harbin

**Ice and Snow World** — World's largest ice and snow theme park, a fairy tale wonderland at night.

**Central Street** — Asia's longest pedestrian street lined with European architecture.`
      },
      '🚩 大理·洱海·苍山风月 5日游': {
        zh: `## 🌙 大理·风花雪月

**洱海** — 大理的灵魂。环洱海全程120公里，推荐租车或骑行，边停边拍。双廊古镇看日落最美，喜洲古镇的白族民居保存完好。

**苍山** — 十九峰十八溪，乘索道上山俯瞰洱海全景。洗马潭、七龙女池、感通寺各具特色。

**大理古城** — 南诏大理国的都城。人民路的酒吧、洋人街的咖啡馆、复兴路的扎染布艺。南门城楼可登高望远。

## 🍜 大理美食
- **酸辣鱼** — 洱海鱼+酸木瓜的鲜辣组合
- **乳扇** — 大理特色奶酪制品
- **大理砂锅鱼** — 料足味鲜
- **烤饵块** — 白族人的早点

## 💡 旅行贴士
- 洱海骑行建议租电瓶车（省力）
- 海舌生态公园是拍洱海的最佳位置
- 最佳季节：3-5月（花开遍地）`,
        en: `## 🌙 Dali

**Erhai Lake** — The soul of Dali. 120km cycling route around the lake with stunning views.

**Cangshan Mountain** — Take the cable car up for panoramic views of Erhai and the ancient city.`
      },
      '🇰🇷 首尔·景福宫·韩流之旅 5日游': {
        zh: `## 🇰🇷 首尔·K-Culture

**景福宫** — 朝鲜王朝第一正宫，首尔最著名的历史地标。身穿韩服入宫免门票。光化门广场有世宗大王雕像。

**明洞** — 首尔第一购物天堂。美妆店、潮牌、韩流周边应有尽有。街边小吃鱼饼、辣炒年糕是逛明洞的标配。

**南山塔（N首尔塔）** — 首尔地标，爱情锁墙是情侣打卡地。夕阳时分登塔，首尔全景尽收眼底。

## 🍜 韩国美食
- **韩式烤肉** — 生菜包肉配泡菜
- **石锅拌饭** — 韩式经典
- **炸鸡啤酒** — 韩国人的快乐
- **辣炒年糕** — 街头小吃之王

## 💡 旅行贴士
- 景福宫穿韩服免费入内
- T-money交通卡必买
- 东大门夜间购物到凌晨5点`,
        en: `## 🇰🇷 Seoul

**Gyeongbokgung Palace** — Joseon dynasty's main palace. Free entry if you wear a hanbok!

**Myeongdong** — Seoul's shopping paradise with K-beauty, fashion, and amazing street food.`
      },
      '🇸🇬 新加坡·鱼尾狮·花园城市 5日游': {
        zh: `## 🇸🇬 新加坡·花园城市

**鱼尾狮公园** — 新加坡的标志。鱼尾狮喷水雕塑背靠滨海湾金沙大酒店。最佳合影时间是傍晚。

**滨海湾花园** — 超级树灯光秀每晚19:45和20:45两场。花穹和云雾林两个冷室汇集全球奇花异木。

**环球影城** — 东南亚唯一的环球影城。变形金刚3D对决、木乃伊复仇过山车、史瑞克4D影院。

## 🍜 新加坡美食
- **海南鸡饭** — 新加坡国菜
- **辣椒螃蟹** — 招牌海鲜
- **肉骨茶** — 中药熬制排骨汤
- **叻沙** — 椰浆咖喱米粉

## 💡 旅行贴士
- 新加坡机场的星耀樟宜本身就是景点
- 地铁非常方便，不需要租车
- 法律严格，口香糖禁止销售`,
        en: `## 🇸🇬 Singapore

**Merlion Park** — Singapore's iconic symbol with Marina Bay Sands backdrop.

**Gardens by the Bay** — SuperTree light shows at 7:45 & 8:45 PM nightly.`
      },
      '🇹🇭 普吉岛·皇帝岛·潜水天堂 6日游': {
        zh: `## 🏝️ 普吉岛·安达曼明珠

**皇帝岛（Racha Island）** — 普吉岛周边水质最好的岛屿。翡翠色海水能见度达20-30米，浮潜可看到海龟和珊瑚群。

**皮皮岛（Phi Phi）** — 玛雅湾因《海滩》电影取景而闻名。碧绿海水环绕的石灰岩峭壁，长尾船穿梭其间。

**芭东海滩** — 普吉最繁华的海滩。江西冷购物中心、邦古拉街酒吧、班赞海鲜市场。

## 🍜 普吉美食
- **泰式海鲜** — 现捞现做
- **芒果糯米饭** — 热带甜蜜
- **冬阴功汤** — 酸辣鲜香的经典

## 💡 旅行贴士
- 11月-次年4月是普吉最佳旅游季节
- 皇帝岛当天往返即可
- 租摩托车需出示国际驾照`,
        en: `## 🏝️ Phuket

**Racha Island** — Best water clarity near Phuket, visibility up to 30m for snorkeling.

**Phi Phi Islands** — Maya Bay made famous by "The Beach" movie.`
      },
      '🇪🇬 埃及·金字塔·尼罗河传奇 10日游': {
        zh: `## 🔺 埃及·千年文明

**吉萨金字塔群** — 世界古代七大奇迹中唯一尚存的。胡夫金字塔、哈夫拉金字塔、孟卡拉金字塔三座并立。旁边狮身人面像守望着沙漠。

**尼罗河邮轮** — 从阿斯旺到卢克索的五星邮轮之旅。沿途科翁坡神庙、埃德夫神庙停靠。甲板赏日落，看两岸椰林。

**卢克索神庙** — "世界上最大的露天博物馆"。卡纳克神庙的134根巨柱震撼人心。帝王谷发现62座法老陵墓。

## 💡 旅行贴士
- 埃及落地签（25美元）
- 景点小贩非常热情，说No就可以
- 沙漠气候干燥，带足饮用水
- 金字塔建议早上去（避开人流+凉爽）`,
        en: `## 🔺 Egypt

**Great Pyramids of Giza** — The sole survivor of the Seven Wonders of the Ancient World.

**Nile Cruise** — 5-star cruise from Aswan to Luxor, the best way to experience ancient Egypt.`
      },
      '🇦🇺 澳大利亚·悉尼·黄金海岸 9日游': {
        zh: `## 🦘 澳大利亚·魅力澳洲

**悉尼歌剧院** — 世界最著名的建筑之一。贝壳造型灵感来自橙子瓣。建议观看一场演出或参加中文导览团。

**大堡礁** — 世界最大珊瑚礁系统，从空中俯瞰最壮观。凯恩斯出发乘船2小时到达外礁，浮潜/深潜/玻璃底船可选。

**黄金海岸** — 冲浪者天堂。沙滩细腻，浪高适合初学者。华纳电影世界主题乐园、天堂农庄抱考拉。

## 💡 旅行贴士
- 澳洲入境检疫极其严格，食物必须申报
- 大堡礁最佳季节：6-10月
- 悉尼早晚温差大，带外套`,
        en: `## 🦘 Australia

**Sydney Opera House** — One of the world's most iconic buildings. Take a guided tour or watch a performance.

**Great Barrier Reef** — World's largest coral reef system. Snorkel or dive in crystal clear waters.`
      },
      '🇳🇿 新西兰·南岛·星空之旅 10日游': {
        zh: `## ⛰️ 新西兰·纯净中土

**蒂卡波湖（Lake Tekapo）** — 新西兰最著名的湖泊之一。湖水呈乳蓝色，湖畔好牧羊人教堂是星空摄影圣地。这里是国际暗夜保护区。

**皇后镇** — 世界冒险之都。蹦极发源地——卡瓦劳大桥蹦极43米。天空缆车登顶，俯瞰Wakatipu湖和卓越山脉。

**霍比屯（Hobbiton）** — 《指环王》《霍比特人》拍摄地。夏尔郡的霍比特人洞穴、绿龙酒馆完美复刻。

## 💡 旅行贴士
- 新西兰入境严格，户外用品需申报
- 南岛自驾是最好方式（靠左行驶）
- 皇后镇冬季是滑雪季，夏季是极限运动季
- 蒂卡波湖看星空需要远离月圆之夜`,
        en: `## ⛰️ New Zealand

**Lake Tekapo** — Iconic milky-blue lake with the Church of the Good Shepherd. A Dark Sky Reserve for stargazing.

**Queenstown** — Adventure capital of the world. Home to the original bungee jump.`
      },
      '🇳🇵 尼泊尔·加德满都·雪山佛国 8日游': {
        zh: `## 🏔️ 尼泊尔·众神之国

**加德满都杜巴广场** — 三座杜巴广场中最壮观的一座。活女神库玛丽庙、独木庙、塔莱珠神庙。2015年地震后部分重建。

**博卡拉** — 尼泊尔最受欢迎的旅游城市。费瓦湖泛舟，鱼尾峰壮观日出。滑翔伞是世界三大滑翔胜地之一。

**奇特旺国家森林公园** — 独角犀牛和孟加拉虎的栖息地。骑大象或吉普车丛林探险，独木舟顺流看鳄鱼。

## 💡 旅行贴士
- 尼泊尔落地签（免费/15天/30天/90天）
- 加德满都灰尘大，建议戴口罩
- 徒步装备可在博卡拉购买或租用
- 博卡拉滑翔伞约600-800元人民币`,
        en: `## 🏔️ Nepal

**Kathmandu Durbar Square** — Historic royal square with ancient temples and palaces.

**Pokhara** — Gateway to the Himalayas, paragliding capital of the world.`
      },
      '🇷🇺 俄罗斯·莫斯科·红场情怀 8日游': {
        zh: `## 🏛️ 俄罗斯·红色记忆

**红场** — 莫斯科的中心，俄罗斯的象征。圣瓦西里大教堂色彩斑斓的洋葱头穹顶是莫斯科最上镜的建筑。

**克里姆林宫** — 俄罗斯总统府所在地。伊凡大帝钟楼、沙皇钟、沙皇炮、武器库博物馆。建筑群漫步至少3小时。

**冬宫（埃尔米塔日博物馆）** — 世界四大博物馆之一，珍藏300多万件艺术品。达芬奇、伦勃朗、莫奈、梵高真迹让人流连忘返。

## 🍜 俄罗斯美食
- **罗宋汤** — 俄式红菜汤
- **鱼子酱** — 黑鱼子酱最珍贵
- **俄式饺子** — 类似中国饺子的俄式版
- **布林饼** — 俄式煎饼配酸奶油

## 💡 旅行贴士
- 俄罗斯需提前办理签证
- 莫斯科地铁本身就是景点（每个站不同风格）
- 冬季寒冷但夏季凉爽宜人`,
        en: `## 🏛️ Russia

**Red Square** — The heart of Moscow. St. Basil's Cathedral with its colorful onion domes is the most photographed building in Russia.

**Winter Palace / Hermitage** — One of the world's greatest art museums with 3+ million pieces.`
      }
    };

    const update = db.prepare('UPDATE tours SET details = ?, details_en = ? WHERE title = ?');
    let detailCount = 0;
    for (const [title, data] of Object.entries(detailData)) {
      const row = db.prepare('SELECT id FROM tours WHERE title = ?').get(title);
      if (row) {
        update.run(data.zh, data.en, title);
        detailCount++;
      }
    }
    console.log(`✅ 写入 ${detailCount} 条详细介绍`);
  }
}

module.exports = { migrateNewTours };
