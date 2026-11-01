/* 地景：田土、田埂、溪涧、石桥、远山与地气。 */

const World = (() => {
  const STREAM_Z = -16.4;
  const STREAM_HALF = 2.35;

  const rng = U.rng(91357);

  /* ── 地形高度：田面近乎平，近溪处下切，远处缓缓抬升 ── */
  function groundY(x, z) {
    const n = U.fbm(x * 0.045 + 11.3, z * 0.045 + 7.7, 3) - 0.47;
    let y = n * 0.30;
    const cut = 1 - U.smoothstep(STREAM_HALF - 0.6, STREAM_HALF + 1.7, Math.abs(z - STREAM_Z));
    y -= cut * 0.46;
    if (z < -26) y += (-26 - z) * 0.0075;
    if (Math.abs(x) > 26) y += (Math.abs(x) - 26) * 0.004;
    return y;
  }

  /* ── 田土贴图 ── */
  function soilTexture() {
    return U.texture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = "#101610";
      ctx.fillRect(0, 0, w, h);
      const r = U.rng(4412);
      for (let i = 0; i < 2600; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 1 + r() * 9;
        const a = 0.03 + r() * 0.09;
        ctx.fillStyle = r() > 0.45 ? "rgba(46,58,36," + a + ")" : "rgba(8,11,8," + a + ")";
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * (0.4 + r() * 0.8), r() * 3.14, 0, 6.283);
        ctx.fill();
      }
      /* 稻行：极淡的直线，远处只留暗示 */
      ctx.strokeStyle = "rgba(70,84,52,0.055)";
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 3, h);
        ctx.stroke();
      }
    });
  }

  /* ── 溪面着色：涟漪与月光碎影 ── */
  function waterMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: S.uTime,
        uMoon: { value: S.moonDir.clone() },
        uDeep: { value: new THREE.Color(0x0a141d) },
        uSky: { value: new THREE.Color(0x2a4260) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorld;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uMoon;
        uniform vec3 uDeep;
        uniform vec3 uSky;
        varying vec2 vUv;
        varying vec3 vWorld;
        void main() {
          vec2 p = vWorld.xz;
          float w1 = sin(p.x * 2.1 + uTime * 1.4);
          float w2 = sin(p.x * 5.3 - uTime * 2.1 + p.y * 2.7);
          float w3 = sin(p.y * 8.1 + uTime * 3.2);
          vec3 nrm = normalize(vec3(w1 * 0.055 + w2 * 0.035, 1.0, w2 * 0.05 + w3 * 0.03));

          vec3 viewDir = normalize(cameraPosition - vWorld);
          vec3 col = mix(uDeep, uSky, 0.56 + 0.3 * nrm.x);

          /* 月在水面的碎光 */
          vec3 h = normalize(uMoon + viewDir);
          float spec = pow(max(dot(nrm, h), 0.0), 90.0);
          col += vec3(0.72, 0.80, 0.95) * spec * 1.35;

          float bank = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.84, vUv.y);
          col *= 0.55 + 0.45 * bank;
          float fogF = smoothstep(38.0, 340.0, length(cameraPosition - vWorld));
          col = mix(col, vec3(0.030, 0.055, 0.090), fogF);
          gl_FragColor = vec4(col, 0.94);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      fog: false,
    });
  }

  function mistTexture() {
    return U.texture(256, 128, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(0.45, "rgba(255,255,255,0.16)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const r = U.rng(9931);
      for (let i = 0; i < 40; i++) {
        const x = r() * w;
        const y = h * (0.6 + r() * 0.4);
        const rad = 12 + r() * 34;
        const rg = ctx.createRadialGradient(x, y, 0, x, y, rad);
        rg.addColorStop(0, "rgba(255,255,255," + (0.05 + r() * 0.1) + ")");
        rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    });
  }

  function rainCloudTexture() {
    return U.texture(256, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const r = U.rng(5521);
      for (let i = 0; i < 26; i++) {
        const x = w * (0.06 + r() * 0.88);
        const y = h * (0.35 + r() * 0.4);
        const rx = 26 + r() * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, "rgba(255,255,255," + (0.1 + r() * 0.16) + ")");
        g.addColorStop(0.6, "rgba(255,255,255,0.05)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.42);
        ctx.translate(-x, -y);
        ctx.fillStyle = g;
        ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
        ctx.restore();
      }
      const mask = ctx.createLinearGradient(0, 0, 0, h);
      mask.addColorStop(0, "rgba(255,255,255,0)");
      mask.addColorStop(0.35, "rgba(255,255,255,1)");
      mask.addColorStop(0.75, "rgba(255,255,255,0.8)");
      mask.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    });
  }

  const pathPts = [
    [3.4, 13.5],
    [2.1, 8.6],
    [0.7, 3.8],
    [-0.7, -1.1],
    [-2.2, -6.3],
    [-3.3, -10.9],
    [-3.7, -14.0],
    [-3.9, -18.6],
    [-4.4, -22.4],
    [-5.8, -27.2],
    [-8.0, -32.4],
    [-10.9, -37.8],
  ].map(function (p) {
    return new THREE.Vector3(p[0], groundY(p[0], p[1]) + 0.06, p[1]);
  });

  const pathCurve = new THREE.CatmullRomCurve3(pathPts, false, "catmullrom", 0.35);

  let water = null;
  let rain = null;
  let ridgeGroup = null;
  const mists = [];
  let ground = null;

  function ribbon(curve, segments, halfWidth) {
    const pos = [];
    const uv = [];
    const idx = [];
    const up = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPointAt(t);
      curve.getTangentAt(t, tan);
      side.crossVectors(up, tan).normalize();
      const w = halfWidth * (1 + Math.sin(t * 6.2) * 0.06);
      for (let s = -1; s <= 1; s += 2) {
        const x = p.x + side.x * w * s;
        const z = p.z + side.z * w * s;
        pos.push(x, groundY(x, z) + 0.055, z);
        uv.push((s + 1) / 2, t * 26);
      }
      if (i < segments) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function makeRidge(opts) {
    const segs = opts.segs || 96;
    const width = opts.width;
    const pos = [];
    const idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -width / 2 + width * t;
      const shape =
        U.fbm(t * opts.freq + opts.seed, opts.seed * 3.7, 4) * 0.85 +
        Math.sin(t * Math.PI) * 0.35;
      const y = opts.base + shape * opts.height;
      pos.push(x, y, 0, x, -14, 0);
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({
      color: opts.color,
      fog: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(opts.x || 0, 0, opts.z);
    mesh.frustumCulled = false;
    return mesh;
  }

  return {
    groundY,
    pathCurve,
    STREAM_Z,
    STREAM_HALF,

    build(scene) {
      /* 大地 */
      const geo = new THREE.PlaneGeometry(620, 620, 140, 140);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setY(i, groundY(x, z));
      }
      geo.computeVertexNormals();
      const soil = soilTexture();
      soil.wrapS = soil.wrapT = THREE.RepeatWrapping;
      soil.repeat.set(52, 52);
      ground = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          map: soil,
          color: 0x3f4a37,
          roughness: 0.94,
          metalness: 0.0,
        }),
      );
      ground.receiveShadow = true;
      scene.add(ground);

      /* 田埂 */
      const pathTex = U.texture(128, 256, function (ctx, w, h) {
        ctx.fillStyle = "#7b7057";
        ctx.fillRect(0, 0, w, h);
        const r = U.rng(3311);
        for (let i = 0; i < 900; i++) {
          const a = 0.05 + r() * 0.16;
          ctx.fillStyle = r() > 0.5 ? "rgba(122,112,88," + a + ")" : "rgba(28,24,18," + a + ")";
          ctx.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3);
        }
      });
      pathTex.wrapS = pathTex.wrapT = THREE.RepeatWrapping;
      const pathMat = new THREE.MeshStandardMaterial({
        map: pathTex,
        color: 0xc9bfa2,
        roughness: 0.97,
      });
      const pathMesh = new THREE.Mesh(ribbon(pathCurve, 150, 1.15), pathMat);
      pathMesh.receiveShadow = true;
      scene.add(pathMesh);

      /* 溪面 */
      const waterGeo = new THREE.PlaneGeometry(180, STREAM_HALF * 2, 1, 1);
      waterGeo.rotateX(-Math.PI / 2);
      water = new THREE.Mesh(waterGeo, waterMaterial());
      water.position.set(0, -0.07, STREAM_Z);
      water.receiveShadow = false;
      scene.add(water);

      /* 石桥：跨溪的三折石板 */
      const stoneTex = U.texture(128, 128, function (ctx, w, h) {
        ctx.fillStyle = "#6d6a60";
        ctx.fillRect(0, 0, w, h);
        const r = U.rng(2211);
        for (let i = 0; i < 900; i++) {
          const a = 0.05 + r() * 0.16;
          ctx.fillStyle = r() > 0.5 ? "rgba(150,146,132," + a + ")" : "rgba(30,28,24," + a + ")";
          ctx.fillRect(r() * w, r() * h, 1 + r() * 6, 1 + r() * 5);
        }
      });
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(2, 2);
      const stone = new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0x4e4c44,
        roughness: 0.96,
        flatShading: true,
      });
      const bridge = new THREE.Group();
      const deck = new THREE.BufferGeometry();
      const dpos = [];
      const didx = [];
      const bx = -3.85;
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const z = -13.6 - t * 5.6;
        const y = 0.18 + Math.sin(t * Math.PI) * 0.92;
        dpos.push(bx - 1.15, y, z, bx + 1.15, y, z);
        if (i < 10) {
          const a = i * 2;
          didx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      deck.setAttribute("position", new THREE.Float32BufferAttribute(dpos, 3));
      deck.setIndex(didx);
      deck.computeVertexNormals();
      const deckMesh = new THREE.Mesh(deck, stone);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      bridge.add(deckMesh);

      /* 桥栏：短望柱 + 一道弧形扶手 */
      const railPts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        railPts.push(
          new THREE.Vector3(
            bx,
            0.18 + Math.sin(t * Math.PI) * 0.92 + 0.52,
            -13.6 - t * 5.6,
          ),
        );
      }
      for (const sx of [-1.02, 1.02]) {
        for (let i = 0; i <= 4; i++) {
          const t = i / 4;
          const z = -13.6 - t * 5.6;
          const y = 0.18 + Math.sin(t * Math.PI) * 0.92;
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.54, 0.12),
            stone,
          );
          post.position.set(bx + sx, y + 0.27, z);
          post.castShadow = S.q.shadow > 0;
          bridge.add(post);
        }
        const rail = new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              railPts.map((p) => p.clone().setX(bx + sx)),
            ),
            24,
            0.045,
            5,
            false,
          ),
          stone,
        );
        rail.castShadow = S.q.shadow > 0;
        bridge.add(rail);
      }

      bridge.position.y = 0;
      scene.add(bridge);

      /* 溪岸碎石 */
      const rockGeo = new THREE.DodecahedronGeometry(0.3, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x55544a,
        roughness: 1,
        flatShading: true,
      });
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 46);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 46; i++) {
        const x = -26 + rng() * 52;
        const zz = STREAM_Z + (rng() > 0.5 ? 1 : -1) * (STREAM_HALF + rng() * 0.9);
        const s = 0.5 + rng() * 1.5;
        dummy.position.set(x, groundY(x, zz) + 0.05, zz);
        dummy.rotation.set(rng() * 3, rng() * 3, rng() * 3);
        dummy.scale.set(s, s * 0.7, s);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
      }
      rocks.receiveShadow = true;
      scene.add(rocks);

      /* 远山：四重剪影 */
      ridgeGroup = new THREE.Group();
      scene.add(ridgeGroup);
      ridgeGroup.add(
        makeRidge({ z: -86, width: 460, height: 26, base: -1, seed: 3.1, freq: 7.5, color: 0x121d21, segs: 110 }),
        makeRidge({ z: -140, width: 700, height: 40, base: -2, seed: 7.7, freq: 5.2, color: 0x101b23, segs: 100 }),
        makeRidge({ z: -205, width: 860, height: 48, base: -3, seed: 12.3, freq: 3.6, color: 0x0e1822, segs: 90 }),
        makeRidge({ z: -300, width: 1100, height: 72, base: -4, seed: 19.9, freq: 2.4, color: 0x0d1620, segs: 80 }),
      );

      /* 山前雨云：贴着远山的一带暗云，替掉会露边的雨幕 */
      rain = new THREE.Mesh(
        new THREE.PlaneGeometry(190, 42),
        new THREE.MeshBasicMaterial({
          map: rainCloudTexture(),
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
          fog: true,
          color: 0x18242f,
          blending: THREE.NormalBlending,
        }),
      );
      rain.position.set(-16, 12, -104);
      rain.renderOrder = 1;
      scene.add(rain);

      /* 地气 */
      const mistTex = mistTexture();
      for (let i = 0; i < 5; i++) {
        const mat = new THREE.MeshBasicMaterial({
          map: mistTex.clone(),
          transparent: true,
          opacity: 0.085 - i * 0.012,
          depthWrite: false,
          fog: true,
          color: 0xa9c2dc,
          blending: THREE.NormalBlending,
        });
        mat.map.wrapS = THREE.RepeatWrapping;
        mat.map.repeat.set(4, 1);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(150, 5.5), mat);
        mesh.position.set(0, 0.25 + i * 0.5, -34 - i * 15);
        mesh.userData.speed = 0.004 + i * 0.0016;
        mists.push(mesh);
        scene.add(mesh);
      }
    },

    setQuality(q) {
      if (rain) rain.visible = true;
      for (let i = 0; i < mists.length; i++) mists[i].visible = i < (q.blades > 4000 ? 5 : 3);
    },

    update(dt, t) {
      if (water) water.material.uniforms.uTime.value = t;
      if (rain) rain.position.x = -16 + Math.sin(t * 0.03) * 5;
      for (let i = 0; i < mists.length; i++) {
        const m = mists[i];
        m.material.map.offset.x = (m.material.map.offset.x + dt * m.userData.speed) % 1;
        m.position.x = Math.sin(t * 0.012 + i * 1.7) * 14;
      }
    },
  };
})();
