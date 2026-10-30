/* ------------------------------------------------------- 帐篷 */
var tentMouth = Mesh();
var TENTS = [];
function addTent(m, x, z, w, d, h, yaw, shade, glow) {
  TENTS.push({ x: x, z: z, w: w, d: d });
  var c = Math.cos(yaw),
    s = Math.sin(yaw);
  function P(lx, ly, lz) {
    return [
      x + lx * c + lz * s,
      groundH(x + lx * c + lz * s, z - lx * s + lz * c) + ly - 0.05,
      z - lx * s + lz * c,
    ];
  }
  var fabric = [0.175 * shade, 0.17 * shade, 0.148 * shade];
  var seg = 4,
    i,
    j;
  /* 两坡屋面：脊线到檐口，带轻微下垂 */
  for (var side = -1; side <= 1; side += 2) {
    var prev = null;
    for (i = 0; i <= seg; i++) {
      var t = i / seg,
        lz = -d / 2 + d * t;
      var row = [];
      for (j = 0; j <= 2; j++) {
        var u = j / 2;
        var lx = side * (w / 2) * u;
        var ly =
          lerp(h, h * 0.34, u) -
          Math.sin(Math.PI * u) * 0.1 * Math.sin(t * Math.PI) * 0.9;
        row.push(P(lx, ly, lz));
      }
      if (prev) {
        var cc = [
          fabric[0] * (0.92 + 0.16 * Math.sin(i * 1.7 + side)),
          fabric[1] * (0.92 + 0.16 * Math.sin(i * 1.7 + side)),
          fabric[2] * (0.92 + 0.16 * Math.sin(i * 1.7 + side)),
        ];
        if (side < 0) flatQuad(m, prev[0], prev[1], row[1], row[0], cc);
        else flatQuad(m, row[0], row[1], prev[1], prev[0], cc);
      }
      prev = row;
    }
  }
  /* 两山墙 */
  var apexF = P(0, h, d / 2),
    apexB = P(0, h, -d / 2);
  var fbl = P((-w / 2) * 0.99, 0, d / 2),
    fbr = P((w / 2) * 0.99, 0, d / 2);
  var bbl = P((-w / 2) * 0.99, 0, -d / 2),
    bbr = P((w / 2) * 0.99, 0, -d / 2);
  var eyF_L = P(-w / 2, h * 0.34, d / 2),
    eyF_R = P(w / 2, h * 0.34, d / 2);
  var eyB_L = P(-w / 2, h * 0.34, -d / 2),
    eyB_R = P(w / 2, h * 0.34, -d / 2);
  flatQuad(m, bbl, bbr, eyB_R, eyB_L, [
    fabric[0] * 0.86,
    fabric[1] * 0.86,
    fabric[2] * 0.86,
  ]);
  flatTri(m, eyB_L, eyB_R, apexB, [
    fabric[0] * 0.86,
    fabric[1] * 0.86,
    fabric[2] * 0.86,
  ]);
  /* 前墙留门洞 */
  if (glow) {
    var wall = [fabric[0] * 0.94, fabric[1] * 0.94, fabric[2] * 0.94];
    flatQuad(
      m,
      fbl,
      P(-0.34, 0, d / 2),
      P(-0.34, h * 0.34, d / 2),
      eyF_L,
      wall,
    );
    flatQuad(m, P(0.34, 0, d / 2), fbr, eyF_R, P(0.34, h * 0.34, d / 2), wall);
    flatQuad(
      m,
      P(-0.34, h * 0.3, d / 2),
      P(0.34, h * 0.3, d / 2),
      P(0.34, h * 0.34, d / 2),
      P(-0.34, h * 0.34, d / 2),
      wall,
    );
    flatTri(m, eyF_L, eyF_R, apexF, wall);
    /* 帐内透出的暖光 */
    var mc = [0.62, 0.27, 0.085];
    var g0 = P(-0.3, 0.02, d / 2 - 0.02),
      g1 = P(0.3, 0.02, d / 2 - 0.02);
    var g2 = P(0.3, h * 0.29, d / 2 - 0.02),
      g3 = P(-0.3, h * 0.29, d / 2 - 0.02);
    flatQuad(tentMouth, g0, g1, g2, g3, mc, [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
  } else {
    flatQuad(m, fbl, fbr, eyF_R, eyF_L, [
      fabric[0] * 0.94,
      fabric[1] * 0.94,
      fabric[2] * 0.94,
    ]);
    flatTri(m, eyF_L, eyF_R, apexF, [
      fabric[0] * 0.94,
      fabric[1] * 0.94,
      fabric[2] * 0.94,
    ]);
  }
  /* 脊杆 */
  addTube(
    m,
    [P(0, h, -d / 2 - 0.32), P(0, h, d / 2 + 0.32)],
    [0.035, 0.035],
    5,
    [0.12, 0.09, 0.06],
    true,
  );
  /* 四根拉绳 */
  var ropes = [
    [P(0, h, d / 2 + 0.2), P(-w / 2 - 0.75, 0.02, d / 2 + 0.55)],
    [P(0, h, d / 2 + 0.2), P(w / 2 + 0.75, 0.02, d / 2 + 0.55)],
    [P(0, h, -d / 2 - 0.2), P(-w / 2 - 0.75, 0.02, -d / 2 - 0.55)],
    [P(0, h, -d / 2 - 0.2), P(w / 2 + 0.75, 0.02, -d / 2 - 0.55)],
  ];
  for (i = 0; i < ropes.length; i++) {
    var a = ropes[i][0],
      b = ropes[i][1];
    var wob = 0.018;
    flatQuad(
      m,
      [a[0] - wob, a[1], a[2]],
      [a[0] + wob, a[1], a[2]],
      [b[0] + wob * 0.5, b[1], b[2]],
      [b[0] - wob * 0.5, b[1], b[2]],
      [0.085, 0.07, 0.052],
    );
  }
}

function buildCamp() {
  var m = Mesh();
  var rows = [
    {
      z: -9.5,
      xs: [-12.5, -7.4, -2.2, 2.6, 7.8, 13.2],
      w: 3.5,
      d: 3.4,
      h: 2.6,
    },
    {
      z: -16.5,
      xs: [-15.5, -10.2, -4.8, 0.4, 5.8, 11.2, 16.6],
      w: 3.7,
      d: 3.6,
      h: 2.7,
    },
    {
      z: -24.0,
      xs: [-18.0, -12.4, -6.6, -0.8, 5.0, 10.8, 16.6, 22.2],
      w: 3.9,
      d: 3.7,
      h: 2.8,
    },
    {
      z: -33.0,
      xs: [-21.0, -15.0, -8.8, -2.6, 3.6, 9.8, 16.0, 22.2],
      w: 4.1,
      d: 3.9,
      h: 2.9,
    },
  ];
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    for (var i = 0; i < row.xs.length; i++) {
      var x = row.xs[i] + (RND() - 0.5) * 0.9;
      var z = row.z + (RND() - 0.5) * 1.1;
      var yaw = (RND() - 0.5) * 0.16;
      var w = row.w * (0.9 + RND() * 0.2),
        d = row.d * (0.9 + RND() * 0.2),
        h = row.h * (0.94 + RND() * 0.12);
      var glow = r < 3 && (i + r) % 2 === 0;
      addTent(m, x, z, w, d, h, yaw, 0.86 + RND() * 0.28, glow);
    }
  }
  return uploadMesh({ aPos: m.p, aNrm: m.n, aCol: m.c, aUv: m.u }, m.i);
}

/* ------------------------------------------------------- 旌旗 */
var clothM = Mesh(),
  poleM = Mesh();
function addBanner(x, z, h, w, phase, shade) {
  var y0 = groundH(x, z);
  addTube(
    poleM,
    [
      [x, y0 - 0.1, z],
      [x, y0 + h * 0.62, z],
      [x, y0 + h, z],
    ],
    [0.055, 0.045, 0.03],
    6,
    [0.115, 0.086, 0.058],
    true,
  );
  addTube(
    poleM,
    [
      [x - w * 0.62, y0 + h * 0.955, z],
      [x + w * 0.3, y0 + h * 0.975, z],
    ],
    [0.02, 0.018],
    5,
    [0.1, 0.078, 0.052],
    true,
  );
  var segX = 6,
    segY = 12,
    i,
    j;
  var idx0 = clothM.p.length / 3;
  for (j = 0; j <= segY; j++) {
    var v = j / segY;
    for (i = 0; i <= segX; i++) {
      var u = i / segX;
      var px = x - w * 0.1 + w * 0.42 * u;
      var py = y0 + h * 0.955 - h * 0.52 * v;
      var pz = z + 0.02;
      var col = [0.235 * shade, 0.062 * shade, 0.05 * shade];
      if (v > 0.93 || u > 0.9)
        col = [0.14 * shade, 0.04 * shade, 0.034 * shade];
      var att = Math.pow(u, 1.15);
      clothM.p.push(px, py, pz);
      clothM.n.push(0, 0, 1);
      clothM.c.push(col[0], col[1], col[2]);
      clothM.u.push(u, v);
      clothM.info = clothM.info || [];
      clothM.info.push(0.085 + w * 0.03, phase, att);
    }
  }
  for (j = 0; j < segY; j++) {
    for (i = 0; i < segX; i++) {
      var a = idx0 + j * (segX + 1) + i,
        b = a + 1,
        c = a + segX + 1,
        d = c + 1;
      clothM.i.push(a, b, c, b, d, c);
    }
  }
}

function buildBanners() {
  addBanner(-3.9, -4.4, 6.6, 1.25, 0.4, 1.0);
  addBanner(6.2, -9.6, 7.2, 1.35, 1.9, 0.92);
  addBanner(-12.0, -16.4, 7.8, 1.45, 3.1, 0.86);
  addBanner(1.6, -17.2, 6.9, 1.25, 4.4, 0.96);
  addBanner(12.6, -23.0, 7.4, 1.35, 5.6, 0.82);
  addBanner(-7.5, -27.5, 7.0, 1.3, 2.3, 0.78);
}
