/* 一诗一句、一条要求：供静态展馆一键复制的极简创作提示词。 */
(function (root) {
  "use strict";

  function buildPrompt(poem) {
    if (!poem || typeof poem.excerpt !== "string" || !poem.excerpt.trim()) {
      throw new TypeError("缺少诗句");
    }
    return "根据以下诗句自由发挥，用单个 HTML 文件生成一个 3D 动态场景：\n\n" + poem.excerpt.trim();
  }

  root.PoeticRealmsAgentPrompt = Object.freeze({ buildPrompt });
})(globalThis);
