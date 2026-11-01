/* 天穹：夜空渐变、稀疏星子、明月与行云。 */

const Sky = (() => {
  let dome = null;
  let stars = null;
  let moon = null;
  let moonGroup = null;
  let glowNear = null;
  let glowFar = null;

  const starMax = 520;
  let starCount = 360;

  function domeMaterial() {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uZenith: { value: new THREE.Color(0x05090f) },
        uMid: { value: new THREE.Color(0x0a1730) },
        uHorizon: { value: new THREE.Color(0x1b2c44) },
        uMoon: { value: S.moonDir.clone() },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        uniform vec3 uMoon;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float up = clamp(d.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uMid, pow(up, 0.42));
          col = mix(col, uZenith, pow(up, 1.25));
          float m = max(dot(d, uMoon), 0.0);
          col += vec3(0.16, 0.21, 0.30) * pow(m, 46.0) * 0.75;
          col += vec3(0.05, 0.07, 0.11) * pow(m, 8.0) * 0.5;
          col += vec3(0.020, 0.018, 0.013) * pow(1.0 - up, 7.0);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
  }

  function starField(max) {
    const rng = U.rng(20260817);
    const pos = new Float32Array(max * 3);
    const size = new Float32Array(max);
    const phase = new Float32Array(max);
    for (let i = 0; i < max; i++) {
      const theta = rng() * Math.PI * 2;
      const y = U.lerp(0.03, 1, Math.pow(rng(), 0.62));
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const radius = 900;
      pos[i * 3] = Math.cos(theta) * r * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = Math.sin(theta) * r * radius;
      const bright = rng();
      size[i] = bright > 0.9 ? 3.6 + rng() * 2.2 : 1.4 + bright * 2.2;
      phase[i] = rng();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.55 + 0.45 * sin(uTime * 1.35 + aPhase * 6.2831);
          float lowCut = smoothstep(0.0, 0.14, normalize(position).y);
          vAlpha = tw * lowCut * (0.35 + 0.65 * min(aSize / 3.0, 1.0));
          gl_PointSize = aSize * uPixelRatio;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.05, d);
          a *= a;
          gl_FragColor = vec4(0.86, 0.91, 1.0, a * vAlpha);
        }
      `,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = -900;
    return points;
  }

  function moonTexture() {
    return U.texture(512, 512, function (ctx, w, h) {
      const r = w / 2;
      ctx.fillStyle = "#fffdf2";
      ctx.beginPath();
      ctx.arc(r, r, r - 1, 0, Math.PI * 2);
      ctx.fill();

      /* 月面斑块：先铺低对比暗区，再点缀环形山 */
      const rng = U.rng(77621);
      for (let i = 0; i < 26; i++) {
        const a = rng() * Math.PI * 2;
        const d = Math.pow(rng(), 0.7) * r * 0.92;
        const rr = 12 + rng() * 70;
        const g = ctx.createRadialGradient(
          r + Math.cos(a) * d,
          r + Math.sin(a) * d,
          0,
          r + Math.cos(a) * d,
          r + Math.sin(a) * d,
          rr,
        );
        g.addColorStop(0, "rgba(206,198,178,0.30)");
        g.addColorStop(1, "rgba(206,198,178,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      for (let i = 0; i < 90; i++) {
        const a = rng() * Math.PI * 2;
        const d = Math.pow(rng(), 0.55) * r * 0.95;
        const x = r + Math.cos(a) * d;
        const y = r + Math.sin(a) * d;
        const rr = 1.5 + rng() * 9;
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(178,170,152," + (0.06 + rng() * 0.16) + ")";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - rr * 0.22, y - rr * 0.22, rr * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,252,240,0.10)";
        ctx.fill();
      }
      /* 边缘变暗 */
      const limb = ctx.createRadialGradient(r, r, r * 0.55, r, r, r);
      limb.addColorStop(0, "rgba(120,110,92,0)");
      limb.addColorStop(1, "rgba(120,112,92,0.34)");
      ctx.fillStyle = limb;
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function glowTexture() {
    return U.texture(256, 256, function (ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(226,236,255,0.85)");
      g.addColorStop(0.16, "rgba(190,208,246,0.34)");
      g.addColorStop(0.42, "rgba(140,166,214,0.10)");
      g.addColorStop(1, "rgba(120,150,200,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  return {
    build(scene) {
      dome = new THREE.Mesh(new THREE.SphereGeometry(1200, 40, 24), domeMaterial());
      dome.renderOrder = -1000;
      dome.frustumCulled = false;
      scene.add(dome);

      stars = starField(starMax);
      stars.geometry.setDrawRange(0, starCount);
      scene.add(stars);

      moonGroup = new THREE.Group();
      moonGroup.frustumCulled = false;
      scene.add(moonGroup);

      /* 月：贴图只画了一个圆，用朝向相机的告示板，免得球面把圆切出直边 */
      moon = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: moonTexture(),
          transparent: true,
          depthWrite: false,
          fog: false,
          toneMapped: false,
        }),
      );
      moon.position.copy(S.moonDir).multiplyScalar(620);
      moon.scale.setScalar(23);
      moon.renderOrder = -800;
      moonGroup.add(moon);

      const gt = glowTexture();
      glowNear = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: gt,
          color: 0xdce8ff,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          fog: false,
          toneMapped: false,
        }),
      );
      glowNear.position.copy(moon.position);
      glowNear.scale.setScalar(88);
      glowNear.renderOrder = -790;
      moonGroup.add(glowNear);

      glowFar = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: gt,
          color: 0x9db8dd,
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          fog: false,
          toneMapped: false,
        }),
      );
      glowFar.position.copy(moon.position);
      glowFar.scale.setScalar(300);
      glowFar.renderOrder = -795;
      moonGroup.add(glowFar);

    },

    setQuality(q) {
      if (!stars) return;
      starCount = Math.min(starMax, q.stars);
      stars.geometry.setDrawRange(0, starCount);
      if (stars.material.uniforms)
        stars.material.uniforms.uPixelRatio.value = Math.min(
          window.devicePixelRatio || 1,
          S.dprCap,
        );
    },

    update(dt, t) {
      if (!dome) return;
      dome.position.copy(camera.position);
      moonGroup.position.copy(camera.position);
      stars.position.copy(camera.position);

      stars.material.uniforms.uTime.value = t;
      stars.material.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio || 1,
        S.dprCap,
      );

      const pulse = 0.5 + Math.sin(t * 0.24) * 0.035 + Math.sin(t * 0.61) * 0.018;
      glowNear.material.opacity = pulse;
      glowFar.material.opacity = 0.17 + Math.sin(t * 0.17) * 0.018;
    },

    moonDir: S.moonDir,
  };
})();
