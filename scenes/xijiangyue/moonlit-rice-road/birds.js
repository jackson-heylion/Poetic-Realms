/* 惊鹊：枝头栖息，隔一阵掠月而去。 */

const Birds = (() => {
  const birds = [];
  const clock = { t: 0 };

  function birdMaterials() {
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0x0b1119,
        roughness: 0.44,
        metalness: 0.22,
      }),
      wing: new THREE.MeshStandardMaterial({
        color: 0x0a0e14,
        roughness: 0.5,
        metalness: 0.18,
        side: THREE.DoubleSide,
      }),
      pale: new THREE.MeshStandardMaterial({
        color: 0xcfd6d2,
        roughness: 0.7,
      }),
      beak: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 }),
    };
  }

  function makeBird(scale) {
    const mats = birdMaterials();
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), mats.body);
    body.scale.set(1, 0.92, 2.05);
    group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), mats.pale);
    belly.scale.set(0.92, 0.52, 1.5);
    belly.position.set(0, -0.038, 0.02);
    group.add(belly);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 8), mats.body);
    head.position.set(0, 0.052, 0.155);
    group.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.062, 6), mats.beak);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.044, 0.222);
    group.add(beak);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.3), mats.body);
    tail.position.set(0, 0.008, -0.24);
    tail.rotation.x = -0.16;
    group.add(tail);

    const wings = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.055, 0.03, 0.01);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.016, 0.2), mats.wing);
      wing.position.set(side * 0.055, -0.03, -0.015);
      pivot.add(wing);
      group.add(pivot);
      wings.push({ pivot: pivot, side: side });
    }

    group.scale.setScalar(scale);
    group.visible = false;
    return { group: group, wings: wings, head: head, tail: tail };
  }

  /* 一只鹊的作息：栖 → 惊起 → 掠月 → 远去 → 归枝 */
  function runner(cfg) {
    const bird = makeBird(cfg.scale);
    const path = new THREE.CatmullRomCurve3(
      cfg.path.map(function (p) {
        return new THREE.Vector3(p[0], p[1], p[2]);
      }),
      false,
      "catmullrom",
      0.4,
    );
    return {
      bird: bird,
      path: path,
      state: "hidden",
      timer: cfg.delay,
      cruise: cfg.cruise,
      perch: new THREE.Vector3(cfg.perch[0], cfg.perch[1], cfg.perch[2]),
      facing: cfg.facing || 0,
      progress: 0,
      flap: 0,
      seed: cfg.seed,
    };
  }

  function faceTo(group, forward) {
    const yaw = Math.atan2(forward.x, forward.z);
    group.rotation.set(0, yaw, 0);
  }

  return {
    build(scene) {
      const tip = Plants.branchTip;
      birds.push(
        runner({
          scale: 1.5,
          delay: 1.4,
          cruise: 21,
          seed: 1.3,
          perch: [tip.x - 0.02, tip.y + 0.03, tip.z + 0.02],
          facing: -1.82,
          path: [
            [tip.x, tip.y + 0.03, tip.z],
            [tip.x - 0.8, tip.y + 0.7, tip.z - 1.6],
            [-2.6, 8.2, -14.5],
            [-6.6, 11.2, -23.0],
            [-11.8, 13.6, -33.0],
            [-18.0, 15.0, -46.0],
          ],
        }),
        runner({
          scale: 1.38,
          delay: 5.2,
          cruise: 27,
          seed: 4.1,
          perch: [2.25, 6.9, -8.24],
          facing: -1.64,
          path: [
            [2.25, 6.9, -8.24],
            [0.4, 7.0, -12.2],
            [-3.4, 9.6, -18.6],
            [-8.0, 12.6, -27.5],
            [-14.0, 14.4, -39.0],
          ],
        }),
      );
      for (const b of birds) scene.add(b.bird.group);
    },

    update(dt, t) {
      for (const b of birds) {
        const g = b.bird.group;
        b.timer -= dt;

        if (b.state === "hidden") {
          if (b.timer <= 0) {
            b.state = "perched";
            b.timer = 3 + (b.cruise % 5);
            g.position.copy(b.perch);
            g.rotation.order = "YXZ";
            g.rotation.set(-0.62, b.facing, 0);
            g.visible = true;
          }
          continue;
        }

        if (b.state === "perched") {
          const bob = Math.sin(t * 2.2 + b.seed) * 0.006;
          g.position.set(b.perch.x, b.perch.y + bob, b.perch.z);
          g.rotation.x = -0.62 + Math.sin(t * 0.8 + b.seed) * 0.02;
          g.rotation.y = b.facing + Math.sin(t * 0.42 + b.seed) * 0.22;
          g.rotation.z = Math.sin(t * 1.1 + b.seed) * 0.012;
          b.bird.tail.rotation.x = -0.16 + Math.sin(t * 1.7 + b.seed) * 0.09;
          for (const w of b.bird.wings) {
            w.pivot.rotation.z = w.side * (1.18 + Math.sin(t * 1.4 + b.seed) * 0.03);
            w.pivot.rotation.y = w.side * 0.06;
          }
          if (b.timer <= 0) {
            b.state = "flying";
            b.progress = 0;
            b.flap = 0;
          }
          continue;
        }

        /* 飞行 */
        b.progress += dt / 6.4;
        const u = U.clamp(b.progress, 0, 1);
        const p = b.path.getPointAt(u);
        const ahead = b.path.getPointAt(Math.min(1, u + 0.012));
        g.position.copy(p);
        faceTo(g, ahead.clone().sub(p));
        g.rotation.order = "YXZ";
        g.rotation.x = U.lerp(-0.4, 0.12, U.smoothstep(0, 0.25, u));
        g.rotation.z = Math.sin(u * 3.4) * 0.12;

        const glide = U.smoothstep(0.55, 0.95, u);
        const rate = 15 - glide * 9;
        b.flap += dt * rate;
        const amp = 0.95 - glide * 0.55;
        for (const w of b.bird.wings) {
          w.pivot.rotation.z = w.side * (0.2 + Math.sin(b.flap) * amp);
          w.pivot.rotation.y = w.side * 0.24;
        }
        b.bird.tail.rotation.x = -0.16 - glide * 0.1;

        if (b.progress >= 1.0) {
          b.state = "hidden";
          b.timer = 18 + (b.seed * 3) % 9;
          g.visible = false;
        }
      }
    },
  };
})();
