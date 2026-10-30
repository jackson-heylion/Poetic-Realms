/* ------------------------------------------------------- 地形高度 */
function groundH(x, z) {
  var camp = smoothstep(5, 25, Math.hypot(x * 0.9, z + 2));
  var n =
    (N1.fbm(x * 0.03 + 3.1, z * 0.03 + 7.4, 4) - 0.5) * 2.6 +
    (N2.fbm(x * 0.1, z * 0.1, 3) - 0.5) * 0.55;
  n *= 0.28 + 0.72 * camp;
  var rise =
    smoothstep(34, 110, Math.hypot(x, z + 6)) *
    3.4 *
    (0.45 + N2.fbm(x * 0.012, z * 0.012, 3));
  return n * 0.55 + rise - 0.05;
}

/* ------------------------------------------------------- 地形网格 */
function buildTerrain() {
  var NX = isSmall ? 104 : 152,
    NZ = NX,
    X0 = -115,
    X1 = 115,
    Z0 = -135,
    Z1 = 45;
  var nv = (NX + 1) * (NZ + 1);
  var pos = new Float32Array(nv * 3),
    nrm = new Float32Array(nv * 3),
    col = new Float32Array(nv * 3),
    uv = new Float32Array(nv * 2);
  var idx = new Uint32Array(NX * NZ * 6);
  var i,
    j,
    k = 0,
    vi = 0;
  var earth = [0.07, 0.058, 0.045],
    grass = [0.052, 0.06, 0.036],
    dirt = [0.115, 0.098, 0.076],
    stone = [0.105, 0.1, 0.092];
  for (j = 0; j <= NZ; j++) {
    var z = Z0 + ((Z1 - Z0) * j) / NZ;
    for (i = 0; i <= NX; i++) {
      var x = X0 + ((X1 - X0) * i) / NX;
      var y = groundH(x, z);
      var e = 0.45;
      var hx = groundH(x + e, z) - groundH(x - e, z);
      var hz = groundH(x, z + e) - groundH(x, z - e);
      var nx = -hx / (2 * e),
        ny = 1,
        nz = -hz / (2 * e);
      var nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl;
      ny /= nl;
      nz /= nl;
      var n1 = N1.fbm(x * 0.14, z * 0.14, 3),
        n2 = N2.fbm(x * 0.55, z * 0.55, 3);
      var slope = 1.0 - ny;
      var path =
        Math.exp(-Math.pow((x - 0.55 * Math.sin(z * 0.055) - 0.4) / 1.55, 2)) *
        smoothstep(18, 2, z) *
        0.85;
      var c = [0, 0, 0];
      for (var q = 0; q < 3; q++) {
        var base = lerp(earth[q], grass[q], smoothstep(0.42, 0.72, n1));
        base = lerp(base, stone[q], smoothstep(0.28, 0.62, slope) * 0.8);
        base = lerp(base, dirt[q], path);
        c[q] = base * (0.78 + 0.44 * n2);
      }
      pos[vi * 3] = x;
      pos[vi * 3 + 1] = y;
      pos[vi * 3 + 2] = z;
      nrm[vi * 3] = nx;
      nrm[vi * 3 + 1] = ny;
      nrm[vi * 3 + 2] = nz;
      col[vi * 3] = c[0];
      col[vi * 3 + 1] = c[1];
      col[vi * 3 + 2] = c[2];
      uv[vi * 2] = i / NX;
      uv[vi * 2 + 1] = j / NZ;
      vi++;
    }
  }
  for (j = 0; j < NZ; j++) {
    for (i = 0; i < NX; i++) {
      var a = j * (NX + 1) + i,
        b = a + 1,
        c2 = a + NX + 1,
        d = c2 + 1;
      idx[k++] = a;
      idx[k++] = c2;
      idx[k++] = b;
      idx[k++] = b;
      idx[k++] = c2;
      idx[k++] = d;
    }
  }
  return uploadMesh({ aPos: pos, aNrm: nrm, aCol: col, aUv: uv }, idx);
}

/* ------------------------------------------------------- 远山 */
function buildMountains() {
  var m = Mesh();
  function ridge(z, hMin, hMax, col, seedOff) {
    var seg = 64,
      x0 = -230,
      x1 = 230,
      top = [],
      base = [];
    for (var i = 0; i <= seg; i++) {
      var x = x0 + ((x1 - x0) * i) / seg;
      var n = N2.fbm(x * 0.01 + seedOff, 3.7, 4);
      var n2 = N1.fbm(x * 0.035 + seedOff * 2.0, 8.2, 3);
      var h = hMin + (hMax - hMin) * (n * 0.85 + n2 * 0.45);
      top.push([x, h, z]);
      base.push([x, -2, z]);
    }
    for (var j = 0; j < seg; j++) {
      var shade = 0.72 + 0.28 * Math.sin(j * 0.7 + seedOff);
      flatQuad(m, base[j], base[j + 1], top[j + 1], top[j], [
        col[0] * shade,
        col[1] * shade,
        col[2] * shade,
      ]);
    }
  }
  ridge(-118, 5, 21, [0.045, 0.052, 0.062], 1.3);
  ridge(-172, 12, 34, [0.038, 0.045, 0.058], 4.7);
  ridge(-235, 20, 52, [0.033, 0.04, 0.052], 9.1);
  return uploadMesh({ aPos: m.p, aNrm: m.n, aCol: m.c, aUv: m.u }, m.i);
}
