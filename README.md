# 🌏 智慧旅游在线服务平台 (Smart Tourism Platform)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](...)  
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](...)  
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](...)  
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**项目简介**：这是一个基于 HTML5、CSS3 和 JavaScript 开发的响应式旅游资讯与预订展示平台。项目旨在为用户提供全面的国内外景点介绍、热门旅游线路推荐、旅游问答社区及便捷的在线咨询服务，致力于打造“让旅游更简单”的一站式服务体验。

---
## 📑 目录
- [项目演示](#-项目演示)
- [技术栈](#-技术栈)
- [功能模块](#-功能模块)
- [项目模块](#-项目模块)
- [快速开始](#-快速开始)
- [核心亮点](#-核心亮点)
- [作者信息](#-作者信息)

---
## 📸 项目演示
![Smart-Tourism-Platform](/img/Smart-Tourism-Platform.gif)

---
## 🛠️ 技术栈

本项目采用原生前端技术构建，保证了页面的轻量级与高性能加载：
- **结构层**：HTML5 (语义化标签)
- **样式层**：CSS3 (Flex布局, 动画特效, 响应式设计)
- **交互层**：JavaScript (ES6+)
- **第三方库**：
	- **Swiper 6.1.2**：用于实现首页动态图片轮播与触摸滑动效果。
	- **Dom7**：轻量级 DOM 操作库（Swiper 依赖）。

---
## 🚀 功能模块
本项目包含以下核心页面与功能：

| 页面名称             | 功能描述                                    |
| ---------------- | --------------------------------------- |
| **首页(Index)**        | 包含全屏轮播图、热门旅游线路推荐（国内/出境/自助）、搜索功能及合作伙伴展示。 |
| **旅游咨询(Consulting)** | 展示公司简介、服务优势及详细的联系方式（地址、电话、传真）。          |
| **最美中国 (China)**     | 专注于国内旅游景点的图文展示，支持限时特价筛选与线路详情查看。         |
| **国外景点 (Abroad)**    | 汇集全球热门旅游目的地（如曼谷、马尔代夫等），提供图片画廊与线路推荐。     |
| **旅游问答 (Q&A)**       | 社区互动板块，展示精选问答、最新问题及用户评论，解决出行疑虑。         |

---
## 📂 项目结构
```plaintext
├── css/ 
│ ├── style.css # 全局样式文件 
│ └── swiper-bundle.min.css # 轮播图组件样式 
├── img/ # 图片资源目录 (Logo, 景点图, 图标等) 
├── js/ 
│ └── swiper-bundle.min.js # 轮播图交互逻辑 
├── index.html # 首页入口 
├── lyzx.html # 旅游咨询页面 
├── zmzg.html # 最美中国页面 
├── gwjd.html # 国外景点页面 
├── lywd.html # 旅游问答页面 
└── README.md # 项目说明文档
```

---
## ⚙️ 快速开始
### 环境要求
- 一款现代浏览器（Chrome / Edge / Firefox / Safari 最新版）
- （可选）本地静态服务器工具（如 `live-server`、`http-server`）
### 本地运行
#### 1.克隆仓库
```sh
git clone https://gitee.com/i_exiler/smart-tourism-network.git
```
#### 2直接打开
在文件管理器中双击 `index.html` 即可在浏览器中预览。
#### 3.（推荐）启动开发服务器
```sh
# 如使用 Node.js 的 http-server
npx http-server . -p 8080
# 或 Python 3
python -m http.server 8080
```
访问 `http://localhost:8080` 查看效果。
>⚠️ 注意：图片轮播依赖外联的 Swiper 库，请确保 `css/swiper-bundle.min.css` 和 `js/swiper-bundle.min.js` 路径正确。

---
## ✨ 核心亮点
- **响应式布局**：适配不同分辨率的屏幕，确保在桌面端和移动端均有良好的视觉体验。
- **交互体验**：利用 Swiper.js 实现了流畅的触摸滑动轮播，增强了用户的视觉吸引力。
- **模块化开发**：CSS 样式与 HTML 结构分离，代码结构清晰，易于维护和二次开发。
- **细节打磨**：包含天气查询、火车票查询等“旅游百宝箱”实用工具入口，提升用户体验。

---
## 📄 许可证
本项目基于 MIT 许可证开源。

---
## 📧 联系方式
- **开发者**：[XinJingbo]
- **邮箱**：[xjingbiu@qq.com]
- **构建时间**：2026年4月