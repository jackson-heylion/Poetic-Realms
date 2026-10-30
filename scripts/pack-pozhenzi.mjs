import { readFileSync, writeFileSync } from "node:fs";
import { Script } from "node:vm";

// 仅供维护时拼装源码；交付的 HTML 已包含全部内容，浏览时不需要构建工具。
const directory = new URL("../scenes/pozhenzi/", import.meta.url);
const read = (name) => readFileSync(new URL("src/" + name, directory), "utf8");
const parts = [
  "math",
  "webgl",
  "shaders-environment",
  "shaders-solid",
  "shaders-effects",
  "geometry",
  "terrain",
  "camp",
  "props",
  "particles",
  "assembly",
  "render",
  "controls",
];
const code =
  '(function () {\n"use strict";\n' +
  parts
    .map((name) => "\n/* 源码：src/" + name + ".js */\n" + read(name + ".js"))
    .join("\n") +
  "\n})();";
new Script(code, { filename: "lamplight-sword.html" });
const result = read("shell.html")
  .replace(
    "<!-- SCENE_STYLE -->",
    () => "<style>\n" + read("scene.css") + "</style>",
  )
  .replace("<!-- SCENE_SCRIPT -->", () => "<script>\n" + code + "\n</script>");
const target = new URL("lamplight-sword.html", directory);
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result)
    throw new Error(
      "破阵子成品与源码不一致，请运行 node scripts/pack-pozhenzi.mjs",
    );
  console.log("PASS 破阵子独立 HTML 与分层源码一致");
} else {
  writeFileSync(target, result);
  console.log("已生成独立离线诗境：scenes/pozhenzi/lamplight-sword.html");
}
