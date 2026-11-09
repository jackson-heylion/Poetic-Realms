/* 春江初日：运行时只负责渲染、画质、生命周期与具名状态。 */
/** @typedef {object} QualityPreset
 * @property {number} dpr 最大设备像素比，无单位。
 * @property {number} reflection 反射纹理宽度，单位像素。
 * @property {number} interval 水面反射每隔多少渲染帧更新。
 * @property {number} plants 植物实例保留比例，范围 0 至 1。
 * @property {boolean} shadows 是否启用近岸阴影。
 */
/** @typedef {object} SceneStats
 * @property {boolean} ready 首帧是否成功绘制。
 * @property {number|null} firstFrameMs 启动至首帧的耗时，单位毫秒；未就绪为空。
 * @property {number} frames 已实际绘制的主画面帧数。
 * @property {number} fps 最近采样窗的实际帧率，单位帧每秒。
 * @property {number} time 场景动画累计时间，单位秒。
 * @property {number} drawCalls 本帧含反射和阴影的绘制调用数。
 * @property {number} triangles 本帧含反射和阴影的三角形数。
 * @property {number} pixelRatio 实际使用的设备像素比。
 * @property {string} quality 当前画质：low、normal 或 high。
 * @property {boolean} paused 是否由用户或减少动态偏好暂停。
 * @property {boolean} contextLost 显卡上下文是否已丢失。
 */
/** @typedef {object} CameraView
 * @property {number} yaw 水平环顾偏移，单位弧度。
 * @property {number} pitch 俯仰偏移，单位弧度。
 * @property {number} distance 相机与初始岸线的纵向距离，单位米。
 */
const canvas = document.getElementById("scene");
const mobile = matchMedia("(max-width: 640px)").matches;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
/** @type {Record<"low"|"normal"|"high", QualityPreset>} */
const presets = {
  low: { dpr: 1, reflection: 256, interval: 4, plants: .45, shadows: false },
  normal: { dpr: mobile ? 1 : 1.35, reflection: 512, interval: 2, plants: mobile ? .62 : 1, shadows: !mobile },
  high: { dpr: mobile ? 1.4 : 1.75, reflection: 768, interval: 1, plants: 1, shadows: true },
};
/** @type {SceneStats} */
const stats = window.poeticSceneStats = {
  ready: false, firstFrameMs: null, frames: 0, fps: 0, time: 0,
  drawCalls: 0, triangles: 0, pixelRatio: 1, quality: "normal",
  paused: reducedMotion.matches, contextLost: false,
};
/** @type {CameraView} */
const view = { yaw: 0, pitch: 0, distance: 8 };
/** @type {CameraView} */
const goal = { ...view };
const windTime = { value: 0 };
const sunDirection = new THREE.Vector3(.17, .075, -1).normalize();
const plantBatches = [];
const frameUpdates = [];
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2("#c2c7ae", .0033);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 1600);
const reflectedCamera = camera.clone();
const reflectionMatrix = new THREE.Matrix4();
const reflectBias = new THREE.Matrix4().set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);
const lookTarget = new THREE.Vector3();
const renderer = createRenderer();
let water, reflectionTarget, sunlight, sky;
let raf = 0, previous = 0, fpsStart = 0, fpsFrames = 0;
let failed = false, hostVisible = true, reflectionDirty = true;

function fail(message) {
  failed = true;
  stop();
  document.getElementById("loading").classList.add("ready");
  document.getElementById("error-text").textContent = message;
  document.getElementById("error").hidden = false;
}

function createRenderer() {
  try {
    const instance = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    instance.outputColorSpace = THREE.SRGBColorSpace;
    instance.toneMapping = THREE.ACESFilmicToneMapping;
    instance.toneMappingExposure = 1.03;
    instance.shadowMap.type = THREE.PCFSoftShadowMap;
    instance.shadowMap.autoUpdate = false;
    instance.info.autoReset = false;
    instance.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error("春江着色器", gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment), gl.getProgramInfoLog(program));
      fail("画面着色器编译或链接失败。请更新浏览器后重新载入。");
    };
    return instance;
  } catch (error) {
    // 运行时尚未就位，不进入依赖渲染器的 stop()。
    document.getElementById("loading").hidden = true;
    document.getElementById("error-text").textContent = "浏览器没有可用的 WebGL。请开启硬件加速或换用支持 WebGL 的浏览器后重新载入。";
    document.getElementById("error").hidden = false;
    document.getElementById("retry").onclick = () => location.reload();
    console.error("春江初始化失败", error);
    return null;
  }
}

function applyQuality() {
  const preset = presets[stats.quality];
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, preset.dpr));
  renderer.setSize(innerWidth, innerHeight, false);
  stats.pixelRatio = renderer.getPixelRatio();
  renderer.shadowMap.enabled = preset.shadows;
  renderer.shadowMap.needsUpdate = true;
  if (reflectionTarget) reflectionTarget.dispose();
  const floatReflection = renderer.capabilities.isWebGL2 && renderer.extensions.has("EXT_color_buffer_float");
  reflectionTarget = new THREE.WebGLRenderTarget(preset.reflection, preset.reflection, {
    type: floatReflection ? THREE.HalfFloatType : THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  for (const batch of plantBatches) batch.mesh.count = Math.ceil(batch.total * preset.plants);
  if (water) {
    water.material.uniforms.uReflection.value = reflectionTarget.texture;
    water.material.uniforms.uTexel.value.set(1/preset.reflection,1/preset.reflection);
  }
  resize();
  reflectionDirty = true;
  wake();
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < .8 ? 56 : 48;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  reflectedCamera.copy(camera);
  reflectionDirty = true;
  wake();
}

function positionCamera() {
  view.yaw += (goal.yaw - view.yaw) * .14;
  view.pitch += (goal.pitch - view.pitch) * .14;
  view.distance += (goal.distance - view.distance) * .14;
  const portrait = camera.aspect < .8;
  camera.position.set((portrait ? -1.6 : 1.4) + Math.sin(view.yaw) * 5,
    (portrait ? 1.9 : 2.2) + view.pitch * 5, view.distance);
  lookTarget.set(1.4 + view.yaw * 28, 1.3 + view.pitch * 18, -38);
  camera.lookAt(lookTarget);
  camera.updateMatrixWorld();
}

function renderReflection() {
  reflectedCamera.copy(camera);
  reflectedCamera.position.y *= -1;
  reflectedCamera.up.set(0, -1, 0);
  reflectedCamera.lookAt(lookTarget.x, -lookTarget.y, lookTarget.z);
  reflectedCamera.updateMatrixWorld();
  reflectionMatrix.copy(reflectBias).multiply(reflectedCamera.projectionMatrix).multiply(reflectedCamera.matrixWorldInverse);
  water.visible = false;
  renderer.setRenderTarget(reflectionTarget);
  renderer.render(scene, reflectedCamera);
  renderer.setRenderTarget(null);
  water.visible = true;
  reflectionDirty = false;
}

function movingCamera() {
  return Math.abs(view.yaw-goal.yaw) + Math.abs(view.pitch-goal.pitch) + Math.abs(view.distance-goal.distance) > .0001;
}

function wake() {
  if (!renderer || raf || failed || stats.contextLost || document.hidden || !hostVisible) return;
  previous = 0;
  fpsStart = 0;
  fpsFrames = 0;
  raf = requestAnimationFrame(tick);
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
  previous = 0;
}

function tick(now) {
  raf = 0;
  if (failed || stats.contextLost || document.hidden || !hostVisible) return;
  const dt = previous ? Math.min((now - previous) / 1000, .08) : 0;
  previous = now;
  if (!stats.paused) stats.time += dt;
  windTime.value = stats.time;
  sunDirection.set(.17, .075 + .026 * (1 - Math.exp(-stats.time / 180)), -1).normalize();
  sunlight.position.copy(sunDirection).multiplyScalar(100);
  for (const update of frameUpdates) update(stats.time, dt);
  positionCamera();
  renderer.info.reset();
  if (reflectionDirty || stats.frames % presets[stats.quality].interval === 0 || movingCamera()) renderReflection();
  renderer.render(scene, camera);
  if (failed) return;
  stats.frames++;
  stats.drawCalls = renderer.info.render.calls;
  stats.triangles = renderer.info.render.triangles;
  if (!stats.ready) {
    stats.ready = true;
    stats.firstFrameMs = Math.round(performance.now());
    document.getElementById("loading").classList.add("ready");
    document.getElementById("loading").setAttribute("aria-hidden","true");
  }
  if (!fpsStart) fpsStart = now;
  fpsFrames++;
  if (now - fpsStart >= 1000) {
    stats.fps = Math.round((fpsFrames - 1) * 10000 / (now - fpsStart)) / 10;
    fpsFrames = 1;
    fpsStart = now;
  }
  if (!stats.paused || movingCamera()) raf = requestAnimationFrame(tick);
}

function random(seed) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  let u = x - ix, v = z - iz;
  u = u*u*(3-2*u); v = v*v*(3-2*v);
  const a = random(ix + iz*113), b = random(ix+1 + iz*113);
  const c = random(ix + (iz+1)*113), d = random(ix+1 + (iz+1)*113);
  return (a+(b-a)*u)*(1-v) + (c+(d-c)*u)*v;
}
function fbm(x, z) {
  return noise(x,z)*.55 + noise(x*2.07+31,z*2.07)*.28 + noise(x*4.13,z*4.13+27)*.13 + noise(x*8.7,z*8.7)*.04;
}
function mesh(geometry, material, x=0, y=0, z=0) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(x, y, z);
  scene.add(result);
  return result;
}

function boot() {
  document.getElementById("retry").onclick = () => location.reload();
  if (!renderer) return;
  try {
    buildAtmosphere();
    buildLandscape();
    buildPlants();
    buildWater();
    bindControls();
    applyQuality();
  } catch (error) {
    console.error("春江场景失败", error);
    fail("诗境未能载入。请使用省电画质或更新浏览器后重试。");
  }
}
// 源码全部拼接后启动；成品没有外部资源加载阶段。
setTimeout(boot, 0);
