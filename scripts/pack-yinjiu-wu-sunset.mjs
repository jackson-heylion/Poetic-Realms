import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "node:vm";

// 浏览与部署只使用成品 HTML；本脚本供维护时拼装 three.js 与分工源码。
const root = new URL("../", import.meta.url);
const folder = new URL("scenes/yinjiu-wu/sunset/", root);
const read = (path) => readFileSync(new URL(path, folder), "utf8");
const parts = ["runtime", "world", "props", "plants", "figure", "birds", "ui"];
const engine = readFileSync(new URL("vendor/three-r160.min.js", root), "utf8");
const license = readFileSync(
  new URL("vendor/three-r160.LICENSE.txt", root),
  "utf8",
);

const code =
  '(function () {\n"use strict";\n' +
  parts
    .map((part) => "\n/* sunset/" + part + ".js */\n" + read(part + ".js"))
    .join("\n") +
  "\n})();";

new Script(engine, { filename: "three-r160.min.js" });
new Script(code, { filename: "east-fence-sunset.html" });

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

const target = new URL("scenes/yinjiu-wu/east-fence-sunset.html", root);

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result)
    throw Error(
      "请运行 node scripts/pack-yinjiu-wu-sunset.mjs 同步 three.js 成品",
    );
  console.log("PASS three.js 东篱斜阳成品与源码一致");
} else {
  writeFileSync(target, result);
  console.log(
    "已生成 three.js 独立诗境：scenes/yinjiu-wu/east-fence-sunset.html",
  );
}
