/* 屋与人迹：社林边的茅店、一盏灯、几段篱与远处的村落灯火。 */

const Props = (() => {
  let lanternLight = null;
  let lanternGlow = null;
  let flickerSeed = 0;

  function thatchTexture() {
    return U.texture(256, 256, function (ctx, w, h) {
      ctx.fillStyle = "#4a4230";
      ctx.fillRect(0, 0, w, h);
      const r = U.rng(8123);
      for (let i = 0; i < 520; i++) {
        const x = r() * w;
        const y = r() * h;
        const len = 8 + r() * 26;
        const shade = 40 + Math.floor(r() * 60);
        ctx.strokeStyle =
          "rgba(" + (shade + 34) + "," + (shade + 26) + "," + (shade + 6) + "," + (0.25 + r() * 0.5) + ")";
        ctx.lineWidth = 0.8 + r() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len * 0.16, y + len);
        ctx.stroke();
      }
    });
  }

  function mudTexture() {
    return U.texture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = "#6b6152";
      ctx.fillRect(0, 0, w, h);
      const r = U.rng(4477);
      for (let i = 0; i < 700; i++) {
        const a = 0.04 + r() * 0.12;
        ctx.fillStyle = r() > 0.5 ? "rgba(148,138,120," + a + ")" : "rgba(40,36,28," + a + ")";
        ctx.fillRect(r() * w, r() * h, 1 + r() * 5, 1 + r() * 4);
      }
    });
  }

  const mats = {
    thatch: null,
    mud: null,
    timber: new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.94 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x4e4c45, roughness: 1, flatShading: true }),
    plaster: new THREE.MeshStandardMaterial({ color: 0x565045, roughness: 1 }),
  };

  function makeHut(scene) {
    const hut = new THREE.Group();
    const W = 4.6;
    const D = 3.6;
    const H = 2.35;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.34, D + 0.5), mats.stone);
    plinth.position.y = 0.17;
    plinth.receiveShadow = true;
    plinth.castShadow = S.q.shadow > 0;
    hut.add(plinth);

    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mats.mud);
    body.position.y = 0.34 + H / 2;
    body.castShadow = S.q.shadow > 0;
    body.receiveShadow = true;
    hut.add(body);

    /* 木构：四角与门框 */
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.17, H, 0.17), mats.timber);
        post.position.set((sx * W) / 2, 0.34 + H / 2, (sz * D) / 2);
        post.castShadow = S.q.shadow > 0;
        hut.add(post);
      }
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, 0.14, 0.14), mats.timber);
    beam.position.set(0, 0.34 + H, D / 2);
    hut.add(beam);

    /* 门洞与窗 */
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.62, 0.1), new THREE.MeshStandardMaterial({
      color: 0x120e09,
      roughness: 1,
      emissive: 0x3a2410,
      emissiveIntensity: 0.5,
    }));
    door.position.set(-0.4, 0.34 + 0.81, D / 2 + 0.02);
    hut.add(door);

    const win = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.08), new THREE.MeshStandardMaterial({
      color: 0x8a6a3e,
      emissive: 0xffa552,
      emissiveIntensity: 1.35,
      roughness: 1,
    }));
    win.position.set(1.25, 1.35, D / 2 + 0.02);
    hut.add(win);

    /* 茅顶：两坡，出檐压得低 */
    const slopeGeo = new THREE.BoxGeometry(W + 1.5, 0.3, D * 0.78);
    for (const side of [-1, 1]) {
      const slope = new THREE.Mesh(slopeGeo, mats.thatch);
      slope.position.set(0, 0.34 + H + 0.55, (side * (D * 0.78)) / 2 - side * 0.12);
      slope.rotation.x = side * 0.62;
      slope.castShadow = S.q.shadow > 0;
      slope.receiveShadow = true;
      hut.add(slope);
    }
    const ridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, W + 1.5, 6),
      mats.thatch,
    );
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, 0.34 + H + 1.24, 0);
    hut.add(ridge);

    /* 檐下阴影板，避免透光 */
    const eave = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, 0.06, 0.5), mats.timber);
    eave.position.set(0, 0.34 + H + 0.06, D / 2 + 0.3);
    hut.add(eave);

    hut.position.set(-11.5, World.groundY(-11.5, -22) - 0.1, -22);
    hut.rotation.y = 0.42;
    scene.add(hut);
    return hut;
  }

  function makeLantern(scene) {
    const group = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), mats.timber);
    cord.position.y = -0.25;
    group.add(cord);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.34, 10, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xffb877,
        emissive: 0xff9b4a,
        emissiveIntensity: 2.6,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      }),
    );
    group.add(body);

    const glowMat = new THREE.SpriteMaterial({
      map: U.texture(128, 128, function (ctx, w, h) {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(255,196,130,0.85)");
        g.addColorStop(0.35, "rgba(255,150,70,0.28)");
        g.addColorStop(1, "rgba(255,140,60,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    lanternGlow = new THREE.Sprite(glowMat);
    lanternGlow.scale.setScalar(2.6);
    group.add(lanternGlow);

    lanternLight = new THREE.PointLight(0xffa055, 7.5, 26, 2);
    lanternLight.position.copy(group.position);
    group.add(lanternLight);

    /* 挂在茅店门侧 */
    const t = new THREE.Vector3(-0.95, 2.28, 2.02);
    t.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42);
    group.position.set(-11.5 + t.x, World.groundY(-11.5, -22) - 0.1 + t.y, -22 + t.z);
    scene.add(group);
    flickerSeed = 1.7;
    return group;
  }

  function makeFence(scene) {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3a3026, roughness: 1 });
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const z = -3.2 - i * 1.1;
      const x = -1.35 - i * 0.09 + Math.sin(i * 0.5) * 0.08;
      pts.push([x, z]);
    }
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const y = World.groundY(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.05, 5), postMat);
      post.position.set(x, y + 0.52, z);
      post.castShadow = S.q.shadow > 0;
      group.add(post);
      if (i < pts.length - 1) {
        const [nx, nz] = pts[i + 1];
        const ny = World.groundY(nx, nz);
        for (const hgt of [0.42, 0.82]) {
          const dx = nx - x;
          const dz = nz - z;
          const len = Math.hypot(dx, dz);
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, len, 4), postMat);
          rail.position.set((x + nx) / 2, (y + ny) / 2 + hgt, (z + nz) / 2);
          rail.rotation.set(Math.PI / 2 - Math.atan2(ny - y, len), 0, 0);
          rail.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(dx, ny - y, dz).normalize(),
          );
          group.add(rail);
        }
      }
    }
    scene.add(group);
  }

  /* 社林里的小石龛 */
  function makeShrine(scene) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.7), mats.stone);
    base.position.y = 0.17;
    group.add(base);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.46), mats.stone);
    box.position.y = 0.65;
    group.add(box);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.3, 4), mats.stone);
    cap.position.y = 1.11;
    cap.rotation.y = Math.PI / 4;
    group.add(cap);
    group.position.set(-6.4, World.groundY(-6.4, -27.6) - 0.05, -27.6);
    group.rotation.y = 0.3;
    group.castShadow = true;
    scene.add(group);
  }

  function makeVillageLights(scene) {
    const tex = U.texture(64, 64, function (ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,196,130,0.95)");
      g.addColorStop(0.4, "rgba(255,150,80,0.3)");
      g.addColorStop(1, "rgba(255,140,60,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    const rng = U.rng(3007);
    for (let i = 0; i < 7; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: true,
          opacity: 0.5 + rng() * 0.3,
        }),
      );
      const x = -46 + rng() * 92;
      const z = -118 - rng() * 34;
      sprite.position.set(x, 1.4 + rng() * 2.2, z);
      sprite.scale.setScalar(4 + rng() * 3);
      scene.add(sprite);
    }
  }

  return {
    build(scene) {
      mats.thatch = new THREE.MeshStandardMaterial({
        map: thatchTexture(),
        color: 0x8a7a56,
        roughness: 1,
        flatShading: true,
      });
      mats.thatch.map.wrapS = mats.thatch.map.wrapT = THREE.RepeatWrapping;
      mats.thatch.map.repeat.set(2, 1.4);
      mats.mud = new THREE.MeshStandardMaterial({
        map: mudTexture(),
        color: 0x9a8f7c,
        roughness: 1,
      });
      mats.mud.map.wrapS = mats.mud.map.wrapT = THREE.RepeatWrapping;
      mats.mud.map.repeat.set(2, 1.2);

      makeHut(scene);
      makeLantern(scene);
      makeFence(scene);
      makeShrine(scene);
      makeVillageLights(scene);
    },

    update(dt, t) {
      if (!lanternLight) return;
      const f = 0.9 + Math.sin(t * 9.1 + flickerSeed) * 0.05 + Math.sin(t * 23.7) * 0.03;
      lanternLight.intensity = 7.5 * f;
      if (lanternGlow) lanternGlow.material.opacity = 0.72 + (f - 0.9) * 1.4;
    },
  };
})();
