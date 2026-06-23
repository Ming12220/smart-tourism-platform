# 🌏 智慧旅游在线服务平台 (Smart Tourism Platform)

全栈旅游服务平台，支持中英双语切换、在线客服FAQ知识库、线路预订及后台管理。

---

## 📂 项目结构

```plaintext
smart-tourism-network-main/
├── css/                         # 全局样式
│   ├── style.css
│   └── swiper-bundle.min.css
├── img/                         # 图片资源（景点图、Logo等）
├── js/
│   └── swiper-bundle.min.js     # 轮播图组件
├── server/                      # 后端服务
│   ├── server.js                # Express 入口
│   ├── package.json
│   ├── database/
│   │   ├── init.js              # 数据库初始化 & 种子数据
│   │   ├── migrate_en.js        # 英文数据迁移（手动）
│   │   ├── migrate_en_auto.js   # 英文数据迁移（自动）
│   │   └── smart_tourism.db     # SQLite 数据库
│   ├── middlewares/
│   │   ├── auth.js              # 用户认证中间件
│   │   └── i18n.js              # 中英文国际化中间件
│   ├── routes/
│   │   ├── api.js               # RESTful API（搜索/FAQ/预订/评价等）
│   │   ├── auth.js              # 登录/注册路由
│   │   └── admin.js             # 后台管理路由（线路/订单/FAQ/用户等）
│   ├── locales/
│   │   ├── zh.json              # 中文翻译文件
│   │   └── en.json              # 英文翻译文件
│   └── views/                   # EJS 模板
│       ├── index.ejs            # 首页
│       ├── search.ejs           # 搜索页面
│       ├── kefu.ejs             # 客服中心（含FAQ聊天机器人）
│       ├── tour-detail.ejs      # 线路详情
│       ├── booking.ejs          # 预订页面
│       ├── booking-success.ejs  # 预订成功
│       ├── login.ejs            # 登录
│       ├── register.ejs         # 注册
│       ├── my-bookings.ejs      # 我的订单
│       ├── lyzx.ejs             # 旅游咨询
│       ├── lywd.ejs             # 旅游问答
│       ├── zmzg.ejs             # 最美中国
│       ├── gwjd.ejs             # 国外景点
│       ├── error.ejs            # 404 错误页
│       ├── admin/               # 后台管理模板
│       │   ├── dashboard.ejs    # 数据概览
│       │   ├── tours.ejs        # 线路管理
│       │   ├── tour-form.ejs    # 线路编辑
│       │   ├── bookings.ejs     # 订单管理
│       │   ├── questions.ejs    # 问答管理
│       │   ├── faq.ejs          # FAQ知识库
│       │   ├── contacts.ejs     # 留言管理
│       │   └── users.ejs        # 用户管理
│       └── partials/
│           ├── header.ejs       # 公共头部（导航+语言切换）
│           └── footer.ejs       # 公共底部
├── index.html                   # 静态首页（备用）
├── zmzg.html                    # 静态最美中国（备用）
├── gwjd.html                    # 静态国外景点（备用）
├── lyzx.html                    # 静态旅游咨询（备用）
├── lywd.html                    # 静态旅游问答（备用）
└── README.md
```

---

## 🛠️ 技术栈

| 层级     | 技术                                      |
| -------- | ----------------------------------------- |
| 前端     | HTML5, CSS3, JavaScript (ES6+), EJS 模板  |
| 后端     | Node.js, Express 4.x                      |
| 数据库   | SQLite (better-sqlite3)                   |
| 认证     | express-session + bcryptjs                |
| 国际化   | 自建 i18n 中间件（中英双语 JSON）         |
| 第三方   | Swiper.js（轮播）, Multer（图片上传）     |

---

## ⚙️ 快速开始

### 环境要求
- Node.js >= 18

### 本地运行

```sh
# 1. 进入后端目录
cd server

# 2. 安装依赖
npm install

# 3. 启动服务（自动初始化数据库 + 种子数据）
node server.js
```

访问 `http://localhost:3000`

### 默认账号

| 角色    | 用户名  | 密码      |
| ------- | ------- | --------- |
| 管理员  | admin   | admin123  |
| 测试用户 | testuser | 123456   |

---

## 🌐 功能特性

- **中英双语切换** — 页面右上角一键切换，所有文本、景点名称、分类自动适配
- **智能客服FAQ** — 知识库关键词匹配，支持泰国落地签、各国签证等常见问题自动回复
- **线路预订系统** — 日期/人数选择，实时计价，订单管理
- **全站搜索** — 支持中英文关键词搜索，结果页面独立展示
- **后台管理** — 线路CRUD、订单管理、FAQ知识库管理、用户管理

---

## 🔗 API 接口

| 方法   | 路径              | 说明                 |
| ------ | ----------------- | -------------------- |
| GET    | `/api/tours`      | 线路列表（支持筛选） |
| GET    | `/api/tours/:id`  | 线路详情             |
| GET    | `/api/search?q=`  | 全站搜索             |
| POST   | `/api/faq`        | 客服FAQ问答查询      |
| POST   | `/api/booking`    | 提交预订             |
| POST   | `/api/contact`    | 提交留言             |
| POST   | `/api/reviews`    | 提交评价             |
| GET    | `/api/categories` | 线路分类列表         |
