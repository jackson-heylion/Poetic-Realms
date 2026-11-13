"use strict";
const $ = (id) => document.getElementById(id),
  canvas = $("scene");
const mobile = matchMedia("(max-width:700px)").matches,
  reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
$("quality").value = mobile ? "low" : "normal";
$("read").onclick = () => $("text").showModal();
$("close").onclick = () => $("text").close();
$("retry").onclick = () => location.reload();
function fail(message) {
  $("status").textContent = message;
  $("retry").hidden = false;
  $("veil").classList.remove("ready");
}
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
function hash(x, z) {
  return (
    ((Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1) +
    ((Math.sin(x * 127.1 + z * 311.7) * 43758.5453) % 1 < 0 ? 1 : 0)
  );
}
function noise(x, z) {
  const X = Math.floor(x),
    Z = Math.floor(z),
    u = smooth(0, 1, x - X),
    v = smooth(0, 1, z - Z);
  return lerp(
    lerp(hash(X, Z), hash(X + 1, Z), u),
    lerp(hash(X, Z + 1), hash(X + 1, Z + 1), u),
    v,
  );
}
function fbm(x, z) {
  let n = 0,
    a = 0.5;
  for (let i = 0; i < 5; i++) {
    n += noise(x, z) * a;
    x = x * 2.03 + 7.1;
    z = z * 2.03 - 3.8;
    a *= 0.5;
  }
  return n;
}
const gauss = (x, z, cx, cz, sx, sz) =>
  Math.exp(-(((x - cx) / sx) ** 2) - ((z - cz) / sz) ** 2);
function north(x, z) {
  const s = smooth(102, 195, -z),
    p =
      165 * gauss(x, z, -330, -370, 118, 155) +
      200 * gauss(x, z, -35, -425, 135, 150) +
      160 * gauss(x, z, 255, -350, 112, 150) +
      120 * gauss(x, z, 490, -430, 135, 160);
  return (
    3 +
    s * (12 + p + fbm(x / 80, z / 80) * 38) +
    (1 - Math.abs(noise(x / 29, z / 29) * 2 - 1)) * s * 29
  );
}
function south(x, z) {
  const s = smooth(25, 105, z);
  let y =
    5 +
    s * (26 + fbm(x / 80, z / 80) * 36) +
    115 * gauss(x, z, -285, 205, 160, 160) +
    135 * gauss(x, z, 360, 290, 175, 190);
  const plateau = Math.exp(-(((x - 45) / 85) ** 2) - ((z - 55) / 70) ** 2);
  return lerp(y, 25, plateau * 0.94);
}
function texture(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d"),
    im = g.createImageData(256, 256),
    r = rng(kind === "stone" ? 41 : 83);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      let n =
        kind === "stone" ? 155 + r() * 55 : 120 + fbm(x / 25, y / 25) * 105;
      const i = (y * 256 + x) * 4;
      im.data[i] = n;
      im.data[i + 1] = n * (kind === "road" ? 0.88 : 0.96);
      im.data[i + 2] = n * (kind === "road" ? 0.68 : 0.88);
      im.data[i + 3] = 255;
    }
  g.putImageData(im, 0, 0);
  if (kind === "stone") {
    g.strokeStyle = "#4c4c4888";
    g.lineWidth = 2;
    for (let y = 0; y < 256; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
      for (let x = ((y / 32) % 2) * 32; x < 256; x += 64) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 32);
        g.stroke();
      }
    }
  }
  if (kind === "road") {
    g.fillStyle = "#46423955";
    g.fillRect(54, 0, 12, 256);
    g.fillRect(190, 0, 12, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    powerPreference: "high-performance",
  });
} catch (e) {
  fail("此浏览器未能启动 WebGL。请开启硬件加速，或换用新版浏览器。");
  throw e;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  console.error(
    gl.getProgramInfoLog(program),
    gl.getShaderInfoLog(vs),
    gl.getShaderInfoLog(fs),
  );
  fail("山水着色器编译失败。请切换画质或换用新版浏览器。");
};
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9caaa7, 0.00165);
const camera = new THREE.PerspectiveCamera(
  46,
  innerWidth / innerHeight,
  0.5,
  2400,
);
scene.add(new THREE.HemisphereLight(0xcbd4d2, 0x3d4035, 1.8));
const sun = new THREE.DirectionalLight(0xffe2bd, 2.5);
sun.position.set(-260, 310, 150);
scene.add(sun);
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -180,
  right: 180,
  top: 180,
  bottom: -180,
  near: 1,
  far: 700,
});
sun.target.position.set(40, 20, 40);
scene.add(sun.target);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:
    `precision highp float;uniform float uTime;varying vec3 vDir;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}void main(){vec3 d=normalize(vDir);float y=max(d.y,0.);vec3 col=mix(vec3(.72,.66,.54),vec3(.20,.31,.36),pow(y,.42));float glow=pow(max(dot(d,normalize(vec3(-.6,.32,.45))),0.),18.);col+=vec3(.58,.32,.12)*glow;vec2 p=d.xz/(y+.3)*2.2+vec2(uTime*.0015,0.);float c=n(p)*.6+n(p*2.1)*.28+n(p*4.2)*.12;float cloud=smoothstep(.49,.72,c)*smoothstep(.02,.22,y);col=mix(col,vec3(.51,.53,.51),cloud*.62);gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(
      ";#include",
      ";\n#include",
    ),
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 40, 24), skyMat);
scene.add(sky);
