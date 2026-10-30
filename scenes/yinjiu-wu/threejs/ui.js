// 交互与主循环：视角控制、画质、暂停、帧率显示
setView("far", true);
applyQuality(state.quality);
const drift = { yaw: 0, pitch: 0, radius: 0 };
let goal = null;
let dragging = false;
let lastPointer = null;
let pinchDistance = 0;

function setGoal(name) {
  if (!VIEWS[name]) return;
  goal = VIEWS[name];
  state.view = name;
  for (const button of document.querySelectorAll("#views button"))
    button.setAttribute("aria-pressed", String(button.dataset.view === name));
}
function stopGoal() {
  goal = null;
}
setGoal("far");
$("#views").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) setGoal(button.dataset.view);
});
canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
  stopGoal();
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging || !lastPointer) return;
  state.yaw -= (event.clientX - lastPointer.x) * 0.0032;
  state.pitch = clamp(state.pitch + (event.clientY - lastPointer.y) * 0.0024, -0.04, 0.62);
  lastPointer = { x: event.clientX, y: event.clientY };
});
const endDrag = () => {
  dragging = false;
  lastPointer = null;
};
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    state.radius = clamp(state.radius * (1 + event.deltaY * 0.0011), 2.4, 48);
    stopGoal();
  },
  { passive: false },
);
canvas.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 2) return;
  const [a, b] = event.touches;
  const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  if (pinchDistance) {
    state.radius = clamp(state.radius * (pinchDistance / distance), 2.4, 48);
    stopGoal();
  }
  pinchDistance = distance;
});
canvas.addEventListener("touchend", () => {
  pinchDistance = 0;
});
addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
    return;
  }
  if (event.key === "1" || event.key === "2") {
    setGoal(event.key === "1" ? "near" : "far");
    return;
  }
  if (event.key === "ArrowLeft") state.yaw -= 0.08;
  else if (event.key === "ArrowRight") state.yaw += 0.08;
  else if (event.key === "ArrowUp") state.pitch = clamp(state.pitch + 0.05, -0.04, 0.62);
  else if (event.key === "ArrowDown") state.pitch = clamp(state.pitch - 0.05, -0.04, 0.62);
  else return;
  stopGoal();
});

function togglePlay() {
  state.playing = !state.playing;
  $("#pause").textContent = state.playing ? "暂停" : "继续";
  $("#pause").setAttribute("aria-pressed", String(!state.playing));
}
$("#pause").addEventListener("click", togglePlay);
$("#pause").textContent = state.playing ? "暂停" : "继续";
$("#reset").addEventListener("click", () => setGoal(state.view));
$("#quality").addEventListener("change", (event) => applyQuality(Number(event.target.value)));
$("#quality").value = String(state.quality);
$("#text").addEventListener("click", () => {
  const panel = $("#poem-full");
  panel.hidden = !panel.hidden;
  $("#text").setAttribute("aria-expanded", String(!panel.hidden));
});

let elapsed = 0;
let frameId = 0;
let shadowTick = 0;
let fpsTime = 0;
const clock = new THREE.Clock();
function drawFrame(dt) {
  elapsed += dt;
  uni.uTime.value = elapsed;
  poet.userData.update(elapsed);
  updateBirds(elapsed);
  driftParticles(elapsed, dt);
  driftAir(elapsed);
  if (goal) {
    const k = 0.055;
    target.set(
      target.x + (goal.target[0] - target.x) * k,
      target.y + (goal.target[1] - target.y) * k,
      target.z + (goal.target[2] - target.z) * k,
    );
    state.yaw += (goal.yaw - state.yaw) * k;
    state.pitch += (goal.pitch - state.pitch) * k;
    state.radius += (goal.radius - state.radius) * k;
    if (
      Math.abs(goal.radius - state.radius) < 0.05 &&
      Math.abs(goal.yaw - state.yaw) < 0.004
    )
      goal = null;
  }
  drift.yaw = state.autoDrift ? Math.sin(elapsed * 0.052) * 0.11 : 0;
  drift.pitch = state.autoDrift ? Math.sin(elapsed * 0.037 + 1.2) * 0.014 : 0;
  drift.radius = state.autoDrift ? Math.sin(elapsed * 0.031 + 0.4) * 1.5 : 0;
  placeCamera();
  renderer.shadowMap.needsUpdate = shadowTick++ % (state.quality === 2 ? 1 : 2) === 0;
  renderer.render(scene, camera);
}
function tick() {
  frameId = requestAnimationFrame(tick);
  if (state.failed || !state.playing) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (dt <= 0) return;
  try {
    drawFrame(dt);
  } catch (err) {
    fail("绘制中断：" + err.message);
    cancelAnimationFrame(frameId);
    return;
  }
  if (!state.ready) {
    state.ready = true;
    $("#veil").classList.add("ready");
    setTimeout(() => $("#veil").remove(), 1400);
  }
  state.frames++;
  if (elapsed - fpsTime > 1) {
    state.fps = Math.round(state.frames / (elapsed - fpsTime));
    state.frames = 0;
    fpsTime = elapsed;
    $("#fps").textContent = state.fps + " FPS";
  }
}
function start() {
  clock.getDelta();
  if (!frameId) frameId = requestAnimationFrame(tick);
}
function stop() {
  cancelAnimationFrame(frameId);
  frameId = 0;
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
  else if (!state.failed) start();
});
addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "poetic-realms-visibility" && data.visible === false) stop();
  else if (data.type === "poetic-realms-visibility" && data.visible === true) start();
});
// 先把一帧画出来，再交给动画循环
try {
  placeCamera();
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  state.ready = true;
  $("#veil").classList.add("ready");
  setTimeout(() => $("#veil").remove(), 1400);
} catch (err) {
  fail("首帧绘制失败：" + err.message);
}
start();
