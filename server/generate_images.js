// Generate simple gradient placeholder images for scenic spots
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const IMG_DIR = path.join(__dirname, '..', 'img');

const spots = [
  { file: 's1.jpg', name: '黄山', colors: ['#2c3e50', '#3498db'] },
  { file: 's2.jpg', name: '九寨沟', colors: ['#1a6b3c', '#4fc3a1'] },
  { file: 's3.jpg', name: '乌镇', colors: ['#37474f', '#78909c'] },
  { file: 's4.jpg', name: '张家界', colors: ['#2e7d32', '#81c784'] },
  { file: 's5.jpg', name: '桂林', colors: ['#1565c0', '#64b5f6'] },
  { file: 's6.jpg', name: '丽江', colors: ['#6a1b9a', '#ce93d8'] },
  { file: 's7.jpg', name: '西双版纳', colors: ['#e65100', '#ff9800'] },
  { file: 's8.jpg', name: '西安', colors: ['#bf360c', '#ff7043'] },
  { file: 'tour1.jpg', name: '曼谷', colors: ['#c62828', '#ef5350'] },
  { file: 'tour2.jpg', name: '马尔代夫', colors: ['#006064', '#4dd0e1'] },
  { file: 'tour3.jpg', name: '海南', colors: ['#1a6b3c', '#66bb6a'] },
  { file: 'tour4.jpg', name: '日本', colors: ['#e91e63', '#f48fb1'] },
  { file: 'tour5.jpg', name: '欧洲', colors: ['#283593', '#7986cb'] },
  { file: 'tour6.jpg', name: '巴厘岛', colors: ['#e65100', '#ffb74d'] },
  { file: 'tour7.jpg', name: '迪拜', colors: ['#4e342e', '#a1887f'] },
  { file: 'tour8.jpg', name: '土耳其', colors: ['#b71c1c', '#e57373'] },
  { file: 'tour9.jpg', name: '大阪', colors: ['#4a148c', '#ab47bc'] },
  { file: 'search.jpg', name: '智慧旅游', colors: ['#1a237e', '#42a5f5'] },
  { file: 'headline.jpg', name: '精彩旅程', colors: ['#004d40', '#26a69a'] },
  { file: 'login_bg.jpg', name: '欢迎登录', colors: ['#1a237e', '#7c4dff'] },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function createGradientPNG(width, height, color1, color2, label) {
  // Create raw pixel data (RGB, no alpha)
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const channels = 3;
  const rowSize = width * channels + 1; // +1 for filter byte
  const rawData = Buffer.alloc(rowSize * height, 0);
  
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize + 1; // +1 skip filter byte
    const ratio = y / (height - 1);
    
    for (let x = 0; x < width; x++) {
      const xRatio = x / (width - 1);
      // Diagonal gradient
      const t = (ratio + xRatio) / 2;
      
      rawData[offset + x * channels] = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
      rawData[offset + x * channels + 1] = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
      rawData[offset + x * channels + 2] = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
    }
  }
  
  return rawData;
}

function createPNG(width, height, rawData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (compressed image data)
  const deflated = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', deflated);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate images
let count = 0;
for (const spot of spots) {
  const filepath = path.join(IMG_DIR, spot.file);
  if (!fs.existsSync(filepath)) {
    console.log(`Creating ${spot.file}...`);
    const rawData = createGradientPNG(800, 600, spot.colors[0], spot.colors[1], spot.name);
    const pngData = createPNG(800, 600, rawData);
    fs.writeFileSync(filepath, pngData);
    count++;
  }
}

console.log(`Generated ${count} new images. Total ${spots.length} images checked.`);
