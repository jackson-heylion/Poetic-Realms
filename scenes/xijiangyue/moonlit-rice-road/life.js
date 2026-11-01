/* 生息：流萤与蝉蛙之声。 */

const Life = (() => {
  let flies = null;
  let flyData = [];
  const flyMax = 120;
  let flyCount = 78;

  function flyTexture() {
    return U.texture(64, 64, function (ctx, w, h) {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(226,255,180,1)");
      g.addColorStop(0.25, "rgba(196,255,140,0.55)");
      g.addColorStop(1, "rgba(150,220,110,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function buildFlies(scene) {
    const rng = U.rng(77113);
    const pos = new Float32Array(flyMax * 3);
    const alpha = new Float32Array(flyMax);
    const size = new Float32Array(flyMax);
    for (let i = 0; i < flyMax; i++) {
      const x = -13 + rng() * 26;
      const z = -26 + rng() * 33;
      const y = 0.55 + rng() * 1.7;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      size[i] = 2.2 + rng() * 3.4;
      alpha[i] = 0;
      flyData.push({
        base: [x, y, z],
        phase: rng() * 6.283,
        speed: 0.16 + rng() * 0.34,
        radius: 0.6 + rng() * 2.2,
        blink: 0.5 + rng() * 1.7,
        dim: 0.5 + rng() * 0.5,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setDrawRange(0, flyCount);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: {
        uPixelRatio: { value: 1 },
      },
      vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        uniform float uPixelRatio;
        varying float vAlpha;
        varying float vFog;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * (16.0 / max(-mv.z, 1.0));
          vAlpha = aAlpha;
          vFog = smoothstep(38.0, 190.0, -mv.z);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vFog;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          a *= a;
          vec3 col = mix(vec3(0.78, 1.0, 0.62), vec3(0.42, 0.62, 0.55), vFog);
          gl_FragColor = vec4(col, a * vAlpha * (1.0 - vFog * 0.75));
        }
      `,
    });
    flies = new THREE.Points(geo, mat);
    flies.frustumCulled = false;
    scene.add(flies);
  }

  /* ── 声音：全部合成，不加载音频文件 ── */
  const Sound = {
    ctx: null,
    master: null,
    on: false,
    frogTimer: 0,
    noise: null,

    makeNoise(ctx) {
      const len = Math.floor(ctx.sampleRate * 2);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
      return buf;
    },

    init() {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      this.noise = this.makeNoise(ctx);

      /* 蝉：三路窄带噪声，快速调幅 */
      const layers = [
        [3300, 5.2, 0.5, 57],
        [4400, 6.4, 0.34, 64],
        [5600, 7.0, 0.2, 71],
      ];
      for (const [freq, q, level, rate] of layers) {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freq;
        bp.Q.value = q;
        const gain = ctx.createGain();
        gain.gain.value = level * 0.5;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = rate;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = level * 0.45;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        src.connect(bp);
        bp.connect(gain);
        gain.connect(this.master);
        src.start();
        lfo.start();
      }

      /* 蝉声整体缓慢起伏 */
      const swell = ctx.createOscillator();
      swell.type = "sine";
      swell.frequency.value = 0.06;
      const swellGain = ctx.createGain();
      swellGain.gain.value = 0.06;
      swell.connect(swellGain);
      swellGain.connect(this.master.gain);
      swell.start();

      this.scheduleFrogs();
      return true;
    },

    croak(pitch, when, dur, level) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = pitch;
      bp.Q.value = 9;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(level, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.master);
      src.start(when, Math.random(), dur + 0.05);
      src.stop(when + dur + 0.04);
    },

    scheduleFrogs() {
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;
      const near = Math.random() > 0.4;
      const count = 1 + Math.floor(Math.random() * 3);
      const pitch = near ? 620 + Math.random() * 320 : 380 + Math.random() * 160;
      const level = near ? 0.16 : 0.07;
      for (let i = 0; i < count; i++) {
        this.croak(pitch * (0.94 + Math.random() * 0.12), now + i * 0.11, 0.07, level);
      }
      this.frogTimer = setTimeout(
        () => this.scheduleFrogs(),
        900 + Math.random() * 2600,
      );
    },

    setOn(next) {
      this.on = next;
      if (next) {
        if (!this.init()) return false;
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0.17, this.ctx.currentTime, 0.5);
      } else if (this.ctx) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
      }
      return true;
    },
  };

  return {
    build(scene) {
      buildFlies(scene);
    },

    setQuality(q) {
      if (!flies) return;
      flyCount = Math.min(flyMax, q.flies);
      flies.geometry.setDrawRange(0, flyCount);
    },

    toggleSound() {
      return Sound.setOn(!Sound.on);
    },

    soundOn() {
      return Sound.on;
    },

    update(dt, t) {
      if (!flies) return;
      flies.material.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio || 1,
        S.dprCap,
      );
      const pos = flies.geometry.attributes.position;
      const alpha = flies.geometry.attributes.aAlpha;
      for (let i = 0; i < flyCount; i++) {
        const f = flyData[i];
        const a = t * f.speed + f.phase;
        pos.setXYZ(
          i,
          f.base[0] + Math.sin(a) * f.radius + Math.sin(a * 2.3) * 0.3,
          f.base[1] + Math.sin(a * 1.4 + 1.1) * 0.45,
          f.base[2] + Math.cos(a * 0.8) * f.radius * 0.8,
        );
        const blink = Math.sin(t * f.blink + f.phase * 3.1);
        const pulse = blink > 0.3 ? (blink - 0.3) / 0.7 : 0;
        alpha.setX(i, pulse * pulse * f.dim);
      }
      pos.needsUpdate = true;
      alpha.needsUpdate = true;
    },
  };
})();
