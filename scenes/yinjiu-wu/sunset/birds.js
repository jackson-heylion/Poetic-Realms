/* 归山的飞鸟：一个实例化批次，扑翼在顶点着色器里算。 */
const Birds = (() => {
  const flock = [];
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-30, 17, 12),
    new THREE.Vector3(-13, 14, -30),
    new THREE.Vector3(4, 11, -68),
    new THREE.Vector3(17, 9, -108),
  ]);
  let mesh, material, dummy;

  function wingGeometry() {
    const geometry = new THREE.BufferGeometry();
    const position = new Float32Array([
      0, 0, 0.16, -0.46, 0, -0.1, -0.16, 0, -0.14, 0, 0, 0.16, -0.16, 0, -0.14,
      0, 0, -0.2, 0, 0, 0.16, 0.16, 0, -0.14, 0.46, 0, -0.1, 0, 0, 0.16, 0, 0,
      -0.2, 0.16, 0, -0.14,
    ]);
    const side = new Float32Array([
      -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1,
    ]);
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  return {
    build(scene, params) {
      material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x33342e) },
        },
        vertexShader: `
          uniform float uTime;
          attribute float aSide;
          attribute float aPhase;
          varying float vShade;
          void main() {
            vec3 p = position;
            float flap = sin(uTime * 6.4 + aPhase) * 0.62 * aSide;
            p.y += sin(flap) * abs(p.x);
            p.x *= cos(flap);
            vShade = 0.55 + 0.45 * abs(cos(flap));
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vShade;
          void main() { gl_FragColor = vec4(uColor * vShade, 1.0); }
        `,
      });

      const geometry = wingGeometry();
      const phases = new Float32Array(params.birds);
      for (let i = 0; i < params.birds; i++) phases[i] = Math.random() * 6.28;
      geometry.setAttribute(
        "aPhase",
        new THREE.InstancedBufferAttribute(phases, 1),
      );
      mesh = new THREE.InstancedMesh(geometry, material, params.birds);
      mesh.frustumCulled = false;
      dummy = new THREE.Object3D();
      for (let i = 0; i < params.birds; i++) {
        flock.push({
          offset: (i / params.birds) * 0.9,
          spread: (Math.random() - 0.5) * 9,
          lift: (Math.random() - 0.5) * 2.6,
          speed: 0.014 + Math.random() * 0.008,
          scale: 0.8 + Math.random() * 0.7,
        });
      }
      scene.add(mesh);
    },

    update(time) {
      if (!mesh) return;
      material.uniforms.uTime.value = time;
      for (let i = 0; i < flock.length; i++) {
        const bird = flock[i];
        const t = (time * bird.speed + bird.offset) % 1;
        const point = curve.getPointAt(t);
        dummy.position.set(
          point.x + bird.spread,
          point.y + bird.lift + Math.sin(time * 0.6 + i) * 0.5,
          point.z,
        );
        const angle = t * Math.PI * 0.35;
        dummy.rotation.set(0, angle, Math.sin(time * 0.5 + i) * 0.08);
        dummy.scale.setScalar(bird.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
})();
