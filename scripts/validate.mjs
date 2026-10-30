import {readFileSync,existsSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/poems.json"));
const errors=[],ids=new Set(),issues=new Set(),scenePaths=new Set();
const ok=(test,msg)=>{if(!test)errors.push(msg)};
ok(data.schemaVersion===3,"schemaVersion must be 3");
ok(Array.isArray(data.poems)&&data.poems.length>=100,"expected at least 100 entries");
for(const p of data.poems){
 ok(/^[a-z0-9-]+$/.test(p.id),"bad id: "+p.id);
 ok(!ids.has(p.id),"duplicate id: "+p.id);ids.add(p.id);
 for(const k of ["title","author","dynasty","form","excerpt","visualBrief","textReview"])ok(typeof p[k]==="string"&&p[k].trim().length>0,p.id+" missing "+k);
 ok(Array.isArray(p.categories)&&p.categories.length>0&&p.categories.every(x=>typeof x==="string"&&x.trim()),p.id+" invalid categories");
 ok(/^H[1-5]$/.test(p.hardness),p.id+" invalid hardness");
 ok(["available","prototype","published"].includes(p.sceneStatus),p.id+" invalid status");
 ok(["待版本校勘","已版本校勘"].includes(p.textReview),p.id+" invalid review status");
 ok(Array.isArray(p.tools),p.id+" missing tools");
 ok(Array.isArray(p.sources)&&p.sources.length>0,p.id+" missing text provenance");
 ok(["reference-reviewed","transcription-exact","transcription-near","unlocated"].includes(p.sourceStatus),p.id+" invalid source status");
 if(Array.isArray(p.sources))for(const s of p.sources){
  ok(typeof s.work==="string"&&s.work.length>0,p.id+" source missing work");
  ok(typeof s.url==="string"&&/^https:\/\//.test(s.url),p.id+" source missing HTTPS URL");
  ok(typeof s.kind==="string"&&s.kind.length>0,p.id+" source kind missing");
 }
 ok(p.transcription&&Array.isArray(p.transcription.text)&&p.transcription.text.length>0,p.id+" missing full electronic text");
 if(p.transcription){
  ok(["digital-exact-match","online-text-reviewed"].includes(p.transcription.mode),p.id+" invalid text origin");
  ok(Array.isArray(p.transcription.text)&&p.transcription.text.every(x=>typeof x==="string"&&x.trim()),p.id+" empty transcription paragraph");
  ok(typeof p.transcription.sourcePath==="string"&&p.transcription.sourcePath.length>0,p.id+" missing transcription locator");
  ok(typeof p.transcription.warning==="string"&&p.transcription.warning.length>0,p.id+" missing edition warning");
 }
 ok(typeof p.sourceNote==="string"&&p.sourceNote.length>0,p.id+" missing collation note");
 if(p.issueNumber!=null){ok(Number.isInteger(p.issueNumber)&&p.issueNumber>0,p.id+" invalid issue number");ok(!issues.has(p.issueNumber),p.id+" duplicate issue");issues.add(p.issueNumber);}
 ok(Array.isArray(p.scenes),p.id+" missing scenes array");
 const variants=Array.isArray(p.scenes)?p.scenes:[];
 ok(variants.length>0 ? p.sceneStatus!=="available" : p.sceneStatus==="available",p.id+" sceneStatus inconsistent with scene count");
 const local=new Set();
 for(const scene of variants){
  ok(scene&&/^[a-z0-9-]+$/.test(scene.id),p.id+" invalid scene id");
  ok(typeof scene.title==="string"&&scene.title.trim(),p.id+" missing scene title");
  ok(typeof scene.path==="string"&&new RegExp("^scenes/"+p.id+"(?:\\.html|/[a-z0-9-]+\\.html)$").test(scene.path),p.id+" invalid scene path");
  ok(["prototype","published"].includes(scene.status),p.id+" invalid scene status");
  ok(typeof scene.model==="string"&&scene.model.trim(),p.id+" scene missing model");
  ok(Array.isArray(scene.tools),p.id+" scene missing tools");
  ok(!local.has(scene.id),p.id+" duplicate scene id "+scene.id);local.add(scene.id);
  ok(!scenePaths.has(scene.path),p.id+" duplicate scene path "+scene.path);scenePaths.add(scene.path);
  ok(existsSync(new URL("../"+scene.path,import.meta.url)),p.id+" HTML file missing: "+scene.path);
 }
 if(p.scenePath!=null)ok(variants.some(x=>x.path===p.scenePath),p.id+" legacy scenePath not in scenes");
}
const audit=JSON.parse(read("data/source-audit.json"));
ok(audit.schemaVersion===1,"cross-reference audit schema should be v1");
for(const id of Object.keys(audit.entries||{}))ok(ids.has(id),"unreferenced source-audit id: "+id);
const index=read("index.html"),catalog=read("catalog.html"),js=read("assets/app.js");
ok(index.includes('href="assets/site.css"'),"homepage stylesheet not relative");
ok(index.includes('src="assets/stage.js"'),"theatre script not loaded");
ok(index.includes("scenes/jiangxue/snow-mountains.html"),"homepage demo missing");
ok(existsSync(new URL("../catalog.html",import.meta.url)),"catalog.html is missing");
ok(catalog.includes('src="assets/app.js"'),"catalogue script not relative");
ok(catalog.includes('href="assets/site.css"'),"catalogue stylesheet not relative");
try{new Script(js,{filename:"assets/app.js"});}catch(e){errors.push("app.js syntax: "+e.message)}
for(const scriptPath of ["assets/poems-data.js","assets/agent-prompt.js","assets/clipboard.js","assets/stage.js","assets/gallery.js"]){
 try{new Script(read(scriptPath),{filename:scriptPath});}catch(e){errors.push(scriptPath+" syntax: "+e.message)}
}
ok(existsSync(new URL("../gallery.html",import.meta.url)),"gallery.html is missing");
const gallery=read("gallery.html");
ok(gallery.includes('src="assets/gallery.js"'),"gallery JS not loaded");
ok(js.includes("gallery.html?poem="),"catalogue must link to scene galleries");
for(const path of scenePaths){
 const html=read(path),match=html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
 ok(!!match,path+" missing inline scene script");
 if(match)try{new Script(match[1],{filename:path});}catch(e){errors.push(path+" scene syntax: "+e.message)}
 ok(!/<script[^>]+src=/i.test(html),path+" remote/local dependency script forbidden");
}
if(errors.length){console.error(errors.map(s=>"FAIL "+s).join("\n"));process.exit(1)}
console.log("PASS "+data.poems.length+" sourced works, "+data.poems.filter(p=>p.transcription).length+" complete electronic texts, "+Object.keys(audit.entries||{}).length+" corpus matches, "+issues.size+" task references, "+scenePaths.size+" scene variants");
