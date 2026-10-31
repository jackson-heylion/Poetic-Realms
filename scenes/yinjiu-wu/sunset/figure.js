/* 采菊的人：低模写意，九秒一个循环。 */
const Figure = (() => {
  const AT = { x: 2.28, z: 3.6 };
  let root, torso, head, armNear, armFar, basket, shadow;

  function pulse(t, a, b, c, d) {
    if (t < a || t > d) return 0;
    if (t < b) return (t - a) / (b - a);
    if (t > c) return 1 - (t - c) / (d - c);
    return 1;
  }

  function shadowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    gradient.addColorStop(0, "rgba(38,28,18,0.55)");
    gradient.addColorStop(0.55, "rgba(38,28,18,0.25)");
    gradient.addColorStop(1, "rgba(38,28,18,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  return {
    build(scene) {
      const robe = new THREE.MeshStandardMaterial({
        color: 0xc2b89f,
        roughness: 0.94,
      });
      const trim = new THREE.MeshStandardMaterial({
        color: 0x6f5a46,
        roughness: 0.9,
      });
      const skin = new THREE.MeshStandardMaterial({
        color: 0xc9a887,
        roughness: 0.85,
      });
      const sleeve = new THREE.MeshStandardMaterial({
        color: 0xa99c84,
        roughness: 0.94,
      });
      const hat = new THREE.MeshStandardMaterial({
        color: 0xb49a63,
        roughness: 1,
      });
      const cast = PR.params.shadow > 0;

      root = new THREE.Group();
      root.position.set(AT.x, World.groundHeight(AT.x, AT.z), AT.z);
      root.rotation.y = 0.72;
      root.scale.setScalar(0.96);

      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.175, 0.275, 1.02, 14, 1, true),
        robe,
      );
      skirt.position.y = 0.51;
      skirt.castShadow = cast;
      root.add(skirt);

      const hem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.045, 14, 1, true),
        trim,
      );
      hem.position.y = 0.03;
      root.add(hem);

      torso = new THREE.Group();
      torso.position.y = 1.02;
      root.add(torso);

      const chest = new THREE.Mesh(
        new THREE.CylinderGeometry(0.215, 0.185, 0.46, 14, 1, true),
        robe,
      );
      chest.position.y = 0.23;
      chest.castShadow = cast;
      torso.add(chest);

      const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.215, 12, 8), robe);
      shoulders.scale.set(1, 0.5, 0.9);
      shoulders.position.y = 0.44;
      shoulders.castShadow = cast;
      torso.add(shoulders);

      const sash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.192, 0.192, 0.065, 14, 1, true),
        trim,
      );
      sash.position.y = 0.02;
      torso.add(sash);

      head = new THREE.Group();
      head.position.y = 0.5;
      torso.add(head);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 8), skin);
      neck.position.y = 0.02;
      head.add(neck);

      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.102, 14, 10), skin);
      skull.scale.set(1, 1.1, 0.95);
      skull.position.y = 0.14;
      skull.castShadow = cast;
      head.add(skull);

      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), trim);
      bun.position.set(0, 0.21, -0.06);
      head.add(bun);

      const ink = new THREE.MeshStandardMaterial({
        color: 0x3a3128,
        roughness: 0.8,
      });
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 5), ink);
        eye.position.set(side * 0.034, 0.156, -0.09);
        head.add(eye);
      }
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 5), skin);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.13, -0.1);
      head.add(nose);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.235, 0.11, 16), hat);
      cap.position.y = 0.245;
      cap.castShadow = cast;
      head.add(cap);

      armNear = new THREE.Group();
      armNear.position.set(0.245, 0.38, 0.03);
      torso.add(armNear);
      const upperNear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.04, 0.28, 8),
        robe,
      );
      upperNear.position.y = -0.14;
      armNear.add(upperNear);
      const foreNear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.034, 0.26, 8),
        sleeve,
      );
      foreNear.position.y = -0.4;
      foreNear.rotation.x = -0.25;
      armNear.add(foreNear);
      const handNear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skin);
      handNear.position.set(0, -0.55, 0.06);
      armNear.add(handNear);

      armFar = new THREE.Group();
      armFar.position.set(-0.245, 0.38, 0.0);
      torso.add(armFar);
      const upperFar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.04, 0.3, 8),
        robe,
      );
      upperFar.position.y = -0.15;
      armFar.add(upperFar);
      const foreFar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.034, 0.28, 8),
        sleeve,
      );
      foreFar.position.y = -0.42;
      armFar.add(foreFar);

      basket = new THREE.Group();
      basket.position.set(0.26, 0.12, 0.16);
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.1, 0.16, 12, 1, true),
        trim,
      );
      basket.add(bowl);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.012, 6, 16),
        trim,
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.08;
      basket.add(rim);
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.11, 0.009, 5, 14, Math.PI),
        trim,
      );
      handle.position.y = 0.08;
      basket.add(handle);
      root.add(basket);

      shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 1.15),
        new THREE.MeshBasicMaterial({
          map: shadowTexture(),
          transparent: true,
          depthWrite: false,
          opacity: 0.55,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.015;
      root.add(shadow);

      scene.add(root);
    },

    update(time) {
      if (!root) return;
      const phase = (time % 9) / 9;
      const bend = pulse(phase, 0.08, 0.24, 0.4, 0.52);
      const lift = pulse(phase, 0.56, 0.66, 0.74, 0.84);
      const look = pulse(phase, 0.62, 0.74, 0.84, 0.94);

      torso.rotation.x = bend * 0.62 - lift * 0.08;
      torso.rotation.z = Math.sin(time * 0.7) * 0.02 + bend * 0.04;
      head.rotation.x = -bend * 0.34 + look * 0.22;
      armNear.rotation.x = bend * 1.15 - lift * 1.45;
      armNear.rotation.z = lift * 0.18;
      armFar.rotation.x = -bend * 0.28 + lift * 0.3;
      basket.position.y = 0.12 + Math.sin(time * 1.1) * 0.006;
      shadow.material.opacity = 0.5 + Math.sin(time * 0.9) * 0.04;
    },

    at: AT,
  };
})();
