/* ------------------------------------------------------- 相机与状态 */
var qLevels = [
  // 桌面低档允许低于原生分辨率，避免 DPR=1 时自动降档没有实际效果。
  { dp: isSmall ? 1.0 : 0.8, n: "流畅" },
  { dp: 1.35, n: "标准" },
  { dp: 1.9, n: "精细" },
];
var qIndex = isSmall ? 0 : 1;
var running = true,
  timeS = 0,
  pointerX = 0,
  pointerY = 0,
  tgtX = 0,
  tgtY = 0;
var dreaming = false,
  dreamBlend = 0,
  visible = true,
  needsRender = true;
var reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
if (reducedMotion) running = false;

function resize() {
  var dpr = Math.min(window.devicePixelRatio || 1, qLevels[qIndex].dp);
  var w = Math.max(1, Math.floor(window.innerWidth * dpr));
  var h = Math.max(1, Math.floor(window.innerHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    needsRender = true;
  }
}
resize();
window.addEventListener("resize", resize, false);

window.addEventListener(
  "pointermove",
  function (e) {
    var r = canvas.getBoundingClientRect();
    tgtX = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    tgtY = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    needsRender = true;
  },
  { passive: true },
);
window.addEventListener("pointerleave", function () {
  tgtX = 0;
  tgtY = 0;
});

/* ------------------------------------------------------- 渲染 */
var vp = new Float32Array(16),
  viewM = new Float32Array(16),
  projM = new Float32Array(16);
var eye = [0, 1.42, 8.4],
  target = [-0.4, 1.18, -16];

function drawSolid(prog, mesh, model, opt) {
  gl.uniformMatrix4fv(prog.u.uModel, false, model);
  if (opt) {
    if (opt.spec !== undefined) gl.uniform1f(prog.u.uSpec, opt.spec);
    if (opt.shine !== undefined) gl.uniform1f(prog.u.uShine, opt.shine);
    if (opt.emissive !== undefined)
      gl.uniform1f(prog.u.uEmissive, opt.emissive);
  }
  drawMesh(prog, mesh);
}

function render(t) {
  drawCallCount = 0;
  resize();
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.02, 0.028, 0.045, 1);
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  pointerX = lerp(pointerX, tgtX, 0.045);
  pointerY = lerp(pointerY, tgtY, 0.045);
  var drift = Math.sin(t * 0.075) * 0.55;
  var driftY = Math.sin(t * 0.061 + 1.2) * 0.1;

  dreamBlend = reducedMotion
    ? Number(dreaming)
    : lerp(dreamBlend, Number(dreaming), 0.045);
  var portrait = canvas.width / canvas.height < 1;
  eye[0] = lerp(portrait ? -1.42 : 0.02, 0.4, dreamBlend) + pointerX * 0.65;
  eye[1] = lerp(1.42, 2.6, dreamBlend) - pointerY * 0.22 + driftY * 0.4;
  eye[2] = lerp(portrait ? 9.5 : 8.4, 1.5, dreamBlend);
  target[0] =
    lerp(portrait ? -1.42 : -0.45, 0.4, dreamBlend) + pointerX * 2.4 + drift;
  target[1] = lerp(1.18, 1.7, dreamBlend) - pointerY * 0.9 + driftY;
  target[2] = -16;

  var b = basisFrom(eye, target);
  viewM.set(m4lookAt(eye, target, [0, 1, 0]));
  var aspect = canvas.width / canvas.height;
  var fov = portrait ? 65 : 44;
  projM.set(m4perspective(fov * DEG, aspect, 0.06, 620));
  m4mul(vp, projM, viewM);
  var tanY = Math.tan(fov * 0.5 * DEG);

  var camRight = [viewM[0], viewM[4], viewM[8]];
  var camUp = [viewM[1], viewM[5], viewM[9]];
  var camFwd = [-viewM[2], -viewM[6], -viewM[10]];

  var flick = updateLights(t);

  /* 天空 */
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  bind(progSky);
  setU(progSky, BASE);
  setU(progSky, {
    uRight: camRight,
    uUp: camUp,
    uFwd: camFwd,
    uTan: [tanY * aspect, tanY],
    uTime: t,
  });
  drawMesh(progSky, skyMesh);

  /* 山与地 */
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  bind(progSolid);
  setU(progSolid, BASE);
  setU(progSolid, { uViewProj: vp, uCamPos: eye, uTime: t });
  setLights(progSolid);
  drawSolid(progSolid, mountainMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0,
    shine: 8,
    emissive: 0,
  });
  drawSolid(progSolid, terrainMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0.04,
    shine: 12,
    emissive: 0,
  });

  /* 地面暗影 */
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  bind(progSprite);
  setU(progSprite, {
    uViewProj: vp,
    uCamRight: camRight,
    uCamUp: camUp,
    uTime: t,
    uKind: 4,
    uAlpha: 0.55,
    uFlat: 1,
    uFogColor: BASE.uFogColor,
    uCamPos: eye,
    uFogK: BASE.uFogK,
  });
  drawSprites(progSprite, shadowB);

  /* 火光在地面的暖晕 */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  setU(progSprite, { uKind: 0, uAlpha: 0.42, uFlat: 1 });
  drawSprites(progSprite, groundGlowB);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /* 营地 */
  gl.disable(gl.BLEND);
  gl.depthMask(true);
  bind(progSolid);
  setU(progSolid, { uViewProj: vp, uCamPos: eye, uTime: t });
  setLights(progSolid);
  drawSolid(progSolid, campMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0.05,
    shine: 10,
    emissive: 0,
  });
  drawSolid(progSolid, propMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0.34,
    shine: 26,
    emissive: 0,
  });

  /* 剑 */
  drawSolid(progSolid, swordMesh, m4model(0, 0, 0, 0, 1), {
    spec: 1.0,
    shine: 74,
    emissive: 0,
  });

  /* 帐内灯光 */
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  bind(progSolid);
  setU(progSolid, { uViewProj: vp, uCamPos: eye, uTime: t });
  drawSolid(progSolid, mouthMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0,
    shine: 8,
    emissive: 1,
  });

  /* 旌旗（双面） */
  gl.disable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  bind(progCloth);
  setU(progCloth, BASE);
  setU(progCloth, {
    uViewProj: vp,
    uModel: m4model(0, 0, 0, 0, 1),
    uCamPos: eye,
    uTime: t,
  });
  setLights(progCloth);
  drawMesh(progCloth, clothMesh);
  bind(progSolid);
  setU(progSolid, { uViewProj: vp, uCamPos: eye, uTime: t });
  setLights(progSolid);
  drawSolid(progSolid, poleMesh, m4model(0, 0, 0, 0, 1), {
    spec: 0.2,
    shine: 18,
    emissive: 0,
  });

  /* 草 */
  gl.enable(gl.BLEND);
  bind(progGrass);
  setU(progGrass, BASE);
  setU(progGrass, { uViewProj: vp, uCamPos: eye, uTime: t });
  drawMesh(progGrass, grassMesh);

  /* 烟雾 */
  gl.depthMask(false);
  bind(progSprite);
  setU(progSprite, {
    uViewProj: vp,
    uCamRight: camRight,
    uCamUp: camUp,
    uTime: t,
    uKind: 2,
    uAlpha: 0.3,
    uFlat: 0,
    uFogColor: BASE.uFogColor,
    uCamPos: eye,
    uFogK: BASE.uFogK,
  });
  drawSprites(progSprite, smokeB);

  /* 火焰与光晕 */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  setU(progSprite, { uKind: 0, uAlpha: 0.85 });
  drawSprites(progSprite, glowB);
  setU(progSprite, { uKind: 1, uAlpha: 0.95 });
  drawSprites(progSprite, flameB);

  /* 火星 */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  setU(progSprite, { uKind: 3, uAlpha: 0.95 });
  drawSprites(progSprite, emberB);

  /* 远处连营灯火 */
  setU(progSprite, { uKind: 5, uAlpha: 0.75 });
  drawSprites(progSprite, farB);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
}
