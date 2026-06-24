/**
 * Migration: Add English titles, descriptions, and type labels for new tours (#20-#40)
 */
const { getDb } = require('./init');

function migrateEnNewTours() {
  const db = getDb();

  const tourEn = {
    20: { title_en: 'Ningxia · Shapotou Desert & Western Xia 5-Day Tour', desc_en: 'Explore the desert paradise of Ningxia! Sand sliding at Shapotou.', type_en: 'Domestic Long' },
    21: { title_en: 'Kunming · Stone Forest & Dianchi Lake 5-Day Tour', desc_en: 'Spring City! Spectacular Stone Forest, seagulls at Dianchi Lake.', type_en: 'Domestic Long' },
    22: { title_en: 'Fuxian Lake · Crystal Clear Waters 3-Day Tour', desc_en: 'Peaceful getaway at China deepest freshwater lake.', type_en: 'Domestic Short' },
    23: { title_en: 'Chengdu · Pandas & Dujiangyan 4-Day Tour', desc_en: 'Home of Giant Pandas! Panda Base, Dujiangyan irrigation.', type_en: 'Domestic Short' },
    24: { title_en: 'Chongqing · Hongyadong & Hotpot 4-Day Tour', desc_en: '8D mountain city! Hongyadong night view, spicy hotpot.', type_en: 'Domestic Short' },
    25: { title_en: 'Xiamen · Gulangyu Island 4-Day Tour', desc_en: 'Garden by the Sea! Gulangyu colonial architecture.', type_en: 'Domestic Short' },
    26: { title_en: 'Hangzhou · West Lake & Lingyin Temple 3-Day Tour', desc_en: 'Paradise on Earth! Cruise West Lake, Longjing tea.', type_en: 'Domestic Short' },
    27: { title_en: 'Suzhou · Gardens & Zhouzhuang Water Town 3-Day Tour', desc_en: 'Classical gardens. Humble Administrator Garden.', type_en: 'Domestic Short' },
    28: { title_en: 'Qingdao · Laoshan & Beer Culture 4-Day Tour', desc_en: 'Red roofs blue sea! Laoshan, Tsingdao beer.', type_en: 'Domestic Short' },
    29: { title_en: 'Lhasa · Potala Palace Tibet 6-Day Tour', desc_en: 'Roof of the World! Sacred Potala Palace, Namtso Lake.', type_en: 'Domestic Long' },
    30: { title_en: 'Dunhuang · Mogao Caves Silk Road 5-Day Tour', desc_en: 'Pearl of the Silk Road! Mogao murals, Crescent Moon Spring.', type_en: 'Domestic Long' },
    31: { title_en: 'Harbin · Ice & Snow World 4-Day Tour', desc_en: 'Ice City! World largest ice sculpture park.', type_en: 'Domestic Short' },
    32: { title_en: 'Dali · Erhai Lake & Cangshan 5-Day Tour', desc_en: 'Wind, flowers, snow and moon! Cycle Erhai Lake.', type_en: 'Self-guided' },
    33: { title_en: 'Seoul · Gyeongbokgung & K-Culture 5-Day Tour', desc_en: 'Discover Seoul! Gyeongbokgung, Myeongdong, Korean BBQ.', type_en: 'International' },
    34: { title_en: 'Singapore · Merlion & Garden City 5-Day Tour', desc_en: 'Lion City! Merlion Park, Gardens by the Bay.', type_en: 'International' },
    35: { title_en: 'Phuket · Racha Island & Diving 6-Day Tour', desc_en: 'Pearl of the Andaman! Snorkel, Phi Phi Island.', type_en: 'International' },
    36: { title_en: 'Egypt · Pyramids & Nile River 10-Day Tour', desc_en: 'Ancient Egypt! Giza Pyramids, Sphinx, Nile cruise.', type_en: 'International' },
    37: { title_en: 'Australia · Sydney & Gold Coast 9-Day Tour', desc_en: 'Down under! Sydney Opera House, Great Barrier Reef.', type_en: 'International' },
    38: { title_en: 'New Zealand · South Island & Stars 10-Day Tour', desc_en: 'Pure NZ! Lake Tekapo stars, Queenstown, Hobbiton.', type_en: 'International' },
    39: { title_en: 'Nepal · Kathmandu & Himalayas 8-Day Tour', desc_en: 'Land of the Himalayas! Durbar Square, Pokhara.', type_en: 'Self-guided' },
    40: { title_en: 'Russia · Moscow & Red Square 8-Day Tour', desc_en: 'Discover Russia! Red Square, St. Basil, Kremlin.', type_en: 'International' }
  };

  const origTypes = {
    1:'International',2:'International',3:'Self-guided',4:'International',
    5:'International',6:'International',7:'Cruise',8:'International',
    9:'International',10:'Domestic Short',11:'Domestic Long',12:'Self-guided',
    13:'Self-guided',14:'Domestic Short',15:'Domestic Short',16:'Domestic Long',
    17:'Self-guided',18:'Domestic Short',19:'Domestic Short'
  };

  const update = db.prepare('UPDATE tours SET title_en = ?, description_en = ?, type_label_en = ? WHERE id = ?');
  let count = 0;
  for (const [id, data] of Object.entries(tourEn)) {
    const tour = db.prepare('SELECT id FROM tours WHERE id = ?').get(parseInt(id));
    if (tour) { update.run(data.title_en, data.desc_en, data.type_en, parseInt(id)); count++; }
  }
  console.log('  Updated ' + count + ' new tours English content');

  const updateType = db.prepare('UPDATE tours SET type_label_en = ? WHERE id = ?');
  let tCount = 0;
  for (const [id, type] of Object.entries(origTypes)) {
    updateType.run(type, parseInt(id)); tCount++;
  }
  console.log('  Updated ' + tCount + ' original tours type_label_en');
}

module.exports = { migrateEnNewTours };
