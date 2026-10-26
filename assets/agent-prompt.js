/* 可复用的 Agent 交付提示词生成器：静态页和 CI 共用。 */
(function (root) {
  "use strict";
  const REPO = "https://github.com/jackson-heylion/Poetic-Realms";

  function buildPrompt(poem) {
    if (!poem || !/^[a-z0-9-]+$/.test(String(poem.id || ""))) {
      throw new TypeError("缺少合法诗境 ID");
    }
    const issue = Number.isInteger(poem.issueNumber) && poem.issueNumber > 0
      ? REPO + "/issues/" + poem.issueNumber
      : null;
    const scenePath = "scenes/" + poem.id + ".html";
    const references = (poem.sources || []).slice(0, 3).map((s, i) =>
      (i + 1) + ". " + (s.collection || s.work || "出处") + "：" + (s.url || "待补充")
    ).join("\n") || "请从 data/poems.json 中查阅并补充可靠来源";
    const text = poem.transcription && Array.isArray(poem.transcription.text)
      ? poem.transcription.text.join("\n")
      : poem.excerpt || "请读取仓库原文";

    const lines = [
      "你是本项目的 AI Agent 开发者。请在当前执行环境中实际完成以下诗境任务，不要只提出方案，也不要假称已推送或已通过测试。",
      "",
      "【项目与题目】",
      "GitHub 仓库：" + REPO,
      "馆藏条目 ID：" + poem.id + "（场景文件名以此 ID 为准，勿用 Issue 标题里的别名）",
      "作品：《" + (poem.title || "") + "》",
      "作者/时代：" + (poem.author || "待考") + " / " + (poem.dynasty || "待考"),
      "景观标签：" + (poem.categories || []).join("、"),
      "Hardness：" + (poem.hardness || "待评估"),
      "交付文件：" + scenePath,
      "目录记录：data/poems.json 中 id=" + poem.id,
      "制作现状：" + (poem.scenePath ? "已有场景原型 " + poem.scenePath + "，先检查并改进，不能无故推倒重做" : "尚无场景文件，需要新建"),
      "Issue：" + (issue || "尚未建立，请先确认未与其他任务重复，再用 GitHub Issue 模板创建题目"),
      "",
      "【诗词依据与创作要求】",
      "重点诗句：" + (poem.excerpt || "见仓库"),
      "场景要求：" + (poem.visualBrief || "依据原文提取可视化意象"),
      "文本校勘状态：" + (poem.textReview || "待核"),
      "版本与地望注意：" + (poem.sourceNote || "请核查来源和可能的艺术加工"),
      "文本来源（在线版本只是线索，不等于纸本校定）：",
      references,
      "电子全文（请与仓库最新数据及来源核对，注意异文）：",
      text,
      "",
      "【执行顺序——务必真实执行】",
      "1. 打开并检查仓库 main 的 AGENTS.md、docs/AGENT_WORKFLOW.md、docs/CATALOG_RULES.md、对应 Issue、data/poems.json 与现有场景；以仓库和 Issue 最新状态为准，静态站显示的待制作状态可能滞后。",
      issue
        ? "2. 先检查 " + issue + " 的 open/closed、标签和 Assignee。仅在 issue 为 open、含 scene 和 available 标签且无人认领时，用当前已授权的 GitHub 账号评论 /claim model=<你实际使用的模型> tool=<你实际使用的技术>；等待分配 Assignee 且标签变成 in-progress 才算领题成功。若 Assignee 已是当前执行账号且状态为 in-progress，直接继续现有任务，不重复认领；若已被别人认领，不得抢占或擅改，立即说明并停止本题开发；若自动认领失败，联系维护者确认后再动手。"
        : "2. 若没有 Issue，先检查同名/同 ID 任务；通过仓库模板创建 Issue，记录新编号到本条数据的 issueNumber，再按 /claim model=<实际模型> tool=<实际技术> 认领，并等待 Assignee 和 in-progress 确认；不能仅凭创建 Issue 就宣称领题成功。",
      "3. 从 main 创建独立分支，先分析诗句里的真实意象与艺术想象边界；写出简短可执行的场景目标与性能预算，不必为简单实现撰写冗长规格书。",
      "4. 实际编写或改进 " + scenePath + "，交付一个完全自包含、可离线用 file:// 运行的 HTML。默认尽量采用 WebGL1 与原生 JS 的真实 3D，不依赖 CDN、远程 API、额外构建器。支持拖动/触控、缩放、暂停与画质调节，照顾低端 PC 和手机。",
      "5. 对应更新 data/poems.json 中该条的 scenePath、sceneStatus=prototype、实际 model 与 tools；保持 ID、原文来源和待校勘状态不被误改。首次交付不擅自标记 published，也不覆盖无关条目。",
      "6. 验证：执行 node scripts/validate.mjs，实际用浏览器查看画面与交互，检查控制台、手机适配、文件离线启动、失去 WebGL 上下文处理。Vertex/Fragment 同名 uniform 的类型和精度必须完全一致。帧率、截图与测试结果只填真实测得的值。",
      "7. 提交代码并创建指向 main 的 PR。PR 描述必须包含：" + (issue ? "Closes #" + poem.issueNumber : "Closes #<新建Issue编号>") + "、实现摘要、原文与艺术加工说明、模型和工具版本、测试命令与结果、设备/帧率（无实测则明确写未测）、关键截图、已知问题。等待 CI 和维护者审核，不擅自合并。",
      "8. 最终回复仅报告真实结果：Issue 认领状态、分支/提交 SHA、PR 链接、实际通过的验证以及剩余阻断；若 GitHub 写权限或浏览器测试环境缺失，明确阻断并交付可复用的代码/补丁，不得虚构 PR 或验收。",
      "",
      "目标是产出可供教学与沉浸式体验的作品，兼顾文学依据、视觉质量、移动端性能和代码可维护性。现在开始按以上步骤直接执行。"
    ];
    return lines.join("\n");
  }

  root.PoeticRealmsAgentPrompt = Object.freeze({ buildPrompt });
})(globalThis);
