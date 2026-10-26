import {readFileSync,existsSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/poems.json"));
const errors=[],ids=new Set(),issues=new Set();
const ok=(test,msg)=>{if(!test)errors.push(msg)};
ok(data.schemaVersion===1,"schemaVersion must be 1");
ok(Array.isArray(data.poems)&&data.poems.length>=100,"expected at least 100 entries");
for(const p of data.poems){
 ok(/^[a-z0-9-]+$/.test(p.id),"bad id: "+p.id);
 ok(!ids.has(p.id),"duplicate id: "+p.id);ids.add(p.id);
 for(const k of ["title","author","dynasty","form","excerpt","visualBrief","textReview"])ok(typeof p[k]==="string"&&p[k].trim().length>0,p.id+" missing "+k);
 ok(Array.isArray(p.categories)&&p.categories.length>0&&p.categories.every(x=>typeof x==="string"&&x.trim()),p.id+" invalid categories");
 ok(/^H[1-5]$/.test(p.hardness),p.id+" invalid hardness");
 ok(["available","prototype","published"].includes(p.sceneStatus),p.id+" invalid status");
 ok(["待校勘","已校勘"].includes(p.textReview),p.id+" invalid review status");
 ok(Array.isArray(p.tools),p.id+" missing tools");
 if(p.issueNumber!=null){ok(Number.isInteger(p.issueNumber)&&p.issueNumber>0,p.id+" invalid issue number");ok(!issues.has(p.issueNumber),p.id+" duplicate issue");issues.add(p.issueNumber);}
 if(p.scenePath){
  ok(p.scenePath==="scenes/"+p.id+".html",p.id+" scene path mismatched");
  ok(existsSync(new URL("../"+p.scenePath,import.meta.url)),p.id+" scene file missing");
  ok(typeof p.model==="string"&&p.model,p.id+" missing model");
  ok(p.tools.length>0,p.id+" missing tools");
 }else ok(p.sceneStatus==="available",p.id+" non-available scene missing file");
}
const index=read("index.html"),js=read("assets/app.js");
ok(index.includes('href="assets/site.css"'),"homepage stylesheet not relative");
ok(index.includes('src="assets/app.js"'),"homepage script not relative");
ok(index.includes("scenes/jiangxue.html"),"homepage demo missing");
try{new Script(js,{filename:"assets/app.js"});}catch(e){errors.push("app.js syntax: "+e.message)}
for(const p of data.poems.filter(x=>x.scenePath)){
 const html=read(p.scenePath),match=html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
 ok(!!match,p.id+" missing inline scene script");
 if(match)try{new Script(match[1],{filename:p.scenePath});}catch(e){errors.push(p.id+" scene syntax: "+e.message)}
 ok(!/<script[^>]+src=/i.test(html),p.id+" remote/local dependency script forbidden");
}
if(errors.length){console.error(errors.map(s=>"FAIL "+s).join("\n"));process.exit(1)}
console.log("PASS "+data.poems.length+" entries, "+ids.size+" unique IDs, "+issues.size+" task references, "+data.poems.filter(p=>p.scenePath).length+" scene files");
