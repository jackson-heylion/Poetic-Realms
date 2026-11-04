const groundTex = texture("ground");
groundTex.repeat.set(34, 16);
groundTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  map: groundTex,
  bumpMap: groundTex,
  bumpScale: 1.1,
  roughness: 0.98,
});
function terrain(w, d, sx, sz, cz, height) {
  const geo = new THREE.PlaneGeometry(w, d, sx, sz);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position,
    colors = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      localZ = p.getZ(i),
      z = localZ + cz,
      y = height(x, z);
    p.setXYZ(i, x, y, localZ);
    const slope =
        Math.abs(height(x + 3, z) - y) + Math.abs(height(x, z + 3) - y),
      rock = clamp(slope / 24 + y / 650, 0, 1),
      c = new THREE.Color().setRGB(
        lerp(0.25, 0.43, rock),
        lerp(0.28, 0.43, rock),
        lerp(0.24, 0.38, rock),
      );
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, terrainMat);
  m.position.z = cz;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
terrain(1450, 650, 220, 110, -425, north);
terrain(1450, 540, 220, 90, 295, south);
const waterMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: `uniform float uTime;varying vec3 vW;varying float vC;float w(vec2 p){vec2 q=p+vec2(sin(p.y*.07)*9.,sin(p.x*.045)*7.);return sin(q.x*.105+uTime*1.65)*1.5+sin(q.y*.24-q.x*.045+uTime*2.2)*.85+sin(q.x*.31+q.y*.18-uTime*2.8)*.42+sin(q.y*.62+uTime*3.4)*.22;}void main(){vec4 p=modelMatrix*vec4(position,1.);float a=w(p.xz);p.y+=a;vC=a;vW=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader: `precision highp float;uniform float uTime;varying vec3 vW;varying float vC;void main(){vec3 N=normalize(cross(dFdx(vW),dFdy(vW)));if(N.y<0.)N=-N;vec3 V=normalize(cameraPosition-vW),L=normalize(vec3(-.6,.55,.45));float fres=pow(1.-max(dot(N,V),0.),4.);float spec=pow(max(dot(reflect(-L,N),V),0.),90.);float foam=smoothstep(1.95,2.65,vC+sin(vW.x*1.3+sin(vW.z*.9))*sin(vW.z*1.7-uTime*3.)*.38);vec3 col=mix(vec3(.055,.075,.052),vec3(.20,.24,.20),fres);col+=vec3(1.,.75,.4)*spec*.8;col=mix(col,vec3(.68,.70,.61),foam*.5);float dist=length(cameraPosition-vW);col=mix(col,vec3(.66,.68,.62),smoothstep(500.,1400.,dist));gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,
});
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(1500, 132, 240, 48),
  waterMat,
);
water.rotation.x = -Math.PI / 2;
water.position.set(0, 1, -37);
scene.add(water);
