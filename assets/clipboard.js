/* 剪贴板与轻提示：目录页、放映厅、展厅共用。 */
(function (root) {
  "use strict";

  function fallbackCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    var previous = document.activeElement;
    (document.querySelector("dialog[open]") || document.body).appendChild(
      field,
    );
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    var ok = false;
    try {
      ok = !!document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    field.parentNode.removeChild(field);
    if (previous && typeof previous.focus === "function")
      previous.focus({ preventScroll: true });
    return ok;
  }

  async function copyText(text) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        /* 落到兜底方案 */
      }
    }
    return fallbackCopy(text);
  }

  var timer = null;
  function toast(message, ok) {
    var el = document.getElementById("copy-status");
    if (!el) return;
    // 原生模态框属于顶层，提示需放进当前模态框，才能被看到和读出。
    var host = document.querySelector("dialog[open]") || document.body;
    if (el.parentNode !== host) host.appendChild(el);
    el.textContent = message;
    el.style.background = ok === false ? "#8c3a32" : "";
    el.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () {
      el.classList.remove("show");
    }, 3200);
  }

  /* 复制某首诗的一条提示词；失败时如实说明，不静默。 */
  async function copyPoemPrompt(poem) {
    var text;
    try {
      text = root.PoeticRealmsAgentPrompt.buildPrompt(poem);
    } catch (err) {
      return toast("提示词生成失败：" + err.message, false);
    }
    var ok = await copyText(text);
    toast(
      ok
        ? "已复制《" + poem.title + "》的创作与交作业提示词"
        : "浏览器禁止了剪贴板访问，请授权后重试。",
      ok,
    );
  }

  function handleCopyClick(event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    event.preventDefault();
    var poem = root.PoeticRealmsData
      ? root.PoeticRealmsData.find(button.dataset.copy)
      : null;
    if (!poem) return toast("未找到对应诗句，请刷新后重试。", false);
    copyPoemPrompt(poem);
  }

  root.PoeticRealmsClipboard = Object.freeze({
    copyText: copyText,
    toast: toast,
    copyPoemPrompt: copyPoemPrompt,
    handleCopyClick: handleCopyClick,
  });
})(globalThis);
