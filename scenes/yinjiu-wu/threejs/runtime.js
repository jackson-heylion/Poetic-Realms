// 饮酒·其五 · 东篱日夕 —— 运行时：渲染器、相机、光照与画质
const THREE = window.THREE;
const $ = (selector) => document.querySelector(selector);
const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 720;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const uni = { uTime: { value: 0 } };
/** @type {{playing:boolean,quality:number,view:string,yaw:number,pitch:number,radius:number,autoDrift:boolean,failed:boolean,ready:boolean,frames:number,fps:number}} */
const state = {
  playing: !reduceMotion,
  quality: mobile ? 1 : 2,
  view: "far",
  yaw: -0.1,
  pitch: 0.075,
  radius: 21,
  autoDrift: !reduceMotion,
  failed: false,
  ready: false,
  frames: 0,
  fps: 0,
};
const VIEWS = {
  near: { target: [5.15, 0.5, -0.05], yaw: 0.3, pitch: 0.06, radius: 2.5 },
  far: { target: [-1.6, 1.25, -3.2], yaw: -0.1, pitch: 0.075, radius: 21 },
};
if (self !== top) document.documentElement.classList.add("embed");

function fail(message) {
  state.failed = true;
  state.playing = false;
  const veil = $("#veil");
  if (!veil) return;
  veil.classList.remove("ready");
  $("#loading-text").hidden = true;
  $("#error").hidden = false;
  $("#error").textContent = message;
  $("#retry").hidden = false;
}
$("#retry").addEventListener("click", () => location.reload());
window.addEventListener("error", (event) =>
  fail("诗境暂未能展开：" + event.message),
);

const canvas = $("#canvas");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance",
  });
} catch (err) {
  fail("浏览器无法启用 WebGL。请开启硬件加速，或换用支持三维绘制的浏览器。");
  return;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.debug.onShaderError = () =>
  fail("三维材质编译失败，请刷新页面重新入境。");
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  fail("图形上下文已丢失，请重新入境。");
});
canvas.addEventListener("webglcontextrestored", () => location.reload());

const scene = new THREE.Scene();
const HAZE = 0xdcbf97;
scene.fog = new THREE.FogExp2(HAZE, 0.0026);
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1400);
const target = new THREE.Vector3(...VIEWS.far.target);

// 光照：低角度秋阳在前侧偏左，天光作补，弱冷暖对比
const SUN_DIR = new THREE.Vector3(-0.3, 0.3, -0.9).normalize();
const sky = new THREE.HemisphereLight(0xffdcae, 0x5d6039, 0.86);
scene.add(sky);
const sun = new THREE.DirectionalLight(0xffcb8a, 2.95);
sun.position.copy(SUN_DIR).multiplyScalar(120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 20;
sun.shadow.camera.far = 260;
sun.shadow.camera.left = -34;
sun.shadow.camera.right = 34;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.035;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xc2d6ec, 0.62);
fill.position.set(38, 52, 92);
scene.add(fill);
const bounce = new THREE.AmbientLight(0xffe6c4, 0.1);
scene.add(bounce);

function placeCamera() {
  const cp = Math.cos(state.pitch);
  camera.position.set(
    target.x + state.radius * cp * Math.sin(state.yaw),
    target.y + state.radius * Math.sin(state.pitch),
    target.z + state.radius * cp * Math.cos(state.yaw),
  );
  camera.position.y = Math.max(camera.position.y, terrainHeight(camera.position.x, camera.position.z) + 0.75);
  camera.lookAt(target);
}
function setView(name, instant) {
  const view = VIEWS[name];
  if (!view) return;
  state.view = name;
  if (instant) target.set(...view.target);
  else {
    target.x += (view.target[0] - target.x) * 0.12;
    target.y += (view.target[1] - target.y) * 0.12;
    target.z += (view.target[2] - target.z) * 0.12;
  }
  state.yaw += (view.yaw - state.yaw) * (instant ? 1 : 0.12);
  state.pitch += (view.pitch - state.pitch) * (instant ? 1 : 0.12);
  state.radius += (view.radius - state.radius) * (instant ? 1 : 0.12);
}
function resize() {
  const w = innerWidth,
    h = innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, [1, 1.5, 2][state.quality]));
  renderer.setSize(w, h, false);
  renderer.shadowMap.needsUpdate = true;
}
addEventListener("resize", resize);

const LIMITS = [
  { grass: 1400, flowers: 90, motes: 120, birds: 9, mist: 2, clouds: 2, shadow: 0 },
  { grass: 4200, flowers: 200, motes: 260, birds: 14, mist: 3, clouds: 3, shadow: 1024 },
  { grass: 11500, flowers: 420, motes: 500, birds: 20, mist: 5, clouds: 4, shadow: 2048 },
];
function applyQuality(level) {
  state.quality = Math.min(2, Math.max(0, level | 0));
  const limit = LIMITS[state.quality];
  renderer.shadowMap.enabled = limit.shadow > 0;
  if (limit.shadow > 0) {
    sun.shadow.mapSize.set(limit.shadow, limit.shadow);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  for (const part of scene.userData.graded || []) part(limit);
  if ($("#quality")) $("#quality").value = String(state.quality);
  resize();
}
scene.userData.graded = [];
function grade(fn) {
  scene.userData.graded.push(fn);
  fn(LIMITS[state.quality]);
}
