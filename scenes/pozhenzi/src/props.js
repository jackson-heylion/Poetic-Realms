/* ------------------------------------------------------- 矛架 */
function addSpearRack(m, x, z, yaw) {
  var y0 = groundH(x, z);
  var c = Math.cos(yaw),
    s = Math.sin(yaw);
  function P(lx, ly, lz) {
    return [x + lx * c + lz * s, y0 + ly, z - lx * s + lz * c];
  }
  /* 三脚架 */
  addTube(
    m,
    [P(-0.62, 0, -0.35), P(0, 1.32, 0)],
    [0.035, 0.032],
    5,
    [0.12, 0.095, 0.062],
    true,
  );
  addTube(
    m,
    [P(0.62, 0, -0.35), P(0, 1.32, 0)],
    [0.035, 0.032],
    5,
    [0.12, 0.095, 0.062],
    true,
  );
  addTube(
    m,
    [P(0, 0, 0.55), P(0, 1.32, 0)],
    [0.035, 0.032],
    5,
    [0.12, 0.095, 0.062],
    true,
  );
  addTube(
    m,
    [P(-0.52, 1.02, 0), P(0.52, 1.02, 0)],
    [0.028, 0.028],
    5,
    [0.115, 0.09, 0.06],
    true,
  );
  /* 斜倚的长矛 */
  var rnd = mulberry32((x * 97 + z * 31) | 0);
  for (var i = 0; i < 11; i++) {
    var lx = -0.46 + i * 0.092;
    var lean = 0.1 + rnd() * 0.09;
    var len = 3.3 + rnd() * 0.85;
    var bx = P(lx, 0.0, 0.16);
    var tx = P(lx + lean * 1.5, len, 0.16 + lean * 0.6);
    addTube(m, [bx, tx], [0.021, 0.014], 5, [0.14, 0.115, 0.082], false);
    /* 矛头 */
    var dir = [tx[0] - bx[0], tx[1] - bx[1], tx[2] - bx[2]];
    var dl = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    var M = m4axis(tx, dir, [0, 0, 1], 1);
    var tip = xf(M, [0, 0.3, 0]);
    addTube(m, [tx, tip], [0.03, 0.002], 4, [0.52, 0.52, 0.55], true);
  }
}

/* 在局部坐标系中放置方盒（用于剑格） */
function addLocalBox(m, M, cx, cy, cz, sx, sy, sz, col) {
  var hx = sx / 2,
    hy = sy / 2,
    hz = sz / 2,
    i;
  var pts = [];
  for (i = 0; i < 8; i++) {
    var lx = i & 1 ? hx : -hx,
      ly = i & 2 ? hy : -hy,
      lz = i & 4 ? hz : -hz;
    pts.push(xf(M, [cx + lx, cy + ly, cz + lz]));
  }
  /* 顶点索引：0(-,-,-) 1(+,-,-) 2(-,+,-) 3(+,+,-) 4(-,-,+) 5(+,-,+) 6(-,+,+) 7(+,+,+) */
  flatQuad(m, pts[4], pts[5], pts[7], pts[6], col);
  flatQuad(m, pts[1], pts[0], pts[2], pts[3], [
    col[0] * 0.8,
    col[1] * 0.8,
    col[2] * 0.8,
  ]);
  flatQuad(m, pts[0], pts[4], pts[6], pts[2], [
    col[0] * 0.9,
    col[1] * 0.9,
    col[2] * 0.9,
  ]);
  flatQuad(m, pts[5], pts[1], pts[3], pts[7], [
    col[0] * 0.95,
    col[1] * 0.95,
    col[2] * 0.95,
  ]);
  flatQuad(m, pts[3], pts[2], pts[6], pts[7], col);
  flatQuad(m, pts[0], pts[1], pts[5], pts[4], [
    col[0] * 0.7,
    col[1] * 0.7,
    col[2] * 0.7,
  ]);
}

/* ------------------------------------------------------- 剑 */
function addSword(m, M) {
  var i;
  var stations = [
    [0.0, 0.052, 0.0125],
    [0.1, 0.051, 0.0118],
    [0.46, 0.047, 0.0102],
    [0.74, 0.04, 0.0086],
    [0.88, 0.03, 0.0066],
    [0.965, 0.008, 0.003],
  ];
  var rings = [];
  for (i = 0; i < stations.length; i++) {
    var y = stations[i][0],
      w = stations[i][1],
      t = stations[i][2];
    var pts = [
      [0, y, t],
      [w, y, 0],
      [0, y, -t],
      [-w, y, 0],
    ];
    var ring = [];
    for (var k = 0; k < 4; k++) {
      var p = xf(M, pts[k]);
      ring.push(
        vtx(m, p[0], p[1], p[2], 0, 0, 0, [0.46, 0.48, 0.5], [k / 4, y]),
      );
    }
    rings.push(ring);
  }
  /* 重新以面法线着色，保持棱线 */
  m.p.length -= 0;
  for (i = 0; i < rings.length - 1; i++) {
    for (var k = 0; k < 4; k++) {
      var k2 = (k + 1) % 4;
      var a = rings[i][k],
        b = rings[i][k2],
        c = rings[i + 1][k2],
        d = rings[i + 1][k];
      var pa = [m.p[a * 3], m.p[a * 3 + 1], m.p[a * 3 + 2]];
      var pb = [m.p[b * 3], m.p[b * 3 + 1], m.p[b * 3 + 2]];
      var pc = [m.p[c * 3], m.p[c * 3 + 1], m.p[c * 3 + 2]];
      var e1 = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]],
        e2 = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];
      var nx = e1[1] * e2[2] - e1[2] * e2[1],
        ny = e1[2] * e2[0] - e1[0] * e2[2],
        nz = e1[0] * e2[1] - e1[1] * e2[0];
      var nl = Math.hypot(nx, ny, nz) || 1;
      var face = 0.42 + 0.3 * Math.abs(ny / nl);
      m.c[a * 3] = face * 1.05;
      m.c[a * 3 + 1] = face * 1.05;
      m.c[a * 3 + 2] = face * 1.1;
      m.c[b * 3] = face * 1.05;
      m.c[b * 3 + 1] = face * 1.05;
      m.c[b * 3 + 2] = face * 1.1;
      m.c[c * 3] = face * 1.05;
      m.c[c * 3 + 1] = face * 1.05;
      m.c[c * 3 + 2] = face * 1.1;
      m.c[d * 3] = face * 1.05;
      m.c[d * 3 + 1] = face * 1.05;
      m.c[d * 3 + 2] = face * 1.1;
      (function (mm, a, b, c, d, nx, ny, nz) {
        mm.i.push(a, b, c, a, c, d);
        var ids = [a, b, c, d];
        for (var q = 0; q < 4; q++) {
          mm.n[ids[q] * 3] = nx;
          mm.n[ids[q] * 3 + 1] = ny;
          mm.n[ids[q] * 3 + 2] = nz;
        }
      })(m, a, b, c, d, nx / nl, ny / nl, nz / nl);
    }
  }
  /* 护手 */
  addLocalBox(m, M, 0, -0.012, 0, 0.19, 0.03, 0.05, [0.3, 0.24, 0.13]);
  addLocalBox(m, M, 0, -0.036, 0, 0.12, 0.024, 0.042, [0.26, 0.21, 0.12]);
  /* 握柄与柄头 */
  var h0 = xf(M, [0, -0.045, 0]),
    h1 = xf(M, [0, -0.205, 0]);
  addTube(m, [h0, h1], [0.023, 0.021], 8, [0.095, 0.07, 0.048], false);
  for (i = 0; i < 6; i++) {
    var t0 = -0.055 - i * 0.024,
      t1 = t0 - 0.009;
    var r0 = xf(M, [0, t0, 0]),
      r1 = xf(M, [0, t1, 0]);
    addTube(m, [r0, r1], [0.026, 0.026], 8, [0.07, 0.052, 0.036], false);
  }
  var pom = xf(M, [0, -0.225, 0]);
  addLathe(
    m,
    [
      [0, 0.0],
      [0.02, 0.004],
      [0.028, 0.018],
      [0.022, 0.034],
      [0.0, 0.042],
    ],
    8,
    [0.32, 0.25, 0.13],
    pom[0],
    pom[1],
    pom[2],
    1,
  );
}

/* ------------------------------------------------------- 器物 */
function addTable(m, x, z, yaw) {
  var y0 = groundH(x, z);
  var w = 1.52,
    d = 0.68,
    topY = y0 + 0.6;
  var c = Math.cos(yaw),
    s = Math.sin(yaw);
  function P(lx, ly, lz) {
    return [x + lx * c + lz * s, y0 + ly, z - lx * s + lz * c];
  }
  for (var i = 0; i < 3; i++) {
    var lz = -d / 2 + 0.115 + i * 0.225;
    flatQuad(
      m,
      P(-w / 2, topY, lz - 0.112),
      P(w / 2, topY, lz - 0.112),
      P(w / 2, topY, lz + 0.112),
      P(-w / 2, topY, lz + 0.112),
      [0.15, 0.112, 0.074],
    );
    flatQuad(
      m,
      P(-w / 2, topY - 0.05, lz + 0.112),
      P(w / 2, topY - 0.05, lz + 0.112),
      P(w / 2, topY, lz + 0.112),
      P(-w / 2, topY, lz + 0.112),
      [0.098, 0.072, 0.047],
    );
  }
  var legs = [
    [-w / 2 + 0.1, -d / 2 + 0.1],
    [w / 2 - 0.1, -d / 2 + 0.1],
    [-w / 2 + 0.1, d / 2 - 0.1],
    [w / 2 - 0.1, d / 2 - 0.1],
  ];
  for (i = 0; i < 4; i++) {
    var lp = P(legs[i][0], 0, legs[i][1]);
    addTube(
      m,
      [
        [lp[0], lp[1], lp[2]],
        [lp[0], lp[1] + topY - 0.05, lp[2]],
      ],
      [0.032, 0.027],
      5,
      [0.105, 0.078, 0.05],
      true,
    );
  }
  addTube(
    m,
    [P(-w / 2 + 0.1, 0.22, -d / 2 + 0.1), P(w / 2 - 0.1, 0.22, -d / 2 + 0.1)],
    [0.018, 0.018],
    4,
    [0.09, 0.068, 0.045],
    true,
  );
  addTube(
    m,
    [P(-w / 2 + 0.1, 0.22, d / 2 - 0.1), P(w / 2 - 0.1, 0.22, d / 2 - 0.1)],
    [0.018, 0.018],
    4,
    [0.09, 0.068, 0.045],
    true,
  );
}

function addOilLamp(m, x, y, z) {
  addLathe(
    m,
    [
      [0.0, 0.0],
      [0.075, 0.006],
      [0.062, 0.022],
      [0.026, 0.036],
      [0.02, 0.1],
      [0.034, 0.118],
      [0.058, 0.126],
      [0.062, 0.14],
      [0.05, 0.15],
      [0.0, 0.152],
    ],
    10,
    [0.36, 0.27, 0.14],
    x,
    y,
    z,
    0.72,
  );
  addLathe(
    m,
    [
      [0.0, 0.0],
      [0.03, 0.006],
      [0.01, 0.026],
      [0.006, 0.04],
      [0.0, 0.042],
    ],
    6,
    [0.88, 0.8, 0.62],
    x + 0.005,
    y + 0.1,
    z,
    1,
  );
}

function addJar(m, x, z, s) {
  var y0 = groundH(x, z);
  addLathe(
    m,
    [
      [0.0, 0.0],
      [0.1, 0.006],
      [0.155, 0.075],
      [0.165, 0.16],
      [0.145, 0.245],
      [0.105, 0.3],
      [0.072, 0.322],
      [0.078, 0.345],
      [0.0, 0.348],
    ],
    11,
    [0.115, 0.105, 0.085],
    x,
    y0,
    z,
    s || 1,
  );
}

function addCup(m, x, y, z) {
  addLathe(
    m,
    [
      [0.0, 0.0],
      [0.028, 0.004],
      [0.036, 0.01],
      [0.042, 0.052],
      [0.038, 0.054],
      [0.03, 0.014],
      [0.0, 0.01],
    ],
    9,
    [0.3, 0.26, 0.2],
    x,
    y,
    z,
    1,
  );
}

/* 号角（角身弯曲，置木架） */
function addHorn(m, x, z, yaw) {
  var y0 = groundH(x, z);
  var c = Math.cos(yaw),
    s = Math.sin(yaw);
  function P(lx, ly, lz) {
    return [x + lx * c + lz * s, y0 + ly, z - lx * s + lz * c];
  }
  var pts = [],
    radii = [];
  for (var i = 0; i <= 10; i++) {
    var t = i / 10;
    var ang = t * 1.15;
    var lx = -0.55 + Math.sin(ang) * 0.62;
    var ly = 1.02 + Math.cos(ang) * 0.3 - 0.3 + t * 0.1;
    pts.push(P(lx, ly, 0));
    radii.push(0.02 + t * 0.055);
  }
  addTube(m, pts, radii, 8, [0.3, 0.22, 0.11], true);
  var bell = P(
    -0.55 + Math.sin(1.15) * 0.62,
    1.02 + Math.cos(1.15) * 0.3 - 0.3 + 0.1,
    0,
  );
  addLathe(
    m,
    [
      [0.0, 0.075],
      [0.055, 0.07],
      [0.082, 0.02],
      [0.078, 0.0],
    ],
    9,
    [0.34, 0.25, 0.12],
    bell[0],
    bell[1],
    bell[2],
    1,
  );
  /* 木架 */
  addTube(
    m,
    [P(-0.72, 0, 0.16), P(-0.3, 0.92, 0)],
    [0.026, 0.024],
    5,
    [0.11, 0.082, 0.055],
    true,
  );
  addTube(
    m,
    [P(0.42, 0, 0.16), P(0.12, 0.92, 0)],
    [0.026, 0.024],
    5,
    [0.11, 0.082, 0.055],
    true,
  );
  addTube(
    m,
    [P(-0.68, 0, -0.16), P(-0.3, 0.92, 0)],
    [0.026, 0.024],
    5,
    [0.1, 0.076, 0.05],
    true,
  );
  addTube(
    m,
    [P(0.38, 0, -0.16), P(0.12, 0.92, 0)],
    [0.026, 0.024],
    5,
    [0.1, 0.076, 0.05],
    true,
  );
}
