/**
 * AI 客服模块 - 接入 DeepSeek API
 * 
 * 使用方式：
 *   1. 申请 DeepSeek API Key: https://platform.deepseek.com/
 *   2. 在项目根目录创建 .env 文件: DEEPSEEK_API_KEY=sk-xxxxx
 *   3. 或在环境变量中设置 DEEPSEEK_API_KEY
 */

const https = require('https');

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'api.deepseek.com';
const DEEPSEEK_API_PATH = '/v1/chat/completions';
const MODEL = 'deepseek-chat'; // 或 deepseek-reasoner

// 系统提示词 — 定义 AI 客服的角色
function buildSystemPrompt(faqContext) {
  return `你是一个专业的旅游客服助手，名叫"小智"，来自"智慧旅游在线服务平台"。

## 你的角色
- 你是专业的旅游顾问，热情、耐心、专业
- 回答要简洁明了，重点突出
- 对于不确定的信息，坦诚告知并提供官方联系方式

## 你可以回答的问题
- 旅游线路咨询（国内/国外景点推荐）
- 签证办理相关问题（泰国落地签、日本签证、申根签证等）
- 预订流程和订单查询
- 旅游攻略和最佳季节
- 护照办理、旅游保险等出行准备
- 价格、优惠活动信息

## 公司信息
- 客服热线：400-888-9999
- 服务时间：周一至周日 9:00-21:00
- 官网：智慧旅游在线服务平台

## 参考信息（以下是我们的FAQ知识库，请优先使用这些信息回答）
${faqContext}

## 回答规则
1. 优先使用FAQ知识库中的信息回答
2. 如果用户问的问题不在FAQ中，利用你的知识回答，但要注明"建议拨打 400-888-9999 确认最新信息"
3. 所有回答使用用户提问的语言（中文/英文）
4. 回答要友好热情，适当使用emoji
5. 复杂问题分点列出，清晰易懂`;
}

/**
 * 调用 DeepSeek API
 * @param {string} apiKey - DeepSeek API Key
 * @param {Array} messages - 消息历史
 * @returns {Promise<string>} AI 回复文本
 */
function callDeepSeek(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    });

    const options = {
      hostname: DEEPSEEK_API_URL,
      path: DEEPSEEK_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else if (json.error) {
            reject(new Error(`API错误: ${json.error.message}`));
          } else {
            reject(new Error('API返回格式异常'));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`请求失败: ${e.message}`)));
    req.write(data);
    req.end();
  });
}

/**
 * 从环境变量获取 API Key
 * 优先级: 环境变量 > 配置文件
 */
function getApiKey() {
  // 尝试从环境变量获取
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }
  // 尝试从 package.json 或配置文件读取
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DEEPSEEK_API_KEY\s*=\s*['"]?(sk-[^\s'"]+)['"]?/);
      if (match) return match[1];
    }
  } catch (e) {}
  return null;
}

/**
 * 构建FAQ上下文文本
 */
function buildFaqContext(db) {
  const faqs = db.prepare('SELECT question, answer FROM knowledge_base ORDER BY sort_order').all();
  return faqs.map((f, i) => 
    `${i + 1}. Q: ${f.question}\n   A: ${f.answer.replace(/<[^>]+>/g, '')}`
  ).join('\n\n');
}

module.exports = { callDeepSeek, getApiKey, buildFaqContext, buildSystemPrompt };
