/* 诗境的运行时：渲染器、相机、手势、画质档、主循环与错误兜底。 */
const PR = (window.PR = {
  time: 0,
  quality: "normal",
  paused: false,
  visible: true,
  views: {
    far: { dist: 21, yaw: 0.1, pitch: 1.46, target: [0.4, 1.7, -4] },
    near: { dist: 3.4, yaw: 3.14, pitch: 1.36, target: [2.28, 1.0, 3.6] },
  },
});

const QUALITY = {
  high: { dpr: 2, grass: 6200, chrys: 400, mist: 5, shadow: 2048, birds: 9 },
  normal: { dpr: 1.6, grass: 3600, chrys: 220, mist: 4, shadow: 1024, birds: 8 },
  low: { dpr: 1.2, grass: 1500, chrys: 130, mist: 2, shadow: 0, birds: 5 },
};

const canvas = document.getElementById("scene");
const veil = document.getElementById("veil");
const veilText = document.getElementById("veil-text");
const retry = document.getElementById("retry");
const meter = document.getElementById("meter");

PR.params = QUALITY[PR.quality];
PR.view = {
  dist: PR.views.far.dist,
  yaw: PR.views.far.yaw,
  pitch: PR.views.far.pitch,
  target: new THREE.Vector3(...PR.views.far.target),
};
PR.goal = { ...PR.view, target: PR.view.target.clone() };

function fail(message) {
  veil.classList.remove("ready");
  veilText.textContent = message;
  retry.hidden = false;
}

function boot() {
  try {
    PR.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: PR.quality !== "low",
      powerPreference: "high-performance",
      alpha: false,
    });
  } catch (error) {
    fail("这个浏览器没有可用的 WebGL。");
    return;
  }

  const renderer = PR.renderer;
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, PR.params.dpr),
  );
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = PR.params.shadow > 0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.debug.onShaderError = () => fail("诗境着色器编译失败。");

  PR.scene = new THREE.Scene();
  PR.camera = new THREE.PerspectiveCamera(
    46,
    window.innerWidth / window.innerHeight,
    0.1,
    900,
  );

  PR.build = () => {
    World.build(PR.scene, PR.params);
    Props.build(PR.scene, PR.params);
    Plants.build(PR.scene, PR.params);
    Figure.build(PR.scene);
    Birds.build(PR.scene, PR.params);
    UI.bind();
  };

  try {
    PR.build();
  } catch (error) {
    fail("诗境未能成形：" + error.message);
    return;
  }

  bindGestures(canvas);
  bindChrome();
  addEventListener("resize", onResize);
  addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", () => {
    PR.visible = !document.hidden;
    if (PR.visible) wake();
  });
  addEventListener("message", (event) => {
    if (event.data && event.data.type === "poetic-realms:visibility")
      PR.visible = Boolean(event.data.visible);
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    PR.paused = true;
    fail("显卡上下文已丢失，正在等待恢复。");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    PR.paused = false;
    veil.classList.add("ready");
    retry.hidden = true;
    wake();
  });

  PR.camera.position.setFromSphericalCoords(
    PR.view.dist,
    PR.view.pitch,
    PR.view.yaw,
  ).add(PR.view.target);
  PR.camera.lookAt(PR.view.target);
  PR.frame = 0;
  PR.ready = false;
  wake();
}

// 各模块在本文件之后拼入，等它们就位再启动。
setTimeout(boot, 0);

function onResize() {
  if (!PR.renderer) return;
  PR.camera.aspect = window.innerWidth / window.innerHeight;
  PR.camera.updateProjectionMatrix();
  PR.renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, PR.params.dpr),
  );
  PR.renderer.setSize(window.innerWidth, window.innerHeight, false);
}

let last = 0,
  fpsFrames = 0,
  fpsStart = 0,
  raf = 0,
  idle = 0;

function wake() {
  if (raf || PR.paused) return;
  last = 0;
  raf = requestAnimationFrame(tick);
}

function tick(now) {
  raf = 0;
  if (!PR.visible) return;
  const dt = last ? Math.min((now - last) / 1000, 0.08) : 0.016;
  last = now;
  if (!PR.paused) {
    PR.time += dt;
    step(dt);
    PR.frame++;
  }
  PR.renderer.render(PR.scene, PR.camera);
  if (!PR.ready && !PR.paused) {
    PR.ready = true;
    veil.classList.add("ready");
  }
  fpsFrames++;
  if (now - fpsStart > 900) {
    if (meter) meter.textContent = Math.round((fpsFrames * 1000) / (now - fpsStart)) + " FPS";
    fpsFrames = 0;
    fpsStart = now;
  }
  if (!PR.paused) raf = requestAnimationFrame(tick);
}

function step(dt) {
  idle += dt;
  if (idle > 5) PR.goal.yaw += dt * 0.014;
  const ease = 1 - Math.pow(0.0016, dt);
  PR.view.dist += (PR.goal.dist - PR.view.dist) * ease;
  PR.view.yaw += (PR.goal.yaw - PR.view.yaw) * ease;
  PR.view.pitch += (PR.goal.pitch - PR.view.pitch) * ease;
  PR.view.target.lerp(PR.goal.target, ease);
  PR.camera.position
    .setFromSphericalCoords(PR.view.dist, PR.view.pitch, PR.view.yaw)
    .add(PR.view.target);
  PR.camera.lookAt(PR.view.target);
  World.update(PR.time);
  Plants.update(PR.time);
  Figure.update(PR.time);
  Birds.update(PR.time, dt);
}

const pointers = new Map();
let pinch = 0;

function bindGestures(node) {
  node.addEventListener("pointerdown", (event) => {
    node.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    idle = 0;
  });
  node.addEventListener("pointermove", (event) => {
    const start = pointers.get(event.pointerId);
    if (!start) return;
    idle = 0;
    if (pointers.size === 1) {
      const dx = event.clientX - start.x,
        dy = event.clientY - start.y;
      PR.goal.yaw -= dx * 0.0042;
      PR.goal.pitch = clamp(PR.goal.pitch - dy * 0.0032, 0.62, 1.53);
      PR.view.yaw = PR.goal.yaw;
      PR.view.pitch = PR.goal.pitch;
    }
    start.x = event.clientX;
    start.y = event.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const span = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) PR.goal.dist = clamp(PR.goal.dist * (pinch / span), 2.6, 34);
      pinch = span;
    }
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = 0;
  };
  node.addEventListener("pointerup", release);
  node.addEventListener("pointercancel", release);
  node.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      idle = 0;
      PR.goal.dist = clamp(PR.goal.dist * (1 + event.deltaY * 0.0009), 2.6, 34);
    },
    { passive: false },
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

PR.setView = (name) => {
  const view = PR.views[name];
  if (!view) return;
  PR.goal.dist = view.dist;
  PR.goal.yaw = view.yaw;
  PR.goal.pitch = view.pitch;
  PR.goal.target.set(...view.target);
  idle = 0;
  UI.press(name === "near" ? "view-near" : "view-far");
};

function bindChrome() {
  document.getElementById("view-near").addEventListener("click", () => PR.setView("near"));
  document.getElementById("view-far").addEventListener("click", () => PR.setView("far"));
  document.getElementById("pause").addEventListener("click", (event) => {
    PR.paused = !PR.paused;
    event.currentTarget.setAttribute("aria-pressed", String(PR.paused));
    event.currentTarget.textContent = PR.paused ? "继续" : "暂停";
    if (!PR.paused) wake();
    else PR.renderer.render(PR.scene, PR.camera);
  });
  document.getElementById("quiet").addEventListener("click", () => {
    const quiet = document.body.classList.toggle("is-quiet");
    document.getElementById("quiet").setAttribute("aria-pressed", String(quiet));
  });
  document.getElementById("quality").addEventListener("change", (event) => {
    PR.quality = event.target.value;
    PR.params = QUALITY[PR.quality];
    veilText.textContent = "正在调息……";
    veil.classList.remove("ready");
    setTimeout(() => {
      PR.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PR.params.dpr));
      PR.renderer.setSize(window.innerWidth, window.innerHeight, false);
      PR.renderer.shadowMap.enabled = PR.params.shadow > 0;
      PR.scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
      PR.scene.clear();
      PR.ready = false;
      PR.build();
      PR.frame = 0;
    }, 60);
  });
  retry.addEventListener("click", () => location.reload());
}

function onKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === " ") {
    event.preventDefault();
    document.getElementById("quiet").click();
  } else if (event.key === "1") PR.setView("far");
  else if (event.key === "2") PR.setView("near");
  else if (event.key === "Escape") document.getElementById("sheet").hidden = true;
}
