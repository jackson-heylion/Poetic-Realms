/* 全诗面板与工具条状态。 */
const UI = (() => {
  const lines = [
    "结庐在人境，而无车马喧。",
    "问君何能尔？心远地自偏。",
    "采菊东篱下，悠然见南山。",
    "山气日夕佳，飞鸟相与还。",
    "此中有真意，欲辩已忘言。",
  ];
  let bound = false;
  const views = ["view-near", "view-far"];

  return {
    bind() {
      if (bound) return;
      bound = true;
      const sheet = document.getElementById("sheet");
      const read = document.getElementById("read");
      const text = document.getElementById("sheet-text");
      text.replaceChildren(
        ...lines.map((line, index) => {
          const node = document.createElement("p");
          node.textContent = line;
          if (index === 2) node.className = "focus";
          return node;
        }),
      );
      const toggle = (open) => {
        sheet.hidden = !open;
        read.setAttribute("aria-expanded", String(open));
        if (open) document.getElementById("sheet-close").focus();
        else read.focus();
      };
      read.addEventListener("click", () => toggle(sheet.hidden));
      document
        .getElementById("sheet-close")
        .addEventListener("click", () => toggle(false));
      sheet.addEventListener("click", (event) => {
        if (event.target === sheet) toggle(false);
      });
      addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !sheet.hidden) toggle(false);
      });
    },

    press(id) {
      for (const key of views) {
        const node = document.getElementById(key);
        if (node) node.setAttribute("aria-pressed", String(key === id));
      }
    },
  };
})();
