/* 草、菊与飘落的粒子。 */
const Plants = (() => {
  const sway = { value: 0 };
  let grassMaterial, dust;

  function mergeGeometries(list) {
    const parts = list.map((geometry) =>
      geometry.index ? geometry.toNonIndexed() : geometry,
    );
    let total = 0;
    for (const part of parts) total += part.attributes.position.count;
    const position = new Float32Array(total * 3);
    const normal = new Float32Array(total * 3);
    let offset = 0;
    for (const part of parts) {
      position.set(part.attributes.position.array, offset * 3);
      normal.set(part.attributes.normal.array, offset * 3);
      offset += part.attributes.position.count;
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(position, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
    return merged;
  }

  function bladeGeometry() {
    const blades = [];
    for (let i = 0; i < 3; i++) {
      const plane = new THREE.PlaneGeometry(0.055, 0.42, 1, 2);
      plane.translate(0, 0.21, 0);
      const position = plane.attributes.position;
      for (let v = 0; v < position.count; v++) {
        const y = position.getY(v);
        position.setX(v, position.getX(v) * (1 - y * 0.85));
      }
      plane.rotateY((i / 3) * Math.PI + Math.random() * 0.3);
      plane.rotateZ((Math.random() - 0.5) * 0.22);
      blades.push(plane);
    }
    return mergeGeometries(blades);
  }

  function makeGrass(scene, count) {
    const geometry = bladeGeometry();
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) phases[i] = Math.random() * Math.PI * 2;
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));

    grassMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x3a3822,
      emissiveIntensity: 0.55,
      side: THREE.DoubleSide,
    });
    grassMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uSway = sway;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uSway;\nattribute float aPhase;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float bend = sin(uSway * 1.15 + aPhase) * 0.055 * transformed.y * transformed.y * 4.0;
          transformed.x += bend;
          transformed.z += bend * 0.45;`,
        );
    };
    grassMaterial.customProgramCacheKey = () => "grass-sway-v1";

    const mesh = new THREE.InstancedMesh(geometry, grassMaterial, count);
    const samples = [];
    for (let i = 0; i <= 80; i++)
      samples.push(PR.fenceCurve.getPointAt(i / 80));
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const base = new THREE.Color(0x5f5c35),
      dry = new THREE.Color(0x7d6a3c),
      deep = new THREE.Color(0x474d2c);
    let placed = 0,
      guard = 0;
    while (placed < count && guard++ < count * 6) {
      const x = (Math.random() - 0.5) * 58;
      const z = 15 - Math.pow(Math.random(), 1.6) * 42;
      let gap = 99;
      for (const sample of samples)
        gap = Math.min(gap, Math.hypot(x - sample.x, z - sample.z));
      if (gap < 0.26) continue;
      if (Math.hypot(x - Figure.at.x, z - Figure.at.z) < 0.62) continue;
      const far = Math.hypot(x, z);
      if (Math.random() > 0.95 - Math.min(0.6, far / 60)) continue;
      dummy.position.set(x, World.groundHeight(x, z), z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.setScalar(0.7 + Math.random() * 0.9);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      color.copy(base).lerp(Math.random() < 0.42 ? dry : deep, Math.random() * 0.85);
      mesh.setColorAt(placed, color);
      placed++;
    }
    mesh.count = placed;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function chrysanthemumGeometry() {
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const petal = new THREE.ConeGeometry(0.036, 0.125, 6, 1);
      petal.translate(0, 0.06, 0);
      petal.rotateX(1.22);
      petal.rotateY((i / 9) * Math.PI * 2);
      parts.push(petal);
    }
    for (let i = 0; i < 7; i++) {
      const petal = new THREE.ConeGeometry(0.03, 0.075, 6, 1);
      petal.translate(0, 0.035, 0);
      petal.rotateX(0.62);
      petal.rotateY((i / 7) * Math.PI * 2 + 0.4);
      parts.push(petal);
    }
    const heart = new THREE.SphereGeometry(0.036, 8, 6);
    heart.scale(1, 0.6, 1);
    parts.push(heart);
    return mergeGeometries(parts);
  }

  function makeChrysanthemums(scene, count) {
    const geometry = chrysanthemumGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0,
      flatShading: true,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = PR.params.shadow > 0;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const palette = [
      new THREE.Color(0xd9a63a),
      new THREE.Color(0xe8c25c),
      new THREE.Color(0xefe3c8),
      new THREE.Color(0xc08f4a),
      new THREE.Color(0xb8842f),
    ];
    let placed = 0,
      guard = 0;
    while (placed < count - 70 && guard++ < count * 60) {
      const t = Math.random() * 0.97 + 0.015;
      const point = PR.fenceCurve.getPointAt(t);
      const side = Math.random() < 0.62 ? -1 : 1;
      const offset = 0.32 + Math.random() * 1.7;
      const x = point.x + side * offset;
      const z = point.z + (Math.random() - 0.5) * 0.9;
      if (Math.random() < 0.16) continue;
      dummy.position.set(
        x,
        World.groundHeight(x, z) + 0.22 + Math.random() * 0.12,
        z,
      );
      dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 6.28, (Math.random() - 0.5) * 0.4);
      dummy.scale.setScalar(0.46 + Math.random() * 0.22);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      color.copy(palette[Math.floor(Math.random() * palette.length)]);
      mesh.setColorAt(placed, color);
      placed++;
    }
    for (let i = 0; i < 70 && placed < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.55 + Math.random() * 2.4;
      const x = Figure.at.x + Math.cos(angle) * distance;
      const z = Figure.at.z + Math.sin(angle) * distance;
      dummy.position.set(
        x,
        World.groundHeight(x, z) + 0.2 + Math.random() * 0.1,
        z,
      );
      dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 6.28, (Math.random() - 0.5) * 0.4);
      dummy.scale.setScalar(0.46 + Math.random() * 0.22);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      color.copy(palette[Math.floor(Math.random() * palette.length)]);
      mesh.setColorAt(placed, color);
      placed++;
    }
    mesh.count = placed;
    scene.add(mesh);
  }

  function makeDust(scene, count) {
    const geometry = new THREE.BufferGeometry();
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      position[i * 3] = (Math.random() - 0.5) * 42;
      position[i * 3 + 1] = Math.random() * 12;
      position[i * 3 + 2] = (Math.random() - 0.5) * 38 + 2;
      size[i] = 0.35 + Math.random() * 0.85;
      phase[i] = Math.random() * 6.28;
      speed[i] = 0.12 + Math.random() * 0.35;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: 13 },
        uColor: { value: new THREE.Color(0xffdca8) },
      },
      vertexShader: `
        uniform float uTime, uHeight;
        attribute float aSize, aPhase, aSpeed;
        varying float vFade;
        void main() {
          vec3 p = position;
          p.y = mod(position.y - uTime * aSpeed, uHeight);
          p.x += sin(uTime * 0.42 + aPhase) * 0.85;
          p.z += cos(uTime * 0.31 + aPhase * 1.7) * 0.7;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (120.0 / max(1.0, -mv.z));
          vFade = smoothstep(0.0, 1.4, p.y) * (1.0 - smoothstep(uHeight - 3.0, uHeight, p.y));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vFade;
        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          float alpha = smoothstep(0.5, 0.05, length(d));
          gl_FragColor = vec4(uColor, alpha * vFade * 0.26);
        }
      `,
    });
    dust = new THREE.Points(geometry, material);
    dust.frustumCulled = false;
    scene.add(dust);
  }

  function makeLeaves(scene, count) {
    const geometry = new THREE.PlaneGeometry(0.07, 0.045);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xb08a46,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 46;
      const z = 14 - Math.random() * 38;
      dummy.position.set(x, World.groundHeight(x, z) + 0.03, z);
      dummy.rotation.set(0, Math.random() * 6.28, 0);
      dummy.scale.setScalar(0.7 + Math.random() * 0.8);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(mesh);
  }

  return {
    build(scene, params) {
      makeGrass(scene, params.grass);
      makeChrysanthemums(scene, params.chrys);
      makeDust(scene, 150);
      makeLeaves(scene, 260);
    },
    update(time) {
      sway.value = time;
      if (grassMaterial) grassMaterial.userData.uniform = sway;
      if (dust) dust.material.uniforms.uTime.value = time;
    },
  };
})();
