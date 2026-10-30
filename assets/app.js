"use strict";

const $ = (selector) => document.querySelector(selector);
const { esc, galleryLink } = PoeticRealmsDetail;
const CHOSEN = ["山川", "江河", "月夜", "田园", "雪景", "边塞"];
const FIELDS = ["dynasty", "form", "theme", "hardness", "model", "tool"];
/** @type {import('./types').Poem[]} */
let poems = [];
let selectedStatus = "";
let ready = false;

/** @param {import('./types').Poem} poem */
function card(poem, index) {
  const count = poem.scenes.length;
  return (
    '<article class="poem-card"><div class="poem-card-meta"><span>' +
    esc(poem.dynasty) +
    " · " +
    esc(poem.author) +
    '</span><span class="poem-card-index num">' +
    String(index + 1).padStart(3, "0") +
    '</span></div><h3><button class="poem-title" type="button" data-view="' +
    poem.id +
    '">' +
    esc(poem.title) +
    '</button></h3><p class="verse">' +
    esc(poem.excerpt) +
    '</p><div class="poem-card-foot"><button class="text-button" type="button" data-view="' +
    poem.id +
    '" aria-label="阅读《' +
    esc(poem.title) +
    '》全文">读诗 <span aria-hidden="true">↗</span></button>' +
    (count
      ? '<a href="' +
        galleryLink(poem) +
        '">' +
        count +
        ' 境可游 <span aria-hidden="true">→</span></a>'
      : '<span class="scene-status">' +
        poem.categories.slice(0, 2).map(esc).join(" · ") +
        "</span>") +
    "</div></article>"
  );
}

function syncUrl() {
  const url = new URL(location.href);
  const set = (key, value) =>
    value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  set("q", $("#search").value.trim());
  set("status", selectedStatus);
  for (const field of FIELDS) set(field, $("#" + field).value);
  history.replaceState(null, "", url);
}

function restoreFilters() {
  const params = new URLSearchParams(location.search);
  $("#search").value = params.get("q") || "";
  selectedStatus = params.get("status") === "playable" ? "playable" : "";
  for (const field of FIELDS) $("#" + field).value = params.get(field) || "";
  if (FIELDS.some((field) => $("#" + field).value)) setAdvanced(true);
}

function setAdvanced(open) {
  $("#advanced").hidden = !open;
  $("#toggle-advanced").setAttribute("aria-expanded", String(open));
  $("#toggle-advanced span").textContent = open ? "−" : "＋";
}

function render(updateUrl = true) {
  if (!ready) return;
  const query = $("#search").value.trim().toLocaleLowerCase();
  const dynasty = $("#dynasty").value;
  const form = $("#form").value;
  const theme = $("#theme").value;
  const hardness = $("#hardness").value;
  const model = $("#model").value;
  const tool = $("#tool").value;
  const filtered = poems.filter((poem) => {
    const text = [
      poem.title,
      poem.author,
      poem.dynasty,
      poem.form,
      poem.excerpt,
      poem.visualBrief,
      ...poem.categories,
      ...poem.transcription.text,
    ]
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!query || text.includes(query)) &&
      (!dynasty || poem.dynasty === dynasty) &&
      (!form || poem.form === form) &&
      (!theme || poem.categories.includes(theme)) &&
      (!hardness || poem.hardness === hardness) &&
      (!model || poem.scenes.some((scene) => scene.model === model)) &&
      (!tool || poem.scenes.some((scene) => scene.tools.includes(tool))) &&
      (!selectedStatus || poem.scenes.length > 0)
    );
  });
  // 静态小型馆藏直接展示匹配结果；由 content-visibility 延迟屏外排版，不做内存分页。
  $("#catalog-grid").innerHTML = filtered.length
    ? filtered.map(card).join("")
    : '<div class="empty"><span class="empty-mark" aria-hidden="true">寻</span><h3>此处尚未寻到那句诗</h3>' +
      '<p>换一个诗题、诗人，或放宽意象筛选，再寻一次。</p><button class="btn btn-primary" type="button" data-reset>展开全部诗卷 →</button></div>';
  $("#showing").textContent =
    "共 " +
    filtered.length +
    " 篇" +
    (filtered.length !== poems.length
      ? " · 馆藏 " + poems.length + " 篇"
      : "，静候翻阅");
  $("#reset").hidden =
    !query && !selectedStatus && !FIELDS.some((field) => $("#" + field).value);
  document
    .querySelectorAll("[data-status]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.status === selectedStatus),
      ),
    );
  document
    .querySelectorAll("[data-theme]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.theme === theme),
      ),
    );
  if (updateUrl) syncUrl();
}

function renderFeatured() {
  const playable = poems.filter((poem) => poem.scenes.length);
  $("#featured-grid").innerHTML = playable.length
    ? playable
        .map((poem, index) => {
          const title = poem.title.split("·")[0];
          return (
            '<a class="scene-cover" href="' +
            galleryLink(poem) +
            '" aria-label="走入《' +
            esc(poem.title) +
            '》"><div class="cover-picture"><img src="assets/previews/' +
            poem.id +
            '.jpg?v=' +
            encodeURIComponent(poem.scenes[0].id) +
            '" alt="' +
            esc(poem.visualBrief) +
            '" width="480" height="600" loading="eager">' +
            '<span class="cover-index num">' +
            String(index + 1).padStart(2, "0") +
            '</span><span class="cover-enter" aria-hidden="true">↗</span></div><div class="cover-caption"><h3>' +
            esc(title) +
            "</h3><p>" +
            esc(poem.dynasty) +
            " · " +
            esc(poem.author) +
            "</p></div></a>"
          );
        })
        .join("")
    : '<div class="empty"><span class="empty-mark" aria-hidden="true">境</span><h3>第一幅风景，正在途中</h3><p>先读一首诗，留住心中的山河。</p><a class="btn btn-primary" href="#catalog">翻开诗卷 →</a></div>';
}

function resetFilters() {
  $("#search").value = "";
  selectedStatus = "";
  FIELDS.forEach((field) => {
    $("#" + field).value = "";
  });
  render();
  $("#search").focus({ preventScroll: true });
}

function showDeepLink() {
  const id = new URLSearchParams(location.search).get("poem");
  const poem = poems.find((item) => item.id === id);
  if (poem) PoeticRealmsDetail.open(poem, false);
  else {
    PoeticRealmsDetail.close();
    if (id)
      PoeticRealmsClipboard.toast(
        "这首诗尚未入藏，请在馆藏里继续寻找。",
        false,
      );
  }
}

async function start() {
  document.body.addEventListener(
    "click",
    PoeticRealmsClipboard.handleCopyClick,
  );
  document.body.addEventListener("click", (event) => {
    const view = event.target.closest("[data-view]");
    if (view) {
      const poem = poems.find((item) => item.id === view.dataset.view);
      if (poem) PoeticRealmsDetail.open(poem);
    }
    if (event.target.closest("[data-reset]")) resetFilters();
    if (event.target.closest("[data-retry]")) location.reload();
    const tab = event.target.closest("[data-status]");
    if (tab) {
      selectedStatus = tab.dataset.status;
      render();
    }
    const theme = event.target.closest("[data-theme]");
    if (theme) {
      $("#theme").value =
        $("#theme").value === theme.dataset.theme ? "" : theme.dataset.theme;
      render();
    }
  });
  $("#search").addEventListener("input", () => render());
  FIELDS.forEach((field) =>
    $("#" + field).addEventListener("change", () => render()),
  );
  $("#reset").addEventListener("click", resetFilters);
  $("#toggle-advanced").addEventListener("click", () =>
    setAdvanced($("#advanced").hidden),
  );
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !$("#drawer").open &&
      !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
    ) {
      event.preventDefault();
      $("#search").focus();
    }
  });
  window.addEventListener("popstate", () => {
    restoreFilters();
    render(false);
    showDeepLink();
  });
  try {
    poems = await PoeticRealmsData.load();
    const fill = (field, values) =>
      [...new Set(values)].forEach((value) =>
        $("#" + field).add(new Option(value, value)),
      );
    fill(
      "dynasty",
      poems.map((poem) => poem.dynasty),
    );
    fill(
      "form",
      poems.map((poem) => poem.form),
    );
    fill(
      "theme",
      poems.flatMap((poem) => poem.categories),
    );
    fill(
      "model",
      poems.flatMap((poem) => poem.scenes.map((scene) => scene.model)),
    );
    fill(
      "tool",
      poems.flatMap((poem) => poem.scenes.flatMap((scene) => scene.tools)),
    );
    $("#popular").innerHTML = CHOSEN.map(
      (theme) =>
        '<button class="theme-button" type="button" data-theme="' +
        theme +
        '" aria-pressed="false">' +
        theme +
        "</button>",
    ).join("");
    $("#metric-total").textContent = poems.length;
    $("#metric-scenes").textContent = poems.reduce(
      (count, poem) => count + poem.scenes.length,
      0,
    );
    ready = true;
    restoreFilters();
    render(false);
    renderFeatured();
    showDeepLink();
  } catch (error) {
    $("#featured-grid").innerHTML = "";
    $("#showing").textContent = "诗卷暂未展开";
    $("#catalog-grid").innerHTML =
      '<div class="empty"><span class="empty-mark" aria-hidden="true">笺</span>' +
      '<h3>诗卷暂时未能送达</h3><p>检查网络后重新展开。本站需通过 HTTP 访问。</p><button class="btn btn-primary" data-retry type="button">重新加载 →</button></div>';
    console.error("馆藏加载失败", error);
  }
}
start();
