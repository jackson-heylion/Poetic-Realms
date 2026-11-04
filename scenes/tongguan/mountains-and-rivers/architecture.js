const stone = texture("stone");
stone.repeat.set(4, 3);
const stoneMat = new THREE.MeshStandardMaterial({
  map: stone,
  color: 0x9a9685,
  bumpMap: stone,
  bumpScale: 0.7,
  roughness: 0.94,
});
const woodMat = new THREE.MeshStandardMaterial({
    color: 0x39291f,
    roughness: 0.9,
  }),
  roofMat = new THREE.MeshStandardMaterial({
    color: 0x40504a,
    roughness: 0.8,
    side: THREE.DoubleSide,
  }),
  darkMat = new THREE.MeshBasicMaterial({ color: 0x111816 });
const gate = new THREE.Group();
gate.position.set(45, 25, 55);
scene.add(gate);
function box(parent, w, h, d, x, y, z, mat = stoneMat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
box(gate, 25, 21, 10, -25, 10.5, 0);
box(gate, 25, 21, 10, 25, 10.5, 0);
box(gate, 75, 7, 10, 0, 24, 0);
box(gate, 14, 16, 0.4, 0, 8, -5.2, darkMat);
for (let i = 0; i < 11; i++) {
  const a = (i / 10) * Math.PI,
    m = box(gate, 2.5, 3.4, 1, Math.cos(a) * 8, 11 + Math.sin(a) * 8, 5.25);
  m.rotation.z = a - Math.PI / 2;
}
box(gate, 34, 2, 18, 0, 28.5, 0);
box(gate, 29, 9, 13, 0, 34, 0, woodMat);
for (const x of [-13, -5, 5, 13])
  for (const z of [-7, 7]) box(gate, 1, 11, 1, x, 34, z, woodMat);
function hipRoof(w, d, h) {
  const v = [
      -w / 2,
      0,
      -d / 2,
      w / 2,
      0,
      -d / 2,
      w / 2,
      0,
      d / 2,
      -w / 2,
      0,
      d / 2,
      -w * 0.24,
      h,
      0,
      w * 0.24,
      h,
      0,
    ],
    idx = [0, 1, 5, 0, 5, 4, 3, 4, 5, 3, 5, 2, 0, 4, 3, 1, 2, 5];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const roof = new THREE.Mesh(hipRoof(40, 25, 9), roofMat);
roof.position.y = 39;
roof.castShadow = true;
gate.add(roof);
box(gate, 22, 1.2, 1.4, 0, 48.3, 0, roofMat);
const ribs = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.2, 1, 5),
    roofMat,
    26,
  ),
  rm = new THREE.Matrix4(),
  rq = new THREE.Quaternion(),
  up = new THREE.Vector3(0, 1, 0);
let ribIndex = 0;
for (let x = -18; x <= 18; x += 3)
  for (const side of [-1, 1]) {
    const a = new THREE.Vector3(x, 39.15, side * 12.5),
      b = new THREE.Vector3(clamp(x, -9.6, 9.6), 48.15, 0),
      d = b.clone().sub(a),
      mid = a.clone().add(b).multiplyScalar(0.5);
    rq.setFromUnitVectors(up, d.clone().normalize());
    rm.compose(mid, rq, new THREE.Vector3(1, d.length(), 1));
    ribs.setMatrixAt(ribIndex++, rm);
  }
gate.add(ribs);
for (const z of [-12.5, 12.5]) box(gate, 40, 0.65, 0.8, 0, 39, z, roofMat);
for (const x of [-20, 20]) box(gate, 0.8, 0.65, 25, x, 39, 0, roofMat);
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x8e826a,
  roughness: 1,
});
for (const x of [-8, 0, 8]) {
  box(gate, 4, 4, 0.25, x, 34, 6.6, windowMat);
  box(gate, 0.25, 4, 0.35, x, 34, 6.8, woodMat);
  box(gate, 4, 0.25, 0.35, x, 34, 6.8, woodMat);
}
for (const side of [-1, 1])
  for (let i = 0; i < 4; i++) {
    const x = 45 + side * (52 + i * 24),
      z = 55 + i * 2;
    box(scene, 25, 13, 8, x, south(x, z) + 6.5, z);
  }
const crenels = new THREE.InstancedMesh(
    new THREE.BoxGeometry(3, 3, 2.2),
    stoneMat,
    38,
  ),
  matrix = new THREE.Matrix4();
let ci = 0;
for (const z of [-4.3, 4.3])
  for (let x = -35; x <= 35; x += 4) {
    matrix.makeTranslation(x, 29, z);
    crenels.setMatrixAt(ci++, matrix);
  }
gate.add(crenels);
const roadTex = texture("road"),
  roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    color: 0x8d8674,
    roughness: 1,
    side: THREE.DoubleSide,
  });
const route = new THREE.CatmullRomCurve3(
  [
    [145, 205],
    [120, 172],
    [130, 143],
    [96, 121],
    [102, 96],
    [72, 79],
    [58, 64],
    [45, 58],
  ].map((p) => new THREE.Vector3(p[0], 0, p[1])),
);
const rp = [],
  ru = [],
  ri = [],
  steps = 150;
for (let i = 0; i <= steps; i++) {
  const t = i / steps,
    p = route.getPoint(t),
    tan = route.getTangent(t),
    w = 3.8;
  for (const s of [-1, 1]) {
    const x = p.x + s * tan.z * w,
      z = p.z - s * tan.x * w;
    rp.push(x, south(x, z) + 0.28, z);
    ru.push(s < 0 ? 0 : 1, t * 15);
  }
  if (i < steps) {
    const a = i * 2;
    ri.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
}
const roadGeo = new THREE.BufferGeometry();
roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3));
roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(ru, 2));
roadGeo.setIndex(ri);
roadGeo.computeVertexNormals();
const road = new THREE.Mesh(roadGeo, roadMat);
road.receiveShadow = true;
scene.add(road);
function softTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d"),
    q = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  q.addColorStop(0, "#ffffffb0");
  q.addColorStop(0.45, "#ffffff55");
  q.addColorStop(1, "#ffffff00");
  g.fillStyle = q;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const mist = [],
  soft = softTexture(),
  r = rng(301);
for (let i = 0; i < 22; i++) {
  const m = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: soft,
      color: 0xc3c8ba,
      transparent: true,
      opacity: 0.08 + r() * 0.08,
      depthWrite: false,
    }),
  );
  m.position.set((r() - 0.5) * 1100, 8 + r() * 45, -60 - r() * 240);
  m.scale.set(100 + r() * 180, 22 + r() * 35, 1);
  m.userData.x = m.position.x;
  m.userData.p = r() * 6.28;
  scene.add(m);
  mist.push(m);
}
const sprayN = 700,
  sp = new Float32Array(sprayN * 3);
for (let i = 0; i < sprayN; i++) {
  sp[i * 3] = (r() - 0.5) * 1300;
  sp[i * 3 + 1] = 2 + r() * 3;
  sp[i * 3 + 2] = i % 2 ? 20 + r() * 5 : -96 - r() * 5;
}
const sprayGeo = new THREE.BufferGeometry();
sprayGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
const sprayMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: { uTime: { value: 0 } },
  vertexShader: `uniform float uTime;varying float vA;void main(){vec3 p=position;p.y+=abs(sin(uTime*2.+position.x*.13))*3.;vA=.25+.45*abs(sin(uTime*1.7+position.x));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(80./-mv.z,1.,4.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `precision highp float;varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.85,.85,.75,vA*(1.-d*2.));}`,
});
scene.add(new THREE.Points(sprayGeo, sprayMat));
