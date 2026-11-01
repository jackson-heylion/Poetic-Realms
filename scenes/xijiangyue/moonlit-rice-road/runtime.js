/* 运行时：渲染器、相机、光照、画质档与主循环。 */

const THREE = window.THREE;
const DEG = Math.PI / 180;

const U = {
  clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  smoothstep(e0, e1, x) {
    const t = U.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  },
  hash(n) {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  },
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  noise2(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = U.hash(xi * 57 + yi * 131);
    const b = U.hash((xi + 1) * 57 + yi * 131);
    const c = U.hash(xi * 57 + (yi + 1) * 131);
    const d = U.hash((xi + 1) * 57 + (yi + 1) * 131);
    return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
  },
  fbm(x, y, octaves) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    const n = octaves || 4;
    for (let i = 0; i < n; i++) {
      sum += U.noise2(x * freq, y * freq) * amp;
      freq *= 2.07;
      amp *= 0.5;
    }
    return sum;
  },
  /** 画一张 CanvasTexture，颜色按 sRGB 解释。 */
  texture(w, h, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = S.aniso || 1;
    return tex;
  },
};

const QUALITY = {
  high: { dpr: 2.0, blades: 24000, stars: 520, flies: 120, shadow: 1024 },
  normal: { dpr: 1.5, blades: 14000, stars: 360, flies: 78, shadow: 0 },
  low: { dpr: 1.0, blades: 5000, stars: 190, flies: 34, shadow: 0 },
};

const S = {
  quality: "normal",
  q: QUALITY.normal,
  dprCap: 1.5,
  aniso: 1,
  paused: false,
  still: false,
  time: 0,
  frame: 0,
  fps: 60,
  ready: false,
  failed: false,
  needsRender: true,
  contextLost: false,
  uTime: { value: 0 },
  moonDir: new THREE.Vector3(-0.263, 0.372, -1).normalize(),
  reduced:
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};
window.PR = S;

const canvas = document.getElementById("scene");
const veil = document.getElementById("veil");
const veilText = document.getElementById("veil-text");
const veilRetry = document.getElementById("retry");
const noticeEl = document.getElementById("notice");
const meterEl = document.getElementById("meter");

let renderer;
let scene;
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 3000);

/* 机位：站在田埂上抬眼望月，可小幅环顾。 */
const CAM = {
  base: new THREE.Vector3(1.15, 1.92, 10.4),
  dir: new THREE.Vector3(-2.4, 3.35, -16).sub(new THREE.Vector3(1.15, 1.92, 10.4)).normalize(),
  yaw: 0,
  pitch: 0,
  dolly: 0,
  targetYaw: 0,
  targetPitch: 0,
  targetDolly: 0,
  yaw0: 0,
  pitch0: 0,
};
CAM.yaw0 = Math.atan2(-CAM.dir.x, -CAM.dir.z);
CAM.pitch0 = Math.asin(U.clamp(CAM.dir.y, -1, 1));

/* 预设机位：望野（远望月与稻浪）／过桥（贴近溪桥）。 */
const VIEWS = {
  widen: { yaw: 0, pitch: 0, dolly: 0 },
  moon: { yaw: 0.03, pitch: 0.115, dolly: -1.6 },
};

let noticeTimer = 0;
function notice(msg, sticky) {
  if (!noticeEl) return;
  noticeEl.textContent = msg;
  noticeEl.classList.add("show");
  clearTimeout(noticeTimer);
  if (!sticky) noticeTimer = setTimeout(() => noticeEl.classList.remove("show"), 5200);
}

function fail(msg) {
  if (veilText) veilText.textContent = msg;
  if (veil) veil.classList.remove("hide");
  if (veilRetry) veilRetry.hidden = false;
  S.failed = true;
}

/* ── 渲染器 ─────────────────────────────────── */
function createRenderer() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch (err) {
    console.error(err);
    fail("此设备未能创建 WebGL 上下文，请换用较新的浏览器或开启硬件加速。");
    return false;
  }
  if (!renderer.capabilities.isWebGL2 && !renderer.getContext()) {
    fail("浏览器不支持 WebGL。");
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, S.dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = true;
  S.aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  /* 着色器编译失败不要静默黑屏 */
  renderer.debug.onShaderError = function (gl, program, vs, fs) {
    console.error(
      "[诗境] 着色器失败\nprogram: " +
        (gl.getProgramInfoLog(program) || "—") +
        "\nvertex: " +
        (gl.getShaderInfoLog(vs) || "—") +
        "\nfragment: " +
        (gl.getShaderInfoLog(fs) || "—"),
    );
    notice("着色器编译失败，画面可能不完整。请刷新重试。", true);
  };

  canvas.addEventListener(
    "webglcontextlost",
    function (e) {
      e.preventDefault();
      S.contextLost = true;
      notice("图形上下文已丢失，等待浏览器恢复……", true);
    },
    false,
  );
  canvas.addEventListener(
    "webglcontextrestored",
    function () {
      S.contextLost = false;
      noticeEl && noticeEl.classList.remove("show");
      S.needsRender = true;
    },
    false,
  );
  return true;
}

/* ── 光照 ───────────────────────────────────── */
let moonLight = null;
function buildLights() {
  moonLight = new THREE.DirectionalLight(0xc6daf8, 3.1);
  moonLight.position.copy(S.moonDir).multiplyScalar(120);
  moonLight.target.position.set(0, 0, -6);
  scene.add(moonLight.target);
  if (S.q.shadow > 0) {
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(S.q.shadow, S.q.shadow);
    moonLight.shadow.camera.left = -26;
    moonLight.shadow.camera.right = 26;
    moonLight.shadow.camera.top = 26;
    moonLight.shadow.camera.bottom = -26;
    moonLight.shadow.camera.near = 60;
    moonLight.shadow.camera.far = 200;
    moonLight.shadow.bias = -0.0009;
    moonLight.shadow.normalBias = 0.05;
    moonLight.shadow.radius = 3;
  }
  scene.add(moonLight);

  /* 天光：上方偏蓝，地面反射偏暗绿 */
  scene.add(new THREE.HemisphereLight(0x3d5f8c, 0x18251b, 1.75));

  /* 天空漫射的补光，极弱，只用来分开剪影 */
  const fill = new THREE.DirectionalLight(0x466694, 0.6);
  fill.position.set(6, 9, 14);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x2c4265, 0.3));
}

/* ── 画质 ───────────────────────────────────── */
function applyQuality(name) {
  const key = QUALITY[name] ? name : "normal";
  S.quality = key;
  S.q = QUALITY[key];
  S.dprCap = S.q.dpr;
  if (renderer) {
    renderer.shadowMap.enabled = S.q.shadow > 0;
    if (moonLight) moonLight.castShadow = S.q.shadow > 0;
  }
  if (typeof Sky !== "undefined") Sky.setQuality(S.q);
  if (typeof World !== "undefined") World.setQuality(S.q);
  if (typeof Plants !== "undefined") Plants.setQuality(S.q);
  if (typeof Life !== "undefined") Life.setQuality(S.q);
  onResize();
  S.needsRender = true;
}

/* ── 尺寸 ───────────────────────────────────── */
function onResize() {
  if (!renderer) return;
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  camera.aspect = w / h;
  /* 竖屏把垂直视角放宽一点，保住月亮与稻浪 */
  camera.fov = camera.aspect < 0.85 ? 58 : 46;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, S.dprCap));
  renderer.setSize(w, h, false);
  S.needsRender = true;
}

/* ── 机位更新 ───────────────────────────────── */
let dragId = null;
let dragX = 0;
let dragY = 0;

function setupInteraction() {
  canvas.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragId = e.pointerId;
    dragX = e.clientX;
    dragY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    hideHint();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - dragX;
    const dy = e.clientY - dragY;
    dragX = e.clientX;
    dragY = e.clientY;
    CAM.targetYaw = U.clamp(CAM.targetYaw - dx * 0.0016, -0.42, 0.42);
    CAM.targetPitch = U.clamp(CAM.targetPitch - dy * 0.0013, -0.26, 0.3);
    S.needsRender = true;
  });
  const end = function (e) {
    if (dragId === null || (e && e.pointerId !== dragId)) return;
    dragId = null;
    if (e && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      CAM.targetDolly = U.clamp(CAM.targetDolly + Math.sign(e.deltaY) * 0.9, -7.5, 2.2);
      S.needsRender = true;
      hideHint();
    },
    { passive: false },
  );
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  /* 键盘：空格静观、Esc 收卷、M 显示帧率 */
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (typeof UI !== "undefined") UI.toggleStill();
    } else if (e.code === "Escape") {
      if (typeof UI !== "undefined") UI.closeSheet();
    } else if (e.key === "m" || e.key === "M") {
      if (meterEl) meterEl.hidden = !meterEl.hidden;
    }
  });
}

function updateCamera(dt, t) {
  const ease = S.reduced ? 1 : Math.min(1, dt * 2.6);
  CAM.yaw += (CAM.targetYaw - CAM.yaw) * ease;
  CAM.pitch += (CAM.targetPitch - CAM.pitch) * ease;
  CAM.dolly += (CAM.targetDolly - CAM.dolly) * Math.min(1, dt * 1.8);

  const drift = S.still ? 0 : 1;
  const breathe = Math.sin(t * 0.72) * 0.012 * drift;
  const sway = Math.sin(t * 0.083) * 0.014 * drift;

  camera.position.set(
    CAM.base.x + Math.sin(t * 0.11) * 0.06 * drift,
    CAM.base.y + breathe + Math.sin(t * 0.05) * 0.02 * drift,
    CAM.base.z,
  );
  const yaw = CAM.yaw0 + CAM.yaw + sway;
  const pitch = CAM.pitch0 + CAM.pitch + Math.sin(t * 0.061) * 0.004 * drift;
  camera.rotation.set(pitch, yaw, 0, "YXZ");
  camera.translateZ(CAM.dolly);
}

let hintHidden = false;
function hideHint() {
  if (hintHidden) return;
  hintHidden = true;
  const el = document.getElementById("hint");
  if (el) el.classList.add("gone");
}

/* ── 主循环 ─────────────────────────────────── */
let lastTime = 0;
let meterAcc = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const stamp = typeof now === "number" ? now : performance.now();
  if (!lastTime) lastTime = stamp;
  const raw = (stamp - lastTime) / 1000;
  lastTime = stamp;
  const dt = Math.min(raw, 0.05);

  if (S.contextLost || S.failed) return;

  if (!S.paused && !document.hidden) {
    S.time += dt;
    S.uTime.value = S.time;
    updateCamera(dt, S.time);
    updateWorld(dt, S.time);
    S.fps = S.fps * 0.9 + (1 / Math.max(raw, 0.0001)) * 0.1;
  } else if (!S.needsRender && !S.paused) {
    return;
  }

  renderer.render(scene, camera);
  S.needsRender = false;
  S.frame++;

  if (!S.ready) {
    S.ready = true;
    document.documentElement.dataset.ready = "true";
    if (veil) {
      veil.classList.add("hide");
      setTimeout(() => {
        if (veil) veil.style.display = "none";
      }, 1700);
    }
  }

  meterAcc += dt;
  if (meterEl && !meterEl.hidden && meterAcc > 0.4) {
    meterAcc = 0;
    meterEl.textContent =
      S.fps.toFixed(0).padStart(3, " ") +
      " fps · " +
      renderer.info.render.calls +
      " call";
  }
}

function updateWorld(dt, t) {
  if (typeof Sky !== "undefined") Sky.update(dt, t);
  if (typeof World !== "undefined") World.update(dt, t);
  if (typeof Plants !== "undefined") Plants.update(dt, t);
  if (typeof Props !== "undefined") Props.update(dt, t);
  if (typeof Birds !== "undefined") Birds.update(dt, t);
  if (typeof Life !== "undefined") Life.update(dt, t);
}

/* ── 启动 ───────────────────────────────────── */
function boot() {
  if (!createRenderer()) return;
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1622, 38, 340);

  buildLights();
  try {
    Sky.build(scene);
    World.build(scene);
    Plants.build(scene);
    Props.build(scene);
    Birds.build(scene);
    Life.build(scene);
  } catch (err) {
    console.error(err);
    fail("场景装配失败：" + (err && err.message ? err.message : "未知错误"));
    return;
  }

  /* 默认标准档：手机会自动按 DPR 上限降到 1.5，省电档再降到 1 */
  applyQuality("normal");
  setupInteraction();
  onResize();

  window.__poeticScene = {
    gl: renderer.getContext(),
    renderer: renderer,
    scene: scene,
    camera: camera,
    fps: () => Math.round(S.fps),
    drawCalls: () => renderer.info.render.calls,
    triangles: () => renderer.info.render.triangles,
    quality: () => S.quality,
    setQuality: applyQuality,
  };

  requestAnimationFrame(animate);
}

if (veilRetry) {
  veilRetry.addEventListener("click", function () {
    location.reload();
  });
}
