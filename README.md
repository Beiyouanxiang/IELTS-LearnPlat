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

当前 **v3**，主要表：

| 模块 | 表 |
|---|---|
| 词汇 | `words`（含 `word_forms` 词族形态）、`words_fts`（FTS5）、`word_lists`（含 `category` 分组）、`word_list_items`、`user_word_progress`（进度 / 星标 / 对错计数，错题本由此派生） |
| 听力 | `listening_materials`、`listening_segments`、`listening_attempts`、`listening_questions` |
| 写作 | `writing_prompts`、`model_essays`、`writing_essays` |
| 阅读 | `reading_passages`、`reading_questions`、`reading_attempts` |
| 规划 | `user_goals` |
| 通用 | `study_logs`（统一事件流）、`users`、`invite_codes`、`rate_limits`、`schema_version` |

SQLite 无 `ADD COLUMN IF NOT EXISTS`，迁移用 `ensureColumn()` 幂等补列（先 `PRAGMA table_info` 再 `ALTER TABLE`）。

v2 → v3 新增：`words.word_forms`（AWL 等词表以词族为单位，一个词根带多个派生形式）、`word_lists.category`（词库变多后按 基础/雅思核心/学术/话题 分组展示）。`word_forms` 同时进了 FTS 索引，所以搜 `analysing` 能命中 `analyse`。

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
    seed-content.js     写作题库/范文 + 阅读文章/题目 + 听力素材（幂等）
    import-ecdict.js    ECDICT 单表导入（build-wordlists.js 的简化前身）
    smoke-test.mjs      端到端冒烟测试（101 项）
  data/ecdict.csv        ECDICT 原始数据（63 MB，需自行下载，不入库/不提交）
web/src/
  components/          Layout / CommandPalette / AuthShell / ui.jsx(雷达·环形·柱图·Toast·抽屉) / icons.jsx
  lib/tts.js           Web Speech 发音
  pages/               工作台 / 词库 / 学习 / 测验 / 听力 / 听力题型 / 阅读 / 写作 / 写作编辑器 / 错题本 / 学习计划 / 设置
```

## 部署

见 `deploy/nginx-ielts.conf` 与 `server/ecosystem.config.cjs`（PM2，端口 3007）。

```bash
cd server
pm2 start ecosystem.config.cjs
pm2 save
```

## 已知限制

- **写作评分为启发式**：基于可测量的文本特征，封顶 8.0，无法判断论证深度与切题度；需要更准确可开 AI 深度点评。
- 听力不做语音识别：时间轴按文本长度比例估算，可后续接 faster-whisper 对齐真实时间戳。
- 口语模块未实现（计划中）。
- **词库以「认得」为目标，例句覆盖不均**：标准词表（NGSL/GSL/AWL/NAWL/BNC-COCA 等）本身只提供词形，例句与搭配只有话题词书里的 463 个原创词条才带；其余词条的例句留空，不编造。
- 释义来自 ECDICT，偏词典体例、不是为雅思语境写的；已剔除 `[计] [化] [医]` 之类专业义项，但仍可能有书面用法与实际考试场景不完全对齐之处。
- 商业词书（《雅思词汇真经》《雅思词汇胜经》等）受版权保护，**不得导入**；如需扩充，请另找 CC0/MIT/公有领域来源。
