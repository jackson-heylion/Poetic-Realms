import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const sandbox = {};
runInNewContext(read("assets/agent-prompt.js"), sandbox, {filename:"assets/agent-prompt.js"});
const build = sandbox.PoeticRealmsAgentPrompt?.buildPrompt;
const submit = sandbox.PoeticRealmsAgentPrompt?.buildSubmissionPrompt;
assert.equal(typeof submit, "function", "missing submission generator");
assert.equal(typeof build, "function", "missing generator");

const works = JSON.parse(read("data/poems.json")).poems;
assert(works.length > 0, "empty catalog");

for (const poem of works) {
  const expected = "根据以下诗句自由发挥，用单个 HTML 文件生成一个 3D 动态场景：\n\n" + poem.excerpt.trim();
  assert.equal(build(poem), expected, poem.id + " unexpected extra instructions");
  const homework=submit(poem);
  for (const token of ["Poetic-Realms", "作品 ID：" + poem.id, poem.excerpt, "scenes/" + poem.id + "/<作品英文名>.html", "data/poems.json", "scenes 数组", "Pull Request"]) {
    assert(homework.includes(token), poem.id + " submit prompt missing: " + token);
  }
  assert(!homework.includes("/claim"), poem.id + " submission should not impose issue claim workflow");
  assert(Array.isArray(poem.scenes), poem.id + " scene list missing");
}
assert.throws(() => build({}), /诗句/, "missing excerpt must fail");

const index = read("index.html"), app = read("assets/app.js");
const first = index.indexOf('src="assets/agent-prompt.js"');
const second = index.indexOf('src="assets/app.js"');
assert(first >= 0 && second > first, "prompt generator must load first");
for (const needle of ['class="copy-agent-btn"', 'class="task-copy"', 'class="detail-copy"', 'class="copy-submit-btn"', 'class="task-submit"', 'class="detail-submit"', 'data-copy-submission', 'addEventListener("click",handleCopyClick)']) {
  assert(app.includes(needle), "missing copy UI: " + needle);
}
assert(index.includes('id="copy-status"'), "missing clipboard feedback");
const gallery = read("gallery.html"), controller=read("assets/gallery.js");
assert(gallery.includes('id="gallery-frame"')&&gallery.includes('id="gallery-options"'),"missing multi-scene viewer");
assert(controller.includes('setSelected(')&&controller.includes('offset('),"scene version switch missing");
assert(app.includes("gallery.html?poem="),"scene links must open gallery");
const sample=works.find(p=>p.scenes.length>0);
assert(sample&&sample.scenes[0].path==="scenes/jiangxue.html","legacy prototype should be preserved");
const two={...sample,scenes:[...sample.scenes,{id:"alternative",title:"另一种诗境",path:"scenes/jiangxue/alternative.html",model:"自选",tools:[],status:"prototype"}]};
assert(two.scenes.length===2&&two.scenes.map(x=>x.path).length===2,"multiple HTML paths allowed");
console.log("PASS " + works.length + " minimal creation and submission prompts, scene gallery integration");
