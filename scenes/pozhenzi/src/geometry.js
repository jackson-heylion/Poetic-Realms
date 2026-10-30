/* ------------------------------------------------------- 网格工具 */
var ATTR_SIZE = {
  aPos: 3,
  aNrm: 3,
  aCol: 3,
  aUv: 2,
  aInfo: 3,
  aLocal: 2,
  aSeed: 3,
  aCenter: 3,
};

function uploadMesh(attrs, indices) {
  var m = {
    buf: {},
    count: indices.length,
    type: canU32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
  };
  for (var k in attrs) {
    var arr =
      attrs[k] instanceof Float32Array ? attrs[k] : new Float32Array(attrs[k]);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    m.buf[k] = b;
  }
  var ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    canU32 ? new Uint32Array(indices) : new Uint16Array(indices),
    gl.STATIC_DRAW,
  );
  m.ibo = ib;
  return m;
}

function drawMesh(prog, mesh) {
  var k, loc, b;
  for (k in mesh.buf) {
    loc = prog.a[k];
    if (loc === undefined || loc < 0) continue;
    b = mesh.buf[k];
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, ATTR_SIZE[k], gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
  gl.drawElements(gl.TRIANGLES, mesh.count, mesh.type, 0);
  drawCallCount++;
}

function Mesh() {
  return { p: [], n: [], c: [], u: [], i: [] };
}
function vtx(m, x, y, z, nx, ny, nz, col, uv) {
  m.p.push(x, y, z);
  m.n.push(nx, ny, nz);
  m.c.push(col[0], col[1], col[2]);
  m.u.push(uv ? uv[0] : 0, uv ? uv[1] : 0);
  return m.p.length / 3 - 1;
}
function tri(m, a, b, c) {
  m.i.push(a, b, c);
}
function quadIdx(m, a, b, c, d) {
  m.i.push(a, b, c, a, c, d);
}

function flatTri(m, p0, p1, p2, col) {
  var ax = p1[0] - p0[0],
    ay = p1[1] - p0[1],
    az = p1[2] - p0[2];
  var bx = p2[0] - p0[0],
    by = p2[1] - p0[1],
    bz = p2[2] - p0[2];
  var nx = ay * bz - az * by,
    ny = az * bx - ax * bz,
    nz = ax * by - ay * bx;
  var nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  var i0 = vtx(m, p0[0], p0[1], p0[2], nx, ny, nz, col, [0, 0]);
  var i1 = vtx(m, p1[0], p1[1], p1[2], nx, ny, nz, col, [1, 0]);
  var i2 = vtx(m, p2[0], p2[1], p2[2], nx, ny, nz, col, [0.5, 1]);
  tri(m, i0, i1, i2);
}

/* 平面四边面（同法线，硬边），用于帐篷、木器、旗面 */
function flatQuad(m, p0, p1, p2, p3, col, uv) {
  var ax = p1[0] - p0[0],
    ay = p1[1] - p0[1],
    az = p1[2] - p0[2];
  var bx = p3[0] - p0[0],
    by = p3[1] - p0[1],
    bz = p3[2] - p0[2];
  var nx = ay * bz - az * by,
    ny = az * bx - ax * bz,
    nz = ax * by - ay * bx;
  var nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  var i0 = vtx(m, p0[0], p0[1], p0[2], nx, ny, nz, col, uv ? uv[0] : [0, 0]);
  var i1 = vtx(m, p1[0], p1[1], p1[2], nx, ny, nz, col, uv ? uv[1] : [1, 0]);
  var i2 = vtx(m, p2[0], p2[1], p2[2], nx, ny, nz, col, uv ? uv[2] : [1, 1]);
  var i3 = vtx(m, p3[0], p3[1], p3[2], nx, ny, nz, col, uv ? uv[3] : [0, 1]);
  quadIdx(m, i0, i1, i2, i3);
}

/* 带旋转的方盒，盒心 (cx,cy,cz)，尺寸 (sx,sy,sz) */
function addBox(m, cx, cy, cz, sx, sy, sz, ry, col, shade) {
  var c = Math.cos(ry || 0),
    s = Math.sin(ry || 0);
  function P(x, y, z) {
    return [cx + x * c + z * s, cy + y, cz - x * s + z * c];
  }
  var hx = sx / 2,
    hy = sy / 2,
    hz = sz / 2;
  var f = [col[0], col[1], col[2]];
  function sh(k) {
    return [f[0] * k, f[1] * k, f[2] * k];
  }
  flatQuad(
    m,
    P(-hx, hy, -hz),
    P(hx, hy, -hz),
    P(hx, hy, hz),
    P(-hx, hy, hz),
    sh(1.0),
  ); /* 顶 */
  flatQuad(
    m,
    P(-hx, -hy, hz),
    P(hx, -hy, hz),
    P(hx, hy, hz),
    P(-hx, hy, hz),
    sh(shade ? 0.95 : 0.9),
  );
  flatQuad(
    m,
    P(hx, -hy, -hz),
    P(-hx, -hy, -hz),
    P(-hx, hy, -hz),
    P(hx, hy, -hz),
    sh(0.62),
  );
  flatQuad(
    m,
    P(-hx, -hy, -hz),
    P(-hx, -hy, hz),
    P(-hx, hy, hz),
    P(-hx, hy, -hz),
    sh(0.78),
  );
  flatQuad(
    m,
    P(hx, -hy, hz),
    P(hx, -hy, -hz),
    P(hx, hy, -hz),
    P(hx, hy, hz),
    sh(0.86),
  );
}

/* 沿曲线的管（旗杆、矛杆、号角） */
function addTube(m, pts, radii, sides, col, capEnds) {
  var n = pts.length,
    i,
    j;
  var rings = [];
  for (i = 0; i < n; i++) {
    var a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(n - 1, i + 1)];
    var tx = b[0] - a[0],
      ty = b[1] - a[1],
      tz = b[2] - a[2];
    var tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;
    var ux = 0,
      uy = 1,
      uz = 0;
    if (Math.abs(ty) > 0.92) {
      ux = 1;
      uy = 0;
      uz = 0;
    }
    var rx = uy * tz - uz * ty,
      ry = uz * tx - ux * tz,
      rz = ux * ty - uy * tx;
    var rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    var sx = ty * rz - tz * ry,
      sy = tz * rx - tx * rz,
      sz = tx * ry - ty * rx;
    var ring = [];
    for (j = 0; j < sides; j++) {
      var ang = (j / sides) * Math.PI * 2;
      var ca = Math.cos(ang),
        sa = Math.sin(ang);
      var nx = rx * ca + sx * sa,
        ny = ry * ca + sy * sa,
        nz = rz * ca + sz * sa;
      var r = radii[i];
      ring.push(
        vtx(
          m,
          pts[i][0] + nx * r,
          pts[i][1] + ny * r,
          pts[i][2] + nz * r,
          nx,
          ny,
          nz,
          col,
          [j / sides, i / (n - 1)],
        ),
      );
    }
    rings.push(ring);
  }
  for (i = 0; i < n - 1; i++) {
    for (j = 0; j < sides; j++) {
      var j2 = (j + 1) % sides;
      quadIdx(m, rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]);
    }
  }
  if (capEnds) {
    var last = rings[n - 1],
      first = rings[0];
    for (j = 1; j < sides - 1; j++) {
      tri(m, last[0], last[j], last[j + 1]);
      tri(m, first[0], first[j + 1], first[j]);
    }
  }
}

/* 旋转体（灯、酒瓮、杯） */
function addLathe(m, profile, sides, col, cx, cy, cz, scale) {
  var rings = [],
    i,
    j;
  var s = scale || 1;
  for (i = 0; i < profile.length; i++) {
    var r = profile[i][0] * s,
      y = profile[i][1] * s;
    var pr = profile[Math.max(0, i - 1)],
      nx = profile[Math.min(profile.length - 1, i + 1)];
    var dr = nx[0] - pr[0],
      dy = nx[1] - pr[1];
    var dl = Math.hypot(dr, dy) || 1;
    dr /= dl;
    dy /= dl;
    var ring = [];
    for (j = 0; j < sides; j++) {
      var ang = (j / sides) * Math.PI * 2,
        ca = Math.cos(ang),
        sa = Math.sin(ang);
      var n = [dy * ca, -dr, dy * sa];
      var nl = Math.hypot(n[0], n[1], n[2]) || 1;
      ring.push(
        vtx(
          m,
          cx + r * ca,
          cy + y,
          cz + r * sa,
          n[0] / nl,
          n[1] / nl,
          n[2] / nl,
          col,
          [j / sides, i / (profile.length - 1)],
        ),
      );
    }
    rings.push(ring);
  }
  for (i = 0; i < rings.length - 1; i++) {
    for (j = 0; j < sides; j++) {
      var j2 = (j + 1) % sides;
      quadIdx(m, rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]);
    }
  }
}
