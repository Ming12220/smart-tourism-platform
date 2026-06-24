/**
 * Migration: Add details (long description) fields to tours table
 */
const { getDb } = require('./init');

function migrateDetails() {
  const db = getDb();

  const cols = db.prepare("PRAGMA table_info('tours')").all();
  const hasDetails = cols.some(c => c.name === 'details');

  if (!hasDetails) {
    console.log('📝 正在迁移详细介绍数据...');
    db.exec(`
      ALTER TABLE tours ADD COLUMN details TEXT DEFAULT '';
      ALTER TABLE tours ADD COLUMN details_en TEXT DEFAULT '';
    `);

    const details = {
      1: {
        zh: `## 🏛️ 景点详解

**大皇宫** — 泰国最著名的皇家宫殿，建于1782年，金碧辉煌的佛塔和建筑群展现泰式建筑的精髓。玉佛寺内供奉的翡翠玉佛是泰国国宝。

**玉佛寺** — 位于大皇宫内，是泰国最神圣的佛教寺庙。寺内供奉的翡翠玉佛已有600多年历史。

**芭提雅海滩** — 泰国最著名的海滨度假胜地，长达4公里的白色沙滩，水上运动丰富，夜景璀璨。

## 🍜 美食推荐

- **冬阴功汤** — 泰国国汤，酸辣鲜香
- **泰式炒河粉** — 国民街头美食
- **芒果糯米饭** — 香甜软糯的经典甜品
- **泰式绿咖喱** — 椰奶香浓，微辣开胃

## 🎭 文化体验

- 人妖秀（蒂芬妮人妖秀是世界级表演）
- 泰式古法按摩（推荐卧佛寺按摩学校）
- 水上市场（丹嫩沙多水上市场最著名）

## 💡 旅行贴士

- 进入寺庙需穿过膝长裤/裙，不可穿无袖上衣
- 泰国是小费国家，按摩/酒店服务通常给20-50泰铢
- 推荐购买7天旅游电话卡（AIS/TrueMove）
- 落地签需准备2寸白底照片和2200泰铢
- 出行最佳季节：11月-次年2月（凉季）`,

        en: `## 🏛️ Highlights

**Grand Palace** — Bangkok's most famous royal palace, built in 1782. The glittering complex showcases the pinnacle of Thai architecture.

**Wat Phra Kaew** — The Temple of the Emerald Buddha, Thailand's most sacred Buddhist temple.

**Pattaya Beach** — Thailand's premier beach resort with 4km of white sand, water sports, and vibrant nightlife.

## 🍜 Food

- **Tom Yum Goong** — Thailand's signature hot & sour soup
- **Pad Thai** — National street food favorite
- **Mango Sticky Rice** — Classic sweet dessert
- **Green Curry** — Creamy coconut-based curry

## 💡 Tips

- Dress modestly when visiting temples (cover knees & shoulders)
- Tipping is customary (20-50 THB for services)
- Best season: November to February`
      },
      10: {
        zh: `## 🏔️ 黄山·天下第一奇山

**迎客松** — 黄山标志性景观，树龄约800年，生长在玉屏楼旁的悬崖上，一侧枝桠伸出如臂迎客。

**光明顶** — 黄山第二高峰，海拔1860米。是观赏日出、云海的最佳地点。地势平坦开阔，是黄山看日出的首选地。

**西海大峡谷** — 黄山最壮美的自然景区，怪石嶙峋，云雾缭绕。步道沿悬崖而建，惊险刺激。步行全程约4小时。

**云海** — 黄山四绝之一（奇松、怪石、云海、温泉）。雨后天晴时，云海最为壮观，云层翻涌如海浪。

## 🍜 徽州美食

- **臭鳜鱼** — 徽菜代表，闻着臭吃着香
- **毛豆腐** — 黄山特色，外脆里嫩
- **黄山烧饼** — 酥脆可口，带回去的佳品
- **一品锅** — 徽州传统火锅

## 💡 旅行贴士

- 建议乘坐云谷索道上山（节省体力）
- 山顶住宿需提前一个月预订
- 携带雨衣（山顶风大不宜打伞）
- 登山杖和护膝是必备品
- 最佳季节：春秋两季（4-5月、9-11月）
- 黄山门票：旺季190元，淡季150元`,
        en: `## 🏔️ Yellow Mountain

**Welcoming Pine** — Iconic 800-year-old pine tree growing on a cliff.

**Bright Summit** — Second highest peak at 1860m, best spot for sunrise and sea of clouds.

**West Sea Grand Canyon** — Most spectacular natural scenery with bizarre rocks and mist.

## 💡 Tips

- Take the cable car up to save energy
- Book mountain top accommodation one month in advance
- Best seasons: Spring (Apr-May) and Autumn (Sep-Nov)`
      },
      11: {
        zh: `## 🌊 九寨沟·人间仙境

**五花海** — 九寨沟的精华，湖水呈现翠绿、湛蓝、鹅黄等多种颜色，被誉为"九寨沟一绝"。湖底钙化沉积物和水藻让湖水色彩斑斓。

**诺日朗瀑布** — 中国最宽的高山钙化瀑布，宽270米，高24.5米。《西游记》取景地之一。丰水期气势磅礴。

**五彩池** — 九寨沟最小的海子，但色彩最为丰富。水质清澈见底，因含有不同矿物质而呈现五彩斑斓。

**长海** — 九寨沟海拔最高（3060米）、面积最大的海子。湖水呈墨蓝色，四周雪山环绕。

**树正群海** — 由大小19个海子组成，层层叠叠的瀑布群，景色如诗如画。

## 🍜 藏式美食

- **酥油茶** — 藏族传统饮品，暖身驱寒
- **青稞饼** — 高原特色主食
- **牦牛肉** — 肉质紧实，风味独特
- **藏式酸奶** — 浓郁醇厚

## 💡 旅行贴士

- 九寨沟海拔2000-3100米，注意高反
- 景区内禁止无人机飞行
- 秋季（10月中下旬）是看红叶的最佳时间
- 建议购买观光车票（90元/人）
- 门票旺季169元，淡季80元
- 景区内只有一家餐厅，建议自带干粮`,
        en: `## 🌊 Jiuzhaigou Valley

A fairytale world of turquoise lakes, layered waterfalls, and snow-capped peaks.

**Five Flower Lake** — The essence of Jiuzhaigou, crystal clear water in multiple colors.

**Nuorilang Waterfall** — China's widest alpine travertine waterfall (270m wide).

## 💡 Tips

- Altitude: 2000-3100m, prepare for altitude sickness
- Best time: October (autumn foliage)
- No drones allowed inside the park`
      },
      12: {
        zh: `## 🏖️ 三亚·天涯海角

**蜈支洲岛** — 三亚最著名的海岛，被誉为"中国马尔代夫"。海水清澈见底，珊瑚礁丰富，是潜水和水上运动的天堂。

**亚龙湾** — "天下第一湾"，拥有7公里长的银色沙滩。沙质细软，海水湛蓝，是三亚最美的海湾。

**天涯海角** — 三亚标志性景点，刻有"天涯"、"海角"的巨石矗立在海边。寓意爱情的永恒。

**南山寺** — 世界上最南端的佛教道场，108米高的南海观音圣像庄严肃穆。

## 🍜 海南美食

- **文昌鸡** — 海南四大名菜之首，白切最正宗
- **抱罗粉** — 海南特色粉面
- **清补凉** — 消暑甜品，椰奶+各种配料
- **海鲜大餐** — 石斑鱼、龙虾、螃蟹等

## 💡 旅行贴士

- 防晒！三亚紫外线极强
- 最佳季节：10月-次年4月（避开台风季）
- 蜈支洲岛建议提前一天预订船票
- 海鲜去第一市场买再加工最划算
- 租车自驾是最方便的出行方式`,
        en: `## 🏖️ Sanya

**Wuzhizhou Island** — Known as "China's Maldives", perfect for diving and water sports.

**Yalong Bay** — "First Bay Under Heaven", 7km of silver sand.

**Tianya Haijiao** — Iconic rocks engraved with "End of the Earth".

## 💡 Tips

- Strong sun! Bring high SPF sunscreen
- Best season: October to April
- Book Wuzhizhou ferry tickets a day ahead`
      },
      13: {
        zh: `## 🏘️ 丽江古城·玉龙雪山

**丽江古城** — 世界文化遗产，已有800多年历史。四方街是古城中心，黑龙潭可遥望玉龙雪山倒影。古城内小桥流水，纳西族民居错落有致。

**玉龙雪山** — 丽江最高峰，海拔5596米。乘坐大索道可至4506米处，冰川公园壮丽无比。印象丽江实景演出震撼人心。

**束河古镇** — 比大研古城更宁静，是茶马古道上的重要驿站。青龙桥、四方街都是拍照的好地方。

**拉市海** — 高原湿地公园，可以骑马体验茶马古道，乘船观鸟。

## 🍜 纳西美食

- **腊排骨火锅** — 丽江最有名的美食
- **鸡豆凉粉** — 纳西族传统小吃
- **纳西烤鱼** — 香辣可口
- **酥油茶配糌粑** — 高原特色

## 💡 旅行贴士

- 丽江海拔2400米，注意预防高反
- 古城维护费50元/人
- 玉龙雪山索道票需提前一天抢购
- 旺季（7-8月、黄金周）人非常多
- 建议住古城外的酒店，性价比更高`,
        en: `## 🏘️ Lijiang

**Old Town** — UNESCO World Heritage, 800 years old with canals and Naxi architecture.

**Jade Dragon Snow Mountain** — 5596m peak. Take the cable car to 4506m for the glacier park.

**Shuhe Ancient Town** — Quieter alternative to Dayan Old Town.

## 💡 Tips

- Altitude 2400m
- Book Jade Dragon Snow Mountain cable car tickets a day ahead`
      },
      14: {
        zh: `## 🏔️ 张家界·阿凡达仙境

**袁家界** — 《阿凡达》哈利路亚山的取景地。乾坤柱（哈利路亚山原型）独立于山谷之中，云雾缭绕仿佛悬浮于空中。迷魂台观景视野绝佳。

**天子山** — 张家界最壮观的山景，御笔峰、仙人桥、天子阁都是标志性景点。雨后天晴时云雾缭绕，宛如仙境。

**天门山** — 世界最高海拔穿山溶洞，天门洞高131.5米。99道弯通天大道惊险刺激。玻璃栈道悬于崖壁之上，胆战心惊。

**金鞭溪** — 张家界国家森林公园中最美的溪谷，全长7.5公里。溪水清澈见底，两岸奇峰耸立，猴群出没。

## 🍜 湘西美食

- **三下锅** — 张家界特色菜，层层叠叠
- **土家腊肉** — 烟熏味十足
- **葛根粉** — 当地特产，清热解暑
- **血粑鸭** — 湘西传统名菜

## 💡 旅行贴士

- 穿舒适的登山鞋，景区面积非常大
- 天门山建议选A线（索道上山，公路下山）
- 玻璃栈道需租鞋套（5元）
- 雨天天门洞可见"天门吐雾"奇观
- 森林公园门票4天有效
- 最佳季节：4-6月、9-11月`,
        en: `## 🏔️ Zhangjiajie

**Yuanjiajie** — Inspiration for Avatar's floating Hallelujah Mountains.

**Tianzi Mountain** — Most spectacular peaks, like a fairyland after rain.

**Tianmen Mountain** — World's highest mountain cave (131.5m), glass skywalk.

**Golden Whip Stream** — 7.5km scenic valley with crystal clear water.

## 💡 Tips

- Wear comfortable hiking shoes
- Tianmen Mountain: take cable car up, bus down
- Park ticket valid for 4 days`
      },
      15: {
        zh: `## 🏞️ 桂林·山水甲天下

**漓江** — 桂林山水的精华。乘竹筏从杨堤到兴坪段是最经典的线路。沿途九马画山、黄布倒影、20元人民币背景——元宝山。

**阳朔西街** — 阳朔最繁华的街道，中西文化交融。晚上酒吧、餐厅、手工艺品店琳琅满目，是体验阳朔夜生活的最佳去处。

**银子岩** — 桂林最漂亮的溶洞，贯穿12座山峰。洞内钟乳石、石笋、石幔形态各异，在灯光照射下如银子般闪闪发光。

**十里画廊** — 阳朔最美骑行路线，沿途月亮山、大榕树、蝴蝶泉等景点。

## 🍜 桂林美食

- **桂林米粉** — 桂林的灵魂美食，卤水是秘诀
- **啤酒鱼** — 阳朔最著名的菜肴
- **田螺酿** — 阳朔特色小吃
- **荔浦芋头扣肉** — 桂林传统名菜

## 💡 旅行贴士

- 漓江竹筏建议选杨堤-兴坪精华段
- 阳朔租电动车骑行最方便（约30-50元/天）
- 印象·刘三姐实景演出值得一看
- 遇龙河漂流比漓江更宁静原始
- 最佳季节：4-10月`,
        en: `## 🏞️ Guilin

**Li River** — The essence of Guilin scenery. Take a bamboo raft from Yangdi to Xingping.

**West Street** — Yangshuo's vibrant main street, a blend of Chinese and Western culture.

**Silver Cave** — Most beautiful karst cave, sparkling like silver under lights.

## 💡 Tips

- Best bamboo raft section: Yangdi to Xingping
- Rent an e-bike in Yangshuo (~30-50 yuan/day)
- Best season: April to October`
      },
      16: {
        zh: `## 🏛️ 西安·千年古都

**兵马俑** — 世界第八大奇迹，秦始皇陵陪葬坑。已出土陶俑、陶马8000余件，每个兵马俑的相貌、表情均不同。一号坑最为壮观。

**古城墙** — 中国现存规模最大、保存最完整的古代城墙。全长13.74公里，可以骑行（约2小时）。南门（永宁门）夜景最美。

**大雁塔** — 西安标志性建筑，玄奘为保存佛经而建。北广场有亚洲最大的音乐喷泉。

**大唐不夜城** — 以盛唐文化为主题的步行街，华灯璀璨，仿佛穿越回大唐盛世。

**回民街** — 西安最著名的美食街，汇集西北和清真美食。牛羊肉泡馍、凉皮每个摊位都排长队。

## 🍜 西安美食

- **羊肉泡馍** — 西安名片的代表
- **肉夹馍** — "中国汉堡"，白吉馍夹腊汁肉
- **凉皮** — 夏天消暑必吃
- **BiangBiang面** — 西安特色宽面
- **胡辣汤** — 西安人最爱的早餐

## 💡 旅行贴士

- 城墙骑行约2小时，建议傍晚去
- 兵马俑最好请导游（讲解更生动）
- 回民街的贾三灌汤包子最有名
- 长恨歌演出在临潼华清宫，震撼感人
- 最佳季节：3-5月、9-11月`,
        en: `## 🏛️ Xi'an

**Terracotta Warriors** — Eighth Wonder of the World, over 8,000 life-sized figures.

**Ancient City Wall** — Best-preserved city wall in China, 13.74km, rent a bike!

**Muslim Quarter** — Famous food street with Northwestern Chinese and Halal cuisine.

## 💡 Tips

- Cycling the wall takes ~2 hours, go near sunset
- Hire a guide at the Terracotta Warriors museum
- Must-try: lamb paomo, roujiamo, biangbiang noodles`
      },
      17: {
        zh: `## 🌴 西双版纳·热带雨林

**野象谷** — 中国唯一可以近距离观察亚洲象的地方。看野象在雨林中漫步，观看大象表演，与大象亲密互动。

**热带植物园** — 中国科学院下属植物园，是中国面积最大、植物多样性最丰富的植物园。占地1100公顷，收集活植物13000多种。

**傣族园** — 体验傣族文化的精华所在。每天下午有泼水节表演，感受"水花放，傣家旺"的热情。竹楼建筑、傣族舞蹈、贝叶经文化令人陶醉。

**告庄夜市** — 西双版纳最热闹的夜市，星光璀璨。特色小吃、手工艺品、民族服饰琳琅满目。

## 🍜 傣味美食

- **傣味烤鱼** — 香茅草烤制的罗非鱼
- **菠萝紫米饭** — 香甜可口
- **舂鸡脚** — 酸辣开胃的傣族小吃
- **老挝冰咖啡** — 浓郁醇厚，消暑必备

## 💡 旅行贴士

- 西双版纳热带气候，全年温暖
- 雨季（5-10月）每天下午都有阵雨，带伞
- 植物园建议安排一天时间游览
- 蚊虫较多，注意防蚊
- 最佳季节：11月-次年4月（旱季）`,
        en: `## 🌴 Xishuangbanna

**Wild Elephant Valley** — Only place in China to see Asian elephants up close.

**Tropical Botanical Garden** — China's largest botanical garden with 13,000+ plant species.

**Dai Ethnic Village** — Experience Dai culture and the famous Water-Splashing Festival.

## 💡 Tips

- Tropical climate, warm year-round
- Rainy season (May-Oct): afternoon showers, bring umbrella
- Best season: November to April`
      },
      18: {
        zh: `## 🏘️ 乌镇·梦里水乡

**西栅** — 乌镇最精华的部分，水乡风貌保存完好。小桥流水人家，石板路蜿蜒。夜景尤其迷人，灯笼倒映在水中如梦如幻。

**东栅** — 更原生态的江南水乡，保留着当地居民的生活气息。百床馆、民俗馆展示了江南民俗文化。

**木心美术馆** — 由贝聿铭弟子设计建造，展示木心先生的绘画和文学作品。建筑本身即是艺术品。

**茅盾故居** — 文学巨匠茅盾的出生地，了解一代文豪的成长历程。

**水上集市** — 再现了旧时江南水乡的集市场景，船只汇聚，商品琳琅。

## 🍜 江南美食

- **红烧羊肉** — 乌镇冬季特色
- **姑嫂饼** — 乌镇特产糕点
- **三白酒** — 乌镇传统米酒
- **定胜糕** — 寓意美好的传统点心

## 💡 旅行贴士

- 西栅门票150元，东栅110元，联票190元
- 建议住在西栅景区内，体验夜景和清晨
- 西栅夜景不可错过（亮灯到22:00）
- 避开节假日，平时人较少
- 最佳季节：3-5月（春暖花开）、9-11月`,
        en: `## 🏘️ Wuzhen

**Xizha** — The best preserved part of Wuzhen, magical at night with lanterns reflecting on the water.

**Dongzha** — More authentic, with a glimpse of local life.

**Mu Xin Art Museum** — Designed by a protege of I.M. Pei.

## 💡 Tips

- Stay inside Xizha to enjoy night and morning views
- Xizha ticket: 150 yuan, combo: 190 yuan
- Best season: March-May, September-November`
      },
      19: {
        zh: `## 🏛️ 故宫·紫禁城深度游

**太和殿** — 紫禁城中规模最大、等级最高的殿宇。皇帝登基、大婚、册封等重大典礼均在此举行。殿内金砖铺地，金龙盘柱。

**乾清宫** — 明清两代皇帝的寝宫和处理日常政务的地方。正大光明匾额背后是放置秘密立储匣的地方。

**御花园** — 故宫内最大的花园，古柏参天，亭台楼阁错落有致。堆秀山是全园的制高点。

**景山公园** — 故宫北面，登万春亭可俯瞰故宫全景。天气好时可以看到北京中轴线全貌。

**国家博物馆** — 中国最大的综合性博物馆，珍藏中华五千年文明的瑰宝。建议安排2-3小时参观。

## 🍜 北京美食

- **北京烤鸭** — 全聚德、大董、四季民福
- **炸酱面** — 老北京家常面
- **豆汁焦圈** — 老北京最特色的早餐
- **涮羊肉** — 铜锅涮肉，东来顺最正宗

## 💡 旅行贴士

- 故宫门票需提前7天在官网预订
- 建议走中轴线+东西六宫路线（约4小时）
- 周一故宫闭馆！
- 讲解器20元/个，建议租用
- 旺季门票60元，淡季40元
- 最佳季节：春秋两季`,
        en: `## 🏛️ Forbidden City

**Hall of Supreme Harmony** — The largest and most important hall in the Forbidden City.

**Palace of Heavenly Purity** — The emperor's residence and office.

**Jingshan Park** — Best panoramic view of the Forbidden City from the top.

## 💡 Tips

- Book tickets 7 days in advance on the official website
- Closed on Mondays!
- Audio guide: 20 yuan, recommended`
      },
      2: {
        zh: `## 🏝️ 马尔代夫双鱼岛

**双鱼岛（Olhuveli）** — 马尔代夫最美的度假岛之一，位于南马累环礁。绵长的白色沙滩、碧绿清澈的泻湖、丰富的海底世界。岛上有豪华水上别墅和沙滩别墅。

**浮潜** — 双鱼岛周边的珊瑚礁是浮潜胜地。蝠鲼、海龟、热带鱼群随处可见。建议早上去浮潜，海水最清澈。

**海上日落** — 马尔代夫的日落美到令人窒息。乘坐多尼船出海，看夕阳染红天际和水面。

## 🍜 饮食

- 岛上餐厅提供国际自助餐
- 特色海鲜烧烤不可错过
- 蜜月赠送香槟和水果篮

## 💡 旅行贴士

- 马累机场到双鱼岛乘快艇约45分钟
- 最佳季节：11月-次年4月（干季）
- 岛上通用美元，建议带少量现金
- 防晒霜建议选用对珊瑚友好的品牌`,
        en: `## 🏝️ Maldives Olhuveli

One of the most beautiful resort islands in the South Male Atoll. White sand beaches, crystal clear lagoons, and rich marine life.

## 💡 Tips

- 45 minutes speedboat from Male airport
- Best season: November to April (dry season)
- Use reef-safe sunscreen`
      },
      3: {
        zh: `## 🌴 海南双飞5日游

**三亚湾** — 三亚最长的海湾，椰梦长廊贯穿其中。傍晚散步看日落，感受海风拂面。

**亚龙湾热带天堂森林公园** — 电影《非诚勿扰2》取景地，过江龙索桥刺激有趣，山顶可俯瞰整个亚龙湾。

**天涯海角** — "天涯""海角"两块巨石矗立海边，象征爱情永恒。

**南山佛教文化苑** — 108米海上观音圣像庄严殊胜。可登莲花台抱佛脚祈福。

## 💡 旅行贴士

- 海南全年适合旅游，旺季11月-次年3月
- 三亚各海湾各有特色：亚龙湾沙质最好，三亚湾看日落最美
- 建议租车自驾，海南高速不收费`,
        en: `## 🌴 Hainan

5-day round-trip flight tour exploring Sanya's best beaches and attractions.

## 💡 Tips

- Best season: November to March
- Rent a car for the best experience (no tolls on Hainan highways)`
      },
      4: {
        zh: `## 🗾 富士-大阪-东京8日游

**富士山** — 日本最高峰（3776米），世界文化遗产。富士五湖区域是最佳观赏点，河口湖的逆富士倒影美不胜收。

**大阪城** — 日本战国时代丰臣秀吉的居城。天守阁是标志性建筑，内部为博物馆。大阪城公园春季赏樱极佳。

**东京迪士尼** — 亚洲第一个迪士尼乐园，分为海洋和乐园两个园区。海洋乐园是全球唯一的迪士尼海洋主题乐园。

**银座** — 东京最奢华的商业区，高级百货、品牌旗舰店云集。夜晚霓虹闪烁。

## 🍜 日本美食

- **寿司** — 筑地市场最新鲜
- **拉面** — 一兰、一风堂各有风味
- **天妇罗** — 酥脆可口
- **抹茶甜品** — 京都名物

## 💡 旅行贴士

- 日本交通便利，建议购买JR Pass
- 富士山7-8月开放登顶
- 东京地铁线路复杂，建议用Google Maps导航`,
        en: `## 🗾 Japan 8-Day Tour

**Mt. Fuji** — Japan's highest peak (3776m). Best viewed from the Five Lakes area.

**Osaka Castle** — Toyotomi Hideyoshi's iconic castle.

**Tokyo Disneyland** — Asia's first Disney resort with two unique parks.

## 💡 Tips

- Get a JR Pass for cost-effective travel
- Google Maps works great for Tokyo's complex subway`
      },
      5: {
        zh: `## 🏰 法瑞意德12日游

**少女峰（Jungfrau）** — 欧洲之巅，海拔3454米。乘齿轮火车登顶，沿途阿尔卑斯山景壮丽。峰顶有冰宫、观景台、瑞士莲巧克力天堂。

**金色列车（GoldenPass）** — 瑞士最美的观光列车线路。从蒙特勒到琉森，沿途经过湖泊、葡萄园、阿尔卑斯牧场。全景车窗让美景一览无余。

**卢浮宫** — 世界最大博物馆，收藏《蒙娜丽莎》《断臂维纳斯》《胜利女神像》等传世珍品。

**威尼斯** — 水上之城，乘坐贡多拉穿行在小巷水道中。圣马可广场、叹息桥不可错过。

## 💡 旅行贴士

- 申根签证需提前2-3个月申请
- 法国意大利小偷较多，注意保管财物
- 瑞士消费最高，建议带些零食
- 欧洲夏季白天长，适合游览`,
        en: `## 🏰 Europe 12-Day Tour

**Jungfrau** — Top of Europe (3454m), accessible by cogwheel train.

**Golden Pass** — Switzerland's most scenic train route.

**Louvre** — World's largest museum, home to the Mona Lisa.

**Venice** — City of canals, ride a gondola through the waterways.`
      },
      6: {
        zh: `## 🌺 巴厘岛6日半自助游

**蓝梦岛** — 巴厘岛最美离岛。恶魔的眼泪（Devil's Tear）巨浪拍岸。梦幻海滩（Dream Beach）白沙滩，浮潜看魔鬼鱼和珊瑚。

**乌布皇宫** — 巴厘岛传统建筑艺术的典范。皇宫虽不大但雕刻精美，晚上有传统舞蹈表演。

**金巴兰海滩** — 世界十大最美日落海滩之一。在海滩上享用海鲜烧烤晚餐，脚踩细沙，看落日余晖。

**海神庙（Tanah Lot）** — 巴厘岛最重要的海上寺庙。涨潮时寺庙仿佛浮在海面上，日落时分最为神圣。

## 💡 旅行贴士

- 巴厘岛免签，直接持护照入境
- 印尼盾面值较大，注意汇率
- 租摩托车是自由行的最佳方式
- 进入寺庙需穿纱笼
- 最佳季节：4-10月`,
        en: `## 🌺 Bali

**Nusa Lembongan** — Best island for snorkeling and cliff views.

**Ubud Palace** — Traditional Balinese architecture with evening dance performances.

**Jimbaran Bay** — Top 10 sunset views worldwide.

## 💡 Tips

- Visa-free for Chinese passport holders
- Best season: April to October`
      },
      7: {
        zh: `## 🏜️ 塞舌尔迪拜9日自助游

**塞舌尔海滩** — 世界上最美海滩的集中地。拉齐奥海滩（Lazio Beach）被誉为全球TOP1海滩。五月谷是塞舌尔国宝海椰子的唯一产地。

**迪拜塔（哈利法塔）** — 世界最高建筑，828米。124层观景台可俯瞰迪拜全城。夜幕降临音乐喷泉表演震撼。

**棕榈岛** — 世界最大人工岛，棕榈叶形状。岛上亚特兰蒂斯酒店水族馆世界闻名。

**沙漠冲沙** — 迪拜经典体验。Land Cruiser在沙丘上飞驰，日落时分在沙漠营地享用阿拉伯晚餐。

## 💡 旅行贴士

- 阿联酋免签，持护照直接入境
- 塞舌尔免签，但需提供酒店和回程机票
- 迪拜夏季气温超40°C，冬季（11-3月）最佳
- 阿联酋航空的A380体验不容错过`,
        en: `## 🏜️ Seychelles & Dubai

**Seychelles Beaches** — Some of the world's most beautiful beaches. Lazio Beach ranked #1 globally.

**Burj Khalifa** — World's tallest building at 828m.

**Desert Safari** — Classic Dubai experience with dune bashing and Arabian dinner.`
      },
      8: {
        zh: `## 🎈 花样姐姐土耳其9-10日游

**热气球之旅** — 卡帕多奇亚最梦幻的体验。清晨乘热气球升空，俯瞰奇特的火山岩地貌和仙人烟囱。日出霞光下的景象终生难忘。

**棉花堡（Pamukkale）** — 上帝打翻的牛奶瓶。白色钙化梯田层层叠叠，温泉水碧蓝。赤脚走上棉花堡，感受温润的触感。

**以弗所（Ephesus）** — 地中海东部保存最完好的古罗马城市。塞尔苏斯图书馆是最壮观的历史遗迹。

**蓝色清真寺** — 伊斯坦布尔的象征。六根宣礼塔，260扇窗户，内部2万多块伊兹尼蓝瓷砖。

## 🍜 土耳其美食

- **烤肉（Kebab）** — 土耳其烤肉世界闻名
- **土耳其冰淇淋** — 粘稠有嚼劲
- **巴克拉瓦** — 果仁蜜饼，甜到心底
- **土耳其咖啡** — 浓烈醇厚

## 💡 旅行贴士

- 土耳其电子签证（60美元），5分钟出签
- 热气球250-300美元/人，提前预订
- 土耳其里拉贬值，购物很划算`,
        en: `## 🎈 Turkey

**Hot Air Balloon** — Cappadocia's most magical experience at sunrise.

**Pamukkale** — "Cotton Castle", white travertine terraces with thermal waters.

**Ephesus** — Best-preserved ancient Roman city in the Eastern Mediterranean.

## 💡 Tips

- E-visa ($60), issued in 5 minutes
- Book hot air balloon in advance ($250-300)`
      },
      9: {
        zh: `## 🗾 大阪-京都-箱根双飞6日游

**大阪城** — 丰臣秀吉的居城，天守阁是日本三大名城之一。大阪城公园春樱秋叶，四季皆美。

**京都清水寺** — 京都最古老的寺庙之一，被列为世界文化遗产。悬空的清水舞台是日本国宝。音羽瀑布三道泉水各有所求。

**箱根温泉** — 富士山脚下的温泉胜地。大涌谷是火山活动形成的硫磺谷，黑鸡蛋是特色。芦之湖上乘海盗船赏富士山。

**奈良公园** — 可爱的鹿群自由漫步。东大寺的大佛殿是世界最大的木造建筑。

## 🍜 关西美食

- **大阪烧** — 大阪的灵魂美食
- **章鱼烧** — 明石烧的原版
- **抹茶甜品** — 宇治抹茶正宗
- **怀石料理** — 京都精致的传统料理

## 💡 旅行贴士

- 大阪-京都-奈良三地距离很近，推荐住大阪
- 箱根周游券很划算（涵盖交通+景点）
- 奈良的鹿很聪明，会鞠躬讨食
- 京都建议安排3天以上`,
        en: `## 🗾 Kansai Japan

**Kiyomizu-dera** — Kyoto's most famous temple with an iconic wooden stage.

**Hakone Hot Springs** — Hot spring resort at the foot of Mt. Fuji.

**Nara Park** — Friendly deer roam freely, bowing for treats.

## 💡 Tips

- Stay in Osaka for easy access to Kyoto and Nara
- Hakone Pass offers great value`
      }
    };

    const update = db.prepare('UPDATE tours SET details = ?, details_en = ? WHERE id = ?');
    for (const [id, d] of Object.entries(details)) {
      update.run(d.zh, d.en, parseInt(id));
    }

    console.log('✅ 详细介绍数据迁移完成（' + Object.keys(details).length + '条线路）');
  }
}

module.exports = { migrateDetails };
