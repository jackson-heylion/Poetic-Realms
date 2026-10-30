"use strict";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const GITHUB = "https://github.com/jackson-heylion/Poetic-Realms";
const CHOSEN = ["江河", "湖泊", "月夜", "山川", "田园", "雪景"];
const state = { all: [], filtered: [], limit: 18, openPoem: null };
const FIELDS = ["dynasty", "theme", "form", "hardness", "model", "tool", "status"];

const scenesFor = (p) => (Array.isArray(p.scenes) ? p.scenes : []);
const galleryLink = (p) => "gallery.html?poem=" + encodeURIComponent(p.id);
const issueLink = (p) => p.issueNumber
  ? GITHUB + "/issues/" + p.issueNumber
  : GITHUB + "/issues/new?template=scene.yml";

/* ---------- 卡片 ---------- */
function menuFor(p) {
  return '<div class="menu-wrap">'
    + '<button class="btn btn-icon" type="button" data-menu="' + esc(p.id) + '" aria-label="更多操作" aria-expanded="false">⋯</button>'
    + '<div class="menu" hidden>'
    + '<button type="button" data-view="' + esc(p.id) + '">诗境详情</button>'
    + '<button type="button" data-copy="' + esc(p.id) + '">复制提示词</button>'
    + '<button type="button" data-issue="' + esc(p.id) + '">' + (p.issueNumber ? "查看任务 ↗" : "发起任务 ↗") + "</button>"
    + "</div></div>";
}

function card(p) {
  const count = scenesFor(p).length;
  // 提示词已含交作业指引，一张卡只留「复制提示词」与「进入展厅」两个动作。
  const prompt = '<button class="copy-btn' + (count ? "" : " btn-primary") + '" type="button" data-copy="'
    + esc(p.id) + '">复制提示词</button>';
  const enter = count
    ? '<a class="btn btn-primary" href="' + esc(galleryLink(p)) + '">进入展厅 ↗</a>'
    : "";
  return '<article class="card">'
    + '<div class="card-head"><h3>' + esc(p.title) + "</h3>"
    + '<span class="meta">' + esc(p.dynasty) + " · " + esc(p.author) + "</span></div>"
    + '<p class="verse">' + esc(p.excerpt) + "</p>"
    + '<div class="tags">'
    + p.categories.slice(0, 3).map((c) => '<span class="tag">' + esc(c) + "</span>").join("")
    + '<span class="tag">' + esc(p.hardness) + "</span>"
    + (count ? '<span class="tag live">' + count + " 个场景</span>" : '<span class="tag">待创作</span>')
    + "</div>"
    + '<div class="card-foot">' + menuFor(p) + prompt + enter + "</div>"
    + "</article>";
}

/* ---------- 渲染 ---------- */
function render() {
  const vals = Object.fromEntries(FIELDS.map((k) => [k, $("#" + k).value.trim()]));
  const query = $("#search").value.trim().toLowerCase();
  state.filtered = state.all.filter((p) => {
    const hay = [p.title, p.author, p.dynasty, p.excerpt, p.visualBrief, p.hardness,
      ...(p.categories || []), ...(p.transcription?.text || [])].join(" ").toLowerCase();
    return (!query || hay.includes(query))
      && (!vals.dynasty || p.dynasty === vals.dynasty)
      && (!vals.theme || p.categories.includes(vals.theme))
      && (!vals.form || p.form === vals.form)
      && (!vals.hardness || p.hardness === vals.hardness)
      && (!vals.model || (p.model || "待分配") === vals.model)
      && (!vals.tool || (p.tools.length ? p.tools : ["待分配"]).includes(vals.tool))
      && (!vals.status || p.sceneStatus === vals.status);
  });

  const shown = state.filtered.slice(0, state.limit);
  $("#catalog-grid").innerHTML = shown.length ? shown.map(card).join("")
    : '<div class="empty"><div class="glyph">无</div>'
    + "<h3>没有找到匹配的诗境</h3>"
    + "<p>这里收录的是可检索、可创作的古典诗词。放宽筛选试试。</p>"
    + '<button class="btn btn-primary" type="button" data-reset>清除全部筛选</button></div>';
  $("#showing").textContent = state.filtered.length + " / " + state.all.length;
  $("#more").hidden = shown.length >= state.filtered.length;
  document.querySelectorAll("#popular .chip").forEach((el) => {
    el.setAttribute("aria-pressed", String(el.dataset.theme === vals.theme));
  });
  closeMenus();
}

function renderTasks() {
  const items = state.all.filter((x) => x.issueNumber).sort((a, b) => a.issueNumber - b.issueNumber);
  $("#task-list").innerHTML = items.map((p) =>
    '<div class="task-row"><span class="no num">#' + p.issueNumber + "</span>"
    + '<span class="t">' + esc(p.title) + "</span>"
    + '<span class="m">' + esc(p.dynasty) + " · " + esc(p.author) + " · " + esc(p.hardness) + "</span>"
    + '<div class="ops">'
    + '<button class="copy-btn" type="button" data-copy="' + esc(p.id) + '">复制提示词</button>'
    + '<a href="' + esc(issueLink(p)) + '" target="_blank" rel="noopener">认领 ↗</a>'
    + "</div></div>"
  ).join("");
}

/* ---------- 详情抽屉 ---------- */
function showDetail(id) {
  const p = state.all.find((x) => x.id === id);
  if (!p) return;
  state.openPoem = p;
  const scenes = scenesFor(p);
  $("#detail-title").textContent = p.title;
  $("#detail-sub").textContent = p.dynasty + " · " + p.author + " · " + p.form;

  const versions = scenes.length
    ? '<div class="section"><h4>已收录场景 · ' + scenes.length + "</h4>"
      + scenes.map((v) => '<div class="scene-row"><div><div class="t">' + esc(v.title) + '</div>'
        + '<div class="m">' + esc(v.model || "未记录") + " · " + esc((v.tools || []).join(" / ")) + "</div></div>"
        + '<a class="btn" href="' + esc(galleryLink(p) + "&scene=" + encodeURIComponent(v.id)) + '">进入 ↗</a></div>').join("")
      + "</div>"
    : "";

  const KIND = {
    "community-transcription": "社区电子转录",
    "wikisource-text": "文献数字转录",
    "reference-reviewed": "参考校订"
  };
  const sources = (p.sources || []).map((s) => '<div class="source-item"><b>' + esc(s.collection || s.source || "来源")
    + "</b><a href=\"" + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.work || p.title) + " ↗</a>"
    + "<span>" + esc(KIND[s.kind] || s.kind) + "</span></div>").join("");

  const full = p.transcription && Array.isArray(p.transcription.text)
    ? '<div class="section"><h4>电子全文</h4><div class="fulltext">'
      + p.transcription.text.map((t) => esc(t)).join("\n\n")
      + '</div><p class="prose" style="margin-top:12px">' + esc(p.transcription.warning || "待版本校勘") + "</p></div>"
    : "";

  $("#detail-body").innerHTML =
    '<div class="section"><div class="fulltext">' + esc(p.excerpt) + "</div>"
    + '<p class="prose" style="margin-top:14px">' + esc(p.visualBrief) + "</p>"
    + '<div class="tags">' + p.categories.map((c) => '<span class="tag">' + esc(c) + "</span>").join("")
    + '<span class="tag">' + esc(p.hardness) + '</span><span class="tag">' + esc(p.textReview) + "</span></div></div>"
    + versions + full
    + '<div class="section"><h4>出处与校勘</h4><p class="prose">' + esc(p.sourceNote || "暂无说明") + "</p>"
    + sources + "</div>"
    + '<div class="section" style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="copy-btn btn-primary" type="button" data-copy="' + esc(p.id) + '">复制提示词</button>'
    + '<a class="btn" href="' + esc(issueLink(p)) + '" target="_blank" rel="noopener">任务 ↗</a>'
    + "</div>";

  $("#drawer").hidden = false;
  requestAnimationFrame(() => { $("#drawer").classList.add("open"); $("#scrim").classList.add("open"); });
  const url = new URL(location.href);
  url.searchParams.set("poem", p.id);
  history.replaceState(null, "", url);
}

function closeDetail() {
  $("#drawer").classList.remove("open");
  $("#scrim").classList.remove("open");
  setTimeout(() => { $("#drawer").hidden = true; }, 240);
  state.openPoem = null;
  const u = new URL(location.href);
  u.searchParams.delete("poem");
  history.replaceState(null, "", u);
}

function closeMenus() {
  document.querySelectorAll(".menu:not([hidden])").forEach((m) => { m.hidden = true; });
  document.querySelectorAll("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function resetFilters() {
  $("#search").value = "";
  FIELDS.forEach((k) => { $("#" + k).value = ""; });
  state.limit = 18;
  render();
}

/* ---------- 启动 ---------- */
async function start() {
  document.body.addEventListener("click", PoeticRealmsClipboard.handleCopyClick);
  document.body.addEventListener("click", (e) => {
    const view = e.target.closest("[data-view]");
    const reset = e.target.closest("[data-reset]");
    const menu = e.target.closest("[data-menu]");
    const issue = e.target.closest("[data-issue]");
    if (view) { closeMenus(); showDetail(view.dataset.view); return; }
    if (reset) { resetFilters(); return; }
    if (issue) {
      const p = state.all.find((x) => x.id === issue.dataset.issue);
      if (p) window.open(issueLink(p), "_blank", "noopener");
      return;
    }
    if (menu) {
      const panel = menu.parentElement.querySelector(".menu");
      const wasHidden = panel.hidden;
      closeMenus();
      panel.hidden = !wasHidden;
      menu.setAttribute("aria-expanded", String(wasHidden));
      return;
    }
    if (!e.target.closest(".menu")) closeMenus();
  });

  $("#search").addEventListener("input", () => { state.limit = 18; render(); });
  FIELDS.forEach((k) => $("#" + k).addEventListener("change", () => { state.limit = 18; render(); }));
  $("#reset").addEventListener("click", resetFilters);
  $("#more").addEventListener("click", () => { state.limit += 18; render(); });
  $("#popular").addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme]");
    if (!b) return;
    $("#theme").value = $("#theme").value === b.dataset.theme ? "" : b.dataset.theme;
    state.limit = 18;
    render();
  });
  $("#toggle-advanced").addEventListener("click", () => {
    const open = $("#advanced").classList.toggle("open");
    $("#toggle-advanced").setAttribute("aria-expanded", String(open));
    $("#toggle-advanced").textContent = open ? "筛选 −" : "筛选 ＋";
  });
  $("#close-detail").addEventListener("click", closeDetail);
  $("#scrim").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeMenus(); if (state.openPoem) closeDetail(); }
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); $("#search").focus();
    }
  });

  try {
    state.all = await PoeticRealmsData.load();

    const fill = (id, items) => items.forEach((v) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      $("#" + id).append(o);
    });
    const themes = [...new Set(state.all.flatMap((x) => x.categories))];
    fill("dynasty", [...new Set(state.all.map((x) => x.dynasty))]);
    fill("form", [...new Set(state.all.map((x) => x.form))]);
    fill("theme", themes);
    fill("model", [...new Set(state.all.map((x) => x.model || "待分配"))]);
    fill("tool", [...new Set(state.all.flatMap((x) => x.tools.length ? x.tools : ["待分配"]))]);

    $("#popular").innerHTML = CHOSEN.filter((x) => themes.includes(x))
      .map((x) => '<button class="chip" type="button" data-theme="' + esc(x) + '" aria-pressed="false">' + esc(x) + "</button>").join("");
    $("#metric-total").textContent = state.all.length;
    $("#metric-scenes").textContent = state.all.reduce((n, p) => n + scenesFor(p).length, 0);
    $("#metric-tasks").textContent = state.all.filter((x) => x.issueNumber).length;
    render();
    renderTasks();
    const deep = new URL(location.href).searchParams.get("poem");
    if (deep) showDetail(deep);
  } catch (err) {
    $("#catalog-grid").innerHTML = '<div class="empty"><div class="glyph">断</div><h3>目录加载失败</h3><p>'
      + esc(err.message) + "<br>请通过静态 HTTP 服务器访问本站，而不是直接双击 HTML。</p></div>";
    console.error(err);
  }
}

start();
