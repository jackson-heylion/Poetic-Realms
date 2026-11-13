/* 界面：画质、机位、静观、全词与声音开关。 */

const UI = (() => {
  const sheet = document.getElementById("sheet");
  const sheetText = document.getElementById("sheet-text");
  const readBtn = document.getElementById("read");
  const stillBtn = document.getElementById("still");
  const pauseBtn = document.getElementById("pause");
  const soundBtn = document.getElementById("sound");
  const qualitySel = document.getElementById("quality");
  const moonBtn = document.getElementById("moon");
  const widenBtn = document.getElementById("widen");

  const LINES = [
    "明月别枝惊鹊，清风半夜鸣蝉。",
    "稻花香里说丰年，听取蛙声一片。",
    "七八个星天外，两三点雨山前。",
    "旧时茅店社林边，路转溪桥忽见。",
  ];

  let lastView = "widen";

  function setPressed(btn, on) {
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function setView(name) {
    const v = VIEWS[name] || VIEWS.widen;
    CAM.targetYaw = v.yaw;
    CAM.targetPitch = v.pitch;
    CAM.targetDolly = v.dolly;
    lastView = name;
    setPressed(moonBtn, name === "moon");
    setPressed(widenBtn, name === "widen");
    S.needsRender = true;
  }

  function toggleStill() {
    S.still = !S.still;
    setPressed(stillBtn, S.still);
    S.needsRender = true;
  }

  function togglePause() {
    S.paused = !S.paused;
    setPressed(pauseBtn, S.paused);
    pauseBtn.textContent = S.paused ? "继续" : "暂停";
    S.needsRender = true;
  }

  function openSheet() {
    if (!sheet) return;
    if (!sheetText.childElementCount && sheetText) {
      for (const line of LINES) {
        const p = document.createElement("p");
        p.textContent = line;
        sheetText.appendChild(p);
      }
    }
    sheet.hidden = false;
    readBtn && readBtn.setAttribute("aria-expanded", "true");
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    readBtn && readBtn.setAttribute("aria-expanded", "false");
  }

  function wire() {
    readBtn && readBtn.addEventListener("click", openSheet);
    const closeBtn = document.getElementById("sheet-close");
    closeBtn && closeBtn.addEventListener("click", closeSheet);
    sheet &&
      sheet.addEventListener("click", function (e) {
        if (e.target === sheet) closeSheet();
      });

    stillBtn && stillBtn.addEventListener("click", toggleStill);
    pauseBtn && pauseBtn.addEventListener("click", togglePause);
    moonBtn && moonBtn.addEventListener("click", function () {
      setView(lastView === "moon" ? "widen" : "moon");
    });
    widenBtn && widenBtn.addEventListener("click", function () {
      setView("widen");
    });

    soundBtn &&
      soundBtn.addEventListener("click", function () {
        const ok = Life.toggleSound();
        if (!ok) {
          soundBtn.disabled = true;
          soundBtn.textContent = "无声";
          notice("此浏览器不支持 WebAudio。");
          return;
        }
        setPressed(soundBtn, Life.soundOn());
        soundBtn.textContent = Life.soundOn() ? "收声" : "蝉声";
      });

    qualitySel &&
      qualitySel.addEventListener("change", function () {
        applyQuality(qualitySel.value);
      });

    /* 三秒后收起提示 */
    setTimeout(hideHint, 7200);
  }

  return {
    wire,
    setView,
    toggleStill,
    togglePause,
    openSheet,
    closeSheet,
  };
})();

UI.wire();
boot();
