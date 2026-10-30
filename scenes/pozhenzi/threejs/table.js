const tabletopY = 1.18;
const tableGroup = new THREE.Group();
tableGroup.position.set(-1.25, 0, 3.0);
scene.add(tableGroup);
const plankGeometry = new THREE.BoxGeometry(4.25, 0.14, 0.35, 1, 1, 1);
for (let i = 0; i < 5; i++) {
  const plank = mesh(
    plankGeometry,
    wood,
    [0, tabletopY - 0.07, (i - 2) * 0.36],
    tableGroup,
  );
  plank.castShadow = true;
  plank.receiveShadow = true;
}
for (const x of [-1.72, 1.72])
  for (const z of [-0.6, 0.6]) {
    const leg = mesh(
      new THREE.CylinderGeometry(0.075, 0.095, 1.09, 8),
      wood,
      [x, 0.54, z],
      tableGroup,
    );
    leg.castShadow = true;
    segment([x, 0.28, -0.6], [x, 0.28, 0.6], 0.039, wood, tableGroup);
  }
segment([-1.72, 0.34, 0], [1.72, 0.34, 0], 0.055, wood, tableGroup);
for (const z of [-0.67, 0.67])
  segment([-1.8, 1.02, z], [1.8, 1.02, z], 0.065, wood, tableGroup);
makeSword(scene, [-0.55, tabletopY + 0.045, 3.36]);
function lathe(profile, material, position, parent = scene, segments = 28) {
  return mesh(
    new THREE.LatheGeometry(
      profile.map(([radius, height]) => new THREE.Vector2(radius, height)),
      segments,
    ),
    material,
    position,
    parent,
  );
}
const lampPosition = new THREE.Vector3(-2.55, tabletopY, 2.66);
const lamp = new THREE.Group();
lamp.position.copy(lampPosition);
scene.add(lamp);
lathe(
  [
    [0, 0],
    [0.16, 0],
    [0.175, 0.025],
    [0.14, 0.055],
    [0.055, 0.09],
    [0.04, 0.23],
    [0.1, 0.26],
    [0.17, 0.29],
    [0.18, 0.32],
    [0.13, 0.32],
    [0.09, 0.295],
    [0, 0.29],
  ],
  bronze,
  [0, 0, 0],
  lamp,
);
const oil = mesh(
  new THREE.CircleGeometry(0.13, 32),
  new THREE.MeshStandardMaterial({
    color: 0x191b13,
    metalness: 0.18,
    roughness: 0.26,
  }),
  [0, 0.302, 0],
  lamp,
);
oil.rotation.x = -Math.PI / 2;
mesh(
  new THREE.CylinderGeometry(0.009, 0.012, 0.045, 6),
  new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 1 }),
  [0.08, 0.323, 0],
  lamp,
);
const lampFlamePosition = lampPosition
  .clone()
  .add(new THREE.Vector3(0.08, 0.37, 0));
const lampLight = new THREE.PointLight(0xffba68, 11, 8, 2);
lampLight.position.copy(lampFlamePosition);
scene.add(lampLight);
warmLights.push(lampLight);
const lamplightShadow = new THREE.SpotLight(0xffc17a, 13, 10, 1.12, 0.85, 2);
lamplightShadow.position
  .copy(lampPosition)
  .add(new THREE.Vector3(-0.4, 1.05, 0.1));
lamplightShadow.target.position.set(-1.0, 0.65, 3.0);
lamplightShadow.castShadow = true;
lamplightShadow.shadow.mapSize.set(1024, 1024);
lamplightShadow.shadow.bias = -0.00025;
lamplightShadow.shadow.normalBias = 0.02;
lamplightShadow.shadow.camera.near = 0.1;
scene.add(lamplightShadow, lamplightShadow.target);
const porcelain = new THREE.MeshStandardMaterial({
  color: 0x867d64,
  roughness: 0.43,
  metalness: 0.05,
});
const cup = lathe(
  [
    [0.05, 0],
    [0.06, 0.01],
    [0.075, 0.12],
    [0.08, 0.13],
    [0.073, 0.132],
    [0.066, 0.12],
    [0.049, 0.015],
  ],
  porcelain,
  [-1.95, tabletopY, 3.35],
);
cup.castShadow = true;
const tea = mesh(
  new THREE.CircleGeometry(0.064, 24),
  new THREE.MeshStandardMaterial({ color: 0x2d2115, roughness: 0.28 }),
  [-1.95, tabletopY + 0.118, 3.35],
);
tea.rotation.x = -Math.PI / 2;
const jar = lathe(
  [
    [0, 0],
    [0.12, 0],
    [0.22, 0.09],
    [0.24, 0.31],
    [0.17, 0.48],
    [0.095, 0.52],
    [0.09, 0.59],
    [0.11, 0.61],
    [0.08, 0.61],
    [0.07, 0.55],
  ],
  new THREE.MeshStandardMaterial({
    color: 0x383d33,
    roughness: 0.6,
    bumpMap: clothMap,
    bumpScale: 0.025,
  }),
  [-2.9, 0, 3.6],
);
jar.castShadow = true;
mesh(
  new THREE.CylinderGeometry(0.105, 0.115, 0.025, 18),
  wood,
  [-2.9, 0.625, 3.6],
);
// 号角留在案上，意指将起的军声，不加入未经考证的军制服饰。
const hornCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.18, tabletopY + 0.09, 2.55),
  new THREE.Vector3(0.48, tabletopY + 0.12, 2.32),
  new THREE.Vector3(0.78, tabletopY + 0.19, 2.22),
  new THREE.Vector3(0.96, tabletopY + 0.3, 2.3),
]);
const hornGeometry = new THREE.TubeGeometry(hornCurve, 30, 0.07, 12, false);
const hornAttribute = hornGeometry.attributes.position;
for (let i = 0; i < hornAttribute.count; i++) {
  const section = Math.floor(i / 13) / 30,
    center = hornCurve.getPointAt(section),
    scale = 0.38 + section * 1.9;
  const vertex = new THREE.Vector3()
    .fromBufferAttribute(hornAttribute, i)
    .sub(center)
    .multiplyScalar(scale)
    .add(center);
  hornAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
}
hornGeometry.computeVertexNormals();
hornGeometry.translate(0, -0.06, 0);
const horn = mesh(
  hornGeometry,
  new THREE.MeshStandardMaterial({
    color: 0x8a704a,
    roughness: 0.44,
    metalness: 0.17,
  }),
);
horn.castShadow = true;
const hornEnd = hornCurve.getPoint(1),
  hornDirection = hornCurve.getTangent(1);
hornEnd.y -= 0.06;
const hornMouth = mesh(
  new THREE.CircleGeometry(0.15, 20),
  new THREE.MeshStandardMaterial({
    color: 0x171b1a,
    roughness: 1,
    side: THREE.DoubleSide,
  }),
  hornEnd.toArray(),
);
hornMouth.quaternion.setFromUnitVectors(
  new THREE.Vector3(0, 0, 1),
  hornDirection,
);
