"use strict";

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const requestedId = params.get("poem") || "";
const requestedScene = params.get("scene") || "";
const safeId = /^[a-z0-9-]+$/;
const safePath = /^scenes\/[a-z0-9-]+(?:\/[a-z0-9-]+)?\.html$/;
let scenes = [];
let current = -1;

function setMessage(message) {
  $("#gallery-empty").textContent = message;
  $("#gallery-empty").hidden = false;
  $("#gallery-frame").hidden = true;
}

function setSelected(index) {
  if (index < 0 || index >= scenes.length) return;
  current = index;
  const scene = scenes[index];
  $("#gallery-current").textContent = scene.model && scene.model !== "未记录" ? scene.model : "";
  $("#gallery-prev").disabled = scenes.length < 2;
  $("#gallery-next").disabled = scenes.length < 2;
  $("#gallery-standalone").href = scene.path;
  for (const el of $("#gallery-options").querySelectorAll("button")) {
    el.setAttribute("aria-pressed", String(Number(el.dataset.index) === index));
  }
  const u = new URL(location.href);
  u.searchParams.set("scene", scene.id);
  history.replaceState(null, "", u);
  $("#gallery-frame").title = scene.title + " · 3D 动态场景";
  setMessage("正在加载《" + scene.title + "》…");
  // 任一时刻只运行一个 iframe，切换即替换 src。
  $("#gallery-frame").src = scene.path;
}

function offset(delta) {
  if (scenes.length > 1) setSelected((current + delta + scenes.length) % scenes.length);
}

async function init() {
  if (!safeId.test(requestedId)) {
    setMessage("无效的诗境链接，请返回馆藏选择作品。");
    return;
  }
  try {
    const response = await fetch("data/poems.json");
    if (!response.ok) throw Error("HTTP " + response.status);
    const data = await response.json();
    const poem = data.poems.find((p) => p.id === requestedId);
    if (!poem) { setMessage("未找到这首诗，请返回馆藏。"); return; }

    $("#gallery-title").textContent = "《" + poem.title + "》";
    $("#gallery-verse").textContent = poem.excerpt;
    $("#gallery-detail").href = "./?poem=" + encodeURIComponent(poem.id);
    document.title = poem.title + " · 展厅 · 诗境";

    scenes = (Array.isArray(poem.scenes) ? poem.scenes : []).filter((s) =>
      s && safeId.test(s.id) && typeof s.title === "string" && safePath.test(s.path)
    );
    $("#gallery-count").textContent = scenes.length + " 个版本";
    if (!scenes.length) {
      setMessage("这首诗还没有收录 3D 作品。返回馆藏复制创作提示词即可开始。");
      return;
    }

    const options = $("#gallery-options");
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-option";
      button.dataset.index = String(i);
      button.textContent = scene.title;
      button.addEventListener("click", () => setSelected(i));
      options.append(button);
    }
    $("#gallery-prev").addEventListener("click", () => offset(-1));
    $("#gallery-next").addEventListener("click", () => offset(1));
    $("#gallery-frame").addEventListener("load", () => {
      $("#gallery-empty").hidden = true;
      $("#gallery-frame").hidden = false;
    });

    const target = scenes.findIndex((s) => s.id === requestedScene);
    setSelected(target === -1 ? 0 : target);
  } catch (err) {
    setMessage("场景目录加载失败：" + err.message);
  }
}

init();
