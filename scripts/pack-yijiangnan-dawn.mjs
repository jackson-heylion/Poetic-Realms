import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "node:vm";

// 维护源码按职责拆分；成品内嵌引擎、样式、着色器与纹理生成代码。
const root = new URL("../", import.meta.url);
const folder = new URL("scenes/yijiangnan/dawn/", root);
const parts = ["runtime", "atmosphere", "landscape", "plants", "water", "controls"];
const read = (name) => {
  const source = readFileSync(new URL(name, folder), "utf8");
  const lines = source.split("\n").length - Number(source.endsWith("\n"));
  if (lines > 500) throw Error(name + " 超过手写文件 500 行上限");
  return source;
};
const engine = readFileSync(new URL("vendor/three-r160.min.js", root), "utf8");
const license = readFileSync(new URL("vendor/three-r160.LICENSE.txt", root), "utf8");
const code = "(function () {\n\"use strict\";\n" +
  parts.map((part) => "\n/* dawn/" + part + ".js */\n" + read(part + ".js")).join("\n") +
  "\n})();";
new Script(engine, { filename: "three-r160.min.js" });
new Script(code, { filename: "river-of-dawn.html" });
const result = read("shell.html")
  .replace("<!-- SCENE_STYLE -->", () => "<style>\n" + read("scene.css") + "\n</style>")
  .replace("<!-- SCENE_ENGINE -->", () =>
    "<!-- 自动生成的独立成品。编辑 dawn/ 源码后运行 pack-yijiangnan-dawn.mjs。\n" +
    "three.js r160 · MIT\n" + license + "-->\n<script>\n" + engine + "\n</script>")
  .replace("<!-- SCENE_SCRIPT -->", () => "<script>\n" + code + "\n</script>");
const target = new URL("scenes/yijiangnan/river-of-dawn.html", root);
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result) throw Error("春江初日成品与源码不一致，请重新拼装");
  console.log("PASS 春江初日独立成品与源码一致，手写源码各文件不超过 500 行");
} else {
  writeFileSync(target, result);
  console.log("已生成 scenes/yijiangnan/river-of-dawn.html");
}
