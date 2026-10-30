// 木案、立柱和木架都静止且共用材质，烘焙世界坐标后只提交一个绘制批次。
scene.updateMatrixWorld(true);
const woodenParts = [];
scene.traverse((object) => {
  if (object.isMesh && !object.isInstancedMesh && object.material === wood)
    woodenParts.push(object);
});
const woodPositions = [],
  woodNormals = [],
  woodUvs = [];
for (const object of woodenParts) {
  let geometry = object.geometry.clone();
  geometry.applyMatrix4(object.matrixWorld);
  if (geometry.index) {
    const expanded = geometry.toNonIndexed();
    geometry.dispose();
    geometry = expanded;
  }
  woodPositions.push(...geometry.attributes.position.array);
  woodNormals.push(...geometry.attributes.normal.array);
  woodUvs.push(...geometry.attributes.uv.array);
  geometry.dispose();
  object.removeFromParent();
}
const woodenGeometry = new THREE.BufferGeometry();
woodenGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(woodPositions, 3),
);
woodenGeometry.setAttribute(
  "normal",
  new THREE.Float32BufferAttribute(woodNormals, 3),
);
woodenGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(woodUvs, 2));
const woodenBatch = mesh(woodenGeometry, wood);
woodenBatch.castShadow = true;
woodenBatch.receiveShadow = true;
