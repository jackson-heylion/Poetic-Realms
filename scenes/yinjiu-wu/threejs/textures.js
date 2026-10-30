// 程序化贴图：全部用 canvas 现画，不引用任何外部图像
function paint(size, draw) {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = canvas2d.height = size;
  const ctx = canvas2d.getContext("2d");
  draw(ctx, size);
  const map = new THREE.CanvasTexture(canvas2d);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
  return map;
}
function noiseFill(ctx, size, base, spread, grain) {
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = fbm(x * grain, y * grain) * 0.7 + fbm(x * grain * 4.3, y * grain * 4.3) * 0.3;
      const i = (y * size + x) * 4;
      img.data[i] = clamp(base[0] + (n - 0.5) * spread[0], 0, 255);
      img.data[i + 1] = clamp(base[1] + (n - 0.5) * spread[1], 0, 255);
      img.data[i + 2] = clamp(base[2] + (n - 0.5) * spread[2], 0, 255);
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}
// 草地：秋日枯黄与残绿相间
const groundTexture = paint(512, (ctx, size) => {
  noiseFill(ctx, size, [104, 108, 62], [70, 66, 54], 0.09);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 900; i++) {
    const x = random() * size,
      y = random() * size;
    ctx.strokeStyle = random() > 0.45 ? "#8b8a4c" : "#5f6b38";
    ctx.lineWidth = 0.7 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 9, y - 3 - random() * 7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
});
groundTexture.repeat.set(46, 46);
// 木板：篱笆与廊柱
const woodTexture = paint(256, (ctx, size) => {
  ctx.fillStyle = "#6b5334";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${60 + random() * 60},${44 + random() * 44},${24 + random() * 30},${0.25 + random() * 0.4})`;
    ctx.lineWidth = 0.6 + random() * 2.4;
    const x = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < size; y += 12) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 2.2, y);
    ctx.stroke();
  }
});
woodTexture.repeat.set(1, 3);
// 茅草：屋顶与斗笠
const thatchTexture = paint(512, (ctx, size) => {
  noiseFill(ctx, size, [150, 126, 78], [96, 84, 70], 0.05);
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 2600; i++) {
    const x = random() * size,
      y = random() * size;
    ctx.strokeStyle = random() > 0.5 ? "#c8ab6d" : "#7d6a3c";
    ctx.lineWidth = 0.8 + random() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 26, y + (random() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
});
thatchTexture.repeat.set(5, 3);
// 夯土墙：微黄带斑驳
const plasterTexture = paint(256, (ctx, size) => {
  noiseFill(ctx, size, [186, 168, 132], [64, 58, 52], 0.06);
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = random() > 0.5 ? "#9c8763" : "#d8c8a4";
    ctx.beginPath();
    ctx.ellipse(random() * size, random() * size, 2 + random() * 9, 1.5 + random() * 6, random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
});
// 花瓣：半透明白瓣带淡脉络
const petalTexture = paint(64, (ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createLinearGradient(0, size, 0, 0);
  g.addColorStop(0, "rgba(255,252,238,0.15)");
  g.addColorStop(0.55, "rgba(255,250,235,0.92)");
  g.addColorStop(1, "rgba(255,247,222,0.98)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.62, size * 0.24, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(214,196,150,0.5)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.24);
  ctx.lineTo(size / 2, size * 0.98);
  ctx.stroke();
});
// 浮尘 / 逆光颗粒
const moteTexture = paint(64, (ctx, size) => {
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,240,210,0.95)");
  g.addColorStop(0.35, "rgba(255,228,180,0.45)");
  g.addColorStop(1, "rgba(255,220,170,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
});
// 云翳：投在地面的慢移暗影（作为 lightMap）
const cloudShadowTexture = paint(512, (ctx, size) => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = fbm(x * 0.012, y * 0.012) * 0.68 + fbm(x * 0.045 + 4, y * 0.045 - 2) * 0.32;
      const shade = clamp(1 - smoothstep(0.42, 0.72, n) * 0.55, 0.35, 1);
      const i = (y * size + x) * 4;
      const v = 255 * shade;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    }
  ctx.putImageData(img, 0, 0);
});
cloudShadowTexture.repeat.set(2.4, 2.4);
// 雾带：横向柔和的白色渐隐，用作山岚
const mistTexture = paint(256, (ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const vertical = Math.sin((y / size) * Math.PI);
      const lateral = Math.sin((x / size) * Math.PI);
      const n = 0.55 + 0.45 * fbm(x * 0.02, y * 0.05);
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 246;
      img.data[i + 2] = 232;
      img.data[i + 3] = clamp(255 * vertical * vertical * lateral * lateral * n, 0, 255);
    }
  ctx.putImageData(img, 0, 0);
});
// 高空薄云：白色的絮状团块
const cloudTexture = paint(256, (ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = fbm(x * 0.02 + 12, y * 0.035 - 3);
      const lateral = Math.sin((x / size) * Math.PI);
      const vertical = Math.sin((y / size) * Math.PI);
      const a = smoothstep(0.44, 0.78, n) * lateral * vertical;
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 238;
      img.data[i + 2] = 218;
      img.data[i + 3] = clamp(255 * a * 0.85, 0, 255);
    }
  ctx.putImageData(img, 0, 0);
});
// 夕照光晕：太阳附近的柔光
const glowTexture = paint(256, (ctx, size) => {
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,236,196,0.98)");
  g.addColorStop(0.16, "rgba(255,206,138,0.66)");
  g.addColorStop(0.45, "rgba(255,182,112,0.24)");
  g.addColorStop(1, "rgba(255,170,100,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
});
