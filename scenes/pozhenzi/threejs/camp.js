function combine(geometries) {
  const positions = [],
    uvs = [];
  for (const original of geometries) {
    const geometry = original.index ? original.toNonIndexed() : original;
    positions.push(...geometry.attributes.position.array);
    uvs.push(...geometry.attributes.uv.array);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
function tentRoof() {
  const positions = [],
    uvs = [],
    indices = [];
  for (const side of [-1, 1]) {
    const offset = positions.length / 3;
    for (let z = 0; z <= 10; z++)
      for (let u = 0; u <= 10; u++) {
        const a = u / 10,
          b = z / 10;
        const x = side * 1.65 * a;
        const y =
          2.55 * (1 - a) +
          0.5 * a -
          Math.sin(a * Math.PI) * 0.14 +
          Math.sin(b * Math.PI * 4) * 0.025 * a;
        positions.push(x, y, b * 4.0 - 2);
        uvs.push(a * 1.5, b * 2);
      }
    for (let z = 0; z < 10; z++)
      for (let u = 0; u < 10; u++) {
        const a = offset + z * 11 + u,
          b = a + 1,
          c = a + 11,
          d = c + 1;
        if (side === 1) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function wing(side) {
  const shape = new THREE.Shape();
  shape.moveTo(side * 1.65, 0);
  shape.lineTo(side * 0.48, 0);
  shape.lineTo(side * 0.36, 1.35);
  shape.quadraticCurveTo(side * 0.27, 1.95, 0, 2.55);
  shape.lineTo(side * 1.65, 0.5);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 6);
  geometry.translate(0, 0, 2.015);
  return geometry;
}
const cloth = new THREE.MeshPhongMaterial({
  map: clothMap,
  bumpMap: clothMap,
  bumpScale: 0.045,
  shininess: 0,
  specular: 0x101010,
  color: 0x978a6b,
  side: THREE.DoubleSide,
});
const tents = [];
for (let row = 0; row < 5; row++) {
  const z = -9 - row * 7.2;
  const columns = mobile ? [-2, -1, 1, 2] : [-3, -2, -1, 1, 2, 3];
  for (const column of columns)
    tents.push({
      x: column * 5.4 + Math.sin(row) * 0.4,
      z: z + (random() - 0.5) * 1.2,
      yaw: (random() - 0.5) * 0.18,
      scale: 0.9 + random() * 0.17,
    });
}
const roofBatch = new THREE.InstancedMesh(tentRoof(), cloth, tents.length);
const frontBatch = new THREE.InstancedMesh(
  combine([wing(-1), wing(1)]),
  cloth,
  tents.length,
);
const backBatch = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(2.8, 1.8),
  new THREE.MeshStandardMaterial({
    color: 0x252521,
    roughness: 1,
    side: THREE.DoubleSide,
  }),
  tents.length,
);
const doorMap = texture(
  (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#51301a");
    gradient.addColorStop(0.55, "#b67c3a");
    gradient.addColorStop(1, "#f3ae5b");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  },
  32,
  64,
);
const doorBatch = new THREE.InstancedMesh(
  new THREE.PlaneGeometry(0.72, 1.3),
  new THREE.MeshBasicMaterial({ map: doorMap, color: 0xc38c52 }),
  tents.length,
);
const poleBatch = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.035, 0.04, 2.9, 6),
  wood,
  tents.length * 2,
);
const transform = new THREE.Object3D(),
  local = new THREE.Object3D();
const ropes = [];
tents.forEach((tent, index) => {
  transform.position.set(tent.x, groundHeight(tent.x, tent.z), tent.z);
  transform.rotation.y = tent.yaw;
  transform.scale.setScalar(tent.scale);
  transform.updateMatrix();
  roofBatch.setMatrixAt(index, transform.matrix);
  frontBatch.setMatrixAt(index, transform.matrix);
  const shade = new THREE.Color().setHSL(0.1, 0.14, 0.64 + random() * 0.15);
  roofBatch.setColorAt(index, shade);
  frontBatch.setColorAt(index, shade);
  local.position.set(0, 0.9, -1.85);
  local.updateMatrix();
  backBatch.setMatrixAt(
    index,
    new THREE.Matrix4().multiplyMatrices(transform.matrix, local.matrix),
  );
  local.position.set(0, 0.65, 1.87);
  local.updateMatrix();
  doorBatch.setMatrixAt(
    index,
    new THREE.Matrix4().multiplyMatrices(transform.matrix, local.matrix),
  );
  for (let end = 0; end < 2; end++) {
    local.position.set(0, 1.35, end ? 2.16 : -2.16);
    local.updateMatrix();
    poleBatch.setMatrixAt(
      index * 2 + end,
      new THREE.Matrix4().multiplyMatrices(transform.matrix, local.matrix),
    );
    for (const side of [-1, 1]) {
      const a = new THREE.Vector3(0, 2.45, end ? 2.1 : -2.1).applyMatrix4(
        transform.matrix,
      );
      const b = new THREE.Vector3(
        side * 2.3,
        0.02,
        end ? 2.9 : -2.9,
      ).applyMatrix4(transform.matrix);
      ropes.push(...a.toArray(), ...b.toArray());
    }
  }
});
for (const batch of [roofBatch, frontBatch, backBatch, doorBatch, poleBatch]) {
  batch.receiveShadow = true;
  scene.add(batch);
}
const ropeGeometry = new THREE.BufferGeometry();
ropeGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(ropes, 3),
);
scene.add(
  new THREE.LineSegments(
    ropeGeometry,
    new THREE.LineBasicMaterial({
      color: 0x7d735e,
      transparent: true,
      opacity: 0.66,
    }),
  ),
);
