/* ------------------------------------------------------- 草 */
function buildGrass() {
  var m = { p: [], local: [], seed: [], i: [] };
  var rnd = mulberry32(20260815);
  var clumps = isSmall ? 520 : 1100;
  var vi = 0;
  for (var i = 0; i < clumps; i++) {
    var x = (rnd() - 0.5) * 30;
    var z = 1.0 + rnd() * 13.5;
    if (x > -2.6 && x < -0.1 && z > 3.2 && z < 4.9) continue;
    var y = groundH(x, z);
    var h = 0.16 + rnd() * 0.3;
    var ang = rnd() * 6.283;
    var seed = [h, rnd(), ang];
    var quad = [
      [-1, 0],
      [1, 0],
      [1, 1],
      [-1, 1],
    ];
    for (var k = 0; k < 4; k++) {
      m.p.push(x, y, z);
      m.local.push(quad[k][0], quad[k][1]);
      m.seed.push(seed[0], seed[1], seed[2]);
      vi++;
    }
    m.i.push(vi - 4, vi - 3, vi - 2, vi - 4, vi - 2, vi - 1);
  }
  return uploadMesh({ aPos: m.p, aLocal: m.local, aSeed: m.seed }, m.i);
}

/* ------------------------------------------------------- 精灵批次 */
function SpriteBatch(cap) {
  return {
    c: new Float32Array(cap * 12),
    l: new Float32Array(cap * 8),
    col: new Float32Array(cap * 12),
    inf: new Float32Array(cap * 16),
    n: 0,
    cap: cap,
    mesh: {
      buf: {},
      count: 0,
      type: canU32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
    },
    ibo: null,
    buf: null,
  };
}
var QUAD_L = [-1, -1, 1, -1, 1, 1, -1, 1];
function pushSprite(b, x, y, z, size, rot, seed, kind, col) {
  if (b.n >= b.cap) return;
  var n = b.n++;
  // 非实例绘制时，同一粒子的四个顶点各自需要一份中心坐标。
  for (var vertex = 0; vertex < 4; vertex++) {
    b.c[n * 12 + vertex * 3] = x;
    b.c[n * 12 + vertex * 3 + 1] = y;
    b.c[n * 12 + vertex * 3 + 2] = z;
  }
  for (var k = 0; k < 4; k++) {
    b.l[n * 8 + k * 2] = QUAD_L[k * 2];
    b.l[n * 8 + k * 2 + 1] = QUAD_L[k * 2 + 1];
  }
  for (k = 0; k < 4; k++) {
    b.col[n * 12 + k * 3] = col[0];
    b.col[n * 12 + k * 3 + 1] = col[1];
    b.col[n * 12 + k * 3 + 2] = col[2];
  }
  for (k = 0; k < 4; k++) {
    b.inf[n * 16 + k * 4] = size;
    b.inf[n * 16 + k * 4 + 1] = rot;
    b.inf[n * 16 + k * 4 + 2] = seed;
    b.inf[n * 16 + k * 4 + 3] = kind;
  }
}
function initSprites(b) {
  b.buf = {
    aCenter: gl.createBuffer(),
    aLocal: gl.createBuffer(),
    aCol: gl.createBuffer(),
    aInfo: gl.createBuffer(),
  };
  var idx = new Uint32Array(b.cap * 6);
  for (var i = 0; i < b.cap; i++) {
    var v = i * 4;
    idx[i * 6] = v;
    idx[i * 6 + 1] = v + 1;
    idx[i * 6 + 2] = v + 2;
    idx[i * 6 + 3] = v;
    idx[i * 6 + 4] = v + 2;
    idx[i * 6 + 5] = v + 3;
  }
  b.ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ibo);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    canU32 ? idx : new Uint16Array(idx),
    gl.STATIC_DRAW,
  );
  b.mesh.buf = b.buf;
  uploadSprites(b);
}
function uploadSprites(b) {
  if (b.n === 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buf.aCenter);
  gl.bufferData(gl.ARRAY_BUFFER, b.c.subarray(0, b.n * 12), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buf.aLocal);
  gl.bufferData(gl.ARRAY_BUFFER, b.l.subarray(0, b.n * 8), gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buf.aCol);
  gl.bufferData(gl.ARRAY_BUFFER, b.col.subarray(0, b.n * 12), gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buf.aInfo);
  gl.bufferData(gl.ARRAY_BUFFER, b.inf.subarray(0, b.n * 16), gl.DYNAMIC_DRAW);
  b.mesh.count = b.n * 6;
}
function drawSprites(prog, b) {
  if (b.n === 0) return;
  var k, loc;
  var names = { aCenter: 3, aLocal: 2, aCol: 3, aInfo: 4 };
  for (k in names) {
    loc = prog.a[k];
    if (loc === undefined || loc < 0) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf[k]);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, names[k], gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.ibo);
  gl.drawElements(gl.TRIANGLES, b.mesh.count, b.mesh.type, 0);
  drawCallCount++;
}
