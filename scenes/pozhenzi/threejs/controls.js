let request = 0,
  lastFrame = 0,
  frameCount = 0,
  frameStart = 0,
  fps = 0,
  firstFrame = true,
  qualityPinned = false,
  slowSamples = 0,
  lastRenderMs = 0;
const eye = new THREE.Vector3(),
  aim = new THREE.Vector3(),
  forward = new THREE.Vector3();
function updateCamera(delta) {
  const portrait = innerWidth / innerHeight < 0.85;
  const destination = state.view === "camp" ? 1 : 0;
  state.blend = reduceMotion
    ? destination
    : THREE.MathUtils.lerp(state.blend, destination, 1 - Math.exp(-delta * 4));
  const progress = THREE.MathUtils.smoothstep(state.blend, 0, 1);
  const from = portrait ? [-0.9, 2.6, 10.8] : [0.65, 2.16, 8.25];
  const to = portrait ? [0.1, 4.0, 2.6] : [0.5, 3.8, 1.3];
  eye.set(...from).lerp(new THREE.Vector3(...to), progress);
  aim
    .set(portrait ? -0.95 : -0.8, 0.95, -6.5)
    .lerp(new THREE.Vector3(0.1, 1.1, -28), progress);
  const drift = reduceMotion ? 0 : Math.sin(state.elapsed * 0.11) * 0.045;
  aim.x += state.yaw * 11 + drift;
  aim.y += state.pitch * 6;
  forward.copy(aim).sub(eye).normalize();
  eye.addScaledVector(forward, state.zoom);
  camera.position.copy(eye);
  camera.lookAt(aim);
  camera.fov = portrait ? 66 : 50;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
function schedule() {
  if (!request && state.visible && !document.hidden && !state.failed)
    request = requestAnimationFrame(tick);
}
function applyQuality() {
  const limits = [mobile ? 1 : 0.78, 1.25, 1.65];
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, limits[state.quality]),
  );
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = mobile ? state.quality === 2 : state.quality > 0;
  renderer.shadowMap.needsUpdate = true;
  $("#quality").value = String(state.quality);
  state.dirty = true;
  schedule();
}
function tick(now) {
  request = 0;
  if (document.hidden || !state.visible || state.failed) {
    lastFrame = 0;
    return;
  }
  const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 1 / 60;
  lastFrame = now;
  const transitioning =
    Math.abs(state.blend - (state.view === "camp" ? 1 : 0)) > 0.001;
  if (state.playing) state.elapsed += delta;
  if (state.playing || state.dirty || transitioning || firstFrame) {
    updateCamera(delta);
    animateAtmosphere(state.elapsed);
    const renderStart = performance.now();
    try {
      renderer.render(scene, camera);
    } catch (error) {
      fail("画卷绘制中断：" + error.message);
      return;
    }
    lastRenderMs = performance.now() - renderStart;
    if (state.failed) return;
    state.dirty = false;
    frameCount++;
    if (!frameStart) frameStart = now;
    if (now - frameStart > 1000) {
      fps = (frameCount * 1000) / (now - frameStart);
      frameCount = 0;
      frameStart = now;
      slowSamples = fps < 30 ? slowSamples + 1 : 0;
      if (!qualityPinned && slowSamples >= 2 && state.quality > 0) {
        state.quality--;
        applyQuality();
        slowSamples = 0;
      }
    }
    if (firstFrame) {
      firstFrame = false;
      performance.mark("poetic-first-frame");
      $("#veil").classList.add("ready");
      document.documentElement.dataset.ready = "true";
    }
  }
  if (state.playing || transitioning) schedule();
}
function setView(view) {
  state.view = view;
  state.zoom = 0;
  state.yaw = 0;
  state.pitch = 0;
  state.dirty = true;
  $("#view-lamp").setAttribute("aria-pressed", String(view === "lamp"));
  $("#view-camp").setAttribute("aria-pressed", String(view === "camp"));
  schedule();
}
$("#view-lamp").addEventListener("click", () => setView("lamp"));
$("#view-camp").addEventListener("click", () => setView("camp"));
function updatePause() {
  $("#pause").textContent = state.playing ? "暂停" : "继续";
  $("#pause").setAttribute("aria-pressed", String(!state.playing));
}
$("#pause").addEventListener("click", () => {
  state.playing = !state.playing;
  updatePause();
  lastFrame = 0;
  frameStart = 0;
  frameCount = 0;
  schedule();
});
updatePause();
$("#quality").addEventListener("change", () => {
  qualityPinned = true;
  state.quality = Number($("#quality").value);
  applyQuality();
});
$("#reset").addEventListener("click", () => {
  state.yaw = 0;
  state.pitch = 0;
  state.zoom = 0;
  state.dirty = true;
  $("#settings").open = false;
  schedule();
});
let pointer = null;
canvas.addEventListener("pointerdown", (event) => {
  pointer = {
    x: event.clientX,
    y: event.clientY,
    yaw: state.yaw,
    pitch: state.pitch,
    id: event.pointerId,
  };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  state.yaw = clamp(
    pointer.yaw - ((event.clientX - pointer.x) / innerWidth) * 0.7,
    -0.45,
    0.45,
  );
  state.pitch = clamp(
    pointer.pitch + ((event.clientY - pointer.y) / innerHeight) * 0.5,
    -0.22,
    0.22,
  );
  state.dirty = true;
  schedule();
});
canvas.addEventListener("pointerup", () => {
  pointer = null;
});
canvas.addEventListener("pointercancel", () => {
  pointer = null;
});
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    state.zoom = clamp(state.zoom - event.deltaY * 0.002, -1.5, 2);
    state.dirty = true;
    schedule();
  },
  { passive: false },
);
window.addEventListener("resize", applyQuality);
function setVisible(visible) {
  state.visible = visible;
  cancelAnimationFrame(request);
  request = 0;
  lastFrame = 0;
  frameStart = 0;
  frameCount = 0;
  if (visible) {
    state.dirty = true;
    schedule();
  }
}
document.addEventListener("visibilitychange", () =>
  setVisible(!document.hidden),
);
window.addEventListener(
  "message",
  function (
    /** @type {MessageEvent<import('../../../assets/types').SceneVisibilityMessage>} */ event,
  ) {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (
      event.data?.type === "poetic-realms-visibility" &&
      typeof event.data.visible === "boolean"
    )
      setVisible(event.data.visible);
  },
);
window.addEventListener("keydown", (event) => {
  if (event.target.closest("button, a, input, select, summary")) return;
  if (event.key === " ") {
    event.preventDefault();
    $("#pause").click();
  }
  if (event.key.toLowerCase() === "r") $("#reset").click();
});
// 实际运行信息用于设备验收；不向画面默认输出开发参数。
window.__poeticScene = {
  engine: "three.js r" + THREE.REVISION,
  renderer,
  gl: renderer.getContext(),
  fps: () => fps,
  quality: () => ["流畅", "标准", "精细"][state.quality],
  drawCalls: () => renderer.info.render.calls,
  frameMs: () => lastRenderMs,
  time: () => state.elapsed,
  paused: () => !state.playing,
  view: () => state.view,
};
applyQuality();
updateCamera(1);
animateAtmosphere(0);
renderer.compile(scene, camera);
schedule();
