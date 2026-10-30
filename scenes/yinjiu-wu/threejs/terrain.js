// 地貌与天宇：坡地、夕照天穹、层叠南山、山岚与薄云
const GROUND = 460;
const groundGeometry = new THREE.PlaneGeometry(GROUND, GROUND, 132, 132);
groundGeometry.rotateX(-Math.PI / 2);
{
  const pos = groundGeometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grass = new THREE.Color(0x76813f);
  const dry = new THREE.Color(0x94874f);
  const earth = new THREE.Color(0x8a7350);
  const tint = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
    const wear = fbm(x * 0.07 + 21, z * 0.07 - 13);
    tint.copy(dry).lerp(grass, clamp(wear * 1.6 + 0.08, 0, 1));
    // 由柴门通向院门的小径：踩实的土色
    const pathD = pathDistance(x, z);
    tint.lerp(earth, (1 - smoothstep(0.9, 2.9, pathD)) * 0.6);
    const shade = 0.86 + fbm(x * 0.3, z * 0.3) * 0.3;
    colors[i * 3] = tint.r * shade;
    colors[i * 3 + 1] = tint.g * shade;
    colors[i * 3 + 2] = tint.b * shade;
  }
  groundGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  groundGeometry.setAttribute("uv1", groundGeometry.attributes.uv);
  groundGeometry.computeVertexNormals();
}
const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  lightMap: cloudShadowTexture,
  lightMapIntensity: 0.5,
  vertexColors: true,
  roughness: 0.96,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// 天穹：低处暖橙，转青到天顶
{
  const dome = new THREE.SphereGeometry(900, 48, 28);
  const dp = dome.attributes.position;
  const dcol = new Float32Array(dp.count * 3);
  const horizon = new THREE.Color(0xffb265);
  const upper = new THREE.Color(0xf7cf98);
  const zenith = new THREE.Color(0x86a9c9);
  const mixed = new THREE.Color();
  for (let i = 0; i < dp.count; i++) {
    const y = dp.getY(i) / 900;
    const t = clamp(y, 0, 1);
    mixed.copy(horizon).lerp(upper, smoothstep(0.0, 0.16, t));
    mixed.lerp(zenith, smoothstep(0.2, 0.85, t));
    // 太阳一侧更暖
    const sunDot = clamp(
      (-dp.getX(i) * SUN_DIR.x - dp.getZ(i) * SUN_DIR.z) / 900,
      -1,
      1,
    );
    const toSun = sunDot;
    mixed.offsetHSL(0, 0, clamp(toSun * 0.06, -0.05, 0.09));
    dcol[i * 3] = mixed.r;
    dcol[i * 3 + 1] = mixed.g;
    dcol[i * 3 + 2] = mixed.b;
  }
  dome.setAttribute("color", new THREE.BufferAttribute(dcol, 3));
  const domeMesh = new THREE.Mesh(
    dome,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  domeMesh.renderOrder = -10;
  scene.add(domeMesh);
}
// 夕阳柔光与日轮
{
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      fog: false,
    }),
  );
  glow.position.copy(SUN_DIR).multiplyScalar(760);
  glow.scale.setScalar(300);
  glow.renderOrder = -9;
  scene.add(glow);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(19, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff1cf, fog: false, depthWrite: false, depthTest: false }),
  );
  disc.position.copy(SUN_DIR).multiplyScalar(700);
  disc.lookAt(0, 0, 0);
  disc.renderOrder = -8;
  scene.add(disc);
}

// 南山：三层剪影式山脊，越远越淡，写入三层不同色阶
function buildRidge(seed, distance, width, baseHeight, segments) {
  const shape = [];
  const rnd = makeRandom(seed);
  const drift = rnd() * 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -width / 2 + width * t;
    const ridge =
      Math.sin(t * 6.1 + drift) * 0.42 +
      Math.sin(t * 13.7 + drift * 2.3) * 0.22 +
      Math.sin(t * 27.3 + drift * 4.1) * 0.12 +
      (fbm(t * 9 + seed, seed * 0.7) - 0.5) * 0.5;
    shape.push({ x, y: baseHeight * (0.62 + ridge * 0.75) });
  }
  const verts = [];
  const cols = [];
  const low = new THREE.Color(0x36413f);
  const high = new THREE.Color(0x93a396);
  const tint = new THREE.Color();
  for (let i = 0; i < segments; i++) {
    const a = shape[i],
      b = shape[i + 1];
    const quad = [
      [a.x, 0, distance],
      [b.x, 0, distance],
      [b.x, b.y, distance],
      [a.x, 0, distance],
      [b.x, b.y, distance],
      [a.x, a.y, distance],
    ];
    for (const [x, y, z] of quad) {
      verts.push(x, y, z);
      const t = clamp(y / Math.max(baseHeight, 0.01), 0, 1);
      tint.copy(low).lerp(high, t * t * 0.6 + t * 0.4);
      cols.push(tint.r, tint.g, tint.b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  return geo;
}
const RIDGES = [
  { seed: 21, distance: -150, width: 720, base: 34, segments: 150, color: 0x6f7a68, opacity: 0.96 },
  { seed: 77, distance: -215, width: 880, base: 58, segments: 150, color: 0x8b95a2, opacity: 0.88 },
  { seed: 133, distance: -300, width: 1040, base: 82, segments: 140, color: 0xa6b2bd, opacity: 0.7 },
];
for (const spec of RIDGES) {
  const mesh = new THREE.Mesh(
    buildRidge(spec.seed, spec.distance, spec.width, spec.base, spec.segments),
    new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: spec.opacity < 1,
      opacity: spec.opacity,
      depthWrite: false,
      emissive: 0x302c22,
      fog: true,
    }),
  );
  mesh.position.y = -2;
  mesh.renderOrder = -6;
  scene.add(mesh);
}
// 山岚：贴着山脚与半山漂移的雾带
const mistGroup = new THREE.Group();
scene.add(mistGroup);
grade((limit) => {
  const want = limit.mist;
  while (mistGroup.children.length > want) {
    const child = mistGroup.children.pop();
    child.geometry.dispose();
    mistGroup.remove(child);
  }
  while (mistGroup.children.length < want) {
    const index = mistGroup.children.length;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(520 + index * 130, 40 + index * 16),
      new THREE.MeshBasicMaterial({
        map: mistTexture,
        transparent: true,
        opacity: 0.5 - index * 0.04,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set((index % 2 ? 1 : -1) * 30, 6 + index * 7, -70 - index * 52);
    mesh.userData.speed = 0.35 + index * 0.18;
    mesh.renderOrder = -5;
    mistGroup.add(mesh);
  }
});
// 高空薄云
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
grade((limit) => {
  const want = limit.clouds;
  while (cloudGroup.children.length > want) {
    const child = cloudGroup.children.pop();
    child.geometry.dispose();
    cloudGroup.remove(child);
  }
  while (cloudGroup.children.length < want) {
    const index = cloudGroup.children.length;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(360 + index * 90, 60 + index * 22),
      new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.42 - index * 0.05,
        depthWrite: false,
        fog: false,
      }),
    );
    mesh.position.set(-120 + index * 90, 120 + index * 26, -60 - index * 70);
    mesh.rotation.x = -Math.PI / 2 + 0.34;
    mesh.userData.speed = 0.5 + index * 0.32;
    mesh.renderOrder = -7;
    cloudGroup.add(mesh);
  }
});
function driftAir(time) {
  for (const mesh of mistGroup.children)
    mesh.position.x = Math.sin(time * 0.06 * mesh.userData.speed) * 46 + (mesh.position.z * 0.12);
  for (const mesh of cloudGroup.children)
    mesh.position.x = -160 + ((time * mesh.userData.speed * 1.6) % 620);
  // 云翳缓缓掠过坡地
  cloudShadowTexture.offset.set(time * 0.0035, time * 0.0021);
}
