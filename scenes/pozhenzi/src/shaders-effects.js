/* ------------------------------------------------------ 旌旗程序 */
var progCloth = makeProgram(
  "precision highp float;\n" +
    "attribute vec3 aPos;\n" +
    "attribute vec3 aNrm;\n" +
    "attribute vec3 aCol;\n" +
    "attribute vec2 aUv;\n" +
    "attribute vec3 aInfo;\n" +
    "uniform mat4 uViewProj;\n" +
    "uniform mat4 uModel;\n" +
    "uniform float uTime;\n" +
    "varying vec3 vWorld;\n" +
    "varying vec3 vNrm;\n" +
    "varying vec3 vCol;\n" +
    "varying vec2 vUv;\n" +
    "void main(){\n" +
    "  vec3 p = aPos;\n" +
    "  float att = aInfo.z;\n" +
    "  float ph = aInfo.y;\n" +
    "  float amp = aInfo.x;\n" +
    "  float gust = 0.72+0.28*sin(uTime*0.55+ph*0.7);\n" +
    "  p.z += sin(p.y*2.15 - uTime*2.35 + ph)*amp*att*gust;\n" +
    "  p.x += cos(p.y*1.55 - uTime*1.75 + ph*1.3)*amp*0.42*att*gust;\n" +
    "  vec4 wp = uModel*vec4(p,1.0);\n" +
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
    "uniform vec4 uLPos[4];\n" +
    "uniform vec3 uLCol[4];\n" +
    "uniform float uLInt[4];\n" +
    GLSL_NOISE +
    "\n" +
    GLSL_TONE +
    "\n" +
    "void main(){\n" +
    "  vec3 N = normalize(vNrm);\n" +
    "  if (!gl_FrontFacing) N = -N;\n" +
    "  vec3 V = normalize(uCamPos - vWorld);\n" +
    "  float ndl = max(dot(N,uMoonDir),0.0);\n" +
    "  vec3 diff = mix(uAmbGround,uAmbSky,0.5+0.5*N.y)*1.15 + uMoonCol*ndl;\n" +
    "  for (int i=0;i<4;i++){\n" +
    "    vec3 L = uLPos[i].xyz - vWorld;\n" +
    "    float d2 = dot(L,L);\n" +
    "    float rad = max(uLPos[i].w,0.001);\n" +
    "    float att = 1.0/(1.0+d2/(rad*rad));\n" +
    "    float nl = max(dot(N, L*inversesqrt(d2+1e-4)), 0.0);\n" +
    "    diff += uLCol[i]*uLInt[i]*att*(nl*0.75+0.25)*1.15;\n" +
    "  }\n" +
    "  vec3 col = vCol*diff;\n" +
    "  float weave = vnoise(vUv*vec2(120.0,90.0))*0.12+0.94;\n" +
    "  col *= weave;\n" +
    "  col *= 0.86+0.14*smoothstep(0.0,0.35,vUv.x);\n" +
    "  float d = length(vWorld-uCamPos);\n" +
    "  float fog = 1.0-exp(-d*uFogK*1.05);\n" +
    "  col = mix(col, uFogColor, clamp(fog,0.0,1.0));\n" +
    "  gl_FragColor = vec4(grade(col*uExposure), 1.0);\n" +
    "}",
  "cloth",
);

/* ------------------------------------------------------ 草叶程序 */
var progGrass = makeProgram(
  "precision highp float;\n" +
    "attribute vec3 aPos;\n" +
    "attribute vec2 aLocal;\n" +
    "attribute vec3 aSeed;\n" +
    "uniform mat4 uViewProj;\n" +
    "uniform float uTime;\n" +
    "varying vec2 vLocal;\n" +
    "varying vec3 vWorld;\n" +
    "varying vec3 vCol;\n" +
    "void main(){\n" +
    "  float ang = aSeed.z;\n" +
    "  vec3 right = vec3(cos(ang),0.0,sin(ang));\n" +
    "  float h = aSeed.x;\n" +
    "  vec3 p = aPos + right*(aLocal.x*0.060*(1.0-0.55*aLocal.y)) + vec3(0.0,aLocal.y*h,0.0);\n" +
    "  float sway = sin(uTime*1.55 + aSeed.y*6.283 + aPos.x*0.42)*0.085*(aLocal.y*aLocal.y);\n" +
    "  p.x += sway; p.z += sway*0.55;\n" +
    "  vLocal = aLocal;\n" +
    "  vWorld = p;\n" +
    "  vCol = vec3(0.062,0.070,0.040)*(0.65+0.55*aLocal.y);\n" +
    "  gl_Position = uViewProj*vec4(p,1.0);\n" +
    "}",

  "precision highp float;\n" +
    "varying vec2 vLocal;\n" +
    "varying vec3 vWorld;\n" +
    "varying vec3 vCol;\n" +
    "uniform vec3 uCamPos;\n" +
    "uniform vec3 uLampPos;\n" +
    "uniform vec3 uLampCol;\n" +
    "uniform vec3 uAmbSky;\n" +
    "uniform vec3 uFogColor;\n" +
    "uniform float uFogK;\n" +
    "uniform float uExposure;\n" +
    GLSL_TONE +
    "\n" +
    "void main(){\n" +
    "  float w = mix(1.0, 0.06, clamp(vLocal.y,0.0,1.0));\n" +
    "  float a = smoothstep(w, w*0.55, abs(vLocal.x));\n" +
    "  a *= smoothstep(0.0,0.10,vLocal.y);\n" +
    "  if (a < 0.02) discard;\n" +
    "  vec3 L = uLampPos - vWorld;\n" +
    "  float d2 = dot(L,L);\n" +
    "  float att = 1.0/(1.0+d2/20.0);\n" +
    "  float nl = max(dot(normalize(vec3(vLocal.x,0.55,0.0)), L*inversesqrt(d2+1e-4)), 0.0);\n" +
    "  vec3 col = vCol*(uAmbSky*1.6 + uLampCol*att*(nl*1.3+0.25));\n" +
    "  float d = length(vWorld-uCamPos);\n" +
    "  col = mix(col, uFogColor, clamp(1.0-exp(-d*uFogK*1.2),0.0,1.0));\n" +
    "  gl_FragColor = vec4(grade(col*uExposure), a*0.92);\n" +
    "}",
  "grass",
);

/* ------------------------------------------------------ 精灵程序 */
var progSprite = makeProgram(
  "precision highp float;\n" +
    "attribute vec3 aCenter;\n" +
    "attribute vec2 aLocal;\n" +
    "attribute vec3 aCol;\n" +
    "attribute vec4 aInfo;\n" +
    "uniform mat4 uViewProj;\n" +
    "uniform vec3 uCamRight;\n" +
    "uniform vec3 uCamUp;\n" +
    "uniform float uFlat;\n" +
    "uniform float uTime;\n" +
    "varying vec2 vUv;\n" +
    "varying vec3 vCol;\n" +
    "varying vec4 vInfo;\n" +
    "varying vec3 vWorld;\n" +
    "void main(){\n" +
    "  vec3 c = aCenter;\n" +
    "  float sz = aInfo.x;\n" +
    "  if (aInfo.w > 1.5 && aInfo.w < 3.5){\n" +
    "    float life = fract(uTime*0.26 + aInfo.z);\n" +
    "    if (aInfo.w < 2.5){\n" +
    "      life = fract(aInfo.z*7.3 + uTime*0.045);\n" +
    "      c.y += life*5.2; c.x += life*0.55; sz *= 0.70+life*1.9;\n" +
    "    } else {\n" +
    "      c.y += life*3.6; c.x += sin(uTime*0.9+aInfo.z*21.0)*0.30*life;\n" +
    "      sz *= 1.0-0.55*life;\n" +
    "    }\n" +
    "  }\n" +
    "  vec3 right = uCamRight;\n" +
    "  vec3 up = uCamUp;\n" +
    "  if (uFlat > 0.5){ right = vec3(1.0,0.0,0.0); up = vec3(0.0,0.0,1.0); c.y += 0.015; }\n" +
    "  vec2 l = aLocal;\n" +
    "  float s = sin(aInfo.y), co = cos(aInfo.y);\n" +
    "  l = vec2(l.x*co-l.y*s, l.x*s+l.y*co);\n" +
    "  vec3 wp = c + right*(l.x*sz) + up*(l.y*sz);\n" +
    "  vUv = aLocal;\n" +
    "  vCol = aCol;\n" +
    "  vInfo = aInfo;\n" +
    "  vWorld = wp;\n" +
    "  gl_Position = uViewProj*vec4(wp,1.0);\n" +
    "}",

  "precision highp float;\n" +
    "varying vec2 vUv;\n" +
    "varying vec3 vCol;\n" +
    "varying vec4 vInfo;\n" +
    "varying vec3 vWorld;\n" +
    "uniform float uKind;\n" +
    "uniform float uTime;\n" +
    "uniform float uAlpha;\n" +
    "uniform vec3 uFogColor;\n" +
    "uniform vec3 uCamPos;\n" +
    "uniform float uFogK;\n" +
    GLSL_NOISE +
    "\n" +
    "void main(){\n" +
    "  float a = 0.0;\n" +
    "  vec3 col = vCol;\n" +
    "  float d = length(vUv);\n" +
    "  if (uKind < 0.5){\n" +
    "    a = pow(max(0.0,1.0-d), 2.6);\n" +
    "    a *= 0.85+0.15*sin(uTime*9.0+vInfo.z*7.0);\n" +
    "  } else if (uKind < 1.5){\n" +
    "    float y = vUv.y*0.5+0.5;\n" +
    "    float n = fbm3(vec2(vUv.x*3.6, vUv.y*2.4-uTime*1.9+vInfo.z*9.0));\n" +
    "    float wdt = (1.0-y)*0.86+0.10;\n" +
    "    float body = smoothstep(wdt, wdt*0.28, abs(vUv.x+(n-0.5)*0.34*(1.0-y)));\n" +
    "    body *= smoothstep(0.0,0.14,y)*smoothstep(1.0,0.52,y);\n" +
    "    col = mix(vec3(1.0,0.34,0.07), vec3(1.0,0.78,0.38), pow(1.0-y,1.5));\n" +
    "    col = mix(col, vec3(1.0,0.96,0.82), pow(1.0-y,7.0)*0.85);\n" +
    "    a = body*(0.55+0.55*n);\n" +
    "  } else if (uKind < 2.5){\n" +
    "    float n = fbm3(vUv*1.7+vec2(vInfo.z*3.0, -uTime*0.16));\n" +
    "    float lifeS = fract(vInfo.z*7.3 + uTime*0.045);\n" +
    "    a = smoothstep(1.0,0.05,d)*(0.28+0.62*n)*smoothstep(1.0,0.35,d);\n" +
    "    a *= (1.0-lifeS*0.85)*smoothstep(0.0,0.12,lifeS);\n" +
    "    col = mix(vec3(0.10,0.11,0.125), vec3(0.30,0.27,0.24), n*0.7);\n" +
    "  } else if (uKind < 3.5){\n" +
    "    float lifeE = fract(uTime*0.26 + vInfo.z);\n" +
    "    a = smoothstep(0.62,0.0,d);\n" +
    "    a *= (0.55+0.45*sin(uTime*6.0+vInfo.z*20.0))*(1.0-lifeE*0.75);\n" +
    "  } else if (uKind < 4.5){\n" +
    "    a = pow(max(0.0,1.0-d), 1.7)*0.55;\n" +
    "    col = vec3(0.012,0.012,0.014);\n" +
    "  } else {\n" +
    "    col = vCol*(exp(-d*11.0)*1.5+exp(-d*2.6)*0.22);\n" +
    "    a = 1.0;\n" +
    "  }\n" +
    "  if (uKind > 2.5 && uKind < 4.5){\n" +
    "    float fog = 1.0-exp(-length(vWorld-uCamPos)*uFogK);\n" +
    "    col = mix(col, uFogColor, fog*0.5);\n" +
    "  }\n" +
    "  if (a <= 0.004) discard;\n" +
    "  gl_FragColor = vec4(col, a*uAlpha);\n" +
    "}",
  "sprite",
);
