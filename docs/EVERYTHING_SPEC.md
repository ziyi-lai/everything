# Everything — 个人全维度管理系统

> **版本**: v2.0（对标最佳产品后修订）  
> **定位**: 个人操作系统 —— 捕获、组织、分析生活的每一个维度  
> **设计**: nothing-design-skill (https://github.com/dominikmartn/nothing-design-skill)  
> **AI 层**: Hermes API (localhost:8642)  
> **平台策略**: Web-first (Next.js PWA) → API 预留移动端

---

## 〇、对标产品 & 借鉴清单

每个域的设计都不是凭空想象——下面是我研究后确定要"偷"的核心设计。

| 域 | 对标产品 | 借鉴什么 |
|---|---|---|
| **Capture** | **Drafts** | 打开即空白页，零摩擦。不问你任何问题，先写再说。Inbox 后续处理。 |
| | **Todoist** | 自然语言解析（NLP）。输入 `#tag @project tomorrow 3pm` 自动识别。 |
| | **Toggl Track** | 一键计时器，"What are you working on?" 输入框。时间块日历视图。 |
| **Tasks** | **Linear** | 键盘优先（Cmd+K 万能命令）。Triage→Backlog→InProgress 流程。极速 UI。 |
| | **Things 3** | "Today" 视图是核心。把今天该做的放在一眼能看到的地方。 |
| **Finance** | **YNAB** | "Every dollar has a job" 方法论。零基预算，不是记账——是主动管理钱。 |
| | **Monarch** | 净值追踪、目标储蓄、干净仪表盘。 |
| **Health** | **Whoop** | Strain/Recovery/Sleep 三位一体。教练层（"今晚10:30前睡可达到绿色恢复"）。 |
| | **Apple Health** | Trends（趋势）+ Highlights（变化点）+ Favorites 仪表盘。 |
| **Knowledge** | **Obsidian** | 双向链接 + 本地图谱。Daily Notes 作为默认入口。Markdown 无锁定。 |
| | **Readwise** | 间隔重复回顾。每日推送 N 条高亮/笔记。Frequency Tuning。 |

---

## 一、产品哲学

**Everything 不是一个"工具集合"——它是一套操作系统。**

5 个域交叉产生洞察：
- 睡眠不足 → 任务完成率下降（Health × Tasks）
- 外卖支出激增 → 体重上升（Finance × Health）
- 阅读某主题后 → 相关任务产出增加（Knowledge × Tasks）

**核心原则**：
- **零摩擦捕获** —— Drafts 哲学：打开就写，不先分类。后续再处理。
- **主动管理，非被动记录** —— YNAB + Whoop 哲学：不给数据打工，让数据给你建议。
- **视觉化优先** —— 数据必须变成可感知的图表/趋势/告警。
- **AI 驱动洞察** —— 不只"发生了什么"，更要"为什么"和"怎么办"。
- **极简 UI** —— Nothing OS 设计语言，黑白红，无视觉噪音。

---

## 二、域规格

---

### 域 1: Capture（快速捕获）→ 对标 Drafts + Todoist + Toggl Track

**解决的问题**: "时常忘记记录重要的想法、时间（几点在干什么）"

#### 核心设计哲学（从对标产品偷来的）

> **Drafts 模式**: 打开 App → 立刻是空白输入框，光标已经在闪。不先问"这是什么类型？"。写完了，回车，消失。后台自动进 Inbox。**捕获和整理是两个阶段，绝不合并。**

> **Todoist NLP**: 输入框支持自然语言——写 `明天下午3点 跟David讨论项目 #work` → 自动解析为 due=明天15:00, tag=work。如果格式不明确则原样保存，由 AI 后续处理。

> **Toggl Track 模式**: 有一个独立的"计时器模式"。大按钮"开始记录"，下面一行"What are you working on?"。点击开始→计时器跑→做完点停止。时间块自动保存。

#### 功能范围

| 功能 | 优先级 | 对标 | 描述 |
|------|--------|------|------|
| **Capture Bar** | P0 | Drafts | 页面顶部固定。打开即空白输入框，光标闪烁。输入→回车→消失→进 Inbox。支持 `#tag` 语法。 |
| **NLP 解析** | P0 | Todoist | 自动识别日期（"明天3pm"）、标签（`#idea`）、项目（`@project`）。未识别部分保留原文。 |
| **Timer Mode** | P0 | Toggl Track | 一键开始/停止计时。记录"现在在干什么"。可选关联到已有任务。 |
| **Timeline View** | P0 | Toggl Track | 按天纵轴展示时间块，每个块用 pill 显示。可拖拽调整起止时间。 |
| **Inbox 处理** | P1 | Drafts | 所有捕获先进 Inbox。每日/每周 Review：逐条决定→转任务/归档/删除。 |
| **Voice Capture** | P2 | Todoist Ramble | 语音输入→Hermes 转录→自动进 Inbox。 |
| **AI 自动分类** | P2 | — | Hermes 分析内容→自动打标签+建议关联。 |

#### 数据模型

```sql
CREATE TYPE capture_source AS ENUM ('text', 'timer', 'voice', 'api');

CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  raw_text TEXT NOT NULL,              -- 用户原始输入（保留 NLP 解析前的原文）
  parsed_title TEXT,                   -- NLP 解析后的标题
  parsed_tags TEXT[] DEFAULT '{}',     -- NLP 解析的标签
  parsed_due TIMESTAMPTZ,             -- NLP 解析的日期
  is_timer BOOLEAN DEFAULT false,     -- 是否通过计时器创建
  start_time TIMESTAMPTZ,             -- 计时开始
  end_time TIMESTAMPTZ,               -- 计时结束
  duration_seconds INT,               -- 自动计算
  source capture_source DEFAULT 'text',
  processed BOOLEAN DEFAULT false,    -- 是否已从 Inbox 处理
  converted_to_task_id UUID,          -- 处理后可转任务（FK 见完整 schema，tasks 表创建后再 ALTER 加约束）
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### UX 规格

**Capture Bar（对标 Drafts）**:
- 位置：页面顶部固定，全宽
- 外观：无边框输入框，placeholder="写下任何东西…"
- 行为：
  - 聚焦即展开（可选：显示 NLP 预览——日期、标签实时高亮）
  - 回车 = 保存 + 清空 + 保持聚焦（连续捕获）
  - Shift+回车 = 换行
  - Esc = 清空
- NLP 预览：用户在输入时，输入框下方出现一行灰色小字
  - `明天下午3点 跟David讨论项目 #work` → preview: `📅 Jul 22, 3PM · 🏷 work`
  - 如果 NLP 没识别出日期/标签 → 不显示 preview，原样保存

**Timer Mode（对标 Toggl Track）**:
- 触发：侧边栏点击 ▶️ 图标或 Cmd+T
- 外观：大卡片居中
  - 计时器数字（00:00:00），DotGothic16
  - 下方一行输入："What are you working on?"
  - 下方可选：关联已有任务（搜索下拉）
- 行为：
  - 点击 Start → 计时器开始跑
  - 点击 Stop → 保存时间块，进 Timeline
  - 中途可修改描述

**Timeline View**:
- 纵轴 = 24小时时间线
- 每个时间块 = pill 形状，宽度=时长比例
- 空状态："No time entries yet. Start a timer or capture a thought above."

**Inbox（对标 Drafts Inbox）**:
- 侧边栏独立入口
- 列表展示未处理的 capture
- 每条 capture 可：→ 转任务 / → 归档 / → 删除
- 每日固定提醒（可配置时间）

---

### 域 2: Tasks（任务管理）→ 对标 Linear + Things 3

**解决的问题**: "记录和视觉化所有我必须要做的任务"

#### 核心设计哲学

> **Linear 模式**: 键盘优先。Cmd+K 打开命令面板，可以创建任务、切换视图、搜索。不用鼠标操作核心流程。工作流：Triage（新任务垃圾场）→ Backlog（确认要做）→ In Progress → Done。

> **Things 3 模式**: "Today" 是第一视图。登录后第一眼看到的是今天必须做的事。其他视图（Upcoming、Anytime、Someday）是辅助。

#### 功能范围

| 功能 | 优先级 | 对标 | 描述 |
|------|--------|------|------|
| **Cmd+K 命令面板** | P0 | Linear | 全局快捷键。可创建任务、搜索、跳转视图、切换域。 |
| **Today 视图** | P0 | Things 3 | Dashboard 默认视图。今天到期+高优任务。顶部大标题 "TODAY, JUL 21"。 |
| **多视图** | P0 | Linear | List / Board（Kanban）/ Calendar / Timeline。一键切换。 |
| **状态机** | P0 | Linear | Backlog → Todo → In Progress → Done。简化但有力量。 |
| **键盘导航** | P0 | Linear | 上下键选任务，回车打开，空格切换状态。不用鼠标。 |
| **子任务 + 进度条** | P1 | Linear | 任务可拆子任务。父任务显示完成进度条。 |
| **重复任务** | P1 | Todoist | 每天/每周/每月/自定义 cron。自然语言："every weekday"。 |
| **Cycles (Sprints)** | P2 | Linear | 可选的周期规划。本周/下周视图。 |
| **AI 分解** | P2 | — | 大任务 → Hermes 自动拆成 3-7 个子步骤。 |
| **精力评估** | P2 | Whoop | 估算所需精力 1-5。与 Health 域关联。 |

#### UX 规格

**Command Palette (Cmd+K)**:
- 外观：居中浮层，搜索框 + 结果列表
- 功能：
  - `> Create task "xxx"` → 快速创建
  - `> Go to /tasks` → 跳转
  - `> Search tasks: xxx` → 全文搜索
  - `> Toggle theme` → 切换主题

**Today 视图**:
```
TODAY, JULY 21                                         [List] [Board] [Cal]
────────────────────────────────────────────────────────────
● Call David re: project            #work       Due today
○ Review PR #42                     #coding     Due today  
○ Buy groceries                     #life       Due today
──
+ Add task...
```
- 未完成的任务：空心圆 ○
- 正在做的任务：实心黑圆 ●（带 pulse 动画）
- 完成的任务：打勾后下移到 "Completed" 折叠区

**Board 视图（Kanban）**:
- 3 列：Backlog | In Progress | Done
- 拖拽切换列
- 每列顶部显示数量

**Calendar 视图**:
- 月视图为主
- 有 due_date 的日期显示小灰点
- 点击日期 → 弹出当日任务列表

#### 数据模型

```sql
CREATE TYPE task_status AS ENUM (
  'backlog',       -- 新任务先到这里（Triage）
  'todo',          -- 确认要做，但还没开始
  'in_progress',   -- 正在做
  'done',          -- 完成
  'cancelled'      -- 取消
);
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_domain AS ENUM ('coding', 'research', 'writing', 'life', 'health', 'finance', 'other');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'medium',
  domain task_domain DEFAULT 'other',
  due_date DATE,
  estimated_minutes INT,
  energy_required INT CHECK(energy_required >= 1 AND energy_required <= 5),
  recurrence_rule TEXT,             -- RFC 5545 RRULE
  tags TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,         -- 手动排序
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

### 域 3: Finance（财务管理）→ 对标 YNAB + Monarch

**解决的问题**: "记录和分析我的财政"

#### 核心设计哲学

> **YNAB 方法论**: 记账不是目的——**主动管理钱**才是。YNAB 的 4 条规则改编：
> 1. **给每一块钱一个工作** → 收入进来立刻分配到各预算类别
> 2. **拥抱真实支出** → 非月度支出也要预留（年费、保险）
> 3. **见招拆招** → 超支了？从别的类别挪，不要有负罪感
> 4. **花上个月的钱** → 目标：活在上个月的收入里

> **Monarch 模式**: 净值追踪、目标储蓄进度条、干净的事务列表。不是 100 个功能——是在一个仪表盘上看到最重要的 5 件事。

#### 功能范围

| 功能 | 优先级 | 对标 | 描述 |
|------|--------|------|------|
| **收支录入** | P0 | YNAB | 金额+类别+日期+备注。快速录入（金额大字号，类别快捷选择）。 |
| **类别管理** | P0 | YNAB | 预设+自定义类别。每个类别可有预算额度。 |
| **月度仪表盘** | P0 | Monarch | 顶部：本月收入/支出/结余（大数字）。中间：类别占比环形图。底部：预算进度条。 |
| **预算设定** | P1 | YNAB | 按类别设月度预算。超支显示红色进度条+提醒。 |
| **净值追踪** | P1 | Monarch | 总资产-总负债。月度趋势线。 |
| **趋势图** | P1 | Monarch | 6/12 个月收支趋势。各类别支出变化。 |
| **AI 洞察** | P2 | — | "你这个月外卖 RM1,200，占餐饮 60%，比上月涨 15%。建议设 RM800 预算。" |

#### UX 规格

**月度仪表盘（对标 Monarch + YNAB）**:
```
JULY 2026                                              [+ Add Transaction]
────────────────────────────────────────────────────────────
INCOME                         EXPENSES                     BALANCE
RM12,000                        RM8,450                      RM3,550
────────────────────────────────────────────────────────────
BUDGETS
────────────────────────────────────────────────────────────
Food & Dining          ████████████░░░░░░░  RM3,200 / RM4,000
Transport              ██████░░░░░░░░░░░░░░  RM800  / RM1,500
Entertainment          ████████████████░░░░  RM2,100 / RM2,500  ← over budget
Shopping               ████░░░░░░░░░░░░░░░░  RM500  / RM1,500

CATEGORIES (this month)
  🍔 Food & Dining ....... RM3,200 (38%)
  🎬 Entertainment ....... RM2,100 (25%)
  🚗 Transport ........... RM800  (9%)
  🛍 Shopping ............ RM500  (6%)
  📦 Others .............. RM1,850 (22%)
```

**快速录入（对标 YNAB 移动端录入）**:
- 大号金额输入框（40px+ 字号）
- 下方一行：类别快捷选择 pills（可滑动）
- 支出默认选中，点 "Income" 切换
- 日期默认今天、备注可选
- 回车保存+清空，可连续录入

#### 数据模型

```sql
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  category TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  UNIQUE(user_id, category, period, start_date)
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,               -- 'Maybank Savings', 'Cash', 'Wise'
  type TEXT DEFAULT 'checking',     -- 'checking', 'savings', 'credit', 'cash', 'investment'
  balance DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'MYR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 域 4: Health（健康管理）→ 对标 Whoop + Apple Health

**解决的问题**: "记录和分析我的健康"

#### 核心设计哲学

> **Whoop 三位一体**: Strain（你今天"消耗"了多少）+ Recovery（你恢复得怎么样）+ Sleep（你睡得够不够）。三个分数互相关联——恢复低 → 建议今天减轻 Strain。睡眠不足 → 明天 Recovery 会差。**不是给你一堆数字——是给你一个明确的行动建议。**

> **Apple Health 模式**: Trends（长期趋势）+ Highlights（变化点："你的静息心率在过去 8 周下降了 3 bpm"）+ Favorites 仪表盘（用户自己选什么放首页）。

> **Whoop Journal**: 每天回答几个 yes/no 问题（"昨晚用手机了吗""喝了咖啡吗""做了有氧吗"），用数据告诉你什么行为影响你的恢复。**相关性发现是自动的，不需要用户自己猜。**

#### 功能范围

| 功能 | 优先级 | 对标 | 描述 |
|------|--------|------|------|
| **Strain / Recovery / Sleep 三分数** | P0 | Whoop | 核心仪表盘。每天醒来看这三个数。绿色=好，黄色=一般，红色=差。 |
| **核心指标录入** | P0 | Apple Health | 体重、睡眠时长/质量、静息心率、运动分钟/类型。支持手动+未来自动。 |
| **Daily Journal** | P1 | Whoop | 每天几个 yes/no 问题。积累数据后自动发现相关性。 |
| **情绪追踪** | P1 | — | 每日 1-5 分。简短笔记可选。 |
| **饮食日志** | P1 | — | 餐食+估算卡路里+照片。 |
| **趋势 & 高亮** | P1 | Apple Health | 7/30/90 天趋势线。自动检测变化点（"本周平均睡眠比上月多 45 分钟"）。 |
| **教练建议** | P2 | Whoop | "你昨晚只睡了 5.5 小时，今晚建议 10:00 前上床以达到绿色恢复。" |
| **自定义指标** | P2 | — | 血压、血糖、饮水量…用户可创建任意指标。 |
| **可穿戴同步** | P2 | — | Apple Health / Google Fit API。 |

#### UX 规格

**今日仪表盘（对标 Whoop Home Screen）**:
```
TODAY, JULY 21                                          [+ Log Metric]
────────────────────────────────────────────────────────────
        RECOVERY              STRAIN                SLEEP
        ┌──────┐             ┌──────┐              ┌──────┐
        │  72  │             │ 12.3 │              │ 6h42 │
        │  🟡  │             │  🟢  │              │  🟡  │
        └──────┘             └──────┘              └──────┘
        Moderate              Optimal               Below target
────────────────────────────────────────────────────────────
COACH: "Your sleep was below target last night. 
       Aim for bed by 10:30 PM tonight to hit green recovery."
────────────────────────────────────────────────────────────
RECENT METRICS
  Weight ...... 72.3 kg (↓0.5 from last week)     [📈 trend ↗]
  RHR ......... 58 bpm (stable)                    [📈 trend →]
  Exercise .... 45 min run yesterday                [➕]
```

**Daily Journal（对标 Whoop Journal）**:
- 每天固定时间推送（可配置，默认 9PM）
- 3-5 个 yes/no 问题，随机轮换
  - "Did you drink coffee after 2PM?"
  - "Did you exercise today?"
  - "Did you look at screens 30min before bed?"
  - "Did you eat within 2 hours of bed?"
- 一周后可看到：你的某个习惯 × Recovery 的相关性

**Trends & Highlights（对标 Apple Health）**:
- 长期趋势图（折线图，30/90/180天切换）
- 系统自动生成 Highlights：
  - "Your resting heart rate dropped 3 bpm over the last 8 weeks."
  - "You averaged 7.2h sleep this month, up from 6.5h last month."

#### Recovery / Strain 计算逻辑（无穿戴设备时）

**问题**：Whoop 的三分数来自 HRV/ECG 传感器，本系统 Phase 1-4 没有穿戴设备（穿戴同步是 P2）。三分数不能是空字段或伪造数字——必须有一个明确、可解释、能跑的公式，并在 UI 上诚实标注"预估值"。

**公式（`lib/health-scoring.ts`，纯函数，无需 AI）**：

```
sleep_score  = clamp(0, 100, 0.6 * min(100, sleep_duration_minutes / 480 * 100)
                            + 0.4 * (sleep_quality * 20))
               // sleep_quality 是当天手动 1-5 评分；缺失则只用 duration 部分，权重改 1.0

rhr_component = 若今日记录了 RHR：
                  50 + clamp(-50, 50, (7日滚动平均RHR - 今日RHR) * 5)
                  // RHR 比过去7天均值低 → 分数更高（心血管恢复更好的信号）
                否则：50（中性值，不拉低也不拉高）

prior_strain_relief = 100 - min(100, 昨日 strain_score / 21 * 100)
                       // 昨天练得越狠，今天恢复分越容易被拉低

recovery_score = round(clamp(0, 100,
                    0.5 * sleep_score + 0.3 * rhr_component + 0.2 * prior_strain_relief))

strain_score = round(min(21, ln(1 + Σ(exercise_minutes_i * intensity_multiplier_i)) * 6), 1)
               // intensity_multiplier: 未分类=1.0, 有氧/HIIT=1.5, 力量=1.2, 步行/瑜伽=0.6
               // 全天无运动记录 → strain_score = 0
```

**实现原则**：
- 这些函数在 `GET /api/health/scores` 读取时计算，并写入/更新当天的 `daily_scores` 行（每日一次快照，历史日期不因公式后续调整而重算——那天的分数就是那天数据算出的结果）。
- UI 上三个分数卡片必须带一个 (i) tooltip：「基于手动记录估算，非生物传感器数据」——管理用户预期，避免误以为是医疗级数据。
- **Coach 建议卡片是规则引擎，不是 Hermes 调用**：先用简单阈值判断（如 `sleep_score < 60 且 recovery_score 处于黄/红` → 触发"建议今晚更早睡"文案模板），文案本身可选地经 Hermes 润色成自然语言，但触发逻辑必须是确定性代码，不依赖 Hermes 是否在线。
- P2 接入 Apple Health/Google Fit 后，`rhr_component` 和 `sleep_score` 的输入源从 `manual` 换成 `apple_health`（`metric_source` 字段已支持），公式本身不用改。

#### 数据模型

```sql
CREATE TYPE metric_source AS ENUM ('manual', 'apple_health', 'google_fit', 'api');

CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  metric_type TEXT NOT NULL,          -- 'weight', 'sleep_duration', 'sleep_quality',
                                      -- 'resting_hr', 'exercise_minutes', 'exercise_type',
                                      -- 'blood_pressure_sys', 'blood_pressure_dia',
                                      -- or any custom type
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source metric_source DEFAULT 'manual',
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,   -- when was this measured
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  meal_type meal_type NOT NULL,
  description TEXT,
  estimated_calories INT,
  photo_url TEXT,
  eaten_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  score INT NOT NULL CHECK(score >= 1 AND score <= 5),
  note TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, recorded_at)
);

-- Whoop-style Daily Journal
CREATE TABLE journal_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,             -- 'Did you drink coffee after 2PM?'
  category TEXT DEFAULT 'general',    -- 'sleep', 'nutrition', 'exercise', 'mindset'
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE journal_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES journal_questions(id) NOT NULL,
  answer BOOLEAN NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, question_id, recorded_at)
);

-- Recovery / Strain / Sleep daily scores (WHOOP trinity)
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  recovery_score INT CHECK(recovery_score >= 0 AND recovery_score <= 100),
  strain_score NUMERIC(4,1),
  sleep_duration_minutes INT,
  sleep_quality INT CHECK(sleep_quality >= 1 AND sleep_quality <= 5),
  UNIQUE(user_id, date)
);
```

---

### 域 5: Knowledge（知识管理）→ 对标 Obsidian + Readwise

**解决的问题**: "记录和分析、精简化知识"

#### 核心设计哲学

> **Obsidian 模式**: 
> - **Local-first Markdown** → 数据是你的，不锁死在哪个平台
> - **双向链接** `[[note-name]]` → 知识不是文件夹，是网络
> - **Daily Notes** → 每天自动创建一页，这是默认入口（"今天在想什么？"）
> - **Local Graph View** → 只看当前笔记关联的 1-2 层节点。全局图谱是花瓶，本地图谱才有用。
> - **无文件夹强制** → 用链接和标签组织，不是层级文件夹

> **Readwise 模式**:
> - **每日回顾** → 每天推送 5-10 条过往高亮/笔记
> - **Frequency Tuning** → 某条内容可以标记"少出现"或"多出现"
> - **Spaced Repetition** → 不是死记硬背的 Anki，是温和的"提醒你曾经觉得重要的东西"
> - **从各处收集** → Twitter、Kindle、网页、PDF → 集中到一个 Inbox

#### 功能范围

| 功能 | 优先级 | 对标 | 描述 |
|------|--------|------|------|
| **Daily Note** | P0 | Obsidian | 每天自动生成一页。日期为标题。这是默认入口。 |
| **Markdown 编辑器** | P0 | Obsidian | 实时预览。支持 `[[link]]` 双向链接语法。代码高亮。 |
| **双向链接 + Backlinks** | P0 | Obsidian | 笔记 A 链接到 B → B 底部自动显示"Linked from: A"。 |
| **Local Graph** | P1 | Obsidian | 当前笔记 + 1-2 层关联节点的图谱。不看全局，看局部。 |
| **标签系统** | P1 | Obsidian | 支持 `#tag` 和嵌套 `#parent/child`。标签页聚合所有相关笔记。 |
| **Daily Review** | P1 | Readwise | 每天推送 5-10 条旧笔记/高亮。可标记"少推"或"多推"。 |
| **AI 摘要** | P1 | — | 长笔记 → Hermes 提炼 3-5 个要点。 |
| **AI 合并精简** | P2 | — | 选中多篇相关笔记 → Hermes 去重+合并 → 输出一篇精炼笔记。 |
| **网页剪藏** | P2 | Readwise | 输入 URL → 自动抓取正文 → 保存为笔记。 |
| **阅读清单** | P2 | — | 稍后读。标记阅读状态。读完可写笔记。 |
| **RSS 订阅** | P2 | — | 订阅源管理。文章列表。标记已读。 |

#### UX 规格

**Daily Note（对标 Obsidian Daily Notes）**:
```
MONDAY, JULY 21, 2026                                   [+ New Note]
────────────────────────────────────────────────────────────
# 2026-07-21

## Morning thoughts
开始写今天在想什么…

## Notes created today
- [[React Server Components deep dive]]
- [[Supabase RLS policy design]]

## Tasks completed
- [x] Review PR #42
- [x] Call with David

## Links
- [[2026-07-20]] ← Yesterday
```

**Editor（对标 Obsidian 编辑器）**:
- 分屏：左 = 编辑（Markdown 源码），右 = 实时预览
- 或者：单屏所见即所得（类似 Notion，但底层 Markdown）
- 输入 `[[` 触发笔记搜索+自动补全
- 输入 `#` 触发标签自动补全
- Backlinks 面板：底部显示所有链向本页的笔记

**Local Graph（对标 Obsidian Local Graph）**:
- 当前笔记在中心
- 1 层关联节点围绕（线连接）
- 可选 2 层（灰化显示）
- 点击节点跳转
- **不做全局图谱**——那是花瓶。本地图谱/局部图谱才有实际导航价值。

**Daily Review（对标 Readwise Daily Review）**:
- 每天推送 5-10 条过往高亮/笔记
- 卡片式展示：正面 = 笔记标题/高亮内容，反面 = 原始笔记链接
- 操作：
  - ✓ 记住了（降低频率）
  - 🔄 再来一次（保持频率）
  - ⭐ 重要（增加频率）
  - 🗑 不再推送
- Frequency Tuning：根据用户操作自动调整每条笔记的出现概率

#### 数据模型

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,                       -- Markdown
  plain_text TEXT,                    -- 用于全文搜索（去 Markdown 语法）
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,                    -- 网页剪藏来源
  is_daily_note BOOLEAN DEFAULT false,
  is_clipped BOOLEAN DEFAULT false,
  
  -- Readwise-style spaced repetition
  review_count INT DEFAULT 0,
  review_priority INT DEFAULT 5,      -- 1-10, 影响 Daily Review 出现频率
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 笔记中的高亮/摘录（对标 Readwise highlights）
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,              -- 高亮文本
  note_text TEXT,                     -- 用户对高亮的批注
  position INT,                       -- 在原笔记中的位置
  review_count INT DEFAULT 0,
  review_priority INT DEFAULT 5,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE link_type AS ENUM ('reference', 'related', 'contradicts', 'extends');

CREATE TABLE note_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  link_type link_type DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_note_id, target_note_id)
);

CREATE TYPE reading_status AS ENUM ('to_read', 'reading', 'completed');

CREATE TABLE reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status reading_status DEFAULT 'to_read',
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## 三、跨域功能

### Cmd+K 全局命令面板（对标 Linear）

一个快捷键统治一切：
- `Cmd+K` 打开
- 搜索范围：所有域的标题+内容
- 结果按域分组
- 也可输入命令：
  - `> Create task "xxx"`
  - `> Start timer "xxx"`
  - `> Log weight 72kg`
  - `> New note "xxx"`
  - `> Go to /health`

### Dashboard（首页）

聚合今日最重要信息：
```
GOOD MORNING, ZIYI                                    MONDAY, JUL 21
────────────────────────────────────────────────────────────
RECOVERY  72 🟡    TODAY'S TASKS (3)          RECENT NOTES
STRAIN   12.3 🟢   ○ Review PR #42            • React RSC deep dive
SLEEP    6h42 🟡   ○ Call with David          • Supabase RLS design
                   ○ Buy groceries             • 2026-07-20 (Daily)

THIS MONTH          TODAY'S TIMELINE           QUICK CAPTURE
Income  RM12,000     09:00-09:30  Standup      [          写点什么…          ]
Expense  RM8,450     10:00-12:00  Coding
Balance  RM3,550     12:00-13:00  Lunch
                    13:00-now    Deep work →
```

### 跨域关联分析（Hermes 驱动）

- **Health × Tasks**: 睡眠 < 6h 的日子，任务完成率下降 X%
- **Finance × Health**: 外卖类别支出 ↑ → 体重趋势 ↑
- **Knowledge × Tasks**: 读完某标签后，相关域的任务完成速度变化
- **自动生成洞察报告**（周报/月报）

---

### Hermes API 契约（关键依赖，需在 Phase 2 前用真实服务验证）

**问题**：`localhost:8642` 目前未运行，仓库里也没有找到 Hermes 的接口文档。多个 P0/P1 功能（NLP 解析 fallback、AI 摘要、AI 分解、跨域洞察、Coach 文案润色）都经 `/api/hermes/proxy` 依赖它，但没人写下它的请求/响应格式、鉴权方式、超时行为。这是唯一会真正卡住排期的未知项。

**降低风险的设计决定**：

1. **Capture 的 NLP 解析不依赖 Hermes**。零摩擦捕获的前提是"输入框不能因为一个本地 AI 进程没启动就失灵"。改用本地库：
   - 日期/时间解析：`chrono-node`（支持中英文 locale，`chrono.zh` + `chrono.en` 双解析，取先匹配到的）
   - `#tag` / `@project` 提取：正则，`lib/nlp-parser.ts` 里的纯函数，不发网络请求
   - Hermes 只在 P2「AI 自动分类」阶段介入，作为本地解析失败后的可选增强，不在关键路径上
   - 这同时解决了"NLP 支持什么语言"的问题：本地解析中英双语都支持，不依赖 Hermes 的语言能力

2. **`lib/hermes.ts` 封装成单一契约**，所有调用方（summarize / decompose / insights / coach 文案）只认这一个函数签名，真实 Hermes 接口细节全部封在这一个文件里：
   ```ts
   // lib/hermes.ts
   type HermesTask = 'summarize' | 'decompose' | 'insight' | 'coach_message' | 'classify';

   async function hermesRequest(task: HermesTask, input: string, context?: Record<string, unknown>): 
     Promise<{ text: string; structured?: unknown }> 
   // 内部 POST `${HERMES_API_URL}/<TODO:确认真实路径>`，携带 { task, input, context }
   // TODO: 在开发本机跑起 Hermes 后，用 `curl localhost:8642/` 或其自带文档确认：
   //   - 真实路径（/generate? /v1/chat? /complete?）
   //   - 鉴权头（是否需要 API key？）
   //   - 请求体字段名、响应体字段名
   //   - 是否支持流式（SSE）——如果 AI 摘要/洞察要边生成边显示，需要知道
   //   一旦确认，只改这一个文件，不改调用方
   ```

3. **所有 Hermes 调用必须有超时 + 降级**：Hermes 挂了或没启动时，功能应该优雅降级（如"摘要生成失败，可稍后重试"），不能让整个页面卡死或报错。这是 Phase 1 就要定的基础设施规则，不是 Phase 6 才补的 polish。

4. **验证步骤（Build 开始前，5 分钟）**：启动 Hermes（`localhost:8642`），跑 `curl -v http://localhost:8642/` 和已知的一两个真实调用，把响应结构贴回来更新此契约。在此之前，Phase 2 的「AI 自动分类」和 Phase 5 的「AI 摘要」可以先用固定 mock 响应开发 UI，不阻塞其他 Phase。

---

## 四、技术架构

### 技术栈

| 层 | 选择 | 原因 |
|---|---|---|
| **框架** | Next.js 15 App Router | Web-first + API Routes + PWA |
| **语言** | TypeScript (strict) | 类型安全 |
| **样式** | Tailwind CSS + shadcn/ui | 快速开发 + 可定制 |
| **设计系统** | nothing-design-skill | Nothing OS 黑白红极简 |
| **图表** | Recharts | React-native 图表，轻量 |
| **编辑器** | Tiptap | Markdown 所见即所得 |
| **图谱** | D3.js (force graph) | Local graph 可视化 |
| **数据库** | Supabase PostgreSQL | 已有基础设施 |
| **认证** | Supabase Auth | Email + OAuth |
| **AI** | Hermes API (localhost:8642) | 摘要、分析、洞察 |
| **存储** | Supabase Storage | 图片、语音文件 |
| **部署** | Vercel | 自动 CI/CD |
| **定时任务** | Vercel Cron Jobs / pg_cron | Daily Review 推送、RSS 抓取 |

### 目录结构

```
everything/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Sidebar + Cmd+K
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── capture/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── finance/page.tsx
│   │   │   ├── health/page.tsx
│   │   │   └── knowledge/
│   │   │       ├── page.tsx        # Daily Note 或笔记列表
│   │   │       └── [id]/page.tsx   # 单篇笔记
│   │   ├── api/
│   │   │   ├── captures/route.ts
│   │   │   ├── tasks/route.ts
│   │   │   ├── transactions/route.ts
│   │   │   ├── health/
│   │   │   │   ├── metrics/route.ts
│   │   │   │   ├── journal/route.ts
│   │   │   │   └── scores/route.ts
│   │   │   ├── notes/route.ts
│   │   │   ├── highlights/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── hermes/proxy/route.ts
│   │   │   └── insights/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui
│   │   ├── shared/
│   │   │   ├── command-palette.tsx  # Cmd+K
│   │   │   ├── sidebar.tsx
│   │   │   ├── global-search.tsx
│   │   │   └── nlp-preview.tsx      # Todoist-style NLP preview
│   │   ├── capture/
│   │   │   ├── capture-bar.tsx      # Drafts-style quick input
│   │   │   ├── timer-card.tsx       # Toggl-style timer
│   │   │   ├── timeline-view.tsx
│   │   │   └── inbox-list.tsx
│   │   ├── tasks/
│   │   │   ├── task-card.tsx
│   │   │   ├── today-view.tsx       # Things-style Today
│   │   │   ├── board-view.tsx       # Linear-style Kanban
│   │   │   ├── calendar-view.tsx
│   │   │   └── status-icon.tsx      # ○/●/✓ icons
│   │   ├── finance/
│   │   │   ├── transaction-form.tsx
│   │   │   ├── monthly-dashboard.tsx # Monarch-style overview
│   │   │   ├── budget-bar.tsx
│   │   │   └── trend-chart.tsx
│   │   ├── health/
│   │   │   ├── trinity-scores.tsx    # Whoop Recovery/Strain/Sleep
│   │   │   ├── metric-grid.tsx      # Apple Health metrics
│   │   │   ├── daily-journal.tsx     # Whoop Journal
│   │   │   ├── trend-line.tsx
│   │   │   └── coach-card.tsx       # Whoop-style coaching
│   │   └── knowledge/
│   │       ├── note-editor.tsx       # Obsidian-style editor
│   │       ├── daily-note.tsx        # Obsidian Daily Note
│   │       ├── backlinks-panel.tsx   # Obsidian backlinks
│   │       ├── local-graph.tsx       # D3 force graph (1-2 depth)
│   │       └── daily-review.tsx      # Readwise-style review cards
│   ├── hooks/
│   │   ├── use-captures.ts
│   │   ├── use-tasks.ts
│   │   ├── use-transactions.ts
│   │   ├── use-health.ts
│   │   ├── use-notes.ts
│   │   ├── use-search.ts
│   │   └── use-keyboard.ts
│   ├── lib/
│   │   ├── supabase/
│   │   ├── hermes.ts
│   │   ├── nlp-parser.ts            # Todoist-style NLP
│   │   ├── spaced-repetition.ts     # Readwise-style SR algorithm
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── middleware.ts
├── docs/
│   └── EVERYTHING_SPEC.md
├── .env.local
└── package.json
```

---

## 五、完整数据库 Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Profiles
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Domain 1: CAPTURE
-- =====================================================
CREATE TYPE capture_source AS ENUM ('text', 'timer', 'voice', 'api');

CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_title TEXT,
  parsed_tags TEXT[] DEFAULT '{}',
  parsed_due TIMESTAMPTZ,
  is_timer BOOLEAN DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INT,
  source capture_source DEFAULT 'text',
  processed BOOLEAN DEFAULT false,
  converted_to_task_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Domain 2: TASKS
-- =====================================================
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_domain AS ENUM ('coding', 'research', 'writing', 'life', 'health', 'finance', 'other');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'medium',
  domain task_domain DEFAULT 'other',
  due_date DATE,
  estimated_minutes INT,
  energy_required INT CHECK(energy_required >= 1 AND energy_required <= 5),
  recurrence_rule TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- Domain 3: FINANCE
-- =====================================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'checking',
  balance DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'MYR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,  -- 关联账户；为空=未指定/现金
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  category TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  UNIQUE(user_id, category, period, start_date)
);

-- 账户余额随交易自动更新（净值追踪的前提；否则 accounts.balance 会和实际脱节）
CREATE FUNCTION apply_transaction_to_balance() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + (CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END)
    WHERE id = NEW.account_id;
  ELSIF TG_OP = 'DELETE' AND OLD.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - (CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END)
    WHERE id = OLD.account_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_balance
  AFTER INSERT OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION apply_transaction_to_balance();
-- ponytail: 没做 UPDATE 场景（改金额/改账户）的余额调整，先假设交易创建后不改金额；
-- 若后续做"编辑交易"功能，需要在这里补 UPDATE 分支重新计算 delta

-- =====================================================
-- Domain 4: HEALTH
-- =====================================================
CREATE TYPE metric_source AS ENUM ('manual', 'apple_health', 'google_fit', 'api');

CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source metric_source DEFAULT 'manual',
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  meal_type TEXT NOT NULL,
  description TEXT,
  estimated_calories INT,
  photo_url TEXT,
  eaten_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  score INT NOT NULL CHECK(score >= 1 AND score <= 5),
  note TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, recorded_at)
);

-- 全局共享表，无 user_id：所有用户读同一套问题库。RLS 用单独策略（见下），
-- 不适用于 "auth.uid() = user_id" 的通用规则。种子数据见 UX 规格里列的默认问题。
CREATE TABLE journal_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE journal_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES journal_questions(id) NOT NULL,
  answer BOOLEAN NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, question_id, recorded_at)
);

CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  recovery_score INT CHECK(recovery_score >= 0 AND recovery_score <= 100),
  strain_score NUMERIC(4,1),
  sleep_duration_minutes INT,
  sleep_quality INT CHECK(sleep_quality >= 1 AND sleep_quality <= 5),
  UNIQUE(user_id, date)
);

-- =====================================================
-- Domain 5: KNOWLEDGE
-- =====================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  plain_text TEXT,
  tags TEXT[] DEFAULT '{}',
  source_url TEXT,
  is_daily_note BOOLEAN DEFAULT false,
  is_clipped BOOLEAN DEFAULT false,
  review_count INT DEFAULT 0,
  review_priority INT DEFAULT 5 CHECK(review_priority >= 1 AND review_priority <= 10),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  note_text TEXT,
  position INT,
  review_count INT DEFAULT 0,
  review_priority INT DEFAULT 5 CHECK(review_priority >= 1 AND review_priority <= 10),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE link_type AS ENUM ('reference', 'related', 'contradicts', 'extends');

CREATE TABLE note_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  link_type link_type DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_note_id, target_note_id)
);

CREATE TABLE reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'to_read' CHECK(status IN ('to_read', 'reading', 'completed')),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_captures_user_time ON captures(user_id, created_at DESC);
CREATE INDEX idx_captures_unprocessed ON captures(user_id, processed) WHERE processed = false;
CREATE INDEX idx_captures_timer ON captures(user_id, start_time DESC) WHERE is_timer = true;

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_today ON tasks(user_id, due_date, priority) WHERE status IN ('todo', 'in_progress');

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);
CREATE INDEX idx_transactions_month ON transactions(user_id, transaction_date, type);

CREATE INDEX idx_health_metrics_user_type ON health_metrics(user_id, metric_type, recorded_at DESC);
CREATE INDEX idx_mood_user_date ON mood_entries(user_id, recorded_at DESC);
CREATE INDEX idx_journal_user_date ON journal_answers(user_id, recorded_at DESC);
CREATE INDEX idx_daily_scores_user ON daily_scores(user_id, date DESC);

CREATE INDEX idx_notes_user_updated ON notes(user_id, updated_at DESC);
CREATE INDEX idx_notes_daily ON notes(user_id, created_at) WHERE is_daily_note = true;
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
-- 'simple' 而非 'english'：内容可能是中文，'english' 的词干提取(stemming)对中文无效反而有害。
-- 'simple' 不做词干处理，中英文都能基本分词搜索；真正的中文分词需要 zhparser 扩展，超出当前范围。
CREATE INDEX idx_notes_search ON notes USING GIN(to_tsvector('simple', COALESCE(plain_text, '')));
CREATE INDEX idx_highlights_review ON highlights(user_id, next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_note_links_source ON note_links(source_note_id);
CREATE INDEX idx_note_links_target ON note_links(target_note_id);

-- =====================================================
-- RLS Policies
-- =====================================================
-- Each table with user_id: ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;
-- Each table with user_id: CREATE POLICY "user_access" ON xxx FOR ALL USING (auth.uid() = user_id);
--
-- 例外 — journal_questions 没有 user_id，是全局共享的问题库，不适用上面的通用规则：
-- ALTER TABLE journal_questions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "read_all" ON journal_questions FOR SELECT USING (auth.role() = 'authenticated');
-- 写入（新增/停用问题）不开放给普通用户策略，走 service role 或后台管理，不在 P0 范围内。
```

---

## 六、API 端点

```
# Capture
GET    /api/captures?processed=false
POST   /api/captures                        # body: { raw_text: "..." }
PATCH  /api/captures/:id                    # mark processed, convert to task
DELETE /api/captures/:id

# Tasks
GET    /api/tasks?status=todo&view=today
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/decompose             # AI 分解

# Finance
GET    /api/transactions?month=2026-07
POST   /api/transactions
GET    /api/finance/report?month=2026-07     # Monthly dashboard data
GET    /api/finance/trends?months=12

# Health
POST   /api/health/metrics
GET    /api/health/metrics?type=weight&range=30d
GET    /api/health/scores?date=2026-07-21    # Trinity scores
POST   /api/health/journal                   # Answer journal questions
GET    /api/health/journal?date=2026-07-21
GET    /api/health/trends?type=sleep&range=90d
GET    /api/health/highlights                # Apple Health style change detection

# Knowledge
GET    /api/notes?tag=react&search=keyword
POST   /api/notes
PATCH  /api/notes/:id
DELETE /api/notes/:id
GET    /api/notes/daily?date=2026-07-21      # Get or create daily note
POST   /api/notes/:id/summarize              # AI 摘要
POST   /api/notes/merge                      # AI 合并精简
GET    /api/highlights/review?limit=10        # Readwise-style daily review
POST   /api/highlights/:id/reviewed           # Update SR after review
POST   /api/clipper                          # 网页剪藏

# Cross-domain
GET    /api/search?q=keyword
GET    /api/dashboard
POST   /api/insights/analyze

# Hermes Proxy
POST   /api/hermes/proxy
```

---

## 七、开发阶段

### Phase 1: Foundation (Week 1-2)
- [ ] 项目脚手架 (create-next-app, shadcn/ui, Tailwind, Supabase 客户端)
- [ ] 数据库 Schema 创建（全部表+索引+RLS）
- [ ] Supabase Auth (email/password)
- [ ] 基础布局 (sidebar + domain 路由 + Cmd+K 命令面板骨架)
- [ ] Nothing OS 设计系统集成 (加载 nothing-design-skill)
- [ ] 全局搜索 API + UI
- [ ] `npm run build` 必须通过

### Phase 2: Capture + Tasks (Week 2-3)
- [ ] **Capture Bar**（Drafts 风格：打开即空白输入框，NLP 解析预览）
- [ ] **Timer Mode**（Toggl 风格：一键计时+活动描述）
- [ ] **Timeline View**（按天纵轴时间块）
- [ ] **Inbox 处理**（转任务/归档/删除）
- [ ] **Today View**（Things 风格：今天该做什么）
- [ ] **Board View**（Kanban 拖拽）
- [ ] 任务 CRUD + 状态机（backlog/todo/in_progress/done）
- [ ] **Cmd+K 完善**（创建任务、搜索、导航）
- [ ] Dashboard 任务卡片

### Phase 3: Finance (Week 3-4)
- [ ] **交易录入**（快速金额输入+类别选择 pills）
- [ ] **月度仪表盘**（Monarch 风格：大数字+环形图+预算进度条）
- [ ] 类别管理 + 预算设定
- [ ] 账户管理（余额追踪）
- [ ] 趋势图（6/12 个月）
- [ ] Dashboard 财务卡片

### Phase 4: Health (Week 4-5)
- [ ] **Trinity Scores**（Whoop 风格：Recovery/Strain/Sleep 三卡片）
- [ ] 核心指标录入（体重/睡眠/心率/运动）
- [ ] **Daily Journal**（Whoop 风格：每日 yes/no 问题）
- [ ] 情绪追踪
- [ ] 饮食日志
- [ ] **趋势 & Highlights**（Apple Health 风格）
- [ ] 教练建议卡片
- [ ] Dashboard 健康卡片

### Phase 5: Knowledge (Week 5-7)
- [ ] **Daily Note**（Obsidian 风格：每天自动创建）
- [ ] **Markdown 编辑器**（Tiptap，支持 `[[link]]` 双向链接）
- [ ] **Backlinks 面板**
- [ ] **Local Graph**（D3 力导向图，1-2 层深度）
- [ ] 标签系统 + 全文搜索
- [ ] **Daily Review**（Readwise 风格：间隔重复卡片）
- [ ] AI 摘要（Hermes 集成）
- [ ] 网页剪藏

### Phase 6: Polish + Advanced (Week 7-8)
- [ ] PWA 支持
- [ ] Nothing OS premium polish
- [ ] AI 跨域洞察
- [ ] RSS 阅读器
- [ ] 间隔重复算法调优（Frequency Tuning）
- [ ] Health Score 自动计算
- [ ] 月报/周报自动生成

---

## 八、环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pgpykohakzyyvmeeivmk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>

# Hermes
HERMES_API_URL=http://localhost:8642

# App
NEXT_PUBLIC_APP_NAME=Everything
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 九、给 Claude Code 的启动指令

```
Build a personal operating system called "Everything" — a single web app that replaces 
5 separate apps: Drafts/Toggl (capture), Linear/Things (tasks), YNAB/Monarch (finance), 
Whoop/Apple Health (health), Obsidian/Readwise (knowledge).

Tech stack: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase + Hermes AI.

Design system: Load https://github.com/dominikmartn/nothing-design-skill first.
Nothing OS: #fff canvas, #f5f5f5 surfaces, #000 text, #ed1c24 accents.
DotGothic16 headers, Inter 400 body. No shadows, no borders, pill shapes, 64px margins.

Database: All SQL in Section 5 of EVERYTHING_SPEC.md. 
Every table must have RLS enabled.

Build order: Strictly Phase 1→6. 
Each Phase: npm run build must pass before proceeding.

Key UX patterns to nail:
1. Capture Bar = Drafts (opens to blank input, NLP preview, Enter to save + clear)
2. Timer = Toggl Track (big start/stop button, "What are you working on?")
3. Today = Things 3 (landing page is "what's due today")
4. Cmd+K = Linear (command palette for everything)
5. Finance dashboard = Monarch (big numbers + donut chart + budget bars)
6. Health trinity = Whoop (Recovery/Strain/Sleep scores with coaching)
7. Daily Note = Obsidian (auto-create per day, [[wiki links]], backlinks panel)
8. Daily Review = Readwise (spaced repetition cards for old notes/highlights)

Do NOT build: global knowledge graph (花瓶), complex multi-user features, 
bank syncing, wearable syncing — these are P2/未来.

Every feature must feel premium. No half-built stubs. Test in browser.
```
