import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync(new URL("../assets/gallery.js",import.meta.url),"utf8");
class NodeStub {
 constructor(){this.items=[];this.dataset={};this.events={};this.attributes={};this.hidden=true;this.textContent="";this.src="";}
 addEventListener(type,handler){this.events[type]=handler;}
 append(child){this.items.push(child);}
 querySelectorAll(selector){return selector==="button"?this.items:[];}
 setAttribute(key,value){this.attributes[key]=value;}
}
const ids=["gallery-empty","gallery-frame","gallery-title","gallery-verse","gallery-detail","gallery-count","gallery-current","gallery-prev","gallery-next","gallery-standalone","gallery-options"];
const elements=Object.fromEntries(ids.map(id=>["#"+id,new NodeStub()]));
const document={
 title:"",
 querySelector:key=>elements[key],
 createElement:()=>new NodeStub()
};
const url="https://example.test/Poetic-Realms/gallery.html?poem=jiangxue&scene=alternate";
const history={url:"",replaceState(_a,_b,path){this.url=String(path);}};
const scenes=[
 {id:"original",title:"原版",path:"scenes/jiangxue.html",model:"GPT-6"},
 {id:"alternate",title:"新版本",path:"scenes/jiangxue/alternate.html",model:"其他"}
];
const fetch=async()=>({ok:true,json:async()=>({poems:[{
 id:"jiangxue",title:"江雪",excerpt:"千山鸟飞绝",scenes
}]})});
runInNewContext(source,{document,history,location:{href:url,search:new URL(url).search},URL,URLSearchParams,fetch,console},{filename:"assets/gallery.js"});
await new Promise(resolve=>setImmediate(resolve));
const frame=elements["#gallery-frame"],options=elements["#gallery-options"];
assert.equal(options.items.length,2,"two version buttons should render");
assert.equal(frame.src,scenes[1].path,"deep link selects alternate version");
assert.equal(options.items[1].attributes["aria-pressed"],"true");
assert(history.url.includes("scene=alternate"));
elements["#gallery-prev"].events.click();
assert.equal(frame.src,scenes[0].path,"previous switches to original HTML");
assert.equal(options.items[0].attributes["aria-pressed"],"true");
elements["#gallery-next"].events.click();
assert.equal(frame.src,scenes[1].path,"next switches back to alternate");
options.items[0].events.click();
assert.equal(frame.src,scenes[0].path,"direct version selection switches HTML");
frame.events.load();
assert.equal(frame.hidden,false,"loaded iframe visible");
assert.equal(elements["#gallery-empty"].hidden,true,"loading placeholder hidden");
console.log("PASS multi-HTML gallery: deep link, previous/next, direct selection and iframe load");
