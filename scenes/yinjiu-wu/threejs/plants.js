// 草木：成片秋草与东篱菊丛，风过时共用一阵摆动
function buildBlade(height, width, bend) {
  const geo = new THREE.PlaneGeometry(width, height, 1, 5);
  geo.translate(0, height / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = clamp(p.getY(i) / height, 0, 1);
    p.setX(i, p.getX(i) * (1 - t * 0.82));
    p.setZ(i, -bend * t * t);
  }
  geo.computeVertexNormals();
  return geo;
}
function buildTuft(seed) {
  const rnd = makeRandom(seed);
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const height = 0.42 + rnd() * 0.34;
    const angle = rnd() * Math.PI * 2;
    const tilt = (rnd() - 0.5) * 0.4;
    const matrix = new THREE.Matrix4()
      .makeRotationY(angle)
      .multiply(new THREE.Matrix4().makeRotationZ(tilt));
    parts.push({
      geometry: buildBlade(height, 0.055 + rnd() * 0.02, 0.12 + rnd() * 0.12),
      matrix,
      color: 0xffffff,
    });
  }
  return mergeParts(parts);
}
const grassMaterial = patchSway(
  new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    side: THREE.DoubleSide,
  }),
  0.055,
  1.35,
);
const GRASS_TOTAL = 11500;
const grass = new THREE.InstancedMesh(buildTuft(907), grassMaterial, GRASS_TOTAL);
{
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const color = new THREE.Color();
  const patches = [];
  for (let i = 0; i < 190; i++) {
    const a = random() * Math.PI * 2;
    const rad = 2.5 + Math.sqrt(random()) * 27;
    patches.push([Math.cos(a) * rad - 1, Math.sin(a) * rad + 1, 1.1 + random() * 3.2]);
  }
  for (let i = 0; i < GRASS_TOTAL; i++) {
    const patch = patches[i % patches.length];
    let x = patch[0] + (random() - 0.5) * patch[2] * 2.4;
    let z = patch[1] + (random() - 0.5) * patch[2] * 2.4;
    if (pathDistance(x, z) < 1.5) continue;
    if (Math.abs(x - fenceZ(z)) < 1.15) continue;
    if (Math.hypot(x - 5.3, z + 0.05) < 1.5) continue;
    const y = terrainHeight(x, z);
    const away = Math.hypot(x + 1, z);
    const scale = 0.45 + random() * 0.4 + clamp(away / 70, 0, 0.35);
    position.set(x, y - 0.03, z);
    quat.setFromEuler(new THREE.Euler(0, random() * Math.PI * 2, 0));
    scaleVec.set(scale, scale * (0.8 + random() * 0.45), scale);
    matrix.compose(position, quat, scaleVec);
    grass.setMatrixAt(i, matrix);
    const dry = 0.45 + fbm(x * 0.2, z * 0.2) * 0.8;
    color.setHSL(0.17 + dry * 0.05, 0.34 + (1 - dry) * 0.18, 0.26 + dry * 0.22);
    grass.setColorAt(i, color);
  }
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.frustumCulled = false;
  scene.add(grass);
}
grade((limit) => {
  grass.count = Math.min(GRASS_TOTAL, limit.grass);
});
// 菊：每株含茎、叶与三层花瓣，实例化后配色略有差别
function buildChrysanthemum() {
  const parts = [];
  const stem = new THREE.CylinderGeometry(0.017, 0.026, 0.5, 6);
  parts.push({
    geometry: stem,
    matrix: new THREE.Matrix4().setPosition(0, 0.25, 0),
    color: 0xffffff,
  });
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.PlaneGeometry(0.14, 0.08, 2, 1);
    const mat = new THREE.Matrix4();
    mat.makeRotationY(i * 2.2 + 0.4);
    mat.setPosition(0.05 * (i ? 1 : -1), 0.2 + i * 0.09, 0);
    parts.push({ geometry: leaf, matrix: mat, color: 0xffffff });
  }
  const rings = [
    { count: 15, length: 0.14, width: 0.062, curl: 0.85, drop: 0.42 },
    { count: 12, length: 0.11, width: 0.055, curl: 0.62, drop: 0.22 },
    { count: 9, length: 0.076, width: 0.048, curl: 0.4, drop: 0.06 },
  ];
  const headY = 0.52;
  const verts = [];
  const cols = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + ring.curl;
      const prev = [];
      const rows = 4;
      for (let r = 0; r <= rows; r++) {
        const t = r / rows;
        const radial = ring.length * t;
        const lift = ring.length * ring.curl * t * t - ring.length * ring.drop * t;
        const half = ring.width * (1 - t * 0.72) * 0.5;
        const cx = radial * Math.sin(a);
        const cz = radial * Math.cos(a);
        const hx = Math.cos(a);
        const hz = -Math.sin(a);
        const y = headY + lift;
        prev.push([
          [cx - hx * half, y, cz - hz * half],
          [cx + hx * half, y, cz + hz * half],
        ]);
      }
      for (let r = 0; r < rows; r++) {
        const [l0, r0] = prev[r];
        const [l1, r1] = prev[r + 1];
        verts.push(...l0, ...r0, ...r1, ...l0, ...r1, ...l1);
        for (let k = 0; k < 6; k++) cols.push(1, 1, 1);
      }
    }
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  petalGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  petalGeo.computeVertexNormals();
  parts.push({ geometry: petalGeo, matrix: null, color: 0xffffff });
  const core = new THREE.SphereGeometry(0.022, 8, 6);
  parts.push({
    geometry: core,
    matrix: new THREE.Matrix4().setPosition(0, headY + 0.014, 0),
    color: 0xffffff,
  });
  return mergeParts(parts);
}
const flowerMaterial = patchSway(
  new THREE.MeshStandardMaterial({
    map: petalTexture,
    vertexColors: true,
    roughness: 0.62,
    alphaTest: 0.28,
    side: THREE.DoubleSide,
  }),
  0.075,
  1.15,
);
const FLOWER_TOTAL = 420;
const flowers = new THREE.InstancedMesh(buildChrysanthemum(), flowerMaterial, FLOWER_TOTAL);
{
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scaleVec = new THREE.Vector3();
  const color = new THREE.Color();
  const petals = [0xfdf8e8, 0xfae6ad, 0xf4cf68, 0xe9b44c, 0xd9b0cf];
  let placed = 0;
  for (let pass = 0; pass < 6 && placed < FLOWER_TOTAL; pass++) {
    for (let z = 8.5; z > -17 && placed < FLOWER_TOTAL; z -= 0.42) {
      const lateral = fenceZ(z) - 0.35 - random() * 1.5 - pass * 0.22;
      const x = lateral + (random() - 0.5) * 0.5;
      if (random() > 0.62 - pass * 0.05) continue;
      const y = terrainHeight(x, z);
      position.set(x, y - 0.04, z);
      quat.setFromEuler(new THREE.Euler(0, random() * Math.PI * 2, (random() - 0.5) * 0.12));
      const scale = 1.35 + random() * 0.7;
      scaleVec.set(scale, scale * (0.9 + random() * 0.35), scale);
      matrix.compose(position, quat, scaleVec);
      flowers.setMatrixAt(placed, matrix);
      color.set(petals[(random() * (petals.length - 1)) | 0]);
      flowers.setColorAt(placed, color);
      placed++;
    }
  }
  // 门前与院角散植几丛
  for (const [cx, cz] of [
    [-6.5, -12.5],
    [-13.5, -11],
    [-3.5, 5.5],
    [1.5, -1.5],
  ]) {
    for (let i = 0; i < 16 && placed < FLOWER_TOTAL; i++) {
      const x = cx + (random() - 0.5) * 2.6;
      const z = cz + (random() - 0.5) * 2.6;
      const y = terrainHeight(x, z);
      position.set(x, y - 0.04, z);
      quat.setFromEuler(new THREE.Euler(0, random() * Math.PI * 2, (random() - 0.5) * 0.12));
      const scale = 1.3 + random() * 0.65;
      scaleVec.set(scale, scale * (0.9 + random() * 0.3), scale);
      matrix.compose(position, quat, scaleVec);
      flowers.setMatrixAt(placed, matrix);
      color.set(petals[(random() * (petals.length - 1)) | 0]);
      flowers.setColorAt(placed, color);
      placed++;
    }
  }

  // 手边几株开得盛的，近看时作主体
  for (let i = 0; i < 10 && placed < FLOWER_TOTAL; i++) {
    const a = random() * Math.PI * 2;
    const rad = 0.4 + random() * 0.55;
    const x = 5.3 + Math.cos(a) * rad;
    const z = -0.05 + Math.sin(a) * rad;
    if (Math.abs(x - fenceZ(z)) < 0.2) continue;
    const y = terrainHeight(x, z);
    position.set(x, y - 0.04, z);
    quat.setFromEuler(new THREE.Euler(0, random() * Math.PI * 2, (random() - 0.5) * 0.1));
    const scale = 1.3 + random() * 0.35;
    scaleVec.set(scale, scale * (0.95 + random() * 0.2), scale);
    matrix.compose(position, quat, scaleVec);
    flowers.setMatrixAt(placed, matrix);
    color.set(petals[i % 2 === 0 ? 0 : 1]);
    flowers.setColorAt(placed, color);
    placed++;
  }
  flowers.count = placed;
  flowers.instanceMatrix.needsUpdate = true;
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  flowers.frustumCulled = false;
  scene.add(flowers);
}
const FLOWER_MAX = flowers.count;
grade((limit) => {
  flowers.count = Math.min(FLOWER_MAX, limit.flowers);
});
