# 雅思学习工作台（IELTS Workbench）

自托管的雅思备考工作台。当前版本覆盖 **词汇 + 听力 + 阅读 + 写作 + 学习规划**，带 AI 辅助与完整学习闭环。

> 口语模块暂未实现（规划中）；其余模块均可用。

## 功能一览

**词汇**
- 词库：**7,419 词、24 本词库、4 个分组**（基础高频 / 雅思核心 / 学术词表 / 话题词汇），全部来自可自由使用的开源词表，见下方[词库体系](#词库体系与数据来源)
- 检索：中文按**逐字切词** + 英文按词，FTS5 全文索引（搜「污染」能命中 contaminate / pollutant；搜 `analysing` 能命中 `analyse` —— 派生词形态也进了索引）
- 词条信息：中文释义、英式音标、词性、BNC 词频序号、难度、话题、同义替换、**词族形态**（AWL 等以词族为单位，一个词根带出全部派生形式，同根词一起记）
- 闪卡：SM-2 间隔重复，四档评分；**3D 翻转动画**、键盘操作（`空格` 翻面 / `1`-`4` 评分 / `S` 发音 / `←` `→` 切卡）
- 发音：Web Speech API 朗读（零成本），支持自动发音开关
- 测验：三种题型 —— **选择题**（词义双向）、**拼写题**（看中文拼英文）、**听音辨词**（听发音选拼写），带连击与结算页
- 错题本：按答错次数排名的「顽固词榜」，含错误率条形图
- 生词本：一键收藏，可按状态（未学 / 学习中 / 复习中 / 已掌握 / 生词本）筛选

**听力**
- 音频 + 文本自动切句，逐句精听
- **波形可视化**、变速播放（0.75x–1.3x）、单句循环
- 听写盲打 + 词级 LCS 对齐比对（绿对 / 红漏 / 黄多）
- 句中生词一键入词库
- **题型化练习**：从素材自动出题（听写填空 / 听音选词），8 题一组、答案卡跳转、逐题解析
  - 素材含音频 → 播放对应片段；无音频 → 自动降级为浏览器语音合成朗读（开箱即用）

**写作**（四维批改）
- 题库：**20 道原创题目**（Task 2 观点 / 讨论 / 问题解决 / 两问 / 利弊 + Task 1 线图 / 柱图 / 饼图 / 表格 / 流程图 / 地图 / 混合图），按 Task 与题型筛选
- 范文：4 篇 Band 8 范文，带逐句亮点批注
- 编辑器：计时（首次进入自动开始）、**每 20 秒自动存稿**、实时字数 / 段落 / 句数统计与目标进度条
- **本地四维评分引擎**（`services/essayAnalyzer.js`，零依赖、离线、可复现）：
  - 四个维度 —— **任务回应 TR / 连贯与衔接 CC / 词汇资源 LR / 语法多样与准确性 GRA**，各自给出 Band 与依据说明
  - 量化指标：字数、段落、平均句长与波动、词汇多样性（Guiraud 指数）、低频/学术词占比、衔接词密度、复合句占比、指代衔接、题目关键词覆盖率、高频重复词
  - 可定位的错误探针：a/an 误用、句首未大写、独立小写 i、重复词、逗号粘连、空格与标点、段落数不足、Task 1 缺 overview
  - 按优先级排序的提分建议；分数封顶 8.0（启发式无法判断论证深度与切题度）
- 可选 **AI 深度点评**（配置 LLM Key 后启用）：整体评语、四维详解、逐句改写、提分路径

**阅读**（题型训练）
- **5 篇原创 Academic Reading 文章**，共 40 题，段落带字母标号与中文导读
- 题型：**判断题 TFNG / 选择题 / 段落信息匹配 / 摘要填空**
- 双栏练习界面，点击段落聚焦、悬停题号联动高亮；文中生词划选即可加入词库
- 提交后逐题解析 + 原文定位，按正确率换算 Band（题量少时用线性映射更稳）
- 支持自建文章（`POST /api/reading/passages`）
- 统计：各题型正确率、薄弱话题、60 天趋势

**学习规划与能力报告**
- 目标设置：考试日期、目标分数、每日词量 / 听力 / 阅读 / 写作任务量
- 今日任务卡：自动生成的每日清单 + 完成进度
- **四维能力雷达**（词汇 / 听力 / 阅读 / 写作，各含 0-100 数值与估算 Band）
- **预测分数**：按各模块练习证据加权，证据不足时明确显示「数据不足」而非给假分数
- 诊断与建议：按优先级给出最该补的短板（基础数据不足 / 最弱环节 / 词汇覆盖率 / 写作维度缺口 / 未设考试日期）
- 内容库规模、30 天学习量柱状图、连续打卡

**学习闭环与体验**
- 所有模块写入统一的 `study_logs` 事件流，驱动打卡、热力图、雷达与计划
- 工作台：今日目标环形进度、待复习、已掌握、连续打卡、30 天柱状趋势、学习热力图、**成就徽章墙**
- 全局命令面板（`Ctrl/Cmd + K`）：搜单词、跳页面、执行操作
- **深色 / 浅色双主题**（Canvas 级极光背景、玻璃拟态卡片），选择持久化
- 移动端自适应

## 词库体系与数据来源

**只使用许可明确、可自由分发的词表**。商业词书（如《雅思词汇真经》《雅思词汇胜经》等）有版权，一律不导入。

| 分组 | 词库 | 词数 | 来源 / 许可 |
|---|---|---|---|
| 基础高频 | NGSL 最高频 / 次高频 / 补充 | 1000 / 1000 / 801 | New General Service List（Browne, Culligan & Phillips） |
| 基础高频 | GSL 通用服务词表 | 2284 | Michael West, *A General Service List of English Words* (1953)，公有领域 |
| 基础高频 | BNC/COCA 最高频 2000 词 | 2000 | BNC + COCA 语料库综合频段 |
| 基础高频 | 雅思基础高频词 / 雅思基础词（含例句） | 121 / 67 | 本项目原创筛选 |
| **雅思核心** | **雅思核心词汇** | **5040** | ECDICT 中带 `ielts` 考纲标签的词条 · **MIT** |
| 学术词表 | AWL 高频学术词 1–3 子表 / 全表 | 180 / 570 词族 | Averil Coxhead, *A New Academic Word List* (2000) |
| 学术词表 | NAWL 新学术词表 | 963 | New Academic Word List |
| 学术词表 | AKL 学术关键词表 | 871 | Academic Keyword List（源表 969 条，按词性分列去重后 871） |
| 学术词表 | 雅思核心学术词 | 186 | 本项目原创筛选 |
| 话题词汇 | 环境 / 教育 / 科技 / 社会 / 健康 / 经济 / 政府 / 城市 / 媒体 / 文化 / 工作 | 共 463 | 本项目原创整理（含同义替换） |

合计 **7,419 个词条 / 24 本词库**。

**许可说明**：除 ECDICT（MIT）与本项目原创内容外，全部标准词表的机器可读文件取自 [`lpmi-13/machine_readable_wordlists`](https://github.com/lpmi-13/machine_readable_wordlists)，授权为 **CC0 1.0 Universal**（见 `scripts/data/wordlists/LICENSE-CC0.txt`）。词表本身各有学术出处，已在表中逐一标注。**商业词书（《雅思词汇真经》等）受版权保护，一律不导入。**

### 构建流程

```bash
cd server
# 1) 下载 ECDICT（MIT，约 63 MB / 77 万行）到 server/data/ecdict.csv
curl -L -o data/ecdict.csv \
  https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv

# 2) 一键重建：基础词 + 话题词书 + 全部标准词表（含 ECDICT 富化）
npm run seed:full        # = seed:vocab + seed-wordbooks + build:wordlists
```

`scripts/data/wordlists/*.json` 已随仓库提供（CC0/MIT），无需联网下载。

`build-wordlists.js` 做的事情：

1. 扫描 `data/ecdict.csv`，取两类词 —— ① **带 `ielts` 标签**的全部词条（→ 雅思核心词汇 5040），② 各标准词表里的词。
2. 富化：中文释义 / 音标 / 词性 / BNC 词频 / Collins 星级 / 词族形态。
3. 落库：按 `lemma` upsert，最后重建 FTS 索引。

> ECDICT 的 `translation` 一列用**字面量 `\n`**（两个字符）分隔多义项；专业义项带 `[计] [化] [医]` 之类的领域标记，对雅思考生是噪音，构建时会剔除。`pos` 列大多为空，词性实际藏在释义前缀里（`"n. 分析"`），所以脚本会从释义反推词性 —— 覆盖率从 9.8% 提到 **99.5%**。

## 技术栈

- 后端：Node.js + Express + better-sqlite3（WAL + 外键）+ JWT
- 前端：React 18 + Vite + React Router（**零图表/UI 依赖，图表与动画全部手写 SVG + CSS**）
- AI：DeepSeek / 智谱 GLM / Kimi，OpenAI 兼容协议，可在设置页切换；**全部功能在未配置 Key 时也可用**

## 本地运行

```bash
# 1. 后端
cd server
cp .env.example .env          # 填写 JWT_SECRET；LLM Key 可选
npm install

# 词库数据源（约 63 MB，不计入仓库）。不下载也能跑，只是词汇量只剩精选的 188 词
mkdir -p data && curl -L -o data/ecdict.csv \
  https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv

npm run seed:full             # 基础词 + 13 本话题词书 + 全部标准词表（7,419 词 / 24 词库）
npm run seed:content          # 写作题库/范文 + 阅读文章/题目 + 内置听力素材
npm run dev                   # http://127.0.0.1:3007

# 2. 前端（另开一个终端；也可直接 npm run build 走 3007 的静态托管）
cd web
npm install
npm run dev                   # http://localhost:5180（/api 已代理到 3007）
```

`seed:full` 与 `seed:content` 都是**幂等**的，可重复执行：题目按标题 upsert、词条按 `lemma` upsert，重跑只补齐/更新字段，不会重复插入。

首个注册的用户自动成为 **owner**，无需邀请码，注册后会得到一个初始邀请码用于邀请朋友。

## 验证

```bash
cd server
node scripts/smoke-test.mjs   # 101 项端到端断言
```

覆盖：鉴权 / 检索 / SRS / 三种题型 / 错题本 / 统计 / 听力精听 / **写作四维批改** / **阅读题型训练** / **听力题型化练习** / **学习计划与能力报告** / 前端路由回退。

默认使用测试账号 `smoketest / smoke12345`（成员角色，数据与真实用户隔离）。
若该账号不存在，先用一个邀请码注册：

```bash
SMOKE_INVITE=<邀请码> node scripts/smoke-test.mjs
```

## 数据库

Schema 为**版本化迁移**（`schema_version` 表 + `CURRENT_SCHEMA_VERSION`），启动时自动升级，老数据不丢。

当前 **v4**，主要表：

| 模块 | 表 |
|---|---|
| 词汇 | `words`（含 `word_forms` 词族形态）、`words_fts`（FTS5）、`word_lists`（含 `category` 分组）、`word_list_items`、`user_word_progress`（进度 / 星标 / 对错计数，错题本由此派生） |
| 听力 | `listening_materials`、`listening_segments`、`listening_attempts`、`listening_questions` |
| 写作 | `writing_prompts`、`model_essays`、`writing_essays` |
| 阅读 | `reading_passages`、`reading_questions`、`reading_attempts` |
| 规划 | `user_goals` |
| 通用 | `study_logs`（统一事件流）、`users`、`invite_codes`、`rate_limits`、`schema_version` |

SQLite 无 `ADD COLUMN IF NOT EXISTS`，迁移用 `ensureColumn()` 幂等补列（先 `PRAGMA table_info` 再 `ALTER TABLE`）。

迁移历史：

- **v2**：写作 / 阅读 / 听力题型 / 学习目标；补 `reading_questions.answer_alt`
- **v3**：`words.word_forms`（AWL 等词表以词族为单位，一个词根带多个派生形式）、`word_lists.category`（按 基础 / 雅思核心 / 学术 / 话题 分组）。`word_forms` 同时进了 FTS 索引，所以搜 `analysing` 能命中 `analyse`
- **v4**：`listening_materials.owner_id` 由 `NOT NULL` 放宽为可空 —— 内置公共听力素材不该挂在某个账号下（与 `reading_passages` / `word_lists` 对齐）。否则全新空库（还没有任何用户）时根本 seed 不出听力素材，且清理用户数据会把它当"用户素材"级联删掉。SQLite 不能直接去掉 `NOT NULL`，这条迁移按官方 12 步法**重建表**（关外键 → 建新表 → 拷数据 → 换名 → 重建索引 → `foreign_key_check`），已在真库上验证数据零丢失且幂等

## API

| 前缀 | 说明 |
|---|---|
| `/api/auth` | 注册（邀请制）/ 登录 / 当前用户 |
| `/api/vocab` | 词库、检索、闪卡队列、评分、测验、错题、生词本、统计 |
| `/api/listening` | 素材、切句、精听比对、题型生成与作答、统计 |
| `/api/writing` | 题库、我的作文（增删改查 + 自动存稿）、批改、AI 点评、统计 |
| `/api/reading` | 文章列表/详情（**不下发答案**）、提交作答、历史、统计、自建文章 |
| `/api/plan` | 学习目标、总览（雷达 / 预测分 / 今日任务 / 建议）、目标更新 |
| `/api/info`、`/api/health` | 版本、功能开关、内容库规模、schema 版本 |

## 目录结构

```
server/
  src/
    db.js              SQLite schema + 版本化迁移（v3）
    auth.js            JWT（强 secret fail-fast）
    middleware/        限流
    services/
      srs.js           SM-2 间隔重复调度
      diff.js          听写词级对齐与评分
      fts.js           CJK 全文检索分词
      llm.js           LLM provider 抽象
      studyLog.js      统一学习事件写入（各模块共用）
      essayAnalyzer.js 写作四维启发式评分引擎
    routes/            auth / info / vocab / listening / writing / reading / plan
  scripts/
    build-wordlists.js  ★ 统一词库构建（ECDICT 富化 + 多标准词表挂载），产出 24 词库
    data/
      wordbooks.js      13 本话题/基础词书（原创，含同义替换）
      wordlists/        AWL / NAWL / AKL / GSL / NGSL / BNC-COCA（CC0 1.0 JSON）
    seed-vocab.js       67 个带例句的精选基础词
    seed-wordbooks.js   话题词书入库（scripts/data/wordbooks.js）
    seed-content.js     写作题库/范文 + 阅读文章/题目 + 听力素材（幂等，内置内容 owner_id 为 NULL）
    reset-user-data.js  清空用户数据、保留内容库（带 --yes 保护，移植开发库到生产时用）
    import-ecdict.js    ECDICT 单表导入（build-wordlists.js 的简化前身）
    smoke-test.mjs      端到端冒烟测试（101 项，npm test）
  data/ecdict.csv        ECDICT 原始数据（63 MB，需自行下载，不入库/不提交）
web/src/
  components/          Layout / CommandPalette / AuthShell / ui.jsx(雷达·环形·柱图·Toast·抽屉) / icons.jsx
  lib/tts.js           Web Speech 发音
  pages/               工作台 / 词库 / 学习 / 测验 / 听力 / 听力题型 / 阅读 / 写作 / 写作编辑器 / 错题本 / 学习计划 / 设置
```

## 部署

**当前线上地址**

| 入口 | 状态 |
|---|---|
| `http://120.25.150.103/ielts/` | ✅ 已上线（子路径过渡入口，纯 IP 访问不受备案限制） |
| `https://ielts.transistorsandtokens.com` | ⏳ 待 DNS：需在阿里云云解析加一条 A 记录 `ielts` → `120.25.150.103`，然后 `certbot --nginx -d ielts.transistorsandtokens.com` |

服务器：阿里云 ECS（Ubuntu 24.04，`120.25.150.103`），代码在 `/data/data_home/xuyifan/IELTS-LearnPlat`，
PM2 应用名 `ielts-workbench`（fork 模式，`127.0.0.1:3007`，已配开机自启）。

架构：Node 只监听回环 `127.0.0.1:3007`，公网入口交给 Nginx；PM2 以 **fork** 模式跑（SQLite/WAL 是单写者模型，不要用 cluster）。

```bash
# ---- 服务器一次性初始化 ----
cd /data/data_home/xuyifan
git clone git@github.com:Beiyouanxiang/IELTS-LearnPlat.git
cd IELTS-LearnPlat/server
cp .env.example .env               # 必须改 JWT_SECRET：openssl rand -hex 32
mkdir -p data logs uploads && chmod 700 data

(cd ../server && npm install --omit=dev)
(cd ../web    && npm install && ./node_modules/.bin/vite build)

# 内容库二选一：
#  A. 服务器上从零构建（需先下载 63 MB 的 ECDICT 到 server/data/ecdict.csv）
npm run seed:content && npm run seed:full
#  B. 从开发机搬一个已经建好的库（更快，且不用在服务器上跑构建）
#     开发机: VACUUM INTO 导出快照 -> npm run seed:content -> npm run reset:userdata --yes -> scp
#     服务器: 放到 server/data/ielts.db，chmod 600

pm2 start ecosystem.config.cjs
pm2 save

# ---- 之后每次更新 ----
cd /data/data_home/xuyifan/IELTS-LearnPlat
git fetch origin main --prune && git reset --hard origin/main
(cd server && npm install --omit=dev)
(cd web    && npm install && ./node_modules/.bin/vite build)
cd server && pm2 reload ecosystem.config.cjs    # 必须在 server/ 下执行
curl -s http://127.0.0.1:3007/api/info
```

> **PM2 的坑**：`pm2 reload` 必须在 `server/` 目录下执行，否则报 `File ecosystem.config.cjs not found` 但**不会让脚本失败**（服务没重启却以为成功了）。想按名字操作更稳：`pm2 reload ielts-workbench`。
> **改服务端代码（含 schema 迁移）要 `restart` 而不是 `reload`**：`JWT_SECRET` 等 `process.env` 在启动时锁定，迁移也只在 `initDb()` 首次执行；`reload` 会沿用老 worker 的环境。

Nginx：见 `deploy/nginx-ielts.conf`。文件里默认监听 8080（独立端口最省事）；如果域名可用，推荐按已有站点的惯例挂独立子域 + certbot：

```bash
sudo cp /etc/nginx/sites-available/tt-web-tools /etc/nginx/sites-available/tt-web-tools.bak.$(date +%Y%m%d-%H%M%S)
# 新增一个 server_name ielts.transistorsandtokens.com 的 443 块，proxy_pass http://127.0.0.1:3007
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ielts.transistorsandtokens.com
```

**注意 `add_header` 不继承**：只要在 `location` 里写了任何一个 `add_header`，`server` 级的安全头对该 location 全部失效。location 内只放业务指令。

### 公网入口的硬约束（阿里云 + 备案）

实测结论，别再走弯路：

- **阿里云会按 Host / SNI 拦截未备案域名**，返回 `403` + `Server: Beaver` + 页面标题 `Non-compliance ICP Filing`。这不是 nginx 或应用的错。
- 因此 `*.sslip.io`（公共泛解析、无需配 DNS 的临时域名方案）**在这台机器上完全不可用** —— 实测 `ielts.120.25.150.103.sslip.io`、`bookmarks.120.25.150.103.sslip.io` 全是 403。
- **只有已备案的 `*.transistorsandtokens.com` 能过**（`exam199.` / `bookmarks.` 实测 200）。
- 纯 IP 访问（`Host` 是 IP）不受备案拦截影响。

所以正式入口只能是 `ielts.transistorsandtokens.com`：在阿里云「云解析」加一条 A 记录
`ielts` → `120.25.150.103`，然后 `certbot --nginx -d ielts.transistorsandtokens.com`。
父域名已备案，子域不需要单独备案。

### 子路径部署（解析未就绪时的过渡方案）

在 DNS 记录加好之前，可以先挂在 `http://120.25.150.103/ielts/`（纯 IP 访问不受备案限制）。
前端已经支持子路径，**只需换一个构建参数**：

```bash
cd web
VITE_BASE=/ielts/ npm run build       # Windows/git-bash 下要加 MSYS_NO_PATHCONV=1，否则 /ielts/ 会被当成路径转换
```

配套的 nginx 片段（加在 `/etc/nginx/sites-available/bookmark` 里，与已有的 `/ocr/`、`/pin/` 同款）：

```nginx
location = /ielts { return 308 /ielts/; }   # 保证相对路径的解析基准是 /ielts/
location /ielts/ {
    proxy_pass http://127.0.0.1:3007/;      # 末尾的 / 会剥掉 /ielts/ 前缀
    client_max_body_size 60m;
}
```

原理：`vite` 的 `base` 会同时改写资源引用（`/ielts/assets/...`）、
`import.meta.env.BASE_URL`（`api.js` 用它拼出 `/ielts/api`）和 `<BrowserRouter>` 的 `basename`。
切回独立子域时，用默认 base 重新构建、并删掉上面这段 location 即可。

## 已知限制

- **写作评分为启发式**：基于可测量的文本特征，封顶 8.0，无法判断论证深度与切题度；需要更准确可开 AI 深度点评。
- 听力不做语音识别：时间轴按文本长度比例估算，可后续接 faster-whisper 对齐真实时间戳。
- 口语模块未实现（计划中）。
- **词库以「认得」为目标，例句覆盖不均**：标准词表（NGSL/GSL/AWL/NAWL/BNC-COCA 等）本身只提供词形，例句与搭配只有话题词书里的 463 个原创词条才带；其余词条的例句留空，不编造。
- 释义来自 ECDICT，偏词典体例、不是为雅思语境写的；已剔除 `[计] [化] [医]` 之类专业义项，但仍可能有书面用法与实际考试场景不完全对齐之处。
- 商业词书（《雅思词汇真经》《雅思词汇胜经》等）受版权保护，**不得导入**；如需扩充，请另找 CC0/MIT/公有领域来源。
