"use strict";
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={all:[],filtered:[],limit:18};
const filters=["search","dynasty","theme","form","hardness","model","tool","status"];
const CHOSEN=["山川","江河","湖泊","田园","边塞","春景","秋景","雪景","月夜","雨雾","古城","楼阁","瀑布","节庆"];
const github="https://github.com/jackson-heylion/Poetic-Realms";
function option(select,items){items.forEach(item=>{const e=document.createElement("option");e.value=item;e.textContent=item;select.append(e);});}
function issueLink(p){return p.issueNumber?github+"/issues/"+p.issueNumber:github+"/issues/new?template=scene.yml";}
function sceneLink(p){return p.scenePath||"";}
function card(p,i){
 const primary=p.categories[0];const playable=!!sceneLink(p);
 return '<article class="poem-card"><div class="card-art art-'+esc(primary)+'"><span class="art-type">'+esc(primary)+' · '+esc(p.form)+'</span><span class="art-index">'+String(i+1).padStart(3,"0")+'</span>'+(playable?'<span class="scene-ready">◉ 可体验原型</span>':"")+'</div><div class="card-content"><div class="card-meta"><span>'+esc(p.dynasty)+' · '+esc(p.author)+'</span><span>'+esc(p.hardness)+'</span></div><h3>'+esc(p.title)+'</h3><p class="quote">“'+esc(p.excerpt)+'”</p><p class="visual">'+esc(p.visualBrief)+'</p><div class="tags">'+p.categories.slice(0,3).map(x=>'<span class="tag">'+esc(x)+'</span>').join("")+'<span class="tag gold">'+(playable?esc(p.model||"AI"):"模型待领")+'</span><span class="tag">'+(playable?esc(p.tools.join("/")):"工具待定")+'</span></div><div class="card-actions"><button type="button" data-view="'+esc(p.id)+'">诗境详情 ↗</button>'+(playable?'<a href="'+esc(sceneLink(p))+'">进入场景 →</a>':'<a href="'+esc(issueLink(p))+'" target="_blank" rel="noopener">领取创作 →</a>')+'</div></div></article>';
}
function render(){
 const vals=Object.fromEntries(filters.map(k=>[k,$("#"+k).value.trim()]));
 const query=vals.search.toLocaleLowerCase();
 state.filtered=state.all.filter(p=>{
  const hay=[p.title,p.author,p.dynasty,p.excerpt,p.visualBrief,p.model||"",p.hardness,...p.tools,...p.categories].join(" ").toLocaleLowerCase();
  return (!query||hay.includes(query))&&(!vals.dynasty||p.dynasty===vals.dynasty)&&(!vals.theme||p.categories.includes(vals.theme))&&(!vals.form||p.form===vals.form)&&(!vals.hardness||p.hardness===vals.hardness)&&(!vals.model||(p.model||"待分配")===vals.model)&&(!vals.tool||(p.tools.length?p.tools:["待分配"]).includes(vals.tool))&&(!vals.status||p.sceneStatus===vals.status);
 });
 const shown=state.filtered.slice(0,state.limit);
 $("#catalog-grid").innerHTML=shown.length?shown.map((p,i)=>card(p,i)).join(""):'<div class="empty">未找到符合条件的诗境。试试放宽筛选条件。</div>';
 $("#showing").textContent=state.filtered.length+" / "+state.all.length;
 $("#more").hidden=shown.length>=state.filtered.length;
 document.querySelectorAll("[data-theme]").forEach(el=>el.classList.toggle("active",el.dataset.theme===vals.theme));
}
function taskList(){
 const items=state.all.filter(x=>x.issueNumber).sort((a,b)=>a.issueNumber-b.issueNumber);
 $("#task-list").innerHTML=items.map(p=>'<div class="task-item"><span class="task-no">'+String(p.issueNumber).padStart(2,"0")+'</span><div class="task-summary"><strong>'+esc(p.title)+'</strong><small>'+esc(p.dynasty)+' / '+esc(p.author)+' · <span>'+esc(p.hardness)+'</span> · Model: 待领取 · Tool: '+(p.tools.length?esc(p.tools.join("/")):"未指定")+'</small></div><a href="'+esc(issueLink(p))+'" target="_blank" rel="noopener">查看题目 ↗</a></div>').join("");
}
function showDetail(id){
 const p=state.all.find(x=>x.id===id);if(!p)return;
 const playable=!!sceneLink(p);
 $("#detail-body").innerHTML='<div class="detail-inside"><p class="eyebrow">'+esc(p.dynasty)+' · '+esc(p.form)+' · '+esc(p.author)+'</p><h2 id="detail-title">'+esc(p.title)+'</h2><p class="detail-quote">“'+esc(p.excerpt)+'”</p><p class="detail-note">此处为原文摘句，不代表完整原作。场景构想：'+esc(p.visualBrief)+'</p><dl><div><dt>景观分类</dt><dd>'+esc(p.categories.join(" / "))+'</dd></div><div><dt>实现难度</dt><dd>'+esc(p.hardness)+'</dd></div><div><dt>原文校勘</dt><dd>'+esc(p.textReview)+'</dd></div><div><dt>当前状态</dt><dd>'+(playable?"可体验原型，待持续验收":"待制作")+'</dd></div><div><dt>生成模型 Model</dt><dd>'+esc(p.model||"待创作者填写")+'</dd></div><div><dt>工具 Tool</dt><dd>'+esc(p.tools.length?p.tools.join(" / "):"待创作者填写")+'</dd></div></dl><p class="detail-note">说明：场景使用文学意象进行可视化，相关建筑、地理位置与历史细节须单独引用史料，不把艺术构想当作实景复原。</p><div class="detail-links">'+(playable?'<a href="'+esc(sceneLink(p))+'">进入 3D 场景 ↗</a>':"")+'<a href="'+esc(issueLink(p))+'" target="_blank" rel="noopener">'+(p.issueNumber?"查看任务与认领 ↗":"发起场景任务 ↗")+'</a></div></div>';
 const dialog=$("#detail");if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
 const url=new URL(location.href);url.searchParams.set("poem",p.id);history.replaceState(null,"",url);
}
function closeDetail(){const d=$("#detail");if(d.open&&d.close)d.close();else d.removeAttribute("open");const u=new URL(location.href);u.searchParams.delete("poem");history.replaceState(null,"",u);}
async function start(){
 try{
  const res=await fetch("data/poems.json");if(!res.ok)throw Error("HTTP "+res.status);
  const data=await res.json();if(!Array.isArray(data.poems))throw Error("目录格式错误");
  state.all=data.poems;
  const eras=[...new Set(state.all.map(x=>x.dynasty))], themes=[...new Set(state.all.flatMap(x=>x.categories))], forms=[...new Set(state.all.map(x=>x.form))];
  option($("#dynasty"),eras);option($("#theme"),themes);option($("#form"),forms);option($("#model"),[...new Set(state.all.map(x=>x.model||"待分配"))]);option($("#tool"),[...new Set(state.all.flatMap(x=>x.tools.length?x.tools:["待分配"]))]);
  $("#metric-total").textContent=state.all.length;$("#metric-eras").textContent=eras.length;$("#metric-tasks").textContent=state.all.filter(x=>x.issueNumber).length;
  $("#popular").innerHTML=CHOSEN.filter(x=>themes.includes(x)).map(x=>'<button class="chip" type="button" data-theme="'+esc(x)+'">'+esc(x)+'</button>').join("");
  filters.forEach(k=>$("#"+k).addEventListener(k==="search"?"input":"change",()=>{state.limit=18;render();}));
  $("#reset").addEventListener("click",()=>{filters.forEach(k=>$("#"+k).value="");state.limit=18;render();});
  $("#more").addEventListener("click",()=>{state.limit+=18;render();});
  $("#popular").addEventListener("click",e=>{const b=e.target.closest("[data-theme]");if(!b)return;$("#theme").value=$("#theme").value===b.dataset.theme?"":b.dataset.theme;state.limit=18;render();});
  $("#catalog-grid").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)showDetail(b.dataset.view);});
  $("#close-detail").addEventListener("click",closeDetail);
  $("#detail").addEventListener("click",e=>{if(e.target===$("#detail"))closeDetail();});
  $("#detail").addEventListener("close",()=>{const u=new URL(location.href);if(u.searchParams.has("poem")){u.searchParams.delete("poem");history.replaceState(null,"",u);}});
  render();taskList();
  const deep=new URL(location.href).searchParams.get("poem");if(deep)showDetail(deep);
 }catch(err){$("#catalog-grid").innerHTML='<div class="empty">目录加载失败：'+esc(err.message)+'。请通过静态网站服务器访问，而非直接双击 index.html。</div>';console.error(err);}
}
start();