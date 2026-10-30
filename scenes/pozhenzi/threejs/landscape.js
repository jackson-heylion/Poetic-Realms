function groundHeight(x, z) {
  const flat = THREE.MathUtils.smoothstep(Math.hypot(x, z + 3), 8, 55);
  return (
    (Math.sin(x * 0.12 + z * 0.055) * 0.28 +
      Math.cos(z * 0.14 - x * 0.04) * 0.18) *
      flat -
    0.1
  );
}
const sky = mesh(
  new THREE.SphereGeometry(310, 32, 20),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {},
    vertexShader: `precision highp float;
    varying vec3 vDirection;
    void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `precision highp float;
    varying vec3 vDirection;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
    void main(){
      vec3 d=normalize(vDirection);float h=max(0.0,d.y);
      vec3 col=mix(vec3(.10,.14,.19),vec3(.008,.018,.04),pow(h,.42));
      vec2 p=d.xz/max(.12,d.y+.2)*2.4;
      float cloud=noise(p)*.6+noise(p*2.1)*.25+noise(p*4.2)*.1;
      float veil=smoothstep(.48,.73,cloud)*smoothstep(.0,.15,h);
      col=mix(col,vec3(.08,.105,.145),veil*.65);
      gl_FragColor=vec4(col,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  }),
);
sky.renderOrder = -20;
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const skyRandom = seed(3001);
for (let i = 0; i < (mobile ? 450 : 850); i++) {
  const azimuth = skyRandom() * Math.PI * 2,
    elevation = 0.06 + skyRandom() * 0.95;
  starPositions.push(
    Math.cos(azimuth) * Math.cos(elevation) * 260,
    Math.sin(elevation) * 260,
    Math.sin(azimuth) * Math.cos(elevation) * 260,
  );
}
starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starPositions, 3),
);
scene.add(
  new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xc5d1e0,
      size: 0.8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.65,
      fog: false,
      depthWrite: false,
    }),
  ),
);
const moonMap = texture((context, width, height) => {
  context.fillStyle = "#c3d0d9";
  context.fillRect(0, 0, width, height);
  const rnd = seed(208);
  for (let i = 0; i < 170; i++) {
    context.fillStyle = `rgba(62,87,110,${rnd() * 0.14})`;
    context.beginPath();
    context.arc(rnd() * width, rnd() * height, 2 + rnd() * 21, 0, Math.PI * 2);
    context.fill();
  }
});
const moon = mesh(
  new THREE.SphereGeometry(3.1, 24, 16),
  new THREE.MeshBasicMaterial({
    map: moonMap,
    color: 0xb3c8dc,
    toneMapped: false,
    fog: false,
  }),
  [mobile ? -22 : -64, 51, -170],
);
const moonHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowMap,
    color: 0x93b0d5,
    opacity: 0.1,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  }),
);
moonHalo.position.copy(moon.position);
moonHalo.scale.set(28, 28, 1);
scene.add(moonHalo);
const terrain = new THREE.PlaneGeometry(
  230,
  230,
  mobile ? 78 : 112,
  mobile ? 78 : 112,
);
terrain.rotateX(-Math.PI / 2);
const groundPositions = terrain.attributes.position;
for (let i = 0; i < groundPositions.count; i++)
  groundPositions.setY(
    i,
    groundHeight(groundPositions.getX(i), groundPositions.getZ(i)),
  );
terrain.computeVertexNormals();
const earth = mesh(
  terrain,
  new THREE.MeshPhongMaterial({
    map: groundMap,
    bumpMap: groundMap,
    bumpScale: 0.13,
    shininess: 2,
    specular: 0x111311,
    color: 0x75644c,
  }),
);
earth.receiveShadow = true;
for (let layer = 0; layer < 3; layer++) {
  const geometry = new THREE.PlaneGeometry(380, 115, 64, 22);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    const crest =
      (0.55 +
        0.24 * Math.sin(x * 0.035 + layer * 3) +
        0.16 * Math.sin(x * 0.081 + 2)) *
      (14 + layer * 8);
    const width = Math.exp(-Math.pow((z + 8) / 32, 2));
    positions.setY(
      i,
      crest * width + Math.sin(x * 0.16 + z * 0.08) * 1.4 * width - 1,
    );
  }
  geometry.computeVertexNormals();
  mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(0.61, 0.15, 0.14 + layer * 0.025),
    }),
    [0, 0, -105 - layer * 55],
  );
}
// 稀疏碎石贴着地形布置，避免近景出现整齐、尖锐的草丛面片。
const stones = new THREE.InstancedMesh(
  new THREE.DodecahedronGeometry(1, 0),
  new THREE.MeshStandardMaterial({ color: 0x414138, roughness: 0.95 }),
  mobile ? 85 : 180,
);
const stoneTransform = new THREE.Object3D();
for (let i = 0; i < stones.count; i++) {
  const x = (random() - 0.5) * 42,
    z = -32 + random() * 44;
  stoneTransform.position.set(x, groundHeight(x, z) + 0.018, z);
  const scale = 0.012 + random() * 0.04;
  stoneTransform.scale.set(scale * 1.6, scale * 0.45, scale);
  stoneTransform.rotation.set(random() * 2, random() * 6, random());
  stoneTransform.updateMatrix();
  stones.setMatrixAt(i, stoneTransform.matrix);
}
stones.receiveShadow = true;
scene.add(stones);
