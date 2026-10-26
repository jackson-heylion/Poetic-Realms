import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");
const sandbox = {};
runInNewContext(read("assets/agent-prompt.js"),sandbox,{filename:"assets/agent-prompt.js"});
const build = sandbox.PoeticRealmsAgentPrompt?.buildPrompt;
assert.equal(typeof build,"function","missing generator");
const works = JSON.parse(read("data/poems.json")).poems;
assert(works.length>0,"empty catalog");

for(const p of works) {
 const prompt=build(p);
 assert(prompt.includes("《"+p.title+"》"),p.id+" missing title");
 assert(prompt.includes("馆藏条目 ID："+p.id),p.id+" missing stable ID");
 assert(prompt.includes("scenes/"+p.id+".html"),p.id+" missing canonical scene path");
 assert(prompt.includes("Hardness："+p.hardness),p.id+" missing hardness");
 assert(prompt.includes(p.excerpt),p.id+" missing excerpt");
 assert(prompt.includes(p.visualBrief),p.id+" missing visual brief");
 assert(prompt.includes("node scripts/validate.mjs"),p.id+" missing CI instructions");
 assert(prompt.includes("Assignee"),p.id+" missing real issue ownership check");
 assert(prompt.includes("PR"),p.id+" missing submission instructions");
 assert(prompt.includes("model=<"),p.id+" missing claim command");
 assert(prompt.includes(p.transcription.text[0]),p.id+" missing complete text");
 if(p.issueNumber) {
  assert(prompt.includes("/issues/"+p.issueNumber),p.id+" wrong issue link");
  assert(prompt.includes("Closes #"+p.issueNumber),p.id+" wrong PR closure");
 } else {
  assert(prompt.includes("先检查同名/同 ID"),p.id+" missing issue creation");
  assert(prompt.includes("新建Issue编号"),p.id+" missing placeholder issue reference");
 }
 if(p.scenePath)assert(prompt.includes("已有场景原型"),p.id+" must preserve existing work");
}
const index=read("index.html"),app=read("assets/app.js");
const scriptBefore=index.indexOf('src="assets/agent-prompt.js"'),scriptAfter=index.indexOf('src="assets/app.js"');
assert(scriptBefore>=0&&scriptAfter>scriptBefore,"prompt JS must load before main app");
for(const needle of ['class="copy-agent-btn"','class="task-copy"','class="detail-copy"','addEventListener("click",handleCopyClick)']) {
 assert(app.includes(needle),"missing copy control: "+needle);
}
assert(index.includes('id="copy-status"'),"missing clipboard status announcement");
assert.throws(()=>build({id:"../danger"}),/ID/,"bad IDs must be rejected");
console.log("PASS "+works.length+" per-poem prompts, issue ownership and copy integration");
