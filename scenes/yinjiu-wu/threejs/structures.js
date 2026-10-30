// 院落：东篱、茅舍、疏树与竹丛。写意营造，不作历史复原
const yard = new THREE.Group();
scene.add(yard);
const woodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  color: 0x9c8259,
  roughness: 0.88,
});
const darkWoodMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  color: 0x6a5334,
  roughness: 0.9,
});
const thatchMaterial = new THREE.MeshStandardMaterial({
  map: thatchTexture,
  color: 0xc6a973,
  roughness: 0.96,
});
const plasterMaterial = new THREE.MeshStandardMaterial({
  map: plasterTexture,
  color: 0xe7dcc0,
  roughness: 0.94,
});
// 东篱：顺着起伏的一道柴篱，中段留柴门
const fenceZ = (z) => 6.35 + Math.sin(z * 0.34) * 0.22 + Math.sin(z * 0.11) * 0.35;
const FENCE_START = 10.5;
const FENCE_END = -18.5;
const GATE = [3.2, 5.4];
{
  const slats = [];
  const rails = [];
  const gateFrames = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let z = FENCE_START; z > FENCE_END; z -= 0.3) {
    const inGate = z < GATE[1] && z > GATE[0];
    const x = fenceZ(z);
    const y = terrainHeight(x, z);
    if (inGate) continue;
    const h = 1.02 + fbm(z * 0.6, 3.3) * 0.34 + 0.12;
    e.set((random() - 0.5) * 0.07, (random() - 0.5) * 0.16, (random() - 0.5) * 0.06);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y + h / 2, z), q, new THREE.Vector3(1, 1, 1));
    slats.push({
      geometry: new THREE.BoxGeometry(0.075, h + 0.12, 0.032),
      matrix: m.clone(),
      color: 0xb59a6d,
    });
  }
  // 上下两道横杆
  for (let z = FENCE_START - 0.15; z > FENCE_END; z -= 0.3) {
    const z2 = Math.max(z - 0.3, FENCE_END);
    if (z < GATE[1] && z > GATE[0]) continue;
    const x1 = fenceZ(z),
      x2 = fenceZ(z2);
    const mid = new THREE.Vector3((x1 + x2) / 2, 0, (z + z2) / 2);
    const len = Math.hypot(x2 - x1, z2 - z);
    for (const level of [0.92, 0.44]) {
      const y =
        Math.min(terrainHeight(x1, z), terrainHeight(x2, z2)) + level - 0.02;
      const angle = Math.atan2(x2 - x1, z2 - z);
      e.set(0, angle, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(mid.x, y, mid.z), q, new THREE.Vector3(1, 1, 1));
      rails.push({
        geometry: new THREE.BoxGeometry(0.05, 0.055, len * 1.02),
        matrix: m.clone(),
        color: 0xa98d61,
      });
    }
  }
  for (const gz of GATE) {
    const x = fenceZ(gz);
    const y = terrainHeight(x, gz);
    gateFrames.push({
      geometry: new THREE.BoxGeometry(0.13, 1.5, 0.13),
      matrix: new THREE.Matrix4().setPosition(x, y + 0.75, gz),
      color: 0x7d6440,
    });
  }
  const fence = new THREE.Mesh(mergeParts(slats.concat(rails, gateFrames)), woodMaterial);
  fence.castShadow = true;
  fence.receiveShadow = true;
  yard.add(fence);
}
// 茅舍：夯土墙、茅顶、柴门与木格窗
{
  const cottage = new THREE.Group();
  cottage.position.set(-11, terrainHeight(-11, -16), -16);
  cottage.rotation.y = 0.46;
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.34, 5.8),
    new THREE.MeshStandardMaterial({ map: plasterTexture, color: 0x9c8f74, roughness: 1 }),
  );
  platform.position.y = 0.17;
  platform.receiveShadow = true;
  cottage.add(platform);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.45, 4.8), plasterMaterial);
  wall.position.y = 1.55;
  wall.castShadow = true;
  wall.receiveShadow = true;
  cottage.add(wall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.95, 2.15, 4), thatchMaterial);
  roof.position.y = 3.85;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  cottage.add(roof);
  const beamParts = [];
  for (const x of [-2.55, 2.55]) {
    beamParts.push({
      geometry: new THREE.BoxGeometry(0.14, 0.14, 4.9),
      matrix: new THREE.Matrix4().setPosition(x, 2.78, 0),
      color: 0x6a5334,
    });
  }
  for (const z of [-2.35, 2.35]) {
    beamParts.push({
      geometry: new THREE.BoxGeometry(6.3, 0.13, 0.13),
      matrix: new THREE.Matrix4().setPosition(0, 2.78, z),
      color: 0x6a5334,
    });
  }
  cottage.add(new THREE.Mesh(mergeParts(beamParts), darkWoodMaterial));
  const doorFrame = mergeParts([
    {
      geometry: new THREE.BoxGeometry(1.4, 2.05, 0.1),
      matrix: new THREE.Matrix4().setPosition(0, 1.05, 2.42),
      color: 0x6a5334,
    },
    {
      geometry: new THREE.BoxGeometry(1.16, 1.86, 0.06),
      matrix: new THREE.Matrix4().setPosition(0, 0.96, 2.47),
      color: 0x2b2620,
    },
  ]);
  cottage.add(new THREE.Mesh(doorFrame, darkWoodMaterial));
  const latticeParts = [];
  for (const x of [-1.9, 1.9]) {
    for (let i = 0; i < 3; i++)
      latticeParts.push({
        geometry: new THREE.BoxGeometry(0.9, 0.05, 0.05),
        matrix: new THREE.Matrix4().setPosition(x, 1.35 + i * 0.34, 2.44),
        color: 0x8a7048,
      });
    for (let i = 0; i < 2; i++)
      latticeParts.push({
        geometry: new THREE.BoxGeometry(0.05, 0.95, 0.05),
        matrix: new THREE.Matrix4().setPosition(x - 0.44 + i * 0.88, 1.69, 2.44),
        color: 0x8a7048,
      });
  }
  cottage.add(new THREE.Mesh(mergeParts(latticeParts), woodMaterial));
  yard.add(cottage);
}
// 疏树与竹丛：低模一团，只求轮廓
{
  const trunks = [];
  const leaves = [];
  const trees = [
    [-19.5, -8.5, 1.0],
    [-6.5, -23.5, 0.85],
    [-24, -18, 1.15],
  ];
  for (const [x, z, scale] of trees) {
    const y = terrainHeight(x, z);
    const trunkHeight = 4.2 * scale;
    trunks.push({
      geometry: new THREE.CylinderGeometry(0.16 * scale, 0.36 * scale, trunkHeight, 7),
      matrix: new THREE.Matrix4().setPosition(x, y + trunkHeight / 2, z),
      color: 0x6a5537,
    });
    for (let i = 0; i < 7; i++) {
      const r = (1.1 + random() * 0.95) * scale;
      const dx = (random() - 0.5) * 3.4 * scale;
      const dz = (random() - 0.5) * 3.4 * scale;
      const dy = trunkHeight + (random() - 0.2) * 1.5 * scale;
      leaves.push({
        geometry: new THREE.IcosahedronGeometry(r, 0),
        matrix: new THREE.Matrix4().setPosition(x + dx, y + dy, z + dz),
        color: [0x77833c, 0x8b8a42, 0x6c7a37][i % 3],
      });
    }
  }
  const trunkMesh = new THREE.Mesh(mergeParts(trunks), darkWoodMaterial);
  trunkMesh.castShadow = true;
  yard.add(trunkMesh);
  const leafMesh = new THREE.Mesh(
    mergeParts(leaves),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, flatShading: true }),
  );
  leafMesh.castShadow = true;
  yard.add(leafMesh);

  const bamboo = [];
  for (let i = 0; i < 14; i++) {
    const a = random() * Math.PI * 2;
    const rad = random() * 1.5;
    const bx = -16.5 + Math.cos(a) * rad;
    const bz = -9.5 + Math.sin(a) * rad;
    const by = terrainHeight(bx, bz);
    const h = 4.2 + random() * 1.9;
    const tilt = (random() - 0.5) * 0.12;
    const tiltMatrix = new THREE.Matrix4().makeRotationZ(tilt);
    const place = new THREE.Matrix4().setPosition(bx, by + h / 2, bz);
    bamboo.push({
      geometry: new THREE.CylinderGeometry(0.035, 0.05, h, 6),
      matrix: place.multiply(tiltMatrix),
      color: [0x8a9a52, 0x9aa85c, 0x74823f][i % 3],
    });
    for (let k = 0; k < 3; k++) {
      const ly = by + h * (0.62 + k * 0.13);
      const leaf = new THREE.Matrix4();
      leaf.makeRotationY(random() * Math.PI);
      leaf.setPosition(bx + (random() - 0.5) * 0.6, ly, bz + (random() - 0.5) * 0.6);
      bamboo.push({
        geometry: new THREE.PlaneGeometry(0.9, 0.13),
        matrix: leaf,
        color: 0x6f7d3c,
      });
    }
  }
  const bambooMesh = new THREE.Mesh(
    mergeParts(bamboo),
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      side: THREE.DoubleSide,
    }),
  );
  bambooMesh.castShadow = true;
  yard.add(bambooMesh);
}
