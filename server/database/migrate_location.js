/**
 * Migration: Add location fields (latitude, longitude, city) to tours table
 * Run on server start if columns don't exist.
 */
const { getDb } = require('./init');

function migrateLocation() {
  const db = getDb();

  // Check if latitude column exists
  const cols = db.prepare("PRAGMA table_info('tours')").all();
  const hasLat = cols.some(c => c.name === 'latitude');

  if (!hasLat) {
    console.log('📍 正在迁移地理位置数据...');
    db.exec(`
      ALTER TABLE tours ADD COLUMN latitude REAL DEFAULT 0;
      ALTER TABLE tours ADD COLUMN longitude REAL DEFAULT 0;
      ALTER TABLE tours ADD COLUMN city TEXT DEFAULT '';
      ALTER TABLE tours ADD COLUMN location_name TEXT DEFAULT '';
    `);

    // Set location data for each tour
    const locations = {
      1:  { lat: 13.7563, lng: 100.5018, city: '曼谷', loc: '泰国·曼谷' },
      2:  { lat: 3.2028,  lng: 73.2207,  city: '马累', loc: '马尔代夫·双鱼岛' },
      3:  { lat: 18.2528, lng: 109.5120, city: '三亚', loc: '海南·三亚' },
      4:  { lat: 35.6762, lng: 139.6503, city: '东京', loc: '日本·东京' },
      5:  { lat: 48.8566, lng: 2.3522,   city: '巴黎', loc: '法国·巴黎' },
      6:  { lat: -8.3405, lng: 115.0920, city: '巴厘岛', loc: '印度尼西亚·巴厘岛' },
      7:  { lat: 25.2048, lng: 55.2708,  city: '迪拜', loc: '阿联酋·迪拜' },
      8:  { lat: 41.0082, lng: 28.9784,  city: '伊斯坦布尔', loc: '土耳其·伊斯坦布尔' },
      9:  { lat: 34.6937, lng: 135.5023, city: '大阪', loc: '日本·大阪' },
      10: { lat: 30.1330, lng: 118.1750, city: '黄山', loc: '安徽·黄山' },
      11: { lat: 33.2621, lng: 104.2370, city: '九寨沟', loc: '四川·九寨沟' },
      12: { lat: 18.2528, lng: 109.5120, city: '三亚', loc: '海南·三亚' },
      13: { lat: 26.8721, lng: 100.2299, city: '丽江', loc: '云南·丽江' },
      14: { lat: 29.3999, lng: 110.4790, city: '张家界', loc: '湖南·张家界' },
      15: { lat: 25.2736, lng: 110.2900, city: '桂林', loc: '广西·桂林' },
      16: { lat: 34.3416, lng: 108.9398, city: '西安', loc: '陕西·西安' },
      17: { lat: 22.0090, lng: 100.7990, city: '景洪', loc: '云南·西双版纳' },
      18: { lat: 30.6242, lng: 120.4763, city: '乌镇', loc: '浙江·乌镇' },
      19: { lat: 39.9163, lng: 116.3972, city: '北京', loc: '北京·故宫' },
    };

    const update = db.prepare(
      'UPDATE tours SET latitude = ?, longitude = ?, city = ?, location_name = ? WHERE id = ?'
    );
    for (const [id, loc] of Object.entries(locations)) {
      update.run(loc.lat, loc.lng, loc.city, loc.loc, parseInt(id));
    }

    console.log('✅ 地理位置数据迁移完成');
  }
}

module.exports = { migrateLocation };
