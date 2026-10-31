"use strict";
const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const requestedId = params.get("poem") || "";
const requestedScene = params.get("scene") || "";
/** @type {import('./types').Scene[]} */
let scenes = [];
let current = -1;
let timer = 0;
const frame = $("#gallery-frame");
const stage = $("#gallery-stage");
const arrows = $("#gallery-arrows");
const arrowHome = arrows.parentElement;
const fullscreenButton = $("#gallery-fullscreen");
let inView = false;

function publishVisibility() {
  /** @type {import('./types').SceneVisibilityMessage} */
  const message = {
    type: "poetic-realms-visibility",
    visible: inView && !document.hidden,
  };
  frame.contentWindow?.postMessage(message, location.origin);
}
new IntersectionObserver((entries) => {
  inView = entries[0].isIntersecting;
  publishVisibility();
}).observe(frame);
document.addEventListener("visibilitychange", publishVisibility);

function setMessage(message, recover = false) {
  $("#gallery-message").textContent = message;
  $("#gallery-empty").hidden = false;
  $("#gallery-recover").hidden = !recover;
  frame.hidden = true;
  syncFullscreen();
}

function setSelected(index) {
  if (index < 0 || index >= scenes.length) return;
  current = index;
  const scene = scenes[index];
  $("#gallery-current").textContent =
    "创作 / " +
    scene.model +
    " · " +
    scene.tools.join(" / ") +
    (scene.status === "prototype" ? " · 原型作品" : "");
  $("#gallery-scene-title").textContent = scene.title;
  $("#gallery-brief").textContent =
    scene.description || $("#gallery-brief").dataset.brief;
  $("#gallery-prev").disabled = scenes.length < 2;
  $("#gallery-next").disabled = scenes.length < 2;
  $("#gallery-arrows").hidden = scenes.length < 2;
  $("#gallery-standalone").href = scene.path;
  $("#gallery-standalone").hidden = false;
  $("#gallery-options")
    .querySelectorAll("button")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.index) === index),
      );
    });
  const url = new URL(location.href);
  url.searchParams.set("scene", scene.id);
  history.replaceState(null, "", url);
  frame.title = scene.title + " · 三维诗境";
  setMessage("正在走入「" + scene.title + "」…");
  clearTimeout(timer);
  timer = window.setTimeout(
    () => setMessage("画卷暂未展开，可独立打开作品，或返回馆藏重试。", true),
    15000,
  );
  // 始终只保留一个渲染 iframe；重复选择当前版本也可重新载入。
  frame.src = scene.path;
}

function offset(delta) {
  if (scenes.length > 1)
    setSelected((current + delta + scenes.length) % scenes.length);
}

function onNavigationKey(event) {
  if (document.fullscreenElement !== stage || scenes.length < 2) return;
  if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (event.target?.closest?.("input, textarea, select, [contenteditable]"))
    return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  event.stopPropagation();
  offset(event.key === "ArrowRight" ? 1 : -1);
}

function syncFullscreen() {
  const fullscreen = document.fullscreenElement === stage;
  // 复用同一组切换按钮，确保它们处于浏览器的全屏容器内。
  const arrowTarget = fullscreen ? stage : arrowHome;
  if (arrows.parentElement !== arrowTarget) arrowTarget.append(arrows);
  fullscreenButton.textContent = fullscreen ? "退出全屏 ⤢" : "全屏欣赏 ⤢";
  fullscreenButton.setAttribute(
    "aria-label",
    fullscreen ? "退出全屏欣赏" : "全屏欣赏诗境",
  );
  // 切换期间保留退出入口，即使新画卷仍在加载或加载失败。
  fullscreenButton.hidden =
    !stage.requestFullscreen || (!fullscreen && frame.hidden);
}

function addParagraphs(target, paragraphs) {
  target.replaceChildren(
    ...paragraphs.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }),
  );
}

frame.addEventListener("load", () => {
  if (current < 0) return;
  clearTimeout(timer);
  try {
    if (!frame.contentDocument?.querySelector("canvas")) {
      setMessage("这个版本暂未能打开，请独立打开或选择另一版本。", true);
      return;
    }
    // iframe 获得焦点后，仍由全屏展厅处理版本切换。
    frame.contentDocument.addEventListener("keydown", onNavigationKey, true);
  } catch {
    setMessage("这个版本暂未能打开，请返回馆藏重试。", true);
    return;
  }
  $("#gallery-empty").hidden = true;
  frame.hidden = false;
  publishVisibility();
  syncFullscreen();
});
$("#gallery-prev").addEventListener("click", () => offset(-1));
$("#gallery-next").addEventListener("click", () => offset(1));
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stage.requestFullscreen();
  } catch {
    PoeticRealmsClipboard.toast(
      "浏览器暂不支持全屏，请使用「独立打开」。",
      false,
    );
  }
});
document.addEventListener("fullscreenchange", syncFullscreen);
document.addEventListener("keydown", onNavigationKey, true);
document.body.addEventListener("click", PoeticRealmsClipboard.handleCopyClick);

async function init() {
  if (!/^[a-z0-9-]+$/.test(requestedId)) {
    setMessage("先在馆藏选一首诗，再来寻访它的风景。", true);
    return;
  }
  try {
    const poems = await PoeticRealmsData.load();
    const poem = poems.find((item) => item.id === requestedId);
    if (!poem) {
      setMessage("这首诗尚未入藏，去馆藏寻找另一片风景吧。", true);
      return;
    }
    $("#gallery-title").textContent = poem.title;
    $("#gallery-author").textContent =
      poem.dynasty + " · " + poem.author + " · " + poem.form;
    $("#gallery-verse").textContent = poem.excerpt;
    $("#gallery-detail").href =
      "catalog.html?poem=" + encodeURIComponent(poem.id);
    $("#gallery-brief").dataset.brief = poem.visualBrief;
    $("#gallery-copy").dataset.copy = poem.id;
    addParagraphs($("#gallery-poem"), poem.transcription.text);
    addParagraphs($("#gallery-source"), [
      poem.transcription.warning,
      poem.sourceNote,
    ]);
    for (const source of poem.sources) {
      const link = document.createElement("a");
      link.href = source.url;
      link.textContent =
        (source.collection || source.source || "原文来源") +
        " · " +
        source.work +
        " ↗";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      $("#gallery-source").append(link);
    }
    $("#gallery-reading").hidden = false;
    document.title = poem.title + " · 诗境展厅";
    scenes = poem.scenes;
    $("#gallery-count").textContent = scenes.length + " 种演绎";
    if (!scenes.length) {
      setMessage(
        "此诗尚待成境。先读原文，或复制提示词创作它的第一幅风景。",
        true,
      );
      return;
    }
    const options = $("#gallery-options");
    scenes.forEach((scene, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-option";
      button.dataset.index = String(index);
      button.textContent = scene.title;
      button.addEventListener("click", () => setSelected(index));
      options.append(button);
    });
    const selected = scenes.findIndex((scene) => scene.id === requestedScene);
    if (requestedScene && selected < 0)
      PoeticRealmsClipboard.toast(
        "这个版本未收录，先为你打开现有诗境。",
        false,
      );
    setSelected(selected < 0 ? 0 : selected);
  } catch (error) {
    setMessage("诗境目录暂未送达，检查网络后返回馆藏重试。", true);
    console.error("展厅加载失败", error);
  }
}
init();
