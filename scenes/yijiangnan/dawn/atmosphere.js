/* 晨空、定向光与远鸟；天空是三维球体，鸟翼采用实例几何。 */
const glslNoise = `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise21(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
    mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm21(vec2 p) {
  return noise21(p)*0.55+noise21(p*2.03+13.4)*0.28+
    noise21(p*4.11-7.6)*0.13+noise21(p*8.31)*0.04;
}`;

function buildAtmosphere() {
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uSun: { value: sunDirection }, uTime: windTime },
    vertexShader: `
precision highp float;
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`,
    fragmentShader: `
precision highp float;
uniform highp vec3 uSun;
uniform highp float uTime;
varying vec3 vWorld;
` + glslNoise + `
void main() {
  vec3 ray = normalize(vWorld-cameraPosition);
  float elevation = max(ray.y, 0.0);
  float sunFacing = max(dot(ray,uSun),0.0);
  vec3 horizon = mix(vec3(0.61,0.64,0.47),vec3(0.96,0.58,0.29),pow(sunFacing,12.0)*0.7);
  vec3 color = mix(horizon,vec3(0.20,0.40,0.48),smoothstep(0.015,0.38,elevation));
  color += vec3(0.50,0.23,0.065)*pow(sunFacing,32.0);
  color += vec3(0.26,0.09,0.015)*pow(sunFacing,7.0);
  float disk = smoothstep(cos(0.010),cos(0.0082),sunFacing);
  color += vec3(12.0,6.5,2.4)*disk;
  vec2 cloudUV = ray.xz / max(0.11,ray.y) * vec2(0.55,1.5);
  cloudUV.x += uTime*0.002;
  float clouds = smoothstep(0.47,0.72,fbm21(cloudUV+fbm21(cloudUV*0.6)));
  clouds *= smoothstep(0.03,0.19,ray.y)*(1.0-smoothstep(0.32,0.7,ray.y));
  clouds *= 0.52;
  color = mix(color,vec3(0.86,0.76,0.59),clouds);
  float haze = exp(-max(ray.y,0.0)*19.0);
  color = mix(color,horizon,haze*0.3);
  gl_FragColor = vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  sky = mesh(new THREE.SphereGeometry(1100, 32, 20), skyMaterial);
  sky.renderOrder = -10;
  const hemisphere = new THREE.HemisphereLight("#c3e0db", "#526048", 1.8);
  scene.add(hemisphere);
  sunlight = new THREE.DirectionalLight("#ffdfab", 3.15);
  sunlight.position.copy(sunDirection).multiplyScalar(100);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024,1024);
  sunlight.shadow.camera.left = -28;
  sunlight.shadow.camera.right = 28;
  sunlight.shadow.camera.top = 24;
  sunlight.shadow.camera.bottom = -22;
  sunlight.shadow.camera.near = .5;
  sunlight.shadow.camera.far = 180;
  sunlight.shadow.bias = -.0004;
  sunlight.shadow.normalBias = .045;
  scene.add(sunlight);
  buildBirds();
}

function buildBirds() {
  const wingGeometry = new THREE.BufferGeometry();
  wingGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0,0,0, .45,.08,-.02, 1.35,.04,.30,
    0,0,0, 1.35,.04,.30, .50,0,.24,
  ],3));
  wingGeometry.computeVertexNormals();
  const wingMaterial = new THREE.MeshBasicMaterial({ color: "#263d35", side: THREE.DoubleSide });
  const wings = new THREE.InstancedMesh(wingGeometry,wingMaterial,10);
  const bodies = new THREE.InstancedMesh(new THREE.SphereGeometry(.1,6,4),wingMaterial,5);
  wings.frustumCulled = false;
  bodies.frustumCulled = false;
  scene.add(wings,bodies);
  const birdTransform = new THREE.Object3D();
  frameUpdates.push((time) => {
    for (let i=0;i<5;i++) {
      const x = -28 + i*4.1 + Math.sin(time*.045+i*.23)*12;
      const y = 13 + Math.sin(time*.32+i)*.5 + i*.6;
      const z = -115-i*4.4;
      birdTransform.position.set(x,y,z);
      birdTransform.scale.set(1,1,2.4);
      birdTransform.rotation.set(0,.65,0);
      birdTransform.updateMatrix();
      bodies.setMatrixAt(i,birdTransform.matrix);
      for (let side=0;side<2;side++) {
        const direction = side===0 ? 1 : -1;
        birdTransform.scale.set(direction*.68,.68,.68);
        birdTransform.rotation.set(0,.65,Math.sin(time*4.4+i)*.52*direction);
        birdTransform.updateMatrix();
        wings.setMatrixAt(i*2+side,birdTransform.matrix);
      }
    }
    wings.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true;
  });
}
