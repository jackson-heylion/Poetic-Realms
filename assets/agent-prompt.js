/* 一条提示词走完全程：给 AI 的创作要求 + 做完之后怎么把作品交回仓库。
   诗句摘录自带句末标点，这里不再补句号。 */
(function (root) {
  "use strict";

  var REPO = "https://github.com/jackson-heylion/Poetic-Realms";

  function buildPrompt(poem) {
    if (!poem || typeof poem.excerpt !== "string" || !poem.excerpt.trim()) {
      throw new TypeError("缺少诗句");
    }
    if (!/^[a-z0-9-]+$/.test(String(poem.id || ""))) {
      throw new TypeError("缺少有效作品 ID");
    }
    var title = typeof poem.title === "string" && poem.title.trim() ? poem.title.trim() : "";
    var author = [poem.dynasty, poem.author].filter(function (x) {
      return typeof x === "string" && x.trim();
    }).join(" · ");
    var line = title ? "《" + title + "》" + (author ? "　" + author : "") : "";

    return [
      "使用html制作3d动态写实场景：" + poem.excerpt.trim(),
      "",
      "场景完成后，把作品提交回诗境仓库：",
      REPO,
      "",
      (line ? "作品：" + line + "　" : "") + "作品 ID：" + poem.id,
      "",
      "交付步骤：",
      "1. 做成单个 HTML 文件，存为 scenes/" + poem.id + "/<作品英文名>.html。画面里要能直接读到这首诗：题名、朝代与作者、摘句，排版不压住主体景物。技术栈不限，可用国内公共 CDN 加载开源三维库（baomitu、bootcdn、jsdelivr 等），首个镜像 10 秒不通就换下一个；不请求业务接口、不引用站点样式。",
      "2. 在 data/poems.json 找到作品 ID 为 " + poem.id + " 的条目，向 scenes 数组追加一项：id、title、path、model、tools、status（prototype）。新 id 与 path 不得与已有版本重复，也不要覆盖别人的文件。",
      "3. 运行 node scripts/validate.mjs，通过后从最新 main 切分支提交 Pull Request。",
      "4. 回复里给出 PR 链接、所用模型与工具、实测帧率与已知缺陷。",
      "",
      "没有仓库写入权限就停下说明原因，给出改好的文件和手动提交步骤，不要声称已经提交。"
    ].join("\n");
  }

  root.PoeticRealmsAgentPrompt = Object.freeze({ buildPrompt: buildPrompt, repo: REPO });
})(globalThis);
