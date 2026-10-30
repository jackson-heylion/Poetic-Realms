/* 原生 dialog 提供焦点圈定、Esc 关闭与关闭后焦点恢复。 */
(function (root) {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      switch (character) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        default:
          return "&#39;";
      }
    });
  const galleryLink = (poem) =>
    "gallery.html?poem=" + encodeURIComponent(poem.id);
  const dialog = $("#drawer");

  /** @param {import('./types').Poem} poem */
  function open(poem, updateUrl = true) {
    $("#detail-title").textContent = poem.title;
    $("#detail-sub").textContent = [poem.dynasty, poem.author, poem.form].join(
      " · ",
    );
    const versions = poem.scenes
      .map(
        (scene) =>
          '<div class="scene-row"><div><h4>' +
          esc(scene.title) +
          "</h4><p>" +
          esc(scene.model) +
          '</p></div><a href="' +
          galleryLink(poem) +
          "&scene=" +
          encodeURIComponent(scene.id) +
          '">入境 ↗</a></div>',
      )
      .join("");
    const sources = poem.sources
      .map(
        (source) =>
          '<a class="source-item" href="' +
          esc(source.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(source.collection || source.source || source.work) +
          " · " +
          esc(source.work) +
          " ↗</a>",
      )
      .join("");
    $("#detail-body").innerHTML =
      '<div class="fulltext">' +
      poem.transcription.text
        .map((line) => "<p>" + esc(line) + "</p>")
        .join("") +
      "</div>" +
      '<div class="detail-actions">' +
      (poem.scenes.length
        ? '<a class="btn btn-primary" href="' +
          galleryLink(poem) +
          '">走入诗境 →</a>'
        : "") +
      '<button class="copy-btn ' +
      (poem.scenes.length ? "text-button" : "btn btn-primary") +
      '" type="button" data-copy="' +
      esc(poem.id) +
      '">复制创作提示词 ↗</button></div>' +
      (versions
        ? '<section class="detail-section"><h3 class="detail-label">这首诗的不同风景</h3>' +
          versions +
          "</section>"
        : "") +
      '<details class="detail-disclosure"><summary>诗中意象与创作参考</summary><p>' +
      esc(poem.visualBrief) +
      "</p><p>" +
      poem.categories.map(esc).join(" · ") +
      "</p><p>场景制作难度 " +
      esc(poem.hardness) +
      "，仅表示工程工作量。</p></details>" +
      '<details class="detail-disclosure"><summary>文本来源与校勘说明 · ' +
      esc(poem.textReview) +
      "</summary><p>" +
      esc(poem.transcription.warning) +
      "</p><p>" +
      esc(poem.sourceNote) +
      "</p>" +
      sources +
      "</details>";
    $(".drawer-scroll").scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set("poem", poem.id);
      history.pushState(null, "", url);
    }
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  $("#close-detail").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right) close();
  });
  dialog.addEventListener("close", () => {
    const url = new URL(location.href);
    url.searchParams.delete("poem");
    history.replaceState(null, "", url);
  });
  root.PoeticRealmsDetail = Object.freeze({ open, close, esc, galleryLink });
})(globalThis);
