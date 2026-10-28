(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const state = {
    scroll: window.scrollY,
    vw: window.innerWidth,
    vh: window.innerHeight,
    mouse: { x: -9999, y: -9999, active: false },
    time: 0,
  };

  // ---------------------------------------------------------------- split text
  document.querySelectorAll("[data-split]").forEach((el) => {
    let i = 0;
    el.querySelectorAll(".line").forEach((line) => {
      const words = line.textContent.trim().split(/\s+/);
      line.textContent = "";
      words.forEach((w, n) => {
        const word = document.createElement("span");
        word.className = "word";
        const inner = document.createElement("span");
        inner.textContent = w;
        inner.style.setProperty("--i", i++);
        word.appendChild(inner);
        line.appendChild(word);
        if (n < words.length - 1) line.appendChild(document.createTextNode(" "));
      });
    });
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  });

  // ---------------------------------------------------------------- reveals
  const revealTargets = document.querySelectorAll("[data-reveal], [data-split]");
  const groupDelay = new Map();
  revealTargets.forEach((el) => {
    const parent = el.parentElement;
    const n = groupDelay.get(parent) || 0;
    groupDelay.set(parent, n + 1);
    if (el.matches("[data-reveal]")) el.style.setProperty("--d", `${Math.min(n, 6) * 90}ms`);
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        revealObserver.unobserve(e.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

  // ---------------------------------------------------------------- intro
  const startPage = () => {
    document.body.classList.remove("is-loading");
    revealTargets.forEach((el) => revealObserver.observe(el));
  };
  const introSeen = sessionStorage.getItem("dmr-intro") === "1";
  const counter = document.querySelector("[data-intro-count]");
  if (reduceMotion || introSeen) {
    startPage();
  } else {
    const t0 = performance.now();
    const dur = 1050;
    const tick = (now) => {
      const p = clamp((now - t0) / dur);
      counter.textContent = String(Math.round(easeInOut(p) * 16)).padStart(2, "0");
      if (p < 1) requestAnimationFrame(tick);
      else {
        sessionStorage.setItem("dmr-intro", "1");
        setTimeout(startPage, 140);
      }
    };
    requestAnimationFrame(tick);
  }

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---------------------------------------------------------------- pointer
  window.addEventListener("pointermove", (e) => {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.mouse.active = e.pointerType === "mouse";
  }, { passive: true });
  document.addEventListener("pointerleave", () => { state.mouse.active = false; });

  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
        btn.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.32}px`);
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }
  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
  });

  // ---------------------------------------------------------------- nav
  const nav = document.querySelector("[data-nav]");
  const navLinks = [...document.querySelectorAll(".nav__links a")];
  const linkTargets = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
  let lastScroll = window.scrollY;
  const updateNav = () => {
    const y = state.scroll;
    nav.classList.toggle("is-scrolled", y > 24);
    const goingDown = y > lastScroll + 4;
    const goingUp = y < lastScroll - 4;
    if (goingDown && y > state.vh * 0.6 && !nav.contains(document.activeElement)) nav.classList.add("is-hidden");
    else if (goingUp || y < state.vh * 0.6) nav.classList.remove("is-hidden");
    if (goingDown || goingUp) lastScroll = y;
    let current = -1;
    linkTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < state.vh * 0.45) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle("is-current", i === current));
  };

  // ---------------------------------------------------------------- counters
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countObserver.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
      const t0 = performance.now();
      const dur = 1600;
      const step = (now) => {
        const p = clamp((now - t0) / dur);
        const v = target * (1 - Math.pow(1 - p, 4));
        el.textContent = v.toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => countObserver.observe(el));

  // ---------------------------------------------------------------- chain
  const chain = document.querySelector("[data-chain]");
  const chainItems = chain ? [...chain.children] : [];
  const updateChain = () => {
    if (!chain) return;
    const r = chain.getBoundingClientRect();
    const p = reduceMotion ? 1 : clamp((state.vh * 0.82 - r.top) / (state.vh * 0.5));
    chain.style.setProperty("--p", p.toFixed(4));
    chainItems.forEach((li, i) => li.classList.toggle("is-lit", p >= i / (chainItems.length - 1) - 0.001 && p > 0));
  };

  // ---------------------------------------------------------------- faq height animation
  document.querySelectorAll(".faq details").forEach((d) => {
    const summary = d.querySelector("summary");
    const body = d.querySelector(".faq__body");
    summary.addEventListener("click", (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        const a = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 420, easing: "cubic-bezier(.65,0,.35,1)" });
        a.onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 560, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
  });

  // ================================================================ DOT FIELD (WebGL)
  // Ports paint_spatial_backdrop() from the desktop app to the GPU and adds
  // perspective tilt, cursor repulsion, and audio-style ripples.
  const field = (() => {
    const canvas = document.querySelector("[data-field]");
    const gl = canvas && canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl) return null;

    const SPACING = 22;
    const MAX_RIPPLES = 6;
    const dotVS = `
      precision highp float;
      attribute vec2 a_grid;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_tilt;
      uniform float u_intensity;
      uniform float u_dpr;
      uniform vec4 u_ripples[${MAX_RIPPLES}];
      varying float v_alpha;
      varying float v_glow;
      const float F = 950.0;
      void main() {
        float col = a_grid.x;
        float row = a_grid.y;
        float t = u_time;
        // plane coordinates (css px), centred
        vec2 base = vec2(col, row) * ${SPACING.toFixed(1)};
        float wave = sin(col * 0.30 + row * 0.18 + t);
        float slowCol = sin(col * 0.52 + t * 0.42);
        float drift = cos(col * 0.14 - row * 0.24 - t * 0.72);
        vec2 p = base + vec2(wave * 5.0 + slowCol * 2.2, drift * 3.7);

        float h = (wave * 0.6 + drift * 0.4) * 16.0;
        float glow = 0.0;
        for (int i = 0; i < ${MAX_RIPPLES}; i++) {
          vec4 r = u_ripples[i];
          float age = t - r.z;
          if (r.w > 0.0 && age > 0.0) {
            float radius = age * 260.0;
            float d = length(p - r.xy);
            float band = exp(-pow((d - radius) / 46.0, 2.0)) * exp(-age * 0.55) * r.w;
            h += band * 34.0;
            glow += band;
          }
        }

        float s = sin(u_tilt);
        float c = cos(u_tilt);
        float depth = -p.y * s;
        float persp = F / max(F + depth, 120.0);
        vec2 screen = vec2(p.x, p.y * c - h * s) * persp;
        screen.y += u_res.y * 0.5 + u_tilt * u_res.y * 0.18;
        screen.x += u_res.x * 0.5;

        // cursor repulsion in screen space
        vec2 dm = screen - u_mouse;
        float dist = length(dm);
        float m = 0.0;
        if (dist > 0.001 && dist < 210.0) {
          m = pow(1.0 - dist / 210.0, 2.0);
          screen += dm / dist * m * 16.0;
        }

        float shimmer = 0.5 + 0.5 * sin(col * 0.19 + row * 0.15 + t * 1.18);
        float lift = 0.55 + 0.45 * (0.5 + 0.5 * sin(col * 0.72 + t * 0.22));
        float alpha = (0.09 + shimmer * 0.2) * lift * 1.55;
        alpha += m * 0.55 + glow * 0.45;
        vec2 uv = (screen / u_res) * 2.0 - 1.0;
        float vig = 1.0 - smoothstep(0.55, 1.25, length(uv * vec2(1.0, 1.15)));
        float fog = smoothstep(0.32, 0.75, persp);
        v_alpha = clamp(alpha, 0.0, 1.0) * vig * fog * u_intensity;
        v_glow = clamp(m * 1.3 + glow * 1.2, 0.0, 1.0);

        gl_Position = vec4(uv.x, -uv.y, 0.0, 1.0);
        float radius = (0.72 + shimmer * 0.62) * (1.0 + m * 0.9 + glow * 0.8);
        gl_PointSize = max(1.0, radius * 2.4 * persp * u_dpr);
      }`;
    const dotFS = `
      precision mediump float;
      varying float v_alpha;
      varying float v_glow;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.18, d) * v_alpha;
        vec3 cyan = vec3(0.36, 0.8, 0.95);
        vec3 col = mix(vec3(1.0), cyan, v_glow);
        gl_FragColor = vec4(col * a, a);
      }`;
    const lineVS = `
      precision highp float;
      attribute vec2 a_line;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_alpha;
      varying float v_a;
      void main() {
        float x = a_line.x;
        float band = a_line.y;
        float y = u_res.y * (0.16 + band * 0.18) + sin(x * 0.015 + u_time * 1.8 + band * 0.9) * (7.0 + band * 1.2);
        vec2 uv = vec2(x, y) / u_res * 2.0 - 1.0;
        v_a = (0.035 + band * 0.008) * u_alpha;
        gl_Position = vec4(uv.x, -uv.y, 0.0, 1.0);
      }`;
    const lineFS = `
      precision mediump float;
      varying float v_a;
      void main() { gl_FragColor = vec4(v_a, v_a, v_a, v_a); }`;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const program = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    };
    // Logo sculpture: the three stacked wavefronts and diamond, built from particles.
    const logoVS = `
      precision highp float;
      attribute vec2 a_home;
      attribute vec3 a_color;
      attribute vec3 a_meta; // size, seed, kind
      uniform vec2 u_res;
      uniform vec2 u_center;
      uniform float u_scale;
      uniform float u_time;
      uniform float u_assemble;
      uniform float u_scatter;
      uniform float u_level;
      uniform vec2 u_mouse;
      uniform float u_dpr;
      uniform float u_alpha;
      uniform float u_bloom;
      varying vec3 v_color;
      varying float v_alpha;
      varying float v_soft;
      void main() {
        float seed = a_meta.y;
        float kind = a_meta.z;
        vec2 home = a_home;
        vec2 dc = home - vec2(-0.29, 0.008);
        float rd = length(dc);
        float cone = sin(rd * 8.0 - u_time * 3.4) * exp(-rd * 0.8);
        float still = kind > 1.5 ? 0.0 : 1.0;
        home += (dc / max(rd, 0.0001)) * cone * 0.016 * u_level * still;
        home += vec2(sin(u_time * 0.9 + seed * 40.0), cos(u_time * 0.8 + seed * 57.0)) * 0.0045 * still;

        vec2 p = u_center + home * u_scale;

        float stagger = fract(seed * 13.17) * 0.55 + (home.x + 1.0) * 0.12;
        float a = clamp((u_assemble * 1.7 - stagger) / 0.9, 0.0, 1.0);
        a = 1.0 - pow(1.0 - a, 4.0);
        float ang = seed * 6.2831 * 7.0;
        vec2 dir = vec2(cos(ang), sin(ang));
        float far = 0.45 + fract(seed * 91.7);
        p += dir * (1.0 - a) * (1.0 - a) * 1100.0 * far;
        p += vec2(-dir.y, dir.x) * (1.0 - a) * 260.0;

        float sc = u_scatter;
        p += (dir * vec2(1.25, 0.8) + vec2(0.0, -0.35)) * sc * sc * 900.0 * (0.25 + fract(seed * 37.3));

        vec2 dm = p - u_mouse;
        float dist = length(dm);
        float m = 0.0;
        if (dist > 0.001 && dist < 170.0) {
          m = pow(1.0 - dist / 170.0, 2.0);
          vec2 n = dm / dist;
          p += (n * 26.0 + vec2(-n.y, n.x) * 18.0) * m;
        }

        vec2 uv = p / u_res * 2.0 - 1.0;
        gl_Position = vec4(uv.x, -uv.y, 0.0, 1.0);
        float rim = kind > 0.5 && kind < 1.5 ? 1.0 : 0.0;
        float diamond = kind > 1.5 ? 1.0 : 0.0;
        float twinkle = 0.75 + 0.25 * sin(u_time * (1.5 + fract(seed * 7.0) * 2.0) + seed * 30.0);
        float pulseLit = max(cone, 0.0) * u_level;
        v_color = mix(a_color, vec3(0.85, 0.97, 1.0), m * 0.7 + pulseLit * 0.25);
        v_alpha = (0.8 + rim * 0.3 + diamond * 0.45) * twinkle * a * u_alpha * (1.0 - sc * 0.85) + m * 0.4;
        v_soft = diamond;
        v_alpha *= mix(1.0, 0.05, u_bloom);
        v_color *= 1.35;
        gl_PointSize = a_meta.x * mix(1.0, 7.0, u_bloom) * u_dpr * (1.0 + m * 0.8 + pulseLit * 0.35) * (u_scale / 330.0 * 0.6 + 0.4);
      }`;
    const logoFS = `
      precision mediump float;
      varying vec3 v_color;
      varying float v_alpha;
      varying float v_soft;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.12, d);
        float a = core * v_alpha;
        gl_FragColor = vec4(v_color * a, a);
      }`;

    let dots, lines, logo;
    try {
      dots = program(dotVS, dotFS);
      lines = program(lineVS, lineFS);
      logo = program(logoVS, logoFS);
    } catch (err) {
      console.warn("Dot field disabled:", err);
      return null;
    }
    const U = (p, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));
    const du = U(dots, ["u_res", "u_time", "u_mouse", "u_tilt", "u_intensity", "u_dpr", "u_ripples"]);
    const lu = U(lines, ["u_res", "u_time", "u_alpha"]);
    const ou = U(logo, ["u_res", "u_center", "u_scale", "u_time", "u_assemble", "u_scatter", "u_level", "u_mouse", "u_dpr", "u_alpha", "u_bloom"]);
    const logoBuf = gl.createBuffer();
    const logoData = buildLogoParticles();
    gl.bindBuffer(gl.ARRAY_BUFFER, logoBuf);
    gl.bufferData(gl.ARRAY_BUFFER, logoData, gl.STATIC_DRAW);
    const logoCount = logoData.length / 8;
    const logoState = { assemble: reduceMotion ? 1 : 0, started: reduceMotion, scatter: 0 };
    const dotBuf = gl.createBuffer();
    const lineBuf = gl.createBuffer();
    let dotCount = 0;
    let lineSteps = 0;
    let dpr = 1;
    const ripples = new Float32Array(MAX_RIPPLES * 4);
    let rippleIndex = 0;
    const live = { intensity: 1, tilt: 0 };
    const target = { intensity: 1, tilt: 0 };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, document.documentElement.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const halfCols = Math.ceil((w * 0.85) / SPACING) + 2;
      const rowsUp = Math.ceil((h * 2.6) / SPACING);
      const rowsDown = Math.ceil((h * 0.75) / SPACING);
      const pts = [];
      for (let r = -rowsUp; r <= rowsDown; r++) {
        for (let c = -halfCols; c <= halfCols; c++) pts.push(c, r);
      }
      dotCount = pts.length / 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
      const lp = [];
      lineSteps = 0;
      for (let x = -18; x <= w + 18; x += 18) lineSteps++;
      for (let band = 0; band < 5; band++) {
        for (let x = -18; x <= w + 18; x += 18) lp.push(x, band);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lp), gl.STATIC_DRAW);
    };

    const toPlane = (sx, sy) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const th = live.tilt;
      const F = 950;
      const v = sy - (h * 0.5 + th * h * 0.18);
      const z = (v * F) / (F * Math.cos(th) + v * Math.sin(th));
      const persp = F / Math.max(F - z * Math.sin(th), 120);
      return [(sx - w * 0.5) / persp, z];
    };
    const ripple = (sx, sy, strength = 1) => {
      const [x, y] = toPlane(sx, sy);
      ripples.set([x, y, state.time, strength], rippleIndex * 4);
      rippleIndex = (rippleIndex + 1) % MAX_RIPPLES;
    };

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const lineAlpha = (1 - smooth(0, 0.35, live.tilt)) * live.intensity;
      if (lineAlpha > 0.01) {
        gl.useProgram(lines);
        gl.uniform2f(lu.u_res, w, h);
        gl.uniform1f(lu.u_time, state.time);
        gl.uniform1f(lu.u_alpha, lineAlpha);
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
        const la = gl.getAttribLocation(lines, "a_line");
        gl.enableVertexAttribArray(la);
        gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
        for (let b = 0; b < 5; b++) gl.drawArrays(gl.LINE_STRIP, b * lineSteps, lineSteps);
        gl.disableVertexAttribArray(la);
      }

      gl.useProgram(dots);
      gl.uniform2f(du.u_res, w, h);
      gl.uniform1f(du.u_time, state.time);
      gl.uniform2f(du.u_mouse, state.mouse.active ? state.mouse.x : -9999, state.mouse.active ? state.mouse.y : -9999);
      gl.uniform1f(du.u_tilt, live.tilt);
      gl.uniform1f(du.u_intensity, live.intensity);
      gl.uniform1f(du.u_dpr, dpr);
      gl.uniform4fv(du.u_ripples, ripples);
      gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf);
      const da = gl.getAttribLocation(dots, "a_grid");
      gl.enableVertexAttribArray(da);
      gl.vertexAttribPointer(da, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, dotCount);
      gl.disableVertexAttribArray(da);

      if (logoState.scatter < 0.999 && !(reduceMotion && state.scroll > state.vh * 0.6)) {
        const L = logoLayout();
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(logo);
        gl.uniform2f(ou.u_res, w, h);
        gl.uniform2f(ou.u_center, L.x, L.y - (reduceMotion ? 0 : state.scroll * 0.35));
        gl.uniform1f(ou.u_scale, L.scale);
        gl.uniform1f(ou.u_time, state.time);
        gl.uniform1f(ou.u_assemble, logoState.assemble);
        gl.uniform1f(ou.u_scatter, logoState.scatter);
        gl.uniform1f(ou.u_level, reduceMotion ? 0 : 0.75 + 0.25 * Math.sin(state.time * 1.3) * Math.sin(state.time * 0.71));
        gl.uniform2f(ou.u_mouse, state.mouse.active ? state.mouse.x : -9999, state.mouse.active ? state.mouse.y : -9999);
        gl.uniform1f(ou.u_dpr, dpr);
        gl.uniform1f(ou.u_alpha, L.alpha * (reduceMotion ? 1 - clamp(state.scroll / (state.vh * 0.6)) : 1));
        gl.bindBuffer(gl.ARRAY_BUFFER, logoBuf);
        const attrs = [["a_home", 2, 0], ["a_color", 3, 2], ["a_meta", 3, 5]].map(([n, size, off]) => {
          const loc = gl.getAttribLocation(logo, n);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 32, off * 4);
          return loc;
        });
        gl.uniform1f(ou.u_bloom, 1);
        gl.drawArrays(gl.POINTS, 0, logoCount);
        gl.uniform1f(ou.u_bloom, 0);
        gl.drawArrays(gl.POINTS, 0, logoCount);
        attrs.forEach((loc) => gl.disableVertexAttribArray(loc));
      }
    };

    const logoLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w >= 1080) {
        const scale = Math.min(h * 0.36, w * 0.2);
        return { x: w * 0.8, y: h * 0.5, scale, alpha: 1 };
      }
      const scale = Math.min(w * 0.3, h * 0.17);
      return { x: w * 0.5 + scale * 0.05, y: Math.max(68 + scale * 1.1, h * 0.25), scale, alpha: 0.85 };
    };

    // section-driven intensity + tilt
    const sections = [...document.querySelectorAll("[data-field-intensity]")];
    const pickTarget = () => {
      const mid = state.vh * 0.5;
      let a = null;
      let b = null;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid) a = { s, r };
        else { b = { s, r }; break; }
      }
      if (!a) a = { s: sections[0], r: sections[0].getBoundingClientRect() };
      const ai = parseFloat(a.s.dataset.fieldIntensity);
      const at = parseFloat(a.s.dataset.fieldTilt);
      if (!b) { target.intensity = ai; target.tilt = at; return; }
      const bi = parseFloat(b.s.dataset.fieldIntensity);
      const bt = parseFloat(b.s.dataset.fieldTilt);
      // blend over the last 40% of the viewport before the next section reaches mid
      const k = smooth(mid + state.vh * 0.4, mid, b.r.top);
      target.intensity = lerp(ai, bi, k);
      target.tilt = lerp(at, bt, k);
      if (a.s.classList.contains("hero")) {
        const hp = clamp(-a.r.top / Math.max(1, a.r.height));
        target.tilt = Math.max(target.tilt, hp * 0.75);
      }
    };

    let lastAuto = 0;
    const update = (dt) => {
      pickTarget();
      const k = 1 - Math.exp(-dt * 3.2);
      live.intensity = lerp(live.intensity, target.intensity, k);
      live.tilt = lerp(live.tilt, target.tilt, k);
      if (!logoState.started && !document.body.classList.contains("is-loading")) logoState.started = true;
      if (logoState.started && logoState.assemble < 1) logoState.assemble = Math.min(1, logoState.assemble + dt / 2.6);
      logoState.scatter = reduceMotion ? 0 : clamp(state.scroll / (state.vh * 0.95));
      if (!reduceMotion && target.intensity > 0.8 && state.time - lastAuto > 4.2) {
        lastAuto = state.time;
        if (state.scroll < state.vh * 0.5 && logoState.assemble > 0.9) {
          const L = logoLayout();
          ripple(L.x - L.scale * 0.29, L.y - state.scroll * 0.35, 0.6);
        } else {
          ripple(state.vw * 0.5, state.vh * 0.52, 0.55);
        }
      }
      draw();
    };

    build();
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 140) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        build();
        if (reduceMotion) draw();
      }
    });
    window.addEventListener("pointerdown", (e) => {
      if (reduceMotion || e.target.closest("a, button, summary, input, .window")) return;
      ripple(e.clientX, e.clientY, 1);
    });
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
    canvas.addEventListener("webglcontextrestored", () => location.reload());
    return { update, draw };
  })();

  // ================================================================ FOLD SCENE
  const fold = (() => {
    const section = document.querySelector("[data-fold]");
    const canvas = document.querySelector("[data-fold-canvas]");
    if (!section || !canvas) return null;
    const ctx = canvas.getContext("2d");
    const steps = [...section.querySelectorAll("[data-fold-step]")];
    const numEl = section.querySelector("[data-fold-num]");
    const bar = section.querySelector("[data-fold-bar]");
    const matrixEl = section.querySelector(".matrix");
    const rowsEl = section.querySelector("[data-matrix]");

    // Sharur 9.1.6 → stereo matrix (downmix_renderer/matrix.py) and app node colours.
    const CH = [
      ["FL", 1, 0, "#c06d4e", -0.62, -0.78, 0],
      ["FR", 0, 1, "#c06d4e", 0.62, -0.78, 0],
      ["FC", 0.70710678, 0.70710678, "#bbb55a", 0, -1, 0],
      ["LFE", 2.26464431, 2.26464431, "#68c45d", 0, -0.6, 0],
      ["BL", 1, 0, "#bea54a", -0.78, 0.66, 0],
      ["BR", 0, 1, "#bea54a", 0.78, 0.66, 0],
      ["BLC", 1, 0, "#b99668", -0.3, 0.98, 0],
      ["BRC", 0, 1, "#b99668", 0.3, 0.98, 0],
      ["SL", 1, 0, "#5f7fa5", -1, 0.02, 0],
      ["SR", 0, 1, "#5f7fa5", 1, 0.02, 0],
      ["TFL", 1, 0, "#5daee9", -0.36, -0.4, 1],
      ["TFR", 0, 1, "#5daee9", 0.36, -0.4, 1],
      ["TSL", 1, 0, "#73afd0", -0.52, 0.02, 1],
      ["TSR", 0, 1, "#73afd0", 0.52, 0.02, 1],
      ["TBL", 1, 0, "#63a7dd", -0.36, 0.44, 1],
      ["TBR", 0, 1, "#63a7dd", 0.36, 0.44, 1],
    ].map(([name, l, r, color, x, y, height], i) => ({ name, l, r, color, x, y, height: !!height, i, rgb: hexRgb(color) }));

    const fmt = (v) => (v === 0 ? "0" : v === 1 ? "1.00" : v.toFixed(2));
    CH.forEach((ch) => {
      const row = document.createElement("div");
      row.className = "matrix__row";
      row.style.setProperty("--row-color", ch.color);
      row.innerHTML = `<span>${ch.name}</span><span class="${ch.l ? "" : "z"}">${fmt(ch.l)}</span><span class="${ch.r ? "" : "z"}">${fmt(ch.r)}</span>`;
      rowsEl.appendChild(row);
      ch.row = row;
    });

    // particles per link, count ∝ coefficient
    const particles = [];
    CH.forEach((ch) => {
      [["l", 0], ["r", 1]].forEach(([k, side]) => {
        const coef = ch[k];
        if (!coef) return;
        const n = Math.max(5, Math.round(coef * 10));
        for (let j = 0; j < n; j++) particles.push({ ch, side, seed: (j + Math.random() * 0.6) / n, speed: 0.22 + Math.random() * 0.12, size: 0.7 + Math.random() * 0.9 });
      });
    });

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    let progress = 0;
    let visible = false;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: "100px" }).observe(section);
    let activeStep = -1;
    let hot = -1;

    const level = (i, t) => clamp(0.5 + 0.28 * Math.sin(t * 1.7 + i * 1.3) + 0.18 * Math.sin(t * 5.3 + i * 2.1) + 0.06 * Math.sin(t * 13 + i));

    const draw = (t) => {
      const p = progress;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const wide = w > 640 && matrixEl && getComputedStyle(matrixEl).display !== "none";
      const cx = wide ? (w - 150) * 0.5 : w * 0.5;
      const R = Math.min((wide ? w - 170 : w) * 0.4, h * 0.3);
      const cy = h * 0.04 + R * 1.18;
      const appear = smooth(0, 0.14, p);
      const flow = smooth(0.26, 0.4, p) * (1 - smooth(0.86, 0.98, p) * 0.6);
      const collapse = easeInOut(smooth(0.64, 0.92, p));
      const outY = lerp(Math.min(h - 46, cy + R * 1.0 + 110), cy + R * 0.12, collapse);
      const spread = lerp(0.62, 0.78, collapse);
      const outs = [{ x: cx - R * spread, y: outY, label: "L" }, { x: cx + R * spread, y: outY, label: "R" }];
      const outGrow = smooth(0.3, 0.45, p) + collapse * 1.4;

      // room rings
      ctx.save();
      ctx.lineWidth = 1;
      const ringA = appear * (1 - collapse);
      [[1.12, 0.10], [0.62, 0.08], [0.26, 0.06]].forEach(([k, a], n) => {
        const sweep = smooth(n * 0.02, 0.12 + n * 0.02, p) * Math.PI * 2;
        ctx.strokeStyle = `rgba(255,255,255,${a * ringA})`;
        ctx.setLineDash(n === 1 ? [2, 5] : []);
        ctx.beginPath();
        ctx.arc(cx, cy, R * k * (1 - collapse * 0.3), -Math.PI / 2, -Math.PI / 2 + sweep);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // front marker
      ctx.fillStyle = `rgba(255,255,255,${0.35 * ringA})`;
      ctx.font = `500 10px "Geist Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("FRONT", cx, cy - R * 1.12 - 10);
      ctx.restore();

      // listener diamond
      const lis = 7 + Math.sin(t * 2) * 0.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.globalAlpha = appear * (1 - collapse);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(95,208,230,0.9)";
      ctx.shadowBlur = 18;
      ctx.fillRect(-lis, -lis, lis * 2, lis * 2);
      ctx.restore();

      // node positions
      const pos = CH.map((ch) => {
        const hx = cx + ch.x * R;
        const hy = cy + ch.y * R;
        const dest = ch.l && ch.r ? { x: cx, y: outY } : outs[ch.l ? 0 : 1];
        return { x: lerp(hx, dest.x, collapse), y: lerp(hy, dest.y, collapse) };
      });

      // hot channel cycles through the matrix while flowing
      const newHot = flow > 0.5 ? Math.floor(t * 3.2) % CH.length : -1;
      if (newHot !== hot) {
        if (hot >= 0) CH[hot].row.classList.remove("is-hot");
        if (newHot >= 0) CH[newHot].row.classList.add("is-hot");
        hot = newHot;
      }

      // wiring: one faint curve per matrix link, the hot channel brighter
      const curve = (a, b) => [lerp(cx, (a.x + b.x) / 2, 0.35), lerp(cy, b.y, 0.25)];
      if (flow > 0.01) {
        ctx.save();
        ctx.lineWidth = 1;
        CH.forEach((ch) => {
          [ch.l ? 0 : -1, ch.r ? 1 : -1].forEach((side) => {
            if (side < 0) return;
            const a = pos[ch.i];
            const b = outs[side];
            const [qx, qy] = curve(a, b);
            const [r, g, bl] = ch.rgb;
            ctx.strokeStyle = `rgba(${r},${g},${bl},${(ch.i === hot ? 0.34 : 0.07) * flow * (1 - collapse)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(qx, qy, b.x, b.y);
            ctx.stroke();
          });
        });
        ctx.restore();
      }

      // flow particles
      if (flow > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const pt of particles) {
          const ch = pt.ch;
          const a = pos[ch.i];
          const b = outs[pt.side];
          const u = (pt.seed + t * pt.speed) % 1;
          const [ctrlX, ctrlY] = curve(a, b);
          const iu = 1 - u;
          const x = iu * iu * a.x + 2 * iu * u * ctrlX + u * u * b.x;
          const y = iu * iu * a.y + 2 * iu * u * ctrlY + u * u * b.y;
          const boost = ch.i === hot ? 2.2 : 1;
          const alpha = Math.sin(Math.PI * u) * flow * 0.9 * Math.min(1.6, boost);
          const [r, g, bl] = ch.rgb;
          const mixK = smooth(0.6, 1, u);
          ctx.fillStyle = `rgba(${Math.round(lerp(r, 230, mixK))},${Math.round(lerp(g, 240, mixK))},${Math.round(lerp(bl, 255, mixK))},${alpha})`;
          const s = pt.size * (ch.name === "LFE" ? 1.5 : 1) * (boost > 1 ? 1.4 : 1);
          ctx.beginPath();
          ctx.arc(x, y, s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // nodes
      CH.forEach((ch, i) => {
        const a = smooth(0.02 + i * 0.008, 0.07 + i * 0.008, p) * (1 - collapse * 0.92);
        if (a <= 0.01) return;
        const { x, y } = pos[i];
        const lv = level(i, t);
        const base = (ch.height ? 11 : 15) * clamp(R / 200, 0.62, 1) * (1 - collapse * 0.5) * (0.6 + 0.4 * smooth(0.02 + i * 0.008, 0.07 + i * 0.008, p));
        const [r, g, b] = ch.rgb;
        ctx.save();
        ctx.globalAlpha = a;
        // glow
        const gr = ctx.createRadialGradient(x, y, 0, x, y, base * (2.2 + lv * 1.6));
        gr.addColorStop(0, `rgba(${r},${g},${b},${0.32 + lv * 0.25 + (i === hot ? 0.3 : 0)})`);
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(x, y, base * (2.2 + lv * 1.6), 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillStyle = `rgba(${Math.round(r * 0.28)},${Math.round(g * 0.28)},${Math.round(b * 0.28)},0.95)`;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + lv * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, base, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (ch.height) {
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.45)`;
          ctx.beginPath();
          ctx.arc(x, y, base + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = `rgba(255,255,255,${0.92 * (1 - collapse)})`;
        ctx.font = `600 ${(ch.height ? 8.5 : 9.5) * clamp(R / 200, 0.78, 1)}px "Geist Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ch.name, x, y + 0.5);
        ctx.restore();
      });

      // outputs
      const oa = smooth(0.24, 0.4, p);
      if (oa > 0.01) {
        outs.forEach((o, n) => {
          const lv = clamp(0.55 + 0.3 * Math.sin(t * 3.1 + n * 1.7) + 0.15 * Math.sin(t * 9.7 + n));
          const rad = 12 + Math.min(outGrow, 2.4) * 14;
          ctx.save();
          ctx.globalAlpha = oa;
          // pulse rings
          for (let k = 0; k < 3; k++) {
            const ph = (t * 0.6 + k / 3) % 1;
            ctx.strokeStyle = `rgba(95,208,230,${(1 - ph) * 0.35 * flow + (1 - ph) * 0.3 * collapse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(o.x, o.y, rad + ph * (30 + collapse * 40), 0, Math.PI * 2);
            ctx.stroke();
          }
          const gr = ctx.createRadialGradient(o.x, o.y - rad * 0.4, rad * 0.1, o.x, o.y, rad);
          gr.addColorStop(0, "#5fd0e6");
          gr.addColorStop(0.55, "#3b7fe0");
          gr.addColorStop(1, "#2c3fb8");
          ctx.shadowColor = "rgba(59,127,224,0.8)";
          ctx.shadowBlur = 30 + lv * 20;
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(o.x, o.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#fff";
          ctx.font = `600 ${Math.round(11 + Math.min(outGrow, 2.4) * 5)}px "Geist", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(o.label, o.x, o.y + 1);
          // level meter
          const mh = 6 + collapse * 4;
          const mw = rad * 2.2;
          const my = o.y + rad + 22 + collapse * 18;
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(o.x - mw / 2, my, mw, mh);
          const mg = ctx.createLinearGradient(o.x - mw / 2, 0, o.x + mw / 2, 0);
          mg.addColorStop(0, "#4a7cff");
          mg.addColorStop(0.7, "#67d5ff");
          mg.addColorStop(1, "#d8a548");
          ctx.fillStyle = mg;
          ctx.fillRect(o.x - mw / 2, my, mw * lv * Math.max(flow, collapse), mh);
          ctx.restore();
        });
      }
    };

    const update = (dt, t) => {
      const r = section.getBoundingClientRect();
      const total = Math.max(1, r.height - state.vh);
      const targetP = clamp(-r.top / total);
      progress = reduceMotion ? targetP : lerp(progress, targetP, 1 - Math.exp(-dt * 9));
      if (Math.abs(progress - targetP) < 0.0005) progress = targetP;
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      const step = progress < 0.3 ? 0 : progress < 0.64 ? 1 : 2;
      if (step !== activeStep) {
        steps.forEach((s, i) => {
          s.classList.toggle("is-active", i === step);
          s.classList.toggle("is-past", i < step);
          s.setAttribute("aria-hidden", String(i !== step));
        });
        numEl.textContent = `0${step + 1}`;
        activeStep = step;
      }
      matrixEl.classList.toggle("is-visible", progress > 0.22 && progress < 0.9);
      if (visible) draw(t);
    };
    return { update };
  })();

  // Samples the logo (see #logo symbol, 100-unit viewBox) into particles:
  // [homeX, homeY, r, g, b, size, seed, kind]; kind 0 = fill, 1 = rim, 2 = diamond.
  function buildLogoParticles() {
    const discs = [16, 29, 41];
    const R = 44;
    const CY = 50;
    const inside = (k, x, y) => x >= discs[k] - 0.01 && Math.hypot(x - discs[k], y - CY) <= R;
    const owner = (x, y) => { for (let k = 0; k < 3; k++) if (inside(k, x, y)) return k; return -1; };
    const inDiamond = (x, y, pad = 0) => Math.abs(x - 35.5) + Math.abs(y - 50.4) <= 7.4 + pad;
    const indigo = [0.17, 0.24, 0.71];
    const blue = [0.23, 0.5, 0.88];
    const cyan = [0.33, 0.78, 0.88];
    const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const colorAt = (x, y, k) => {
      const v = Math.abs(y - 46) / 44;
      const d = Math.hypot(x - (discs[k] + 16), y - 46) / 46;
      const t = clamp(v * 0.75 + d * 0.5);
      let c = t < 0.45 ? mix3(indigo, blue, t / 0.45) : mix3(blue, cyan, (t - 0.45) / 0.55);
      if (y > 62 && x < 40) c = mix3(c, [0.42, 0.82, 0.88], clamp((y - 62) / 30) * 0.5);
      const shade = [1, 0.84, 0.7][k];
      return c.map((n) => n * shade);
    };
    const out = [];
    let s = 1;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const push = (x, y, c, size, kind) => out.push((x - 50) / 50, (y - 50) / 50, c[0], c[1], c[2], size, rnd(), kind);

    const step = 1.3;
    for (let y = 6; y <= 94; y += step) {
      for (let x = 16; x <= 86; x += step) {
        const jx = x + (rnd() - 0.5) * step * 0.7;
        const jy = y + (rnd() - 0.5) * step * 0.7;
        const k = owner(jx, jy);
        if (k < 0 || inDiamond(jx, jy, 1.4)) continue;
        push(jx, jy, colorAt(jx, jy, k), 2.3 + rnd() * 1.1, 0);
      }
    }
    discs.forEach((cx, k) => {
      const n = 230;
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (Math.PI * i) / n;
        const x = cx + Math.cos(a) * R;
        const y = CY + Math.sin(a) * R;
        let hidden = false;
        for (let f = 0; f < k; f++) if (Math.hypot(x - discs[f], y - CY) < R - 0.6 && x >= discs[f]) hidden = true;
        if (hidden) continue;
        push(x, y, mix3(colorAt(x, y, k), [0.7, 0.93, 1], 0.45), 2.9, 1);
      }
    });
    for (let y = 6; y <= 94; y += 0.9) push(16, y, mix3(colorAt(16, y, 0), [0.7, 0.93, 1], 0.3), 2.7, 1);
    for (let y = 42; y <= 59; y += 0.85) {
      for (let x = 27; x <= 44; x += 0.85) {
        const jx = x + (rnd() - 0.5) * 0.6;
        const jy = y + (rnd() - 0.5) * 0.6;
        if (inDiamond(jx, jy, -0.3)) push(jx, jy, [0.95, 0.98, 1], 2.4 + rnd() * 0.8, 2);
      }
    }
    return new Float32Array(out);
  }

  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ================================================================ FILM
  // Scroll-driven tour of the real app. Clips are rendered from the Qt UI by
  // scripts/render_site_film.py; all loops share one 120 BPM groove clock.
  const film = (() => {
    const section = document.querySelector("[data-film]");
    if (!section) return null;
    const camera = section.querySelector("[data-film-camera]");
    const win = section.querySelector("[data-film-window]");
    const screen = section.querySelector("[data-film-screen]");
    const captions = [...section.querySelectorAll("[data-film-caption]")];
    const dots = [...section.querySelectorAll("[data-film-dots] li")];
    const cursor = section.querySelector("[data-film-cursor]");
    const click = section.querySelector("[data-film-click]");
    const focus = section.querySelector("[data-film-focus]");
    const soundBtn = section.querySelector("[data-film-sound]");
    const soundLabel = section.querySelector("[data-film-sound-label]");
    const clips = {};
    section.querySelectorAll("[data-clip]").forEach((el) => { clips[el.dataset.clip] = el; });
    const LOOP = 4;
    const PRESS_AT = 1.0;
    const GROOVE_IN = 1.15;

    let G = {
      route: [0.0167, 0.0927, 0.9667, 0.0756],
      render: [0.7992, 0.1037, 0.1333, 0.0537],
      status: [0.7652, 0.0317, 0.1606, 0.039],
      visualizer: [0.0167, 0.2195, 0.9667, 0.7537],
      stage: [0.2656, 0.2581, 0.4689, 0.6642],
      meter: [0.1321, 0.3106, 0.0818, 0.5592],
    };
    fetch("film/film.json").then((r) => r.json()).then((m) => { G = { ...G, ...m.geometry }; }).catch(() => {});
    const union = (a, b) => {
      const x = Math.min(a[0], b[0]);
      const y = Math.min(a[1], b[1]);
      return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y];
    };
    const pad = (r, px, py = px) => [r[0] - px, r[1] - py, r[2] + px * 2, r[3] + py * 2];

    // weight, clip, camera target, max zoom, focus ring
    const CH = [
      { w: 1.1, clip: "press", cam: () => [0, 0, 1, 1], zoom: 1, ring: false },
      { w: 1, clip: "press", cam: () => pad(G.route, 0.004, 0.03), zoom: 1.9, ring: true, box: [0.94, 0.3], at: [0.5, 0.3] },
      { w: 1.4, clip: "press", cam: () => pad(union(G.render, G.status), 0.03, 0.03), zoom: 2.3, ring: true },
      { w: 1, clip: "spatial-71", cam: () => pad(G.stage, 0.01), zoom: 1.6, ring: false },
      { w: 1, clip: "spatial-916", cam: () => [G.stage[0] + G.stage[2] * 0.06, G.stage[1] + G.stage[3] * 0.04, G.stage[2] * 0.88, G.stage[3] * 0.84], zoom: 2, ring: false },
      { w: 1, clip: "spatial-916", cam: () => pad(G.meter, 0.035, 0.03), zoom: 1.9, ring: true },
      { w: 1, clip: "channels-916", cam: () => pad(G.visualizer, -0.06, -0.12), zoom: 1.5, ring: false },
      { w: 1, clip: "advanced", cam: () => [0, 0, 1, 1], zoom: 1, ring: false },
    ];
    const total = CH.reduce((a, c) => a + c.w, 0);
    const starts = [];
    CH.reduce((a, c) => { starts.push(a / total); return a + c.w; }, 0);

    // ------------------------------------------------ loading
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const hi = window.innerWidth * Math.min(2, window.devicePixelRatio || 1) >= 1600;
      Object.entries(clips).forEach(([name, el]) => {
        if (el.tagName === "VIDEO") {
          el.src = `film/${name}${hi ? "" : "-1x"}.mp4`;
          el.preload = "auto";
          el.load();
        } else {
          el.src = `film/${name}.webp`;
        }
      });
    };
    new IntersectionObserver((e) => { if (e[0].isIntersecting) load(); }, { rootMargin: "150% 0px" }).observe(section);
    let visible = false;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(section);

    // ------------------------------------------------ layout
    let L = null;
    const layout = () => {
      const vw = state.vw;
      const vh = state.vh;
      const narrow = vw < 760;
      const bar = narrow ? 28 : 36;
      const aspect = 2640 / 1640;
      const maxH = vh * (narrow ? 0.5 : 0.7) - bar;
      const winW = Math.min(vw * (narrow ? 0.94 : 0.84), maxH * aspect, 1500);
      const sh = winW / aspect;
      win.style.width = `${winW}px`;
      win.style.setProperty("--bar", `${bar}px`);
      L = { vw, vh, narrow, bar, winW, sh, winH: sh + bar, box: narrow ? [vw * 0.92, vh * 0.44] : [vw * 0.6, vh * 0.62] };
    };
    layout();
    window.addEventListener("resize", layout);

    // camera in "world" terms: focus point (window px) + log scale
    const camFor = (i) => {
      const c = CH[i];
      const r = c.cam();
      const rx = r[0] * L.winW;
      const ry = L.bar + r[1] * L.sh;
      const rw = r[2] * L.winW;
      const rh = r[3] * L.sh;
      if (c.zoom === 1) {
        const s = Math.min(1, (L.vh * (L.narrow ? 0.5 : 0.66)) / L.winH);
        return { fx: L.winW / 2, fy: L.winH / 2, ls: Math.log(Math.max(s, 0.5)), cx: L.vw * 0.5, cy: L.vh * (L.narrow ? 0.33 : 0.4) };
      }
      const box = c.box && !L.narrow ? [L.vw * c.box[0], L.vh * c.box[1]] : L.box;
      const at = c.at && !L.narrow ? c.at : [L.narrow ? 0.5 : 0.62, L.narrow ? 0.33 : 0.44];
      const s = Math.min(c.zoom, box[0] / rw, box[1] / rh);
      // Zoomed shots sit right of centre so captions never cover the subject.
      return { fx: rx + rw / 2, fy: ry + rh / 2, ls: Math.log(s), cx: L.vw * at[0], cy: L.vh * at[1] };
    };
    const live = { fx: 0, fy: 0, ls: 0, cx: 0, cy: 0, tilt: 26, init: false };

    // ------------------------------------------------ clips + groove clock
    let current = null;
    let chapter = -1;
    let pressState = "idle"; // idle | playing | done
    let clock = 0;
    const show = (name) => {
      if (current === name) return;
      Object.entries(clips).forEach(([n, el]) => {
        const on = n === name;
        el.classList.toggle("is-on", on);
        if (el.tagName !== "VIDEO") return;
        if (on) {
          if (n !== "press") {
            try { el.currentTime = clock % LOOP; } catch (_) { /* not ready yet */ }
          }
          if (!reduceMotion && (n !== "press" || pressState === "playing")) el.play().catch(() => {});
        } else {
          setTimeout(() => { if (!el.classList.contains("is-on")) el.pause(); }, 700);
        }
      });
      current = name;
    };
    clips.press.addEventListener("ended", () => {
      if (pressState !== "playing") return;
      pressState = "done";
      clock = LOOP;
      if (chapter === 2) show("spatial-71");
    });
    const resetPress = () => {
      pressState = "idle";
      const v = clips.press;
      v.pause();
      try { v.currentTime = 0; } catch (_) { /* not ready */ }
    };
    const startPress = () => {
      if (reduceMotion) { pressState = "done"; clock = LOOP; return; }
      pressState = "playing";
      const v = clips.press;
      try { v.currentTime = 0; } catch (_) { /* not ready */ }
      v.play().catch(() => {});
    };

    const setChapter = (i) => {
      if (i === chapter) return;
      const prev = chapter;
      chapter = i;
      captions.forEach((c, n) => {
        c.classList.toggle("is-active", n === i);
        c.classList.toggle("is-past", n < i);
      });
      dots.forEach((d, n) => d.classList.toggle("is-active", n === i));
      if (i <= 1) {
        if (pressState !== "idle") resetPress();
        show("press");
      } else if (i === 2) {
        if (pressState === "idle" || prev < 2) startPress();
        show(pressState === "done" ? "spatial-71" : "press");
      } else {
        if (pressState === "idle") { pressState = "done"; clock = LOOP; }
        show(CH[i].clip);
      }
    };

    // ------------------------------------------------ sound (Web Audio groove, synced to the clock)
    const audio = (() => {
      let ctx = null;
      let master = null;
      let noise = null;
      let on = false;
      let lastStep = -1;
      const STEP = 0.125;
      const A = [220, 261.63, 329.63, 392, 493.88];
      const F = [174.61, 220, 261.63, 329.63, 392];
      const init = () => {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.ratio.value = 3;
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(comp).connect(ctx.destination);
        noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      };
      const env = (g, t, a, peak, dec) => {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
      };
      const out = (pan) => {
        const g = ctx.createGain();
        if (pan && ctx.createStereoPanner) {
          const p = ctx.createStereoPanner();
          p.pan.value = pan;
          g.connect(p).connect(master);
        } else g.connect(master);
        return g;
      };
      const kick = (t) => {
        const o = ctx.createOscillator();
        const g = out(0);
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
        env(g, t, 0.003, 0.9, 0.38);
        o.connect(g); o.start(t); o.stop(t + 0.45);
      };
      const hiss = (t, freq, type, peak, dec, pan) => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = type; f.frequency.value = freq; f.Q.value = type === "bandpass" ? 0.9 : 0.7;
        const g = out(pan);
        env(g, t, 0.002, peak, dec);
        s.connect(f).connect(g); s.start(t, Math.random() * 0.5); s.stop(t + dec + 0.05);
      };
      const tone = (t, freq, type, peak, a, dec, cutoff, pan) => {
        const o = ctx.createOscillator();
        o.type = type; o.frequency.value = freq;
        const f = ctx.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = cutoff;
        const g = out(pan);
        env(g, t, a, peak, dec);
        o.connect(f).connect(g); o.start(t); o.stop(t + a + dec + 0.05);
      };
      const step = (n, t) => {
        const bar = Math.floor(n / 16) % 2;
        const chord = bar ? F : A;
        if (n % 4 === 0) kick(t);
        if (n % 8 === 4) { hiss(t, 1600, "bandpass", 0.5, 0.16, 0.05); hiss(t + 0.012, 1100, "bandpass", 0.3, 0.12, -0.05); }
        if (n % 2 === 1) hiss(t, 8000, "highpass", n % 4 === 3 ? 0.16 : 0.09, 0.045, 0.25);
        if (n % 2 === 0) tone(t, chord[0] / 4 * (n % 8 === 6 ? 2 : 1), "sawtooth", 0.22, 0.004, 0.2, 420, 0);
        if (n % 16 === 0) chord.forEach((fq, k) => {
          tone(t, fq, "sawtooth", 0.035, 0.35, 1.8, 1300, (k - 2) * 0.3);
          tone(t, fq * 1.004, "triangle", 0.03, 0.4, 1.7, 2200, (2 - k) * 0.3);
        });
        if (n % 2 === 0 && n % 16 !== 0) tone(t, chord[(n / 2) % 5] * 2, "triangle", 0.05, 0.002, 0.18, 3000, (n % 4 ? 0.35 : -0.35));
      };
      const schedule = (grooveT, active) => {
        if (!on || !ctx) return;
        const ahead = 0.14;
        const from = Math.floor(grooveT / STEP);
        const to = Math.floor((grooveT + ahead) / STEP);
        for (let n = Math.max(from, lastStep + 1); n <= to; n++) {
          const at = n * STEP;
          if (at < grooveT - 0.01) continue;
          lastStep = n;
          if (!active(at)) continue;
          step(((n % 32) + 32) % 32, ctx.currentTime + Math.max(0, at - grooveT));
        }
      };
      const target = (v) => { if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.12); };
      return {
        toggle() {
          if (!ctx) init();
          on = !on;
          if (on) { ctx.resume(); lastStep = -1; target(0.5); } else target(0);
          return on;
        },
        get on() { return on; },
        schedule,
        resync() { lastStep = -1; },
        duck(v) { if (on) target(v ? 0.5 : 0); },
      };
    })();
    soundBtn.addEventListener("click", () => {
      const on = audio.toggle();
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.classList.toggle("is-on", on);
      soundLabel.textContent = on ? "Sound off" : "Sound on";
    });

    // ------------------------------------------------ frame
    let lastVisible = false;
    const update = (dt) => {
      if (!L) return;
      const r = section.getBoundingClientRect();
      const span = Math.max(1, r.height - state.vh);
      const p = clamp(-r.top / span);
      let i = 0;
      while (i < CH.length - 1 && p >= starts[i + 1]) i++;
      const segEnd = i < CH.length - 1 ? starts[i + 1] : 1;
      const u = clamp((p - starts[i]) / Math.max(0.0001, segEnd - starts[i]));
      setChapter(i);
      if (visible !== lastVisible) { audio.duck(visible); lastVisible = visible; }
      if (!visible) return;

      // clock: follows the press clip while it plays, otherwise free-runs
      if (pressState === "playing") clock = clips.press.currentTime || 0;
      else if (pressState === "done" && !reduceMotion) clock += dt;
      const active = clips[current];
      if (active && active.tagName === "VIDEO" && current !== "press" && active.readyState >= 2 && !reduceMotion) {
        const want = clock % LOOP;
        let diff = Math.abs(active.currentTime - want);
        diff = Math.min(diff, LOOP - diff);
        if (diff > 0.15) { try { active.currentTime = want; } catch (_) { /* seeking */ } }
        if (active.paused) active.play().catch(() => {});
      }
      if (pressState !== "idle") {
        audio.schedule(clock, (at) => pressState === "done" || at >= GROOVE_IN);
      }

      // camera: blend toward the next chapter over the last 40% of this one
      const a = camFor(i);
      const b = camFor(Math.min(CH.length - 1, i + 1));
      const k = i < CH.length - 1 ? easeInOut(smooth(0.6, 1, u)) : 0;
      const tgt = { fx: lerp(a.fx, b.fx, k), fy: lerp(a.fy, b.fy, k), ls: lerp(a.ls, b.ls, k), cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k) };
      const introTilt = i === 0 ? (1 - easeInOut(clamp(u / 0.55))) * 26 : 0;
      if (!live.init || reduceMotion) { Object.assign(live, tgt, { tilt: introTilt, init: true }); }
      const sm = 1 - Math.exp(-dt * 5.5);
      live.fx = lerp(live.fx, tgt.fx, sm);
      live.fy = lerp(live.fy, tgt.fy, sm);
      live.ls = lerp(live.ls, tgt.ls, sm);
      live.cx = lerp(live.cx, tgt.cx, sm);
      live.cy = lerp(live.cy, tgt.cy, sm);
      live.tilt = lerp(live.tilt, introTilt, sm);
      const s = Math.exp(live.ls);
      const tx = live.cx - live.fx * s;
      const ty = live.cy - live.fy * s;
      camera.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      win.style.transform = `rotateX(${live.tilt.toFixed(2)}deg) scale(${(1 - live.tilt / 220).toFixed(4)})`;
      win.style.setProperty("--glow", (0.35 + (1 - live.tilt / 26) * 0.4).toFixed(3));

      // focus ring around the framed control
      const ring = CH[i].ring && u > 0.12 && u < 0.62;
      if (ring) {
        const fr = CH[i].cam();
        const inset = i === 2 ? G.render : i === 1 ? G.route : G.meter;
        focus.style.left = `${inset[0] * 100}%`;
        focus.style.top = `${inset[1] * 100}%`;
        focus.style.width = `${inset[2] * 100}%`;
        focus.style.height = `${inset[3] * 100}%`;
        void fr;
      }
      focus.classList.toggle("is-on", ring && !(i === 2 && pressState === "playing"));

      // cursor + click during the Render press
      const tc = pressState === "playing" ? clips.press.currentTime : -1;
      const showCursor = tc >= 0 && tc < 2.1 && !reduceMotion;
      cursor.classList.toggle("is-on", showCursor);
      if (showCursor) {
        const tgtX = G.render[0] + G.render[2] * 0.42;
        const tgtY = G.render[1] + G.render[3] * 0.6;
        const m = easeInOut(clamp((tc - 0.1) / 0.8));
        const x = lerp(0.62, tgtX, m);
        const y = lerp(0.46, tgtY, m);
        const press = tc > PRESS_AT - 0.05 && tc < PRESS_AT + 0.14 ? 0.86 : 1;
        cursor.style.left = `${x * 100}%`;
        cursor.style.top = `${y * 100}%`;
        cursor.style.transform = `scale(${press})`;
        click.style.left = `${tgtX * 100}%`;
        click.style.top = `${tgtY * 100}%`;
      }
      click.classList.toggle("is-on", tc >= PRESS_AT && tc < PRESS_AT + 0.6);
    };
    return { update };
  })();

  // ================================================================ hero HUD meters
  const hud = (() => {
    const el = document.querySelector("[data-hud]");
    if (!el) return null;
    const bars = Array.from({ length: 16 }, (_, i) => {
      const b = document.createElement("i");
      if (i >= 10) b.classList.add("is-h");
      el.appendChild(b);
      return b;
    });
    const held = new Float32Array(16);
    return (t) => {
      if (state.scroll > state.vh) return;
      bars.forEach((b, i) => {
        const base = i === 3 ? 0.8 : i < 3 ? 0.7 : i < 10 ? 0.5 : 0.36;
        const v = clamp(base * (0.62 + 0.24 * Math.sin(t * 2.1 + i * 1.7) + 0.14 * Math.sin(t * 7.3 + i * 2.9)), 0.05, 1);
        held[i] = v > held[i] ? v : held[i] * 0.93 + v * 0.07;
        b.style.transform = `scaleY(${held[i].toFixed(3)})`;
      });
    };
  })();

  // ================================================================ loop
  window.addEventListener("scroll", () => { state.scroll = window.scrollY; }, { passive: true });
  window.addEventListener("resize", () => {
    state.vw = window.innerWidth;
    state.vh = window.innerHeight;
  });

  let last = performance.now();
  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduceMotion) state.time += dt * 0.95;
    updateNav();
    updateChain();
    if (hud) hud(state.time);
    if (film) film.update(dt);
    if (fold) fold.update(reduceMotion ? 1 : dt, state.time);
    if (field) field.update(reduceMotion ? 1 : dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
