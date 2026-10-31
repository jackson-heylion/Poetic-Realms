/* 柴篱、茅舍、树、竹与地面散石。 */
const Props = (() => {
  const fenceCurve = new THREE.CatmullRomCurve3(
    [
      [5.4, 10.8],
      [4.2, 5.0],
      [3.0, -0.6],
      [1.7, -6.6],
      [0.0, -12.4],
      [-1.8, -17.2],
    ].map(([x, z]) => new THREE.Vector3(x, World.groundHeight(x, z), z)),
  );
  PR.fenceCurve = fenceCurve;

  const materials = {
    bamboo: new THREE.MeshStandardMaterial({
      color: 0x9a8a5f,
      roughness: 0.85,
      emissive: 0x2a2418,
      emissiveIntensity: 0.5,
    }),
    chaff: new THREE.MeshStandardMaterial({
      color: 0x8a7448,
      roughness: 1,
    }),
    wall: new THREE.MeshStandardMaterial({ color: 0xbcae93, roughness: 0.95 }),
    plaster: new THREE.MeshStandardMaterial({
      color: 0x8d7f66,
      roughness: 1,
    }),
    wood: new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x4e4136, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({
      color: 0x5d6640,
      roughness: 0.95,
      flatShading: true,
    }),
    leafWarm: new THREE.MeshStandardMaterial({
      color: 0x7a6c37,
      roughness: 0.95,
      flatShading: true,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0x7d7568,
      roughness: 1,
      flatShading: true,
    }),
  };

  function makeFence(scene) {
    const length = fenceCurve.getLength();
    const count = Math.floor(length / 0.46);
    const post = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.022, 0.029, 1.12, 5),
      materials.bamboo,
      count,
    );
    post.castShadow = PR.params.shadow > 0;
    post.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const point = fenceCurve.getPointAt(t);
      dummy.position.set(
        point.x,
        point.y + 0.5 + Math.random() * 0.16,
        point.z,
      );
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.06,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.08,
      );
      dummy.scale.setScalar(0.9 + Math.random() * 0.22);
      dummy.updateMatrix();
      post.setMatrixAt(i, dummy.matrix);
    }
    scene.add(post);

    for (const height of [0.52, 0.98]) {
      const rail = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(
            [0, 0.18, 0.38, 0.62, 0.82, 1].map((t) => {
              const point = fenceCurve.getPointAt(t);
              return new THREE.Vector3(point.x, point.y + height, point.z);
            }),
          ),
          90,
          0.019,
          4,
          false,
        ),
        materials.bamboo,
      );
      rail.castShadow = PR.params.shadow > 0;
      scene.add(rail);
    }
  }

  function makeHut(scene, x, z, rotation) {
    const hut = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 4.2), materials.stone);
    base.position.y = 0.15;
    base.receiveShadow = true;
    hut.add(base);

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.3, 3.6), materials.wall);
    body.position.y = 1.45;
    body.castShadow = PR.params.shadow > 0;
    body.receiveShadow = true;
    hut.add(body);

    const roofGeometry = new THREE.BoxGeometry(5.6, 0.16, 2.5);
    for (const side of [-1, 1]) {
      const slope = new THREE.Mesh(roofGeometry, materials.chaff);
      slope.position.set(0, 2.98, side * 0.86);
      slope.rotation.x = side * 0.42;
      slope.castShadow = PR.params.shadow > 0;
      hut.add(slope);
    }
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 5.6, 6),
      materials.chaff,
    );
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = 3.5;
    hut.add(ridge);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.08), materials.wood);
    door.position.set(-0.5, 1.15, 1.82);
    hut.add(door);

    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.55, 0.07),
      materials.wood,
    );
    windowFrame.position.set(1.2, 1.7, 1.82);
    hut.add(windowFrame);

    const eave = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.1, 0.5), materials.chaff);
    eave.position.set(0, 2.16, 1.95);
    hut.add(eave);

    hut.position.set(x, World.groundHeight(x, z) - 0.12, z);
    hut.rotation.y = rotation;
    scene.add(hut);
    return hut;
  }

  function makeTree(scene, x, z, scale, warm) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.2, 2.6, 6),
      materials.bark,
    );
    trunk.position.y = 1.3;
    trunk.castShadow = PR.params.shadow > 0;
    tree.add(trunk);

    const crown = warm ? materials.leafWarm : materials.leaf;
    const lobes = [
      [0, 2.9, 0, 1.35],
      [0.75, 2.6, 0.3, 1.0],
      [-0.62, 2.55, -0.26, 1.05],
      [0.18, 3.5, -0.4, 0.85],
    ];
    for (const [ox, oy, oz, radius] of lobes) {
      const lobe = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), crown);
      lobe.position.set(ox, oy, oz);
      lobe.scale.set(1, 0.82, 1);
      lobe.rotation.set(Math.random(), Math.random(), Math.random());
      lobe.castShadow = PR.params.shadow > 0;
      tree.add(lobe);
    }
    tree.position.set(x, World.groundHeight(x, z), z);
    tree.scale.setScalar(scale);
    tree.rotation.y = Math.random() * Math.PI;
    scene.add(tree);
  }

  function makeBamboo(scene, x, z, count) {
    const stalks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.035, 0.045, 5.2, 5),
      materials.bamboo,
      count,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      dummy.position.set(
        x + Math.cos(angle) * radius,
        World.groundHeight(x, z) + 2.6 + Math.random() * 0.5,
        z + Math.sin(angle) * radius,
      );
      dummy.rotation.set((Math.random() - 0.5) * 0.16, 0, (Math.random() - 0.5) * 0.16);
      dummy.scale.set(1, 0.8 + Math.random() * 0.45, 1);
      dummy.updateMatrix();
      stalks.setMatrixAt(i, dummy.matrix);
    }
    stalks.castShadow = PR.params.shadow > 0;
    scene.add(stalks);
  }

  function makeStones(scene) {
    const stones = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.11, 0),
      materials.stone,
      22,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 22; i++) {
      const t = 0.12 + Math.random() * 0.72;
      const point = fenceCurve.getPointAt(t);
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = point.x + side * (0.35 + Math.random() * 1.1);
      const z = point.z + (Math.random() - 0.5) * 0.9;
      dummy.position.set(x, World.groundHeight(x, z) + 0.04, z);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.scale.set(1, 0.55, 0.85);
      dummy.updateMatrix();
      stones.setMatrixAt(i, dummy.matrix);
    }
    stones.receiveShadow = true;
    scene.add(stones);
  }

  return {
    build(scene) {
      makeFence(scene);
      makeHut(scene, -8.6, -12.4, 0.42);
      makeHut(scene, 11.5, -20, -0.3);
      makeTree(scene, -5.6, -6.2, 1.05, true);
      makeTree(scene, 8.4, -16.2, 0.94, false);
      makeTree(scene, -13.5, -16.5, 1.25, true);
      makeTree(scene, 14.2, -22.5, 0.86, false);
      makeBamboo(scene, -13.8, -8.2, 22);
      makeBamboo(scene, 3.2, -20.5, 14);
      makeStones(scene);
    },
    materials,
  };
})();
