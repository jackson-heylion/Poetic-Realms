/* 天穹、地形、远山、雾带与光。 */
const World = (() => {
  const sunDir = new THREE.Vector3(0.58, 0.24, -0.78).normalize();
  let sky;
  const mists = [];
  const glow = [];

  function smooth(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function makeSky() {
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x33486a) },
        uMid: { value: new THREE.Color(0x8a8780) },
        uHorizon: { value: new THREE.Color(0xe4b184) },
        uSun: { value: new THREE.Color(0xffd8a2) },
        uSunDir: { value: sunDir.clone() },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop, uMid, uHorizon, uSun, uSunDir;
        uniform float uTime;
        varying vec3 vDir;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i), b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
          return v;
        }

        void main() {
          float h = clamp(vDir.y, -0.2, 1.0);
          vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.3, h));
          col = mix(col, uTop, smoothstep(0.24, 0.82, h));

          float d = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
          col += uSun * pow(d, 340.0) * 2.4;
          col += uSun * pow(d, 9.0) * 0.34;
          col += uSun * pow(d, 2.2) * 0.07;

          float hh = max(vDir.y, 0.03);
          vec2 uv = vDir.xz / hh * 0.85 + vec2(uTime * 0.004, 0.0);
          float cloud = fbm(uv * 1.5);
          cloud *= smoothstep(0.07, 0.2, vDir.y) * (1.0 - smoothstep(0.55, 0.98, vDir.y));
          col = mix(col, vec3(1.0, 0.9, 0.78), smoothstep(0.55, 0.86, cloud) * 0.3);

          col += vec3(0.55, 0.24, 0.1) * exp(-pow((vDir.y - 0.05) / 0.075, 2.0));
          vec3 warm = vec3(0.98, 0.78, 0.6);
          col = mix(col, warm, (1.0 - smoothstep(-0.02, 0.16, h)) * 0.35);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    sky = new THREE.Mesh(new THREE.SphereGeometry(620, 32, 20), material);
    sky.frustumCulled = false;
    return sky;
  }

  function groundHeight(x, z) {
    const r = Math.hypot(x * 0.9, z * 0.72);
    const roll =
      Math.sin(x * 0.043) * 0.9 +
      Math.sin(z * 0.061 + 1.7) * 0.7 +
      Math.sin((x + z) * 0.019) * 1.5;
    const lift = smooth(20, 95, r);
    return roll * (0.14 + lift * 1.6) + lift * 2.4;
  }

  function makeGround() {
    const geometry = new THREE.PlaneGeometry(700, 700, 120, 120);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;
    const colors = [];
    const grass = new THREE.Color(0x6d6a41);
    const dry = new THREE.Color(0x8d7a4f);
    const soil = new THREE.Color(0x6d5a3c);
    const tint = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i),
        z = position.getZ(i);
      position.setY(i, groundHeight(x, z));
      const patch =
        0.5 +
        0.5 *
          Math.sin(x * 0.7 + Math.sin(z * 0.4) * 2.1) *
          Math.cos(z * 0.53 + Math.sin(x * 0.31) * 1.7);
      tint.copy(grass).lerp(dry, patch * 0.75);
      const nearPath = 1 - smooth(0.4, 2.2, Math.abs(x - 0.9 - z * 0.12));
      tint.lerp(soil, nearPath * 0.5);
      const fade = smooth(90, 280, Math.hypot(x, z));
      tint.lerp(new THREE.Color(0x7a7452), fade * 0.45);
      colors.push(tint.r, tint.g, tint.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.97,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
  }

  function ridge(x, seed, peakX) {
    const roll =
      Math.sin(x * 0.0058 + seed) * 9 +
      Math.sin(x * 0.0137 + seed * 2.1) * 5 +
      Math.sin(x * 0.0321 + seed * 3.3) * 2.4 +
      Math.sin(x * 0.081 + seed * 1.4) * 0.9;
    const main = 30 * Math.exp(-Math.pow((x - peakX) / 105, 2));
    const second = 15 * Math.exp(-Math.pow((x - peakX - 165) / 78, 2));
    return roll + main + second;
  }

  function makeRidge(distance, seed, base, color, peakX) {
    const width = 1100;
    const geometry = new THREE.PlaneGeometry(width, 300, 220, 1);
    const position = geometry.attributes.position;
    const colors = [];
    const c = new THREE.Color(color);
    const sky = new THREE.Color(0xe0b891);
    const top = c.clone().lerp(sky, 0.16);
    const bottom = c.clone().offsetHSL(0, 0.02, -0.04);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const crest = Math.max(0, base + ridge(x, seed, peakX));
      if (y > 0) position.setY(i, crest);
      else position.setY(i, -6);
      const t = y > 0 ? 1 : 0;
      const shade = new THREE.Color().copy(bottom).lerp(top, t);
      if (y > 0) {
        const slope =
          (ridge(x + 2.5, seed, peakX) - ridge(x - 2.5, seed, peakX)) / 5;
        shade.multiplyScalar(1 - Math.max(-0.3, Math.min(0.3, slope * 0.16)));
      }
      colors.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }),
    );
    mesh.position.set(0, 0, distance);
    return mesh;
  }

  function mistTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.62, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 64);
    const image = ctx.getImageData(0, 0, 256, 64);
    for (let i = 0; i < image.data.length; i += 4) {
      const x = (i / 4) % 256;
      const wobble =
        0.55 + 0.45 * Math.sin(x * 0.05) * Math.sin(x * 0.021 + 1.3);
      image.data[i + 3] *= wobble;
    }
    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  function makeMist(index) {
    const texture = mistTexture();
    texture.repeat.set(3.4, 1);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(760, 70),
      new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xffe9cd,
        transparent: true,
        opacity: 0.2 - index * 0.028,
        depthWrite: false,
        fog: false,
      }),
    );
    mesh.position.set(0, 7 + index * 3.4, -120 - index * 62);
    mesh.userData.speed = 0.0055 + index * 0.0016;
    return mesh;
  }

  function glowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,226,180,0.95)");
    gradient.addColorStop(0.35, "rgba(255,196,132,0.35)");
    gradient.addColorStop(1, "rgba(255,180,110,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  return {
    build(scene) {
      mists.length = 0;
      glow.length = 0;
      scene.fog = new THREE.Fog(0xcfb191, 60, 400);
      scene.add(makeSky());

      const ground = makeGround();
      ground.userData.kind = "ground";
      scene.add(ground);

      scene.add(makeRidge(-200, 1.4, 10, 0x3b453a, -34));
      scene.add(makeRidge(-250, 2.6, 14, 0x4b564a, -78));
      scene.add(makeRidge(-330, 3.9, 20, 0x63705f, 46));
      scene.add(makeRidge(-420, 6.2, 26, 0x87938a, 150));

      for (let i = 0; i < PR.params.mist; i++) {
        const mist = makeMist(i);
        mists.push(mist);
        scene.add(mist);
      }
      const lowMist = makeMist(-1);
      lowMist.position.set(0, 3.2, -150);
      lowMist.material.opacity = 0.15;
      mists.push(lowMist);
      scene.add(lowMist);

      const sun = new THREE.DirectionalLight(0xffc893, 2.35);
      sun.position.copy(sunDir).multiplyScalar(90);
      sun.castShadow = PR.params.shadow > 0;
      sun.shadow.mapSize.set(PR.params.shadow || 512, PR.params.shadow || 512);
      sun.shadow.camera.left = -30;
      sun.shadow.camera.right = 30;
      sun.shadow.camera.top = 30;
      sun.shadow.camera.bottom = -30;
      sun.shadow.camera.near = 20;
      sun.shadow.camera.far = 190;
      sun.shadow.bias = -0.0011;
      sun.shadow.normalBias = 0.06;
      scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xb4c6d2, 0x5d4c32, 0.72));
      scene.add(new THREE.AmbientLight(0xffdcb8, 0.12));

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture(),
          color: 0xffd7a8,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      halo.position.copy(sunDir).multiplyScalar(300);
      halo.scale.set(190, 190, 1);
      scene.add(halo);
      glow.push(halo);
    },

    update(time) {
      if (sky) {
        sky.material.uniforms.uTime.value = time;
        sky.position.copy(PR.camera.position);
      }
      for (const mist of mists) {
        mist.material.map.offset.x = time * mist.userData.speed;
        mist.position.x = Math.sin(time * 0.02 + mist.position.z) * 6;
      }
      for (const halo of glow)
        halo.position.copy(PR.camera.position).addScaledVector(sunDir, 300);
    },

    sunDir,
    groundHeight,
  };
})();
