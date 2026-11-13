const views = {
  wide: { target: [-15, 65, -80], yaw: 0.78, pitch: 0.27, distance: 410 },
  gate: { target: [45, 40, 55], yaw: 0.65, pitch: 0.28, distance: 132 },
  river: { target: [-45, 8, -35], yaw: -0.12, pitch: 0.25, distance: 170 },
};
if (mobile) {
  views.wide.target = [45, 50, 35];
  views.wide.yaw = 0.56;
  views.wide.pitch = 0.38;
  views.wide.distance = 430;
}
let desired = {
    ...views.wide,
    target: new THREE.Vector3(...views.wide.target),
  },
  target = desired.target.clone(),
  yaw = desired.yaw,
  pitch = desired.pitch,
  distance = desired.distance;
let paused = false,
  hidden = document.hidden,
  needs = true,
  simTime = 0,
  last = performance.now(),
  frames = 0,
  fpsTime = 0,
  fps = 0,
  drag = null,
  pointers = new Map(),
  pinch = 0;
function setView(name) {
  const v = views[name];
  desired = {
    target: new THREE.Vector3(...v.target),
    yaw: v.yaw,
    pitch: v.pitch,
    distance: v.distance,
  };
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.view === name)),
    );
  needs = true;
}
document
  .querySelectorAll("[data-view]")
  .forEach((b) => (b.onclick = () => setView(b.dataset.view)));
function togglePause() {
  paused = !paused;
  $("pause").textContent = paused ? "继续" : "暂停";
  $("pause").setAttribute("aria-pressed", String(paused));
  needs = true;
}
$("pause").onclick = togglePause;
addEventListener("keydown", (e) => {
  if (e.code === "Space" && !$("text").open) {
    e.preventDefault();
    togglePause();
  }
});
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  drag = [e.clientX, e.clientY];
  if (pointers.size === 2) {
    const p = [...pointers.values()];
    pinch = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
  if (pointers.size === 2) {
    const p = [...pointers.values()],
      d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
    desired.distance = clamp(
      (desired.distance * pinch) / Math.max(d, 1),
      75,
      520,
    );
    pinch = d;
  } else if (drag) {
    desired.yaw -= (e.clientX - drag[0]) * 0.004;
    desired.pitch = clamp(
      desired.pitch + (e.clientY - drag[1]) * 0.003,
      0.08,
      0.72,
    );
  }
  drag = [e.clientX, e.clientY];
  needs = true;
});
function release(e) {
  pointers.delete(e.pointerId);
  drag = null;
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    desired.distance = clamp(
      desired.distance * Math.exp(e.deltaY * 0.001),
      75,
      520,
    );
    needs = true;
  },
  { passive: false },
);
function applyQuality() {
  const q = $("quality").value,
    ratio = q === "high" ? 1.75 : q === "normal" ? 1.3 : 1;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, ratio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = q === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = q === "high";
  mist.forEach((m, i) => (m.visible = q !== "low" || i % 3 === 0));
  scene.fog.density = q === "low" ? 0.00185 : 0.00165;
  needs = true;
}
$("quality").onchange = applyQuality;
applyQuality();
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  needs = true;
});
document.addEventListener("visibilitychange", () => {
  hidden = document.hidden;
  last = performance.now();
  if (!hidden) requestAnimationFrame(tick);
});
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  hidden = true;
  fail("图形上下文已丢失。请点「重新入境」恢复场景。");
});
canvas.addEventListener("webglcontextrestored", () => location.reload());
window.__tongguan = () => ({
  fps,
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  quality: $("quality").value,
  paused,
});
function tick(now) {
  if (hidden) return;
  requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!paused) simTime += dt;
  const k = reduced ? 1 : Math.min(1, dt * 4.5);
  yaw = lerp(yaw, desired.yaw, k);
  pitch = lerp(pitch, desired.pitch, k);
  distance = lerp(distance, desired.distance, k);
  target.lerp(desired.target, k);
  const drift = !reduced && !paused ? Math.sin(simTime * 0.045) * 0.012 : 0,
    fit = camera.aspect < 0.85 ? 1.12 : 1;
  camera.position.set(
    target.x + Math.sin(yaw + drift) * Math.cos(pitch) * distance * fit,
    target.y + Math.sin(pitch) * distance * fit,
    target.z + Math.cos(yaw + drift) * Math.cos(pitch) * distance * fit,
  );
  camera.lookAt(target);
  sky.position.copy(camera.position);
  waterMat.uniforms.uTime.value = simTime;
  skyMat.uniforms.uTime.value = simTime;
  sprayMat.uniforms.uTime.value = simTime;
  mist.forEach(
    (m) =>
      (m.position.x =
        m.userData.x + Math.sin(simTime * 0.035 + m.userData.p) * 45),
  );
  if (!paused || needs) {
    renderer.render(scene, camera);
    needs = false;
  }
  frames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fps = Math.round(frames / fpsTime);
    $("meter").textContent =
      fps + " FPS · " + renderer.info.render.calls + " calls";
    frames = 0;
    fpsTime = 0;
  }
}
renderer.render(scene, camera);
document.documentElement.dataset.ready = "true";
$("veil").classList.add("ready");
setTimeout(() => ($("veil").style.display = "none"), 900);
if (self !== top)
  parent.postMessage({ type: "poetic-realms:scene-ready" }, "*");
requestAnimationFrame(tick);
