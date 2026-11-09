/* 水面使用三维波动网格、场景平面反射、菲涅耳项与日光高光。 */
function buildWater() {
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: windTime,
      uSun: { value: sunDirection },
      uReflection: { value: null },
      uReflectionMatrix: { value: reflectionMatrix },
      uFog: { value: scene.fog.color },
      uTexel: { value: new THREE.Vector2(1/512,1/512) },
    },
    vertexShader: `
precision highp float;
uniform highp float uTime;
uniform highp mat4 uReflectionMatrix;
varying vec3 vWorld;
varying vec4 vReflection;
float wave(vec2 p) {
  return sin(dot(p,vec2(0.72,0.43))+uTime*0.83)*0.035+
    sin(dot(p,vec2(-1.21,0.64))-uTime*0.64)*0.018+
    sin(dot(p,vec2(2.46,1.32))+uTime*1.15)*0.009;
}
void main() {
  vec4 world = modelMatrix * vec4(position,1.0);
  world.y += wave(world.xz);
  vWorld = world.xyz;
  vReflection = uReflectionMatrix*vec4(world.x,0.0,world.z,1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}`,
    fragmentShader: `
precision highp float;
uniform highp float uTime;
uniform highp vec3 uSun;
uniform highp vec3 uFog;
uniform highp vec2 uTexel;
uniform sampler2D uReflection;
varying vec3 vWorld;
varying vec4 vReflection;
` + glslNoise + `
void main() {
  vec2 p = vWorld.xz;
  vec2 gradient = cos(dot(p,vec2(0.72,0.43))+uTime*0.83)*vec2(0.72,0.43)*0.035;
  gradient += cos(dot(p,vec2(-1.21,0.64))-uTime*0.64)*vec2(-1.21,0.64)*0.018;
  gradient += cos(dot(p,vec2(2.46,1.32))+uTime*1.15)*vec2(2.46,1.32)*0.009;
  float distanceToEye = length(cameraPosition-vWorld);
  float micro = noise21(p*9.0+vec2(uTime*0.18,-uTime*0.22));
  gradient += vec2(sin(p.x*19.0+uTime),cos(p.y*21.0-uTime))*0.004;
  gradient *= mix(1.0,0.34,smoothstep(10.0,240.0,distanceToEye));
  vec3 normal = normalize(vec3(-gradient.x,1.0,-gradient.y));
  vec3 viewDirection = normalize(cameraPosition-vWorld);
  float facing = max(dot(normal,viewDirection),0.0);
  float fresnel = 0.025+0.975*pow(1.0-facing,5.0);
  vec2 uv = vReflection.xy/vReflection.w;
  uv += gradient*mix(0.022,0.003,smoothstep(8.0,150.0,distanceToEye));
  uv=clamp(uv,0.005,0.995);
  vec2 soften=uTexel*1.1;
  vec3 reflected=texture2D(uReflection,uv).rgb*0.4;
  reflected+=texture2D(uReflection,uv+vec2(soften.x,soften.y)).rgb*0.15;
  reflected+=texture2D(uReflection,uv+vec2(-soften.x,soften.y)).rgb*0.15;
  reflected+=texture2D(uReflection,uv+vec2(soften.x,-soften.y)).rgb*0.15;
  reflected+=texture2D(uReflection,uv-soften).rgb*0.15;
  float leftEdge = -1.8+0.15*p.y+1.3*sin(p.y*0.07)+0.13*sin(p.y*1.4)+0.04*sin(p.y*7.0);
  float depth = smoothstep(leftEdge,leftEdge+5.0,p.x);
  vec3 shallows = vec3(0.045,0.23,0.115)*(0.83+fbm21(p*1.2)*0.3);
  vec3 river = mix(shallows,vec3(0.008,0.19,0.115),depth);
  river *= 0.88+noise21(p*0.11+uTime*0.012)*0.19;
  vec3 color = mix(river,reflected,clamp(0.075+fresnel*0.64,0.0,0.88));
  vec3 halfVector = normalize(viewDirection+uSun);
  float specular = pow(max(dot(normal,halfVector),0.0),420.0);
  float gleam = pow(max(dot(normal,halfVector),0.0),85.0);
  color += vec3(5.5,2.65,0.65)*specular*(0.2+micro*1.2);
  color += vec3(0.4,0.22,0.05)*gleam;
  float fog = 1.0-exp(-distanceToEye*distanceToEye*0.000007);
  color = mix(color,uFog,min(0.75,fog));
  gl_FragColor = vec4(color,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const geometry = new THREE.PlaneGeometry(700,1000,160,240);
  geometry.rotateX(-Math.PI/2);
  water = mesh(geometry,waterMaterial,0,0,-380);
  water.renderOrder = 1;
}
