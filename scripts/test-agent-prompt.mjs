import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const sandbox = {};
runInNewContext(read("assets/agent-prompt.js"), sandbox, {filename:"assets/agent-prompt.js"});
const build = sandbox.PoeticRealmsAgentPrompt?.buildPrompt;
assert.equal(typeof build, "function", "missing generator");
assert.equal(sandbox.PoeticRealmsAgentPrompt?.buildSubmissionPrompt, undefined,
  "creation and submission prompts must be merged into one");

const works = JSON.parse(read("data/poems.json")).poems;
assert(works.length > 0, "empty catalog");

for (const poem of works) {
  const prompt = build(poem);
  const head = prompt.split("\n")[0];
  assert.equal(head, "使用html制作3d动态写实场景：" + poem.excerpt.trim(), poem.id + " creation line changed");
  assert(!prompt.includes("。。") && !prompt.includes("！。") && !prompt.includes("？。"),
    poem.id + " duplicated sentence mark");
  for (const token of [
    "https://github.com/jackson-heylion/Poetic-Realms",
    "作品 ID：" + poem.id,
    "scenes/" + poem.id + "/<作品英文名>.html",
    "data/poems.json",
    "scenes 数组",
    "node scripts/validate.mjs",
    "Pull Request"
  ]) {
    assert(prompt.includes(token), poem.id + " prompt missing: " + token);
  }
  assert(!prompt.includes("/claim"), poem.id + " prompt should not impose issue claim workflow");
  assert(!/WebGL|Shader|Canvas 必须|three\.js/i.test(prompt), poem.id + " prompt must not pin a tech stack");
  assert(Array.isArray(poem.scenes), poem.id + " scene list missing");
}
assert.throws(() => build({}), /诗句/, "missing excerpt must fail");
assert.throws(() => build({excerpt:"千山鸟飞绝。"}), /作品 ID/, "missing work id must fail");

const index = read("index.html");
const catalog = read("catalog.html");
const app = read("assets/app.js");
const stage = read("assets/stage.js");

const order = ["assets/poems-data.js", "assets/agent-prompt.js", "assets/clipboard.js", "assets/stage.js"]
  .map(f => index.indexOf('src="' + f + '"'));
assert(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), "theatre must load shared scripts first");
for (const needle of ['class="theater"', 'id="stage-frame"', 'src="scenes/jiangxue/snow-mountains.html"', 'id="stage-next"', 'id="copy-status"']) {
  assert(index.includes(needle), "homepage missing: " + needle);
}
for (const needle of ["stage-next", "shuffled(", "history.replaceState"]) {
  assert(stage.includes(needle), "theatre logic missing: " + needle);
}

for (const needle of ['src="assets/app.js"', 'id="catalog-grid"', 'id="copy-status"', 'id="search"']) {
  assert(catalog.includes(needle), "catalogue page missing: " + needle);
}
for (const needle of ['class="copy-btn', 'data-copy="', 'addEventListener("click", PoeticRealmsClipboard.handleCopyClick)']) {
  assert(app.includes(needle), "missing copy UI: " + needle);
}
assert(!app.includes("data-copy-submission") && !app.includes("buildSubmissionPrompt"),
  "secondary submission action should be gone");

const gallery = read("gallery.html"), controller = read("assets/gallery.js");
assert(gallery.includes('id="gallery-frame"') && gallery.includes('id="gallery-options"'), "missing multi-scene viewer");
assert(controller.includes("setSelected(") && controller.includes("offset("), "scene version switch missing");
assert(app.includes("gallery.html?poem=") && stage.includes("gallery.html?poem="), "scene links must open gallery");

const sample = works.find(p => p.scenes.length > 0);
assert(sample && sample.scenes[0].path.startsWith("scenes/"), "first registered scene missing");
const two = {...sample, scenes:[...sample.scenes, {id:"alternative", title:"另一种诗境", path:"scenes/jiangxue/alternative.html", model:"自选", tools:[], status:"prototype"}]};
assert(two.scenes.length === sample.scenes.length + 1 && new Set(two.scenes.map(x => x.path)).size === two.scenes.length,
  "multiple HTML paths allowed");
console.log("PASS " + works.length + " merged creation + submission prompts, fullscreen theatre, catalogue and gallery");
