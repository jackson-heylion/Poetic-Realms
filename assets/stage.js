"use strict";
const $ = (selector) => document.querySelector(selector);
const stage = $("#stage");
const frame = $("#stage-frame");
const toggle = $("#stage-toggle");
/** @type {import('./types').Exhibit[]} */
let order = [];
let cursor = -1;
let loadTimer = 0;

function shuffled(items) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const pick = Math.floor(Math.random() * (index + 1));
    [result[index], result[pick]] = [result[pick], result[index]];
  }
  return result;
}

function setQuiet(quiet) {
  stage.classList.toggle("is-quiet", quiet);
  toggle.setAttribute("aria-pressed", String(quiet));
  toggle.setAttribute("aria-label", quiet ? "显示界面" : "隐藏界面");
  toggle.title = quiet ? "显示界面（H 或 Esc）" : "隐藏界面（H）";
  toggle.querySelector(".stage-toggle-label").textContent = quiet
    ? "返境"
    : "静观";
  if (quiet && $(".stage-info").contains(document.activeElement))
    toggle.focus();
}

function setLoaded() {
  clearTimeout(loadTimer);
  $("#stage-loading").hidden = true;
  frame.removeAttribute("aria-busy");
}

function show(index, updateUrl = true) {
  if (!order.length) return;
  cursor = (index + order.length) % order.length;
  const { poem, scene } = order[cursor];
  $("#stage-title").textContent = poem.title.split("·")[0];
  $("#stage-meta").textContent = poem.dynasty + " · " + poem.author;
  $("#stage-scene").textContent = scene.title;
  $("#stage-verse").textContent = poem.excerpt;
  $("#stage-count").textContent =
    String(cursor + 1).padStart(2, "0") +
    " / " +
    String(order.length).padStart(2, "0");
  $("#stage-enter").href =
    "gallery.html?poem=" +
    encodeURIComponent(poem.id) +
    "&scene=" +
    encodeURIComponent(scene.id);
  $("#stage-copy").dataset.copy = poem.id;
  frame.title = "《" + poem.title + "》· " + scene.title;
  document.title = poem.title + " · 诗境";
  const target = new URL(scene.path, location.href).href;
  if (frame.src !== target) {
    clearTimeout(loadTimer);
    frame.setAttribute("aria-busy", "true");
    $("#stage-loading").hidden = false;
    loadTimer = window.setTimeout(() => {
      setLoaded();
      PoeticRealmsClipboard.toast(
        "画卷仍在准备，可点击「读诗 · 入境」独立查看。",
        false,
      );
    }, 15000);
    frame.src = scene.path;
  } else setLoaded();
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("poem", poem.id);
    url.searchParams.set("scene", scene.id);
    history.replaceState(null, "", url);
  }
}

function onKey(event) {
  const target = event.target;
  if (target?.closest?.("input, textarea, select, [contenteditable=true]"))
    return;
  if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    setQuiet(!stage.classList.contains("is-quiet"));
  }
  if (event.key === "Escape") setQuiet(false);
  if (event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    show(cursor + 1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    show(cursor - 1);
  }
}

frame.addEventListener("load", () => {
  setLoaded();
  // 画面获得焦点后，漫游快捷键仍可用；空格保留给独立场景的暂停交互。
  try {
    const document = frame.contentDocument;
    const style = document.createElement("style");
    // 放映厅已有诗文与漫游控件，避免独立作品的字幕和工具栏重叠。
    style.textContent = ".poem,#bar,#fps,.hint{display:none!important}";
    document.head.append(style);
    document.addEventListener("keydown", onKey);
  } catch {
    /* 单独打开作品仍可操作。 */
  }
});
document.addEventListener("keydown", onKey);
document.body.addEventListener("click", PoeticRealmsClipboard.handleCopyClick);
toggle.addEventListener("click", () =>
  setQuiet(!stage.classList.contains("is-quiet")),
);
$("#stage-next").addEventListener("click", () => show(cursor + 1));
$("#stage-prev").addEventListener("click", () => show(cursor - 1));

async function start() {
  try {
    const poems = await PoeticRealmsData.load();
    order = shuffled(
      poems.flatMap((poem) => poem.scenes.map((scene) => ({ poem, scene }))),
    );
    if (!order.length) {
      frame.src = "about:blank";
      frame.hidden = true;
      $("#stage-panel").hidden = true;
      $("#stage-empty").hidden = false;
      return;
    }
    const params = new URLSearchParams(location.search);
    const poemId = params.get("poem");
    const sceneId = params.get("scene");
    let index = order.findIndex(
      (item) =>
        item.poem.id === poemId && (!sceneId || item.scene.id === sceneId),
    );
    if (index < 0 && poemId)
      index = order.findIndex((item) => item.poem.id === poemId);
    if (poemId && index < 0) {
      location.replace("catalog.html?poem=" + encodeURIComponent(poemId));
      return;
    }
    show(index < 0 ? 0 : index);
  } catch (error) {
    $("#stage-copy").disabled = true;
    $("#stage-next").disabled = true;
    $("#stage-prev").disabled = true;
    $("#stage-count").textContent = "江雪 · 内置诗境";
    $("#stage-scene").textContent = "寒江独钓";
    PoeticRealmsClipboard.toast(
      "馆藏暂未送达，先为你留一江雪景。刷新页面可重试。",
      false,
    );
    console.error("馆藏加载失败", error);
  }
}
start();
