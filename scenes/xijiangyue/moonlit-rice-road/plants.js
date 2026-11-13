/* 稻与树：稻田按风摆动，老樟探出一枝，供鹊落脚。 */

const Plants = (() => {
  const canopies = [];
  const grove = new THREE.Group();
  let branchTip = new THREE.Vector3(0.6, 6.2, -9.6);

  /* ── 一丛稻：数片叶、几支穗 ── */
  function clumpTexture(withSpike) {
    return U.texture(128, 192, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const r = U.rng(6117);
      const baseX = w / 2;
      for (let i = 0; i < 11; i++) {
        const lean = (r() - 0.5) * 2.3;
        const top = h * (0.04 + r() * 0.26);
        const midX = baseX + lean * w * 0.13;
        const topX = baseX + lean * w * 0.3;
        const shade = 128 + Math.floor(r() * 62);
        const g = ctx.createLinearGradient(0, h, 0, top);
        g.addColorStop(
          0,
          "rgb(" + (shade - 44) + "," + (shade + 4) + "," + (shade - 42) + ")",
        );
        g.addColorStop(
          0.62,
          "rgb(" + shade + "," + (shade + 30) + "," + (shade - 24) + ")",
        );
        g.addColorStop(
          1,
          "rgb(" + (shade + 66) + "," + (shade + 62) + "," + (shade + 18) + ")",
        );
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.6 + r() * 3.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(baseX + (r() - 0.5) * 14, h);
        ctx.quadraticCurveTo(midX, (h + top) * 0.5, topX, top);
        ctx.stroke();

        /* 稻穗：顶端一串浅色小点，夜里靠它反光 */
        if (withSpike && r() > 0.3) {
          const dots = 8;
          for (let k = 0; k < dots; k++) {
            const ty = top + (h - top) * k * 0.026;
            const tx = topX + lean * k * 1.5 + (r() - 0.5) * 4;
            ctx.fillStyle =
              "rgba(" + (196 + Math.floor(r() * 24)) + "," +
              (192 + Math.floor(r() * 22)) + "," +
              (150 + Math.floor(r() * 26)) + "," +
              (0.42 + r() * 0.3) + ")";
            ctx.beginPath();
            ctx.arc(tx, ty, 1.3 + r() * 1.6, 0, 6.283);
            ctx.fill();
          }
        }
      }
    });
  }

  /* ── 风：顶点按高度偏移，带一道缓慢掠过的阵风 ── */
  function applyWind(material) {
    material.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = S.uTime;
      shader.vertexShader =
        "uniform float uTime;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          [
            "#include <begin_vertex>",
            "#ifdef USE_INSTANCING",
            "  vec3 iPos = instanceMatrix[3].xyz;",
            "  float hf = clamp(position.y / 0.98, 0.0, 1.0);",
            "  float ph = iPos.x * 0.44 + iPos.z * 0.29;",
            "  float gust = sin(uTime * 0.46 + iPos.z * 0.052 + iPos.x * 0.018) * 0.5 + 0.5;",
            "  float sway = sin(uTime * 1.32 + ph) * 0.55 + sin(uTime * 0.63 + ph * 1.9) * 0.45;",
            "  float amp = pow(hf, 1.75) * (0.07 + gust * 0.19);",
            "  transformed.x += sway * amp;",
            "  transformed.z += cos(uTime * 0.97 + ph * 0.8) * amp * 0.42;",
            "#endif",
          ].join("\n"),
        );
    };
  }

  function nearPath(x, z, samples) {
    let best = 1e9;
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      const dx = x - p.x;
      const dz = z - p.z;
      const d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  const RS = {
    near: [],
    far: [],
    maxNear: 0,
    maxFar: 0,
  };

  function collectRice(samples, zFrom, zTo, step, maxDist, out) {
    const rng = U.rng(20261101 + Math.round(step * 1000));
    for (let x = -20; x <= 20; x += step) {
      for (let z = zFrom; z <= zTo; z += step) {
        const px = x + (rng() - 0.5) * step * 0.9;
        const pz = z + (rng() - 0.5) * step * 0.9;
        if (nearPath(px, pz, samples) < 1.42) continue;
        if (Math.abs(pz - World.STREAM_Z) < World.STREAM_HALF + 0.55) continue;
        const dhx = px + 11.5;
        const dhz = pz + 22;
        if (dhx * dhx + dhz * dhz < 26) continue;
        const dcam = Math.hypot(px - 1.15, pz - 10.4);
        if (dcam > maxDist) continue;
        out.push([px, pz, dcam]);
      }
    }
  }

  function riceMesh(list, material, scaleBoost, max, scene) {
    const take = Math.min(max, list.length);
    const geo = new THREE.PlaneGeometry(0.62 * scaleBoost, 0.98, 1, 2);
    geo.translate(0, 0.49, 0);
    const mesh = new THREE.InstancedMesh(geo, material, take);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const rng = U.rng(771 + take);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < take; i++) {
      const [x, z] = list[i];
      const s = 0.86 + rng() * 0.32;
      dummy.position.set(x, World.groundY(x, z) + 0.01, z);
      dummy.rotation.set(0, rng() * Math.PI, 0);
      dummy.scale.set(s * (0.9 + rng() * 0.25), s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const v = 0.78 + rng() * 0.4;
      color.setRGB(v * 0.94, v, v * 0.78);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return { mesh, take };
  }

  function buildRice(scene, maxNear) {
    const samples = [];
    for (let i = 0; i <= 90; i++) samples.push(World.pathCurve.getPointAt(i / 90));

    const near = [];
    const far = [];
    collectRice(samples, -33, 13.2, 0.30, 30, near);
    collectRice(samples, -45.5, -33, 0.58, 78, far);
    near.sort((a, b) => a[2] - b[2]);

    const mat = new THREE.MeshStandardMaterial({
      map: clumpTexture(true),
      transparent: false,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      roughness: 0.86,
      metalness: 0.0,
      color: 0xc2d2a2,
      emissive: 0x0c1410,
      emissiveIntensity: 1,
    });
    applyWind(mat);

    const farMat = mat.clone();
    farMat.map = clumpTexture(false);
    farMat.color = new THREE.Color(0x6d7a5c);
    farMat.emissive = new THREE.Color(0x04070a);
    farMat.alphaTest = 0.5;

    const a = riceMesh(near, mat, 1, maxNear, scene);
    const b = riceMesh(far, farMat, 1.45, far.length, scene);
    RS.near = a.mesh;
    RS.far = b.mesh;
    RS.maxNear = a.take;
    RS.maxFar = b.take;
  }

  /* ── 树 ── */
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x2a241d,
    roughness: 0.98,
    flatShading: true,
  });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x14231c, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x18291f, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x111d18, roughness: 1, flatShading: true }),
  ];

  function canopyBlobs(group, rng, count, spread, yBase, size) {
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const rad = Math.pow(rng(), 0.6) * spread;
      const geo = new THREE.IcosahedronGeometry(size * (0.55 + rng() * 0.7), 1);
      const mesh = new THREE.Mesh(geo, leafMats[Math.floor(rng() * leafMats.length)]);
      mesh.position.set(
        Math.cos(a) * rad,
        yBase + (rng() - 0.4) * size * 1.5,
        Math.sin(a) * rad * 0.85,
      );
      mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      mesh.scale.set(1, 0.72 + rng() * 0.3, 1);
      mesh.castShadow = S.q.shadow > 0;
      group.add(mesh);
    }
  }

  function makeTree(x, z, opts) {
    const rng = U.rng(opts.seed);
    const group = new THREE.Group();
    const h = opts.height;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(h * 0.032, h * 0.062, h, 7, 2),
      barkMat,
    );
    trunk.position.y = h / 2;
    trunk.rotation.z = (rng() - 0.5) * 0.09;
    trunk.castShadow = S.q.shadow > 0;
    group.add(trunk);

    const sway = new THREE.Group();
    group.add(sway);

    /* 主枝 */
    const limbs = opts.limbs || 3;
    for (let i = 0; i < limbs; i++) {
      const a = rng() * Math.PI * 2;
      const len = h * (0.34 + rng() * 0.24);
      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(h * 0.014, h * 0.03, len, 5),
        barkMat,
      );
      limb.position.set(
        Math.cos(a) * len * 0.32,
        h * (0.62 + rng() * 0.16),
        Math.sin(a) * len * 0.32,
      );
      limb.rotation.set(Math.sin(a) * 0.85, 0, -Math.cos(a) * 0.85);
      limb.castShadow = S.q.shadow > 0;
      sway.add(limb);
    }

    canopyBlobs(sway, rng, opts.blobs || 9, h * (opts.spread || 0.31), h * (opts.crown || 0.84), h * (opts.blob || 0.145));
    canopies.push({ group: sway, phase: rng() * 6.28, amp: opts.sway || 0.0035 });

    group.position.set(x, World.groundY(x, z) - 0.15, z);
    group.rotation.y = rng() * 6.28;
    group.scale.setScalar(opts.scale || 1);
    return group;
  }

  /* 老樟：从右侧探一枝到画面中，末端悬空 */
  function makePerchTree(scene) {
    const group = new THREE.Group();
    const trunkH = 7.4;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.52, trunkH, 8, 3),
      barkMat,
    );
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = 0.05;
    trunk.castShadow = S.q.shadow > 0;
    group.add(trunk);

    const sway = new THREE.Group();
    sway.position.set(0, trunkH * 0.62, 0);
    group.add(sway);

    for (let i = 0; i < 4; i++) {
      const a = -0.4 + i * 1.6;
      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.14, 2.6, 6),
        barkMat,
      );
      limb.position.set(Math.cos(a) * 0.9, 1.1, Math.sin(a) * 0.9);
      limb.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
      limb.castShadow = S.q.shadow > 0;
      sway.add(limb);
    }
    canopyBlobs(sway, U.rng(5150), 12, 2.4, 2.4, 1.15);
    canopies.push({ group: sway, phase: 1.1, amp: 0.0042 });

    /* 探出的横枝：整组按 local 坐标算，避免再叠一次 group 位移 */
    const groupPos = new THREE.Vector3(6.2, World.groundY(6.2, -5.4) - 0.2, -5.4);
    const tipWorld = new THREE.Vector3(0.35, 7.58, -9.35);
    const from = new THREE.Vector3(5.95, 5.4, -6.1).sub(groupPos);
    const to = tipWorld.clone().sub(groupPos);
    const dir = to.clone().sub(from);
    const len = dir.length();
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.115, len, 6),
      barkMat,
    );
    branch.position.copy(from).addScaledVector(dir, 0.5);
    branch.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    branch.castShadow = S.q.shadow > 0;
    group.add(branch);

    /* 枝上细梢与残叶 */
    for (let i = 0; i < 3; i++) {
      const t = 0.4 + i * 0.18;
      const p = from.clone().addScaledVector(dir, t);
      const twig = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.032, 0.8, 4),
        barkMat,
      );
      twig.position.set(p.x, p.y + 0.36, p.z);
      twig.rotation.set(0.3, i * 1.9, 0.4);
      group.add(twig);
    }

    group.position.copy(groupPos);
    branchTip = tipWorld.clone();
    branchTip.y += 0.08;
    scene.add(group);
  }

  /* 田边树篱：一排低矮的常绿灌木，替稻海收边 */
  function makeHedge(scene) {
    const rng = U.rng(30219);
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x17241c,
      roughness: 1,
      flatShading: true,
    });
    const count = 54;
    const hedge = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = -62 + t * 124 + (rng() - 0.5) * 3.4;
      const z = -46 - Math.sin(t * 5.1) * 2.2 + (rng() - 0.5) * 2.6;
      const s = 0.75 + rng() * 0.75;
      dummy.position.set(x, World.groundY(x, z) + s * 0.5, z);
      dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      dummy.scale.set(s * (1.2 + rng() * 0.6), s * (0.6 + rng() * 0.4), s);
      dummy.updateMatrix();
      hedge.setMatrixAt(i, dummy.matrix);
    }
    hedge.castShadow = S.q.shadow > 0;
    hedge.frustumCulled = false;
    scene.add(hedge);
  }

  return {
    build(scene) {
      buildRice(scene, 24000);
      makePerchTree(scene);
      makeHedge(scene);

      const spots = [
        [-10.2, -25.0, 7.2, 1.1],
        [-15.8, -29.5, 8.4, 1.15],
        [-6.6, -32.0, 5.4, 0.85],
        [-20.5, -24.0, 6.2, 0.9],
        [-13.2, -38.5, 7.8, 1.05],
        [-23.5, -34.5, 5.6, 0.8],
        [-25.0, -19.5, 5.0, 0.75],
        [-4.2, -43.0, 6.4, 0.9],
        [-18.0, -49.0, 7.6, 1.0],
        [13.5, -32.5, 6.6, 0.95],
        [19.5, -24.0, 7.4, 1.05],
        [24.0, -35.0, 6.0, 0.9],
        [-30.0, -30.0, 7.0, 0.95],
      ];
      scene.add(grove);
      for (let i = 0; i < spots.length; i++) {
        const [x, z, hh, sc] = spots[i];
        grove.add(
          makeTree(x, z, {
            seed: 900 + i * 37,
            height: hh,
            scale: sc,
            blobs: 5 + (i % 4),
            limbs: 2 + (i % 3),
            spread: 0.26 + (i % 5) * 0.03,
            crown: 0.78 + (i % 3) * 0.05,
            blob: 0.12 + (i % 4) * 0.02,
            sway: 0.002,
          }),
        );
      }
    },

    setQuality(q) {
      if (!RS.near) return;
      RS.near.count = Math.min(RS.maxNear, q.blades);
      RS.far.visible = q.blades > 4000;
      /* 省电档砍掉远景树林，地平线仍由树篱收住 */
      grove.visible = q.blades >= 9000;
    },

    update(dt, t) {
      for (let i = 0; i < canopies.length; i++) {
        const c = canopies[i];
        c.group.rotation.z = Math.sin(t * 0.42 + c.phase) * c.amp * 26;
        c.group.rotation.x = Math.cos(t * 0.33 + c.phase * 1.7) * c.amp * 18;
      }
    },

    get branchTip() {
      return branchTip;
    },
  };
})();
