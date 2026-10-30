function texture(draw, width = 256, height = width, color = true) {
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  draw(surface.getContext("2d"), width, height);
  const map = new THREE.CanvasTexture(surface);
  map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return map;
}
const clothMap = texture((context, width, height) => {
  context.fillStyle = "#aaa38f";
  context.fillRect(0, 0, width, height);
  const rnd = seed(88);
  for (let y = 0; y < height; y += 2) {
    context.strokeStyle = y % 4 ? "#77715c40" : "#ddd4b04d";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y + 0.6);
    context.stroke();
  }
  for (let x = 0; x < width; x += 3) {
    context.strokeStyle = "#4c453321";
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 0.6, height);
    context.stroke();
  }
  for (let i = 0; i < 900; i++) {
    context.fillStyle = `rgba(55,44,25,${rnd() * 0.08})`;
    context.fillRect(
      rnd() * width,
      rnd() * height,
      1 + rnd() * 10,
      1 + rnd() * 3,
    );
  }
});
const woodMap = texture(
  (context, width, height) => {
    context.fillStyle = "#4e3827";
    context.fillRect(0, 0, width, height);
    const rnd = seed(765);
    for (let y = 0; y < height; y++) {
      context.strokeStyle = `rgba(${rnd() > 0.4 ? "151,111,65" : "20,16,13"},${0.08 + rnd() * 0.24})`;
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= width; x += 12)
        context.lineTo(x, y + Math.sin(x * 0.03 + y * 0.06) * 3);
      context.stroke();
    }
  },
  512,
  256,
);
woodMap.repeat.set(2, 1);
const groundMap = texture((context, width, height) => {
  const rnd = seed(96);
  context.fillStyle = "#4b4134";
  context.fillRect(0, 0, width, height);
  for (let i = 0; i < 25000; i++) {
    const light = rnd() > 0.5;
    context.fillStyle = light
      ? `rgba(170,151,109,${rnd() * 0.23})`
      : `rgba(23,25,24,${rnd() * 0.3})`;
    const r = 0.3 + rnd() * 2.4;
    context.fillRect(rnd() * width, rnd() * height, r, r * 0.6);
  }
}, 512);
groundMap.repeat.set(34, 34);
const wood = new THREE.MeshStandardMaterial({
  map: woodMap,
  roughness: 0.86,
  bumpMap: woodMap,
  bumpScale: 0.025,
});
const bronze = new THREE.MeshStandardMaterial({
  color: 0x77623b,
  metalness: 0.83,
  roughness: 0.4,
});
const blackIron = new THREE.MeshStandardMaterial({
  color: 0x202227,
  metalness: 0.72,
  roughness: 0.66,
});
const ropeMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d7957,
  roughness: 1,
});
const glowMap = texture((context, width, height) => {
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    width / 2,
  );
  gradient.addColorStop(0, "rgba(255,243,190,1)");
  gradient.addColorStop(0.12, "rgba(255,190,80,.75)");
  gradient.addColorStop(0.42, "rgba(232,118,32,.2)");
  gradient.addColorStop(1, "rgba(180,70,16,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}, 128);
const flameMap = texture(
  (context, width, height) => {
    const gradient = context.createRadialGradient(
      width * 0.5,
      height * 0.68,
      1,
      width * 0.5,
      height * 0.55,
      width * 0.46,
    );
    gradient.addColorStop(0, "#fff6ce");
    gradient.addColorStop(0.2, "#ffda83");
    gradient.addColorStop(0.55, "#e8791aab");
    gradient.addColorStop(1, "#aa301100");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(width * 0.5, 0);
    context.bezierCurveTo(
      width * 0.72,
      height * 0.42,
      width * 0.96,
      height * 0.65,
      width * 0.68,
      height * 0.91,
    );
    context.bezierCurveTo(
      width * 0.2,
      height * 1.12,
      width * 0.12,
      height * 0.53,
      width * 0.5,
      0,
    );
    context.fill();
  },
  64,
  128,
);
const smokeMap = texture((context, width, height) => {
  const rnd = seed(107);
  for (let i = 0; i < 80; i++) {
    const x = width * (0.15 + rnd() * 0.7),
      y = height * (0.15 + rnd() * 0.7),
      r = width * (0.04 + rnd() * 0.17);
    const gradient = context.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(185,188,190,.075)");
    gradient.addColorStop(1, "rgba(170,178,190,0)");
    context.fillStyle = gradient;
    context.fillRect(x - r, y - r, r * 2, r * 2);
  }
}, 128);
const environmentMap = texture(
  (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#8fabc3");
    gradient.addColorStop(0.48, "#28394d");
    gradient.addColorStop(0.55, "#454b46");
    gradient.addColorStop(1, "#34281e");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#fff0c4";
    context.fillRect(width * 0.18, height * 0.42, width * 0.04, height * 0.025);
    context.fillStyle = "#b7d1e7";
    context.fillRect(width * 0.63, height * 0.12, width * 0.16, height * 0.035);
  },
  512,
  256,
);
environmentMap.mapping = THREE.EquirectangularReflectionMapping;
const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment =
  environmentGenerator.fromEquirectangular(environmentMap).texture;
environmentMap.dispose();
environmentGenerator.dispose();
