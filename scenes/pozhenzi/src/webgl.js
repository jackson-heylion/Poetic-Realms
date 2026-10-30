var veil = document.getElementById("veil");
var errEl = document.getElementById("err");

function fail(msg) {
  var t = document.querySelector("#veil .t");
  var l = document.querySelector("#veil .line");
  if (t) t.style.display = "none";
  if (l) l.style.display = "none";
  errEl.style.display = "block";
  errEl.textContent = msg;
  veil.classList.remove("hide");
  document.getElementById("retry").hidden = false;
}
if (window.self !== window.top) document.documentElement.classList.add("embed");
document.getElementById("retry").addEventListener("click", function () {
  location.reload();
});
window.addEventListener(
  "error",
  function (e) {
    fail("场景初始化失败：" + (e && e.message ? e.message : "未知错误"));
  },
  false,
);

/* ---------------------------------------------------------------- WebGL */
var canvas = document.createElement("canvas");
canvas.setAttribute("aria-label", "灯下长剑、月色军帐与随风旌旗的三维夜景");
document.getElementById("stage").appendChild(canvas);
var drawCallCount = 0;

var glOpts = {
  antialias: false,
  alpha: false,
  depth: true,
  stencil: false,
  premultipliedAlpha: false,
  powerPreference: "high-performance",
};
var gl =
  canvas.getContext("webgl2", glOpts) ||
  canvas.getContext("webgl", glOpts) ||
  canvas.getContext("experimental-webgl", glOpts);
if (!gl) {
  fail(
    "这台设备的浏览器没有可用的 WebGL，场景无法启动。请换用新版 Chrome / Safari / Edge，或在设置里开启硬件加速。",
  );
  return;
}

var isGL2 =
  typeof WebGL2RenderingContext !== "undefined" &&
  gl instanceof WebGL2RenderingContext;
var canU32 = isGL2 || !!gl.getExtension("OES_element_index_uint");
var IDX_TYPE = canU32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;

canvas.addEventListener(
  "webglcontextlost",
  function (e) {
    e.preventDefault();
    running = false;
    fail(
      "图形上下文丢失（切换显卡或系统休眠可能导致）。请刷新页面重新载入夜营。",
    );
  },
  false,
);
canvas.addEventListener("webglcontextrestored", function () {
  location.reload();
});

function compileShader(type, src, tag) {
  var sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(tag + " 着色器编译失败：" + gl.getShaderInfoLog(sh));
  }
  return sh;
}

function makeProgram(vsSrc, fsSrc, tag) {
  var p = gl.createProgram();
  gl.attachShader(p, compileShader(gl.VERTEX_SHADER, vsSrc, tag + "/vs"));
  gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fsSrc, tag + "/fs"));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(tag + " 程序链接失败：" + gl.getProgramInfoLog(p));
  }
  var u = {},
    a = {},
    i,
    info;
  var nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (i = 0; i < nu; i++) {
    info = gl.getActiveUniform(p, i);
    u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name);
  }
  var na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
  for (i = 0; i < na; i++) {
    info = gl.getActiveAttrib(p, i);
    a[info.name] = gl.getAttribLocation(p, info.name);
  }
  return { prog: p, u: u, a: a, tag: tag };
}

function bind(prog) {
  gl.useProgram(prog.prog);
}

function setU(prog, obj) {
  for (var k in obj) {
    var loc = prog.u[k];
    if (!loc) continue;
    var v = obj[k];
    if (typeof v === "number") gl.uniform1f(loc, v);
    else if (v.length === 2) gl.uniform2fv(loc, v);
    else if (v.length === 3) gl.uniform3fv(loc, v);
    else if (v.length === 4) gl.uniform4fv(loc, v);
    else if (v.length === 16) gl.uniformMatrix4fv(loc, false, v);
  }
}
