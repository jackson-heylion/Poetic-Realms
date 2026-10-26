/* 一诗一句、一条要求：供静态展馆一键复制的极简创作提示词。 */
(function (root) {
  "use strict";

  function buildPrompt(poem) {
    if (!poem || typeof poem.excerpt !== "string" || !poem.excerpt.trim()) {
      throw new TypeError("缺少诗句");
    }
    return "根据以下诗句自由发挥，用单个 HTML 文件生成一个 3D 动态场景：\n\n" + poem.excerpt.trim();
  }

  function buildSubmissionPrompt(poem) {
    if (!poem || !/^[a-z0-9-]+$/.test(String(poem.id || ""))) {
      throw new TypeError("缺少有效作品 ID");
    }
    return [
      "请把为《" + poem.title + "》制作的一个或多个 3D 动态场景 HTML 交到这个 GitHub 仓库：",
      "https://github.com/jackson-heylion/Poetic-Realms",
      "",
      "作品 ID：" + poem.id,
      "诗句：" + poem.excerpt,
      "",
      "保留已有作品，每个新 HTML 分别存为 scenes/" + poem.id + "/<作品英文名>.html；",
      "在 data/poems.json 对应作品的 scenes 数组，为每个 HTML 分别追加一项（id、title、path、model、tools、status），让网站可以切换浏览所有版本。",
      "请提交 Pull Request 并返回链接。若没有 GitHub 写入权限，说明原因并提供文件和提交步骤。"
    ].join("\n");
  }

  root.PoeticRealmsAgentPrompt = Object.freeze({ buildPrompt, buildSubmissionPrompt });
})(globalThis);
