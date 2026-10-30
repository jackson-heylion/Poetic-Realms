# Poetic Realms · AI Agent 任务协议

## 1. 领取题目

- 打开带 `scene` + `available` 标签的 Issue，核对诗题、摘句、景观、H 难度。
- 用已登录 GitHub 账号评论 `/claim model=GPT-6 tool=WebGL1`。命令格式至少含实际模型与工具，不填虚假标签；独立 Agent 可使用自己的 GitHub 账号。
- 工作流检查 Issue 是否空闲；可分配账号会被加为 Assignee、从 `available` 转为 `in-progress`。权限不足、占用或并发冲突时，工作流评论原因，不视为已领取。
- **站点是展示层，GitHub Issue + Assignee 才是领取状态的准绳**。站点不存 GitHub Token，不直接从浏览器写 Issues。
- 如需换人、放弃，由维护者解除分配并恢复 `available`；不要使用强制推送抢任务。

## 2. 生成与交付

1. 先核对诗文、列出诗句支持的意象，并注明艺术加工。
2. 明确场景镜头、空间布局、光照天气、动态规律、交互方式和性能预算。
3. 从最新 main 新建分支，一篇诗可收录多个自包含 HTML。保留旧 `scenes/{id}.html`，新作品交付 `scenes/{id}/{variant-id}.html`，不引入 CDN、不请求远程 API、不引用站点样式、无需打包。
4. 场景优先真实三维 WebGL（WebGL1 兼容主流手机），纯 CSS/2D 不能伪装成 3D。允许根据题目选择 Canvas2D，但须如实记录方法。
5. 在 `data/poems.json` 的该首诗 `scenes[]` 追加一条：`id`（本诗唯一）、`title`、`path`、`model`、`tools[]`、`status=prototype`；将该诗 `sceneStatus` 调整为 `prototype`，不得覆盖别人的版本。`scenePath` 是旧版兼容字段，新投稿不用设置。
6. 提交 PR，填写 `Closes #issue-number`、所用模型完整名称/版本、使用工具及版本、关键画面截图、运行环境、性能表现与已知缺陷。

## 3. Hardness 指南

| 等级 | 典型目标 |
|---|---|
| H1 | 一至两个主要意象，少量静态几何与简单运动 |
| H2 | 多物体和天气变化、相机控制、基本材质 |
| H3 | 多层地形/建筑/水面/粒子，交互与移动端优化 |
| H4 | 大范围景观、真实水体/体积天气、复杂光照及质量等级 |
| H5 | 大规模场景、跨时段变化、复杂群体运动/反射或历史环境考证 |

Hardness 是**预估任务工程难度**，允许 PR 复核调整。

## 4. 最低验收

- 原文出处、名句与场景逻辑一致；历史与艺术加工边界可解释。
- 场景本地 `file://` 可打开、首次可见、核心操作可用；桌面和常见手机浏览器的帧率须报告实测，**不编造数字**。
- 降低设备像素比或提供画质调节；暂停不可见页面动画；限制粒子/绘制调用/Shader 循环成本。
- WebGL vertex 和 fragment 的同名 uniform **类型与浮点精度完全一致**；需处理 Shader 编译/链接失败、WebGL 无法获取与 context lost。
- 不暴露账号令牌、不执行陌生远程脚本、不获取用户定位；文字、音频、贴图、模型注明合法来源。
- `node scripts/validate.mjs`、站点跳转、对应场景移动端真实浏览均通过。
- 经审查才由 prototype 改为 published，不能仅因存在文件自动宣称成品。

## 5. 标签约定

`scene`、`available`、`in-progress`、`review`、`published`、`hardness:H1`~`hardness:H5`。模型与工具的实际值**先写 Issue 认领命令和 PR**；后续可按稳定名称补充 `model:<name>` 和 `tool:<name>` 标签。不得把 `model=unassigned` 解释成已经由模型执行。

## 6. 网页一键复制极简创作提示词

在诗词卡片、详情或创作大厅点击「复制创作提示词」，将下面这段文字交给任意 AI：

```text
使用html制作3d动态写实场景：<此作品的诗句摘录>。
```

**复制提示词仅用于自由创作**，不包含 GitHub 链接、Issue、PR、Hardness、模型、工具、测试或其他开发约束。需向本仓库提交作品时，可再独立遵循本文件前述 Issue 和 PR 贡献流程；它们不应添加到一键复制内容中。

## 7. 复制交作业提示词 / 一诗多境

「复制创作提示词」继续仅提供诗句和单 HTML 动态 3D 场景要求，供 AI 自由发挥。

第二个独立按钮「复制交作业提示词」用于已完成创作的投稿：引导有 GitHub 权限的 Agent 将新 HTML 保存到 `scenes/{poem-id}/{variant-id}.html`，追加 `data/poems.json` 的 `scenes[]` 元数据，最后提交 Pull Request 并返回链接。没有写入权限则说明阻断，不得虚构交付。

多个作者可就同一首诗提交不同 HTML。保留现有 `scenes/{poem-id}.html`；重复的 `id` 或文件路径会被 CI 拦截。页面从 `gallery.html?poem={poem-id}` 进入版本展厅，可切换版本或单独打开，切换时只加载一个渲染 iframe，避免多 WebGL 实例同时运行。
