/**
 * Auto-migration: Add English fields to tours and categories.
 * Safe to run multiple times — uses ALTER TABLE ADD COLUMN with error handling.
 */
const { getDb } = require('./init');

function migrateEn() {
  try {
    const db = getDb();

    // Add columns to tours table
    const tourColumns = [
      'title_en TEXT',
      'type_label_en TEXT',
      'description_en TEXT',
      'transport_en TEXT',
      'highlights_en TEXT',
      'route_en TEXT',
    ];

    for (const col of tourColumns) {
      try {
        db.exec(`ALTER TABLE tours ADD COLUMN ${col}`);
      } catch (e) {
        // Column already exists — ignore
      }
    }

    // Add column to categories table
    try {
      db.exec('ALTER TABLE categories ADD COLUMN name_en TEXT');
    } catch (e) {}

    // Check if data already migrated
    const sample = db.prepare('SELECT title_en FROM tours WHERE id = 1').get();
    if (sample && sample.title_en) return; // Already migrated

    // Category English names
    const catUpdates = [
      [1, 'Domestic Long Tours'],
      [2, 'International Tours'],
      [3, 'Self-Guided Tours'],
      [4, 'Domestic Short Tours'],
      [5, 'Cruise Tours'],
    ];
    const updateCat = db.prepare('UPDATE categories SET name_en = ? WHERE id = ?');
    for (const [id, name] of catUpdates) updateCat.run(name, id);

    // Tour English data
    const toursEn = [
      [1, 'Bangkok-Pattaya 6-Day Tour', 'International', 'Group discount, rich attractions, upgrade 1 night to 5-star, no hidden fees, free 600 RMB/person voucher', 'Spring Airlines from Hangzhou', 'Grand Palace|Emerald Buddha|Pattaya Beach|Cabaret Show', 'Hangzhou-Bangkok-Pattaya-Bangkok-Hangzhou'],
      [2, 'Maldives Olhuveli 6-Day Self-Guided Tour', 'International', 'From Shanghai, flight+hotel includes breakfast, dinner & speedboat', 'Direct flight from Shanghai', 'Olhuveli Island|Sunset at Sea|Snorkeling|SPA', 'Shanghai-Male-Olhuveli-Male-Shanghai'],
      [3, 'Hainan 5-Day Tour', 'Self-Guided', 'Includes Yancheng transfer, 4-star hotels, all-inclusive, no add-ons', 'Spring Airlines from Yancheng', 'Sanya|Yalong Bay|End of the Earth|Wuzhizhou Island', 'Yancheng-Sanya-Yalong Bay-End of Earth-Yancheng'],
      [4, 'Mt.Fuji-Osaka-Tokyo 8-Day Tour', 'Self-Guided', 'Summer family trip, 2 free days, no forced shopping', 'International flight', 'Mt. Fuji|Osaka Castle|Tokyo Disneyland|Ginza', 'Shanghai-Osaka-Mt.Fuji-Tokyo-Shanghai'],
      [5, 'France-Switzerland-Italy-Germany 12-Day Tour', 'Domestic Short', '4-5 star hotels, Golden Pass train, Jungfrau, THE MALL outlets', 'International flight', 'Jungfrau|Golden Pass|Louvre|Venice', 'Shanghai-Paris-Milan-Interlaken-Rome-Shanghai'],
      [6, 'Bali 6-Day Semi Self-Guided Tour', 'International', 'Lembongan Island, private villa, Banyan Tree afternoon tea, pure play', 'Direct flight from Shanghai', 'Lembongan|Ubud Palace|Jimbaran Beach|Tanah Lot', 'Shanghai-Bali-Lembongan-Bali-Shanghai'],
      [7, 'Seychelles-Dubai 9-Day Tour', 'Cruise', 'Two countries, 4 nights Seychelles, 2 nights Dubai, Emirates from HK', 'Emirates Airlines', 'Seychelles Beach|Burj Khalifa|Palm Jumeirah|Desert Safari', 'Hong Kong-Dubai-Seychelles-Dubai-Hong Kong'],
      [8, 'Turkey 10-Day Tour', 'International', 'Up to 3000 RMB off! Chinese cuisine + Turkish local food', 'International flight', 'Hot Air Balloon|Pamukkale|Ephesus|Blue Mosque', 'Shanghai-Istanbul-Cappadocia-Pamukkale-Shanghai'],
      [9, 'Osaka-Kyoto-Hakone 6-Day Tour', 'Domestic Short', 'Direct from Yancheng, no backtracking, great value', 'Spring Airlines from Yancheng', 'Osaka Castle|Kiyomizu-dera|Hakone Hot Spring|Nara Deer', 'Yancheng-Osaka-Kyoto-Hakone-Nara-Yancheng'],
      [10, 'Huangshan Mountain 3-Day Tour', 'Domestic Short', 'Huangshan - the most famous mountain in China. Visit scenic spots, hot springs, and sea of clouds.', 'High-speed rail', 'Welcoming Pine|Bright Summit|West Sea Canyon|Cloud Sea|Hot Spring', 'Departure-Huangshan North-Scenic Area-Bright Summit-West Sea Canyon-Return'],
      [11, 'Jiuzhaigou Fairyland 4-Day Tour', 'Domestic Long', 'Jiuzhaigou - a fairyland of turquoise lakes, waterfalls, and snow peaks.', 'Meet in Chengdu, AC tour bus', 'Five Flower Lake|Nuorilang Waterfall|Five Color Pond|Long Sea|Shuzheng Lakes', 'Chengdu-Jiuzhaigou-Five Flower-Nuorilang-Five Color-Chengdu'],
      [12, 'Sanya Paradise 5-Day Tour', 'Self-Guided', 'Tropical paradise Sanya, sun beach and coconut palms. Snorkeling at Wuzhizhou Island.', 'Sanya Phoenix Airport transfer', 'Wuzhizhou Island|Yalong Bay|End of Earth|Sanya Bay|Nanshan Temple', 'Sanya-Wuzhizhou-Yalong Bay-End of Earth-Nanshan-Sanya'],
      [13, 'Lijiang-Jade Dragon Snow Mountain 5-Day Tour', 'Self-Guided', 'Stroll Lijiang Old Town (UNESCO), view Jade Dragon Snow Mountain, tea tasting, horse riding.', 'Lijiang Sanyi Airport transfer', 'Old Town|Jade Dragon Snow Mountain|Shuhe Ancient Town|Lashihai Lake|Impression Lijiang', 'Lijiang-Old Town-Jade Dragon-Blue Moon Valley-Shuhe-Lashihai'],
      [14, 'Zhangjiajie Avatar 4-Day Tour', 'Domestic Short', 'Avatar Hallelujah Mountains! Zhangjiajie incredible quartzite peaks and glass skywalk.', 'High-speed rail + private transfer', 'Yuanjiajie|Tianzi Mountain|Tianmen Mountain|Glass Skywalk|Golden Whip Stream', 'Zhangjiajie-Yuanjiajie-Tianzi-Tianmen-Glass Skywalk-Golden Whip-Return'],
      [15, 'Guilin Landscape 4-Day Tour', 'Domestic Short', 'Guilin scenery is the best under heaven - Li River bamboo raft, Yangshuo West Street.', 'High-speed rail to Guilin', 'Li River|Yangshuo West Street|Silver Cave|Ten Mile Gallery|Elephant Trunk Hill', 'Guilin-Li River-Yangshuo-Silver Cave-Ten Mile Gallery-Elephant Hill-Return'],
      [16, "Xi'an Ancient Capital 4-Day Tour", 'Domestic Long', "Xi'an - 13 dynasty capital. Terracotta Warriors, Ancient City Wall, Muslim Quarter.", "High-speed rail to Xi'an", 'Terracotta Warriors|City Wall|Giant Wild Goose Pagoda|Tang Paradise|Muslim Quarter', "Xi'an-Terracotta Warriors-Huaqing Palace-City Wall-Giant Pagoda-Muslim Quarter"],
      [17, 'Xishuangbanna Rainforest 5-Day Tour', 'Self-Guided', 'Tropical rainforest, see Asian elephants at Wild Elephant Valley, Dai culture experience.', 'Fly to Jinghong, private transfer', 'Wild Elephant Valley|Botanical Garden|Dai Garden|Gaozhuang Night Market|Wangtianshu', 'Jinghong-Wild Elephant-Botanical Garden-Dai Garden-Night Market-Wangtianshu-Return'],
      [18, "Wuzhen Water Town 3-Day Tour", 'Domestic Short', "China's last water town. Gondola ride through canals, shadow puppetry, waterfront inn.", 'High-speed rail to Tongxiang', 'West Gate|East Gate|Muxin Art Museum|Mao Dun Former Residence|Water Market', 'Tongxiang-Wuzhen West-Muxin Museum-East Gate-Mao Dun-Water Market-Return'],
      [19, 'Forbidden City 3-Day In-Depth Tour', 'Domestic Short', '600-year Forbidden City in-depth tour. Three Great Halls, Imperial Garden, Jingshan Park.', 'High-speed rail to Beijing + subway', 'Hall of Supreme Harmony|Palace of Heavenly Purity|Imperial Garden|Jingshan Park|National Museum', 'Beijing-Forbidden City-Jingshan Park-National Museum-Tiananmen Square-Return'],
    ];

    const updateTour = db.prepare('UPDATE tours SET title_en = ?, type_label_en = ?, description_en = ?, transport_en = ?, highlights_en = ?, route_en = ? WHERE id = ?');
    for (const t of toursEn) {
      updateTour.run(t[1], t[2], t[3], t[4], t[5], t[6], t[0]);
    }

    console.log('✅ 英文景点数据已迁移');
  } catch (e) {
    // Silently handle errors in production
    console.error('Migration error:', e.message);
  }
}

module.exports = { migrateEn };
