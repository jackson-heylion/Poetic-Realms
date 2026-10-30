/* ---------------------------------------------------------- 共享 GLSL */
var GLSL_NOISE = [
  "float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }",
  "float vnoise(vec2 p){",
  "  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
  "  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), d=hash21(i+vec2(1.0,1.0));",
  "  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);",
  "}",
  "float fbm2(vec2 p){ float s=0.0,a=0.56; for(int i=0;i<2;i++){ s+=a*vnoise(p); p*=2.07; a*=0.5; } return s; }",
  "float fbm3(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<3;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }",
  "float fbm4(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.05; a*=0.5; } return s; }",
].join("\n");

var GLSL_TONE = [
  "float lum(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }",
  "vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }",
  "vec3 grade(vec3 c){",
  "  c = aces(c);",
  "  c = pow(c, vec3(0.4545));",
  "  c = mix(c, c*vec3(0.92,1.00,1.12), 0.32*(1.0-lum(c)));",
  "  return c;",
  "}",
].join("\n");

/* ---------------------------------------------------------- 天空程序 */
var progSky = makeProgram(
  "precision highp float;\n" +
    "attribute vec3 aPos;\n" +
    "varying vec2 vUv;\n" +
    "void main(){ vUv = aPos.xy*0.5+0.5; gl_Position = vec4(aPos.xy, 0.0, 1.0); }",

  "precision highp float;\n" +
    "varying vec2 vUv;\n" +
    "uniform vec3 uRight;\n" +
    "uniform vec3 uUp;\n" +
    "uniform vec3 uFwd;\n" +
    "uniform vec2 uTan;\n" +
    "uniform float uTime;\n" +
    "uniform vec3 uZenith;\n" +
    "uniform vec3 uHorizon;\n" +
    "uniform vec3 uHaze;\n" +
    "uniform vec3 uMoonDir;\n" +
    "uniform vec3 uMoonCol;\n" +
    GLSL_NOISE +
    "\n" +
    GLSL_TONE +
    "\n" +
    "void main(){\n" +
    "  vec2 s = vUv*2.0-1.0;\n" +
    "  vec3 d = normalize(uFwd + uRight*(s.x*uTan.x) + uUp*(s.y*uTan.y));\n" +
    "  float h = d.y;\n" +
    "  vec3 col = mix(uHorizon, uZenith, pow(clamp(h,0.0,1.0),0.62));\n" +
    "  float az = max(dot(normalize(vec3(d.x,0.001,d.z)), vec3(0.0,0.0,-1.0)), 0.0);\n" +
    "  col += uHaze*pow(1.0-clamp(h,0.0,1.0),7.0)*(0.30+0.70*az);\n" +
    "  vec2 sp = vec2(atan(d.z,d.x)*57.2958, asin(clamp(h,-1.0,1.0))*57.2958);\n" +
    "  vec2 g = sp*1.62;\n" +
    "  vec2 gi = floor(g), gf = fract(g);\n" +
    "  float r = hash21(gi);\n" +
    "  float star = 0.0;\n" +
    "  if (r > 0.978 && h > 0.015){\n" +
    "    vec2 c = vec2(hash21(gi+1.73), hash21(gi+9.17))*0.72+0.14;\n" +
    "    float dd = length(gf-c);\n" +
    "    float tw = 0.55+0.45*sin(uTime*(0.7+r*2.4)+r*41.0);\n" +
    "    star = smoothstep(0.085,0.0,dd)*tw*(0.35+0.65*hash21(gi+3.31));\n" +
    "    star *= smoothstep(0.015,0.16,h);\n" +
    "  }\n" +
    "  float band = smoothstep(0.46,0.0,abs(d.y*0.9 - d.x*0.5 - 0.28));\n" +
    "  float mw = band*band*0.055*fbm3(d.xz*7.0+4.0);\n" +
    "  col += (star*1.35+mw)*vec3(0.80,0.86,1.0);\n" +
    "  float ang = acos(clamp(dot(d,uMoonDir),-1.0,1.0));\n" +
    "  float R = 0.0265;\n" +
    "  float disc = smoothstep(R, R*0.90, ang);\n" +
    "  float maria = fbm3(d.xy*210.0+13.0);\n" +
    "  float limb = smoothstep(R, R*0.55, ang);\n" +
    "  vec3 mc = uMoonCol*(0.62+0.46*maria)*(0.72+0.32*limb);\n" +
    "  col = mix(col, mc, disc);\n" +
    "  col += uMoonCol*smoothstep(0.24,0.0,ang)*0.075;\n" +
    "  float cy = max(h,0.022);\n" +
    "  vec2 cp = d.xz/cy*0.62 + vec2(uTime*0.0035, uTime*0.0016);\n" +
    "  float c1 = fbm4(cp*1.25);\n" +
    "  float c2 = fbm3(cp*4.1+7.0);\n" +
    "  float dens = smoothstep(0.50,0.84,c1*0.80+c2*0.30)*smoothstep(0.005,0.20,h);\n" +
    "  vec3 cloudCol = mix(vec3(0.030,0.038,0.055), uMoonCol*0.34, 0.30+0.55*smoothstep(0.15,0.9,dens));\n" +
    "  cloudCol += uHaze*0.16*smoothstep(0.25,0.0,h);\n" +
    "  col = mix(col, cloudCol, dens*0.62);\n" +
    "  gl_FragColor = vec4(grade(col), 1.0);\n" +
    "}",
  "sky",
);
