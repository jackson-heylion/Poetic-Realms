/* 旌旗与主帐布边：为连营和近景提供柔软织物的层次。 */
const bannerPositions = mobile
  ? [
      [-4.9, -5.5],
      [6.9, -18],
    ]
  : [
      [-4.9, -5.5],
      [6.9, -13],
      [-9.4, -23],
      [3.0, -31],
    ];
for (let i = 0; i < bannerPositions.length; i++) {
  const [x, z] = bannerPositions[i],
    base = groundHeight(x, z),
    height = 5.1 + i * 0.3;
  segment([x, base, z], [x, base + height, z], 0.038, wood);
  segment(
    [x - 0.08, base + height - 0.1, z],
    [x + 1.2, base + height - 0.1, z],
    0.022,
    wood,
  );
  const material = new THREE.MeshPhongMaterial({
    map: clothMap,
    color: 0x8c392a,
    shininess: 0,
    specular: 0x101010,
    side: THREE.DoubleSide,
    bumpMap: clothMap,
    bumpScale: 0.04,
    emissive: 0x180604,
    emissiveIntensity: 0.3,
  });
  const clock = { value: 0 };
  flagTimes.push(clock);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFlagTime = clock;
    shader.vertexShader = "uniform float uFlagTime;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      transformed.z += sin(uv.y*7.0-uFlagTime*2.0+${i.toFixed(1)})*.14*uv.x;
      transformed.x += sin(uv.y*10.0-uFlagTime*1.4)*.045*uv.x;`,
    );
  };
  const flag = mesh(new THREE.PlaneGeometry(0.95, 2.1, 8, 15), material, [
    x + 0.47,
    base + height - 1.15,
    z + 0.02,
  ]);
  flag.rotation.z = -0.02;
}
// 主帐的布边为近景框景，柔软褶皱随纵向下垂，留出中央视线。
const nearCloth = new THREE.MeshPhongMaterial({
  map: clothMap,
  color: 0x302a22,
  shininess: 0,
  specular: 0x101010,
  side: THREE.DoubleSide,
  bumpMap: clothMap,
  bumpScale: 0.055,
});
for (const side of [-1, 1]) {
  const geometry = new THREE.PlaneGeometry(1.5, 4.2, 14, 20);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i);
    positions.setZ(i, Math.sin(x * 12) * 0.095 + Math.cos(y * 1.3) * 0.07);
    positions.setX(i, x + Math.pow((y + 2.1) / 4.2, 2) * side * 0.12);
  }
  geometry.computeVertexNormals();
  const drape = mesh(geometry, nearCloth, [side * 4.05, 2.05, 4.4]);
  drape.rotation.y = side * 0.2;
  drape.castShadow = true;
  segment([side * 3.6, 0, 4.0], [side * 3.6, 4.35, 4.0], 0.062, wood);
}
