// 人、鸟与浮尘：篱边采菊的隐士、相与还的飞鸟、逆光里的微尘
// 陶渊明：低模长袍剪影，循环一次俯身与抬头远望
const poet = new THREE.Group();
{
  const y = terrainHeight(4.75, -0.4);
  poet.position.set(4.75, y, -0.4);
  poet.rotation.y = -0.55;
  const robeProfile = [
    [0.055, 0],
    [0.2, 0.05],
    [0.3, 0.22],
    [0.29, 0.55],
    [0.24, 0.9],
    [0.215, 1.15],
    [0.185, 1.3],
    [0.13, 1.38],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const robe = new THREE.Mesh(
    new THREE.LatheGeometry(robeProfile, 14),
    new THREE.MeshStandardMaterial({ color: 0xded2b6, roughness: 0.9, side: THREE.DoubleSide }),
  );
  robe.castShadow = true;
  poet.add(robe);
  const sash = new THREE.Mesh(
    new THREE.CylinderGeometry(0.272, 0.278, 0.09, 14),
    new THREE.MeshStandardMaterial({ color: 0x8d7b56, roughness: 0.92 }),
  );
  sash.position.y = 0.92;
  poet.add(sash);
  const torsoPivot = new THREE.Group();
  torsoPivot.position.y = 1.3;
  poet.add(torsoPivot);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xd7b48c, roughness: 0.78 }),
  );
  head.position.y = 0.14;
  head.castShadow = true;
  torsoPivot.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.17, 14), thatchMaterial);
  hat.position.y = 0.24;
  hat.castShadow = true;
  torsoPivot.add(hat);
  const armBones = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.33, 1.12, 0.02);
    pivot.rotation.z = side * 0.32;
    poet.add(pivot);
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.046, 0.58, 8),
      new THREE.MeshStandardMaterial({ color: 0xd6c9ac, roughness: 0.9 }),
    );
    arm.position.y = -0.29;
    arm.castShadow = true;
    pivot.add(arm);
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xd7b48c, roughness: 0.8 }),
    );
    hand.position.y = -0.6;
    pivot.add(hand);
    armBones.push(pivot);
  }
  const bloom = new THREE.Group();
  bloom.position.set(-0.33, 0.52, 0.02);
  bloom.scale.setScalar(0);
  const sprig = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xefdc9a, roughness: 0.7 }),
  );
  bloom.add(sprig);
  poet.add(bloom);
  scene.add(poet);
  // 竹篮：采下的菊放在脚边
  const basket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.19, 0.27, 12, 1, true),
    new THREE.MeshStandardMaterial({ map: woodTexture, color: 0xb59461, roughness: 0.9, side: THREE.DoubleSide }),
  );
  basket.position.set(5.72, terrainHeight(5.72, 0.55) + 0.13, 0.55);
  basket.castShadow = true;
  scene.add(basket);

  poet.userData.update = (time) => {
    const t = time % 9;
    const bend =
      smoothstep(0.2, 1.9, t) * (1 - smoothstep(2.2, 3.4, t)) +
      smoothstep(5.6, 6.6, t) * (1 - smoothstep(6.9, 7.8, t)) * 0.6;
    const reach = 0.62 * bend;
    armBones[0].rotation.x = reach;
    armBones[1].rotation.x = reach * 0.45;
    armBones[0].rotation.z = -0.32 - reach * 0.12;
    armBones[1].rotation.z = 0.32 + reach * 0.06;
    torsoPivot.rotation.x = bend * 0.32;
    // 抬头望南山
    const gaze = smoothstep(3.2, 4.2, t) * (1 - smoothstep(5.0, 6.0, t));
    torsoPivot.rotation.z = -gaze * 0.06;
    head.rotation.x = -gaze * 0.34;
    hat.rotation.x = -gaze * 0.3;
    const held =
      smoothstep(1.7, 2.1, t) * (1 - smoothstep(5.6, 6.2, t)) +
      smoothstep(7.0, 7.4, t) * (1 - smoothstep(7.8, 8.4, t));
    bloom.scale.setScalar(held);
    bloom.position.set(-0.33 - reach * 0.06, 0.52 + bend * 0.44, 0.02 + bend * 0.14);
    poet.position.y = y + Math.sin(time * 0.7) * 0.006 - bend * 0.05;
  };
}
// 飞鸟相与还：一列飞向南山，队形与扑翼各不相同
const BIRD_MAX = 20;
const birdCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(74, 23, 32),
  new THREE.Vector3(26, 26, -14),
  new THREE.Vector3(-16, 25, -68),
  new THREE.Vector3(-54, 21, -134),
  new THREE.Vector3(-92, 18, -212),
]);
const birdBodyMesh = new THREE.InstancedMesh(
  mergeParts([
    {
      geometry: new THREE.ConeGeometry(0.07, 0.44, 6),
      matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2),
      color: 0xffffff,
    },
    {
      geometry: new THREE.SphereGeometry(0.062, 8, 6),
      matrix: new THREE.Matrix4().setPosition(0, 0.015, 0.2),
      color: 0xffffff,
    },
  ]),
  new THREE.MeshBasicMaterial({ color: 0x3b3a35, fog: true }),
  BIRD_MAX,
);
const wingTriangles = mergeParts([
  {
    geometry: (() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 0, 0.09, 0, 0, -0.13, 0.6, 0.03, -0.03], 3),
      );
      g.computeVertexNormals();
      return g;
    })(),
    matrix: null,
    color: 0xffffff,
  },
]);
const birdWingMesh = new THREE.InstancedMesh(
  wingTriangles,
  new THREE.MeshBasicMaterial({
    color: 0x484640,
    side: THREE.DoubleSide,
    fog: true,
  }),
  BIRD_MAX * 2,
);
birdBodyMesh.frustumCulled = false;
birdWingMesh.frustumCulled = false;
scene.add(birdBodyMesh, birdWingMesh);
const birdSeeds = Array.from({ length: BIRD_MAX }, (_, i) => {
  const rnd = makeRandom(4100 + i * 37);
  return {
    offset: new THREE.Vector3((rnd() - 0.5) * 22, (rnd() - 0.5) * 5, (rnd() - 0.5) * 12),
    speed: 0.012 + rnd() * 0.008,
    phase: rnd(),
    flap: 5.6 + rnd() * 3.4,
    scale: 1.55 + rnd() * 0.95,
  };
});
const birdMatrix = new THREE.Matrix4();
const wingMatrix = new THREE.Matrix4();
const birdPos = new THREE.Vector3();
const birdTangent = new THREE.Vector3();
const birdAhead = new THREE.Vector3();
const birdQuat = new THREE.Quaternion();
const birdRoll = new THREE.Quaternion();
const BIRD_FORWARD = new THREE.Vector3(0, 0, 1);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const birdScale = new THREE.Vector3();
function updateBirds(time) {
  for (let i = 0; i < birdBodyMesh.count; i++) {
    const seed = birdSeeds[i];
    const u = (seed.phase + time * seed.speed) % 1;
    birdCurve.getPointAt(u, birdPos);
    birdCurve.getTangentAt(u, birdTangent);
    birdPos.add(seed.offset);
    // lookAt 使模型的 +Z 指向 target 的反侧，故以「身后一点」作目标
    birdAhead.copy(birdPos).sub(birdTangent);
    birdMatrix.lookAt(birdPos, birdAhead, WORLD_UP);
    birdQuat.setFromRotationMatrix(birdMatrix);
    birdRoll.setFromAxisAngle(BIRD_FORWARD, Math.sin(time * 1.4 + i) * 0.16);
    birdQuat.premultiply(birdRoll);
    birdScale.setScalar(seed.scale);
    birdMatrix.compose(birdPos, birdQuat, birdScale);
    birdBodyMesh.setMatrixAt(i, birdMatrix);
    const flap = Math.sin(time * seed.flap + seed.phase * 6.3) * 0.62;
    for (const side of [1, -1]) {
      wingMatrix.makeRotationZ(side * flap);
      wingMatrix.premultiply(birdMatrix);
      birdWingMesh.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), wingMatrix);
    }
  }
  birdBodyMesh.instanceMatrix.needsUpdate = true;
  birdWingMesh.instanceMatrix.needsUpdate = true;
}
grade((limit) => {
  birdBodyMesh.count = Math.min(BIRD_MAX, limit.birds);
  birdWingMesh.count = birdBodyMesh.count * 2;
});
// 逆光里的浮尘与飘落的菊英
function makePoints(count, size, map, opacity, blending, area, fall) {
  const positions = new Float32Array(count * 3);
  const data = [];
  for (let i = 0; i < count; i++) {
    const x = (random() - 0.5) * area;
    const y = random() * 6 + 0.2;
    const z = (random() - 0.5) * area - 2;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    data.push({ x, y, z, vx: (random() - 0.5) * 0.25, vy: -fall * (0.3 + random()), vz: (random() - 0.5) * 0.25, s: random() * 6.3 });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
      blending,
      fog: true,
    }),
  );
  points.frustumCulled = false;
  points.userData = { data, area };
  scene.add(points);
  return points;
}
const motes = makePoints(500, 0.07, moteTexture, 0.5, THREE.AdditiveBlending, 46, 0.02);
const petals = makePoints(80, 0.13, petalTexture, 0.85, THREE.NormalBlending, 26, 0.09);
const scratchVec = new THREE.Vector3();
function driftParticles(time, dt) {
  for (const system of [motes, petals]) {
    const attr = system.geometry.attributes.position;
    const data = system.userData.data;
    for (let i = 0; i < attr.count; i++) {
      const p = data[i];
      const gust = Math.sin(time * 0.6 + p.s) * 0.22;
      p.x += (p.vx + gust) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + gust * 0.5) * dt;
      if (
        p.y < 0.1 ||
        camera.position.distanceToSquared(scratchVec.set(p.x, p.y, p.z)) < 6.25 ||
        Math.abs(p.x) > system.userData.area / 2
      ) {
        p.x = (random() - 0.5) * system.userData.area;
        p.y = 3.5 + random() * 4;
        p.z = (random() - 0.5) * system.userData.area - 2;
      }
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  }
}
grade((limit) => {
  motes.geometry.setDrawRange(0, Math.min(500, limit.motes));
  petals.geometry.setDrawRange(0, Math.min(80, Math.round(limit.motes * 0.16)));
});
