/* ---------------------------------------------------------------- 数学 */
function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function smoothstep(a, b, x) {
  var t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
var DEG = Math.PI / 180;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function m4mul(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3],
    a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11],
    a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  for (var i = 0; i < 4; i++) {
    var b0 = b[i * 4],
      b1 = b[i * 4 + 1],
      b2 = b[i * 4 + 2],
      b3 = b[i * 4 + 3];
    out[i * 4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[i * 4 + 1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[i * 4 + 2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[i * 4 + 3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  }
  return out;
}

function m4perspective(fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy * 0.5),
    nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}

function m4lookAt(eye, center, up) {
  var zx = eye[0] - center[0],
    zy = eye[1] - center[1],
    zz = eye[2] - center[2];
  var zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl;
  zy /= zl;
  zz /= zl;
  var xx = up[1] * zz - up[2] * zy,
    xy = up[2] * zx - up[0] * zz,
    xz = up[0] * zy - up[1] * zx;
  var xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl;
  xy /= xl;
  xz /= xl;
  var yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx;
  return new Float32Array([
    xx,
    yx,
    zx,
    0,
    xy,
    yy,
    zy,
    0,
    xz,
    yz,
    zz,
    0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function basisFrom(eye, center) {
  var f = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]];
  var fl = Math.hypot(f[0], f[1], f[2]) || 1;
  f[0] /= fl;
  f[1] /= fl;
  f[2] /= fl;
  var r = [f[2], 0, -f[0]];
  var rl = Math.hypot(r[0], r[2]) || 1;
  r[0] /= rl;
  r[2] /= rl;
  var u = [
    r[1] * f[2] - r[2] * f[1],
    r[2] * f[0] - r[0] * f[2],
    r[0] * f[1] - r[1] * f[0],
  ];
  return { fwd: f, right: r, up: u };
}

function m4model(tx, ty, tz, ry, s) {
  var c = Math.cos(ry) * s,
    n = Math.sin(ry) * s;
  return new Float32Array([c, 0, -n, 0, 0, s, 0, 0, n, 0, c, 0, tx, ty, tz, 1]);
}

/* 以 +Y 为局部主轴构造旋转矩阵（用于剑、旗杆等斜置物件） */
function m4axis(pos, dir, upHint, scale) {
  var y = [dir[0], dir[1], dir[2]];
  var yl = Math.hypot(y[0], y[1], y[2]) || 1;
  y[0] /= yl;
  y[1] /= yl;
  y[2] /= yl;
  var x = [
    upHint[1] * y[2] - upHint[2] * y[1],
    upHint[2] * y[0] - upHint[0] * y[2],
    upHint[0] * y[1] - upHint[1] * y[0],
  ];
  var xl = Math.hypot(x[0], x[1], x[2]) || 1;
  x[0] /= xl;
  x[1] /= xl;
  x[2] /= xl;
  var z = [
    x[1] * y[2] - x[2] * y[1],
    x[2] * y[0] - x[0] * y[2],
    x[0] * y[1] - x[1] * y[0],
  ];
  var s = scale || 1;
  return new Float32Array([
    x[0] * s,
    x[1] * s,
    x[2] * s,
    0,
    y[0] * s,
    y[1] * s,
    y[2] * s,
    0,
    z[0] * s,
    z[1] * s,
    z[2] * s,
    0,
    pos[0],
    pos[1],
    pos[2],
    1,
  ]);
}
function xf(M, p) {
  return [
    M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12],
    M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13],
    M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14],
  ];
}

/* ---------------------------------------------------------------- 噪声 */
function makeNoise(seed) {
  var perm = new Uint8Array(256),
    p = new Uint8Array(512),
    i,
    j,
    t,
    s = seed >>> 0;
  function rnd() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  }
  for (i = 0; i < 256; i++) perm[i] = i;
  for (i = 255; i > 0; i--) {
    j = (rnd() * (i + 1)) | 0;
    t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  for (i = 0; i < 512; i++) p[i] = perm[i & 255];
  function noise(x, y) {
    var xi = Math.floor(x),
      yi = Math.floor(y),
      xf = x - xi,
      yf = y - yi;
    var u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf);
    var X = xi & 255,
      Y = yi & 255;
    var aa = p[(p[X] + Y) & 255] / 255,
      ba = p[(p[(X + 1) & 255] + Y) & 255] / 255;
    var ab = p[(p[X] + ((Y + 1) & 255)) & 255] / 255,
      bb = p[(p[(X + 1) & 255] + ((Y + 1) & 255)) & 255] / 255;
    var m1 = aa + (ba - aa) * u,
      m2 = ab + (bb - ab) * u;
    return m1 + (m2 - m1) * v;
  }
  function fbm(x, y, oct) {
    var a = 0.5,
      sum = 0;
    for (var k = 0; k < oct; k++) {
      sum += a * noise(x, y);
      x *= 2.03;
      y *= 2.03;
      a *= 0.5;
    }
    return sum;
  }
  return { noise: noise, fbm: fbm };
}
var N1 = makeNoise(112358);
var N2 = makeNoise(271828);
var RND = mulberry32(19880); /* 布景随机，固定种子保证每次一致 */
