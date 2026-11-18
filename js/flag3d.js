// Full-screen waving Israeli flag rendered behind the whole game.
import * as THREE from "three";
import { drawThemeFlag } from "./models.js";

export function createFlagBackground(canvas, { animate = true, theme = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dfe7f7");
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  const W = 4.4, H = 3.2;
  const c = document.createElement("canvas");
  c.width = 1600; c.height = Math.round(1600 * (H / W));
  function paint(flagSpec) {
    const ctx = c.getContext("2d");
    ctx.globalAlpha = 1;
    drawThemeFlag(ctx, c.width, c.height, flagSpec);
    // subtle fabric weave
    ctx.globalAlpha = 0.035;
    for (let y = 0; y < c.height; y += 3) { ctx.fillStyle = y % 6 ? "#000" : "#fff"; ctx.fillRect(0, y, c.width, 1); }
    ctx.globalAlpha = 1;
  }
  paint(theme && theme.flag);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const geom = new THREE.PlaneGeometry(W, H, 90, 64);
  const base = Float32Array.from(geom.attributes.position.array);
  const flag = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, side: THREE.DoubleSide }));
  scene.add(flag);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-3, 4, 5);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.8);
  fill.position.set(4, -2, 3);
  scene.add(fill);

  // th: a theme object from themes.js
  function setTheme(th) {
    if (!th) return;
    const L = th.bg;
    paint(th.flag);
    tex.needsUpdate = true;
    scene.background.set(L.color);
    ambient.intensity = L.amb;
    sun.intensity = L.sun;
    sun.color.set(L.sunC);
    fill.intensity = L.fill;
    renderer.toneMappingExposure = L.exp;
    if (!running) renderOnce();
  }

  function wave(t) {
    const pos = geom.attributes.position;
    const a = pos.array;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const free = (x + W / 2) / W; // 0 at the "pole" side, 1 at the free edge
      const amp = 0.05 + free * 0.16;
      a[i * 3 + 2] = amp * (Math.sin(x * 2.1 - t * 1.6) + 0.45 * Math.sin(x * 3.7 + y * 1.8 - t * 2.3))
        + 0.03 * Math.sin(y * 2.5 + t * 0.9);
      a[i * 3 + 1] = y - free * free * 0.04 * (1 + Math.sin(t * 0.7));
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // Close enough that the flag (minus its waving edges) always covers the screen
    const d = Math.min((H * 0.42) / tan, (W * 0.42) / (tan * camera.aspect));
    camera.position.set(0, 0, d);
    camera.updateProjectionMatrix();
    if (!running) renderOnce();
  }

  let running = false, raf = 0, last = 0, t = 0, frameMs = 33;
  function renderOnce() { wave(t); renderer.render(scene, camera); }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < frameMs) return; // a background doesn't need a high frame rate
    t += Math.min((now - last) / 1000, 0.1);
    last = now;
    renderOnce();
  }
  function setAnimate(on) {
    if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    if (!on && running) { running = false; cancelAnimationFrame(raf); renderOnce(); }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (running) { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  window.addEventListener("resize", resize);
  resize();
  setAnimate(animate);
  setTheme(theme);
  // Quality: high = 30 fps, medium = 20 fps at lower resolution, low = still image
  let wanted = animate;
  function setQuality(name) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, name === "high" ? 1.5 : name === "medium" ? 1 : 0.75));
    frameMs = name === "high" ? 33 : 50;
    resize();
    setAnimate(wanted && name !== "low");
  }
  return { setAnimate(on) { wanted = on; setAnimate(on); }, resize, setTheme, setQuality };
}
