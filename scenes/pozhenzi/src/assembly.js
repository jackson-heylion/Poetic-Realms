/* ------------------------------------------------------- 场景装配 */
var isSmall = Math.min(window.innerWidth, window.innerHeight) < 720;

var skyMesh = uploadMesh(
  { aPos: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0] },
  [0, 1, 2, 2, 1, 3],
);
var terrainMesh = buildTerrain();
var mountainMesh = buildMountains();
var campMesh = buildCamp();
var mouthMesh = uploadMesh(
  { aPos: tentMouth.p, aNrm: tentMouth.n, aCol: tentMouth.c, aUv: tentMouth.u },
  tentMouth.i,
);

/* 器物与剑 */
var TABLE_Y = groundH(-1.42, 4.02) + 0.6;
var LAMP_X = -2.08,
  LAMP_Z = 3.74,
  LAMP_Y = TABLE_Y;
var propM = Mesh();
addTable(propM, -1.42, 4.02, 0.16);
addJar(propM, -2.62, 4.62, 0.95);
addCup(propM, -1.6, TABLE_Y + 0.004, 4.26);
addOilLamp(propM, LAMP_X, LAMP_Y, LAMP_Z);
addSpearRack(propM, -5.3, -3.4, 0.35);
addSpearRack(propM, 4.6, -11.2, -0.22);
addHorn(propM, 5.0, -6.4, 0.55);
var propMesh = uploadMesh(
  { aPos: propM.p, aNrm: propM.n, aCol: propM.c, aUv: propM.u },
  propM.i,
);

var swordM = Mesh();
var SWORD_POS = [-1.1, TABLE_Y + 0.035, 4.18];
var SWORD_DIR = [-0.905, 0.17, -0.32];
var SWORD_M = m4axis(SWORD_POS, SWORD_DIR, [0, 1, 0], 1);
addSword(swordM, SWORD_M);
var swordMesh = uploadMesh(
  { aPos: swordM.p, aNrm: swordM.n, aCol: swordM.c, aUv: swordM.u },
  swordM.i,
);

buildBanners();
var clothMesh = uploadMesh(
  {
    aPos: clothM.p,
    aNrm: clothM.n,
    aCol: clothM.c,
    aUv: clothM.u,
    aInfo: clothM.info,
  },
  clothM.i,
);
var poleMesh = uploadMesh(
  { aPos: poleM.p, aNrm: poleM.n, aCol: poleM.c, aUv: poleM.u },
  poleM.i,
);
var grassMesh = buildGrass();

/* 灯火位置（灯芯） */
var LAMP = [LAMP_X, LAMP_Y + 0.128, LAMP_Z];
var FIRES = [
  { x: 4.3, z: -4.2, s: 1.0 },
  { x: -7.6, z: -10.6, s: 0.9 },
  { x: 8.2, z: -16.2, s: 0.85 },
  { x: -2.0, z: -22.0, s: 0.8 },
  { x: 14.0, z: -28.0, s: 0.7 },
  { x: -15.0, z: -30.5, s: 0.64 },
];
for (var fi = 0; fi < FIRES.length; fi++) {
  FIRES[fi].y = groundH(FIRES[fi].x, FIRES[fi].z) + 0.18;
}

/* 地面投影 */
var shadowB = SpriteBatch(96),
  groundGlowB = SpriteBatch(24);
for (var si = 0; si < FIRES.length; si++) {
  pushSprite(
    shadowB,
    FIRES[si].x,
    FIRES[si].y - 0.16,
    FIRES[si].z,
    1.5,
    0,
    0.1,
    4,
    [0.02, 0.02, 0.02],
  );
  pushSprite(
    groundGlowB,
    FIRES[si].x,
    FIRES[si].y - 0.16,
    FIRES[si].z,
    2.6 * FIRES[si].s,
    0,
    0.1,
    0,
    [1.0, 0.4, 0.13],
  );
}
pushSprite(
  groundGlowB,
  LAMP[0],
  LAMP[1] - 0.12,
  LAMP[2],
  1.55,
  0,
  0.4,
  0,
  [1.0, 0.52, 0.2],
);
pushSprite(
  shadowB,
  -1.42,
  groundH(-1.42, 4.02) + 0.012,
  4.02,
  1.2,
  0,
  0.2,
  4,
  [0.02, 0.02, 0.02],
);
for (var ti = 0; ti < TENTS.length; ti++) {
  var tn = TENTS[ti];
  pushSprite(
    shadowB,
    tn.x,
    groundH(tn.x, tn.z) + 0.014,
    tn.z,
    tn.w * 0.72,
    0,
    0.3 + ti * 0.17,
    4,
    [0.02, 0.02, 0.02],
  );
}

/* 火焰与光晕 */
var flameB = SpriteBatch(64),
  glowB = SpriteBatch(96),
  emberB = SpriteBatch(520),
  smokeB = SpriteBatch(220),
  farB = SpriteBatch(140);
(function () {
  var rnd = mulberry32(77123);
  for (var i = 0; i < FIRES.length; i++) {
    var f = FIRES[i];
    var k = f.s;
    pushSprite(
      glowB,
      f.x,
      f.y + 0.35,
      f.z,
      2.4 * k,
      0,
      rnd() * 6.28,
      0,
      [1.0, 0.42, 0.14],
    );
    pushSprite(
      glowB,
      f.x,
      f.y + 0.3,
      f.z,
      1.0 * k,
      0,
      rnd() * 6.28,
      0,
      [1.0, 0.62, 0.28],
    );
    for (var j = 0; j < 4; j++) {
      pushSprite(
        flameB,
        f.x + (rnd() - 0.5) * 0.16 * k,
        f.y + 0.2 * j * 0.42 * k,
        f.z + (rnd() - 0.5) * 0.16 * k,
        (0.52 - 0.07 * j) * k,
        rnd() * 6.28,
        rnd() * 6.28,
        1,
        [1, 1, 1],
      );
    }
    for (j = 0; j < (isSmall ? 14 : 34); j++) {
      pushSprite(
        emberB,
        f.x + (rnd() - 0.5) * 0.35,
        f.y + 0.3,
        f.z + (rnd() - 0.5) * 0.35,
        0.03 + rnd() * 0.028,
        0,
        rnd() * 6.28,
        3,
        [1.0, 0.48, 0.16],
      );
    }
    for (j = 0; j < (isSmall ? 6 : 14); j++) {
      pushSprite(
        smokeB,
        f.x + (rnd() - 0.5) * 0.4,
        f.y + 0.4 + rnd() * 0.6,
        f.z + (rnd() - 0.5) * 0.4,
        1.6 + rnd() * 1.4,
        0,
        rnd() * 6.28,
        2,
        [0.2, 0.2, 0.2],
      );
    }
  }
  pushSprite(
    glowB,
    LAMP[0],
    LAMP[1] + 0.05,
    LAMP[2],
    0.52,
    0,
    1.2,
    0,
    [1.0, 0.66, 0.34],
  );
  pushSprite(
    glowB,
    LAMP[0],
    LAMP[1] + 0.03,
    LAMP[2],
    0.16,
    0,
    2.2,
    0,
    [1.0, 0.86, 0.58],
  );
  pushSprite(
    flameB,
    LAMP[0],
    LAMP[1] + 0.015,
    LAMP[2],
    0.105,
    0,
    3.1,
    1,
    [1, 1, 1],
  );
  /* 远处连营 */
  for (var i2 = 0; i2 < (isSmall ? 55 : 110); i2++) {
    var x = (rnd() - 0.5) * 150;
    var z = -36 - rnd() * 95;
    var y = groundH(x, z) + 0.4 + rnd() * 1.5;
    var s = 0.55 + rnd() * 1.15;
    pushSprite(farB, x, y, z, s, 0, rnd() * 6.28, 5, [1.0, 0.44, 0.16]);
  }
})();
initSprites(shadowB);
initSprites(groundGlowB);
initSprites(flameB);
initSprites(glowB);
initSprites(emberB);
initSprites(smokeB);
initSprites(farB);

/* ------------------------------------------------------- 灯光参数 */
var BASE = {
  uMoonDir: [0, 0, 0],
  uMoonCol: [0.34, 0.44, 0.66],
  uAmbSky: [0.03, 0.042, 0.068],
  uAmbGround: [0.011, 0.011, 0.01],
  uFogColor: [0.045, 0.056, 0.078],
  uFogK: 0.03,
  uExposure: 1.25,
  uZenith: [0.006, 0.011, 0.026],
  uHorizon: [0.03, 0.042, 0.066],
  uHaze: [0.11, 0.058, 0.028],
  uLampPos: LAMP,
  uLampCol: [1.0, 0.58, 0.26],
};
(function () {
  var d = [-0.46, 0.215, -0.86];
  var l = Math.hypot(d[0], d[1], d[2]);
  BASE.uMoonDir = [d[0] / l, d[1] / l, d[2] / l];
})();

var LPOS = new Float32Array(16),
  LCOL = new Float32Array(12),
  LINT = new Float32Array(4);
function updateLights(t) {
  var flick =
    0.86 +
    0.1 * Math.sin(t * 11.3) +
    0.05 * Math.sin(t * 27.1 + 1.3) +
    0.04 * Math.sin(t * 4.1);
  LPOS[0] = LAMP[0];
  LPOS[1] = LAMP[1] + 0.03;
  LPOS[2] = LAMP[2];
  LPOS[3] = 4.6;
  LCOL[0] = 1.0;
  LCOL[1] = 0.56;
  LCOL[2] = 0.24;
  LINT[0] = 3.1 * flick;
  for (var i = 0; i < 3; i++) {
    var f = FIRES[i];
    var ff =
      0.82 +
      0.14 * Math.sin(t * 7.7 + i * 2.1) +
      0.06 * Math.sin(t * 19.3 + i * 5.0);
    LPOS[(i + 1) * 4] = f.x;
    LPOS[(i + 1) * 4 + 1] = f.y + 0.62;
    LPOS[(i + 1) * 4 + 2] = f.z;
    LPOS[(i + 1) * 4 + 3] = 8.5 * f.s;
    LCOL[(i + 1) * 3] = 1.0;
    LCOL[(i + 1) * 3 + 1] = 0.42;
    LCOL[(i + 1) * 3 + 2] = 0.14;
    LINT[i + 1] = 1.9 * f.s * ff;
  }
  return flick;
}

function setLights(prog) {
  gl.uniform4fv(prog.u.uLPos, LPOS);
  gl.uniform3fv(prog.u.uLCol, LCOL);
  gl.uniform1fv(prog.u.uLInt, LINT);
}
