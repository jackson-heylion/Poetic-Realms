const THREE = window.THREE;
const $ = (selector) => document.querySelector(selector);
const mobile =
  (innerWidth >= 320 && innerWidth < 720) ||
  matchMedia("(pointer: coarse)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
/** @type {import('./types').SceneState} */
const state = {
  view: "lamp",
  playing: !reduceMotion,
  visible: true,
  elapsed: 0,
  blend: 0,
  quality: mobile ? 0 : 1,
  yaw: 0,
  pitch: 0,
  zoom: 0,
  dirty: true,
  failed: false,
};
if (self !== top) document.documentElement.classList.add("embed");
function fail(message) {
  state.failed = true;
  $("#veil").classList.remove("ready");
  $("#loading-text").hidden = true;
  $("#error").hidden = false;
  $("#error").textContent = message;
  $("#retry").hidden = false;
}
$("#retry").addEventListener("click", () => location.reload());
window.addEventListener("error", (event) =>
  fail("画卷暂未能展开：" + event.message),
);
const canvas = $("#canvas");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
} catch {
  fail("浏览器无法启用 WebGL。请开启硬件加速，或换用支持三维绘制的浏览器。");
  return;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = !mobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
  console.error(
    gl.getProgramInfoLog(program),
    gl.getShaderInfoLog(vertex),
    gl.getShaderInfoLog(fragment),
  );
  fail("三维材质编译失败，请刷新页面重试。");
};
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  fail("图形上下文已丢失，请重新入境。");
});
canvas.addEventListener("webglcontextrestored", () => location.reload());
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111b2a);
scene.fog = new THREE.FogExp2(0x263342, 0.014);
const camera = new THREE.PerspectiveCamera(
  48,
  innerWidth / innerHeight,
  0.07,
  700,
);
const ambient = new THREE.HemisphereLight(0x9cbbdf, 0x34241b, 1.05);
scene.add(ambient);
const moonlight = new THREE.DirectionalLight(0xb4c9ea, 1.45);
moonlight.position.set(-28, 40, -38);
scene.add(moonlight);
const seed = (initial) => () => {
  initial |= 0;
  initial = (initial + 0x6d2b79f5) | 0;
  let value = Math.imul(initial ^ (initial >>> 15), 1 | initial);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
const random = seed(19801162);
const clamp = THREE.MathUtils.clamp;
function mesh(geometry, material, position = [0, 0, 0], parent = scene) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  parent.add(object);
  return object;
}
function segment(from, to, radius, material, parent = scene) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to);
  const object = mesh(
    new THREE.CylinderGeometry(radius, radius * 0.9, a.distanceTo(b), 6),
    material,
    [0, 0, 0],
    parent,
  );
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    b.sub(a).normalize(),
  );
  return object;
}
const flagTimes = [];
const flameRigs = [];
const warmLights = [];
