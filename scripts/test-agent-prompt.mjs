import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const sandbox = {};
runInNewContext(read("assets/agent-prompt.js"), sandbox, {filename:"assets/agent-prompt.js"});
const build = sandbox.PoeticRealmsAgentPrompt?.buildPrompt;
assert.equal(typeof build, "function", "missing generator");

const works = JSON.parse(read("data/poems.json")).poems;
assert(works.length > 0, "empty catalog");

for (const poem of works) {
  const expected = "根据以下诗句自由发挥，用单个 HTML 文件生成一个 3D 动态场景：\n\n" + poem.excerpt.trim();
  assert.equal(build(poem), expected, poem.id + " unexpected extra instructions");
}
assert.throws(() => build({}), /诗句/, "missing excerpt must fail");

const index = read("index.html"), app = read("assets/app.js");
const first = index.indexOf('src="assets/agent-prompt.js"');
const second = index.indexOf('src="assets/app.js"');
assert(first >= 0 && second > first, "prompt generator must load first");
for (const needle of ['class="copy-agent-btn"', 'class="task-copy"', 'class="detail-copy"', 'addEventListener("click",handleCopyClick)']) {
  assert(app.includes(needle), "missing copy UI: " + needle);
}
assert(index.includes('id="copy-status"'), "missing clipboard feedback");
console.log("PASS " + works.length + " minimal poetry-to-HTML-3D prompts and copy controls");
