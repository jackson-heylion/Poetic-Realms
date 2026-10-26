# 诗境 · Poetic Realms

> 山河入诗，一念成境。以中国古典诗词为索引，构建开放共建的沉浸式 3D 场景博物馆。

**在线展馆（启用 GitHub Pages 后）**：https://jackson-heylion.github.io/Poetic-Realms/

## 当前内容

- **126 条首批候选诗词、词曲及景观相关古文**，跨先秦、两汉、魏晋、南北朝、唐、宋、元、明、清。保存诗题、作者、体裁、原文摘句、景观标签、场景创意、制作难度、文本校勘状态。
- **静态导航站**：搜索诗题/作者/诗句/意象，按朝代、景观、体裁、难度、制作状态筛选，查看场景详情。
- **首个可交互 WebGL 原型**：[《江雪》](scenes/jiangxue.html)，支持旋转、缩放、动态降雪、画质切换与暂停；单 HTML，可离线打开。
- **GitHub Issue 任务池**：首批 10 道 3D 场景任务。AI Agent 与贡献者按 `/claim model=... tool=...` 认领，领取工作流尽力自动分配 Assignee；PR 合并前人工审核。
- **CI 结构校验**：JSON 唯一性、字段约束、站内资源引用及脚本语法。

> 重要：第一批属于**策展候选清单**，原文仅录摘句，均标记「待校勘」。不得把目录当作古籍校定本，不得把 AI 生成的古建/地形当作历史现场。

## 访问 GitHub Pages

仓库采用**纯静态 HTML + CSS + JS + JSON**，无需 Node 构建，无服务端依赖，所有站内资源均使用相对路径，适配项目子路径 `/Poetic-Realms/`。

首次开启需在本仓库 **Settings → Pages → Build and deployment** 选择：

- **Source**: Deploy from a branch
- **Branch**: `main`
- **Folder**: `/(root)`

保存后访问 https://jackson-heylion.github.io/Poetic-Realms/ 。本仓库连接器无法修改 Pages 的仓库设置，因此这项需要仓库管理员完成。发布状态以 GitHub Settings / Actions 为准，勿将预测地址当作已上线证明。

## 本地运行

```bash
python3 -m http.server 8000
# http://localhost:8000/  （index.html 需要 HTTP 访问以加载 JSON）
node scripts/validate.mjs
```

`scenes/*.html` 应支持直接双击离线运行，不依赖 CDN、API 或打包资源。

## 目录

```text
index.html                   主展馆 / 搜索导航 / 任务入口
assets/                      原生静态站样式、JS、图标
data/poems.json              诗词记录与场景元数据唯一数据源
scenes/{id}.html             各场景独立自包含 HTML
docs/CATALOG_RULES.md        分类与校勘规则
docs/AGENT_WORKFLOW.md       Agent 领取、模型和难度标签、交付标准
scripts/validate.mjs         数据、引用、JavaScript 检查
.github/ISSUE_TEMPLATE/       新题提报
.github/workflows/           CI / Issue 认领
```

## 参与共建

1. 在 [Issues](https://github.com/jackson-heylion/Poetic-Realms/issues?q=is%3Aissue+is%3Aopen+label%3Ascene) 选择题目，回复 `/claim model=GPT-6 tool=WebGL1`（模型与工具填写实际使用者）。
2. 等待 Issue 状态显示 `in-progress` 且 Assignee 正确。若自动分配未成功，由维护者手动确认；未确认前不要宣称占有。
3. 创建 `scenes/<poem-id>.html`，附场景信息更新至 `data/poems.json`，提交 PR 关联 Issue。
4. 通过结构验证、设备体验、原文与历史事实校验后再合并。

更多见 [Agent 工作协议](docs/AGENT_WORKFLOW.md)、[馆藏规范](docs/CATALOG_RULES.md)。

## 数据来源与版权边界

首批条目由经典作品人工选题与 AI 辅助整理，尚未逐首对照指定版本校勘。候选参考数据集：[chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)、[open-chinese/poetry-collection](https://github.com/open-chinese/poetry-collection)。**这两个链接是后续核对线索，不代表每一条当前已经从其直接验证或复制**。引入第三方转录、译文、注释、图片或音频前须核对其许可与来源；古诗文原作的年代与现代整理成果的权利应分开处理。

本仓库将模型/工具/Hardness 作为**创作过程元数据**，而不是给诗歌分优劣等级。
