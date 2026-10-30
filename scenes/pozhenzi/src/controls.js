/* 渲染调度与读者交互；隐藏或滚出视口时停止绘制。 */
var fpsEl = document.getElementById("fps");
var lastT = 0,
  frames = 0,
  fpsClock = 0,
  fpsVal = 0,
  firstDone = false,
  frameDt = 0;
var frameRequest = 0;
var btnQ = document.getElementById("btnQuality");
var btnP = document.getElementById("btnPause");
var btnR = document.getElementById("btnReset");
var btnV = document.getElementById("btnView");
var qualityPinned = false;

function requestFrame() {
  if (!frameRequest && visible && !document.hidden)
    frameRequest = requestAnimationFrame(tick);
}

function tick(now) {
  frameRequest = 0;
  if (document.hidden || !visible) {
    lastT = 0;
    return;
  }
  var dt = lastT ? (now - lastT) / 1000 : 0.016;
  lastT = now;
  frameDt = dt;
  if (running) timeS += Math.min(dt, 0.06);
  if (
    running ||
    needsRender ||
    !firstDone ||
    Math.abs(dreamBlend - Number(dreaming)) > 0.002
  ) {
    try {
      render(timeS);
    } catch (err) {
      running = false;
      fail("渲染中断：" + err.message);
      return;
    }
    needsRender = false;
    frames++;
    if (!fpsClock) fpsClock = now;
    if (now - fpsClock >= 1000) {
      fpsVal = (frames * 1000) / (now - fpsClock);
      frames = 0;
      fpsClock = now;
      fpsEl.textContent = Math.round(fpsVal) + " FPS";
      if (
        running &&
        !qualityPinned &&
        fpsVal < 34 &&
        qIndex > 0 &&
        timeS > 2.5
      ) {
        qIndex--;
        btnQ.textContent = "画质：" + qLevels[qIndex].n;
        resize();
      }
    }
    if (!firstDone) {
      firstDone = true;
      veil.classList.add("hide");
      document.documentElement.dataset.ready = "true";
    }
  }
  if (running || Math.abs(dreamBlend - Number(dreaming)) > 0.002)
    requestFrame();
}

btnQ.textContent = "画质：" + qLevels[qIndex].n;
btnQ.addEventListener("click", function () {
  qualityPinned = true;
  qIndex = (qIndex + 1) % qLevels.length;
  btnQ.textContent = "画质：" + qLevels[qIndex].n;
  resize();
  needsRender = true;
  requestFrame();
});
function updatePause() {
  btnP.textContent = running ? "暂停" : "继续";
  btnP.setAttribute("aria-pressed", String(!running));
}
updatePause();
btnP.addEventListener("click", function () {
  running = !running;
  updatePause();
  lastT = 0;
  fpsClock = 0;
  frames = 0;
  requestFrame();
});
btnV.addEventListener("click", function () {
  dreaming = !dreaming;
  btnV.textContent = dreaming ? "灯下看剑 ↙" : "梦回连营 ↗";
  btnV.setAttribute("aria-pressed", String(dreaming));
  needsRender = true;
  requestFrame();
});
btnR.addEventListener("click", function () {
  tgtX = 0;
  tgtY = 0;
  pointerX = 0;
  pointerY = 0;
  dreaming = false;
  dreamBlend = 0;
  btnV.textContent = "梦回连营 ↗";
  btnV.setAttribute("aria-pressed", "false");
  needsRender = true;
  requestFrame();
});
window.addEventListener("pointermove", requestFrame, { passive: true });
window.addEventListener("resize", function () {
  needsRender = true;
  requestFrame();
});
document.addEventListener("visibilitychange", function () {
  lastT = 0;
  fpsClock = 0;
  frames = 0;
  if (document.hidden) {
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
  } else {
    needsRender = true;
    requestFrame();
  }
});
function setVisible(next) {
  visible = next;
  lastT = 0;
  cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  if (visible) {
    needsRender = true;
    requestFrame();
  }
}
// 展厅知道 iframe 是否滚出父页面；独立文件不依赖站点脚本。
window.addEventListener(
  "message",
  function (
    /** @type {MessageEvent<import('../../../assets/types').SceneVisibilityMessage>} */ event,
  ) {
    if (event.source !== window.parent || event.origin !== location.origin)
      return;
    if (
      event.data?.type === "poetic-realms-visibility" &&
      typeof event.data.visible === "boolean"
    ) {
      setVisible(event.data.visible);
    }
  },
);
window.addEventListener("keydown", function (event) {
  if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
  if (event.key === " ") {
    event.preventDefault();
    btnP.click();
  }
  if (event.key.toLowerCase() === "q") btnQ.click();
});

// 只读运行信息供实际验收采样；绘制次数由真实 drawElements 调用计数。
window.__poeticScene = {
  title: "破阵子 · 醉里挑灯看剑",
  fps: function () {
    return fpsVal;
  },
  gl: gl,
  quality: function () {
    return qLevels[qIndex].n;
  },
  drawCalls: function () {
    return drawCallCount;
  },
  frameMs: function () {
    return frameDt * 1000;
  },
  time: function () {
    return timeS;
  },
  paused: function () {
    return !running;
  },
};
requestFrame();
