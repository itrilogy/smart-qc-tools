# Smart QC Tools - 工业级智能质量控制工具箱 🛠️📊

Smart QC Tools 是一款面向工业工程、质量管理（QC）及系统分析领域的绘图工具。它通过自研的 **DSL (Domain Specific Language)** 引擎与 **LLM (大语言模型)** 推理技术，将传统的繁琐绘图流程简化为“语言即图表”的极简体验。

---

## 🚀 核心特性

本工具箱集成了五大工业级分析图表，专为质量工程师打造：

### 🐟 1. 智能鱼骨图 (Smart Fishbone)
> **深度因果分析神器** — 只有想不透的原因，没有画不出的逻辑。
- **无限级联**: 独创的递归渲染引擎，支持最高 **6 级**因果嵌套，自动处理复杂的镜像生长与空间排布。
- **AI 辅助思维**: 集成 DeepSeek/Qwen 等大模型，输入一句话（如"注塑件飞边原因分析"），秒级生成逻辑严密的完整鱼骨图。
- **极简 DSL**: 摒弃拖拽，使用缩进式语法 `#` 即可定义层级，让思维回归逻辑本身。

### 📊 2. 动态排列图 (Dynamic Pareto)
> **二八定律可视化** — 抓住关键少数，解决主要矛盾。
- **全自动计算**: 仅需输入原始数据，系统自动完成降序排列、累计频数统计及累计百分比计算。
- **双轴联动**: 左轴直观展示频数（柱状），右轴精准呈现占比（曲线），完美复刻 QC 七大手法经典样式。
- **关键线标记**: 自动绘制或自定义 80% 关键线，一眼锁定核心改善对象。

### 📈 3. 分布直方图 (Statistical Histogram)
> **制程能力显微镜** — 数据分布一目了然，制程变异无处遁形。
- **统计自动化**: 支持 Sturges 等算法自动计算最佳分组（Bins），亦可手动微调分组粒度。
- **规格可视化**: 内置 **USL (上规格限)**、**LSL (下规格限)** 及 **Target (目标值)** 标线，直观判断制程是否偏移。
- **正态拟合**: 实时计算均值与标准差，一键叠加正态分布曲线，辅助研判数据分布形态。

### 📉 4. 散点分析图 (Scatter Analysis)
> **相关性洞察利器** — 变量关联一目了然，趋势规律尽在掌握。
- **多维展示**: 支持标准散点和气泡图模式，X/Y/Z 三轴自由定义。
- **趋势拟合**: 一键叠加线性回归趋势线，量化变量相关性。
- **灵活配置**: 点大小、透明度、颜色全面可调，适配多种分析场景。

### 🧩 5. 智能亲和图 (Smart Affinity / KJ法)
> **头脑风暴整理神器** — 海量信息归类分组，直觉转化为结构。
- **双模渲染**: 支持 **树状层级 (Label)** 和 **卡片分组 (Card)** 两种可视化风格，适应不同展示需求。
- **层级嵌套**: 最高支持 4 级层级递归，灵活组织复杂信息结构。
- **颜色编码**: 分组头部、卡片背景、子项均可自定义颜色，视觉区分清晰直观。

### 📈 6. 统计控制图 (Statistical Control Chart / SPC)
> **质量波动监视器** — 实时监控生产状态，预警过程异常漂移。
- **经典模型**: 支持 **I-MR** (单点-移动极差) 与 **X-bar-R** (均值-极差) 工业标准图表。
- **判异引擎**: 内置 **Nelson Rules** 与 **Western Electric** 规则，自动识别 9 点中心偏离、6 点趋势、14 点交替等复杂异常，并以红点预警。
- **高性能 Canvas**: 支持高频采样数据实时动态重绘，轴范围自动呼吸缩放，确保大批量点位清晰呈现。

### 🛠️ 7. 工业级通用能力
- **专业导出引擎**: 支持 **白底 PNG** (报告用)、**透明 PNG** (PPT用) 及 **矢量 PDF** (打印用) 一键高清导出。
- **AI 智能推理**: 全系图表支持 LLM 推理，从自然语言到专业图表仅需一步。
- **DSL 驱动**: 所有图表均基于文本定义，易于存储、版本控制及在团队间作为代码分享。

---

## 🏗️ 技术栈

- **前端框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **样式系统**: Tailwind CSS (配合内联样式强制归一化)
- **图标库**: Lucide React
- **绘图技术**: Canvas API / SVG 混合驱动
- **AI 交互**: 标准 OpenAI 兼容序列协议

---

---

## 📖 用户手册 (User Manuals)

针对不同图表模块，我们提供了详尽的操作指南与 DSL 规范：

- 🐟 **[鱼骨图 (Fishbone) 手册](USER_MANUAL_FISHBONE.md)**
- 📊 **[排列图 (Pareto) 手册](USER_MANUAL_PARETO.md)**
- 📈 **[分布直方图 (Histogram) 手册](USER_MANUAL_HISTOGRAM.md)**
- 📉 **[散点分析图 (Scatter) 手册](USER_MANUAL_SCATTER.md)**
- 🧩 **[智能亲和图 (Affinity) 手册](USER_MANUAL_AFFINITY.md)**
- 📉 **[统计控制图 (Control) 手册](USER_MANUAL_CONTROL.md)**

---

## 📜 DSL 语法概览

### 🐟 一、鱼骨图 (Fishbone) DSL 规范

鱼骨图采用类 Markdown 语法来定义因果关系，支持最高 6 级嵌套。

#### 1.1 标题设定
| 语法 | 说明 | 示例 |
|------|------|------|
| `Title: [文字]` | 设置鱼骨图核心问题（鱼头） | `Title: 产品交付延迟` |

#### 1.2 层级结构
| 语法 | 层级 | 说明 | 示例 |
|------|------|------|------|
| `# [文字]` | Level 1 | 大骨分类（如：人、机、料、法、环） | `# 人员 (Man)` |
| `## [文字]` | Level 2 | 具体原因 | `## 培训不足` |
| `### [文字]` | Level 3 | 细节详情 | `### 新员工上岗培训缺失` |
| `#### [文字]` | Level 4 | 更深层原因 | `#### 培训资源不足` |
| `##### [文字]` | Level 5 | 深度细化 | `##### 预算削减` |
| `###### [文字]` | Level 6 | 最细粒度 | `###### 季度战略调整` |

#### 1.3 色彩配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Color[BoneLine]: #HEX` | 中轴脊椎线 | `#475569` | `Color[BoneLine]: #1d4ed8` |
| `Color[CaseLine]: #HEX` | 鱼刺线条 | `#94a3b8` | `Color[CaseLine]: #3b82f6` |
| `Color[Start]: #HEX` | 鱼头背景 | `#1e293b` | `Color[Start]: #ef4444` |
| `Color[End]: #HEX` | 鱼尾背景 | `#64748b` | `Color[End]: #22c55e` |
| `Color[Title]: #HEX` | 标题文字 | `#1e293b` | `Color[Title]: #0f172a` |
| `Color[Case]: #HEX` | 节点文字 | `#334155` | `Color[Case]: #1d4ed8` |

#### 1.4 配色建议
| 场景 | 推荐主色 | 色彩代码 |
|------|----------|----------|
| 故障/问题分析 | 警示红系 | `#ef4444` |
| 标准化管理 | 专业蓝系 | `#1d4ed8` |
| 商务/战略讨论 | 沉稳灰系 | `#475569` |

---

### 📊 二、排列图 (Pareto) DSL 规范

排列图采用结构化的 DSL 语法来定义频数统计数据，系统将自动完成降序排列、累计百分比计算及 80% 关键线绘制。

#### 2.1 标题设定
| 语法 | 说明 | 示例 |
|------|------|------|
| `Title: [文字]` | 设置图表主标题 | `Title: 产品缺陷频数分析` |

#### 2.2 色彩配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Color[Title]: #HEX` | 标题颜色 | `#1e293b` | `Color[Title]: #0f172a` |
| `Color[Bar]: #HEX` | 柱形图颜色 | `#3b82f6` | `Color[Bar]: #2563eb` |
| `Color[Line]: #HEX` | 累计曲线颜色 | `#f59e0b` | `Color[Line]: #d97706` |
| `Color[MarkLine]: #HEX` | 80% 关键线颜色 | `#ef4444` | `Color[MarkLine]: #dc2626` |

#### 2.3 字号配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Font[Title]: [Size]` | 主标题字号 | `18` | `Font[Title]: 20` |
| `Font[Base]: [Size]` | 坐标轴字号 | `12` | `Font[Base]: 14` |
| `Font[Bar]: [Size]` | 柱形标签字号 | `12` | `Font[Bar]: 10` |
| `Font[Line]: [Size]` | 曲线标签字号 | `12` | `Font[Line]: 11` |

#### 2.4 精度控制
| 语法 | 说明 | 取值范围 | 示例 |
|------|------|----------|------|
| `Decimals: [N]` | 累计百分比小数位数 | `0` - `4` | `Decimals: 2` |

#### 2.5 数据项定义
| 语法 | 说明 | 示例 |
|------|------|------|
| `- [项目名称]: [频数]` | 定义单条数据 | `- 插头虚焊: 48` |

> **注意**：数据无需手动排序，系统将自动按频数从高到低执行降序排列算法。

#### 2.6 完整示例
```pareto
Title: 2026年Q1客诉原因分析
Color[Title]: #1e293b
Color[Bar]: #3b82f6
Color[Line]: #f59e0b
Color[MarkLine]: #ef4444
Font[Title]: 18
Font[Base]: 12
Decimals: 1

- 物流破损: 420
- 客服响应慢: 210
- 系统延迟: 85
- 产品质量: 62
- 其他: 23
```

---

### 📈 三、直方图 (Histogram) DSL 规范

直方图用于展示连续数据的分布形态，支持规格限 (USL/LSL) 标记及正态曲线拟合。

#### 3.1 基础配置
| 语法 | 说明 | 示例 |
|------|------|------|
| `Title: [文字]` | 设置图表主标题 | `Title: 关键尺寸分布分析` |
| `Bins: [auto/N]` | 分组策略 (auto=自动计算) | `Bins: 12` |
| `ShowCurve: [true/false]` | 是否显示正态拟合曲线 | `ShowCurve: true` |

#### 3.2 规格限配置
| 语法 | 说明 | 示例 |
|------|------|------|
| `USL: [数值]` | 上规格限 (Upper Specification Limit) | `USL: 10.5` |
| `LSL: [数值]` | 下规格限 (Lower Specification Limit) | `LSL: 9.5` |
| `Target: [数值]` | 目标值 (Target Value) | `Target: 10.0` |

#### 3.3 色彩与字号配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Color[Bar]: #HEX` | 频数柱形颜色 | `#3b82f6` | `Color[Bar]: #6366f1` |
| `Color[Curve]: #HEX` | 正态曲线颜色 | `#f59e0b` | `Color[Curve]: #ec4899` |
| `Color[USL]: #HEX` | 上规格限颜色 | `#ef4444` | `Color[USL]: #dc2626` |
| `Color[LSL]: #HEX` | 下规格限颜色 | `#ef4444` | `Color[LSL]: #dc2626` |
| `Color[Target]: #HEX` | 目标线颜色 | `#22c55e` | `Color[Target]: #16a34a` |
| `Font[Title]: [Size]` | 主标题字号 | `18` | `Font[Title]: 20` |
| `Font[Base]: [Size]` | 坐标轴字号 | `12` | `Font[Base]: 14` |
| `Font[Bar]: [Size]` | 数值标签字号 | `12` | `Font[Bar]: 12` |

#### 3.4 数据项定义
| 语法 | 说明 | 示例 |
|------|------|------|
| `- [数值]` | 定义单个样本数据 | `- 9.8` |

> **提示**：直接输入数值即可，系统会自动统计频数并计算分布。

#### 3.5 完整示例
```histogram
Title: 核心部件直径分布图
USL: 10.5
LSL: 9.5
Target: 10.0
Bins: auto
ShowCurve: true
Color[Bar]: #3b82f6
Color[Curve]: #f59e0b
Color[USL]: #ef4444
Color[LSL]: #ef4444
Color[Target]: #22c55e
Font[Title]: 18
Font[Base]: 12
Font[Bar]: 10

# 原始数据
- 9.8
- 10.1
- 10.3
- 9.7
- 10.0
- 10.2
- 9.9
- 10.1
- 9.8
- 10.0
```

---

### 📉 四、散点图 (Scatter) DSL 规范

散点图用于分析两个变量之间的相关性，支持气泡大小 (Z轴) 及趋势线回归分析。

#### 4.1 基础配置
| 语法 | 说明 | 示例 |
|------|------|------|
| `Title: [文字]` | 设置图表主标题 | `Title: 广告投入与销售额分析` |
| `XAxis: [文字]` | X轴标签 | `XAxis: 广告投入(W)` |
| `YAxis: [文字]` | Y轴标签 | `YAxis: 销售额(W)` |
| `ZAxis: [文字]` | Z轴标签 (气泡大小时显示) | `ZAxis: 客单价` |

#### 4.2 视觉控制
| 语法 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `Color[Point]: #HEX` | 数据点颜色 | `#3b82f6` | `Color[Point]: #6366f1` |
| `Color[Trend]: #HEX` | 趋势线颜色 | `#f59e0b` | `Color[Trend]: #ec4899` |
| `Size[Base]: [N]` | 数据点基准大小 (px) | `6` | `Size[Base]: 8` |
| `Opacity: [0.1-1]` | 数据点透明度 | `0.7` | `Opacity: 0.8` |
| `ShowTrend: [bool]` | 是否显示回归趋势线 | `false` | `ShowTrend: true` |
| `Font[Title]: [N]` | 主标题字号 (px) | `20` | `Font[Title]: 24` |
| `Font[Base]: [N]` | 轴标签字号 (px) | `12` | `Font[Base]: 14` |

#### 4.3 数据项定义
支持二维 (X,Y) 或三维 (X,Y,Z) 数据录入：
| 语法 | 说明 | 示例 |
|------|------|------|
| `- x, y` | 标准散点数据 | `- 12.5, 45` |
| `- x, y, z` | 带气泡大小的散点数据 | `- 12.5, 45, 10` |

#### 4.4 完整示例
```scatter
Title: 门店客流与成交量分析
XAxis: 日均客流 (人)
YAxis: 成交单数 (单)
ZAxis: 平均客单价
Color[Point]: #3b82f6
Color[Trend]: #f59e0b
Size[Base]: 8
Opacity: 0.6
ShowTrend: true

# 数据格式: 客流, 成交, [客单价]
- 120, 35, 150
- 150, 42, 145
- 90, 22, 160
- 200, 65, 155
- 110, 30, 140
```

---

### 🧩 五、亲和图 (Affinity Diagram / KJ法) DSL 规范

亲和图是一种将大量信息进行分组归类的分析工具，也称为 KJ 法。支持两种渲染类型：树状层级 (Label) 和卡片分组 (Card)。

#### 5.1 基础配置
| 语法 | 说明 | 取值 | 示例 |
|------|------|------|------|
| `Title: [文字]` | 设置图表主标题 | 任意文字 | `Title: 如何提升团队效率` |
| `Type: [类型]` | 图表渲染类型 | `Label` / `Card` | `Type: Card` |
| `Layout: [布局]` | 布局方向 | `Vertical` / `Horizontal` | `Layout: Horizontal` |

> **类型说明**：
> - **Label 型**：适合展示层级关系，节点间有连线，类似组织结构图
> - **Card 型**：适合头脑风暴结果展示，卡片分组，视觉上更紧凑

#### 5.2 色彩配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Color[Title]: #HEX` | 主标题背景色 | `#1e293b` | `Color[Title]: #374151` |
| `Color[Header]: #HEX` | 分组头部背景色 | `#f59e0b` | `Color[Header]: #10b981` |
| `Color[Card]: #HEX` | 卡片背景色 | `#ffffff` | `Color[Card]: #fef3c7` |
| `Color[Item]: #HEX` | 子项背景色 | `#e2e8f0` | `Color[Item]: #dbeafe` |
| `Color[Line]: #HEX` | 连接线颜色 (Label型) | `#64748b` | `Color[Line]: #3b82f6` |
| `Color[Border]: #HEX` | 边框颜色 | `#cbd5e1` | `Color[Border]: #94a3b8` |

#### 5.3 字号配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Font[Title]: [N]` | 主标题字号 | `20` | `Font[Title]: 24` |
| `Font[Header]: [N]` | 分组头部字号 | `16` | `Font[Header]: 18` |
| `Font[Item]: [N]` | 数据项字号 | `14` | `Font[Item]: 12` |

#### 5.4 层级语法
采用类 Markdown 语法定义层级结构：
| 语法 | 层级 | 说明 |
|------|------|------|
| `# [文字]` | Level 1 | 一级分组/容器 |
| `## [文字]` | Level 2 | 二级子项 |
| `### [文字]` | Level 3 | 三级子项 |
| `#### [文字]` | Level 4 | 四级子项 (最深) |

#### 5.5 精确 Item 定义语法
| 语法 | 说明 | 示例 |
|------|------|------|
| `Item: {ID}, {内容}, {父ID?}` | 精确定义数据项 | `Item: G1-1, 简化审批流程, G1` |

> **规则**：无父ID的项为一级容器；被其他项引用为父的项自动升级为容器。

#### 5.6 完整示例 (Card 型)
```affinity
Title: 如何提升团队效率
Type: Card
Layout: Horizontal
Color[Title]: #1e293b
Color[Header]: #f59e0b
Color[Card]: #ffffff
Color[Item]: #e2e8f0
Font[Title]: 20
Font[Header]: 16
Font[Item]: 14

# 流程优化
## 简化审批流程
## 引入自动化工具
## 标准化工作模板

# 沟通改进
## 每日站会
## 定期回顾会议
## 透明化信息共享

# 技能提升
## 内部培训分享
## 外部课程学习
```

---

### 📈 六、控制图 (Control Chart / SPC) DSL 规范

控制图用于分析过程稳定性，支持多种图表类型及判异规则。

#### 6.1 基础配置
| 语法 | 说明 | 示例 |
|------|------|------|
| `Title: [文字]` | 设置图表主标题 | `Title: 关键尺寸 X-bar 控制图` |
| `Type: [I-MR/X-bar-R]` | 控制图模型类型 | `Type: X-bar-R` |
| `Size: [N]` | 子组样本容量 (n) | `Size: 5` |
| `Rules: [规则名]` | 启用的规则包 (Nelson/WE) | `Rules: Nelson` |
| `Decimals: [N]` | 限制线计算精度 | `Decimals: 3` |

#### 6.2 色彩与字号配置
| 语法 | 作用对象 | 默认值 | 示例 |
|------|----------|--------|------|
| `Color[Line]: #HEX` | 采集折线颜色 | `#3b82f6` | `Color[Line]: #2563eb` |
| `Color[UCL]: #HEX` | 控制上限 (UCL) 颜色 | `#ef4444` | `Color[UCL]: #dc2626` |
| `Color[CL]: #HEX` | 中心线 (CL) 颜色 | `#22c55e` | `Color[CL]: #16a34a` |
| `Color[Point]: #HEX` | 正常数据点颜色 | `#1d4ed8` | `Color[Point]: #3b82f6` |
| `Font[Title]: [N]` | 主标题字号 | `22` | `Font[Title]: 24` |
| `Font[Label]: [N]` | 控制限标注字号 | `10` | `Font[Label]: 12` |

#### 6.3 数据项定义
| 语法 | 说明 | 示例 |
|------|------|------|
| `[series]: [名称]` | 开启数据序列 | `[series]: 熔体温度` |
| `[数据点序列]` | 支持逗号/空格分隔多值 | `12.5, 12.8, 12.1` |
| `[/series]` | 关闭数据序列 | `[/series]` |

#### 6.4 完整示例 (X-bar-R 型)
```control
Title: 活塞销外径加工过程监控
Type: X-bar-R
Size: 5
Decimals: 3
Rules: Nelson
Color[Line]: #3b82f6
Color[Point]: #1d4ed8

[series]: 直径 (mm)
12.012, 12.008, 11.995, 12.001, 12.005
12.002, 11.998, 12.010, 12.003, 11.997
12.005, 12.012, 11.994, 12.008, 12.002
[/series]
```

---

## ⚙️ AI 配置指南

系统通过 `app/public/chart_spec.json` 进行 AI 服务的动态管理。

```json
{
  "ai_config": {
    "active_profile": "deepseek_public",
    "profiles": {
      "deepseek_public": {
        "name": "DeepSeek",
        "endpoint": "https://api.deepseek.com/v1/chat/completions",
        "model": "deepseek-chat",
        "key": "YOUR_API_KEY"
      }
    }
  }
}
```

---

## 📦 快速启动

1. **环境准备**: 确保已安装 Node.js 18+
2. **安装依赖**:
   ```bash
   npm install --legacy-peer-deps
   ```
3. **本地开发**:
   ```bash
   npm run dev
   ```
4. **构建生产版本**:
   ```bash
   npm run build
   ```

## 🐳 私有化部署 (Private Deployment)

项目支持通过 Docker 进行快速私有化部署。我们提供了多阶段构建的 `Dockerfile` 和一键部署脚本。

### 1. 部署准备
确保您的服务器已安装 **Docker** 和 **Docker Compose**。

### 2. 一键部署
直接在项目目录下执行：
```bash
./deploy.sh
```
该脚本会自动执行构建、启动容器并清理旧镜像。

### 3. 手动部署 (Docker Compose)
您也可以手动管理生命周期：
```bash
# 构建并启动
docker-compose up -d --build

# 停止
docker-compose down
```

### 4. 运行时配置
您可以直接修改服务器上的 `./smart-qc-tools/public/chart_spec.json`（该文件已挂载到容器），修改后无需重启即可生效（取决于前端缓存策略，刷新页面即可）。

---

## 🎨 设计理念

本工具遵循 **“极简描述，深度呈现”** 的原则。所有的 UI 比例（如 Tabs、输入框、导出按钮）均经过工业级视距优化，旨在为质量工程师提供一个沉浸式、无干扰的逻辑分析环境。

---

© 2026 Smart QC Tools | Industrial Logic Factory 🏆🏁
