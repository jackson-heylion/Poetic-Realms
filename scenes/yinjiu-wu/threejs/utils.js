// 公共几何与噪声工具：确定性随机、地形高度场、几何合并、风动着色注入
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = makeRandom(20261031);
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise2(x, y) {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  const a = hash2(xi, yi),
    b = hash2(xi + 1, yi),
    c = hash2(xi, yi + 1),
    d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x, y) {
  return (
    noise2(x, y) * 0.54 +
    noise2(x * 2.03 + 5.2, y * 2.03 - 1.7) * 0.28 +
    noise2(x * 4.11 - 3.3, y * 4.11 + 8.9) * 0.18
  );
}
// 院落一带压平，远处渐次起伏，让茅舍与篱笆落在近乎水平的地面上
function terrainHeight(x, z) {
  const broad = (fbm(x * 0.0085 + 3.1, z * 0.0085 - 7.4) - 0.45) * 8.5;
  const mid = (fbm(x * 0.033 - 2.2, z * 0.033 + 9.5) - 0.5) * 1.4;
  const fine = (fbm(x * 0.24 + 8.8, z * 0.24 - 6.1) - 0.5) * 0.22;
  const flat = 1 - smoothstep(10, 28, Math.hypot(x + 1.5, z - 0.5));
  return (broad + mid + fine) * (1 - flat * 0.94) - flat * 0.32;
}
// 院落到柴门的小径：点到路径中轴的距离
const PATH_A = [-11, -16];
const PATH_D = [0.602, 0.798];
function pathDistance(x, z) {
  const px = x - PATH_A[0],
    pz = z - PATH_A[1];
  const t = clamp(px * PATH_D[0] + pz * PATH_D[1], -8, 36);
  return Math.hypot(px - PATH_D[0] * t, pz - PATH_D[1] * t);
}
// 把若干几何体烘成一个批次，减少绘制调用；几何体须含 position
function mergeParts(parts) {
  const baked = parts.map((part) => {
    const g = part.geometry.index
      ? part.geometry.toNonIndexed()
      : part.geometry.clone();
    if (part.matrix) g.applyMatrix4(part.matrix);
    return { g, color: new THREE.Color(part.color ?? 0xffffff) };
  });
  let total = 0;
  for (const { g } of baked) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  const col = new Float32Array(total * 3);
  let offset = 0;
  for (const { g, color } of baked) {
    const count = g.attributes.position.count;
    pos.set(g.attributes.position.array, offset * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, offset * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, offset * 2);
    for (let i = 0; i < count; i++) {
      col[(offset + i) * 3] = color.r;
      col[(offset + i) * 3 + 1] = color.g;
      col[(offset + i) * 3 + 2] = color.b;
    }
    offset += count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
// 给标准材质注入风动位移，草地与菊丛共用同一个 uTime，风过成片
function patchSway(material, strength, freq) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uni.uTime;
    shader.uniforms.uSway = { value: strength };
    shader.uniforms.uFreq = { value: freq };
    shader.vertexShader =
      "uniform float uTime;\nuniform float uSway;\nuniform float uFreq;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3( position );
        #ifdef USE_INSTANCING
          vec3 swayAnchor = vec3( instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2] );
        #else
          vec3 swayAnchor = vec3( 0.0 );
        #endif
        float swayHeight = max( transformed.y, 0.0 );
        float swayPhase = swayAnchor.x * 0.55 + swayAnchor.z * 0.34;
        float swayWave = sin( uTime * uFreq + swayPhase ) + 0.42 * sin( uTime * uFreq * 2.17 + swayPhase * 1.73 );
        transformed.x += swayWave * uSway * swayHeight * swayHeight * 0.9;
        transformed.z += swayWave * uSway * swayHeight * swayHeight * 0.5;`,
      );
  };
  material.customProgramCacheKey = () => "sway" + strength + "-" + freq;
  return material;
}
