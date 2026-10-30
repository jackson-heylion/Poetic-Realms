"use strict";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const state = { order: [], cursor: -1, current: null, switching: false };
const stageRoot = $("#stage");
const frame = $("#stage-frame");
const pad = (n) => String(n).padStart(2, "0");

/* ---------- 随机顺序：洗牌成一副牌，抽完再洗 ---------- */
function shuffled(items, avoidFirst) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  if (avoidFirst && list.length > 1 && list[0] === avoidFirst) {
    [list[0], list[1]] = [list[1], list[0]];
  }
  return list;
}

/* ---------- 面板 ---------- */
function paint(item) {
  const p = item.poem;
  $("#stage-scene").textContent = item.scene.title;
  $("#stage-title").textContent = p.title;
  $("#stage-meta").textContent = [p.dynasty, p.author, p.form].filter(Boolean).join(" · ");
  $("#stage-verse").textContent = p.excerpt;
  $("#stage-tags").innerHTML = (p.categories || []).slice(0, 3)
    .map((c) => '<span class="stage-tag">' + esc(c) + "</span>").join("");
  $("#stage-enter").href = "gallery.html?poem=" + encodeURIComponent(p.id)
    + "&scene=" + encodeURIComponent(item.scene.id);
  $("#stage-copy").dataset.copy = p.id;
  $("#stage-copy").disabled = false;
  $("#stage-count").textContent = pad(state.cursor + 1) + " / " + pad(state.order.length);
  frame.title = "《" + p.title + "》· " + item.scene.title + "（三维场景）";
  document.title = "《" + p.title + "》 · 诗境";
}

function swapSource(item) {
  const target = new URL(item.scene.path, location.href).href;
  state.switching = true;
  window.clearTimeout(swapSource.timer);
  if (frame.src === target) {
    // 深链直接命中 HTML 里预置的那个场景，不必再重载一次。
    stageRoot.classList.remove("is-switching");
    state.switching = false;
    return;
  }
  stageRoot.classList.add("is-switching");
  swapSource.timer = window.setTimeout(() => {
    stageRoot.classList.remove("is-switching");
    state.switching = false;
  }, 9000);
  frame.src = item.scene.path;
}

frame.addEventListener("load", () => {
  window.clearTimeout(swapSource.timer);
  stageRoot.classList.remove("is-switching");
  state.switching = false;
});

/* ---------- 切换 ---------- */
function show(item, updateUrl) {
  if (!item) return;
  state.current = item;
  paint(item);
  swapSource(item);
  if (updateUrl !== false) {
    const url = new URL(location.href);
    url.searchParams.set("poem", item.poem.id);
    url.searchParams.set("scene", item.scene.id);
    history.replaceState(null, "", url);
  }
}

function step(delta) {
  if (!state.order.length) return;
  let next = state.cursor + delta;
  if (next >= state.order.length) {
    state.order = shuffled(state.order, state.current);
    next = 0;
  } else if (next < 0) {
    next = state.order.length - 1;
  }
  state.cursor = next;
  show(state.order[next], true);
}

/* ---------- 启动 ---------- */
async function start() {
  document.body.addEventListener("click", PoeticRealmsClipboard.handleCopyClick);
  $("#stage-next").addEventListener("click", () => step(1));
  $("#stage-prev").addEventListener("click", () => step(-1));
  document.addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      step(-1);
    }
  });

  let poems;
  try {
    poems = await PoeticRealmsData.load();
  } catch (err) {
    // 目录拉不到时保留 HTML 里的内置原型，只把失败讲清楚，不假装成别的场景。
    PoeticRealmsClipboard.toast("馆藏目录加载失败：" + err.message, false);
    $("#stage-copy").disabled = true;
    $("#stage-count").textContent = "内置原型";
    console.error(err);
    return;
  }

  const items = [];
  for (const p of poems) {
    for (const s of (Array.isArray(p.scenes) ? p.scenes : [])) items.push({ poem: p, scene: s });
  }
  if (!items.length) {
    stageRoot.classList.add("is-empty");
    $("#stage-panel").hidden = true;
    $("#stage-empty").hidden = false;
    return;
  }

  state.order = shuffled(items);

  // 深链：?poem=id&scene=id 锁定某个已建场景；诗存在但没有场景则退回馆藏。
  const params = new URL(location.href).searchParams;
  const wantPoem = params.get("poem");
  const wantScene = params.get("scene");
  if (wantPoem) {
    const picked = items.find((x) => x.poem.id === wantPoem && (!wantScene || x.scene.id === wantScene))
      || items.find((x) => x.poem.id === wantPoem);
    if (picked) {
      state.cursor = state.order.indexOf(picked);
      show(picked, false);
      return;
    }
    location.replace("catalog.html?poem=" + encodeURIComponent(wantPoem));
    return;
  }

  state.cursor = 0;
  show(state.order[0], false);
}

start();
