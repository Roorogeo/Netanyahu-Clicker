// The clickable 3D campaign coin: photo on the front, the flag on the back,
// gold rim, and a shower of 3D ballots on every click.
import * as THREE from "three";
import { RoomEnvironment } from "../vendor/three/addons/RoomEnvironment.js";
import { drawFlag, drawPrideFlag, drawStarOfDavid, PRIDE_COLORS } from "./models.js";

const TAU = Math.PI * 2;

function drawRingText(ctx, text, cx, cy, r, font, color) {
  const colorAt = typeof color === "function" ? color : () => color;
  ctx.save();
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const chars = [...text];
  const step = TAU / chars.length;
  chars.forEach((ch, i) => {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = colorAt(i, chars.length);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function frontCanvas(photo, theme = "light") {
  const S = 1024, c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  if (theme === "pride") { g.addColorStop(0, "#2a1a5e"); g.addColorStop(1, "#150b33"); }
  else { g.addColorStop(0, "#0a47d6"); g.addColorStop(1, "#00248a"); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const ringColor = theme === "pride"
    ? (i, n) => `hsl(${Math.round((i / n) * 360)}, 95%, 62%)`
    : "#ffffff";
  drawRingText(ctx, "★ VOTE BIBI ★ VOTE BIBI ★ VOTE BIBI ", S / 2, S / 2, S * 0.43, "900 64px Rubik, Arial Black, sans-serif", ringColor);
  // photo disc
  ctx.save();
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.36, 0, TAU); ctx.closePath();
  ctx.fillStyle = "#e8eefc"; ctx.fill();
  ctx.clip();
  if (photo) {
    ctx.drawImage(photo, S / 2 - S * 0.36, S / 2 - S * 0.36, S * 0.72, S * 0.72);
  } else {
    drawStarOfDavid(ctx, S / 2, S / 2, S * 0.22, 26, "#0038b8");
  }
  ctx.restore();
  if (theme === "pride") {
    PRIDE_COLORS.forEach((col, i) => {
      ctx.lineWidth = 9; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.36 + 4 + (i - 2.5) * 8, 0, TAU); ctx.stroke();
    });
  } else {
    ctx.lineWidth = 14; ctx.strokeStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.36, 0, TAU); ctx.stroke();
  }
  return c;
}

function backCanvas(theme = "light") {
  const S = 1024, c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  if (theme === "pride") {
    drawPrideFlag(ctx, S, S);
    ctx.fillStyle = "#ffffff"; ctx.font = "900 78px Rubik, Arial Black, sans-serif"; ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 10;
    ctx.fillText("PRIDE", S / 2, S * 0.9);
    return c;
  }
  ctx.save(); ctx.translate(0, S * 0.14); drawFlag(ctx, S, S * 0.727); ctx.restore();
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, S, S * 0.14); ctx.fillRect(0, S * 0.86, S, S * 0.14);
  ctx.fillStyle = "#0038b8"; ctx.font = "900 70px Rubik, Arial Black, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("ISRAEL", S / 2, S * 0.92);
  return c;
}

function ballotTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 160;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fbfaf4"; ctx.fillRect(0, 0, 128, 160);
  ctx.strokeStyle = "#0038b8"; ctx.lineWidth = 6; ctx.strokeRect(6, 6, 116, 148);
  ctx.lineWidth = 12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(36, 56); ctx.lineTo(92, 112); ctx.moveTo(92, 56); ctx.lineTo(36, 112); ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.35, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createBadge(canvas, { photoUrl }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899cc, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 5); scene.add(key);
  const rimL = new THREE.DirectionalLight(0x9fbaff, 1.2); rimL.position.set(-4, -1, 2); scene.add(rimL);

  // ---- coin ----
  const R = 1, T = 0.17;
  const coin = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: "#f2b705", metalness: 1, roughness: 0.28, emissive: "#000000" });
  const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 96, 1, true), gold);
  side.rotation.x = Math.PI / 2;
  coin.add(side);
  for (const z of [T / 2, -T / 2]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.055, 20, 96), gold);
    rim.position.z = z;
    coin.add(rim);
  }
  const frontTex = new THREE.CanvasTexture(frontCanvas(null));
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.CircleGeometry(R - 0.05, 96),
    new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.42, metalness: 0.05 }));
  face.position.z = T / 2 + 0.001;
  coin.add(face);
  const backTex = new THREE.CanvasTexture(backCanvas());
  backTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.CircleGeometry(R - 0.05, 96),
    new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 }));
  back.position.z = -T / 2 - 0.001;
  back.rotation.y = Math.PI;
  coin.add(back);
  // glossy dome over the face, like a pin-back campaign button
  const gloss = new THREE.Mesh(new THREE.SphereGeometry(R - 0.05, 64, 16, 0, TAU, 0, 0.35),
    new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.12, roughness: 0.05, clearcoat: 1, transmission: 0 }));
  gloss.rotation.x = Math.PI / 2;
  gloss.position.z = T / 2 - (R - 0.05) * Math.cos(0.35) + 0.01;
  gloss.scale.z = 0.35;
  coin.add(gloss);
  scene.add(coin);

  let photoOk = false, photoImg = null, theme = "light";
  if (photoUrl) {
    const img = new Image();
    img.onload = () => {
      photoImg = img;
      frontTex.image = frontCanvas(img, theme);
      frontTex.needsUpdate = true;
      photoOk = true;
    };
    img.src = photoUrl;
  }

  // ---- halo ----
  const haloMat = new THREE.SpriteMaterial({ map: haloTexture(), color: "#7fa6ff", transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.setScalar(2.5);
  halo.position.z = -0.6;
  scene.add(halo);

  // ---- ballot particles ----
  const MAX = 220;
  const pGeo = new THREE.BoxGeometry(0.17, 0.215, 0.008);
  const pMat = new THREE.MeshStandardMaterial({ map: ballotTexture(), roughness: 0.75 });
  const parts = new THREE.InstancedMesh(pGeo, pMat, MAX);
  parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  parts.frustumCulled = false;
  scene.add(parts);
  const P = Array.from({ length: MAX }, () => ({ life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() }));
  let nextP = 0;
  const dummy = new THREE.Object3D();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < MAX; i++) parts.setMatrixAt(i, zero);

  function spawn(n, at) {
    for (let k = 0; k < n; k++) {
      const q = P[nextP];
      nextP = (nextP + 1) % MAX;
      const a = Math.random() * TAU, rr = Math.random() * 0.8;
      q.p.set(at ? at.x : Math.cos(a) * rr, at ? at.y : Math.sin(a) * rr, 0.25);
      const dir = Math.random() * TAU;
      const speed = 1.4 + Math.random() * 1.8;
      q.v.set(Math.cos(dir) * speed, 1.6 + Math.random() * 2.4, 1.2 + Math.random() * 1.6);
      q.r.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
      q.w.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      q.max = q.life = 1.3 + Math.random() * 0.6;
    }
  }

  // ---- interaction state ----
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let spinAngle = 0, spinVel = 0, squash = 0, rally = false, flash = 0;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
    tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.55;
  });
  canvas.addEventListener("pointerleave", () => { tilt.tx = 0; tilt.ty = 0; });

  const ray = new THREE.Raycaster();
  function hit(clientX, clientY, count = 4) {
    squash = 1;
    flash = 1;
    spinVel += (Math.random() < 0.12 ? 18 : 2.2) * (Math.random() < 0.5 ? -1 : 1);
    let at = null;
    if (clientX !== undefined) {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), camera);
      const hitP = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Vector3());
      if (hitP && hitP.length() < 1.3) at = hitP;
    }
    spawn(Math.min(count, 14), at);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the coin a constant fraction of the smaller side
    const fit = 2.75 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.z = camera.aspect < 1 ? fit / camera.aspect : fit;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let last = performance.now(), t = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 6);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 6);
    // spin decays, then settles back to face front
    spinAngle += spinVel * dt;
    spinVel *= Math.pow(0.12, dt);
    if (Math.abs(spinVel) < 1.2) {
      const targetA = Math.round(spinAngle / TAU) * TAU;
      spinAngle += (targetA - spinAngle) * Math.min(1, dt * 5);
    }
    squash = Math.max(0, squash - dt * 6);
    flash = Math.max(0, flash - dt * 3);

    coin.rotation.set(tilt.x + Math.sin(t * 0.9) * 0.05, tilt.y + spinAngle + Math.sin(t * 0.6) * 0.18, Math.sin(t * 0.5) * 0.03);
    const s = 1 - Math.sin(squash * Math.PI) * 0.07;
    coin.scale.set(s, s, 1 + squash * 0.25);
    coin.position.y = Math.sin(t * 1.3) * 0.05;

    gold.emissive.setRGB(rally ? 0.35 + Math.sin(t * 10) * 0.15 : flash * 0.2, rally ? 0.2 : flash * 0.12, 0);
    if (rally) haloMat.color.set("#ffcf3f");
    else if (theme === "pride") haloMat.color.setHSL((t * 0.12) % 1, 0.95, 0.62);
    else haloMat.color.set(theme === "dark" ? "#4f7dff" : "#7fa6ff");
    haloMat.opacity = (rally ? 0.7 : 0.35) + Math.sin(t * 2) * 0.05 + flash * 0.2;
    halo.scale.setScalar((rally ? 2.7 : 2.45) + Math.sin(t * 2) * 0.05 + flash * 0.12);
    if (rally && Math.random() < dt * 14) spawn(1);

    for (let i = 0; i < MAX; i++) {
      const q = P[i];
      if (q.life <= 0) continue;
      q.life -= dt;
      if (q.life <= 0) { parts.setMatrixAt(i, zero); continue; }
      q.v.y -= 6.5 * dt;
      q.v.multiplyScalar(Math.pow(0.6, dt));
      q.p.addScaledVector(q.v, dt);
      q.r.x += q.w.x * dt; q.r.y += q.w.y * dt; q.r.z += q.w.z * dt;
      dummy.position.copy(q.p);
      dummy.rotation.copy(q.r);
      dummy.scale.setScalar(Math.min(1, q.life / 0.3) * Math.min(1, (q.max - q.life) / 0.08 + 0.2));
      dummy.updateMatrix();
      parts.setMatrixAt(i, dummy.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  return {
    hit,
    burst(n) { spawn(n); },
    setRally(on) { rally = on; },
    setTheme(th) {
      theme = th;
      frontTex.image = frontCanvas(photoImg, th);
      frontTex.needsUpdate = true;
      backTex.image = backCanvas(th);
      backTex.needsUpdate = true;
    },
    get photoLoaded() { return photoOk; },
    resize,
  };
}
