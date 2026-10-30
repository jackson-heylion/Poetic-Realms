function addFlame(position, size, opacity = 1) {
  flameRigs.push({
    position: position.clone(),
    size,
    opacity,
    phase: random() * 6,
  });
}
addFlame(lampFlamePosition, 0.145, 0.9);
const fireLocations = mobile
  ? [
      [3.9, -5],
      [-6.5, -15],
      [5.0, -28],
    ]
  : [
      [3.9, -5],
      [-6.5, -15],
      [7.6, -23],
      [-2, -33],
    ];
const fireBases = fireLocations.map(
  ([x, z]) => new THREE.Vector3(x, groundHeight(x, z) + 0.18, z),
);
const fireLogs = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.065, 0.09, 0.85, 7),
  new THREE.MeshStandardMaterial({ color: 0x29211b, roughness: 1 }),
  fireBases.length * 4,
);
const logTransform = new THREE.Object3D();
fireBases.forEach((position, index) => {
  for (let log = 0; log < 4; log++) {
    logTransform.position
      .copy(position)
      .add(
        new THREE.Vector3(
          Math.cos(log * 1.6) * 0.16,
          -0.08,
          Math.sin(log * 1.6) * 0.16,
        ),
      );
    logTransform.rotation.set(Math.PI / 2, 0, (log * Math.PI) / 2 + 0.4);
    logTransform.updateMatrix();
    fireLogs.setMatrixAt(index * 4 + log, logTransform.matrix);
  }
  for (let part = 0; part < 3; part++)
    addFlame(
      position
        .clone()
        .add(new THREE.Vector3((part - 1) * 0.07, 0.15 + part * 0.07, 0)),
      0.65 - part * 0.08,
      0.72,
    );
  if (index < 3) {
    const light = new THREE.PointLight(0xffa356, 28 - index * 4, 16, 2);
    light.position.copy(position).add(new THREE.Vector3(0, 0.55, 0));
    scene.add(light);
    warmLights.push(light);
  }
});
scene.add(fireLogs);
const smokeRigs = [];
for (const position of fireBases)
  for (let i = 0; i < (mobile ? 2 : 4); i++) {
    smokeRigs.push({ origin: position.clone(), phase: random() });
  }
function billboardBatch(map, color, count, additive, opacity) {
  const material = new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const batch = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    material,
    count,
  );
  batch.frustumCulled = false;
  batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(batch);
  return batch;
}
const flameBatch = billboardBatch(
  flameMap,
  0xffd99a,
  flameRigs.length,
  true,
  0.85,
);
const haloBatch = billboardBatch(
  glowMap,
  0xffb35d,
  flameRigs.length,
  true,
  0.3,
);
const smokeBatch = billboardBatch(
  smokeMap,
  0x77828a,
  smokeRigs.length,
  false,
  0.12,
);
const billboardTransform = new THREE.Object3D(),
  billboardColor = new THREE.Color();
const emberCount = mobile ? 110 : 250;
const emberPositions = new Float32Array(emberCount * 3),
  emberSeeds = [];
for (let i = 0; i < emberCount; i++)
  emberSeeds.push({
    base: fireBases[i % fireBases.length],
    speed: 0.13 + random() * 0.25,
    phase: random(),
    side: random() - 0.5,
  });
const emberGeometry = new THREE.BufferGeometry();
emberGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(emberPositions, 3),
);
const emberMaterial = new THREE.PointsMaterial({
  color: 0xffc17e,
  size: 0.025,
  map: glowMap,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
scene.add(new THREE.Points(emberGeometry, emberMaterial));
// 低处的雾带把远营与山脚连成层次，不遮住案上的剑与灯。
const mist = [];
for (let i = 0; i < 3; i++) {
  const material = new THREE.MeshBasicMaterial({
    map: smokeMap,
    color: 0x7e8d9b,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const sheet = mesh(new THREE.PlaneGeometry(75, 7), material, [
    0,
    1.8,
    -18 - i * 16,
  ]);
  mist.push(sheet);
}
function animateAtmosphere(time) {
  for (const clock of flagTimes) clock.value = time;
  flameRigs.forEach(({ position, size, opacity, phase }, index) => {
    const flicker =
      0.91 +
      0.09 * Math.sin(time * 9 + phase) +
      0.05 * Math.sin(time * 17 + phase * 3);
    billboardTransform.position.copy(position);
    billboardTransform.quaternion.copy(camera.quaternion);
    billboardTransform.rotateZ(Math.sin(time * 5 + phase) * 0.055);
    billboardTransform.scale.set(
      size * 0.65 * (1.0 + 0.09 * Math.sin(time * 7 + phase)),
      size * flicker,
      1,
    );
    billboardTransform.updateMatrix();
    flameBatch.setMatrixAt(index, billboardTransform.matrix);
    flameBatch.setColorAt(index, billboardColor.setScalar(opacity));
    billboardTransform.scale.set(size * 4.5, size * 4.5, 1);
    billboardTransform.updateMatrix();
    haloBatch.setMatrixAt(index, billboardTransform.matrix);
    haloBatch.setColorAt(
      index,
      billboardColor.setScalar(
        opacity * (0.9 + 0.1 * Math.sin(time * 6 + phase)),
      ),
    );
  });
  flameBatch.instanceMatrix.needsUpdate = true;
  haloBatch.instanceMatrix.needsUpdate = true;
  flameBatch.instanceColor.needsUpdate = true;
  haloBatch.instanceColor.needsUpdate = true;
  warmLights.forEach((light, index) => {
    light.intensity =
      (index === 0 ? 11 : 28 - (index - 1) * 4) *
      (0.94 + 0.06 * Math.sin(time * 8 + index * 4));
  });
  smokeRigs.forEach(({ origin, phase }, index) => {
    const life = (time * 0.055 + phase) % 1;
    billboardTransform.position
      .copy(origin)
      .add(
        new THREE.Vector3(
          life * 0.7 + Math.sin(life * 4 + phase) * 0.2,
          0.55 + life * 4.1,
          0,
        ),
      );
    billboardTransform.quaternion.copy(camera.quaternion);
    billboardTransform.rotateZ(life * 0.45 + phase);
    billboardTransform.scale.setScalar(0.8 + life * 2.4);
    billboardTransform.updateMatrix();
    smokeBatch.setMatrixAt(index, billboardTransform.matrix);
    smokeBatch.setColorAt(
      index,
      billboardColor.setScalar(Math.sin(life * Math.PI)),
    );
  });
  smokeBatch.instanceMatrix.needsUpdate = true;
  smokeBatch.instanceColor.needsUpdate = true;
  emberSeeds.forEach((particle, index) => {
    const life = (time * particle.speed + particle.phase) % 1;
    emberPositions[index * 3] =
      particle.base.x +
      particle.side * 0.3 +
      Math.sin(life * 5 + particle.phase * 20) * 0.12 +
      life * 0.45;
    emberPositions[index * 3 + 1] = particle.base.y + life * 2.2;
    emberPositions[index * 3 + 2] = particle.base.z + particle.side * 0.3;
  });
  emberGeometry.attributes.position.needsUpdate = true;
  mist.forEach((sheet, index) => {
    sheet.position.x = Math.sin(time * 0.025 + index) * 3;
  });
}
