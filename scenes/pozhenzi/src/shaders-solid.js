/* ------------------------------------------------------ 实体着色程序 */
var progSolid = makeProgram(
  "precision highp float;\n" +
    "attribute vec3 aPos;\n" +
    "attribute vec3 aNrm;\n" +
    "attribute vec3 aCol;\n" +
    "attribute vec2 aUv;\n" +
    "uniform mat4 uViewProj;\n" +
    "uniform mat4 uModel;\n" +
    "varying vec3 vWorld;\n" +
    "varying vec3 vNrm;\n" +
    "varying vec3 vCol;\n" +
    "varying vec2 vUv;\n" +
    "void main(){\n" +
    "  vec4 wp = uModel*vec4(aPos,1.0);\n" +
    "  vWorld = wp.xyz;\n" +
    "  vNrm = normalize(mat3(uModel)*aNrm);\n" +
    "  vCol = aCol;\n" +
    "  vUv = aUv;\n" +
    "  gl_Position = uViewProj*wp;\n" +
    "}",

  "precision highp float;\n" +
    "varying vec3 vWorld;\n" +
    "varying vec3 vNrm;\n" +
    "varying vec3 vCol;\n" +
    "varying vec2 vUv;\n" +
    "uniform vec3 uCamPos;\n" +
    "uniform vec3 uMoonDir;\n" +
    "uniform vec3 uMoonCol;\n" +
    "uniform vec3 uAmbSky;\n" +
    "uniform vec3 uAmbGround;\n" +
    "uniform vec3 uFogColor;\n" +
    "uniform float uFogK;\n" +
    "uniform float uExposure;\n" +
    "uniform float uSpec;\n" +
    "uniform float uShine;\n" +
    "uniform float uEmissive;\n" +
    "uniform float uGrain;\n" +
    "uniform float uTime;\n" +
    "uniform vec4 uLPos[4];\n" +
    "uniform vec3 uLCol[4];\n" +
    "uniform float uLInt[4];\n" +
    GLSL_NOISE +
    "\n" +
    GLSL_TONE +
    "\n" +
    "void main(){\n" +
    "  vec3 N = normalize(vNrm);\n" +
    "  vec3 V = normalize(uCamPos - vWorld);\n" +
    "  vec3 albedo = vCol;\n" +
    "  if (uEmissive > 0.5){\n" +
    "    float g = 0.55+0.45*vUv.y;\n" +
    "    gl_FragColor = vec4(albedo*g*1.5, 1.0);\n" +
    "    return;\n" +
    "  }\n" +
    "  float ndlMoon = max(dot(N, uMoonDir), 0.0);\n" +
    "  vec3 amb = mix(uAmbGround, uAmbSky, 0.5+0.5*N.y);\n" +
    "  vec3 diff = amb + uMoonCol*ndlMoon;\n" +
    "  vec3 specC = vec3(0.0);\n" +
    "  for (int i=0;i<4;i++){\n" +
    "    vec3 L = uLPos[i].xyz - vWorld;\n" +
    "    float d2 = dot(L,L);\n" +
    "    float rad = max(uLPos[i].w, 0.001);\n" +
    "    float att = 1.0/(1.0 + d2/(rad*rad));\n" +
    "    vec3 ldir = L*inversesqrt(d2+1e-4);\n" +
    "    float ndl = max(dot(N,ldir), 0.0);\n" +
    "    diff += uLCol[i]*uLInt[i]*att*(ndl*0.82+0.18);\n" +
    "    vec3 H = normalize(ldir+V);\n" +
    "    specC += uLCol[i]*uLInt[i]*att*pow(max(dot(N,H),0.0), uShine);\n" +
    "  }\n" +
    "  vec3 col = albedo*diff + specC*uSpec;\n" +
    "  if (uSpec > 0.3){\n" +
    "    vec3 R = reflect(-V,N);\n" +
    "    vec3 env = mix(uAmbGround*2.2, uAmbSky*2.6, smoothstep(-0.5,0.8,R.y));\n" +
    "    float fres = pow(1.0-max(dot(N,V),0.0),3.0);\n" +
    "    col += env*(0.18+0.82*fres)*uSpec*1.1;\n" +
    "    col += uMoonCol*pow(max(dot(R,uMoonDir),0.0), 220.0)*2.6*uSpec;\n" +
    "  }\n" +
    "  float d = length(vWorld-uCamPos);\n" +
    "  float low = exp(-max(vWorld.y,0.0)*0.35);\n" +
    "  float fog = 1.0-exp(-d*uFogK*(0.55+0.65*low));\n" +
    "  col = mix(col, uFogColor, clamp(fog,0.0,1.0));\n" +
    "  gl_FragColor = vec4(grade(col*uExposure), 1.0);\n" +
    "}",
  "solid",
);
