# AGENTS.md — Poetic Realms

本仓库以中国古典诗词为依据，用独立 HTML 制作可探索的动态三维诗境。优先追求最低的**有效交付总成本**：简单改动直接完成，复杂场景先明确文学依据、画面目标、性能预算和验证方式。

## 任务与所有权

- 创建或领取场景前，先读 `docs/AGENT_WORKFLOW.md` 和 `docs/CATALOG_RULES.md`。
- 以 GitHub Issue 的 `scene`、`available` 标签筛选任务。用 `/claim model=<实际模型> tool=<实际工具>` 认领；**只有被分配 Assignee 且转为 in-progress 才算成功**。失败时不要冒充已领取。
- 只修改所领取题目及必要的公共结构；避免并行 Agent 冲突。修改任务状态须与维护者协调。
- 使用真实的模型/工具/Hardness 标记；不猜测测试结果、不伪造素材出处。

## 文学与数据

- `data/poems.json` 为目录唯一数据源。ID 稳定，新增前先查重。
- 原文摘句只作策展入口；完整正文、字词、异文、作者、年代、地望要有可核对来源。未校勘状态不可自行改成“已校勘”。
- 将诗文可支持的景物与合理艺术加工区分开；历史复原须有另外的史料证据。
- 难度 H1–H5 评价工程工作量，不评价作品文学水平。分类支持多标签。

## 工程交付

- `index.html` 是 GitHub Pages 根入口。所有站内链接**使用相对路径**，适配 `/Poetic-Realms/` 子目录。项目无需构建器与后端。
- 一个场景一个 `scenes/{id}.html`，自包含 WebGL/HTML/CSS/JS，能离线启动，禁止外部 CDN、账号令牌和未经授权的 API。
- WebGL 同名 uniform 的类型、精度在 vertex/fragment 必须一致；需要编译、链接与 context-lost 错误提示。
- 移动端限制 DPR、粒子数与 draw calls，提供画质调节或相应降级；后台不可持续高负载渲染。
- 提交前执行 `node scripts/validate.mjs`；在实际桌面/移动端浏览器测试交互、首帧、资源加载和控制台。不要把仅通过语法校验写成视觉验收成功。
- 每个 PR 写明 Issue、模型/工具及版本、关键实现、改动路径、实测设备与结果、遗留问题。验证通过后才允许更新 `sceneStatus` 为 `published`。

详细工作流以 `docs/AGENT_WORKFLOW.md` 为准。
