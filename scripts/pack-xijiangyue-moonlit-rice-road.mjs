import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "node:vm";

// 浏览与部署只使用成品 HTML；本脚本把分工源码与 three.js 拼成一个自包含文件。
const root = new URL("../", import.meta.url);
const folder = new URL("scenes/xijiangyue/moonlit-rice-road/", root);
const read = (path) => readFileSync(new URL(path, folder), "utf8");
const parts = [
  "runtime",
  "sky",
  "world",
  "plants",
  "props",
  "birds",
  "life",
  "ui",
];
const engine = readFileSync(new URL("vendor/three-r160.min.js", root), "utf8");
const license = readFileSync(
  new URL("vendor/three-r160.LICENSE.txt", root),
  "utf8",
);

const code =
  '(function () {\n"use strict";\n' +
  parts
    .map((part) => "\n/* 明月别枝/" + part + ".js */\n" + read(part + ".js"))
    .join("\n") +
  "\n})();";

new Script(engine, { filename: "three-r160.min.js" });
new Script(code, { filename: "moonlit-rice-road.html" });

const result = read("shell.html")
  .replace(
    "<!-- SCENE_STYLE -->",
    () => "<style>\n" + read("scene.css") + "\n</style>",
  )
  .replace(
    "<!-- SCENE_ENGINE -->",
    () =>
      "<!--\nthree.js r160 · MIT\n" + license + "-->\n<script>\n" + engine + "\n</script>",
  )
  .replace("<!-- SCENE_SCRIPT -->", () => "<script>\n" + code + "\n</script>");

const target = new URL("scenes/xijiangyue/moonlit-rice-road.html", root);

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result)
    throw Error(
      "请运行 node scripts/pack-xijiangyue-moonlit-rice-road.mjs 同步成品",
    );
  console.log("PASS 明月别枝成品与源码一致");
} else {
  writeFileSync(target, result);
  console.log(
    "已生成独立诗境：scenes/xijiangyue/moonlit-rice-road.html",
  );
}
