function makeSword(parent, position) {
  const sword = new THREE.Group();
  sword.position.set(...position);
  sword.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.93, 0.028, -0.36).normalize(),
  );
  sword.rotateY(Math.PI / 2);
  sword.scale.setScalar(0.82);
  parent.add(sword);
  const steel = new THREE.MeshStandardMaterial({
    color: 0xaab7bf,
    metalness: 1,
    roughness: 0.19,
    envMapIntensity: 1.45,
  });
  const oldGold = new THREE.MeshStandardMaterial({
    color: 0x988255,
    metalness: 0.88,
    roughness: 0.36,
  });
  const leather = new THREE.MeshStandardMaterial({
    map: clothMap,
    color: 0x2c211b,
    roughness: 0.92,
    bumpMap: clothMap,
    bumpScale: 0.018,
  });
  const positions = [],
    indices = [];
  const rings = [
    [0.04, 0.095, 0.014],
    [0.28, 0.09, 0.016],
    [2.17, 0.067, 0.009],
    [2.58, 0.002, 0.001],
  ];
  for (const [y, width, thickness] of rings)
    positions.push(
      -width,
      y,
      0,
      0,
      y,
      thickness,
      width,
      y,
      0,
      0,
      y,
      -thickness,
    );
  for (let ring = 0; ring < rings.length - 1; ring++)
    for (let side = 0; side < 4; side++) {
      const a = ring * 4 + side,
        b = ring * 4 + ((side + 1) % 4),
        c = a + 4,
        d = b + 4;
      indices.push(a, b, c, b, d, c);
    }
  indices.push(0, 3, 2, 0, 2, 1, 12, 13, 14, 12, 14, 15);
  const bladeGeometry = new THREE.BufferGeometry();
  bladeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  bladeGeometry.setIndex(indices);
  bladeGeometry.computeVertexNormals();
  const blade = mesh(bladeGeometry, steel, [0, 0, 0], sword);
  blade.castShadow = true;
  // 剑脊压出细长的冷光，左右刃面的法线保持独立的体积转折。
  const ridge = mesh(
    new THREE.BoxGeometry(0.008, 2.1, 0.003),
    new THREE.MeshStandardMaterial({
      color: 0xbac5cf,
      metalness: 1,
      roughness: 0.13,
    }),
    [0, 1.12, 0.015],
    sword,
  );
  const guardShape = new THREE.Shape();
  guardShape.moveTo(-0.31, -0.018);
  guardShape.quadraticCurveTo(-0.25, 0.075, -0.12, 0.065);
  guardShape.lineTo(0.12, 0.065);
  guardShape.quadraticCurveTo(0.25, 0.075, 0.31, -0.018);
  guardShape.lineTo(0.28, -0.06);
  guardShape.quadraticCurveTo(0, -0.015, -0.28, -0.06);
  guardShape.closePath();
  const guard = mesh(
    new THREE.ExtrudeGeometry(guardShape, {
      depth: 0.048,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.008,
      bevelSegments: 2,
      steps: 1,
    }),
    oldGold,
    [0, 0, -0.024],
    sword,
  );
  guard.castShadow = true;
  const grip = mesh(
    new THREE.CylinderGeometry(0.043, 0.05, 0.46, 12),
    leather,
    [0, -0.28, 0],
    sword,
  );
  grip.castShadow = true;
  const winding = [];
  for (let i = 0; i <= 210; i++) {
    const t = i / 210,
      a = t * Math.PI * 2 * 14;
    winding.push(
      new THREE.Vector3(
        Math.cos(a) * 0.047,
        -0.06 - t * 0.43,
        Math.sin(a) * 0.047,
      ),
    );
  }
  mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(winding),
      210,
      0.005,
      4,
      false,
    ),
    new THREE.MeshStandardMaterial({ color: 0x765d40, roughness: 0.94 }),
    [0, 0, 0],
    sword,
  );
  const pommel = mesh(
    new THREE.SphereGeometry(0.075, 12, 8),
    oldGold,
    [0, -0.56, 0],
    sword,
  );
  pommel.scale.set(1, 0.48, 1);
  mesh(
    new THREE.TorusGeometry(0.052, 0.007, 4, 16),
    bronze,
    [0, -0.57, 0.026],
    sword,
  ).rotation.x = Math.PI / 2;
  return sword;
}
