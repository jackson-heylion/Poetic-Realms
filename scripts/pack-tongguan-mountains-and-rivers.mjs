import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "node:vm";

// 浏览与部署只使用成品 HTML；本脚本同步分工源码、许可证与 three.js。
const root = new URL("../", import.meta.url);
const folder = new URL("scenes/tongguan/mountains-and-rivers/", root);
const target = new URL("scenes/tongguan/mountains-and-rivers.html", root);
const read = (path) => readFileSync(new URL(path, folder), "utf8");
const parts = ["runtime", "landscape", "architecture", "ui"];
const engine = readFileSync(new URL("vendor/three-r160.min.js", root), "utf8");
const license = readFileSync(
  new URL("vendor/three-r160.LICENSE.txt", root),
  "utf8",
);
const code =
  '(function () {\n"use strict";\n' +
  parts
    .map(
      (part) =>
        "\n/* mountains-and-rivers/" + part + ".js */\n" + read(part + ".js"),
    )
    .join("\n") +
  "\n})();";

new Script(engine, { filename: "three-r160.min.js" });
new Script(code, { filename: "mountains-and-rivers.html" });
const result = read("shell.html")
  .replace(
    "<!-- SCENE_STYLE -->",
    () => "<style>\n" + read("scene.css") + "</style>",
  )
  .replace(
    "<!-- SCENE_ENGINE -->",
    () =>
      "<!--\nthree.js r160 · MIT\n" +
      license +
      "-->\n<script>\n" +
      engine +
      "\n</script>",
  )
  .replace("<!-- SCENE_SCRIPT -->", () => "<script>\n" + code + "\n</script>");

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result)
    throw Error(
      "请运行 node scripts/pack-tongguan-mountains-and-rivers.mjs 同步成品",
    );
  console.log("PASS 潼关成品与源码一致");
} else {
  writeFileSync(target, result);
  console.log("已生成 scenes/tongguan/mountains-and-rivers.html");
}
